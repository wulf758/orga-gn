"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useAppData } from "@/components/app-data-provider";
import { CreatePanel } from "@/components/create-panel";
import { PageHero } from "@/components/page-hero";
import { formatDateLabel } from "@/lib/date-utils";

const TIMELINE_TAGS = [
  "temps-fort",
  "orga",
  "pj",
  "pnj",
  "logistique",
  "rituel",
  "brief",
  "accueil",
  "repas",
  "nuit"
];

function buildQuarterSlots() {
  const slots: string[] = [];

  for (let hour = 8; hour < 24; hour += 1) {
    for (let quarter = 0; quarter < 60; quarter += 15) {
      slots.push(
        `${String(hour).padStart(2, "0")}:${String(quarter).padStart(2, "0")}`
      );
    }
  }

  return slots;
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

const QUARTER_SLOTS = buildQuarterSlots();

export default function TimelinePage() {
  const router = useRouter();
  const {
    data,
    createTimelineDay,
    updateTimelineDay,
    deleteTimelineDay,
    createTimelineEntry,
    updateTimelineEntry,
    deleteTimelineEntry
  } = useAppData();

  const sortedDays = useMemo(
    () =>
      data.timelineDays
        .slice()
        .sort((left, right) => left.order - right.order || left.dateISO.localeCompare(right.dateISO)),
    [data.timelineDays]
  );

  const [selectedDayId, setSelectedDayId] = useState(sortedDays[0]?.id ?? "");
  const [newDayLabel, setNewDayLabel] = useState("");
  const [newDayDate, setNewDayDate] = useState("");

  const selectedDay = sortedDays.find((day) => day.id === selectedDayId) ?? sortedDays[0];
  const [dayLabel, setDayLabel] = useState(selectedDay?.label ?? "");
  const [dayDate, setDayDate] = useState(selectedDay?.dateISO ?? "");

  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [entryTitle, setEntryTitle] = useState("");
  const [entryStart, setEntryStart] = useState("10:00");
  const [entryEnd, setEntryEnd] = useState("10:30");
  const [entryLocation, setEntryLocation] = useState("");
  const [entrySummary, setEntrySummary] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    if (!selectedDayId && sortedDays.length) {
      setSelectedDayId(sortedDays[0].id);
    }
  }, [selectedDayId, sortedDays]);

  useEffect(() => {
    if (selectedDay) {
      setDayLabel(selectedDay.label);
      setDayDate(selectedDay.dateISO);
    }
  }, [selectedDay?.id, selectedDay?.label, selectedDay?.dateISO]);

  const selectedDayEntries = useMemo(
    () =>
      data.timelineEntries
        .filter((entry) => entry.dayId === selectedDay?.id)
        .slice()
        .sort((left, right) => left.startTime.localeCompare(right.startTime)),
    [data.timelineEntries, selectedDay?.id]
  );

  const editingEntry = selectedDayEntries.find((entry) => entry.id === editingEntryId) ?? null;

  useEffect(() => {
    if (!editingEntry) {
      setEntryTitle("");
      setEntryStart("10:00");
      setEntryEnd("10:30");
      setEntryLocation("");
      setEntrySummary("");
      setSelectedTags([]);
      return;
    }

    setEntryTitle(editingEntry.title);
    setEntryStart(editingEntry.startTime);
    setEntryEnd(editingEntry.endTime);
    setEntryLocation(editingEntry.location);
    setEntrySummary(editingEntry.summary);
    setSelectedTags(editingEntry.tags);
  }, [editingEntry?.id]);

  function toggleTag(tag: string) {
    setSelectedTags((current) =>
      current.includes(tag) ? current.filter((entry) => entry !== tag) : [...current, tag]
    );
  }

  function resetEntryForm() {
    setEditingEntryId(null);
    setEntryTitle("");
    setEntryStart("10:00");
    setEntryEnd("10:30");
    setEntryLocation("");
    setEntrySummary("");
    setSelectedTags([]);
  }

  function handleDayCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newDayLabel.trim() || !newDayDate) return;

    createTimelineDay({
      label: newDayLabel.trim(),
      dateISO: newDayDate
    });

    setNewDayLabel("");
    setNewDayDate("");
  }

  function handleDaySave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedDay || !dayLabel.trim() || !dayDate) return;

    updateTimelineDay({
      id: selectedDay.id,
      label: dayLabel.trim(),
      dateISO: dayDate
    });
  }

  function handleDayDelete() {
    if (!selectedDay) return;
    if (!window.confirm(`Supprimer "${selectedDay.label}" et tous ses blocs timeline ?`)) return;
    deleteTimelineDay(selectedDay.id);
    setSelectedDayId("");
    resetEntryForm();
  }

  function handleEntrySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedDay || !entryTitle.trim()) return;
    if (timeToMinutes(entryEnd) <= timeToMinutes(entryStart)) return;

    const payload = {
      dayId: selectedDay.id,
      title: entryTitle.trim(),
      startTime: entryStart,
      endTime: entryEnd,
      location: entryLocation.trim() || "Lieu a preciser",
      summary: entrySummary.trim() || "Bloc timeline a completer.",
      tags: selectedTags
    };

    if (editingEntryId) {
      updateTimelineEntry({
        id: editingEntryId,
        ...payload
      });
    } else {
      createTimelineEntry(payload);
    }

    resetEntryForm();
  }

  function handleEntryDelete(id: string, title: string) {
    if (!window.confirm(`Supprimer le bloc "${title}" ?`)) return;
    deleteTimelineEntry(id);
    if (editingEntryId === id) {
      resetEntryForm();
    }
  }

  const quarterRows = QUARTER_SLOTS.map((slot) => {
    const slotMinutes = timeToMinutes(slot);
    const startingEntries = selectedDayEntries.filter(
      (entry) => timeToMinutes(entry.startTime) === slotMinutes
    );
    const continuingEntries = selectedDayEntries.filter(
      (entry) =>
        timeToMinutes(entry.startTime) < slotMinutes &&
        timeToMinutes(entry.endTime) > slotMinutes
    );

    return {
      slot,
      startingEntries,
      continuingEntries
    };
  });

  function openTimelineEntry(entryId: string, storyboardSceneId?: string) {
    if (storyboardSceneId) {
      router.push(`/storyboard?scene=${storyboardSceneId}`);
      return;
    }

    setEditingEntryId(entryId);
  }

  return (
    <>
      <PageHero
        kicker="Timeline / deroule de jeu"
        title="Une vision minutee du GN, jour par jour."
        copy="Cette timeline permet de poser les temps forts, les passages logistiques et les sequences sensibles au quart d'heure sur toute la duree du GN."
        actions={
          <>
            <span className="button-primary">Planning au quart d'heure</span>
            <span className="button-secondary">Pilotage multi-jours</span>
          </>
        }
        aside={
          <CreatePanel
            title="Ajouter un jour"
            description="Creation d'une nouvelle journee dans la timeline du GN."
          >
            <form className="form-stack" onSubmit={handleDayCreate}>
              <div className="field">
                <label htmlFor="timeline-new-day-label">Nom du jour</label>
                <input
                  id="timeline-new-day-label"
                  value={newDayLabel}
                  onChange={(event) => setNewDayLabel(event.target.value)}
                  placeholder="Jour 1"
                />
              </div>
              <div className="field">
                <label htmlFor="timeline-new-day-date">Date</label>
                <input
                  id="timeline-new-day-date"
                  type="date"
                  value={newDayDate}
                  onChange={(event) => setNewDayDate(event.target.value)}
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="button-primary">
                  Ajouter le jour
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
              <p className="section-kicker">Jours du GN</p>
              <h2 className="section-title">Jours</h2>
            </div>
          </div>

          <div className="timeline-day-list">
            {sortedDays.map((day) => (
              <button
                type="button"
                key={day.id}
                className={`timeline-day-button${selectedDay?.id === day.id ? " active" : ""}`}
                onClick={() => {
                  setSelectedDayId(day.id);
                  resetEntryForm();
                }}
              >
                <span className="timeline-day-label">{day.label}</span>
                <span className="timeline-day-date">{formatDateLabel(day.dateISO, day.dateISO)}</span>
              </button>
            ))}
          </div>

          {selectedDay ? (
            <form className="form-stack" onSubmit={handleDaySave} style={{ marginTop: 18 }}>
              <div className="field">
                <label htmlFor="timeline-day-label">Nom du jour</label>
                <input
                  id="timeline-day-label"
                  value={dayLabel}
                  onChange={(event) => setDayLabel(event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="timeline-day-date">Date</label>
                <input
                  id="timeline-day-date"
                  type="date"
                  value={dayDate}
                  onChange={(event) => setDayDate(event.target.value)}
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="button-primary">
                  Enregistrer le jour
                </button>
                <button type="button" className="button-secondary" onClick={handleDayDelete}>
                  Supprimer le jour
                </button>
              </div>
            </form>
          ) : (
            <div className="empty-state" style={{ marginTop: 18 }}>
              Aucun jour de timeline pour l'instant.
            </div>
          )}
        </div>

        <div className="surface span-8">
          <CreatePanel
            title={editingEntryId ? "Modifier un bloc" : "Ajouter un bloc"}
            description="Creation et edition des evenements sur la journee selectionnee."
          >
            <form className="form-stack" onSubmit={handleEntrySubmit}>
              <div className="field">
                <label htmlFor="timeline-entry-title">Titre</label>
                <input
                  id="timeline-entry-title"
                  value={entryTitle}
                  onChange={(event) => setEntryTitle(event.target.value)}
                  placeholder="Debut du conseil"
                />
              </div>
              <div className="surface-grid" style={{ marginTop: 0 }}>
                <div className="span-6 field">
                  <label htmlFor="timeline-entry-start">Debut</label>
                  <input
                    id="timeline-entry-start"
                    type="time"
                    step="900"
                    value={entryStart}
                    onChange={(event) => setEntryStart(event.target.value)}
                  />
                </div>
                <div className="span-6 field">
                  <label htmlFor="timeline-entry-end">Fin</label>
                  <input
                    id="timeline-entry-end"
                    type="time"
                    step="900"
                    value={entryEnd}
                    onChange={(event) => setEntryEnd(event.target.value)}
                  />
                </div>
              </div>
              <div className="field">
                <label htmlFor="timeline-entry-location">Lieu</label>
                <input
                  id="timeline-entry-location"
                  value={entryLocation}
                  onChange={(event) => setEntryLocation(event.target.value)}
                  placeholder="Camp principal"
                />
              </div>
              <div className="field">
                <label htmlFor="timeline-entry-summary">Resume</label>
                <textarea
                  id="timeline-entry-summary"
                  value={entrySummary}
                  onChange={(event) => setEntrySummary(event.target.value)}
                />
              </div>
              <div className="field">
                <label>Tags</label>
                <div className="tag-picker">
                  {TIMELINE_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className={`tag-toggle${selectedTags.includes(tag) ? " active" : ""}`}
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="button-primary">
                  {editingEntryId ? "Enregistrer le bloc" : "Ajouter le bloc"}
                </button>
                {editingEntryId ? (
                  <button type="button" className="button-secondary" onClick={resetEntryForm}>
                    Annuler
                  </button>
                ) : null}
              </div>
            </form>
          </CreatePanel>
        </div>

        <div className="surface span-12">
          <div className="section-header">
            <div>
              <p className="section-kicker">Deroule du jour</p>
              <h2 className="section-title">
                {selectedDay
                  ? `${selectedDay.label} - ${formatDateLabel(selectedDay.dateISO, selectedDay.dateISO)}`
                  : "Timeline"}
              </h2>
              <p className="section-copy">
                Lecture complete de la journee au quart d'heure, avec acces direct aux blocs a ajuster.
              </p>
            </div>
          </div>

          {selectedDay ? (
            <div className="timeline-grid">
              {quarterRows.map((row) => (
                <div className="timeline-row" key={row.slot}>
                  <div className="timeline-time">{row.slot}</div>
                  <div className="timeline-slot">
                    {row.startingEntries.length ? (
                      row.startingEntries.map((entry) => (
                        <button
                          type="button"
                          className="timeline-event"
                          key={entry.id}
                          onClick={() => openTimelineEntry(entry.id, entry.storyboardSceneId)}
                        >
                          <span className="timeline-event-title">{entry.title}</span>
                          <span className="timeline-event-meta">
                            {entry.startTime} - {entry.endTime} - {entry.location}
                          </span>
                        </button>
                      ))
                    ) : row.continuingEntries.length ? (
                      <div className="timeline-continuation">
                        {row.continuingEntries.map((entry) => (
                          <span className="badge" key={entry.id}>
                            En cours : {entry.title}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="timeline-free">Libre</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">Aucun jour selectionne.</div>
          )}
        </div>

        <div className="surface span-12">
          <div className="section-header">
            <div>
              <p className="section-kicker">Blocs du jour</p>
              <h2 className="section-title">Evenements</h2>
            </div>
          </div>

          <div className="list-stack">
            {selectedDayEntries.length ? (
              selectedDayEntries.map((entry) => (
                <article className="list-item" key={entry.id}>
                  <h3>{entry.title}</h3>
                  <p>{entry.summary}</p>
                  <div className="meta-line">
                    <span>
                      {entry.startTime} - {entry.endTime}
                    </span>
                    <span>{entry.location}</span>
                  </div>
                  <div className="badge-row" style={{ marginTop: 12 }}>
                    {entry.tags.map((tag) => (
                      <span className="badge" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="form-actions" style={{ marginTop: 14 }}>
                    {entry.storyboardSceneId ? (
                      <button
                        type="button"
                        className="button-primary"
                        onClick={() => router.push(`/storyboard?scene=${entry.storyboardSceneId}`)}
                      >
                        Ouvrir la scene
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="button-primary"
                          onClick={() => setEditingEntryId(entry.id)}
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          className="button-secondary"
                          onClick={() => handleEntryDelete(entry.id, entry.title)}
                        >
                          Supprimer
                        </button>
                      </>
                    )}
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-state">
                Aucun evenement sur cette journee pour l'instant.
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
