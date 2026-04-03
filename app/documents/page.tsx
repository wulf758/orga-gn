"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { useAppData } from "@/components/app-data-provider";
import { CreatePanel } from "@/components/create-panel";
import { PageHero } from "@/components/page-hero";
import { TagBadge } from "@/components/tag-badge";

export default function DocumentsPage() {
  const { data, createDocument } = useAppData();
  const rootFolders = data.documents.filter(
    (document) => document.kind === "folder" && !document.parentSlug
  );
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState("Racine");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) {
      return;
    }

    createDocument({
      kind: "folder",
      title: title.trim(),
      summary: summary.trim() || "Nouveau dossier a organiser.",
      category: category.trim() || "Racine"
    });

    setTitle("");
    setSummary("");
    setCategory("Racine");
  }

  return (
    <>
      <PageHero
        kicker="Documents / arborescence"
        title="Des dossiers d'abord, puis les notes a l'interieur."
        copy="L'entree Documents affiche maintenant seulement les dossiers racine. Chaque dossier devient un espace sectorise avec ses propres notes, sous-dossiers et actions."
        actions={
          <>
            <span className="hero-note hero-note-accent">Vue dossiers active</span>
            <span className="hero-note">Suppression confirmee</span>
          </>
        }
        aside={
          <CreatePanel
            title="Creer un dossier"
            description="Cette vue accueille uniquement les dossiers racine."
          >
            <form className="form-stack" onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="folder-title">Nom du dossier</label>
                <input
                  id="folder-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Exemple : Noblesse"
                />
              </div>
              <div className="field">
                <label htmlFor="folder-summary">Description</label>
                <textarea
                  id="folder-summary"
                  value={summary}
                  onChange={(event) => setSummary(event.target.value)}
                  placeholder="A quoi sert ce dossier ?"
                />
              </div>
              <div className="field">
                <label htmlFor="folder-category">Categorie</label>
                <input
                  id="folder-category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="button-primary">
                  Ajouter le dossier
                </button>
              </div>
            </form>
          </CreatePanel>
        }
      />

      <section className="surface">
        <div className="section-header">
          <div>
            <p className="section-kicker">Racine documentaire</p>
            <h2 className="section-title">Dossiers</h2>
          </div>
        </div>
        <div className="list-stack">
          {rootFolders.map((folder) => {
            const childCount = data.documents.filter(
              (document) => document.parentSlug === folder.slug
            ).length;

            return (
              <Link href={`/documents/${folder.slug}`} className="list-item" key={folder.slug}>
                <h3>{folder.title}</h3>
                <p>{folder.summary}</p>
                <div className="meta-line">
                  <span>{folder.category}</span>
                  <span>{childCount} element(s)</span>
                  <span>{folder.updatedAt}</span>
                </div>
                <div className="badge-row" style={{ marginTop: 12 }}>
                  {folder.tags.map((tag) => (
                    <TagBadge key={tag} tag={tag} definitions={data.tagsRegistry} />
                  ))}
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
