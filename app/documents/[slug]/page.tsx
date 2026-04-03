"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";

import { useAppData } from "@/components/app-data-provider";
import { CreatePanel } from "@/components/create-panel";
import { PageHero } from "@/components/page-hero";
import { RichTextPreview } from "@/components/rich-text-preview";
import { TagBadge } from "@/components/tag-badge";
import { TagPicker } from "@/components/tag-picker";

export default function DocumentDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { data, createDocument, deleteDocument, updateDocument } = useAppData();
  const document = data.documents.find((entry) => entry.slug === params.slug);

  const [title, setTitle] = useState(document?.title ?? "");
  const [summary, setSummary] = useState(document?.summary ?? "");
  const [category, setCategory] = useState(document?.category ?? "");
  const [contentText, setContentText] = useState(
    document?.content.flatMap((section) => section.paragraphs).join("\n\n") ?? ""
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(document?.tags ?? []);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteSummary, setNewNoteSummary] = useState("");
  const contentTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  if (!document) {
    return (
      <div className="empty-state">
        Cet element est introuvable. Il a peut-etre ete supprime.
      </div>
    );
  }

  const currentDocument = document;

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) {
      return;
    }

    updateDocument({
      slug: currentDocument.slug,
      title: title.trim(),
      summary: summary.trim() || "Element documentaire mis a jour.",
      category: category.trim() || "Divers",
      contentText,
      tags: selectedTags
    });

    setIsEditingNote(false);
  }

  function handleDelete() {
    const label =
      currentDocument.kind === "folder"
        ? `Supprimer le dossier "${currentDocument.title}" et tout son contenu ?`
        : `Supprimer la note "${currentDocument.title}" ?`;

    if (!window.confirm(label)) {
      return;
    }

    deleteDocument(currentDocument.slug);
    router.push("/documents");
  }

  function handleCancelNoteEdit() {
    setTitle(currentDocument.title);
    setSummary(currentDocument.summary);
    setCategory(currentDocument.category);
    setSelectedTags(currentDocument.tags);
    setContentText(currentDocument.content.flatMap((section) => section.paragraphs).join("\n\n"));
    setIsEditingNote(false);
  }

  function toggleTag(tag: string) {
    setSelectedTags((current) =>
      current.includes(tag)
        ? current.filter((entry) => entry !== tag)
        : [...current, tag]
    );
  }

  function handleCreateNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!newNoteTitle.trim()) {
      return;
    }

    createDocument({
      kind: "note",
      title: newNoteTitle.trim(),
      summary: newNoteSummary.trim() || "Nouvelle note a completer.",
      category: currentDocument.category,
      parentSlug: currentDocument.slug
    });

    setNewNoteTitle("");
    setNewNoteSummary("");
  }

  function insertAroundSelection(before: string, after = before) {
    const textarea = contentTextareaRef.current;

    if (!textarea) {
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = contentText.slice(start, end);
    const nextValue =
      contentText.slice(0, start) +
      before +
      selectedText +
      after +
      contentText.slice(end);

    setContentText(nextValue);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        end + before.length
      );
    });
  }

  if (currentDocument.kind === "folder") {
    const childFolders = data.documents.filter(
      (entry) => entry.kind === "folder" && entry.parentSlug === currentDocument.slug
    );
    const childNotes = data.documents.filter(
      (entry) => entry.kind === "note" && entry.parentSlug === currentDocument.slug
    );

    return (
      <>
        <PageHero
          kicker="Dossier"
          title={currentDocument.title}
          copy={currentDocument.summary}
          actions={
            <>
              <Link href="/documents" className="button-primary">
                Retour aux dossiers
              </Link>
              <button type="button" className="button-secondary" onClick={handleDelete}>
                Supprimer le dossier
              </button>
            </>
          }
          aside={
          <CreatePanel
              title="Modifier le dossier"
              description="Nom, description et categorie du dossier."
            >
              <form className="form-stack" onSubmit={handleSave}>
                <div className="field">
                  <label htmlFor="folder-edit-title">Nom</label>
                  <input
                    id="folder-edit-title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="folder-edit-summary">Description</label>
                  <textarea
                    id="folder-edit-summary"
                    value={summary}
                    onChange={(event) => setSummary(event.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="folder-edit-category">Categorie</label>
                  <input
                    id="folder-edit-category"
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="button-primary">
                    Modifier le dossier
                  </button>
                </div>
              </form>
            </CreatePanel>
          }
        />

        <section className="two-column">
          <div className="surface">
            <div className="section-header">
              <div>
                <p className="section-kicker">Contenu du dossier</p>
                <h2 className="section-title">Sous-dossiers et notes</h2>
              </div>
            </div>

            {childFolders.length ? (
              <div className="list-stack">
                {childFolders.map((entry) => (
                  <Link href={`/documents/${entry.slug}`} className="list-item" key={entry.slug}>
                    <h3>{entry.title}</h3>
                    <p>{entry.summary}</p>
                    <div className="meta-line">
                      <span>Dossier</span>
                      <span>{entry.updatedAt}</span>
                    </div>
                    <div className="badge-row" style={{ marginTop: 12 }}>
                      {entry.tags.map((tag) => (
                        <TagBadge key={tag} tag={tag} definitions={data.tagsRegistry} />
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            ) : null}

            {childNotes.length ? (
              <div className="list-stack" style={{ marginTop: childFolders.length ? 12 : 0 }}>
                {childNotes.map((entry) => (
                  <Link href={`/documents/${entry.slug}`} className="list-item" key={entry.slug}>
                    <h3>{entry.title}</h3>
                    <p>{entry.summary}</p>
                    <div className="meta-line">
                      <span>Note</span>
                      <span>{entry.updatedAt}</span>
                    </div>
                    <div className="badge-row" style={{ marginTop: 12 }}>
                      {entry.tags.map((tag) => (
                        <TagBadge key={tag} tag={tag} definitions={data.tagsRegistry} />
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            ) : null}

            {!childFolders.length && !childNotes.length ? (
              <div className="empty-state">Ce dossier est vide pour l'instant.</div>
            ) : null}
          </div>

          <div className="detail-grid">
            <CreatePanel
              title="Creer une note"
              description="Creation d'une note dans le dossier en cours."
            >
              <form className="form-stack" onSubmit={handleCreateNote}>
                <div className="field">
                  <label htmlFor="note-create-title">Titre</label>
                  <input
                    id="note-create-title"
                    value={newNoteTitle}
                    onChange={(event) => setNewNoteTitle(event.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="note-create-summary">Resume</label>
                  <textarea
                    id="note-create-summary"
                    value={newNoteSummary}
                    onChange={(event) => setNewNoteSummary(event.target.value)}
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="button-primary">
                    Ajouter la note
                  </button>
                </div>
              </form>
            </CreatePanel>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHero
        kicker="Note"
        title={currentDocument.title}
        copy={currentDocument.summary}
        actions={
          <>
            <Link href={currentDocument.parentSlug ? `/documents/${currentDocument.parentSlug}` : "/documents"} className="button-primary">
              Retour
            </Link>
            <button
              type="button"
              className="button-secondary"
              onClick={() => setIsEditingNote((value) => !value)}
            >
              {isEditingNote ? "Quitter l'edition" : "Mode editeur"}
            </button>
            <button type="button" className="button-secondary" onClick={handleDelete}>
              Supprimer la note
            </button>
          </>
        }
        aside={
          <div className="detail-grid">
            <div className="detail-block">
              <h3>Metadonnees</h3>
              <div className="meta-line">
                <span>{currentDocument.category}</span>
                <span>{currentDocument.updatedAt}</span>
              </div>
            </div>
              <div className="detail-block">
                <h3>Tags</h3>
                <div className="badge-row" style={{ marginTop: 12 }}>
                  {currentDocument.tags.map((tag) => (
                    <TagBadge key={tag} tag={tag} definitions={data.tagsRegistry} />
                  ))}
                </div>
              </div>
          </div>
        }
      />

      <section className="note-page-stack">
        <div className="editor-block note-editor-block">
          {isEditingNote ? (
            <form className="note-edit-shell" onSubmit={handleSave}>
              <div className="note-edit-topbar">
                <span className="chip">Edition en cours</span>
                <div className="note-edit-actions">
                  <button type="submit" className="icon-action confirm" aria-label="Valider">
                    ✓
                  </button>
                  <button
                    type="button"
                    className="icon-action cancel"
                    aria-label="Annuler"
                    onClick={handleCancelNoteEdit}
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="form-stack">
                <div className="field">
                  <label htmlFor="note-edit-title">Titre</label>
                  <input
                    id="note-edit-title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="note-edit-summary">Resume</label>
                  <textarea
                    id="note-edit-summary"
                    value={summary}
                    onChange={(event) => setSummary(event.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="note-edit-category">Categorie</label>
                  <input
                    id="note-edit-category"
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                  />
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
                  <label htmlFor="note-edit-content">Contenu</label>
                  <div className="editor-toolbar note-toolbar">
                    <button
                      type="button"
                      className="editor-button"
                      onClick={() => insertAroundSelection("**")}
                    >
                      Gras
                    </button>
                    <button
                      type="button"
                      className="editor-button"
                      onClick={() => insertAroundSelection("__")}
                    >
                      Souligne
                    </button>
                    <button
                      type="button"
                      className="editor-button"
                      onClick={() => insertAroundSelection("*")}
                    >
                      Italique
                    </button>
                  </div>
                  <textarea
                    id="note-edit-content"
                    className="note-content-editor"
                    ref={contentTextareaRef}
                    value={contentText}
                    onChange={(event) => setContentText(event.target.value)}
                  />
                </div>
              </div>
            </form>
          ) : (
            <div className="note-read-shell">
              <div className="note-read-header">
                <h2>{currentDocument.title}</h2>
                <button
                  type="button"
                  className="editor-button"
                  onClick={() => setIsEditingNote(true)}
                >
                  Modifier
                </button>
              </div>
              <p className="section-copy">{currentDocument.summary}</p>
              <div className="note-read-content">
                {currentDocument.content.map((section) => (
                  <section key={section.heading}>
                    <RichTextPreview text={section.paragraphs.join("\n\n")} />
                    {section.bullets ? (
                      <ul>
                        {section.bullets.map((bullet) => (
                          <li key={bullet}>{bullet}</li>
                        ))}
                      </ul>
                    ) : null}
                  </section>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="note-meta-grid">
          <div className="detail-block">
            <h3>Informations</h3>
            <div className="meta-line">
              <span>{currentDocument.category}</span>
              <span>{currentDocument.updatedAt}</span>
            </div>
            <p>
              Le contenu reste lisible en mode lecture et editable dans cette meme page.
            </p>
          </div>
          <div className="detail-block">
            <h3>Tags</h3>
            <div className="badge-row" style={{ marginTop: 12 }}>
              {currentDocument.tags.map((tag) => (
                <TagBadge key={tag} tag={tag} definitions={data.tagsRegistry} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
