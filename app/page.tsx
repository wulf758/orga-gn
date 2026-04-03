"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { useAppData } from "@/components/app-data-provider";
import { CreatePanel } from "@/components/create-panel";
import { PageHero } from "@/components/page-hero";

export default function HomePage() {
  const {
    archiveGame,
    closeAdminSession,
    createGame,
    currentGame,
    deleteGamePermanently,
    games,
    hasCurrentGame,
    isAdminSession,
    isReady,
    openAdminSession,
    openGame,
    resetGamePassword,
    restoreGame
  } = useAppData();
  const activeGames = useMemo(() => games.filter((game) => !game.archived), [games]);
  const archivedGames = useMemo(() => games.filter((game) => game.archived), [games]);

  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [accessPassword, setAccessPassword] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [archiveAccessPassword, setArchiveAccessPassword] = useState("");
  const [archiveConfirmName, setArchiveConfirmName] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [newGameName, setNewGameName] = useState("");
  const [newGamePassword, setNewGamePassword] = useState("");
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [accessError, setAccessError] = useState("");
  const [adminError, setAdminError] = useState("");
  const [createError, setCreateError] = useState("");
  const [archiveError, setArchiveError] = useState("");
  const [archiveSuccess, setArchiveSuccess] = useState("");
  const [adminSuccess, setAdminSuccess] = useState("");
  const [isOpening, setIsOpening] = useState(false);
  const [isOpeningAdmin, setIsOpeningAdmin] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
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
    setAccessError("");
    setArchiveError("");
    setArchiveSuccess("");
    setArchiveAccessPassword("");
    setArchiveConfirmName("");
    setAdminError("");
    setAdminSuccess("");
    setResetPasswordValue("");
  }, [selectedGameId]);

  useEffect(() => {
    if (accessError) {
      setAccessError("");
    }
  }, [accessPassword]);

  useEffect(() => {
    if (adminError) {
      setAdminError("");
    }
  }, [adminPassword, resetPasswordValue]);

  useEffect(() => {
    if (createError) {
      setCreateError("");
    }
  }, [invitePassword, newGameName, newGamePassword]);

  useEffect(() => {
    if (archiveError) {
      setArchiveError("");
    }
  }, [archiveAccessPassword, archiveConfirmName]);

  useEffect(() => {
    if (archiveSuccess) {
      setArchiveSuccess("");
    }
  }, [archiveAccessPassword, archiveConfirmName, accessPassword, selectedGameId]);

  useEffect(() => {
    if (adminSuccess) {
      setAdminSuccess("");
    }
  }, [adminPassword, resetPasswordValue, selectedGameId]);

  async function handleOpenGame(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedGame || selectedGame.archived || isOpening) return;
    setIsOpening(true);

    const result = await openGame({
      id: selectedGame.id,
      accessPassword
    });

    if (!result.ok) {
      setAccessError(result.error ?? "Acces refuse.");
      setIsOpening(false);
      return;
    }

    setAccessError("");
    setAccessPassword("");
    window.location.assign("/dashboard");
  }

  async function handleCreateGame(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isCreating) return;
    setIsCreating(true);

    const result = await createGame({
      invitePassword,
      name: newGameName,
      accessPassword: newGamePassword
    });

    if (!result.ok) {
      setCreateError(result.error ?? "Creation impossible.");
      setIsCreating(false);
      return;
    }

    setCreateError("");
    setInvitePassword("");
    setNewGameName("");
    setNewGamePassword("");
    window.location.assign("/dashboard");
  }

  async function handleArchiveGame(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedGame || selectedGame.archived || isArchiving) return;

    setIsArchiving(true);

    const result = await archiveGame({
      id: selectedGame.id,
      accessPassword: archiveAccessPassword,
      confirmName: archiveConfirmName
    });

    if (!result.ok) {
      setArchiveError(result.error ?? "Archivage impossible.");
      setIsArchiving(false);
      return;
    }

    setArchiveAccessPassword("");
    setArchiveConfirmName("");
    setArchiveError("");
    setArchiveSuccess(`Le GN "${selectedGame.name}" a ete archive.`);
    setAccessPassword("");
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

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedGame || isResettingPassword) return;

    setIsResettingPassword(true);

    const result = await resetGamePassword({
      id: selectedGame.id,
      nextAccessPassword: resetPasswordValue
    });

    if (!result.ok) {
      setAdminError(result.error ?? "Reinitialisation impossible.");
      setIsResettingPassword(false);
      return;
    }

    setResetPasswordValue("");
    setAdminError("");
    setAdminSuccess(`Le mot de passe du GN "${selectedGame.name}" a ete reinitialise.`);
    setIsResettingPassword(false);
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
      `Supprimer definitivement le GN "${selectedGame.name}" ? Cette action est irreversible.`
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
    setResetPasswordValue("");
  }

  function handleResumeCurrentGame() {
    window.location.assign("/dashboard");
  }

  return (
    <>
      <PageHero
        kicker="Accueil multi-GN"
        title="Choisir un GN en developpement ou en ouvrir un nouveau."
        copy="Chaque GN dispose de son espace de travail separe, avec le meme schema d'organisation, ses notes, ses personnages, ses intrigues et son pilotage."
        actions={
          hasCurrentGame && currentGame ? (
            <button type="button" className="button-primary" onClick={handleResumeCurrentGame}>
              Reprendre {currentGame.name}
            </button>
          ) : (
            <span className="button-primary">Creation protegee</span>
          )
        }
        aside={
          <div className="insight-column">
            <CreatePanel
              title="Creer un nouveau GN"
              description="La creation est reservee aux personnes disposant du mot de passe d'invitation, puis chaque GN recoit son mot de passe d'acces propre."
            >
              <form className="form-stack" onSubmit={handleCreateGame}>
                <div className="field">
                  <label htmlFor="invite-password">Mot de passe d'invitation</label>
                  <input
                    id="invite-password"
                    type="password"
                    value={invitePassword}
                    onChange={(event) => setInvitePassword(event.target.value)}
                    disabled={isCreating}
                  />
                </div>
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
                <div className="field">
                  <label htmlFor="new-game-password">Mot de passe d'acces</label>
                  <input
                    id="new-game-password"
                    type="password"
                    value={newGamePassword}
                    onChange={(event) => setNewGamePassword(event.target.value)}
                    placeholder="Mot de passe de cet espace"
                    disabled={isCreating}
                  />
                </div>
                {createError ? <div className="form-error">{createError}</div> : null}
                <div className="form-actions">
                  <button
                    type="submit"
                    className="button-primary"
                    disabled={
                      isCreating ||
                      !invitePassword.trim() ||
                      !newGameName.trim() ||
                      !newGamePassword.trim()
                    }
                  >
                    {isCreating ? "Creation..." : "Creer le GN"}
                  </button>
                </div>
              </form>
            </CreatePanel>

            <CreatePanel
              title="Administration des GN"
              description="Cet acces reserve permet de restaurer un GN archive, de le supprimer definitivement et de reinitialiser ses mots de passe."
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
                Chaque carte ouvre vers un espace de travail protege par mot de passe.
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
                    setAccessPassword("");
                    setAccessError("");
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
              Aucun GN actif pour l'instant. La creation d'un premier espace est
              disponible a droite.
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
                <div className="empty-state">Aucun GN archive pour l'instant.</div>
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
                        Entrer le mot de passe d&apos;acces de ce GN pour ouvrir son espace de
                        travail.
                      </p>
                    </div>
                    <div className="field">
                      <label htmlFor="access-password">Mot de passe d'acces</label>
                      <input
                        id="access-password"
                        type="password"
                        value={accessPassword}
                        onChange={(event) => setAccessPassword(event.target.value)}
                        disabled={isOpening}
                      />
                    </div>
                    {accessError ? <div className="form-error">{accessError}</div> : null}
                    <div className="form-actions">
                      <button
                        type="submit"
                        className="button-primary"
                        disabled={isOpening || !accessPassword.trim()}
                      >
                        {isOpening ? "Ouverture..." : "Ouvrir l'espace"}
                      </button>
                    </div>
                  </form>

                  <form className="form-stack danger-stack" onSubmit={handleArchiveGame}>
                    <div className="detail-block danger-block">
                      <h3>Archiver ce GN</h3>
                      <p>
                        Cette action retire le GN des espaces actifs. Pour confirmer,
                        recopier exactement son nom : <strong>{selectedGame.name}</strong>
                      </p>
                    </div>
                    <div className="field">
                      <label htmlFor="archive-access-password">Mot de passe d'acces du GN</label>
                      <input
                        id="archive-access-password"
                        type="password"
                        value={archiveAccessPassword}
                        onChange={(event) => setArchiveAccessPassword(event.target.value)}
                        disabled={isArchiving}
                      />
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
                        disabled={
                          isArchiving ||
                          !archiveAccessPassword.trim() ||
                          archiveConfirmName.trim() !== selectedGame.name
                        }
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

              {isAdminSession ? (
                <form className="form-stack admin-stack" onSubmit={handleResetPassword}>
                  <div className="detail-block admin-block">
                    <h3>Reinitialiser le mot de passe</h3>
                    <p>
                      Definir un nouveau mot de passe d&apos;acces pour{" "}
                      <strong>{selectedGame.name}</strong>.
                    </p>
                  </div>
                  <div className="field">
                    <label htmlFor="reset-password-value">Nouveau mot de passe d'acces</label>
                    <input
                      id="reset-password-value"
                      type="password"
                      value={resetPasswordValue}
                      onChange={(event) => setResetPasswordValue(event.target.value)}
                      disabled={isResettingPassword}
                    />
                  </div>
                  {adminError ? <div className="form-error">{adminError}</div> : null}
                  {adminSuccess ? <div className="form-success">{adminSuccess}</div> : null}
                  <div className="form-actions">
                    <button
                      type="submit"
                      className="button-primary"
                      disabled={isResettingPassword || !resetPasswordValue.trim()}
                    >
                      {isResettingPassword
                        ? "Reinitialisation..."
                        : "Reinitialiser le mot de passe"}
                    </button>
                  </div>
                </form>
              ) : null}
            </div>
          ) : (
            <div className="empty-state">
              Selectionner un GN dans la liste pour saisir son mot de passe d'acces.
            </div>
          )}
        </div>
      </section>
    </>
  );
}
