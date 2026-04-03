"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";

import { useAppData } from "@/components/app-data-provider";
import { PageHero } from "@/components/page-hero";
import { RichTextPreview } from "@/components/rich-text-preview";
import { formatDateTimeLabel } from "@/lib/date-utils";

const MEETING_TAG_SUGGESTIONS = [
  "scenario",
  "logistique",
  "arbitrage",
  "relecture",
  "compte-rendu",
  "urgent",
  "validation",
  "production",
  "planning",
  "decision"
];

export default function MeetingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data, deleteMeeting, updateMeeting } = useAppData();
  const meeting = data.meetings.find((entry) => entry.id === params.id);
  const notesRef = useRef<HTMLTextAreaElement | null>(null);

  const [title, setTitle] = useState(meeting?.title ?? "");
  const [dateISO, setDateISO] = useState(meeting?.dateISO ?? "");
  const [timeLabel, setTimeLabel] = useState(meeting?.timeLabel ?? "");
  const [focus, setFocus] = useState(meeting?.focus ?? "");
  const [notes, setNotes] = useState(meeting?.notes ?? "");
  const [agendaText, setAgendaText] = useState(meeting?.agenda.join("\n") ?? "");
  const [selectedTags, setSelectedTags] = useState<string[]>(meeting?.tags ?? []);
  const [isEditing, setIsEditing] = useState(false);

  if (!meeting) {
    return <div className="empty-state">Fiche reunion introuvable.</div>;
  }

  const currentMeeting = meeting;
  const category = data.meetingCategories.find((entry) => entry.slug === currentMeeting.categorySlug);

  function toggleTag(tag: string) {
    setSelectedTags((current) =>
      current.includes(tag) ? current.filter((entry) => entry !== tag) : [...current, tag]
    );
  }

  function insertAroundSelection(before: string, after = before) {
    const textarea = notesRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = notes.slice(start, end);
    const nextValue = notes.slice(0, start) + before + selectedText + after + notes.slice(end);
    setNotes(nextValue);
  }

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateMeeting({
      id: currentMeeting.id,
      title,
      dateISO: dateISO || undefined,
      timeLabel: timeLabel || undefined,
      focus,
      notes,
      tags: selectedTags,
      agendaText
    });
    setIsEditing(false);
  }

  function handleCancel() {
    setTitle(currentMeeting.title);
    setDateISO(currentMeeting.dateISO ?? "");
    setTimeLabel(currentMeeting.timeLabel ?? "");
    setFocus(currentMeeting.focus);
    setNotes(currentMeeting.notes);
    setAgendaText(currentMeeting.agenda.join("\n"));
    setSelectedTags(currentMeeting.tags);
    setIsEditing(false);
  }

  function handleDelete() {
    if (!window.confirm(`Supprimer la reunion "${currentMeeting.title}" ?`)) return;
    deleteMeeting(currentMeeting.id);
    router.push(`/meetings/category/${currentMeeting.categorySlug}`);
  }

  return (
    <>
      <PageHero
        kicker={`Fiche reunion / ${category?.title ?? currentMeeting.categorySlug}`}
        title={currentMeeting.title}
        copy={currentMeeting.focus}
        actions={
          <>
            <Link href={`/meetings/category/${currentMeeting.categorySlug}`} className="button-primary">
              Retour a la categorie
            </Link>
            <button type="button" className="button-secondary" onClick={() => setIsEditing((value) => !value)}>
              {isEditing ? "Quitter l'edition" : "Mode editeur"}
            </button>
            <button type="button" className="button-secondary" onClick={handleDelete}>
              Supprimer la reunion
            </button>
          </>
        }
        aside={
          <div className="detail-grid">
            <div className="detail-block">
              <h3>Date</h3>
              <p>{formatDateTimeLabel(currentMeeting.dateISO, currentMeeting.timeLabel, currentMeeting.dateLabel)}</p>
            </div>
            <div className="detail-block">
              <h3>Tags</h3>
              <div className="badge-row" style={{ marginTop: 12 }}>
                {currentMeeting.tags.map((tag) => (
                  <span className="badge" key={tag}>{tag}</span>
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
                  <label htmlFor="meeting-edit-title">Titre</label>
                  <input id="meeting-edit-title" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="meeting-edit-date">Date</label>
                  <input id="meeting-edit-date" type="date" value={dateISO} onChange={(e) => setDateISO(e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="meeting-edit-time">Heure</label>
                  <input id="meeting-edit-time" type="time" value={timeLabel} onChange={(e) => setTimeLabel(e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="meeting-edit-focus">Focus</label>
                  <textarea id="meeting-edit-focus" value={focus} onChange={(e) => setFocus(e.target.value)} />
                </div>
                <div className="field">
                  <label>Tags</label>
                  <div className="tag-picker">
                    {MEETING_TAG_SUGGESTIONS.map((tag) => (
                      <button key={tag} type="button" className={`tag-toggle${selectedTags.includes(tag) ? " active" : ""}`} onClick={() => toggleTag(tag)}>
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="meeting-edit-agenda">Ordre du jour</label>
                  <textarea id="meeting-edit-agenda" value={agendaText} onChange={(e) => setAgendaText(e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="meeting-edit-notes">Compte-rendu / notes</label>
                  <div className="editor-toolbar note-toolbar">
                    <button type="button" className="editor-button" onClick={() => insertAroundSelection("**")}>Gras</button>
                    <button type="button" className="editor-button" onClick={() => insertAroundSelection("__")}>Souligne</button>
                    <button type="button" className="editor-button" onClick={() => insertAroundSelection("*")}>Italique</button>
                  </div>
                  <textarea id="meeting-edit-notes" ref={notesRef} className="note-content-editor" value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
              </div>
            </form>
          ) : (
            <div className="note-read-shell">
              <div className="note-read-header">
                <h2>{currentMeeting.title}</h2>
                <button type="button" className="editor-button" onClick={() => setIsEditing(true)}>Modifier</button>
              </div>
              <p className="section-copy">{currentMeeting.focus}</p>
              <div className="detail-block" style={{ marginTop: 18 }}>
                <h3>Ordre du jour</h3>
                {currentMeeting.agenda.length ? (
                  <ul>
                    {currentMeeting.agenda.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p>Aucun point saisi pour l'instant.</p>
                )}
              </div>
              <div className="note-read-content">
                <RichTextPreview text={currentMeeting.notes} />
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
