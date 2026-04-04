"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { useAppData } from "@/components/app-data-provider";
import { PageHero } from "@/components/page-hero";
import { StatusPill } from "@/components/status-pill";
import { TagBadge } from "@/components/tag-badge";
import { TagPicker } from "@/components/tag-picker";
import { buildDeleteConfirmation } from "@/lib/ui-copy";

const KRAFT_STATUSES = ["A commencer", "A finir", "Fini"] as const;

export default function KraftDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data, deleteKraftItem, updateKraftItem } = useAppData();
  const item = data.kraftItems.find((entry) => entry.id === params.id);

  const [title, setTitle] = useState(item?.title ?? "");
  const [summary, setSummary] = useState(item?.summary ?? "");
  const [selectedTags, setSelectedTags] = useState(item?.tags ?? []);
  const [owner, setOwner] = useState(item?.owner ?? "");
  const [status, setStatus] =
    useState<(typeof KRAFT_STATUSES)[number]>(item?.status ?? "A commencer");

  if (!item) {
    return <div className="empty-state">Ce kraft est introuvable.</div>;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!item || !title.trim()) return;

    updateKraftItem({
      id: item.id,
      title: title.trim(),
      summary: summary.trim() || "Kraft a completer.",
      tags: selectedTags,
      owner: owner.trim() || "Responsable a definir",
      status
    });

    router.push("/kraft");
  }

  function handleDelete() {
    if (!item) return;
    if (!window.confirm(buildDeleteConfirmation({ entityLabel: "le kraft", name: item.title }))) return;
    deleteKraftItem(item.id);
    router.push("/kraft");
  }

  return (
    <>
      <PageHero
        kicker="Kraft / edition"
        title={item.title}
        copy={item.summary}
        actions={
          <>
            <Link href="/kraft" className="button-secondary">
              Retour au kraft
            </Link>
            <button type="button" className="button-secondary" onClick={handleDelete}>
              Supprimer
            </button>
          </>
        }
        aside={
          <div className="detail-grid">
            <div className="detail-block">
              <h3>Responsable</h3>
              <p>{item.owner}</p>
            </div>
            <div className="detail-block">
              <h3>Statut</h3>
              <div className="meta-line">
                <StatusPill tone={item.status === "Fini" ? "success" : item.status === "A finir" ? "warning" : undefined}>
                  {item.status}
                </StatusPill>
              </div>
            </div>
            <div className="detail-block">
              <h3>Tags</h3>
              <div className="badge-row" style={{ marginTop: 12 }}>
                {item.tags.length ? (
                  item.tags.map((tag) => (
                    <TagBadge key={tag} tag={tag} definitions={data.tagsRegistry} />
                  ))
                ) : (
                  <p>Aucun tag pour le moment.</p>
                )}
              </div>
            </div>
          </div>
        }
      />

      <section className="note-page-stack">
        <div className="editor-block note-editor-block">
          <form className="note-edit-shell" onSubmit={handleSubmit}>
            <div className="note-edit-topbar">
              <span className="chip">Edition du kraft</span>
              <div className="note-edit-actions">
                <button type="submit" className="button-primary">
                  Enregistrer les modifications
                </button>
              </div>
            </div>
            <div className="form-stack">
              <div className="field">
                <label htmlFor="kraft-edit-title">Titre</label>
                <input
                  id="kraft-edit-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="kraft-edit-summary">Resume</label>
                <textarea
                  id="kraft-edit-summary"
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
              <div className="surface-grid" style={{ marginTop: 0 }}>
                <div className="span-7 field">
                  <label htmlFor="kraft-edit-owner">Responsable</label>
                  <input
                    id="kraft-edit-owner"
                    value={owner}
                    onChange={(event) => setOwner(event.target.value)}
                  />
                </div>
                <div className="span-5 field">
                  <label htmlFor="kraft-edit-status">Avancement</label>
                  <select
                    id="kraft-edit-status"
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
              </div>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
