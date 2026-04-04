"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { PageHero } from "@/components/page-hero";
import { TagPicker } from "@/components/tag-picker";
import { useAppData } from "@/components/app-data-provider";

export default function NewStoryboardScenePage() {
  const router = useRouter();
  const { data, createStoryboardScene } = useAppData();
  const [title, setTitle] = useState("");
  const [dayId, setDayId] = useState(data.timelineDays[0]?.id ?? "");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("10:30");
  const [location, setLocation] = useState("");
  const [summary, setSummary] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [cardCount, setCardCount] = useState("4");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;

    createStoryboardScene({
      title: title.trim(),
      dayId: dayId || undefined,
      startTime,
      endTime,
      location: location.trim() || "Lieu a preciser",
      summary: summary.trim() || "Scene storyboard a completer.",
      tags: selectedTags,
      cardCount: Number(cardCount)
    });

    router.push("/storyboard");
  }

  return (
    <>
      <PageHero
        kicker="Storyboard / creation"
        title="Creer une nouvelle scene."
        copy="Cette page dediee te laisse plus de place pour regler les tags, le jour, l'horaire et le nombre de cases sans tasser la vue principale."
        actions={
          <Link href="/storyboard" className="button-secondary">
            Retour au storyboard
          </Link>
        }
      />

      <section className="note-page-stack">
        <div className="editor-block note-editor-block">
          <form className="note-edit-shell" onSubmit={handleSubmit}>
            <div className="note-edit-topbar">
              <span className="chip">Nouvelle scene</span>
              <div className="note-edit-actions">
                <button type="submit" className="button-primary">
                  Creer cette scene
                </button>
              </div>
            </div>

            <div className="form-stack">
              <div className="field">
                <label htmlFor="story-create-title">Titre</label>
                <input
                  id="story-create-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Conseil de crise"
                />
              </div>

              <div className="surface-grid" style={{ marginTop: 0 }}>
                <div className="span-4 field">
                  <label htmlFor="story-create-day">Jour</label>
                  <select
                    id="story-create-day"
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
                <div className="span-4 field">
                  <label htmlFor="story-create-start">Debut</label>
                  <input
                    id="story-create-start"
                    type="time"
                    step="900"
                    value={startTime}
                    onChange={(event) => setStartTime(event.target.value)}
                  />
                </div>
                <div className="span-4 field">
                  <label htmlFor="story-create-end">Fin</label>
                  <input
                    id="story-create-end"
                    type="time"
                    step="900"
                    value={endTime}
                    onChange={(event) => setEndTime(event.target.value)}
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="story-create-location">Lieu</label>
                <input
                  id="story-create-location"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="Salle du conseil"
                />
              </div>

              <div className="field">
                <label htmlFor="story-create-summary">Resume</label>
                <textarea
                  id="story-create-summary"
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

              <div className="field">
                <label htmlFor="story-create-count">Nombre de cases</label>
                <select
                  id="story-create-count"
                  value={cardCount}
                  onChange={(event) => setCardCount(event.target.value)}
                >
                  {Array.from({ length: 9 }, (_, index) => (
                    <option key={index + 1} value={index + 1}>
                      {index + 1} case{index === 0 ? "" : "s"}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
