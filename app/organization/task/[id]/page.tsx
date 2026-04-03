"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";

import { useAppData } from "@/components/app-data-provider";
import { PageHero } from "@/components/page-hero";
import { RichTextPreview } from "@/components/rich-text-preview";
import { StatusPill } from "@/components/status-pill";
import { TagBadge } from "@/components/tag-badge";
import { TagPicker } from "@/components/tag-picker";
import { formatDateLabel, formatReminder } from "@/lib/date-utils";

export default function OrganizationTaskDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data, deleteTask, updateTask } = useAppData();
  const task = data.tasks.find((entry) => entry.id === params.id);
  const contentRef = useRef<HTMLTextAreaElement | null>(null);

  const [title, setTitle] = useState(task?.title ?? "");
  const [summary, setSummary] = useState(task?.summary ?? "");
  const [content, setContent] = useState(task?.content ?? "");
  const [owner, setOwner] = useState(task?.owner ?? "");
  const [dueDate, setDueDate] = useState(task?.dueDate ?? "");
  const [status, setStatus] = useState<"En cours" | "Bloque" | "Planifie">(task?.status ?? "En cours");
  const [selectedTags, setSelectedTags] = useState<string[]>(task?.tags ?? []);
  const [isEditing, setIsEditing] = useState(false);

  if (!task) {
    return <div className="empty-state">Fiche organisation introuvable.</div>;
  }

  const currentTask = task;
  const category = data.organizationCategories.find((entry) => entry.slug === currentTask.categorySlug);

  function toggleTag(tag: string) {
    setSelectedTags((current) =>
      current.includes(tag) ? current.filter((entry) => entry !== tag) : [...current, tag]
    );
  }

  function insertAroundSelection(before: string, after = before) {
    const textarea = contentRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.slice(start, end);
    const nextValue = content.slice(0, start) + before + selectedText + after + content.slice(end);
    setContent(nextValue);
  }

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateTask({
      id: currentTask.id,
      title,
      summary,
      content,
      tags: selectedTags,
      owner,
      dueDate: dueDate || undefined,
      status
    });
    setIsEditing(false);
  }

  function handleCancel() {
    setTitle(currentTask.title);
    setSummary(currentTask.summary);
    setContent(currentTask.content);
    setOwner(currentTask.owner);
    setDueDate(currentTask.dueDate ?? "");
    setStatus(currentTask.status);
    setSelectedTags(currentTask.tags);
    setIsEditing(false);
  }

  function handleDelete() {
    if (!window.confirm(`Supprimer la fiche "${currentTask.title}" ?`)) return;
    deleteTask(currentTask.id);
    router.push(`/organization/category/${currentTask.categorySlug}`);
  }

  return (
    <>
      <PageHero
        kicker={`Fiche organisation / ${category?.title ?? currentTask.categorySlug}`}
        title={currentTask.title}
        copy={currentTask.summary}
        actions={
          <>
            <Link href={`/organization/category/${currentTask.categorySlug}`} className="button-primary">
              Retour a la categorie
            </Link>
            <button type="button" className="button-secondary" onClick={() => setIsEditing((value) => !value)}>
              {isEditing ? "Quitter l'edition" : "Mode editeur"}
            </button>
            <button type="button" className="button-secondary" onClick={handleDelete}>
              Supprimer la fiche
            </button>
          </>
        }
        aside={
          <div className="detail-grid">
            <div className="detail-block">
              <h3>Statut</h3>
              <div className="meta-line">
                <StatusPill tone={currentTask.status === "Bloque" ? "warning" : undefined}>{currentTask.status}</StatusPill>
              </div>
            </div>
            <div className="detail-block">
              <h3>Echeance</h3>
              <p>{formatDateLabel(currentTask.dueDate, currentTask.dueLabel)}</p>
              <p className="meta-line" style={{ marginTop: 8 }}>
                <span>{formatReminder(currentTask.dueDate)}</span>
              </p>
            </div>
            <div className="detail-block">
              <h3>Tags</h3>
              <div className="badge-row" style={{ marginTop: 12 }}>
                {currentTask.tags.map((tag) => (
                  <TagBadge key={tag} tag={tag} definitions={data.tagsRegistry} />
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
                  <button type="submit" className="icon-action confirm" aria-label="Valider">✓</button>
                  <button type="button" className="icon-action cancel" aria-label="Annuler" onClick={handleCancel}>✕</button>
                </div>
              </div>
              <div className="form-stack">
                <div className="field">
                  <label htmlFor="task-edit-title">Titre</label>
                  <input id="task-edit-title" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="task-edit-summary">Resume</label>
                  <textarea id="task-edit-summary" value={summary} onChange={(e) => setSummary(e.target.value)} />
                </div>
                <div className="surface-grid" style={{ marginTop: 0 }}>
                  <div className="span-4 field">
                    <label htmlFor="task-edit-owner">Responsable</label>
                    <input id="task-edit-owner" value={owner} onChange={(e) => setOwner(e.target.value)} />
                  </div>
                  <div className="span-4 field">
                    <label htmlFor="task-edit-due">Echeance</label>
                    <input id="task-edit-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                  </div>
                  <div className="span-4 field">
                    <label htmlFor="task-edit-status">Statut</label>
                    <select id="task-edit-status" value={status} onChange={(e) => setStatus(e.target.value as "En cours" | "Bloque" | "Planifie")}>
                      <option value="En cours">En cours</option>
                      <option value="Bloque">Bloque</option>
                      <option value="Planifie">Planifie</option>
                    </select>
                  </div>
                </div>
                <div className="field">
                  <label>Tags</label>
                  <TagPicker
                    definitions={data.tagsRegistry}
                    selectedTags={selectedTags}
                    onToggle={toggleTag}
                  />
                </div>
                <div className="field">
                  <label htmlFor="task-edit-content">Contenu</label>
                  <div className="editor-toolbar note-toolbar">
                    <button type="button" className="editor-button" onClick={() => insertAroundSelection("**")}>Gras</button>
                    <button type="button" className="editor-button" onClick={() => insertAroundSelection("__")}>Souligne</button>
                    <button type="button" className="editor-button" onClick={() => insertAroundSelection("*")}>Italique</button>
                  </div>
                  <textarea id="task-edit-content" ref={contentRef} className="note-content-editor" value={content} onChange={(e) => setContent(e.target.value)} />
                </div>
              </div>
            </form>
          ) : (
            <div className="note-read-shell">
              <div className="note-read-header">
                <h2>{currentTask.title}</h2>
                <button type="button" className="editor-button" onClick={() => setIsEditing(true)}>Modifier</button>
              </div>
              <p className="section-copy">{currentTask.summary}</p>
              <div className="note-read-content">
                <RichTextPreview text={currentTask.content} />
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
