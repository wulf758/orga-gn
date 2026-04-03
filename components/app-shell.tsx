"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAppData } from "@/components/app-data-provider";
import { SidebarNavLink } from "@/components/sidebar-nav-link";
import { navigation } from "@/lib/data";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { data, hasCurrentGame, isReady, leaveGame, updateGameName } = useAppData();
  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState(data.gameName);
  const [isLeavingWorkspace, setIsLeavingWorkspace] = useState(false);
  const isPublicHome = pathname === "/";

  useEffect(() => {
    setDraftName(data.gameName);
  }, [data.gameName]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draftName.trim()) return;

    const result = await updateGameName(draftName);
    if (result.ok) {
      setIsEditingName(false);
    }
  }

  async function handleLeaveWorkspace() {
    setIsLeavingWorkspace(true);

    try {
      await leaveGame();
      window.location.assign("/");
    } finally {
      setIsLeavingWorkspace(false);
    }
  }

  if (isPublicHome) {
    return (
      <main className="public-shell">
        <div className="public-frame">{children}</div>
      </main>
    );
  }

  if (!isReady) {
    return (
      <main className="public-shell">
        <div className="public-frame">
          <div className="empty-state">Chargement des espaces GN...</div>
        </div>
      </main>
    );
  }

  if (!hasCurrentGame) {
    return (
      <main className="public-shell">
        <div className="public-frame">
          <div className="empty-state">
            Aucun espace de travail n&apos;est ouvert pour l&apos;instant.
            <div className="form-actions" style={{ marginTop: 14 }}>
              <Link href="/" className="button-primary">
                Retour a l&apos;accueil des GN
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <span className="brand-mark">Atelier orga</span>
        <div className="brand-title-row">
          <h1 className="brand-title">{data.gameName}</h1>
          <button
            type="button"
            className="brand-settings-button"
            onClick={() => setIsEditingName((current) => !current)}
            aria-label="Modifier le nom du GN"
            title="Modifier le nom du GN"
          >
            ⚙
          </button>
        </div>
        {isEditingName ? (
          <form className="brand-settings-panel" onSubmit={handleSubmit}>
            <label htmlFor="game-name-input" className="brand-settings-label">
              Nom du GN
            </label>
            <input
              id="game-name-input"
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              className="brand-settings-input"
            />
            <div className="brand-settings-actions">
              <button type="submit" className="button-primary">
                Enregistrer
              </button>
              <button
                type="button"
                className="button-secondary"
                onClick={() => {
                  setDraftName(data.gameName);
                  setIsEditingName(false);
                }}
              >
                Annuler
              </button>
            </div>
          </form>
        ) : null}
        <div className="brand-workspace-actions">
          <Link href="/" className="chip">
            Changer de GN
          </Link>
          <button
            type="button"
            className="sidebar-ghost-button"
            onClick={() => {
              void handleLeaveWorkspace();
            }}
            disabled={isLeavingWorkspace}
          >
            {isLeavingWorkspace ? "Fermeture..." : "Fermer l'espace"}
          </button>
        </div>

        <div className="sidebar-section">
          <p className="sidebar-label">Navigation</p>
          <nav>
            <ul className="nav-list">
              {navigation.map((item) => (
                <li key={item.href}>
                  <SidebarNavLink item={item} />
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </aside>

      <main className="main-panel">
        <div className="page-frame">{children}</div>
      </main>
    </div>
  );
}
