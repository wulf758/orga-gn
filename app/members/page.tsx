"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { useAppData } from "@/components/app-data-provider";
import { CreatePanel } from "@/components/create-panel";
import { PageHero } from "@/components/page-hero";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { MembershipRole, UserProfile } from "@/lib/types";

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

export default function MembersPage() {
  const { authUser, currentGame, hasCurrentGame, isAuthenticated, workspaceAccess } = useAppData();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [availableProfiles, setAvailableProfiles] = useState<UserProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<MembershipRole>("orga");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const canManageMembers = workspaceAccess?.role === "admin";
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
    if (!hasCurrentGame || !isAuthenticated) {
      setIsLoading(false);
      setMembers([]);
      setAvailableProfiles([]);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/members", {
        cache: "no-store",
        headers: await getAuthHeaders()
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        setError(payload.error ?? "Chargement des membres impossible.");
        setMembers([]);
        setAvailableProfiles([]);
        setIsLoading(false);
        return;
      }

      const payload = (await response.json()) as {
        members: MemberRow[];
        availableProfiles: UserProfile[];
      };

      setError("");
      setMembers(payload.members ?? []);
      setAvailableProfiles(payload.availableProfiles ?? []);
      setSelectedUserId((current) =>
        current && payload.availableProfiles?.some((profile) => profile.id === current)
          ? current
          : payload.availableProfiles?.[0]?.id ?? ""
      );
    } catch {
      setError("Chargement des membres impossible.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadMembers();
  }, [currentGame?.id, hasCurrentGame, isAuthenticated]);

  async function handleAddMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedUserId || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const authHeaders = await getAuthHeaders();
      authHeaders.set("Content-Type", "application/json");

      const response = await fetch("/api/members", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          userId: selectedUserId,
          role: selectedRole
        })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        setError(payload.error ?? "Ajout du membre impossible.");
        setIsSubmitting(false);
        return;
      }

      setError("");
      await loadMembers();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRoleChange(membershipId: string, role: MembershipRole) {
    setUpdatingId(membershipId);

    try {
      const authHeaders = await getAuthHeaders();
      authHeaders.set("Content-Type", "application/json");

      const response = await fetch(`/api/members/${membershipId}`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ role })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        setError(payload.error ?? "Modification du role impossible.");
        return;
      }

      setError("");
      await loadMembers();
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleRemoveMember(membershipId: string) {
    setRemovingId(membershipId);

    try {
      const response = await fetch(`/api/members/${membershipId}`, {
        method: "DELETE",
        headers: await getAuthHeaders()
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        setError(payload.error ?? "Retrait du membre impossible.");
        return;
      }

      setError("");
      await loadMembers();
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <>
      <PageHero
        kicker="Membres / roles du GN"
        title="Piloter l'equipe orga espace par espace."
        copy="Chaque compte peut etre admin sur son propre GN, puis orga ou lecteur sur les autres. Cette page gere les acces du GN actuellement ouvert."
        actions={
          workspaceAccess?.role ? (
            <span className="hero-note hero-note-accent">
              Role actuel : {workspaceAccess.role}
            </span>
          ) : null
        }
        aside={
          <CreatePanel
            title="Ajouter un membre"
            description="Selectionne un compte deja present dans l'application, puis choisis son role sur ce GN."
          >
            {!isAuthenticated ? (
              <div className="empty-state">
                Connecte-toi avec un compte orga pour gerer les membres.
              </div>
            ) : !hasCurrentGame ? (
              <div className="empty-state">Ouvre d'abord un GN pour gerer ses membres.</div>
            ) : !canManageMembers ? (
              <div className="empty-state">
                Seuls les admins du GN peuvent ajouter ou retirer des membres.
              </div>
            ) : (
              <form className="form-stack" onSubmit={handleAddMember}>
                <div className="field">
                  <label htmlFor="member-profile">Compte existant</label>
                  <select
                    id="member-profile"
                    value={selectedUserId}
                    onChange={(event) => setSelectedUserId(event.target.value)}
                    disabled={!availableProfiles.length || isSubmitting}
                  >
                    {!availableProfiles.length ? (
                      <option value="">Aucun autre compte disponible</option>
                    ) : null}
                    {availableProfiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.displayName || profile.id}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="member-role">Role sur ce GN</label>
                  <select
                    id="member-role"
                    value={selectedRole}
                    onChange={(event) => setSelectedRole(event.target.value as MembershipRole)}
                    disabled={isSubmitting}
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
                    disabled={!selectedUserId || isSubmitting || !availableProfiles.length}
                  >
                    {isSubmitting ? "Ajout..." : "Ajouter ce membre"}
                  </button>
                </div>
              </form>
            )}
          </CreatePanel>
        }
      />

      <section className="surface-grid">
        <div className="surface span-12">
          <div className="section-header">
            <div>
              <p className="section-kicker">Equipe du GN</p>
              <h2 className="section-title">Membres et permissions</h2>
              <p className="section-copy">
                Les roles sont propres a ce GN. Un meme compte peut etre admin ici, puis orga ou
                lecteur ailleurs.
              </p>
            </div>
          </div>

          {error ? <div className="form-error">{error}</div> : null}

          {isLoading ? (
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
                      <h3>{label}</h3>
                      <span className="badge">{member.membership.role}</span>
                    </div>
                    <p>{member.profile?.id === authUser?.id ? "Compte actuellement connecte." : "Compte orga rattache a ce GN."}</p>
                    <div className="form-actions">
                      <select
                        value={member.membership.role}
                        onChange={(event) =>
                          void handleRoleChange(
                            member.membership.id,
                            event.target.value as MembershipRole
                          )
                        }
                        disabled={!canManageMembers || updatingId === member.membership.id}
                      >
                        <option value="admin">admin</option>
                        <option value="orga">orga</option>
                        <option value="lecture">lecture</option>
                      </select>
                      <button
                        type="button"
                        className="button-secondary"
                        disabled={!canManageMembers || removingId === member.membership.id}
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
      </section>
    </>
  );
}
