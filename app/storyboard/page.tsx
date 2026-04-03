"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { CreatePanel } from "@/components/create-panel";
import { PageHero } from "@/components/page-hero";
import { StatusPill } from "@/components/status-pill";
import { TagBadge } from "@/components/tag-badge";
import { useAppData } from "@/components/app-data-provider";
import { formatDateLabel } from "@/lib/date-utils";

function StoryboardPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data, deleteStoryboardScene } = useAppData();

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

  const selectedScene =
    orderedScenes.find((scene) => scene.id === selectedSceneId) ?? orderedScenes[0] ?? null;

  useEffect(() => {
    if (sceneFromQuery) {
      setSelectedSceneId(sceneFromQuery);
    }
  }, [sceneFromQuery]);

  useEffect(() => {
    if (!selectedSceneId && orderedScenes.length) {
      setSelectedSceneId(orderedScenes[0].id);
    }
  }, [orderedScenes, selectedSceneId]);

  function getDayLabel(currentDayId?: string) {
    if (!currentDayId) return "Sans jour";
    const day = data.timelineDays.find((entry) => entry.id === currentDayId);
    if (!day) return "Sans jour";
    return `${day.label} - ${formatDateLabel(day.dateISO, day.dateISO)}`;
  }

  function handleDelete(sceneId: string, title: string) {
    if (!window.confirm(`Supprimer la scene "${title}" ?`)) return;

    deleteStoryboardScene(sceneId);

    if (selectedSceneId === sceneId) {
      setSelectedSceneId("");
      router.push("/storyboard");
      return;
    }
  }

  function selectScene(sceneId: string) {
    setSelectedSceneId(sceneId);
    router.push(`/storyboard?scene=${sceneId}`);
  }

  return (
    <>
      <PageHero
        kicker="Storyboard / scenes reliees a la timeline"
        title="Storyboarder le GN scene par scene."
        copy="La page principale reste legere pour piloter les scenes. La creation et l'edition se font maintenant sur des pages dediees, plus confortables pour les tags et les details."
        actions={
          <>
            <span className="hero-note hero-note-accent">Scenes reliees au planning</span>
            <span className="hero-note">Cases de 1 a 9 moments</span>
          </>
        }
        aside={
          <CreatePanel
            title="Creer une scene"
            description="Ouvre un editeur dedie pour poser les tags, l'horaire et les cases sans ecraser la vue storyboard."
          >
            <div className="form-actions">
              <Link href="/storyboard/new" className="button-primary">
                Creer une scene
              </Link>
            </div>
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

          <CreatePanel
            title="Jours partages"
            description="Les jours utilises par le storyboard sont exactement ceux de la timeline. Leur creation et leur edition se font au meme endroit."
          >
            <div className="list-stack">
              {data.timelineDays.length ? (
                data.timelineDays
                  .slice()
                  .sort((left, right) => left.order - right.order)
                  .map((day) => (
                    <div className="list-item" key={day.id}>
                      <h3>{day.label}</h3>
                      <p>{formatDateLabel(day.dateISO, day.dateISO)}</p>
                    </div>
                  ))
              ) : (
                <div className="empty-state">Aucun jour defini pour l'instant.</div>
              )}
            </div>
            <div className="form-actions">
              <Link href="/timeline" className="button-secondary">
                Gerer les jours dans Timeline
              </Link>
            </div>
          </CreatePanel>

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
                {scene.tags.length ? (
                  <div className="badge-row" style={{ marginTop: 8 }}>
                    {scene.tags.map((tag) => (
                      <TagBadge key={tag} tag={tag} definitions={data.tagsRegistry} />
                    ))}
                  </div>
                ) : null}
              </button>
            ))}
          </div>
        </div>

        <div className="surface span-8">
          {selectedScene ? (
            <div className="detail-grid">
              <div className="section-header">
                <div>
                  <p className="section-kicker">Consultation de scene</p>
                  <h2 className="section-title">{selectedScene.title}</h2>
                  <p className="section-copy">{selectedScene.summary}</p>
                </div>
                <div className="form-actions">
                  <StatusPill
                    tone={
                      selectedScene.status === "Pret"
                        ? "success"
                        : selectedScene.status === "En cours"
                        ? "warning"
                        : undefined
                    }
                  >
                    {selectedScene.status}
                  </StatusPill>
                  <Link href={`/storyboard/${selectedScene.id}`} className="button-primary">
                    Modifier
                  </Link>
                  <button
                    type="button"
                    className="button-ghost"
                    onClick={() => handleDelete(selectedScene.id, selectedScene.title)}
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

              {selectedScene.tags.length ? (
                <div className="badge-row">
                  {selectedScene.tags.map((tag) => (
                    <TagBadge key={tag} tag={tag} definitions={data.tagsRegistry} />
                  ))}
                </div>
              ) : null}

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
