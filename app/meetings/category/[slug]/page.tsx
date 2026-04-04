"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { useAppData } from "@/components/app-data-provider";
import { CreatePanel } from "@/components/create-panel";
import { PageHero } from "@/components/page-hero";
import { TagBadge } from "@/components/tag-badge";
import { formatDateTimeLabel } from "@/lib/date-utils";
import { buildDeleteConfirmation } from "@/lib/ui-copy";

export default function MeetingCategoryPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { data, createMeeting, deleteCategory, updateCategory } = useAppData();
  const category = data.meetingCategories.find((entry) => entry.slug === params.slug);
  const [title, setTitle] = useState(category?.title ?? "");
  const [summary, setSummary] = useState(category?.summary ?? "");
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [meetingFocus, setMeetingFocus] = useState("");
  const [meetingAgenda, setMeetingAgenda] = useState("");

  if (!category) {
    return <div className="empty-state">Categorie de reunion introuvable.</div>;
  }

  const currentCategory = category;
  const meetings = data.meetings.filter((meeting) => meeting.categorySlug === currentCategory.slug);

  function handleCategorySave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;
    updateCategory({ section: "meetings", slug: currentCategory.slug, title: title.trim(), summary });
  }

  function handleCategoryDelete() {
    if (
      !window.confirm(
        buildDeleteConfirmation({
          entityLabel: "la categorie",
          name: currentCategory.title,
          consequence: "Les reunions de cette categorie seront egalement supprimees."
        })
      )
    )
      return;
    deleteCategory("meetings", currentCategory.slug);
    router.push("/meetings");
  }

  function handleMeetingCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!meetingTitle.trim()) return;
    createMeeting({
      categorySlug: currentCategory.slug,
      title: meetingTitle.trim(),
      dateISO: meetingDate || undefined,
      timeLabel: meetingTime || undefined,
      focus: meetingFocus.trim() || "Focus a definir",
      agendaText: meetingAgenda
    });
    setMeetingTitle("");
    setMeetingDate("");
    setMeetingTime("");
    setMeetingFocus("");
    setMeetingAgenda("");
  }

  return (
    <>
      <PageHero
        kicker="Categorie reunion"
        title={currentCategory.title}
        copy={currentCategory.summary}
        actions={
          <>
            <Link href="/meetings" className="button-primary">Retour aux categories</Link>
            <button type="button" className="button-secondary" onClick={handleCategoryDelete}>
              Supprimer la categorie
            </button>
          </>
        }
        aside={
          <CreatePanel title="Modifier la categorie" description="Nom et description de la categorie de reunion.">
            <form className="form-stack" onSubmit={handleCategorySave}>
              <div className="field">
                <label htmlFor="meeting-category-edit-title">Nom</label>
                <input id="meeting-category-edit-title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="meeting-category-edit-summary">Description</label>
                <textarea id="meeting-category-edit-summary" value={summary} onChange={(e) => setSummary(e.target.value)} />
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
              <p className="section-kicker">Reunions</p>
              <h2 className="section-title">Seances prevues</h2>
            </div>
          </div>
          <div className="list-stack">
            {meetings.map((meeting) => (
              <Link href={`/meetings/${meeting.id}`} className="list-item" key={meeting.id}>
                <h3>{meeting.title}</h3>
                <p>{meeting.focus}</p>
                <div className="meta-line">
                  <span>{formatDateTimeLabel(meeting.dateISO, meeting.timeLabel, meeting.dateLabel)}</span>
                </div>
                <div className="badge-row" style={{ marginTop: 12 }}>
                  {meeting.tags.map((tag) => (
                    <TagBadge key={tag} tag={tag} definitions={data.tagsRegistry} />
                  ))}
                </div>
                {meeting.agenda.length ? (
                  <ul>
                    {meeting.agenda.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </Link>
            ))}
            {!meetings.length ? <div className="empty-state">Aucune reunion dans cette categorie pour le moment.</div> : null}
          </div>
        </div>

        <div className="detail-grid">
          <CreatePanel title="Creer une reunion" description="Ajoute une nouvelle reunion dans cette categorie.">
            <form className="form-stack" onSubmit={handleMeetingCreate}>
              <div className="field">
                <label htmlFor="meeting-title-create">Titre</label>
                <input id="meeting-title-create" value={meetingTitle} onChange={(e) => setMeetingTitle(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="meeting-date-create">Date</label>
                <input id="meeting-date-create" type="date" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="meeting-time-create">Heure</label>
                <input id="meeting-time-create" type="time" value={meetingTime} onChange={(e) => setMeetingTime(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="meeting-focus-create">Focus</label>
                <textarea id="meeting-focus-create" value={meetingFocus} onChange={(e) => setMeetingFocus(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="meeting-agenda-create">Ordre du jour</label>
                <textarea id="meeting-agenda-create" value={meetingAgenda} onChange={(e) => setMeetingAgenda(e.target.value)} />
              </div>
              <div className="form-actions">
                <button type="submit" className="button-primary">Creer la reunion</button>
              </div>
            </form>
          </CreatePanel>
        </div>
      </section>
    </>
  );
}
