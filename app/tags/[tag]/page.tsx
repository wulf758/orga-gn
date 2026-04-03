"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";

import { useAppData } from "@/components/app-data-provider";
import { PageHero } from "@/components/page-hero";
import { TagBadge } from "@/components/tag-badge";
import { findTagDefinition, normalizeTagLabel } from "@/lib/tags";

type SearchResult = {
  id: string;
  title: string;
  summary: string;
  href: string;
  bucket: string;
  meta?: string;
};

function getSearchPreview(summary: string) {
  return summary.replace(/\s+/g, " ").trim();
}

export default function TagSearchPage() {
  const params = useParams<{ tag: string }>();
  const { data } = useAppData();
  const normalizedTag = normalizeTagLabel(decodeURIComponent(params.tag ?? ""));
  const definition = findTagDefinition(data.tagsRegistry, normalizedTag);
  const displayTag = definition?.label ?? normalizedTag;

  const groupedResults = useMemo(() => {
    const hasTag = (tags: string[]) =>
      tags.some((tag) => normalizeTagLabel(tag) === normalizedTag);

    const groups: Array<{ title: string; results: SearchResult[] }> = [
      {
        title: "Documents",
        results: data.documents
          .filter((document) => hasTag(document.tags))
          .map((document) => ({
            id: `document-${document.slug}`,
            title: document.title,
            summary: document.summary,
            href: `/documents/${document.slug}`,
            bucket: "Document",
            meta: document.category
          }))
      },
      {
        title: "Personnages",
        results: data.characters
          .filter((character) => hasTag(character.tags))
          .map((character) => ({
            id: `character-${character.id}`,
            title: character.name,
            summary: character.background,
            href: `/characters/${character.id}`,
            bucket: character.role,
            meta: character.faction
          }))
      },
      {
        title: "Intrigues",
        results: data.plots
          .filter((plot) => hasTag(plot.tags))
          .map((plot) => ({
            id: `plot-${plot.id}`,
            title: plot.title,
            summary: plot.summary,
            href: `/plots/${plot.id}`,
            bucket: "Intrigue",
            meta: plot.stage
          }))
      },
      {
        title: "Organisation",
        results: data.tasks
          .filter((task) => hasTag(task.tags))
          .map((task) => ({
            id: `task-${task.id}`,
            title: task.title,
            summary: task.summary,
            href: `/organization/task/${task.id}`,
            bucket: "Tache",
            meta: task.owner
          }))
      },
      {
        title: "Reunions",
        results: data.meetings
          .filter((meeting) => hasTag(meeting.tags))
          .map((meeting) => ({
            id: `meeting-${meeting.id}`,
            title: meeting.title,
            summary: meeting.focus,
            href: `/meetings/${meeting.id}`,
            bucket: "Reunion",
            meta: meeting.dateLabel
          }))
      },
      {
        title: "Timeline",
        results: data.timelineEntries
          .filter((entry) => hasTag(entry.tags))
          .map((entry) => ({
            id: `timeline-${entry.id}`,
            title: entry.title,
            summary: entry.summary,
            href: `/timeline`,
            bucket: "Timeline",
            meta: `${entry.startTime} - ${entry.endTime}`
          }))
      },
      {
        title: "Kraft",
        results: data.kraftItems
          .filter((item) => hasTag(item.tags))
          .map((item) => ({
            id: `kraft-${item.id}`,
            title: item.title,
            summary: item.summary,
            href: `/kraft`,
            bucket: "Kraft",
            meta: item.status
          }))
      }
    ];

    return groups.filter((group) => group.results.length);
  }, [data, normalizedTag]);

  const totalResults = groupedResults.reduce((count, group) => count + group.results.length, 0);

  return (
    <>
      <PageHero
        kicker="Recherche par tag"
        title={`Occurrences de ${displayTag}`}
        copy="Cette vue centralise tous les endroits du GN ou ce tag apparait, pour naviguer rapidement entre les modules."
        actions={
          <>
            <TagBadge tag={displayTag} definitions={data.tagsRegistry} />
            <span className="button-secondary">{totalResults} resultat(s)</span>
            <Link href="/tags" className="button-primary">
              Retour aux tags
            </Link>
          </>
        }
      />

      <section className="stats-row">
        <div className="stat-block">
          <p className="stat-value">{totalResults}</p>
          <p className="stat-label">resultat(s)</p>
          <p className="stat-helper">tous modules confondus</p>
        </div>
        <div className="stat-block">
          <p className="stat-value">{groupedResults.length}</p>
          <p className="stat-label">zone(s)</p>
          <p className="stat-helper">documents, persos, intrigues, kraft...</p>
        </div>
      </section>

      {groupedResults.length ? (
        <section className="surface-grid">
          {groupedResults.map((group) => (
            <div className="surface span-6" key={group.title}>
              <div className="section-header">
                <div>
                  <p className="section-kicker">Recherche</p>
                  <h2 className="section-title">{group.title}</h2>
                  <p className="section-copy">{group.results.length} element(s) trouves</p>
                </div>
              </div>
              <div className="list-stack">
                {group.results.map((result) => (
                  <Link href={result.href} className="list-item" key={result.id}>
                    <h3>{result.title}</h3>
                    <p className="search-result-preview">{getSearchPreview(result.summary)}</p>
                    <div className="meta-line">
                      <span>{result.bucket}</span>
                      {result.meta ? <span>{result.meta}</span> : null}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>
      ) : (
        <section className="surface">
          <div className="empty-state">
            Aucun contenu n'utilise encore le tag <strong>{displayTag}</strong>.
          </div>
        </section>
      )}
    </>
  );
}
