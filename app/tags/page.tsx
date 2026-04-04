"use client";

import { FormEvent, useMemo, useState } from "react";

import { useAppData } from "@/components/app-data-provider";
import { CreatePanel } from "@/components/create-panel";
import { PageHero } from "@/components/page-hero";
import { TagBadge } from "@/components/tag-badge";
import {
  groupTagDefinitionsWithSections,
  isSystemTagLabel,
  isSystemTagSection,
  normalizeTagLabel
} from "@/lib/tags";
import { buildDeleteConfirmation } from "@/lib/ui-copy";

export default function TagsPage() {
  const {
    data,
    createTagDefinition,
    updateTagDefinition,
    deleteTagDefinition,
    createTagSection,
    updateTagSection,
    deleteTagSection
  } = useAppData();
  const [sectionDraftLabel, setSectionDraftLabel] = useState("personnages");
  const [sectionDraftColor, setSectionDraftColor] = useState("#7A4E2D");
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [section, setSection] = useState("personnages");
  const [sectionColor, setSectionColor] = useState("#7A4E2D");
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const usageMap = useMemo(() => {
    const counts = new Map<string, number>();
    const lists = [
      ...data.documents.map((entry) => entry.tags),
      ...data.characters.map((entry) => entry.tags),
      ...data.plotCategories.map((entry) => entry.tags),
      ...data.plots.map((entry) => entry.tags),
      ...data.organizationCategories.map((entry) => entry.tags),
      ...data.tasks.map((entry) => entry.tags),
      ...data.meetingCategories.map((entry) => entry.tags),
      ...data.meetings.map((entry) => entry.tags),
      ...data.timelineEntries.map((entry) => entry.tags),
      ...data.storyboardScenes.map((entry) => entry.tags),
      ...data.kraftItems.map((entry) => entry.tags)
    ];

    for (const tags of lists) {
      for (const tag of tags) {
        const key = normalizeTagLabel(tag);
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }

    return counts;
  }, [data]);
  const groupedDefinitions = useMemo(
    () => groupTagDefinitionsWithSections(data.tagsRegistry, data.tagSections),
    [data.tagsRegistry, data.tagSections]
  );
  const editableSections = useMemo(
    () => data.tagSections.filter((entry) => !isSystemTagSection(entry.label)),
    [data.tagSections]
  );

  function resetForm() {
    setEditingId(null);
    setSection(editableSections[0]?.label ?? "personnages");
    setSectionColor(editableSections[0]?.color ?? "#7A4E2D");
    setLabel("");
    setDescription("");
  }

  function resetSectionForm() {
    setEditingSectionId(null);
    setSectionDraftLabel("personnages");
    setSectionDraftColor("#7A4E2D");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!label.trim()) return;

    if (editingId) {
      updateTagDefinition({
        id: editingId,
        label,
        section,
        sectionColor,
        color: sectionColor,
        description
      });
    } else {
      createTagDefinition({
        label,
        section,
        sectionColor,
        color: sectionColor,
        description
      });
    }

    resetForm();
  }

  function handleEdit(tagId: string) {
    const target = data.tagsRegistry.find((entry) => entry.id === tagId);
    if (!target || isSystemTagLabel(target.label)) return;

    setEditingId(target.id);
    setSection(target.section);
    setSectionColor(target.sectionColor);
    setLabel(target.label);
    setDescription(target.description ?? "");
  }

  function handleSectionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sectionDraftLabel.trim() || isSystemTagSection(sectionDraftLabel)) return;

    if (editingSectionId) {
      updateTagSection({
        id: editingSectionId,
        label: sectionDraftLabel,
        color: sectionDraftColor
      });
    } else {
      createTagSection({
        label: sectionDraftLabel,
        color: sectionDraftColor
      });
    }

    resetSectionForm();
  }

  function handleEditSection(sectionId: string) {
    const target = data.tagSections.find((entry) => entry.id === sectionId);
    if (!target || isSystemTagSection(target.label)) return;

    setEditingSectionId(target.id);
    setSectionDraftLabel(target.label);
    setSectionDraftColor(target.color);
  }

  function handleSectionChange(nextSection: string) {
    setSection(nextSection);
    const matchingSection = data.tagSections.find((entry) => entry.label === nextSection);
    if (matchingSection) {
      setSectionColor(matchingSection.color);
    }
  }

  return (
    <>
      <PageHero
        kicker="Tags / lexique commun"
        title="Des tags ranges par sections metier."
        copy="Chaque tag appartient maintenant a une section comme personnages, PNJ, intrigues ou kraft. On garde un lexique commun, mais classe de facon beaucoup plus lisible."
        actions={
          <>
            <span className="hero-note hero-note-accent">Tags coordonnes</span>
            <span className="hero-note">Base pour la recherche transverse</span>
          </>
        }
        aside={
          <>
            <CreatePanel
              title={editingSectionId ? "Modifier une section" : "Creer une section"}
              description="Les sections structurent le lexique global des tags."
            >
              <form className="form-stack" onSubmit={handleSectionSubmit}>
                <div className="field">
                  <label htmlFor="tag-section-draft">Nom de section</label>
                  <input
                    id="tag-section-draft"
                    value={sectionDraftLabel}
                    onChange={(event) => setSectionDraftLabel(event.target.value)}
                    placeholder="Exemple : personnages"
                  />
                </div>
                <div className="field">
                  <label htmlFor="tag-section-draft-color">Couleur de section</label>
                  <input
                    id="tag-section-draft-color"
                    type="color"
                    value={sectionDraftColor}
                    onChange={(event) => setSectionDraftColor(event.target.value)}
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="button-primary">
                    {editingSectionId ? "Enregistrer les modifications" : "Creer la section"}
                  </button>
                  {editingSectionId ? (
                    <>
                      <button
                        type="button"
                        className="button-secondary-light"
                        onClick={() => {
                          const target = data.tagSections.find((entry) => entry.id === editingSectionId);
                          if (!target) return;
                          if (!window.confirm(buildDeleteConfirmation({ entityLabel: "la section", name: target.label }))) return;
                          deleteTagSection(target.id);
                          resetSectionForm();
                        }}
                      >
                        Supprimer
                      </button>
                      <button type="button" className="button-secondary-light" onClick={resetSectionForm}>
                        Annuler
                      </button>
                    </>
                  ) : null}
                </div>
              </form>
            </CreatePanel>

            <CreatePanel
              title={editingId ? "Modifier un tag" : "Creer un tag"}
              description="Un tag bien defini sera plus facile a retrouver partout dans l'outil."
            >
              <form className="form-stack" onSubmit={handleSubmit}>
                <div className="field">
                  <label htmlFor="tag-section">Section</label>
                  <select
                    id="tag-section"
                    value={section}
                    onChange={(event) => handleSectionChange(event.target.value)}
                  >
                    {editableSections.map((entry) => (
                      <option key={entry.id} value={entry.label}>
                        {entry.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="tag-label">Nom du tag</label>
                  <input
                    id="tag-label"
                    value={label}
                    onChange={(event) => setLabel(event.target.value)}
                    placeholder="Exemple : prioritaire"
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="button-primary">
                    {editingId ? "Enregistrer les modifications" : "Creer le tag"}
                  </button>
                  {editingId ? (
                    <>
                      <button
                        type="button"
                        className="button-secondary-light"
                        onClick={() => {
                          const target = data.tagsRegistry.find((entry) => entry.id === editingId);
                          if (!target) return;
                          if (!window.confirm(buildDeleteConfirmation({ entityLabel: "le tag", name: target.label }))) return;
                          deleteTagDefinition(target.id);
                          resetForm();
                        }}
                      >
                        Supprimer
                      </button>
                      <button type="button" className="button-secondary-light" onClick={resetForm}>
                        Annuler
                      </button>
                    </>
                  ) : null}
                </div>
              </form>
            </CreatePanel>
          </>
        }
      />

      <section className="surface">
        <div className="section-header">
          <div>
            <p className="section-kicker">Registre</p>
            <h2 className="section-title">Sections et tags du GN</h2>
          </div>
        </div>

        <div className="tags-grid">
          {groupedDefinitions.map((group) => (
            <section className="tag-section-card" key={group.section}>
              <div className="tag-section-header">
                <span
                  className="tag-section-dot"
                  style={{ backgroundColor: group.sectionColor }}
                />
                <div>
                  <p className="section-kicker">Section</p>
                  <h3 className="section-title">{group.section}</h3>
                </div>
                {!isSystemTagSection(group.section) ? (
                  <div className="form-actions" style={{ marginLeft: "auto" }}>
                    <button
                      type="button"
                      className="button-secondary-light"
                      onClick={() => {
                        const target = data.tagSections.find((entry) => entry.label === group.section);
                        if (!target) return;
                        handleEditSection(target.id);
                      }}
                    >
                      Modifier la section
                    </button>
                  </div>
                ) : (
                  <div className="form-actions" style={{ marginLeft: "auto" }}>
                    <span className="chip">Section systeme</span>
                  </div>
                )}
              </div>
              <div className="tags-grid">
                {group.definitions.length ? (
                  group.definitions.map((definition) => (
                    <article className="tag-registry-item" key={definition.id}>
                      {isSystemTagLabel(definition.label) ? (
                        <div className="tag-registry-meta">
                          <TagBadge tag={definition.label} definitions={data.tagsRegistry} interactive={false} />
                          <span className="chip">
                            {usageMap.get(normalizeTagLabel(definition.label)) ?? 0} usage(s)
                          </span>
                          <span className="chip">Tag systeme</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="tag-edit-trigger"
                          onClick={() => handleEdit(definition.id)}
                        >
                          <div className="tag-registry-meta">
                            <TagBadge tag={definition.label} definitions={data.tagsRegistry} interactive={false} />
                            <span className="chip">
                              {usageMap.get(normalizeTagLabel(definition.label)) ?? 0} usage(s)
                            </span>
                            <span className="chip">Cliquer pour modifier</span>
                          </div>
                        </button>
                      )}
                      <p>{definition.description || "Aucune description pour le moment."}</p>
                      {!isSystemTagLabel(definition.label) ? (
                        <div className="form-actions">
                          <button type="button" className="button-primary" onClick={() => handleEdit(definition.id)}>
                            Modifier
                          </button>
                          <button
                            type="button"
                            className="button-secondary-light"
                            onClick={() => {
                              if (!window.confirm(buildDeleteConfirmation({ entityLabel: "le tag", name: definition.label }))) return;
                              deleteTagDefinition(definition.id);
                              if (editingId === definition.id) {
                                resetForm();
                              }
                            }}
                          >
                            Supprimer
                          </button>
                        </div>
                      ) : null}
                    </article>
                  ))
                ) : (
                  <div className="empty-state">Aucun tag dans cette section pour le moment.</div>
                )}
              </div>
            </section>
          ))}
        </div>
      </section>
    </>
  );
}
