"use client";

import Link from "next/link";

import { DeadlineCalendar } from "@/components/deadline-calendar";
import { PageHero } from "@/components/page-hero";
import { StatusPill } from "@/components/status-pill";
import { TagBadge } from "@/components/tag-badge";
import { useAppData } from "@/components/app-data-provider";
import {
  daysUntil,
  formatDateLabel,
  formatDateTimeLabel,
  formatReminder
} from "@/lib/date-utils";
import { isPriorityTag } from "@/lib/tags";

export default function DashboardPage() {
  const { data } = useAppData();
  const organizationCategoryMap = Object.fromEntries(
    data.organizationCategories.map((category) => [category.slug, category.title])
  );
  const playerCharacterCount = data.characters.filter((entry) => entry.role === "PJ").length;
  const openKraftCount = data.kraftItems.filter((entry) => entry.status !== "Fini").length;
  const finishedKraftCount = data.kraftItems.filter((entry) => entry.status === "Fini").length;
  const priorityItems = [
    ...data.documents
      .filter((document) => document.tags.some(isPriorityTag))
      .map((document) => ({
        id: `priority-document-${document.slug}`,
        title: document.title,
        summary: document.summary,
        area: "Document",
        href: `/documents/${document.slug}`
      })),
    ...data.characters
      .filter((character) => character.tags.some(isPriorityTag))
      .map((character) => ({
        id: `priority-character-${character.id}`,
        title: character.name,
        summary: character.background,
        area: "Personnage",
        href: `/characters/${character.id}`
      })),
    ...data.plotCategories
      .filter((category) => category.tags.some(isPriorityTag))
      .map((category) => ({
        id: `priority-plot-category-${category.slug}`,
        title: category.title,
        summary: category.summary,
        area: "Categorie intrigue",
        href: `/plots/category/${category.slug}`
      })),
    ...data.plots
      .filter((plot) => plot.tags.some(isPriorityTag))
      .map((plot) => ({
        id: `priority-plot-${plot.id}`,
        title: plot.title,
        summary: plot.summary,
        area: "Intrigue",
        href: `/plots/${plot.id}`
      })),
    ...data.organizationCategories
      .filter((category) => category.tags.some(isPriorityTag))
      .map((category) => ({
        id: `priority-organization-category-${category.slug}`,
        title: category.title,
        summary: category.summary,
        area: "Categorie organisation",
        href: `/organization/category/${category.slug}`
      })),
    ...data.tasks
      .filter((task) => task.tags.some(isPriorityTag))
      .map((task) => ({
        id: `priority-task-${task.id}`,
        title: task.title,
        summary: task.summary,
        area: "Organisation",
        href: `/organization/task/${task.id}`
      })),
    ...data.meetingCategories
      .filter((category) => category.tags.some(isPriorityTag))
      .map((category) => ({
        id: `priority-meeting-category-${category.slug}`,
        title: category.title,
        summary: category.summary,
        area: "Categorie reunion",
        href: `/meetings/category/${category.slug}`
      })),
    ...data.meetings
      .filter((meeting) => meeting.tags.some(isPriorityTag))
      .map((meeting) => ({
        id: `priority-meeting-${meeting.id}`,
        title: meeting.title,
        summary: meeting.focus,
        area: "Reunion",
        href: `/meetings/${meeting.id}`
      })),
    ...data.timelineEntries
      .filter((entry) => entry.tags.some(isPriorityTag))
      .map((entry) => ({
        id: `priority-timeline-${entry.id}`,
        title: entry.title,
        summary: `${entry.startTime} - ${entry.endTime} - ${entry.location}`,
        area: "Timeline",
        href: "/timeline"
      })),
    ...data.kraftItems
      .filter((item) => item.tags.some(isPriorityTag))
      .map((item) => ({
        id: `priority-kraft-${item.id}`,
        title: item.title,
        summary: item.summary,
        area: "Kraft",
        href: `/kraft/${item.id}`
      }))
  ].slice(0, 8);
  const upcomingReminders = [
    ...data.tasks
      .filter((task) => task.dueDate)
      .map((task) => ({
        id: `task-${task.id}`,
        title: task.title,
        dateISO: task.dueDate,
        dateLabel: formatDateLabel(task.dueDate, task.dueLabel),
        reminder: formatReminder(task.dueDate),
        lane: organizationCategoryMap[task.categorySlug] ?? task.categorySlug,
        status: task.status,
        tone: task.status === "Bloque" ? ("warning" as const) : undefined,
        href: `/organization/task/${task.id}`
      })),
    ...data.deadlines
      .filter((deadline) => deadline.dateISO)
      .map((deadline) => ({
        id: `deadline-${deadline.id}`,
        title: deadline.title,
        dateISO: deadline.dateISO,
        dateLabel: formatDateLabel(deadline.dateISO, deadline.dateLabel),
        reminder: formatReminder(deadline.dateISO),
        lane: deadline.lane,
        status: deadline.status,
        tone: deadline.status === "Urgent" ? ("warning" as const) : undefined,
        href: "/organization"
      })),
    ...data.meetings
      .filter((meeting) => meeting.dateISO)
      .map((meeting) => ({
        id: `meeting-${meeting.id}`,
        title: meeting.title,
        dateISO: meeting.dateISO,
        dateLabel: formatDateTimeLabel(
          meeting.dateISO,
          meeting.timeLabel,
          meeting.dateLabel
        ),
        reminder: formatReminder(meeting.dateISO),
        lane: "Reunion orga",
        status: "Reunion",
        tone: "success" as const,
        href: `/meetings/${meeting.id}`
      }))
  ]
    .filter((entry) => {
      const diff = daysUntil(entry.dateISO);
      return entry.dateISO && diff !== null && diff >= 0;
    })
    .sort((left, right) => {
      const leftDiff = daysUntil(left.dateISO) ?? Number.MAX_SAFE_INTEGER;
      const rightDiff = daysUntil(right.dateISO) ?? Number.MAX_SAFE_INTEGER;
      return leftDiff - rightDiff;
    })
    .slice(0, 6);

  const calendarEntries = [
    ...data.tasks
      .filter((task) => task.dueDate)
      .map((task) => ({
        id: `calendar-task-${task.id}`,
        title: task.title,
        dateISO: task.dueDate as string,
        reminder: formatReminder(task.dueDate),
        lane: organizationCategoryMap[task.categorySlug] ?? task.categorySlug,
        status: task.status,
        tone: task.status === "Bloque" ? ("warning" as const) : undefined,
        href: `/organization/task/${task.id}`
      })),
    ...data.deadlines
      .filter((deadline) => deadline.dateISO)
      .map((deadline) => ({
        id: `calendar-deadline-${deadline.id}`,
        title: deadline.title,
        dateISO: deadline.dateISO as string,
        reminder: formatReminder(deadline.dateISO),
        lane: deadline.lane,
        status: deadline.status,
        tone: deadline.status === "Urgent" ? ("warning" as const) : undefined,
        href: "/organization"
      })),
    ...data.meetings
      .filter((meeting) => meeting.dateISO)
      .map((meeting) => ({
        id: `calendar-meeting-${meeting.id}`,
        title: meeting.title,
        dateISO: meeting.dateISO as string,
        reminder: formatReminder(meeting.dateISO),
        lane: "Reunion orga",
        status: meeting.timeLabel ? `Reunion ${meeting.timeLabel}` : "Reunion",
        tone: "success" as const,
        href: `/meetings/${meeting.id}`
      }))
  ];

  return (
    <>
      <PageHero
        kicker="Espace de travail / cockpit orga"
        title="Un atelier central pour ecrire et piloter le GN."
        copy="Cette base concentre les notes, les personnages, les intrigues, les echeances et l'activite recente pour que l'equipe orga travaille dans un meme espace."
        actions={
          <>
            <Link href="/documents" className="button-primary">
              Ouvrir le wiki
            </Link>
            <Link href="/characters" className="button-secondary">
              Voir les personnages
            </Link>
          </>
        }
        aside={
          <>
            <div className="surface">
              <p className="section-kicker">Etat du sprint</p>
              <h3>{data.gameName}</h3>
              <p>
                Espace de travail actif pour structurer le contenu, les rendez-vous
                et le suivi de production de ce GN.
              </p>
              <div className="badge-row" style={{ marginTop: 16 }}>
                <StatusPill tone="success">Documents relies</StatusPill>
                <StatusPill>Creation locale active</StatusPill>
                <StatusPill tone="warning">Multi-GN actif</StatusPill>
              </div>
            </div>
            <div className="stats-row">
              <div className="stat-block">
                <p className="stat-value">{data.documents.length}</p>
                <p className="stat-label">pages actives</p>
                <p className="stat-helper">wiki et notes de cadrage</p>
              </div>
              <div className="stat-block">
                <p className="stat-value">{data.characters.length}</p>
                <p className="stat-label">fiches personnages</p>
                <p className="stat-helper">
                  {playerCharacterCount} PJ et {data.characters.length - playerCharacterCount} PNJ
                </p>
              </div>
              <div className="stat-block">
                <p className="stat-value">{openKraftCount}</p>
                <p className="stat-label">krafts en cours</p>
                <p className="stat-helper">{finishedKraftCount} finis</p>
              </div>
            </div>
          </>
        }
      />

      <section className="surface-grid">
        <div className="surface span-5">
          <div className="section-header">
            <div>
              <p className="section-kicker">Priorites</p>
              <h2 className="section-title">Sujets prioritaires</h2>
            </div>
            <Link href="/tags" className="chip">
              Gerer les tags
            </Link>
          </div>
          <div className="list-stack">
            {priorityItems.length ? (
              priorityItems.map((item) => (
                <Link href={item.href} className="list-item" key={item.id}>
                  <h3>{item.title}</h3>
                  <p>{item.summary}</p>
                  <div className="meta-line">
                    <span>{item.area}</span>
                    <TagBadge tag="prioritaire" definitions={data.tagsRegistry} />
                  </div>
                </Link>
              ))
            ) : (
              <div className="empty-state">
                Aucun element tagge prioritaire pour l'instant.
              </div>
            )}
          </div>
        </div>

        <div className="surface span-5">
          <div className="section-header">
            <div>
              <p className="section-kicker">Activite recente</p>
              <h2 className="section-title">Dernieres modifications</h2>
            </div>
            <Link href="/meetings" className="chip">
              Voir les reunions
            </Link>
          </div>
          <div className="list-stack">
            {data.updates.slice(0, 6).map((update) => (
              <article className="list-item" key={update.id}>
                <h3>{update.title}</h3>
                <p>{update.detail}</p>
                <div className="meta-line">
                  <span>{update.area}</span>
                  <span>{update.when}</span>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="surface span-7">
          <div className="section-header">
            <div>
              <p className="section-kicker">Calendrier</p>
              <h2 className="section-title">Planning mensuel des echeances</h2>
            </div>
            <Link href="/organization" className="chip">
              Ouvrir l'espace planning
            </Link>
          </div>
          <DeadlineCalendar entries={calendarEntries} />
        </div>

        <div className="surface span-5">
          <div className="section-header">
            <div>
              <p className="section-kicker">Calendrier</p>
              <h2 className="section-title">Rappels d'echeances a venir</h2>
            </div>
            <Link href="/organization" className="chip">
              Ouvrir le planning
            </Link>
          </div>
          <div className="list-stack">
            {upcomingReminders.map((entry) => (
              <Link href={entry.href} className="list-item" key={entry.id}>
                <h3>{entry.title}</h3>
                <p>{entry.dateLabel}</p>
                <div className="meta-line">
                  <span>{entry.reminder}</span>
                  <span>{entry.lane}</span>
                  <StatusPill tone={entry.tone}>{entry.status}</StatusPill>
                </div>
              </Link>
            ))}
            {!upcomingReminders.length ? (
              <div className="empty-state">Aucune echeance datee pour l'instant.</div>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}
