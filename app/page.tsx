"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { useAppData } from "@/components/app-data-provider";
import { CreatePanel } from "@/components/create-panel";
import { PageHero } from "@/components/page-hero";
import { buildDeleteConfirmation } from "@/lib/ui-copy";

export default function HomePage() {
  const {
    archiveGame,
    authUser,
    closeAdminSession,
    createGame,
    currentGame,
    deleteGamePermanently,
    games,
    hasCurrentGame,
    isAdminSession,
    isAuthConfigured,
    isAuthenticated,
    isAuthLoading,
    isReady,
    openAdminSession,
    openGame,
    restoreGame,
    signInWithPassword,
    signOutUser,
    signUpWithPassword
  } = useAppData();
  const activeGames = useMemo(() => games.filter((game) => !game.archived), [games]);
  const archivedGames = useMemo(() => games.filter((game) => game.archived), [games]);

  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [adminPassword, setAdminPassword] = useState("");
  const [archiveConfirmName, setArchiveConfirmName] = useState("");
  const [newGameName, setNewGameName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authDisplayName, setAuthDisplayName] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [createError, setCreateError] = useState("");
  const [archiveError, setArchiveError] = useState("");
  const [archiveSuccess, setArchiveSuccess] = useState("");
  const [adminSuccess, setAdminSuccess] = useState("");
  const [isOpening, setIsOpening] = useState(false);
  const [isOpeningAdmin, setIsOpeningAdmin] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isDeletingPermanently, setIsDeletingPermanently] = useState(false);

  const selectedGame = useMemo(
    () => games.find((game) => game.id === selectedGameId) ?? null,
    [games, selectedGameId]
  );

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
    setArchiveConfirmName("");
    setAdminError("");
    setAdminSuccess("");
  }, [selectedGameId]);

  useEffect(() => {
    if (adminError) {
      setAdminError("");
    }
  }, [adminPassword]);

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
    if (archiveError) {
      setArchiveError("");
    }
  }, [archiveConfirmName]);

  useEffect(() => {
    if (archiveSuccess) {
      setArchiveSuccess("");
    }
  }, [archiveConfirmName, selectedGameId]);

  useEffect(() => {
    if (adminSuccess) {
      setAdminSuccess("");
    }
  }, [adminPassword, selectedGameId]);

  async function handleOpenGame(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedGame || selectedGame.archived || isOpening) return;
    setIsOpening(true);

    const result = await openGame({
      id: selectedGame.id
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

  async function handleArchiveGame(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedGame || selectedGame.archived || isArchiving) return;

    setIsArchiving(true);

    const result = await archiveGame({
      id: selectedGame.id,
      confirmName: archiveConfirmName
    });

    if (!result.ok) {
      setArchiveError(result.error ?? "Archivage impossible.");
      setIsArchiving(false);
      return;
    }

    setArchiveConfirmName("");
    setArchiveError("");
    setArchiveSuccess(`Le GN "${selectedGame.name}" a ete archive.`);
    setIsArchiving(false);
  }

  async function handleOpenAdminSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isOpeningAdmin) return;

    setIsOpeningAdmin(true);

    const result = await openAdminSession(adminPassword);

    if (!result.ok) {
      setAdminError(result.error ?? "Acces administrateur refuse.");
      setIsOpeningAdmin(false);
      return;
    }

    setAdminPassword("");
    setAdminError("");
    setAdminSuccess("Administration des GN ouverte.");
    setIsOpeningAdmin(false);
  }

  async function handleRestoreGame() {
    if (!selectedGame || !selectedGame.archived || isRestoring) return;

    setIsRestoring(true);
    const result = await restoreGame({ id: selectedGame.id });

    if (!result.ok) {
      setAdminError(result.error ?? "Restauration impossible.");
      setIsRestoring(false);
      return;
    }

    setAdminError("");
    setAdminSuccess(`Le GN "${selectedGame.name}" a ete restaure.`);
    setIsRestoring(false);
  }

  async function handleDeleteGamePermanently() {
    if (!selectedGame || !selectedGame.archived || isDeletingPermanently) return;

    const confirmed = window.confirm(
      buildDeleteConfirmation({
        entityLabel: "definitivement le GN",
        name: selectedGame.name
      })
    );

    if (!confirmed) return;

    setIsDeletingPermanently(true);
    const result = await deleteGamePermanently({ id: selectedGame.id });

    if (!result.ok) {
      setAdminError(result.error ?? "Suppression definitive impossible.");
      setIsDeletingPermanently(false);
      return;
    }

    setAdminError("");
    setAdminSuccess(`Le GN "${selectedGame.name}" a ete supprime definitivement.`);
    setIsDeletingPermanently(false);
  }

  async function handleCloseAdminSession() {
    await closeAdminSession();
    setAdminPassword("");
    setAdminError("");
    setAdminSuccess("");
  }

  function handleResumeCurrentGame() {
    window.location.assign("/dashboard");
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

            <CreatePanel
              title="Administration des GN"
              description="Cet acces reserve permet de restaurer un GN archive ou de le supprimer definitivement en secours."
            >
              {isAdminSession ? (
                <div className="form-stack">
                  <div className="detail-block admin-block">
                    <h3>Administration active</h3>
                    <p>Les actions sensibles sur les GN sont maintenant disponibles.</p>
                  </div>
                  {adminSuccess ? <div className="form-success">{adminSuccess}</div> : null}
                  <div className="form-actions">
                    <button
                      type="button"
                      className="button-secondary button-secondary-light"
                      onClick={() => {
                        void handleCloseAdminSession();
                      }}
                    >
                      Fermer l'administration
                    </button>
                  </div>
                </div>
              ) : (
                <form className="form-stack" onSubmit={handleOpenAdminSession}>
                  <div className="field">
                    <label htmlFor="admin-password">Mot de passe administrateur</label>
                    <input
                      id="admin-password"
                      type="password"
                      value={adminPassword}
                      onChange={(event) => setAdminPassword(event.target.value)}
                      disabled={isOpeningAdmin}
                    />
                  </div>
                  {adminError ? <div className="form-error">{adminError}</div> : null}
                  <div className="form-actions">
                    <button
                      type="submit"
                      className="button-primary"
                      disabled={isOpeningAdmin || !adminPassword.trim()}
                    >
                      {isOpeningAdmin ? "Ouverture..." : "Ouvrir l'administration"}
                    </button>
                  </div>
                </form>
              )}
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
          <p className="stat-helper">restauration reservee a l'administration</p>
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

        <div className="surface span-7">
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
                <button
                  type="button"
                  key={game.id}
                  className={`workspace-card${selectedGameId === game.id ? " active" : ""}`}
                  onClick={() => {
                    setSelectedGameId(game.id);
                    setArchiveError("");
                  }}
                >
                  <div className="workspace-card-header">
                    <h3>{game.name}</h3>
                    <span className="badge">{game.documentCount} docs</span>
                  </div>
                  <p>
                    {game.characterCount} personnages, {game.plotCount} intrigues,{" "}
                    {game.kraftCount} krafts suivis.
                  </p>
                </button>
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

          {isAdminSession ? (
            <div className="archive-section">
              <div className="section-header">
                <div>
                  <p className="section-kicker">Archives</p>
                  <h3 className="section-title section-title-small">GN archives</h3>
                  <p className="section-copy">
                    Les archives peuvent etre restaurees ou supprimees definitivement
                    depuis l'administration.
                  </p>
                </div>
              </div>
              {archivedGames.length ? (
                <div className="list-stack">
                  {archivedGames.map((game) => (
                    <button
                      type="button"
                      key={game.id}
                      className={`workspace-card workspace-card-archived${
                        selectedGameId === game.id ? " active" : ""
                      }`}
                      onClick={() => {
                        setSelectedGameId(game.id);
                        setAdminError("");
                        setAdminSuccess("");
                      }}
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
                    </button>
                  ))}
                </div>
              ) : (
                <div className="empty-state">Aucun GN archive pour le moment.</div>
              )}
            </div>
          ) : null}
        </div>

        <div className="surface span-5">
          <div className="section-header">
            <div>
              <p className="section-kicker">Acces</p>
              <h2 className="section-title">
                {selectedGame?.archived ? "Administration de l'archive" : "Entrer dans un espace"}
              </h2>
            </div>
          </div>
          {selectedGame ? (
            <div className="form-stack">
              {!selectedGame.archived ? (
                <>
                  <form className="form-stack" onSubmit={handleOpenGame}>
                    <div className="detail-block">
                      <h3>{selectedGame.name}</h3>
                      <p>
                        {isAuthenticated
                          ? "Ce GN est rattache a ton compte. Tu peux l'ouvrir directement."
                          : "Connecte-toi avec un compte orga membre de ce GN pour l'ouvrir."}
                      </p>
                    </div>
                    {archiveError ? <div className="form-error">{archiveError}</div> : null}
                    <div className="form-actions">
                      <button
                        type="submit"
                        className="button-primary"
                        disabled={isOpening || !isAuthenticated}
                      >
                        {isOpening ? "Ouverture..." : "Ouvrir l'espace"}
                      </button>
                    </div>
                  </form>

                  <form className="form-stack danger-stack" onSubmit={handleArchiveGame}>
                    <div className="detail-block danger-block">
                      <h3>Archiver ce GN</h3>
                      <p>
                        Cette action retire le GN des espaces actifs. Seul un admin du GN peut le
                        faire. Pour confirmer, recopier exactement son nom :{" "}
                        <strong>{selectedGame.name}</strong>
                      </p>
                    </div>
                    <div className="field">
                      <label htmlFor="archive-game-name">Nom du GN a retaper</label>
                      <input
                        id="archive-game-name"
                        value={archiveConfirmName}
                        onChange={(event) => setArchiveConfirmName(event.target.value)}
                        placeholder={selectedGame.name}
                        disabled={isArchiving}
                      />
                    </div>
                    {archiveError ? <div className="form-error">{archiveError}</div> : null}
                    <div className="form-actions">
                      <button
                        type="submit"
                        className="button-danger"
                        disabled={isArchiving || archiveConfirmName.trim() !== selectedGame.name}
                      >
                        {isArchiving ? "Archivage..." : "Archiver le GN"}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="form-stack admin-stack">
                  <div className="detail-block admin-block">
                    <h3>{selectedGame.name}</h3>
                    <p>
                      Ce GN est archive. Sa restauration et sa suppression definitive sont
                      reservees au mode administrateur.
                    </p>
                  </div>
                  {isAdminSession ? (
                    <div className="form-actions form-actions-column">
                      <button
                        type="button"
                        className="button-primary"
                        onClick={() => {
                          void handleRestoreGame();
                        }}
                        disabled={isRestoring}
                      >
                        {isRestoring ? "Restauration..." : "Restaurer le GN"}
                      </button>
                      <button
                        type="button"
                        className="button-danger"
                        onClick={() => {
                          void handleDeleteGamePermanently();
                        }}
                        disabled={isDeletingPermanently}
                      >
                        {isDeletingPermanently
                          ? "Suppression..."
                          : "Supprimer definitivement"}
                      </button>
                    </div>
                  ) : (
                    <div className="empty-state">
                      Activer l'administration pour restaurer ou supprimer cette archive.
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state">
              Selectionner un GN dans la liste pour l'ouvrir avec ton compte orga.
            </div>
          )}
        </div>
      </section>
    </>
  );
}
