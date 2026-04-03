"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { useAppData } from "@/components/app-data-provider";
import { CreatePanel } from "@/components/create-panel";
import { PageHero } from "@/components/page-hero";

function toLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function getCharacterPreview(background: string) {
  return background.replace(/\s+/g, " ").trim();
}

export default function CharactersPage() {
  const { data, createCharacter } = useAppData();
  const playerCharacters = data.characters.filter((character) => character.role === "PJ");
  const nonPlayerCharacters = data.characters.filter((character) => character.role === "PNJ");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"PJ" | "PNJ">("PJ");
  const [faction, setFaction] = useState("");
  const [background, setBackground] = useState("");
  const [objectivesText, setObjectivesText] = useState("");
  const [secretsText, setSecretsText] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      return;
    }

    createCharacter({
      name: name.trim(),
      role,
      faction: faction.trim() || "Sans faction",
      background: background.trim() || "Background a completer.",
      objectives: toLines(objectivesText),
      secrets: toLines(secretsText)
    });

    setName("");
    setRole("PJ");
    setFaction("");
    setBackground("");
    setObjectivesText("");
    setSecretsText("");
  }

  return (
    <>
      <PageHero
        kicker="Personnages / atelier d'ecriture"
        title="Des fiches simples pour les PJ et les PNJ."
        copy="Chaque fiche personnage reste volontairement legere pour l'instant : une faction, un background, des objectifs et des secrets."
        actions={
          <>
            <span className="button-primary">Fiches editables actives</span>
            <span className="button-secondary">PJ et PNJ separes</span>
          </>
        }
        aside={
          <CreatePanel
            title="Creer un personnage"
            description="Creation d'une fiche PJ ou PNJ avec les informations essentielles."
          >
            <form className="form-stack" onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="character-name">Nom</label>
                <input
                  id="character-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Exemple : Isolde"
                />
              </div>
              <div className="field">
                <label htmlFor="character-role">Type</label>
                <select
                  id="character-role"
                  value={role}
                  onChange={(event) => setRole(event.target.value as "PJ" | "PNJ")}
                >
                  <option value="PJ">PJ</option>
                  <option value="PNJ">PNJ</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="character-faction">Faction</label>
                <input
                  id="character-faction"
                  value={faction}
                  onChange={(event) => setFaction(event.target.value)}
                  placeholder="Maison du Lion"
                />
              </div>
              <div className="field">
                <label htmlFor="character-background">Background</label>
                <textarea
                  id="character-background"
                  value={background}
                  onChange={(event) => setBackground(event.target.value)}
                  placeholder="Pose ici le socle narratif du personnage."
                />
              </div>
              <div className="field">
                <label htmlFor="character-objectives">Objectifs</label>
                <textarea
                  id="character-objectives"
                  value={objectivesText}
                  onChange={(event) => setObjectivesText(event.target.value)}
                  placeholder={"Un objectif par ligne"}
                />
              </div>
              <div className="field">
                <label htmlFor="character-secrets">Secrets</label>
                <textarea
                  id="character-secrets"
                  value={secretsText}
                  onChange={(event) => setSecretsText(event.target.value)}
                  placeholder={"Un secret par ligne"}
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="button-primary">
                  Creer la fiche
                </button>
              </div>
            </form>
          </CreatePanel>
        }
      />

      <section className="surface-grid">
        <div className="surface span-6">
          <div className="section-header">
            <div>
              <p className="section-kicker">Repertoire</p>
              <h2 className="section-title">PJ</h2>
            </div>
          </div>
          <div className="list-stack">
            {playerCharacters.length ? (
              playerCharacters.map((character) => (
                <Link href={`/characters/${character.id}`} className="list-item" key={character.id}>
                  <h3>{character.name}</h3>
                  <p className="character-preview">{getCharacterPreview(character.background)}</p>
                  <div className="meta-line">
                    <span>{character.faction}</span>
                    <span>{character.objectives.length} objectif(s)</span>
                    <span>{character.secrets.length} secret(s)</span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="empty-state">Aucun PJ pour l'instant.</div>
            )}
          </div>
        </div>

        <div className="surface span-6">
          <div className="section-header">
            <div>
              <p className="section-kicker">Repertoire</p>
              <h2 className="section-title">PNJ</h2>
            </div>
          </div>
          <div className="list-stack">
            {nonPlayerCharacters.length ? (
              nonPlayerCharacters.map((character) => (
                <Link href={`/characters/${character.id}`} className="list-item" key={character.id}>
                  <h3>{character.name}</h3>
                  <p className="character-preview">{getCharacterPreview(character.background)}</p>
                  <div className="meta-line">
                    <span>{character.faction}</span>
                    <span>{character.objectives.length} objectif(s)</span>
                    <span>{character.secrets.length} secret(s)</span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="empty-state">Aucun PNJ pour l'instant.</div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
