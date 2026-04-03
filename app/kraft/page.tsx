"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { useAppData } from "@/components/app-data-provider";
import { CreatePanel } from "@/components/create-panel";
import { PageHero } from "@/components/page-hero";
import { StatusPill } from "@/components/status-pill";
import { TagBadge } from "@/components/tag-badge";
import { TagPicker } from "@/components/tag-picker";

const KRAFT_STATUSES = ["A commencer", "A finir", "Fini"] as const;

export default function KraftPage() {
  const { data, createKraftItem, updateKraftItem, deleteKraftItem } = useAppData();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [owner, setOwner] = useState("");
  const [status, setStatus] =
    useState<(typeof KRAFT_STATUSES)[number]>("A commencer");

  const kraftToDo = useMemo(
    () => data.kraftItems.filter((item) => item.status !== "Fini"),
    [data.kraftItems]
  );
  const kraftDone = useMemo(
    () => data.kraftItems.filter((item) => item.status === "Fini"),
    [data.kraftItems]
  );
  const editingItem =
    data.kraftItems.find((item) => item.id === editingId) ?? null;

  useEffect(() => {
    if (!editingItem) {
      setTitle("");
      setSummary("");
      setSelectedTags([]);
      setOwner("");
      setStatus("A commencer");
      return;
    }

    setTitle(editingItem.title);
    setSummary(editingItem.summary);
    setSelectedTags(editingItem.tags);
    setOwner(editingItem.owner);
    setStatus(editingItem.status);
  }, [editingItem]);

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setSummary("");
    setSelectedTags([]);
    setOwner("");
    setStatus("A commencer");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;

    const payload = {
      title: title.trim(),
      summary: summary.trim() || "Kraft a completer.",
      tags: selectedTags,
      owner: owner.trim() || "Responsable a definir",
      status
    };

    if (editingId) {
      updateKraftItem({
        id: editingId,
        ...payload
      });
    } else {
      createKraftItem(payload);
    }

    resetForm();
  }

  function handleDelete(id: string, label: string) {
    if (!window.confirm(`Supprimer le kraft "${label}" ?`)) return;
    deleteKraftItem(id);
    if (editingId === id) {
      resetForm();
    }
  }

  return (
    <>
      <PageHero
        kicker="Kraft / suivi de fabrication"
        title="Un espace simple pour suivre tout ce qui se fabrique."
        copy="Cette vue distingue les krafts a faire des elements deja termines, pour garder une vision claire de l'avancement materiel du GN."
        actions={
          <>
            <span className="button-primary">Liste a faire / fini</span>
            <span className="button-secondary">Tags d'avancement visibles</span>
          </>
        }
        aside={
          <CreatePanel
            title={editingId ? "Modifier un kraft" : "Ajouter un kraft"}
            description="Suivi des elements en fabrication, de leur responsable et de leur etat d'avancement."
          >
            <form className="form-stack" onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="kraft-title">Titre</label>
                <input
                  id="kraft-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Exemple : Registre de succession"
                />
              </div>
              <div className="field">
                <label htmlFor="kraft-summary">Resume</label>
                <textarea
                  id="kraft-summary"
                  value={summary}
                  onChange={(event) => setSummary(event.target.value)}
                  placeholder="Ce qui doit etre fabrique, verifie ou termine."
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
                <label htmlFor="kraft-owner">Responsable</label>
                <input
                  id="kraft-owner"
                  value={owner}
                  onChange={(event) => setOwner(event.target.value)}
                  placeholder="Pole accessoires"
                />
              </div>
              <div className="field">
                <label htmlFor="kraft-status">Avancement</label>
                <select
                  id="kraft-status"
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value as (typeof KRAFT_STATUSES)[number])
                  }
                >
                  {KRAFT_STATUSES.map((entry) => (
                    <option key={entry} value={entry}>
                      {entry}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-actions">
                <button type="submit" className="button-primary">
                  {editingId ? "Enregistrer le kraft" : "Ajouter le kraft"}
                </button>
                {editingId ? (
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={resetForm}
                  >
                    Annuler
                  </button>
                ) : null}
              </div>
            </form>
          </CreatePanel>
        }
      />

      <section className="stats-row">
        <div className="stat-block">
          <p className="stat-value">{data.kraftItems.length}</p>
          <p className="stat-label">krafts suivis</p>
          <p className="stat-helper">tous etats confondus</p>
        </div>
        <div className="stat-block">
          <p className="stat-value">{kraftToDo.length}</p>
          <p className="stat-label">encore a traiter</p>
          <p className="stat-helper">a commencer ou a finir</p>
        </div>
        <div className="stat-block">
          <p className="stat-value">{kraftDone.length}</p>
          <p className="stat-label">termines</p>
          <p className="stat-helper">pret pour le jeu</p>
        </div>
      </section>

      <section className="surface-grid">
        <div className="surface span-7">
          <div className="section-header">
            <div>
              <p className="section-kicker">Suivi en cours</p>
              <h2 className="section-title">A faire</h2>
              <p className="section-copy">
                Les krafts encore en fabrication ou a finaliser.
              </p>
            </div>
          </div>
          <div className="list-stack">
            {kraftToDo.length ? (
              kraftToDo.map((item) => (
                <article className="list-item" key={item.id}>
                  <h3>{item.title}</h3>
                  {item.tags.length ? (
                    <div className="badge-row">
                      {item.tags.map((tag) => (
                        <TagBadge key={tag} tag={tag} definitions={data.tagsRegistry} />
                      ))}
                    </div>
                  ) : null}
                  <p>{item.summary}</p>
                  <div className="meta-line">
                    <span>{item.owner}</span>
                    <StatusPill tone={item.status === "A finir" ? "warning" : undefined}>
                      {item.status}
                    </StatusPill>
                  </div>
                  <div className="form-actions" style={{ marginTop: 14 }}>
                    <button
                      type="button"
                      className="button-primary"
                      onClick={() => setEditingId(item.id)}
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      className="button-secondary"
                      onClick={() => handleDelete(item.id, item.title)}
                    >
                      Supprimer
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-state">
                Aucun kraft a suivre pour l'instant.
              </div>
            )}
          </div>
        </div>

        <div className="surface span-5">
          <div className="section-header">
            <div>
              <p className="section-kicker">Elements termines</p>
              <h2 className="section-title">Fini</h2>
              <p className="section-copy">
                Les pieces deja prêtes ou sorties du suivi actif.
              </p>
            </div>
          </div>
          <div className="list-stack">
            {kraftDone.length ? (
              kraftDone.map((item) => (
                <article className="list-item" key={item.id}>
                  <h3>{item.title}</h3>
                  {item.tags.length ? (
                    <div className="badge-row">
                      {item.tags.map((tag) => (
                        <TagBadge key={tag} tag={tag} definitions={data.tagsRegistry} />
                      ))}
                    </div>
                  ) : null}
                  <p>{item.summary}</p>
                  <div className="meta-line">
                    <span>{item.owner}</span>
                    <StatusPill tone="success">{item.status}</StatusPill>
                  </div>
                  <div className="form-actions" style={{ marginTop: 14 }}>
                    <button
                      type="button"
                      className="button-primary"
                      onClick={() => setEditingId(item.id)}
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      className="button-secondary"
                      onClick={() => handleDelete(item.id, item.title)}
                    >
                      Supprimer
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-state">
                Aucun kraft termine pour l'instant.
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
