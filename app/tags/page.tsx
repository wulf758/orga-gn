"use client";

import { FormEvent, useMemo, useState } from "react";

import { useAppData } from "@/components/app-data-provider";
import { CreatePanel } from "@/components/create-panel";
import { PageHero } from "@/components/page-hero";
import { TagBadge } from "@/components/tag-badge";
import { normalizeTagLabel } from "@/lib/tags";

export default function TagsPage() {
  const { data, createTagDefinition, updateTagDefinition, deleteTagDefinition } = useAppData();
  const [label, setLabel] = useState("");
  const [color, setColor] = useState("#C84B31");
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

  function resetForm() {
    setEditingId(null);
    setLabel("");
    setColor("#C84B31");
    setDescription("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!label.trim()) return;

    if (editingId) {
      updateTagDefinition({
        id: editingId,
        label,
        color,
        description
      });
    } else {
      createTagDefinition({
        label,
        color,
        description
      });
    }

    resetForm();
  }

  function handleEdit(tagId: string) {
    const target = data.tagsRegistry.find((entry) => entry.id === tagId);
    if (!target) return;

    setEditingId(target.id);
    setLabel(target.label);
    setColor(target.color);
    setDescription(target.description ?? "");
  }

  return (
    <>
      <PageHero
        kicker="Tags / lexique commun"
        title="Un seul registre de tags pour tout le GN."
        copy="Cette page centralise les tags du projet. Le meme vocabulaire et les memes couleurs peuvent ensuite etre reutilises dans les documents, intrigues, taches, reunions et timeline."
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
                <label htmlFor="tag-label">Nom du tag</label>
                <input
                  id="tag-label"
                  value={label}
                  onChange={(event) => setLabel(event.target.value)}
                  placeholder="Exemple : prioritaire"
                />
              </div>
              <div className="field">
                <label htmlFor="tag-color">Couleur</label>
                <input
                  id="tag-color"
                  type="color"
                  value={color}
                  onChange={(event) => setColor(event.target.value)}
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
                  <button type="button" className="button-secondary" onClick={resetForm}>
                    Annuler
                  </button>
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
            <h2 className="section-title">Tags du GN</h2>
          </div>
        </div>

        <div className="tags-grid">
          {data.tagsRegistry.map((definition) => (
            <article className="tag-registry-item" key={definition.id}>
              <div className="tag-registry-meta">
                <TagBadge tag={definition.label} definitions={data.tagsRegistry} />
                <span className="chip">{usageMap.get(normalizeTagLabel(definition.label)) ?? 0} usage(s)</span>
              </div>
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
    </>
  );
}
