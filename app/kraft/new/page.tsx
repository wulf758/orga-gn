"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { useAppData } from "@/components/app-data-provider";
import { PageHero } from "@/components/page-hero";
import { TagPicker } from "@/components/tag-picker";

const KRAFT_STATUSES = ["A commencer", "A finir", "Fini"] as const;

export default function NewKraftPage() {
  const router = useRouter();
  const { data, createKraftItem } = useAppData();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [owner, setOwner] = useState("");
  const [status, setStatus] =
    useState<(typeof KRAFT_STATUSES)[number]>("A commencer");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;

    createKraftItem({
      title: title.trim(),
      summary: summary.trim() || "Kraft a completer.",
      tags: selectedTags,
      owner: owner.trim() || "Responsable a definir",
      status
    });

    router.push("/kraft");
  }

  return (
    <>
      <PageHero
        kicker="Kraft / creation"
        title="Creer un nouveau kraft."
        copy="Cette page dediee te laisse plus de place pour poser les tags, les details pratiques et le statut sans ecraser la vue de suivi."
        actions={
          <>
            <Link href="/kraft" className="button-secondary">
              Retour au kraft
            </Link>
          </>
        }
      />

      <section className="note-page-stack">
        <div className="editor-block note-editor-block">
          <form className="note-edit-shell" onSubmit={handleSubmit}>
            <div className="note-edit-topbar">
              <span className="chip">Nouveau kraft</span>
              <div className="note-edit-actions">
                <button type="submit" className="button-primary">
                  Creer le kraft
                </button>
              </div>
            </div>
            <div className="form-stack">
              <div className="field">
                <label htmlFor="kraft-create-title">Titre</label>
                <input
                  id="kraft-create-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Exemple : Registre de succession"
                />
              </div>
              <div className="field">
                <label htmlFor="kraft-create-summary">Resume</label>
                <textarea
                  id="kraft-create-summary"
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
                <label htmlFor="kraft-create-owner">Responsable</label>
                <input
                  id="kraft-create-owner"
                  value={owner}
                  onChange={(event) => setOwner(event.target.value)}
                  placeholder="Pole accessoires"
                />
              </div>
              <div className="field">
                <label htmlFor="kraft-create-status">Avancement</label>
                <select
                  id="kraft-create-status"
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
          </form>
        </div>
      </section>
    </>
  );
}
