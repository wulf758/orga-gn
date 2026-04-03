"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { useAppData } from "@/components/app-data-provider";
import { CreatePanel } from "@/components/create-panel";
import { PageHero } from "@/components/page-hero";

export default function MeetingsPage() {
  const { data, createCategory } = useAppData();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;
    createCategory({
      section: "meetings",
      title: title.trim(),
      summary: summary.trim() || "Nouvelle categorie de reunion."
    });
    setTitle("");
    setSummary("");
  }

  return (
    <>
      <PageHero
        kicker="Reunion orga / categories"
        title="Des categories de reunion avant les seances."
        copy="L'entree Reunion orga affiche les categories de reunion. Chaque categorie ouvre ensuite sur les seances prevues et leur suivi."
        actions={
          <>
            <span className="hero-note hero-note-accent">Vue categories active</span>
            <span className="hero-note">Suppression confirmee</span>
          </>
        }
        aside={
          <CreatePanel title="Creer une categorie" description="Creation d'un espace comme Scenario ou Logistique.">
            <form className="form-stack" onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="meeting-category-title">Nom</label>
                <input id="meeting-category-title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="meeting-category-summary">Description</label>
                <textarea id="meeting-category-summary" value={summary} onChange={(e) => setSummary(e.target.value)} />
              </div>
              <div className="form-actions">
                <button type="submit" className="button-primary">Ajouter la categorie</button>
              </div>
            </form>
          </CreatePanel>
        }
      />

      <section className="surface">
        <div className="section-header">
          <div>
            <p className="section-kicker">Racine reunion orga</p>
            <h2 className="section-title">Categories</h2>
          </div>
        </div>
        <div className="list-stack">
          {data.meetingCategories.map((category) => {
            const count = data.meetings.filter((meeting) => meeting.categorySlug === category.slug).length;
            return (
              <Link href={`/meetings/category/${category.slug}`} className="list-item" key={category.slug}>
                <h3>{category.title}</h3>
                <p>{category.summary}</p>
                <div className="meta-line">
                  <span>{count} reunion(s)</span>
                  <span>{category.updatedAt}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
