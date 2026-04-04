"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { useAppData } from "@/components/app-data-provider";
import { CreatePanel } from "@/components/create-panel";
import { PageHero } from "@/components/page-hero";
import { buildDeleteConfirmation } from "@/lib/ui-copy";

export default function HomePage() {
  const {
    authUser,
    createGame,
    currentGame,
    deleteGamePermanently,
    games,
    hasCurrentGame,
    isAuthConfigured,
    isAuthenticated,
    isAuthLoading,
    isReady,
    isSuperAdmin,
    openGame,
    restoreGame,
    signInWithPassword,
    signOutUser,
    signUpWithPassword
  } = useAppData();
  const activeGames = useMemo(() => games.filter((game) => !game.archived), [games]);
  const archivedGames = useMemo(() => games.filter((game) => game.archived), [games]);

  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [newGameName, setNewGameName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authDisplayName, setAuthDisplayName] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [createError, setCreateError] = useState("");
  const [archiveError, setArchiveError] = useState("");
  const [archiveSuccess, setArchiveSuccess] = useState("");
  const [isOpening, setIsOpening] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isDeletingPermanently, setIsDeletingPermanently] = useState(false);

  useEffect(() => {
    if (!games.length) {
      setSelectedGameId(null);
      return;
    }

    const hasSelection = games.some((game) => game.id === selectedGameId);
    if (hasSelection) {
      return;
    }

    setSelectedGameId(activeGames[0]?.id ?? archivedGames[0]?.id ?? games[0].id);
  }, [activeGames, archivedGames, games, selectedGameId]);

  useEffect(() => {
    setArchiveError("");
    setArchiveSuccess("");
  }, [selectedGameId]);

  useEffect(() => {
    if (createError) {
      setCreateError("");
    }
  }, [newGameName]);

  useEffect(() => {
    if (authError) {
      setAuthError("");
    }
  }, [authEmail, authPassword, authDisplayName, isRegisterMode]);

  useEffect(() => {
    if (authSuccess) {
      setAuthSuccess("");
    }
  }, [authEmail, authPassword, authDisplayName, isRegisterMode]);

  useEffect(() => {
    if (archiveSuccess) {
      setArchiveSuccess("");
    }
  }, [selectedGameId]);

  async function handleOpenGameById(gameId: string) {
    const targetGame = games.find((game) => game.id === gameId);

    if (!targetGame || targetGame.archived || isOpening) return;
    setIsOpening(true);

    const result = await openGame({
      id: gameId
    });

    if (!result.ok) {
      setArchiveError(result.error ?? "Acces refuse.");
      setIsOpening(false);
      return;
    }

    setArchiveError("");
    window.location.assign("/dashboard");
  }

  async function handleCreateGame(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isCreating) return;
    setIsCreating(true);

    const result = await createGame({
      name: newGameName
    });

    if (!result.ok) {
      setCreateError(result.error ?? "Creation impossible.");
      setIsCreating(false);
      return;
    }

    setCreateError("");
    setNewGameName("");
    window.location.assign("/dashboard");
  }

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmittingAuth) return;

    setIsSubmittingAuth(true);

    const result = isRegisterMode
      ? await signUpWithPassword({
          email: authEmail,
          password: authPassword,
          displayName: authDisplayName
        })
      : await signInWithPassword({
          email: authEmail,
          password: authPassword
        });

    if (!result.ok) {
      setAuthError(result.error ?? "Authentification impossible.");
      setIsSubmittingAuth(false);
      return;
    }

    setAuthError("");
    setAuthSuccess(
      isRegisterMode
        ? "Compte cree. Si Supabase demande une confirmation email, valide-la avant de continuer."
        : "Connexion reussie."
    );
    setAuthPassword("");
    setIsSubmittingAuth(false);
  }

  async function handleSignOutUser() {
    await signOutUser();
    setAuthSuccess("");
    setAuthError("");
  }

  async function handleRestoreGameById(gameId: string) {
    const targetGame = games.find((game) => game.id === gameId);
    if (!targetGame || !targetGame.archived || isRestoring) return;

    setIsRestoring(true);
    const result = await restoreGame({ id: gameId });

    if (!result.ok) {
      setArchiveError(result.error ?? "Restauration impossible.");
      setIsRestoring(false);
      return;
    }

    setArchiveError("");
    setArchiveSuccess(`Le GN "${targetGame.name}" a ete restaure.`);
    setIsRestoring(false);
  }

  async function handleDeleteGamePermanentlyById(gameId: string) {
    const targetGame = games.find((game) => game.id === gameId);
    if (!targetGame || !targetGame.archived || isDeletingPermanently) return;

    const confirmed = window.confirm(
      buildDeleteConfirmation({
        entityLabel: "definitivement le GN",
        name: targetGame.name
      })
    );

    if (!confirmed) return;

    setIsDeletingPermanently(true);
    const result = await deleteGamePermanently({ id: gameId });

    if (!result.ok) {
      setArchiveError(result.error ?? "Suppression definitive impossible.");
      setIsDeletingPermanently(false);
      return;
    }

    setArchiveError("");
    setArchiveSuccess(`Le GN "${targetGame.name}" a ete supprime definitivement.`);
    setIsDeletingPermanently(false);
  }

  function handleResumeCurrentGame() {
    window.location.assign("/dashboard");
  }

  function getRoleLabel(role?: string | null) {
    if (role === "admin") return "admin";
    if (role === "orga") return "orga";
    if (role === "lecture") return "lecture";
    return null;
  }

  return (
    <>
      <PageHero
        kicker="Accueil multi-GN"
        title="Se connecter, creer un GN, puis ouvrir ses espaces."
        copy="Chaque GN dispose de son espace de travail separe. Les acces passent maintenant par les comptes orga et les roles definis dans l'equipe."
        actions={
          hasCurrentGame && currentGame ? (
            <button type="button" className="button-primary" onClick={handleResumeCurrentGame}>
              Reprendre {currentGame.name}
            </button>
          ) : (
            <span className="hero-note hero-note-accent">Mode compte orga</span>
          )
        }
        aside={
          <div className="insight-column">
            {isAuthConfigured ? (
              <CreatePanel
                title={isAuthenticated ? "Compte orga connecte" : "Connexion orga"}
                description={
                  isAuthenticated
                    ? "Ton compte peut etre admin sur son propre GN, tout en restant orga ou lecteur sur d'autres espaces."
                    : "Connecte-toi pour creer ton propre GN et retrouver uniquement les espaces auxquels tu as acces."
                }
              >
                {isAuthenticated && authUser ? (
                  <div className="form-stack">
                    <div className="detail-block admin-block">
                      <h3>{authUser.displayName || authUser.email || "Compte orga"}</h3>
                      <p>{authUser.email ?? "Adresse email indisponible."}</p>
                    </div>
                    {isSuperAdmin ? (
                      <div className="detail-block">
                        <h3>Super-admin actif</h3>
                        <p>
                          Ton compte peut restaurer ou supprimer definitivement les GN archives
                          depuis l'accueil.
                        </p>
                      </div>
                    ) : null}
                    {authSuccess ? <div className="form-success">{authSuccess}</div> : null}
                    <div className="form-actions">
                      <button
                        type="button"
                        className="button-secondary button-secondary-light"
                        onClick={() => {
                          void handleSignOutUser();
                        }}
                      >
                        Se deconnecter
                      </button>
                    </div>
                  </div>
                ) : (
                  <form className="form-stack" onSubmit={handleAuthSubmit}>
                    {isRegisterMode ? (
                      <div className="field">
                        <label htmlFor="auth-display-name">Nom affiche</label>
                        <input
                          id="auth-display-name"
                          value={authDisplayName}
                          onChange={(event) => setAuthDisplayName(event.target.value)}
                          placeholder="Exemple : Cyril"
                          disabled={isSubmittingAuth || isAuthLoading}
                        />
                      </div>
                    ) : null}
                    <div className="field">
                      <label htmlFor="auth-email">Email</label>
                      <input
                        id="auth-email"
                        type="email"
                        value={authEmail}
                        onChange={(event) => setAuthEmail(event.target.value)}
                        placeholder="orga@exemple.fr"
                        disabled={isSubmittingAuth || isAuthLoading}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="auth-password">Mot de passe</label>
                      <input
                        id="auth-password"
                        type="password"
                        value={authPassword}
                        onChange={(event) => setAuthPassword(event.target.value)}
                        disabled={isSubmittingAuth || isAuthLoading}
                      />
                    </div>
                    {authError ? <div className="form-error">{authError}</div> : null}
                    {authSuccess ? <div className="form-success">{authSuccess}</div> : null}
                    <div className="form-actions form-actions-column">
                      <button
                        type="submit"
                        className="button-primary"
                        disabled={
                          isAuthLoading ||
                          isSubmittingAuth ||
                          !authEmail.trim() ||
                          !authPassword.trim() ||
                          (isRegisterMode && !authDisplayName.trim())
                        }
                      >
                        {isSubmittingAuth
                          ? "Verification..."
                          : isRegisterMode
                          ? "Creer mon compte"
                          : "Se connecter"}
                      </button>
                      <button
                        type="button"
                        className="button-secondary button-secondary-light"
                        onClick={() => setIsRegisterMode((current) => !current)}
                        disabled={isSubmittingAuth || isAuthLoading}
                      >
                        {isRegisterMode
                          ? "J'ai deja un compte"
                          : "Creer un compte orga"}
                      </button>
                    </div>
                  </form>
                )}
              </CreatePanel>
            ) : null}

            <CreatePanel
              title="Creer un nouveau GN"
              description={
                isAuthenticated
                  ? "Ce GN sera cree sous ton compte, et tu deviendras automatiquement admin de cet espace."
                  : "Connecte-toi d'abord avec un compte orga pour creer ton premier GN."
              }
            >
              <form className="form-stack" onSubmit={handleCreateGame}>
                <div className="field">
                  <label htmlFor="new-game-name">Nom du GN</label>
                  <input
                    id="new-game-name"
                    value={newGameName}
                    onChange={(event) => setNewGameName(event.target.value)}
                    placeholder="Exemple : Les Cendres de Vermeille"
                    disabled={isCreating}
                  />
                </div>
                {createError ? <div className="form-error">{createError}</div> : null}
                <div className="form-actions">
                  <button
                    type="submit"
                    className="button-primary"
                    disabled={isCreating || !newGameName.trim() || !isAuthenticated}
                  >
                    {isCreating ? "Creation..." : "Creer cet espace"}
                  </button>
                </div>
              </form>
            </CreatePanel>
          </div>
        }
      />

      <section className="stats-row">
        <div className="stat-block">
          <p className="stat-value">{activeGames.length}</p>
          <p className="stat-label">GN actifs</p>
          <p className="stat-helper">espaces actuellement accessibles</p>
        </div>
        <div className="stat-block">
          <p className="stat-value">{archivedGames.length}</p>
          <p className="stat-label">GN archives</p>
          <p className="stat-helper">
            {isSuperAdmin
              ? "archives visibles pour le super-admin"
              : "archives masquees hors super-admin"}
          </p>
        </div>
        <div className="stat-block">
          <p className="stat-value">{currentGame ? "1" : "0"}</p>
          <p className="stat-label">espace ouvert</p>
          <p className="stat-helper">
            {currentGame ? currentGame.name : "aucun espace actif"}
          </p>
        </div>
      </section>

      <section className="surface-grid">
        {archiveSuccess ? (
          <div className="surface span-12 success-banner">{archiveSuccess}</div>
        ) : null}

        <div className="surface span-12">
          <div className="section-header">
            <div>
              <p className="section-kicker">GN disponibles</p>
              <h2 className="section-title">Espaces en developpement</h2>
              <p className="section-copy">
                {isAuthenticated
                  ? "Les espaces affiches ici correspondent aux GN auxquels ton compte a acces."
                  : "Connecte-toi pour voir et ouvrir les GN auxquels ton compte appartient."}
              </p>
            </div>
          </div>
          {activeGames.length ? (
            <div className="list-stack">
              {activeGames.map((game) => (
                <article
                  key={game.id}
                  className={`workspace-card${selectedGameId === game.id ? " active" : ""}`}
                  onClick={() => {
                    setSelectedGameId(game.id);
                    setArchiveError("");
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedGameId(game.id);
                      setArchiveError("");
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selectedGameId === game.id}
                >
                  <div className="workspace-card-header">
                    <h3>{game.name}</h3>
                    <span className="badge">{game.documentCount} docs</span>
                  </div>
                  <div className="badge-row">
                    {getRoleLabel(game.role) ? (
                      <span className="status-pill">{getRoleLabel(game.role)}</span>
                    ) : null}
                    {currentGame?.id === game.id ? (
                      <span className="status-pill success">ouvert</span>
                    ) : null}
                  </div>
                  <p>
                    {game.characterCount} personnages, {game.plotCount} intrigues,{" "}
                    {game.kraftCount} krafts suivis.
                  </p>
                  <div className="form-actions">
                    <button
                      type="button"
                      className="button-primary"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedGameId(game.id);
                        setArchiveError("");
                        void handleOpenGameById(game.id);
                      }}
                      disabled={isOpening || !isAuthenticated}
                    >
                      {isOpening && selectedGameId === game.id
                        ? "Ouverture..."
                        : "Acceder a l'espace"}
                    </button>
                    {game.role === "admin" ? (
                      <Link
                        href={`/games/${game.id}/manage`}
                        className="button-secondary button-secondary-light"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedGameId(game.id);
                          setArchiveError("");
                        }}
                      >
                        Gestion
                      </Link>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : isReady ? (
            <div className="empty-state">
              {isAuthenticated
                ? "Aucun GN actif pour le moment. Cree ton premier espace ou demande a etre ajoute a un GN existant."
                : "Connecte-toi pour voir les GN auxquels ton compte a acces."}
            </div>
          ) : (
            <div className="empty-state">Initialisation des espaces GN...</div>
          )}

          {isSuperAdmin ? (
            <div className="archive-section">
              <div className="section-header">
                <div>
                  <p className="section-kicker">Archives</p>
                  <h3 className="section-title section-title-small">GN archives</h3>
                  <p className="section-copy">
                    Les archives peuvent etre restaurees ou supprimees definitivement
                    depuis le compte super-admin.
                  </p>
                </div>
              </div>
              {archivedGames.length ? (
                <div className="list-stack">
                  {archivedGames.map((game) => (
                    <article
                      key={game.id}
                      className={`workspace-card workspace-card-archived${
                        selectedGameId === game.id ? " active" : ""
                      }`}
                      onClick={() => {
                        setSelectedGameId(game.id);
                        setArchiveError("");
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedGameId(game.id);
                          setArchiveError("");
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-pressed={selectedGameId === game.id}
                    >
                      <div className="workspace-card-header">
                        <h3>{game.name}</h3>
                        <span className="badge">Archive</span>
                      </div>
                      <p>
                        Archive le{" "}
                        {game.archivedAt
                          ? new Date(game.archivedAt).toLocaleDateString("fr-FR")
                          : "date inconnue"}
                        .
                      </p>
                      <div className="form-actions">
                        <button
                          type="button"
                          className="button-primary"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedGameId(game.id);
                            setArchiveError("");
                            void handleRestoreGameById(game.id);
                          }}
                          disabled={isRestoring}
                        >
                          {isRestoring && selectedGameId === game.id
                            ? "Restauration..."
                            : "Restaurer"}
                        </button>
                        <button
                          type="button"
                          className="button-danger"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedGameId(game.id);
                            setArchiveError("");
                            void handleDeleteGamePermanentlyById(game.id);
                          }}
                          disabled={isDeletingPermanently}
                        >
                          {isDeletingPermanently && selectedGameId === game.id
                            ? "Suppression..."
                            : "Supprimer"}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty-state">Aucun GN archive pour le moment.</div>
              )}
            </div>
          ) : null}
        </div>

        <div className="surface span-12">
          <div className="section-header">
            <div>
              <p className="section-kicker">Navigation</p>
              <h2 className="section-title">Ouverture rapide</h2>
              <p className="section-copy">
                Chaque carte GN propose maintenant directement ses actions principales pour eviter
                un panneau d'explication trop long.
              </p>
            </div>
          </div>
          {archiveError ? <div className="form-error">{archiveError}</div> : null}
          <div className="detail-block">
            <h3>Repere rapide</h3>
            <p>
              Acceder a l'espace ouvre directement le GN. Gestion apparait seulement pour les
              admins du GN et regroupe le renommage, les membres et l'archivage.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
