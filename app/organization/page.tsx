"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { useAppData } from "@/components/app-data-provider";
import { CreatePanel } from "@/components/create-panel";
import { PageHero } from "@/components/page-hero";

export default function OrganizationPage() {
  const { data, createCategory } = useAppData();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;
    createCategory({
      section: "organization",
      title: title.trim(),
      summary: summary.trim() || "Nouvelle categorie organisationnelle."
    });
    setTitle("");
    setSummary("");
  }

  return (
    <>
      <PageHero
        kicker="Organisation / categories"
        title="Des espaces orga clairs avant les actions."
        copy="L'entree Organisation affiche d'abord les categories. Chaque categorie ouvre ensuite sur ses taches, ses echeances et son planning."
        actions={
          <>
            <span className="hero-note hero-note-accent">Vue categories active</span>
            <span className="hero-note">Suppression confirmee</span>
          </>
        }
        aside={
          <CreatePanel title="Creer une categorie" description="Creation d'un espace comme Scenario ou Logistique.">
            <form className="form-stack" onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="org-category-title">Nom</label>
                <input id="org-category-title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="org-category-summary">Description</label>
                <textarea id="org-category-summary" value={summary} onChange={(e) => setSummary(e.target.value)} />
              </div>
              <div className="form-actions">
                <button type="submit" className="button-primary">Ajouter la categorie</button>
              </div>
            </form>
          </CreatePanel>
        }
      />

      <section className="surface">
        <div className="section-header">
          <div>
            <p className="section-kicker">Racine organisation</p>
            <h2 className="section-title">Categories</h2>
          </div>
        </div>
        <div className="list-stack">
          {data.organizationCategories.map((category) => {
            const count = data.tasks.filter((task) => task.categorySlug === category.slug).length;
            return (
              <Link href={`/organization/category/${category.slug}`} className="list-item" key={category.slug}>
                <h3>{category.title}</h3>
                <p>{category.summary}</p>
                <div className="meta-line">
                  <span>{count} tache(s)</span>
                  <span>{category.updatedAt}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
