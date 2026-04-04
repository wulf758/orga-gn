import { cookies } from "next/headers";

import { AppData, MembershipRole, WorkspaceAccessMode } from "@/lib/types";
import {
  archiveWorkspace,
  createSession,
  createWorkspace,
  deleteGameMembership,
  getProfileById,
  getGameMembership,
  deleteWorkspace,
  deleteSession,
  listGameMemberships,
  listProfiles,
  listUserMemberships,
  getSession,
  getWorkspaceById,
  listWorkspaces,
  parseWorkspace,
  renameWorkspace,
  restoreWorkspace,
  toWorkspaceSummary,
  upsertGameMembership,
  upsertProfile,
  updateWorkspaceData,
  workspaceNameExists
} from "@/lib/server/db";
import {
  createSessionToken,
  hashPassword,
  hashSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_SECONDS
} from "@/lib/server/auth";
import {
  AuthenticatedUser,
  canWriteWorkspace,
  isSuperAdminUser
} from "@/lib/server/supabase-auth";

function sessionExpiryDate() {
  return new Date(Date.now() + SESSION_DURATION_SECONDS * 1000);
}

export function clearWorkspaceSessionByToken(currentToken?: string | null) {
  if (currentToken) {
    void deleteSession(hashSessionToken(currentToken));
  }
}

export async function getCurrentWorkspaceContext() {
  const cookieStore = await cookies();
  const currentToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!currentToken) {
    return null;
  }

  const session = await getSession(hashSessionToken(currentToken));

  if (!session) {
    return null;
  }

  const workspace = await getWorkspaceById(session.workspace_id);

  if (!workspace) {
    return null;
  }

  if (workspace.archived_at) {
    return null;
  }

  return {
    session,
    workspace,
    accessMode: "legacy-password" as WorkspaceAccessMode,
    membershipRole: null,
    summary: toWorkspaceSummary(workspace),
    data: sanitizeAppDataForRole(
      {
        ...parseWorkspace(workspace),
        gameName: workspace.name
      },
      null
    )
  };
}

async function resolveWorkspaceRoleForUser(workspaceId: string, userId?: string | null) {
  if (!userId) {
    return null;
  }

  const membership = await getGameMembership(workspaceId, userId);
  return membership?.role ?? null;
}

function sanitizeAppDataForRole(data: AppData, role?: MembershipRole | null) {
  if (role !== "lecture") {
    return data;
  }

  return {
    ...data,
    characters: data.characters.map((character) => ({
      ...character,
      playerNotes: ""
    }))
  };
}

async function requireCurrentWorkspaceAdmin(userId?: string | null) {
  const current = await getCurrentWorkspaceContext();

  if (!current) {
    return { ok: false as const, error: "Session invalide." };
  }

  if (!userId) {
    return { ok: false as const, error: "Connexion utilisateur requise." };
  }

  const membership = await getGameMembership(current.workspace.id, userId);

  if (!membership || membership.role !== "admin") {
    return {
      ok: false as const,
      error: "Seuls les admins du GN peuvent gerer les membres."
    };
  }

  return {
    ok: true as const,
    current,
    membership
  };
}

export async function listWorkspaceOverview() {
  const current = await getCurrentWorkspaceContext();
  const games = await listWorkspaces();

  return {
    games: games.map(toWorkspaceSummary),
    currentGame: current?.summary ?? null
  };
}

export async function listWorkspaceOverviewForUser(userId?: string | null) {
  return listWorkspaceOverviewForAccount(userId ? { id: userId, email: null, displayName: null } : null);
}

export async function listWorkspaceOverviewForAccount(user?: AuthenticatedUser | null) {
  if (!user) {
    return {
      games: [],
      currentGame: null
    };
  }

  const [current, memberships, games] = await Promise.all([
    getCurrentWorkspaceContext(),
    listUserMemberships(user.id),
    listWorkspaces()
  ]);
  const superAdmin = isSuperAdminUser(user);
  const allowedIds = new Set(memberships.map((membership) => membership.gameId));
  const membershipMap = new Map(memberships.map((membership) => [membership.gameId, membership.role] as const));
  const allowedGames = superAdmin
    ? games
    : games.filter((game) => allowedIds.has(game.id) && !game.archived_at);
  const currentIsAllowed = current
    ? superAdmin || (allowedIds.has(current.workspace.id) && !current.workspace.archived_at)
    : false;

  return {
    games: allowedGames.map((game) => ({
      ...toWorkspaceSummary(game),
      role: membershipMap.get(game.id) ?? null
    })),
    currentGame: currentIsAllowed ? current?.summary ?? null : null
  };
}

async function requireWorkspaceAdminForGame(workspaceId: string, userId?: string | null) {
  if (!userId) {
    return { ok: false as const, error: "Connexion utilisateur requise." };
  }

  const workspace = await getWorkspaceById(workspaceId);

  if (!workspace) {
    return { ok: false as const, error: "GN introuvable." };
  }

  const membership = await getGameMembership(workspace.id, userId);

  if (!membership || membership.role !== "admin") {
    return {
      ok: false as const,
      error: "Seuls les admins du GN peuvent gerer cet espace."
    };
  }

  return {
    ok: true as const,
    workspace,
    membership
  };
}

export async function createWorkspaceWithAccess(input: {
  name: string;
  creator?: {
    id: string;
    email?: string | null;
    displayName?: string | null;
  } | null;
}) {
  const creator = input.creator ?? null;

  if (!creator) {
    return { ok: false as const, error: "Connexion utilisateur requise pour creer un GN." };
  }

  const name = input.name.trim();

  if (!name) {
    return { ok: false as const, error: "Le nom du GN est requis." };
  }

  if (await workspaceNameExists(name)) {
    return { ok: false as const, error: "Un GN avec ce nom existe deja." };
  }

  const workspaceId = `game-${crypto.randomUUID()}`;
  const workspace = await createWorkspace({
    id: workspaceId,
    name,
    passwordHash: hashPassword(createSessionToken())
  });

  if (!workspace) {
    return { ok: false as const, error: "Creation impossible." };
  }

  if (creator) {
    await upsertProfile({
      id: creator.id,
      displayName: creator.displayName ?? creator.email ?? null
    });
    await upsertGameMembership({
      gameId: workspace.id,
      userId: creator.id,
      role: "admin"
    });
  }

  const token = createSessionToken();
  await createSession(workspaceId, hashSessionToken(token), sessionExpiryDate().toISOString());

  return {
    ok: true as const,
    sessionToken: token,
    game: toWorkspaceSummary(workspace),
    data: sanitizeAppDataForRole(
      {
        ...parseWorkspace(workspace),
        gameName: workspace.name
      },
      null
    ),
    access: {
      mode: "membership" as WorkspaceAccessMode,
      role: "admin" as MembershipRole
    }
  };
}

export async function openWorkspaceWithPassword(input: {
  id: string;
  userId?: string | null;
}) {
  const workspace = await getWorkspaceById(input.id);

  if (!workspace) {
    return { ok: false as const, error: "GN introuvable." };
  }

  if (workspace.archived_at) {
    return { ok: false as const, error: "Ce GN est archive et n'est pas accessible." };
  }

  const membership = input.userId ? await getGameMembership(workspace.id, input.userId) : null;

  if (!membership) {
    return { ok: false as const, error: "Ce GN n'est pas accessible avec ton compte." };
  }

  const token = createSessionToken();
  await createSession(workspace.id, hashSessionToken(token), sessionExpiryDate().toISOString());

  return {
    ok: true as const,
    sessionToken: token,
    game: toWorkspaceSummary(workspace),
    data: sanitizeAppDataForRole(
      {
        ...parseWorkspace(workspace),
        gameName: workspace.name
      },
      membership?.role ?? null
    ),
    access: {
      mode: "membership" as WorkspaceAccessMode,
      role: membership?.role ?? null
    }
  };
}

export async function saveCurrentWorkspace(data: AppData) {
  return saveCurrentWorkspaceForUser(data, null);
}

export async function saveCurrentWorkspaceForUser(data: AppData, userId?: string | null) {
  const current = await getCurrentWorkspaceContext();

  if (!current) {
    return { ok: false as const, error: "Session invalide." };
  }

  const membershipRole = await resolveWorkspaceRoleForUser(current.workspace.id, userId);

  if (membershipRole && !canWriteWorkspace(membershipRole)) {
    return {
      ok: false as const,
      error: "Cet espace est ouvert en lecture seule pour ton compte."
    };
  }

  const updated = await updateWorkspaceData(current.workspace.id, data);

  if (!updated) {
    return { ok: false as const, error: "Espace introuvable." };
  }

  return {
    ok: true as const,
    game: toWorkspaceSummary(updated),
    data: sanitizeAppDataForRole(
      {
        ...parseWorkspace(updated),
        gameName: updated.name
      },
      membershipRole
    )
  };
}

export async function renameCurrentWorkspace(nextName: string) {
  return renameCurrentWorkspaceForUser(nextName, null);
}

export async function renameCurrentWorkspaceForUser(
  nextName: string,
  userId?: string | null
) {
  const current = await getCurrentWorkspaceContext();

  if (!current) {
    return { ok: false as const, error: "Session invalide." };
  }

  const membershipRole = await resolveWorkspaceRoleForUser(current.workspace.id, userId);

  if (membershipRole && !canWriteWorkspace(membershipRole)) {
    return {
      ok: false as const,
      error: "Cet espace est ouvert en lecture seule pour ton compte."
    };
  }

  const trimmedName = nextName.trim();

  if (!trimmedName) {
    return { ok: false as const, error: "Le nom du GN est requis." };
  }

  if (await workspaceNameExists(trimmedName, current.workspace.id)) {
    return { ok: false as const, error: "Un GN avec ce nom existe deja." };
  }

  const updated = await renameWorkspace(current.workspace.id, trimmedName);

  if (!updated) {
    return { ok: false as const, error: "Espace introuvable." };
  }

  return {
    ok: true as const,
    game: toWorkspaceSummary(updated),
    data: sanitizeAppDataForRole(
      {
        ...parseWorkspace(updated),
        gameName: updated.name
      },
      membershipRole
    )
  };
}

export async function renameWorkspaceByIdForUser(input: {
  workspaceId: string;
  nextName: string;
  userId?: string | null;
}) {
  const admin = await requireWorkspaceAdminForGame(input.workspaceId, input.userId);

  if (!admin.ok) {
    return admin;
  }

  const trimmedName = input.nextName.trim();

  if (!trimmedName) {
    return { ok: false as const, error: "Le nom du GN est requis." };
  }

  if (await workspaceNameExists(trimmedName, admin.workspace.id)) {
    return { ok: false as const, error: "Un GN avec ce nom existe deja." };
  }

  const updated = await renameWorkspace(admin.workspace.id, trimmedName);

  if (!updated) {
    return { ok: false as const, error: "Renommage impossible." };
  }

  return {
    ok: true as const,
    game: toWorkspaceSummary(updated)
  };
}

export async function getCurrentWorkspaceData() {
  return getCurrentWorkspaceDataForUser(null);
}

export async function getCurrentWorkspaceDataForUser(userId?: string | null) {
  const current = await getCurrentWorkspaceContext();

  if (!current) {
    return null;
  }

  const membershipRole = await resolveWorkspaceRoleForUser(current.workspace.id, userId);

  return {
    game: current.summary,
    data: sanitizeAppDataForRole(current.data, membershipRole),
    access: {
      mode: membershipRole ? ("membership" as WorkspaceAccessMode) : ("legacy-password" as WorkspaceAccessMode),
      role: membershipRole
    }
  };
}

export async function archiveWorkspaceWithConfirmation(input: {
  id: string;
  confirmName: string;
  userId?: string | null;
}) {
  const workspace = await getWorkspaceById(input.id);

  if (!workspace) {
    return { ok: false as const, error: "GN introuvable." };
  }

  if (!input.userId) {
    return { ok: false as const, error: "Connexion utilisateur requise." };
  }

  const membership = await getGameMembership(workspace.id, input.userId);

  if (!membership || membership.role !== "admin") {
    return {
      ok: false as const,
      error: "Seuls les admins du GN peuvent archiver cet espace."
    };
  }

  if (input.confirmName.trim() !== workspace.name) {
    return {
      ok: false as const,
      error: "Le nom recopie ne correspond pas au GN a archiver."
    };
  }

  const archived = await archiveWorkspace(workspace.id);

  if (!archived) {
    return { ok: false as const, error: "Archivage impossible." };
  }

  return {
    ok: true as const,
    gameId: workspace.id,
    game: toWorkspaceSummary(archived)
  };
}

function requireSuperAdmin(user?: AuthenticatedUser | null) {
  if (!user) {
    return { ok: false as const, error: "Connexion utilisateur requise." };
  }

  if (!isSuperAdminUser(user)) {
    return {
      ok: false as const,
      error: "Cet acces est reserve au super-admin."
    };
  }

  return { ok: true as const };
}

export async function restoreArchivedWorkspace(input: {
  id: string;
  user?: AuthenticatedUser | null;
}) {
  const admin = requireSuperAdmin(input.user);

  if (!admin.ok) {
    return admin;
  }

  const workspace = await getWorkspaceById(input.id);

  if (!workspace) {
    return { ok: false as const, error: "GN introuvable." };
  }

  if (!workspace.archived_at) {
    return { ok: false as const, error: "Ce GN n'est pas archive." };
  }

  const restored = await restoreWorkspace(workspace.id);

  if (!restored) {
    return { ok: false as const, error: "Restauration impossible." };
  }

  return {
    ok: true as const,
    game: toWorkspaceSummary(restored)
  };
}

export async function deleteArchivedWorkspacePermanently(input: { id: string }) {
  return deleteArchivedWorkspacePermanentlyForAccount({ id: input.id, user: null });
}

export async function deleteArchivedWorkspacePermanentlyForAccount(input: {
  id: string;
  user?: AuthenticatedUser | null;
}) {
  const admin = requireSuperAdmin(input.user);

  if (!admin.ok) {
    return admin;
  }

  const workspace = await getWorkspaceById(input.id);

  if (!workspace) {
    return { ok: false as const, error: "GN introuvable." };
  }

  if (!workspace.archived_at) {
    return {
      ok: false as const,
      error: "Seuls les GN archives peuvent etre supprimes definitivement."
    };
  }

  const deleted = await deleteWorkspace(workspace.id);

  if (!deleted) {
    return { ok: false as const, error: "Suppression definitive impossible." };
  }

  return {
    ok: true as const,
    gameId: workspace.id
  };
}

export async function listCurrentWorkspaceMembersForUser(userId?: string | null) {
  const admin = await requireCurrentWorkspaceAdmin(userId);

  if (!admin.ok) {
    return admin;
  }

  const [memberships, profiles] = await Promise.all([
    listGameMemberships(admin.current.workspace.id),
    listProfiles()
  ]);
  const profilesMap = new Map(profiles.map((profile) => [profile.id, profile] as const));

  return {
    ok: true as const,
    currentUserId: userId!,
    members: memberships.map((membership) => ({
      membership,
      profile: profilesMap.get(membership.userId) ?? null
    })),
    availableProfiles: profiles.filter((profile) => !memberships.some((m) => m.userId === profile.id))
  };
}

export async function listWorkspaceMembersForGameId(input: {
  workspaceId: string;
  userId?: string | null;
}) {
  const admin = await requireWorkspaceAdminForGame(input.workspaceId, input.userId);

  if (!admin.ok) {
    return admin;
  }

  const [memberships, profiles] = await Promise.all([
    listGameMemberships(admin.workspace.id),
    listProfiles()
  ]);
  const profilesMap = new Map(profiles.map((profile) => [profile.id, profile] as const));

  return {
    ok: true as const,
    game: toWorkspaceSummary(admin.workspace),
    currentUserId: input.userId!,
    members: memberships.map((membership) => ({
      membership,
      profile: profilesMap.get(membership.userId) ?? null
    })),
    availableProfiles: profiles.filter((profile) => !memberships.some((m) => m.userId === profile.id))
  };
}

export async function addCurrentWorkspaceMemberForUser(input: {
  currentUserId?: string | null;
  targetUserId: string;
  role: MembershipRole;
}) {
  const admin = await requireCurrentWorkspaceAdmin(input.currentUserId);

  if (!admin.ok) {
    return admin;
  }

  const targetProfile = await getProfileById(input.targetUserId);

  if (!targetProfile) {
    return { ok: false as const, error: "Utilisateur introuvable dans l'annuaire." };
  }

  const membership = await upsertGameMembership({
    gameId: admin.current.workspace.id,
    userId: input.targetUserId,
    role: input.role
  });

  if (!membership) {
    return { ok: false as const, error: "Ajout du membre impossible." };
  }

  return {
    ok: true as const,
    member: {
      membership,
      profile: targetProfile
    }
  };
}

export async function addWorkspaceMemberForGameId(input: {
  workspaceId: string;
  currentUserId?: string | null;
  targetUserId: string;
  role: MembershipRole;
}) {
  const admin = await requireWorkspaceAdminForGame(input.workspaceId, input.currentUserId);

  if (!admin.ok) {
    return admin;
  }

  const targetProfile = await getProfileById(input.targetUserId);

  if (!targetProfile) {
    return { ok: false as const, error: "Utilisateur introuvable dans l'annuaire." };
  }

  const membership = await upsertGameMembership({
    gameId: admin.workspace.id,
    userId: input.targetUserId,
    role: input.role
  });

  if (!membership) {
    return { ok: false as const, error: "Ajout du membre impossible." };
  }

  return {
    ok: true as const,
    member: {
      membership,
      profile: targetProfile
    }
  };
}

export async function updateCurrentWorkspaceMemberRoleForUser(input: {
  currentUserId?: string | null;
  membershipId: string;
  role: MembershipRole;
}) {
  const admin = await requireCurrentWorkspaceAdmin(input.currentUserId);

  if (!admin.ok) {
    return admin;
  }

  const memberships = await listGameMemberships(admin.current.workspace.id);
  const targetMembership = memberships.find((membership) => membership.id === input.membershipId);

  if (!targetMembership) {
    return { ok: false as const, error: "Membre introuvable dans ce GN." };
  }

  if (targetMembership.role === "admin" && input.role !== "admin") {
    const adminCount = memberships.filter((membership) => membership.role === "admin").length;

    if (adminCount <= 1) {
      return {
        ok: false as const,
        error: "Ce GN doit conserver au moins un admin."
      };
    }
  }

  const membership = await upsertGameMembership({
    gameId: admin.current.workspace.id,
    userId: targetMembership.userId,
    role: input.role
  });
  const profile = await getProfileById(targetMembership.userId);

  if (!membership) {
    return { ok: false as const, error: "Modification du role impossible." };
  }

  return {
    ok: true as const,
    member: {
      membership,
      profile
    }
  };
}

export async function updateWorkspaceMemberRoleForGameId(input: {
  workspaceId: string;
  currentUserId?: string | null;
  membershipId: string;
  role: MembershipRole;
}) {
  const admin = await requireWorkspaceAdminForGame(input.workspaceId, input.currentUserId);

  if (!admin.ok) {
    return admin;
  }

  const memberships = await listGameMemberships(admin.workspace.id);
  const targetMembership = memberships.find((membership) => membership.id === input.membershipId);

  if (!targetMembership) {
    return { ok: false as const, error: "Membre introuvable dans ce GN." };
  }

  if (targetMembership.role === "admin" && input.role !== "admin") {
    const adminCount = memberships.filter((membership) => membership.role === "admin").length;

    if (adminCount <= 1) {
      return {
        ok: false as const,
        error: "Ce GN doit conserver au moins un admin."
      };
    }
  }

  const membership = await upsertGameMembership({
    gameId: admin.workspace.id,
    userId: targetMembership.userId,
    role: input.role
  });
  const profile = await getProfileById(targetMembership.userId);

  if (!membership) {
    return { ok: false as const, error: "Modification du role impossible." };
  }

  return {
    ok: true as const,
    member: {
      membership,
      profile
    }
  };
}

export async function removeCurrentWorkspaceMemberForUser(input: {
  currentUserId?: string | null;
  membershipId: string;
}) {
  const admin = await requireCurrentWorkspaceAdmin(input.currentUserId);

  if (!admin.ok) {
    return admin;
  }

  const memberships = await listGameMemberships(admin.current.workspace.id);
  const targetMembership = memberships.find((membership) => membership.id === input.membershipId);

  if (!targetMembership) {
    return { ok: false as const, error: "Membre introuvable dans ce GN." };
  }

  if (targetMembership.role === "admin") {
    const adminCount = memberships.filter((membership) => membership.role === "admin").length;

    if (adminCount <= 1) {
      return {
        ok: false as const,
        error: "Ce GN doit conserver au moins un admin."
      };
    }
  }

  const deleted = await deleteGameMembership(targetMembership.id);

  if (!deleted) {
    return { ok: false as const, error: "Retrait du membre impossible." };
  }

  return { ok: true as const, removedMembershipId: targetMembership.id };
}

export async function removeWorkspaceMemberForGameId(input: {
  workspaceId: string;
  currentUserId?: string | null;
  membershipId: string;
}) {
  const admin = await requireWorkspaceAdminForGame(input.workspaceId, input.currentUserId);

  if (!admin.ok) {
    return admin;
  }

  const memberships = await listGameMemberships(admin.workspace.id);
  const targetMembership = memberships.find((membership) => membership.id === input.membershipId);

  if (!targetMembership) {
    return { ok: false as const, error: "Membre introuvable dans ce GN." };
  }

  if (targetMembership.role === "admin") {
    const adminCount = memberships.filter((membership) => membership.role === "admin").length;

    if (adminCount <= 1) {
      return {
        ok: false as const,
        error: "Ce GN doit conserver au moins un admin."
      };
    }
  }

  const deleted = await deleteGameMembership(targetMembership.id);

  if (!deleted) {
    return { ok: false as const, error: "Retrait du membre impossible." };
  }

  return { ok: true as const, removedMembershipId: targetMembership.id };
}
