"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { useAppData } from "@/components/app-data-provider";
import { PageHero } from "@/components/page-hero";
import { StatusPill } from "@/components/status-pill";
import { TagBadge } from "@/components/tag-badge";

const KRAFT_STATUSES = ["A commencer", "A finir", "Fini"] as const;

export default function KraftPage() {
  const { data, updateKraftItem, deleteKraftItem } = useAppData();
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
            <Link href="/kraft/new" className="button-primary">
              Creer un kraft
            </Link>
            <span className="button-secondary">Tags d'avancement visibles</span>
          </>
        }
        aside={
          <div className="detail-block">
            <h3>Creer un kraft</h3>
            <p>
              Ouvre une page dediee pour preparer un nouvel element avec ses tags,
              son responsable et son etat d'avancement.
            </p>
            <div className="form-actions">
              <Link href="/kraft/new" className="button-primary">
                Ouvrir l'editeur
              </Link>
            </div>
          </div>
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
