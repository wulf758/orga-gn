"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { PageHero } from "@/components/page-hero";
import { StatusPill } from "@/components/status-pill";
import { TagBadge } from "@/components/tag-badge";
import { TagPicker } from "@/components/tag-picker";
import { useAppData } from "@/components/app-data-provider";
import { formatDateLabel } from "@/lib/date-utils";
import { StoryboardCard, StoryboardScene } from "@/lib/types";
import { buildDeleteConfirmation } from "@/lib/ui-copy";

function makeEditableCards(count: number, currentCards: StoryboardCard[] = []) {
  return Array.from({ length: count }, (_, index) => ({
    id: currentCards[index]?.id ?? `story-card-local-${index + 1}`,
    title: currentCards[index]?.title ?? `Case ${index + 1}`,
    content: currentCards[index]?.content ?? ""
  }));
}

export default function StoryboardSceneDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data, deleteStoryboardScene, updateStoryboardScene } = useAppData();
  const scene = data.storyboardScenes.find((entry) => entry.id === params.id);

  const [title, setTitle] = useState(scene?.title ?? "");
  const [dayId, setDayId] = useState(scene?.dayId ?? "");
  const [startTime, setStartTime] = useState(scene?.startTime ?? "10:00");
  const [endTime, setEndTime] = useState(scene?.endTime ?? "10:30");
  const [location, setLocation] = useState(scene?.location ?? "");
  const [status, setStatus] = useState<StoryboardScene["status"]>(scene?.status ?? "A cadrer");
  const [summary, setSummary] = useState(scene?.summary ?? "");
  const [selectedTags, setSelectedTags] = useState<string[]>(scene?.tags ?? []);
  const [cards, setCards] = useState<StoryboardCard[]>(scene?.cards ?? []);

  if (!scene) {
    return <div className="empty-state">Cette scene est introuvable.</div>;
  }

  const currentScene = scene;

  function getDayLabel(currentDayId?: string) {
    if (!currentDayId) return "Sans jour";
    const day = data.timelineDays.find((entry) => entry.id === currentDayId);
    if (!day) return "Sans jour";
    return `${day.label} - ${formatDateLabel(day.dateISO, day.dateISO)}`;
  }

  function updateCard(index: number, field: "title" | "content", value: string) {
    setCards((current) =>
      current.map((card, currentIndex) =>
        currentIndex === index ? { ...card, [field]: value } : card
      )
    );
  }

  function handleCardCountChange(value: string) {
    const count = Number(value);
    setCards((current) => makeEditableCards(count, current));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;

    updateStoryboardScene({
      id: currentScene.id,
      title: title.trim(),
      dayId: dayId || undefined,
      startTime,
      endTime,
      location: location.trim() || "Lieu a preciser",
      status,
      summary: summary.trim() || "Scene storyboard a completer.",
      tags: selectedTags,
      cards
    });

    router.push(`/storyboard?scene=${currentScene.id}`);
  }

  function handleDelete() {
    if (!window.confirm(buildDeleteConfirmation({ entityLabel: "la scene", name: currentScene.title }))) return;
    deleteStoryboardScene(currentScene.id);
    router.push("/storyboard");
  }

  return (
    <>
      <PageHero
        kicker="Storyboard / edition"
        title={currentScene.title}
        copy={currentScene.summary}
        actions={
          <>
            <Link href={`/storyboard?scene=${currentScene.id}`} className="button-secondary">
              Retour au storyboard
            </Link>
            <button type="button" className="button-secondary" onClick={handleDelete}>
              Supprimer
            </button>
          </>
        }
        aside={
          <div className="detail-grid">
            <div className="detail-block">
              <h3>Etat</h3>
              <div className="meta-line">
                <StatusPill
                  tone={
                    currentScene.status === "Pret"
                      ? "success"
                      : currentScene.status === "En cours"
                      ? "warning"
                      : undefined
                  }
                >
                  {currentScene.status}
                </StatusPill>
              </div>
            </div>
            <div className="detail-block">
              <h3>Planning</h3>
              <p>{getDayLabel(currentScene.dayId)}</p>
              <p>
                {currentScene.startTime} - {currentScene.endTime}
              </p>
              <p>{currentScene.location}</p>
            </div>
            <div className="detail-block">
              <h3>Tags</h3>
              <div className="badge-row" style={{ marginTop: 12 }}>
                {currentScene.tags.length ? (
                  currentScene.tags.map((tag) => (
                    <TagBadge key={tag} tag={tag} definitions={data.tagsRegistry} />
                  ))
                ) : (
                  <p>Aucun tag pour le moment.</p>
                )}
              </div>
            </div>
          </div>
        }
      />

      <section className="note-page-stack">
        <div className="editor-block note-editor-block">
          <form className="note-edit-shell" onSubmit={handleSubmit}>
            <div className="note-edit-topbar">
              <span className="chip">Edition de scene</span>
              <div className="note-edit-actions">
                <button type="submit" className="button-primary">
                  Enregistrer les modifications
                </button>
              </div>
            </div>

            <div className="form-stack">
              <div className="surface-grid" style={{ marginTop: 0 }}>
                <div className="span-5 field">
                  <label htmlFor="story-edit-title">Titre</label>
                  <input
                    id="story-edit-title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                  />
                </div>
                <div className="span-3 field">
                  <label htmlFor="story-edit-day">Jour</label>
                  <select
                    id="story-edit-day"
                    value={dayId}
                    onChange={(event) => setDayId(event.target.value)}
                  >
                    <option value="">Sans jour</option>
                    {data.timelineDays.map((day) => (
                      <option key={day.id} value={day.id}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                  <p className="field-hint">
                    Les jours sont partages avec la timeline et se gerent depuis cette page.
                  </p>
                </div>
                <div className="span-2 field">
                  <label htmlFor="story-edit-start">Debut</label>
                  <input
                    id="story-edit-start"
                    type="time"
                    step="900"
                    value={startTime}
                    onChange={(event) => setStartTime(event.target.value)}
                  />
                </div>
                <div className="span-2 field">
                  <label htmlFor="story-edit-end">Fin</label>
                  <input
                    id="story-edit-end"
                    type="time"
                    step="900"
                    value={endTime}
                    onChange={(event) => setEndTime(event.target.value)}
                  />
                </div>
              </div>

              <div className="surface-grid" style={{ marginTop: 0 }}>
                <div className="span-8 field">
                  <label htmlFor="story-edit-location">Lieu</label>
                  <input
                    id="story-edit-location"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                  />
                </div>
                <div className="span-2 field">
                  <label htmlFor="story-edit-status">Etat</label>
                  <select
                    id="story-edit-status"
                    value={status}
                    onChange={(event) =>
                      setStatus(event.target.value as StoryboardScene["status"])
                    }
                  >
                    <option value="A cadrer">A cadrer</option>
                    <option value="En cours">En cours</option>
                    <option value="Pret">Pret</option>
                  </select>
                </div>
                <div className="span-2 field">
                  <label htmlFor="story-edit-count">Cases</label>
                  <select
                    id="story-edit-count"
                    value={String(cards.length)}
                    onChange={(event) => handleCardCountChange(event.target.value)}
                  >
                    {Array.from({ length: 9 }, (_, index) => (
                      <option key={index + 1} value={index + 1}>
                        {index + 1}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="field">
                <label htmlFor="story-edit-summary">Resume</label>
                <textarea
                  id="story-edit-summary"
                  className="note-content-editor"
                  value={summary}
                  onChange={(event) => setSummary(event.target.value)}
                />
              </div>

              <div className="field">
                <label>Tags</label>
                <TagPicker
                  definitions={data.tagsRegistry}
                  selectedTags={selectedTags}
                  onToggle={(tag) =>
                    setSelectedTags((current) =>
                      current.includes(tag)
                        ? current.filter((entry) => entry !== tag)
                        : [...current, tag]
                    )
                  }
                />
              </div>

              <div className="storyboard-card-grid">
                {cards.map((card, index) => (
                  <article className="storyboard-card" key={card.id}>
                    <div className="field">
                      <label htmlFor={`story-edit-card-title-${card.id}`}>Case {index + 1}</label>
                      <input
                        id={`story-edit-card-title-${card.id}`}
                        value={card.title}
                        onChange={(event) => updateCard(index, "title", event.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor={`story-edit-card-content-${card.id}`}>Contenu</label>
                      <textarea
                        id={`story-edit-card-content-${card.id}`}
                        value={card.content}
                        onChange={(event) => updateCard(index, "content", event.target.value)}
                        style={{ minHeight: 180 }}
                      />
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
