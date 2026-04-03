"use client";

import Link from "next/link";

import { useAppData } from "@/components/app-data-provider";
import { PageHero } from "@/components/page-hero";
import { TagBadge } from "@/components/tag-badge";

function getCharacterPreview(background: string) {
  return background.replace(/\s+/g, " ").trim();
}

export default function CharactersPage() {
  const { data } = useAppData();
  const playerCharacters = data.characters.filter((character) => character.role === "PJ");
  const nonPlayerCharacters = data.characters.filter((character) => character.role === "PNJ");

  return (
    <>
      <PageHero
        kicker="Personnages / atelier d'ecriture"
        title="Des fiches simples pour les PJ et les PNJ."
        copy="Chaque fiche personnage reste volontairement legere pour l'instant : des tags, un background, des objectifs et des secrets."
        actions={
          <>
            <Link href="/characters/new" className="button-primary">
              Creer un personnage
            </Link>
            <span className="hero-note">PJ et PNJ separes</span>
          </>
        }
        aside={
          <div className="detail-block">
            <h3>Creer un personnage</h3>
            <p>
              Ouvre une page dediee pour creer une fiche PJ ou PNJ avec ses tags,
              son background, ses objectifs et ses secrets.
            </p>
            <div className="form-actions">
              <Link href="/characters/new" className="button-primary">
                Ouvrir l'editeur
              </Link>
            </div>
          </div>
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
                  {character.tags.length ? (
                    <div className="badge-row">
                      {character.tags.map((tag) => (
                        <TagBadge key={tag} tag={tag} definitions={data.tagsRegistry} />
                      ))}
                    </div>
                  ) : null}
                  <p className="character-preview">{getCharacterPreview(character.background)}</p>
                  <div className="meta-line">
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
                  {character.tags.length ? (
                    <div className="badge-row">
                      {character.tags.map((tag) => (
                        <TagBadge key={tag} tag={tag} definitions={data.tagsRegistry} />
                      ))}
                    </div>
                  ) : null}
                  <p className="character-preview">{getCharacterPreview(character.background)}</p>
                  <div className="meta-line">
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
