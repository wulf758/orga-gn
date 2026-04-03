"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";

import { useAppData } from "@/components/app-data-provider";
import { PageHero } from "@/components/page-hero";
import { RichTextPreview } from "@/components/rich-text-preview";
import { StatusPill } from "@/components/status-pill";

const PLOT_TAG_SUGGESTIONS = [
  "politique",
  "mystere",
  "rituel",
  "quete",
  "ordre",
  "maladie",
  "secret",
  "revelation",
  "conflit",
  "alliance",
  "urgence",
  "logistique"
];

export default function PlotDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data, deletePlot, updatePlot } = useAppData();
  const plot = data.plots.find((entry) => entry.id === params.id);
  const contentTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [title, setTitle] = useState(plot?.title ?? "");
  const [summary, setSummary] = useState(plot?.summary ?? "");
  const [content, setContent] = useState(plot?.content ?? "");
  const [stage, setStage] = useState<"Solide" | "A consolider" | "A lancer">(
    plot?.stage ?? "A lancer"
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(plot?.tags ?? []);
  const [isEditing, setIsEditing] = useState(false);

  if (!plot) {
    return <div className="empty-state">Cette intrigue est introuvable.</div>;
  }

  const currentPlot = plot;
  const category = data.plotCategories.find((entry) => entry.slug === currentPlot.categorySlug);

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;

    updatePlot({
      id: currentPlot.id,
      title: title.trim(),
      summary: summary.trim() || "Intrigue mise a jour.",
      content,
      stage,
      tags: selectedTags
    });

    setIsEditing(false);
  }

  function handleDelete() {
    if (!window.confirm(`Supprimer l'intrigue "${currentPlot.title}" ?`)) return;
    deletePlot(currentPlot.id);
    router.push(`/plots/category/${currentPlot.categorySlug}`);
  }

  function handleCancel() {
    setTitle(currentPlot.title);
    setSummary(currentPlot.summary);
    setContent(currentPlot.content);
    setStage(currentPlot.stage);
    setSelectedTags(currentPlot.tags);
    setIsEditing(false);
  }

  function toggleTag(tag: string) {
    setSelectedTags((current) =>
      current.includes(tag)
        ? current.filter((entry) => entry !== tag)
        : [...current, tag]
    );
  }

  function insertAroundSelection(before: string, after = before) {
    const textarea = contentTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.slice(start, end);
    const nextValue =
      content.slice(0, start) + before + selectedText + after + content.slice(end);

    setContent(nextValue);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    });
  }

  return (
    <>
      <PageHero
        kicker={`Fiche intrigue / ${category?.title ?? currentPlot.categorySlug}`}
        title={currentPlot.title}
        copy={currentPlot.summary}
        actions={
          <>
            <Link href={`/plots/category/${currentPlot.categorySlug}`} className="button-primary">
              Retour a la categorie
            </Link>
            <button
              type="button"
              className="button-secondary"
              onClick={() => setIsEditing((value) => !value)}
            >
              {isEditing ? "Quitter l'edition" : "Mode editeur"}
            </button>
            <button type="button" className="button-secondary" onClick={handleDelete}>
              Supprimer l'intrigue
            </button>
          </>
        }
        aside={
          <div className="detail-grid">
            <div className="detail-block">
              <h3>Maturite</h3>
              <div className="meta-line">
                <StatusPill tone={currentPlot.stage === "Solide" ? "success" : undefined}>
                  {currentPlot.stage}
                </StatusPill>
              </div>
            </div>
            <div className="detail-block">
              <h3>Tags</h3>
              <div className="badge-row" style={{ marginTop: 12 }}>
                {currentPlot.tags.map((tag) => (
                  <span className="badge" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        }
      />

      <section className="note-page-stack">
        <div className="editor-block note-editor-block">
          {isEditing ? (
            <form className="note-edit-shell" onSubmit={handleSave}>
              <div className="note-edit-topbar">
                <span className="chip">Edition en cours</span>
                <div className="note-edit-actions">
                  <button type="submit" className="icon-action confirm" aria-label="Valider">
                    ✓
                  </button>
                  <button type="button" className="icon-action cancel" aria-label="Annuler" onClick={handleCancel}>
                    ✕
                  </button>
                </div>
              </div>
              <div className="form-stack">
                <div className="field">
                  <label htmlFor="plot-edit-title">Titre</label>
                  <input id="plot-edit-title" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="plot-edit-summary">Resume</label>
                  <textarea id="plot-edit-summary" value={summary} onChange={(e) => setSummary(e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="plot-edit-stage">Maturite</label>
                  <select id="plot-edit-stage" value={stage} onChange={(e) => setStage(e.target.value as "Solide" | "A consolider" | "A lancer")}>
                    <option value="A lancer">A lancer</option>
                    <option value="A consolider">A consolider</option>
                    <option value="Solide">Solide</option>
                  </select>
                </div>
                <div className="field">
                  <label>Tags</label>
                  <div className="tag-picker">
                    {PLOT_TAG_SUGGESTIONS.map((tag) => {
                      const isActive = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          className={`tag-toggle${isActive ? " active" : ""}`}
                          onClick={() => toggleTag(tag)}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="plot-edit-content">Contenu</label>
                  <div className="editor-toolbar note-toolbar">
                    <button type="button" className="editor-button" onClick={() => insertAroundSelection("**")}>
                      Gras
                    </button>
                    <button type="button" className="editor-button" onClick={() => insertAroundSelection("__")}>
                      Souligne
                    </button>
                    <button type="button" className="editor-button" onClick={() => insertAroundSelection("*")}>
                      Italique
                    </button>
                  </div>
                  <textarea
                    id="plot-edit-content"
                    ref={contentTextareaRef}
                    className="note-content-editor"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                </div>
              </div>
            </form>
          ) : (
            <div className="note-read-shell">
              <div className="note-read-header">
                <h2>{currentPlot.title}</h2>
                <button type="button" className="editor-button" onClick={() => setIsEditing(true)}>
                  Modifier
                </button>
              </div>
              <p className="section-copy">{currentPlot.summary}</p>
              <div className="note-read-content">
                <RichTextPreview text={currentPlot.content} />
              </div>
            </div>
          )}
        </div>

        <div className="surface-grid">
          <div className="detail-block span-6">
            <h3>Temps narratifs</h3>
            {currentPlot.beats.length ? (
              <ul>
                {currentPlot.beats.map((beat) => (
                  <li key={beat}>{beat}</li>
                ))}
              </ul>
            ) : (
              <p>Aucun temps narratif saisi pour l'instant.</p>
            )}
          </div>

          <div className="detail-block span-6">
            <h3>Personnages impliques</h3>
            <div className="badge-row" style={{ marginTop: 12 }}>
              {currentPlot.characters.length ? (
                currentPlot.characters.map((character) => (
                  <Link href={`/characters/${character}`} className="badge" key={character}>
                    {character}
                  </Link>
                ))
              ) : (
                <p>Aucun personnage relie pour l'instant.</p>
              )}
            </div>
          </div>

        </div>
      </section>
    </>
  );
}
