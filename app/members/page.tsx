"use client";

import Link from "next/link";

import { useAppData } from "@/components/app-data-provider";
import { PageHero } from "@/components/page-hero";

export default function MembersPage() {
  const { currentGame, workspaceAccess } = useAppData();
  const manageHref =
    currentGame && workspaceAccess?.role === "admin"
      ? `/games/${currentGame.id}/manage`
      : "/";

  return (
    <>
      <PageHero
        kicker="Gestion du GN"
        title="La gestion des membres a ete regroupee."
        copy="Les roles, le renommage du GN et l'archivage passent maintenant par une page de gestion unique, accessible depuis l'accueil des GN."
        actions={
          <div className="form-actions">
            <Link href={manageHref} className="button-primary">
              {currentGame && workspaceAccess?.role === "admin"
                ? "Ouvrir la gestion du GN"
                : "Retour a l'accueil des GN"}
            </Link>
          </div>
        }
      />

      <section className="surface-grid">
        <div className="surface span-12 empty-state">
          {currentGame && workspaceAccess?.role === "admin"
            ? "Le panneau Membres autonome n'est plus utilise. Ouvre la page Gestion du GN pour administrer l'equipe, renommer l'espace ou l'archiver."
            : "Cette page n'est plus utilisee. Reviens a l'accueil pour choisir un GN, puis ouvre sa page Gestion si tu en es admin."}
        </div>
      </section>
    </>
  );
}
