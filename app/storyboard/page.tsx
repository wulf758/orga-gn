"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useAppData } from "@/components/app-data-provider";
import { CreatePanel } from "@/components/create-panel";
import { PageHero } from "@/components/page-hero";
import { formatDateLabel } from "@/lib/date-utils";
import { StoryboardCard, StoryboardScene } from "@/lib/types";

function makeEditableCards(count: number, currentCards: StoryboardCard[] = []) {
  return Array.from({ length: count }, (_, index) => ({
    id: currentCards[index]?.id ?? `story-card-local-${index + 1}`,
    title: currentCards[index]?.title ?? `Case ${index + 1}`,
    content: currentCards[index]?.content ?? ""
  }));
}

function StoryboardPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    data,
    createStoryboardScene,
    updateStoryboardScene,
    deleteStoryboardScene
  } = useAppData();

  const orderedScenes = useMemo(
    () =>
      data.storyboardScenes.slice().sort((left, right) => {
        const leftDayOrder = left.dayId
          ? data.timelineDays.find((day) => day.id === left.dayId)?.order ?? 999
          : 999;
        const rightDayOrder = right.dayId
          ? data.timelineDays.find((day) => day.id === right.dayId)?.order ?? 999
          : 999;

        return (
          leftDayOrder - rightDayOrder ||
          left.startTime.localeCompare(right.startTime) ||
          left.title.localeCompare(right.title)
        );
      }),
    [data.storyboardScenes, data.timelineDays]
  );

  const sceneFromQuery = searchParams.get("scene");
  const [selectedSceneId, setSelectedSceneId] = useState(sceneFromQuery ?? orderedScenes[0]?.id ?? "");
  const [isEditing, setIsEditing] = useState(false);

  const selectedScene =
    orderedScenes.find((scene) => scene.id === selectedSceneId) ?? orderedScenes[0] ?? null;

  const [newTitle, setNewTitle] = useState("");
  const [newDayId, setNewDayId] = useState(data.timelineDays[0]?.id ?? "");
  const [newStartTime, setNewStartTime] = useState("10:00");
  const [newEndTime, setNewEndTime] = useState("10:30");
  const [newLocation, setNewLocation] = useState("");
  const [newSummary, setNewSummary] = useState("");
  const [newCardCount, setNewCardCount] = useState("4");

  const [title, setTitle] = useState("");
  const [dayId, setDayId] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("10:30");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<StoryboardScene["status"]>("A cadrer");
  const [summary, setSummary] = useState("");
  const [cards, setCards] = useState<StoryboardCard[]>([]);

  useEffect(() => {
    if (sceneFromQuery) {
      setSelectedSceneId(sceneFromQuery);
      setIsEditing(false);
    }
  }, [sceneFromQuery]);

  useEffect(() => {
    if (!selectedSceneId && orderedScenes.length) {
      setSelectedSceneId(orderedScenes[0].id);
    }
  }, [selectedSceneId, orderedScenes]);

  useEffect(() => {
    if (!selectedScene) return;

    setTitle(selectedScene.title);
    setDayId(selectedScene.dayId ?? "");
    setStartTime(selectedScene.startTime);
    setEndTime(selectedScene.endTime);
    setLocation(selectedScene.location);
    setStatus(selectedScene.status);
    setSummary(selectedScene.summary);
    setCards(selectedScene.cards);
  }, [selectedScene?.id]);

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

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newTitle.trim()) return;

    createStoryboardScene({
      title: newTitle.trim(),
      dayId: newDayId || undefined,
      startTime: newStartTime,
      endTime: newEndTime,
      location: newLocation.trim() || "Lieu a preciser",
      summary: newSummary.trim() || "Scene storyboard a completer.",
      cardCount: Number(newCardCount)
    });

    setNewTitle("");
    setNewDayId(data.timelineDays[0]?.id ?? "");
    setNewStartTime("10:00");
    setNewEndTime("10:30");
    setNewLocation("");
    setNewSummary("");
    setNewCardCount("4");
  }

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedScene || !title.trim()) return;

    updateStoryboardScene({
      id: selectedScene.id,
      title: title.trim(),
      dayId: dayId || undefined,
      startTime,
      endTime,
      location: location.trim() || "Lieu a preciser",
      status,
      summary: summary.trim() || "Scene storyboard a completer.",
      cards
    });

    setIsEditing(false);
  }

  function handleDelete() {
    if (!selectedScene) return;
    if (!window.confirm(`Supprimer la scene "${selectedScene.title}" ?`)) return;

    deleteStoryboardScene(selectedScene.id);
    setSelectedSceneId("");
    setIsEditing(false);
    router.push("/storyboard");
  }

  function selectScene(sceneId: string) {
    setSelectedSceneId(sceneId);
    setIsEditing(false);
    router.push(`/storyboard?scene=${sceneId}`);
  }

  return (
    <>
      <PageHero
        kicker="Storyboard / scenes reliees a la timeline"
        title="Storyboarder le GN scene par scene."
        copy="Chaque scene du storyboard porte son horaire, son lieu et ses cases d'ecriture. Une scene posee ici remonte automatiquement dans la timeline et reste consultable depuis son bloc horaire."
        actions={
          <>
            <span className="hero-note hero-note-accent">Scenes reliees au planning</span>
            <span className="hero-note">Cases de 1 a 9 moments</span>
          </>
        }
        aside={
          <CreatePanel
            title="Ajouter une scene"
            description="Creation d'une scene de storyboard avec insertion automatique dans la timeline."
          >
            <form className="form-stack" onSubmit={handleCreate}>
              <div className="field">
                <label htmlFor="story-new-title">Titre</label>
                <input
                  id="story-new-title"
                  value={newTitle}
                  onChange={(event) => setNewTitle(event.target.value)}
                  placeholder="Conseil de crise"
                />
              </div>
              <div className="surface-grid" style={{ marginTop: 0 }}>
                <div className="span-4 field">
                  <label htmlFor="story-new-day">Jour</label>
                  <select
                    id="story-new-day"
                    value={newDayId}
                    onChange={(event) => setNewDayId(event.target.value)}
                  >
                    <option value="">Sans jour</option>
                    {data.timelineDays.map((day) => (
                      <option key={day.id} value={day.id}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="span-4 field">
                  <label htmlFor="story-new-start">Debut</label>
                  <input
                    id="story-new-start"
                    type="time"
                    step="900"
                    value={newStartTime}
                    onChange={(event) => setNewStartTime(event.target.value)}
                  />
                </div>
                <div className="span-4 field">
                  <label htmlFor="story-new-end">Fin</label>
                  <input
                    id="story-new-end"
                    type="time"
                    step="900"
                    value={newEndTime}
                    onChange={(event) => setNewEndTime(event.target.value)}
                  />
                </div>
              </div>
              <div className="field">
                <label htmlFor="story-new-location">Lieu</label>
                <input
                  id="story-new-location"
                  value={newLocation}
                  onChange={(event) => setNewLocation(event.target.value)}
                  placeholder="Salle du conseil"
                />
              </div>
              <div className="field">
                <label htmlFor="story-new-summary">Resume</label>
                <textarea
                  id="story-new-summary"
                  value={newSummary}
                  onChange={(event) => setNewSummary(event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="story-new-count">Nombre de cases</label>
                <select
                  id="story-new-count"
                  value={newCardCount}
                  onChange={(event) => setNewCardCount(event.target.value)}
                >
                  {Array.from({ length: 9 }, (_, index) => (
                    <option key={index + 1} value={index + 1}>
                      {index + 1} case{index === 0 ? "" : "s"}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-actions">
                <button type="submit" className="button-primary">
                  Ajouter la scene
                </button>
              </div>
            </form>
          </CreatePanel>
        }
      />

      <section className="surface-grid">
        <div className="surface span-4">
          <div className="section-header">
            <div>
              <p className="section-kicker">Scenes</p>
              <h2 className="section-title">Storyboard</h2>
            </div>
          </div>

          <div className="list-stack">
            {orderedScenes.map((scene) => (
              <button
                type="button"
                key={scene.id}
                className={`timeline-day-button${selectedScene?.id === scene.id ? " active" : ""}`}
                onClick={() => selectScene(scene.id)}
              >
                <span className="timeline-day-label">{scene.title}</span>
                <span className="timeline-day-date">
                  {getDayLabel(scene.dayId)} | {scene.startTime} - {scene.endTime}
                </span>
                <span className="timeline-day-date">{scene.location}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="surface span-8">
          {selectedScene ? (
            isEditing ? (
              <form className="form-stack" onSubmit={handleSave}>
                <div className="section-header">
                  <div>
                    <p className="section-kicker">Edition de scene</p>
                    <h2 className="section-title">{selectedScene.title}</h2>
                  </div>
                  <span
                    className={`status-pill${
                      status === "Pret" ? " success" : status === "En cours" ? " warning" : ""
                    }`}
                  >
                    {status}
                  </span>
                </div>

                <div className="surface-grid" style={{ marginTop: 0 }}>
                  <div className="span-5 field">
                    <label htmlFor="story-title">Titre</label>
                    <input
                      id="story-title"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                    />
                  </div>
                  <div className="span-3 field">
                    <label htmlFor="story-day">Jour</label>
                    <select
                      id="story-day"
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
                  </div>
                  <div className="span-2 field">
                    <label htmlFor="story-start">Debut</label>
                    <input
                      id="story-start"
                      type="time"
                      step="900"
                      value={startTime}
                      onChange={(event) => setStartTime(event.target.value)}
                    />
                  </div>
                  <div className="span-2 field">
                    <label htmlFor="story-end">Fin</label>
                    <input
                      id="story-end"
                      type="time"
                      step="900"
                      value={endTime}
                      onChange={(event) => setEndTime(event.target.value)}
                    />
                  </div>
                </div>

                <div className="surface-grid" style={{ marginTop: 0 }}>
                  <div className="span-8 field">
                    <label htmlFor="story-location">Lieu</label>
                    <input
                      id="story-location"
                      value={location}
                      onChange={(event) => setLocation(event.target.value)}
                    />
                  </div>
                  <div className="span-2 field">
                    <label htmlFor="story-status">Etat</label>
                    <select
                      id="story-status"
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
                    <label htmlFor="story-count">Cases</label>
                    <select
                      id="story-count"
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
                  <label htmlFor="story-summary">Resume</label>
                  <textarea
                    id="story-summary"
                    value={summary}
                    onChange={(event) => setSummary(event.target.value)}
                  />
                </div>

                <div className="storyboard-card-grid">
                  {cards.map((card, index) => (
                    <article className="storyboard-card" key={card.id}>
                      <div className="field">
                        <label htmlFor={`story-card-title-${card.id}`}>Case {index + 1}</label>
                        <input
                          id={`story-card-title-${card.id}`}
                          value={card.title}
                          onChange={(event) => updateCard(index, "title", event.target.value)}
                        />
                      </div>
                      <div className="field">
                        <label htmlFor={`story-card-content-${card.id}`}>Contenu</label>
                        <textarea
                          id={`story-card-content-${card.id}`}
                          value={card.content}
                          onChange={(event) => updateCard(index, "content", event.target.value)}
                          style={{ minHeight: 180 }}
                        />
                      </div>
                    </article>
                  ))}
                </div>

                <div className="form-actions">
                  <button type="submit" className="button-primary">
                    Enregistrer la scene
                  </button>
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => setIsEditing(false)}
                  >
                    Annuler
                  </button>
                  <button type="button" className="button-secondary" onClick={handleDelete}>
                    Supprimer la scene
                  </button>
                </div>
              </form>
            ) : (
              <div className="detail-grid">
                <div className="section-header">
                  <div>
                    <p className="section-kicker">Consultation de scene</p>
                    <h2 className="section-title">{selectedScene.title}</h2>
                    <p className="section-copy">{selectedScene.summary}</p>
                  </div>
                  <div className="form-actions">
                    <span
                      className={`status-pill${
                        selectedScene.status === "Pret"
                          ? " success"
                          : selectedScene.status === "En cours"
                          ? " warning"
                          : ""
                      }`}
                    >
                      {selectedScene.status}
                    </span>
                    <button
                      type="button"
                      className="button-primary"
                      onClick={() => setIsEditing(true)}
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      className="button-ghost"
                      onClick={handleDelete}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>

                <div className="meta-line">
                  <span>{getDayLabel(selectedScene.dayId)}</span>
                  <span>
                    {selectedScene.startTime} - {selectedScene.endTime}
                  </span>
                  <span>{selectedScene.location}</span>
                </div>

                <div className="storyboard-card-grid">
                  {selectedScene.cards.map((card, index) => (
                    <article className="storyboard-card" key={card.id}>
                      <p className="section-kicker">Case {index + 1}</p>
                      <h3>{card.title}</h3>
                      <p>{card.content || "Case a completer."}</p>
                    </article>
                  ))}
                </div>
              </div>
            )
          ) : (
            <div className="empty-state">Aucune scene storyboard pour l'instant.</div>
          )}
        </div>
      </section>
    </>
  );
}

export default function StoryboardPage() {
  return (
    <Suspense fallback={<div className="empty-state">Chargement du storyboard...</div>}>
      <StoryboardPageContent />
    </Suspense>
  );
}
