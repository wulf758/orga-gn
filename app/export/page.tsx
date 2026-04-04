"use client";

import { useMemo, useState } from "react";

import { PageHero } from "@/components/page-hero";
import { useAppData } from "@/components/app-data-provider";
import { formatDateLabel, formatDateTimeLabel } from "@/lib/date-utils";
import {
  getCharacterExportMeta,
  getCharacterExportPlayerNotes
} from "@/lib/export-helpers";

type ExportKey =
  | "documents"
  | "pj"
  | "pnj"
  | "plots"
  | "organization"
  | "meetings"
  | "timeline"
  | "storyboard"
  | "kraft";

type ExportOption = {
  key: ExportKey;
  label: string;
  description: string;
};

const exportOptions: ExportOption[] = [
  {
    key: "documents",
    label: "Documents",
    description: "Wiki, dossiers et notes."
  },
  {
    key: "pj",
    label: "PJ",
    description: "Fiches joueurs et objectifs."
  },
  {
    key: "pnj",
    label: "PNJ",
    description: "Fiches PNJ et secrets utiles."
  },
  {
    key: "plots",
    label: "Intrigues",
    description: "Arcs, etapes, personnages lies."
  },
  {
    key: "organization",
    label: "Organisation",
    description: "Taches, deadlines et pilotage."
  },
  {
    key: "meetings",
    label: "Reunion orga",
    description: "Ordres du jour et notes de reunion."
  },
  {
    key: "timeline",
    label: "Timeline",
    description: "Deroule jour par jour du GN."
  },
  {
    key: "storyboard",
    label: "Storyboard",
    description: "Scenes et moments clefs."
  },
  {
    key: "kraft",
    label: "Kraft",
    description: "Fabrications a faire et terminees."
  }
];

export default function ExportPage() {
  const { canViewPlayerInfo, data } = useAppData();
  const [selected, setSelected] = useState<ExportKey[]>([
    "documents",
    "pj",
    "pnj",
    "plots",
    "organization",
    "meetings",
    "timeline",
    "storyboard",
    "kraft"
  ]);
  const [includePlayerInfo, setIncludePlayerInfo] = useState(false);

  const plotCategoryMap = useMemo(
    () => Object.fromEntries(data.plotCategories.map((category) => [category.slug, category.title])),
    [data.plotCategories]
  );
  const organizationCategoryMap = useMemo(
    () =>
      Object.fromEntries(data.organizationCategories.map((category) => [category.slug, category.title])),
    [data.organizationCategories]
  );
  const meetingCategoryMap = useMemo(
    () => Object.fromEntries(data.meetingCategories.map((category) => [category.slug, category.title])),
    [data.meetingCategories]
  );
  const dayMap = useMemo(
    () => Object.fromEntries(data.timelineDays.map((day) => [day.id, day])),
    [data.timelineDays]
  );
  const characterMap = useMemo(
    () => Object.fromEntries(data.characters.map((character) => [character.id, character.name])),
    [data.characters]
  );

  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const pj = useMemo(() => data.characters.filter((character) => character.role === "PJ"), [data.characters]);
  const pnj = useMemo(() => data.characters.filter((character) => character.role === "PNJ"), [data.characters]);
  const sortedTimelineDays = useMemo(
    () => [...data.timelineDays].sort((left, right) => left.order - right.order),
    [data.timelineDays]
  );
  const kraftTodo = useMemo(
    () => data.kraftItems.filter((item) => item.status !== "Fini"),
    [data.kraftItems]
  );
  const kraftDone = useMemo(
    () => data.kraftItems.filter((item) => item.status === "Fini"),
    [data.kraftItems]
  );

  function toggleSelection(key: ExportKey) {
    setSelected((current) =>
      current.includes(key) ? current.filter((entry) => entry !== key) : [...current, key]
    );
  }

  function selectAll() {
    setSelected(exportOptions.map((option) => option.key));
  }

  function clearSelection() {
    setSelected([]);
  }

  function handlePrint() {
    window.print();
  }

  return (
    <>
      <PageHero
        kicker="Export PDF"
        title="Composer un dossier d'export sur mesure."
        copy="Chaque section peut etre incluse ou retiree avant impression. L'export utilise la fonction PDF du navigateur, ce qui permet de sortir tout le GN ou seulement un bloc de travail."
        actions={
          <>
            <button type="button" className="button-primary" onClick={handlePrint}>
              Exporter en PDF
            </button>
            <button type="button" className="button-secondary" onClick={selectAll}>
              Tout selectionner
            </button>
          </>
        }
        aside={
          <div className="surface export-controls">
            <p className="section-kicker">Preparation</p>
            <h3>{data.gameName}</h3>
            <p>
              Selectionner les sections a inclure, puis lancer l'impression pour
              enregistrer en PDF.
            </p>
            <div className="export-option-list">
              {exportOptions.map((option) => (
                <div key={option.key} className="export-option-stack">
                  <label className="export-option">
                    <input
                      type="checkbox"
                      checked={selectedSet.has(option.key)}
                      onChange={() => toggleSelection(option.key)}
                    />
                    <span>
                      <strong>{option.label}</strong>
                      <small>{option.description}</small>
                    </span>
                  </label>
                  {canViewPlayerInfo &&
                  (option.key === "pj" || option.key === "pnj") &&
                  selectedSet.has(option.key) ? (
                    <label className="export-sub-option">
                      <input
                        type="checkbox"
                        checked={includePlayerInfo}
                        onChange={() => setIncludePlayerInfo((current) => !current)}
                      />
                      <span>
                        <strong>Inclure les informations joueur</strong>
                        <small>Allergies, phobies, limites de jeu et autres contraintes.</small>
                      </span>
                    </label>
                  ) : null}
                </div>
              ))}
            </div>
            <div className="form-actions">
              <button type="button" className="button-ghost" onClick={clearSelection}>
                Tout retirer
              </button>
              <button type="button" className="button-primary" onClick={handlePrint}>
                Imprimer / PDF
              </button>
            </div>
          </div>
        }
      />

      <section className="surface export-sheet print-sheet">
        <div className="export-sheet-header">
          <div>
            <p className="section-kicker">Dossier exporte</p>
            <h2 className="section-title">Export de {data.gameName}</h2>
          </div>
          <p className="export-date">
            Genere le {new Date().toLocaleDateString("fr-FR")}
          </p>
        </div>

        {!selected.length ? (
          <div className="empty-state">
            Aucune section selectionnee pour l'instant. Cocher au moins un bloc a exporter.
          </div>
        ) : null}

        {selectedSet.has("documents") ? (
          <section className="export-section">
            <div className="export-section-header">
              <p className="section-kicker">Documents</p>
              <h3>Wiki et notes</h3>
            </div>
            <div className="export-card-list">
              {data.documents.length ? (
                data.documents.map((document) => (
                  <article className="export-card" key={document.slug}>
                    <div className="meta-line">
                      <span>{document.kind === "folder" ? "Dossier" : "Note"}</span>
                      <span>{document.category}</span>
                      {document.parentSlug ? <span>Parent : {document.parentSlug}</span> : null}
                    </div>
                    <h4>{document.title}</h4>
                    <p>{document.summary}</p>
                    {document.tags.length ? (
                      <div className="badge-row">
                        {document.tags.map((tag) => (
                          <span className="chip" key={tag}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {document.kind === "note"
                      ? document.content.map((block, index) => (
                          <div key={`${document.slug}-${index}`} className="export-block">
                            <h5>{block.heading}</h5>
                            {block.paragraphs.map((paragraph) => (
                              <p key={paragraph}>{paragraph}</p>
                            ))}
                            {block.bullets?.length ? (
                              <ul>
                                {block.bullets.map((bullet) => (
                                  <li key={bullet}>{bullet}</li>
                                ))}
                              </ul>
                            ) : null}
                          </div>
                        ))
                      : null}
                  </article>
                ))
              ) : (
                <div className="empty-state">Aucun document a exporter.</div>
              )}
            </div>
          </section>
        ) : null}

        {selectedSet.has("pj") ? (
          <section className="export-section print-break-before">
            <div className="export-section-header">
              <p className="section-kicker">Personnages</p>
              <h3>PJ</h3>
            </div>
            <div className="export-card-list">
              {pj.length ? (
                pj.map((character) => (
                  <article className="export-card" key={character.id}>
                    <div className="meta-line">
                      {getCharacterExportMeta(character, data.tagsRegistry).map((item) => (
                        <span key={`${character.id}-${item}`}>{item}</span>
                      ))}
                    </div>
                    <h4>{character.name}</h4>
                    <p>{character.background}</p>
                    {getCharacterExportPlayerNotes(character, includePlayerInfo) ? (
                      <div className="export-block">
                        <h5>Informations joueur</h5>
                        <p>{getCharacterExportPlayerNotes(character, includePlayerInfo)}</p>
                      </div>
                    ) : null}
                    <div className="export-block">
                      <h5>Objectifs</h5>
                      <ul>
                        {character.objectives.map((objective) => (
                          <li key={objective}>{objective}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="export-block">
                      <h5>Secrets</h5>
                      <ul>
                        {character.secrets.map((secret) => (
                          <li key={secret}>{secret}</li>
                        ))}
                      </ul>
                    </div>
                  </article>
                ))
              ) : (
                <div className="empty-state">Aucun PJ a exporter.</div>
              )}
            </div>
          </section>
        ) : null}

        {selectedSet.has("pnj") ? (
          <section className="export-section">
            <div className="export-section-header">
              <p className="section-kicker">Personnages</p>
              <h3>PNJ</h3>
            </div>
            <div className="export-card-list">
              {pnj.length ? (
                pnj.map((character) => (
                  <article className="export-card" key={character.id}>
                    <div className="meta-line">
                      {getCharacterExportMeta(character, data.tagsRegistry).map((item) => (
                        <span key={`${character.id}-${item}`}>{item}</span>
                      ))}
                    </div>
                    <h4>{character.name}</h4>
                    <p>{character.background}</p>
                    {getCharacterExportPlayerNotes(character, includePlayerInfo) ? (
                      <div className="export-block">
                        <h5>Informations joueur</h5>
                        <p>{getCharacterExportPlayerNotes(character, includePlayerInfo)}</p>
                      </div>
                    ) : null}
                    <div className="export-block">
                      <h5>Objectifs</h5>
                      <ul>
                        {character.objectives.map((objective) => (
                          <li key={objective}>{objective}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="export-block">
                      <h5>Secrets</h5>
                      <ul>
                        {character.secrets.map((secret) => (
                          <li key={secret}>{secret}</li>
                        ))}
                      </ul>
                    </div>
                  </article>
                ))
              ) : (
                <div className="empty-state">Aucun PNJ a exporter.</div>
              )}
            </div>
          </section>
        ) : null}

        {selectedSet.has("plots") ? (
          <section className="export-section print-break-before">
            <div className="export-section-header">
              <p className="section-kicker">Intrigues</p>
              <h3>Arcs narratifs</h3>
            </div>
            <div className="export-card-list">
              {data.plots.length ? (
                data.plots.map((plot) => (
                  <article className="export-card" key={plot.id}>
                    <div className="meta-line">
                      <span>{plotCategoryMap[plot.categorySlug] ?? plot.categorySlug}</span>
                      <span>{plot.stage}</span>
                    </div>
                    <h4>{plot.title}</h4>
                    <p>{plot.summary}</p>
                    <div className="export-block">
                      <h5>Contenu</h5>
                      <p>{plot.content}</p>
                    </div>
                    {plot.beats.length ? (
                      <div className="export-block">
                        <h5>Etapes</h5>
                        <ul>
                          {plot.beats.map((beat) => (
                            <li key={beat}>{beat}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {plot.characters.length ? (
                      <div className="export-block">
                        <h5>Personnages lies</h5>
                        <p>{plot.characters.map((id) => characterMap[id] ?? id).join(", ")}</p>
                      </div>
                    ) : null}
                  </article>
                ))
              ) : (
                <div className="empty-state">Aucune intrigue a exporter.</div>
              )}
            </div>
          </section>
        ) : null}

        {selectedSet.has("organization") ? (
          <section className="export-section">
            <div className="export-section-header">
              <p className="section-kicker">Organisation</p>
              <h3>Taches et deadlines</h3>
            </div>
            <div className="export-card-list">
              {data.tasks.length ? (
                data.tasks.map((task) => (
                  <article className="export-card" key={task.id}>
                    <div className="meta-line">
                      <span>{organizationCategoryMap[task.categorySlug] ?? task.categorySlug}</span>
                      <span>{task.status}</span>
                      <span>{formatDateLabel(task.dueDate, task.dueLabel)}</span>
                    </div>
                    <h4>{task.title}</h4>
                    <p>{task.summary}</p>
                    <div className="export-block">
                      <h5>Responsable</h5>
                      <p>{task.owner}</p>
                    </div>
                    <div className="export-block">
                      <h5>Contenu</h5>
                      <p>{task.content}</p>
                    </div>
                  </article>
                ))
              ) : (
                <div className="empty-state">Aucune tache a exporter.</div>
              )}
              {data.deadlines.length ? (
                <article className="export-card">
                  <h4>Deadlines globales</h4>
                  <ul>
                    {data.deadlines.map((deadline) => (
                      <li key={deadline.id}>
                        {deadline.title} - {formatDateLabel(deadline.dateISO, deadline.dateLabel)} -{" "}
                        {deadline.lane} - {deadline.status}
                      </li>
                    ))}
                  </ul>
                </article>
              ) : null}
            </div>
          </section>
        ) : null}

        {selectedSet.has("meetings") ? (
          <section className="export-section print-break-before">
            <div className="export-section-header">
              <p className="section-kicker">Reunions</p>
              <h3>Reunion orga</h3>
            </div>
            <div className="export-card-list">
              {data.meetings.length ? (
                data.meetings.map((meeting) => (
                  <article className="export-card" key={meeting.id}>
                    <div className="meta-line">
                      <span>{meetingCategoryMap[meeting.categorySlug] ?? meeting.categorySlug}</span>
                      <span>
                        {formatDateTimeLabel(
                          meeting.dateISO,
                          meeting.timeLabel,
                          meeting.dateLabel
                        )}
                      </span>
                    </div>
                    <h4>{meeting.title}</h4>
                    <p>{meeting.focus}</p>
                    <div className="export-block">
                      <h5>Ordre du jour</h5>
                      <ul>
                        {meeting.agenda.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    {meeting.notes ? (
                      <div className="export-block">
                        <h5>Notes</h5>
                        <p>{meeting.notes}</p>
                      </div>
                    ) : null}
                  </article>
                ))
              ) : (
                <div className="empty-state">Aucune reunion a exporter.</div>
              )}
            </div>
          </section>
        ) : null}

        {selectedSet.has("timeline") ? (
          <section className="export-section">
            <div className="export-section-header">
              <p className="section-kicker">Timeline</p>
              <h3>Deroule horaire</h3>
            </div>
            <div className="export-card-list">
              {sortedTimelineDays.length ? (
                sortedTimelineDays.map((day) => {
                  const entries = data.timelineEntries
                    .filter((entry) => entry.dayId === day.id)
                    .sort((left, right) => left.startTime.localeCompare(right.startTime));

                  return (
                    <article className="export-card" key={day.id}>
                      <div className="meta-line">
                        <span>{day.label}</span>
                        <span>{formatDateLabel(day.dateISO, day.dateISO)}</span>
                      </div>
                      <h4>{day.label}</h4>
                      {entries.length ? (
                        <ul>
                          {entries.map((entry) => (
                            <li key={entry.id}>
                              {entry.startTime} - {entry.endTime} | {entry.title} | {entry.location}
                              {entry.summary ? ` | ${entry.summary}` : ""}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>Aucun bloc horaire pour cette journee.</p>
                      )}
                    </article>
                  );
                })
              ) : (
                <div className="empty-state">Aucune timeline a exporter.</div>
              )}
            </div>
          </section>
        ) : null}

        {selectedSet.has("storyboard") ? (
          <section className="export-section print-break-before">
            <div className="export-section-header">
              <p className="section-kicker">Storyboard</p>
              <h3>Scenes</h3>
            </div>
            <div className="export-card-list">
              {data.storyboardScenes.length ? (
                data.storyboardScenes.map((scene) => (
                  <article className="export-card" key={scene.id}>
                    <div className="meta-line">
                      <span>{scene.status}</span>
                      <span>
                        {scene.dayId
                          ? `${dayMap[scene.dayId]?.label ?? scene.dayId} | ${scene.startTime} - ${scene.endTime}`
                          : `${scene.startTime} - ${scene.endTime}`}
                      </span>
                      <span>{scene.location}</span>
                    </div>
                    <h4>{scene.title}</h4>
                    <p>{scene.summary}</p>
                    <div className="export-grid">
                      {scene.cards.map((card) => (
                        <div className="export-mini-card" key={card.id}>
                          <h5>{card.title}</h5>
                          <p>{card.content}</p>
                        </div>
                      ))}
                    </div>
                  </article>
                ))
              ) : (
                <div className="empty-state">Aucune scene a exporter.</div>
              )}
            </div>
          </section>
        ) : null}

        {selectedSet.has("kraft") ? (
          <section className="export-section">
            <div className="export-section-header">
              <p className="section-kicker">Kraft</p>
              <h3>Fabrications</h3>
            </div>
            <div className="export-grid">
              <article className="export-card">
                <h4>A faire</h4>
                {kraftTodo.length ? (
                  <ul>
                    {kraftTodo.map((item) => (
                      <li key={item.id}>
                        <strong>{item.title}</strong> - {item.owner} - {item.status}
                        <br />
                        {item.summary}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Aucun kraft en cours.</p>
                )}
              </article>
              <article className="export-card">
                <h4>Termines</h4>
                {kraftDone.length ? (
                  <ul>
                    {kraftDone.map((item) => (
                      <li key={item.id}>
                        <strong>{item.title}</strong> - {item.owner}
                        <br />
                        {item.summary}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Aucun kraft termine.</p>
                )}
              </article>
            </div>
          </section>
        ) : null}
      </section>
    </>
  );
}
