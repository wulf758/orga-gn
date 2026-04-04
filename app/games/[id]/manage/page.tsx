"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { CreatePanel } from "@/components/create-panel";
import { useAppData } from "@/components/app-data-provider";
import { PageHero } from "@/components/page-hero";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { MembershipRole, UserProfile } from "@/lib/types";
import { buildDeleteConfirmation } from "@/lib/ui-copy";

type MemberRow = {
  membership: {
    id: string;
    userId: string;
    role: MembershipRole;
  };
  profile: UserProfile | null;
};

async function getAuthHeaders() {
  const supabase = getSupabaseBrowserClient();
  const session = supabase ? (await supabase.auth.getSession()).data.session : null;
  const headers = new Headers();

  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }

  return headers;
}

export default function ManageGamePage() {
  const params = useParams<{ id: string }>();
  const gameId = String(params.id);
  const { authUser, currentGame, games, isAuthenticated, isSuperAdmin, openGame } = useAppData();
  const game = useMemo(() => games.find((item) => item.id === gameId) ?? null, [gameId, games]);
  const canManageGame = game?.role === "admin";
  const canManageArchive = isSuperAdmin && Boolean(game?.archived);
  const [nameDraft, setNameDraft] = useState(game?.name ?? "");
  const [confirmName, setConfirmName] = useState("");
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [membersError, setMembersError] = useState("");
  const [generalSuccess, setGeneralSuccess] = useState("");
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [availableProfiles, setAvailableProfiles] = useState<UserProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<MembershipRole>("orga");
  const [isSubmittingMember, setIsSubmittingMember] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [isSavingName, setIsSavingName] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpening, setIsOpening] = useState(false);

  useEffect(() => {
    setNameDraft(game?.name ?? "");
    setConfirmName("");
  }, [game?.name]);

  const sortedMembers = useMemo(
    () =>
      [...members].sort((left, right) => {
        const leftLabel = left.profile?.displayName || left.profile?.id || left.membership.userId;
        const rightLabel =
          right.profile?.displayName || right.profile?.id || right.membership.userId;
        return leftLabel.localeCompare(rightLabel, "fr");
      }),
    [members]
  );

  async function loadMembers() {
    if (!game || !canManageGame) {
      setIsLoadingMembers(false);
      setMembers([]);
      setAvailableProfiles([]);
      return;
    }

    setIsLoadingMembers(true);

    try {
      const response = await fetch(`/api/games/${game.id}/members`, {
        cache: "no-store",
        headers: await getAuthHeaders()
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        setMembersError(payload.error ?? "Chargement des membres impossible.");
        setMembers([]);
        setAvailableProfiles([]);
        setIsLoadingMembers(false);
        return;
      }

      const payload = (await response.json()) as {
        members: MemberRow[];
        availableProfiles: UserProfile[];
      };

      setMembersError("");
      setMembers(payload.members ?? []);
      setAvailableProfiles(payload.availableProfiles ?? []);
      setSelectedUserId((current) =>
        current && payload.availableProfiles?.some((profile) => profile.id === current)
          ? current
          : payload.availableProfiles?.[0]?.id ?? ""
      );
    } catch {
      setMembersError("Chargement des membres impossible.");
    } finally {
      setIsLoadingMembers(false);
    }
  }

  useEffect(() => {
    void loadMembers();
  }, [game?.id, canManageGame]);

  async function handleOpenWorkspace() {
    if (!game || game.archived || isOpening) return;

    if (currentGame?.id === game.id) {
      window.location.assign("/dashboard");
      return;
    }

    setIsOpening(true);

    try {
      const result = await openGame({ id: game.id });

      if (!result.ok) {
        setMembersError(result.error ?? "Ouverture impossible.");
        return;
      }

      window.location.assign("/dashboard");
    } finally {
      setIsOpening(false);
    }
  }

  async function handleRenameGame(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!game || !canManageGame || !nameDraft.trim() || isSavingName) return;

    setIsSavingName(true);
    setMembersError("");
    setGeneralSuccess("");

    try {
      const response = await fetch(`/api/games/${game.id}/name`, {
        method: "PUT",
        headers: await getAuthHeaders().then((headers) => {
          headers.set("Content-Type", "application/json");
          return headers;
        }),
        body: JSON.stringify({ name: nameDraft })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        setMembersError(payload.error ?? "Renommage impossible.");
        setIsSavingName(false);
        return;
      }

      setGeneralSuccess("Nom du GN enregistre. Retour a l'accueil pour recharger la liste.");
      window.location.assign("/");
    } finally {
      setIsSavingName(false);
    }
  }

  async function handleAddMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!game || !selectedUserId || isSubmittingMember) return;

    setIsSubmittingMember(true);

    try {
      const authHeaders = await getAuthHeaders();
      authHeaders.set("Content-Type", "application/json");

      const response = await fetch(`/api/games/${game.id}/members`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          userId: selectedUserId,
          role: selectedRole
        })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        setMembersError(payload.error ?? "Ajout du membre impossible.");
        setIsSubmittingMember(false);
        return;
      }

      setMembersError("");
      setGeneralSuccess("Membre ajoute au GN.");
      await loadMembers();
    } finally {
      setIsSubmittingMember(false);
    }
  }

  async function handleRoleChange(membershipId: string, role: MembershipRole) {
    if (!game) return;
    setUpdatingId(membershipId);

    try {
      const authHeaders = await getAuthHeaders();
      authHeaders.set("Content-Type", "application/json");

      const response = await fetch(`/api/games/${game.id}/members/${membershipId}`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ role })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        setMembersError(payload.error ?? "Modification du role impossible.");
        return;
      }

      setMembersError("");
      setGeneralSuccess("Role mis a jour.");
      await loadMembers();
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleRemoveMember(membershipId: string) {
    if (!game) return;
    setRemovingId(membershipId);

    try {
      const response = await fetch(`/api/games/${game.id}/members/${membershipId}`, {
        method: "DELETE",
        headers: await getAuthHeaders()
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        setMembersError(payload.error ?? "Retrait du membre impossible.");
        return;
      }

      setMembersError("");
      setGeneralSuccess("Membre retire du GN.");
      await loadMembers();
    } finally {
      setRemovingId(null);
    }
  }

  async function handleArchiveGame(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!game || !canManageGame || isArchiving) return;

    setIsArchiving(true);
    setMembersError("");

    try {
      const authHeaders = await getAuthHeaders();
      authHeaders.set("Content-Type", "application/json");

      const response = await fetch(`/api/games/${game.id}`, {
        method: "DELETE",
        headers: authHeaders,
        body: JSON.stringify({ confirmName })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        setMembersError(payload.error ?? "Archivage impossible.");
        setIsArchiving(false);
        return;
      }

      window.location.assign("/");
    } finally {
      setIsArchiving(false);
    }
  }

  async function handleRestoreArchive() {
    if (!game || !canManageArchive || isRestoring) return;

    setIsRestoring(true);
    setMembersError("");

    try {
      const response = await fetch(`/api/admin/games/${game.id}`, {
        method: "PATCH",
        headers: await getAuthHeaders()
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        setMembersError(payload.error ?? "Restauration impossible.");
        setIsRestoring(false);
        return;
      }

      window.location.assign("/");
    } finally {
      setIsRestoring(false);
    }
  }

  async function handleDeleteArchive() {
    if (!game || !canManageArchive || isDeleting) return;

    const confirmed = window.confirm(
      buildDeleteConfirmation({
        entityLabel: "definitivement le GN",
        name: game.name
      })
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setMembersError("");

    try {
      const response = await fetch(`/api/admin/games/${game.id}`, {
        method: "DELETE",
        headers: await getAuthHeaders()
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        setMembersError(payload.error ?? "Suppression definitive impossible.");
        setIsDeleting(false);
        return;
      }

      window.location.assign("/");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <PageHero
        kicker="Gestion du GN"
        title={game ? `Administrer ${game.name}.` : "Administrer un GN."}
        copy="Cette page regroupe le renommage, la gestion des membres et l'archivage du GN selectionne, sans avoir besoin d'ouvrir l'espace de travail."
        actions={
          game && !game.archived ? (
            <div className="form-actions">
              <Link href="/" className="button-secondary button-secondary-light">
                Retour aux GN
              </Link>
              <button
                type="button"
                className="button-primary"
                onClick={() => {
                  void handleOpenWorkspace();
                }}
                disabled={isOpening}
              >
                {isOpening
                  ? "Ouverture..."
                  : currentGame?.id === game.id
                  ? "Revenir a l'espace"
                  : "Acceder a l'espace"}
              </button>
            </div>
          ) : (
            <Link href="/" className="button-secondary button-secondary-light">
              Retour aux GN
            </Link>
          )
        }
        aside={
          <CreatePanel
            title="Acces rapide"
            description="Un admin peut gerer ce GN ici, puis ouvrir l'espace de travail quand tout est pret."
          >
            {!isAuthenticated ? (
              <div className="empty-state">Connecte-toi avec ton compte orga pour gerer un GN.</div>
            ) : !game ? (
              <div className="empty-state">GN introuvable ou non visible pour ton compte.</div>
            ) : (
              <div className="form-stack">
                <div className="detail-block">
                  <h3>{game.name}</h3>
                  <p>
                    {game.archived
                      ? "Ce GN est archive. Les actions de secours restent reservees au super-admin."
                      : canManageGame
                      ? "Tu es admin sur ce GN. Tu peux en gerer le nom, l'equipe et l'archivage."
                      : "Tu peux consulter ce GN, mais sa gestion reste reservee aux admins."}
                  </p>
                </div>
                {!game.archived ? (
                  <div className="form-actions">
                    <Link href="/" className="button-secondary button-secondary-light">
                      Retour aux GN
                    </Link>
                    <button
                      type="button"
                      className="button-primary"
                      onClick={() => {
                        void handleOpenWorkspace();
                      }}
                      disabled={isOpening}
                    >
                      {isOpening
                        ? "Ouverture..."
                        : currentGame?.id === game.id
                        ? "Revenir a l'espace"
                        : "Acceder a l'espace"}
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </CreatePanel>
        }
      />

      <section className="surface-grid">
        {membersError ? <div className="surface span-12 form-error">{membersError}</div> : null}
        {generalSuccess ? <div className="surface span-12 form-success">{generalSuccess}</div> : null}

        {!game ? (
          <div className="surface span-12 empty-state">
            Ce GN n'est pas accessible depuis ce compte pour le moment.
          </div>
        ) : game.archived ? (
          <div className="surface span-12">
            <div className="section-header">
              <div>
                <p className="section-kicker">Archive</p>
                <h2 className="section-title">Gestion de l'archive</h2>
                <p className="section-copy">
                  Les GN archives ne sont plus modifiables. Le super-admin peut les restaurer ou les
                  supprimer definitivement depuis ce panneau.
                </p>
              </div>
            </div>
            {canManageArchive ? (
              <div className="form-actions form-actions-column manage-archive-actions">
                <button type="button" className="button-primary" onClick={() => void handleRestoreArchive()} disabled={isRestoring}>
                  {isRestoring ? "Restauration..." : "Restaurer le GN"}
                </button>
                <button type="button" className="button-danger" onClick={() => void handleDeleteArchive()} disabled={isDeleting}>
                  {isDeleting ? "Suppression..." : "Supprimer definitivement"}
                </button>
              </div>
            ) : (
              <div className="empty-state">
                Cette archive est reservee au super-admin.
              </div>
            )}
          </div>
        ) : canManageGame ? (
          <>
            <div className="surface span-5">
              <CreatePanel
                title="Nom du GN"
                description="Le nom est gere ici pour eviter de le modifier depuis plusieurs endroits differents."
              >
                <form className="form-stack" onSubmit={handleRenameGame}>
                  <div className="field">
                    <label htmlFor="manage-game-name">Nom du GN</label>
                    <input
                      id="manage-game-name"
                      value={nameDraft}
                      onChange={(event) => setNameDraft(event.target.value)}
                      disabled={isSavingName}
                    />
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="button-primary" disabled={isSavingName || !nameDraft.trim()}>
                      {isSavingName ? "Enregistrement..." : "Enregistrer les modifications"}
                    </button>
                  </div>
                </form>
              </CreatePanel>

              <CreatePanel
                title="Archiver le GN"
                description="L'archivage retire le GN des espaces actifs. Il restera restorable ensuite par le super-admin."
              >
                <form className="form-stack danger-stack" onSubmit={handleArchiveGame}>
                  <div className="detail-block danger-block">
                    <h3>Confirmation de securite</h3>
                    <p>
                      Pour archiver <strong>{game.name}</strong>, recopier exactement son nom.
                    </p>
                  </div>
                  <div className="field">
                    <label htmlFor="archive-manage-name">Nom du GN a retaper</label>
                    <input
                      id="archive-manage-name"
                      value={confirmName}
                      onChange={(event) => setConfirmName(event.target.value)}
                      placeholder={game.name}
                      disabled={isArchiving}
                    />
                  </div>
                  <div className="form-actions">
                    <button
                      type="submit"
                      className="button-danger"
                      disabled={isArchiving || confirmName.trim() !== game.name}
                    >
                      {isArchiving ? "Archivage..." : "Archiver le GN"}
                    </button>
                  </div>
                </form>
              </CreatePanel>
            </div>

            <div className="surface span-7">
              <div className="section-header">
                <div>
                  <p className="section-kicker">Equipe du GN</p>
                  <h2 className="section-title">Membres et roles</h2>
                  <p className="section-copy">
                    Chaque compte a un role propre a ce GN. Les admins gerent l'equipe, les orgas
                    modifient le contenu, et les lecteurs consultent uniquement.
                  </p>
                </div>
              </div>

              <CreatePanel
                title="Ajouter un membre"
                description="Selectionne un compte deja present dans l'application, puis choisis son role sur ce GN."
              >
                <form className="form-stack" onSubmit={handleAddMember}>
                  <div className="detail-block">
                    <h3>Annuaire local</h3>
                    <p>
                      Cette liste reprend les comptes qui se sont deja connectes au moins une fois
                      dans l'application.
                    </p>
                  </div>
                  <div className="field">
                    <label htmlFor="manage-member-profile">Compte existant</label>
                    <select
                      id="manage-member-profile"
                      value={selectedUserId}
                      onChange={(event) => setSelectedUserId(event.target.value)}
                      disabled={!availableProfiles.length || isSubmittingMember}
                    >
                      {!availableProfiles.length ? (
                        <option value="">Aucun autre compte disponible pour le moment</option>
                      ) : null}
                      {availableProfiles.map((profile) => (
                        <option key={profile.id} value={profile.id}>
                          {profile.displayName || profile.id}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="manage-member-role">Role sur ce GN</label>
                    <select
                      id="manage-member-role"
                      value={selectedRole}
                      onChange={(event) => setSelectedRole(event.target.value as MembershipRole)}
                      disabled={isSubmittingMember}
                    >
                      <option value="admin">admin</option>
                      <option value="orga">orga</option>
                      <option value="lecture">lecture</option>
                    </select>
                  </div>
                  <div className="form-actions">
                    <button
                      type="submit"
                      className="button-primary"
                      disabled={!selectedUserId || isSubmittingMember || !availableProfiles.length}
                    >
                      {isSubmittingMember ? "Ajout..." : "Ajouter ce membre"}
                    </button>
                  </div>
                </form>
              </CreatePanel>

              {isLoadingMembers ? (
                <div className="empty-state">Chargement des membres...</div>
              ) : sortedMembers.length ? (
                <div className="list-stack">
                  {sortedMembers.map((member) => {
                    const label =
                      member.profile?.displayName ||
                      (member.profile?.id === authUser?.id ? "Mon compte" : member.membership.userId);

                    return (
                      <article key={member.membership.id} className="workspace-card">
                        <div className="workspace-card-header">
                          <h3>
                            {label}
                            {member.profile?.id === authUser?.id ? " (toi)" : ""}
                          </h3>
                          <span className="badge">{member.membership.role}</span>
                        </div>
                        <p className="workspace-card-summary">
                          {member.profile?.id === authUser?.id
                            ? "Compte actuellement connecte sur ce navigateur."
                            : "Compte orga rattache a ce GN."}
                        </p>
                        <div className="form-actions workspace-card-actions">
                          <select
                            value={member.membership.role}
                            onChange={(event) =>
                              void handleRoleChange(
                                member.membership.id,
                                event.target.value as MembershipRole
                              )
                            }
                            disabled={updatingId === member.membership.id}
                          >
                            <option value="admin">admin</option>
                            <option value="orga">orga</option>
                            <option value="lecture">lecture</option>
                          </select>
                          <button
                            type="button"
                            className="button-secondary"
                            disabled={removingId === member.membership.id}
                            onClick={() => {
                              void handleRemoveMember(member.membership.id);
                            }}
                          >
                            {removingId === member.membership.id ? "Retrait..." : "Retirer"}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state">Aucun membre rattache a ce GN pour le moment.</div>
              )}
            </div>
          </>
        ) : (
          <div className="surface span-12 empty-state">
            Cette page de gestion est reservee aux admins du GN selectionne.
          </div>
        )}
      </section>
    </>
  );
}
