"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { useAppData } from "@/components/app-data-provider";
import { CreatePanel } from "@/components/create-panel";
import { PageHero } from "@/components/page-hero";
import { StatusPill } from "@/components/status-pill";
import { TagBadge } from "@/components/tag-badge";
import { buildDeleteConfirmation } from "@/lib/ui-copy";

export default function PlotCategoryPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { data, createPlot, deleteCategory, updateCategory } = useAppData();
  const category = data.plotCategories.find((entry) => entry.slug === params.slug);
  const [title, setTitle] = useState(category?.title ?? "");
  const [summary, setSummary] = useState(category?.summary ?? "");
  const [plotTitle, setPlotTitle] = useState("");
  const [plotSummary, setPlotSummary] = useState("");
  const [stage, setStage] = useState<"Solide" | "A consolider" | "A lancer">("A lancer");

  if (!category) {
    return <div className="empty-state">Categorie d'intrigues introuvable.</div>;
  }

  const currentCategory = category;
  const plots = data.plots.filter((plot) => plot.categorySlug === currentCategory.slug);

  function handleCategorySave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;
    updateCategory({ section: "plots", slug: currentCategory.slug, title: title.trim(), summary });
  }

  function handleCategoryDelete() {
    if (
      !window.confirm(
        buildDeleteConfirmation({
          entityLabel: "la categorie",
          name: currentCategory.title,
          consequence: "Toutes les intrigues de cette categorie seront egalement supprimees."
        })
      )
    )
      return;
    deleteCategory("plots", currentCategory.slug);
    router.push("/plots");
  }

  function handlePlotCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!plotTitle.trim()) return;
    createPlot({
      title: plotTitle.trim(),
      categorySlug: currentCategory.slug,
      summary: plotSummary.trim() || "Nouvelle intrigue a structurer.",
      stage
    });
    setPlotTitle("");
    setPlotSummary("");
    setStage("A lancer");
  }

  return (
    <>
      <PageHero
        kicker="Categorie intrigue"
        title={currentCategory.title}
        copy={currentCategory.summary}
        actions={
          <>
            <Link href="/plots" className="button-primary">Retour aux categories</Link>
            <button type="button" className="button-secondary" onClick={handleCategoryDelete}>
              Supprimer la categorie
            </button>
          </>
        }
        aside={
          <CreatePanel title="Modifier la categorie" description="Nom et description de la categorie.">
            <form className="form-stack" onSubmit={handleCategorySave}>
              <div className="field">
                <label htmlFor="plot-category-edit-title">Nom</label>
                <input id="plot-category-edit-title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="plot-category-edit-summary">Description</label>
                <textarea id="plot-category-edit-summary" value={summary} onChange={(e) => setSummary(e.target.value)} />
              </div>
              <div className="form-actions">
                <button type="submit" className="button-primary">Enregistrer les modifications</button>
              </div>
            </form>
          </CreatePanel>
        }
      />

      <section className="two-column">
        <div className="surface">
          <div className="section-header">
            <div>
              <p className="section-kicker">Contenu</p>
              <h2 className="section-title">Intrigues</h2>
            </div>
          </div>
          <div className="list-stack">
            {plots.map((plot) => (
              <Link href={`/plots/${plot.id}`} className="list-item" key={plot.id}>
                <h3>{plot.title}</h3>
                <p>{plot.summary}</p>
                <div className="meta-line">
                  <StatusPill tone={plot.stage === "Solide" ? "success" : undefined}>
                    {plot.stage}
                  </StatusPill>
                  <span>{plot.characters.length} personnage(s)</span>
                </div>
                <div className="badge-row" style={{ marginTop: 12 }}>
                  {plot.tags.map((tag) => (
                    <TagBadge key={tag} tag={tag} definitions={data.tagsRegistry} />
                  ))}
                </div>
              </Link>
            ))}
            {!plots.length ? <div className="empty-state">Aucune intrigue dans cette categorie pour le moment.</div> : null}
          </div>
        </div>

        <div className="detail-grid">
          <CreatePanel title="Creer une intrigue" description="Ajoute une intrigue dans cette categorie.">
            <form className="form-stack" onSubmit={handlePlotCreate}>
              <div className="field">
                <label htmlFor="plot-title-create">Titre</label>
                <input id="plot-title-create" value={plotTitle} onChange={(e) => setPlotTitle(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="plot-summary-create">Resume</label>
                <textarea id="plot-summary-create" value={plotSummary} onChange={(e) => setPlotSummary(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="plot-stage-create">Statut</label>
                <select id="plot-stage-create" value={stage} onChange={(e) => setStage(e.target.value as "Solide" | "A consolider" | "A lancer")}>
                  <option value="A lancer">A lancer</option>
                  <option value="A consolider">A consolider</option>
                  <option value="Solide">Solide</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="submit" className="button-primary">Creer l'intrigue</button>
              </div>
            </form>
          </CreatePanel>
        </div>
      </section>
    </>
  );
}
