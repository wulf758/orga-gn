"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { useAppData } from "@/components/app-data-provider";
import { CreatePanel } from "@/components/create-panel";
import { PageHero } from "@/components/page-hero";

export default function PlotsPage() {
  const { data, createCategory } = useAppData();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;

    createCategory({
      section: "plots",
      title: title.trim(),
      summary: summary.trim() || "Nouvelle intrigue racine a developper."
    });

    setTitle("");
    setSummary("");
  }

  return (
    <>
      <PageHero
        kicker="Intrigues / racines"
        title="Des intrigues racines pour organiser tout le reste."
        copy="Chaque intrigue racine sert d'espace de travail principal. Son contenu regroupe ensuite les fiches, les jalons et les elements lies."
        actions={
          <>
            <span className="button-primary">Vue intrigues active</span>
            <span className="button-secondary">Suppression confirmee</span>
          </>
        }
        aside={
          <CreatePanel
            title="Creer une intrigue"
            description="Creation d'une intrigue racine comme Politique, Mystere ou Logistique de jeu."
          >
            <form className="form-stack" onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="plot-category-title">Nom</label>
                <input
                  id="plot-category-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="plot-category-summary">Description</label>
                <textarea
                  id="plot-category-summary"
                  value={summary}
                  onChange={(event) => setSummary(event.target.value)}
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="button-primary">
                  Ajouter l'intrigue
                </button>
              </div>
            </form>
          </CreatePanel>
        }
      />

      <section className="surface">
        <div className="section-header">
          <div>
            <p className="section-kicker">Racine intrigues</p>
            <h2 className="section-title">Intrigues</h2>
          </div>
        </div>
        <div className="list-stack">
          {data.plotCategories.map((category) => {
            const count = data.plots.filter(
              (plot) => plot.categorySlug === category.slug
            ).length;

            return (
              <Link
                href={`/plots/category/${category.slug}`}
                className="list-item"
                key={category.slug}
              >
                <h3>{category.title}</h3>
                <p>{category.summary}</p>
                <div className="meta-line">
                  <span>{count} fiche(s) a l'interieur</span>
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
