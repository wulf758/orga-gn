"use client";

import { FormEvent, useMemo, useState } from "react";

import { useAppData } from "@/components/app-data-provider";
import { CreatePanel } from "@/components/create-panel";
import { PageHero } from "@/components/page-hero";
import { TagBadge } from "@/components/tag-badge";
import { groupTagDefinitionsBySection, normalizeTagLabel } from "@/lib/tags";

export default function TagsPage() {
  const { data, createTagDefinition, updateTagDefinition, deleteTagDefinition } = useAppData();
  const [section, setSection] = useState("personnages");
  const [sectionColor, setSectionColor] = useState("#7A4E2D");
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const usageMap = useMemo(() => {
    const counts = new Map<string, number>();
    const lists = [
      ...data.documents.map((entry) => entry.tags),
      ...data.plotCategories.map((entry) => entry.tags),
      ...data.plots.map((entry) => entry.tags),
      ...data.organizationCategories.map((entry) => entry.tags),
      ...data.tasks.map((entry) => entry.tags),
      ...data.meetingCategories.map((entry) => entry.tags),
      ...data.meetings.map((entry) => entry.tags),
      ...data.timelineEntries.map((entry) => entry.tags)
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
    () => groupTagDefinitionsBySection(data.tagsRegistry),
    [data.tagsRegistry]
  );

  function resetForm() {
    setEditingId(null);
    setSection("personnages");
    setSectionColor("#7A4E2D");
    setLabel("");
    setDescription("");
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
    if (!target) return;

    setEditingId(target.id);
    setSection(target.section);
    setSectionColor(target.sectionColor);
    setLabel(target.label);
    setDescription(target.description ?? "");
  }

  return (
    <>
      <PageHero
        kicker="Tags / lexique commun"
        title="Des tags ranges par sections metier."
        copy="Chaque tag appartient maintenant a une section comme personnages, PNJ, intrigues ou kraft. On garde un lexique commun, mais classe de facon beaucoup plus lisible."
        actions={
          <>
            <span className="button-primary">Tags coordonnes</span>
            <span className="button-secondary">Base pour la recherche transverse</span>
          </>
        }
        aside={
          <CreatePanel
            title={editingId ? "Modifier un tag" : "Creer un tag"}
            description="Un tag bien defini sera plus facile a retrouver partout dans l'outil."
          >
            <form className="form-stack" onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="tag-section">Section</label>
                <input
                  id="tag-section"
                  value={section}
                  onChange={(event) => setSection(event.target.value)}
                  placeholder="Exemple : personnages"
                />
              </div>
              <div className="field">
                <label htmlFor="tag-section-color">Couleur de section</label>
                <input
                  id="tag-section-color"
                  type="color"
                  value={sectionColor}
                  onChange={(event) => setSectionColor(event.target.value)}
                />
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
              <div className="field">
                <label htmlFor="tag-description">Description</label>
                <textarea
                  id="tag-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="A quoi sert ce tag dans l'equipe ?"
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="button-primary">
                  {editingId ? "Enregistrer le tag" : "Ajouter le tag"}
                </button>
                {editingId ? (
                  <>
                    <button
                      type="button"
                      className="button-secondary-light"
                      onClick={() => {
                        const target = data.tagsRegistry.find((entry) => entry.id === editingId);
                        if (!target) return;
                        if (!window.confirm(`Supprimer le tag "${target.label}" ?`)) return;
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
              </div>
              <div className="tags-grid">
                {group.definitions.map((definition) => (
                  <article className="tag-registry-item" key={definition.id}>
                    <button
                      type="button"
                      className="tag-edit-trigger"
                      onClick={() => handleEdit(definition.id)}
                    >
                      <div className="tag-registry-meta">
                        <TagBadge tag={definition.label} definitions={data.tagsRegistry} />
                        <span className="chip">
                          {usageMap.get(normalizeTagLabel(definition.label)) ?? 0} usage(s)
                        </span>
                        <span className="chip">Cliquer pour modifier</span>
                      </div>
                    </button>
                    <p>{definition.description || "Aucune description pour l'instant."}</p>
                    <div className="form-actions">
                      <button type="button" className="button-primary" onClick={() => handleEdit(definition.id)}>
                        Modifier
                      </button>
                      <button
                        type="button"
                        className="button-secondary"
                        onClick={() => {
                          if (!window.confirm(`Supprimer le tag "${definition.label}" ?`)) return;
                          deleteTagDefinition(definition.id);
                          if (editingId === definition.id) {
                            resetForm();
                          }
                        }}
                      >
                        Supprimer
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </>
  );
}
