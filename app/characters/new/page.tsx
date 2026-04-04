"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { useAppData } from "@/components/app-data-provider";
import { PageHero } from "@/components/page-hero";
import { TagPicker } from "@/components/tag-picker";

function toLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function NewCharacterPage() {
  const router = useRouter();
  const { canViewPlayerInfo, data, createCharacter } = useAppData();
  const [name, setName] = useState("");
  const [role, setRole] = useState<"PJ" | "PNJ">("PJ");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [playerNotes, setPlayerNotes] = useState("");
  const [background, setBackground] = useState("");
  const [objectivesText, setObjectivesText] = useState("");
  const [secretsText, setSecretsText] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;

    createCharacter({
      name: name.trim(),
      role,
      tags: selectedTags,
      playerNotes: playerNotes.trim(),
      background: background.trim() || "Background a completer.",
      objectives: toLines(objectivesText),
      secrets: toLines(secretsText)
    });

    router.push("/characters");
  }

  return (
    <>
      <PageHero
        kicker="Personnages / creation"
        title="Creer une nouvelle fiche personnage."
        copy="Cette page dediee te laisse plus de place pour poser les tags et les informations narratives sans ecraser la vue de liste."
        actions={
          <>
            <Link href="/characters" className="button-secondary">
              Retour aux personnages
            </Link>
          </>
        }
      />

      <section className="note-page-stack">
        <div className="editor-block note-editor-block">
          <form className="note-edit-shell" onSubmit={handleSubmit}>
            <div className="note-edit-topbar">
              <span className="chip">Nouvelle fiche</span>
              <div className="note-edit-actions">
                <button type="submit" className="button-primary">
                  Creer le personnage
                </button>
              </div>
            </div>
            <div className="form-stack">
              <div className="surface-grid" style={{ marginTop: 0 }}>
                <div className="span-7 field">
                  <label htmlFor="character-create-name">Nom</label>
                  <input
                    id="character-create-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Exemple : Isolde"
                  />
                </div>
                <div className="span-2 field">
                  <label htmlFor="character-create-role">Type</label>
                  <select
                    id="character-create-role"
                    value={role}
                    onChange={(event) => setRole(event.target.value as "PJ" | "PNJ")}
                  >
                    <option value="PJ">PJ</option>
                    <option value="PNJ">PNJ</option>
                  </select>
                </div>
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
              {canViewPlayerInfo ? (
                <div className="field">
                  <label htmlFor="character-create-player-notes">Joueur / contraintes</label>
                  <textarea
                    id="character-create-player-notes"
                    value={playerNotes}
                    onChange={(event) => setPlayerNotes(event.target.value)}
                    placeholder="Allergies, phobies, limites de jeu, besoins particuliers..."
                  />
                </div>
              ) : null}
              <div className="field">
                <label htmlFor="character-create-background">Background</label>
                <textarea
                  id="character-create-background"
                  className="note-content-editor"
                  value={background}
                  onChange={(event) => setBackground(event.target.value)}
                  placeholder="Pose ici le socle narratif du personnage."
                />
              </div>
              <div className="field">
                <label htmlFor="character-create-objectives">Objectifs</label>
                <textarea
                  id="character-create-objectives"
                  value={objectivesText}
                  onChange={(event) => setObjectivesText(event.target.value)}
                  placeholder="Un objectif par ligne"
                />
              </div>
              <div className="field">
                <label htmlFor="character-create-secrets">Secrets</label>
                <textarea
                  id="character-create-secrets"
                  value={secretsText}
                  onChange={(event) => setSecretsText(event.target.value)}
                  placeholder="Un secret par ligne"
                />
              </div>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
