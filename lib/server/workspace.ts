import { cookies } from "next/headers";

import { AppData, WorkspaceAccessMode } from "@/lib/types";
import {
  archiveWorkspace,
  createAdminSession,
  createSession,
  createWorkspace,
  getGameMembership,
  deleteAdminSession,
  deleteWorkspace,
  deleteSession,
  getAdminSession,
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
  updateWorkspacePasswordHash,
  updateWorkspaceData,
  workspaceNameExists
} from "@/lib/server/db";
import {
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_DURATION_SECONDS,
  createSessionToken,
  getAdminPassword,
  getInvitationPassword,
  hashPassword,
  hashSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_SECONDS,
  verifyPassword
} from "@/lib/server/auth";
import { canWriteWorkspace } from "@/lib/server/supabase-auth";

function sessionExpiryDate() {
  return new Date(Date.now() + SESSION_DURATION_SECONDS * 1000);
}

function adminSessionExpiryDate() {
  return new Date(Date.now() + ADMIN_SESSION_DURATION_SECONDS * 1000);
}

export function clearWorkspaceSessionByToken(currentToken?: string | null) {
  if (currentToken) {
    void deleteSession(hashSessionToken(currentToken));
  }
}

export function clearAdminSessionByToken(currentToken?: string | null) {
  if (currentToken) {
    void deleteAdminSession(hashSessionToken(currentToken));
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
    data: {
      ...parseWorkspace(workspace),
      gameName: workspace.name
    }
  };
}

async function resolveWorkspaceRoleForUser(workspaceId: string, userId?: string | null) {
  if (!userId) {
    return null;
  }

  const membership = await getGameMembership(workspaceId, userId);
  return membership?.role ?? null;
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
  if (!userId) {
    return listWorkspaceOverview();
  }

  const [current, memberships, games] = await Promise.all([
    getCurrentWorkspaceContext(),
    listUserMemberships(userId),
    listWorkspaces()
  ]);

  const allowedIds = new Set(memberships.map((membership) => membership.gameId));
  const allowedGames = games.filter((game) => allowedIds.has(game.id));
  const currentIsAllowed = current ? allowedIds.has(current.workspace.id) : false;

  return {
    games: allowedGames.map(toWorkspaceSummary),
    currentGame: currentIsAllowed ? current?.summary ?? null : null
  };
}

export async function getCurrentAdminContext() {
  const cookieStore = await cookies();
  const currentToken = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!currentToken) {
    return null;
  }

  const session = await getAdminSession(hashSessionToken(currentToken));

  if (!session) {
    return null;
  }

  return {
    session,
    isAdmin: true as const
  };
}

export async function openAdminSessionWithPassword(password: string) {
  if (password.trim() !== getAdminPassword()) {
    return { ok: false as const, error: "Mot de passe administrateur incorrect." };
  }

  const token = createSessionToken();
  await createAdminSession(hashSessionToken(token), adminSessionExpiryDate().toISOString());

  return {
    ok: true as const,
    sessionToken: token
  };
}

export async function createWorkspaceWithAccess(input: {
  invitePassword: string;
  name: string;
  accessPassword: string;
  creator?: {
    id: string;
    email?: string | null;
    displayName?: string | null;
  } | null;
}) {
  const creator = input.creator ?? null;

  if (!creator && input.invitePassword !== getInvitationPassword()) {
    return { ok: false as const, error: "Mot de passe d'invitation incorrect." };
  }

  const name = input.name.trim();
  const accessPassword = input.accessPassword.trim();

  if (!name) {
    return { ok: false as const, error: "Le nom du GN est requis." };
  }

  if (!accessPassword) {
    return { ok: false as const, error: "Le mot de passe d'acces est requis." };
  }

  if (await workspaceNameExists(name)) {
    return { ok: false as const, error: "Un GN avec ce nom existe deja." };
  }

  const workspaceId = `game-${crypto.randomUUID()}`;
  const workspace = await createWorkspace({
    id: workspaceId,
    name,
    passwordHash: hashPassword(accessPassword)
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
    data: {
      ...parseWorkspace(workspace),
      gameName: workspace.name
    }
  };
}

export async function openWorkspaceWithPassword(input: {
  id: string;
  accessPassword: string;
  userId?: string | null;
}) {
  const workspace = await getWorkspaceById(input.id);

  if (!workspace) {
    return { ok: false as const, error: "GN introuvable." };
  }

  if (workspace.archived_at) {
    return { ok: false as const, error: "Ce GN est archive et n'est pas accessible." };
  }

  const membership = input.userId
    ? await getGameMembership(workspace.id, input.userId)
    : null;

  const accessPassword = input.accessPassword.trim();

  if (!membership && !verifyPassword(accessPassword, workspace.password_hash)) {
    return { ok: false as const, error: "Mot de passe incorrect." };
  }

  const token = createSessionToken();
  await createSession(workspace.id, hashSessionToken(token), sessionExpiryDate().toISOString());

  return {
    ok: true as const,
    sessionToken: token,
    game: toWorkspaceSummary(workspace),
    data: {
      ...parseWorkspace(workspace),
      gameName: workspace.name
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
    data: {
      ...parseWorkspace(updated),
      gameName: updated.name
    }
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
    data: {
      ...parseWorkspace(updated),
      gameName: updated.name
    }
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
    data: current.data,
    access: {
      mode: membershipRole ? ("membership" as WorkspaceAccessMode) : ("legacy-password" as WorkspaceAccessMode),
      role: membershipRole
    }
  };
}

export async function resetWorkspaceAccessPassword(input: {
  id: string;
  nextAccessPassword: string;
}) {
  const admin = await getCurrentAdminContext();

  if (!admin) {
    return { ok: false as const, error: "Session administrateur invalide." };
  }

  const workspace = await getWorkspaceById(input.id);

  if (!workspace) {
    return { ok: false as const, error: "GN introuvable." };
  }

  const nextAccessPassword = input.nextAccessPassword.trim();

  if (!nextAccessPassword) {
    return { ok: false as const, error: "Le nouveau mot de passe est requis." };
  }

  const updated = await updateWorkspacePasswordHash(
    workspace.id,
    hashPassword(nextAccessPassword)
  );

  if (!updated) {
    return { ok: false as const, error: "Reinitialisation impossible." };
  }

  return {
    ok: true as const,
    game: toWorkspaceSummary(updated)
  };
}

export async function archiveWorkspaceWithConfirmation(input: {
  id: string;
  accessPassword: string;
  confirmName: string;
}) {
  const workspace = await getWorkspaceById(input.id);

  if (!workspace) {
    return { ok: false as const, error: "GN introuvable." };
  }

  const accessPassword = input.accessPassword.trim();

  if (!accessPassword) {
    return { ok: false as const, error: "Le mot de passe d'acces est requis." };
  }

  if (!verifyPassword(accessPassword, workspace.password_hash)) {
    return { ok: false as const, error: "Mot de passe d'acces incorrect." };
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

export async function restoreArchivedWorkspace(input: { id: string }) {
  const admin = await getCurrentAdminContext();

  if (!admin) {
    return { ok: false as const, error: "Session administrateur invalide." };
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
  const admin = await getCurrentAdminContext();

  if (!admin) {
    return { ok: false as const, error: "Session administrateur invalide." };
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
