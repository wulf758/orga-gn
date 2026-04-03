"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";

import { useAppData } from "@/components/app-data-provider";
import { PageHero } from "@/components/page-hero";
import { RichTextPreview } from "@/components/rich-text-preview";
import { TagBadge } from "@/components/tag-badge";
import { TagPicker } from "@/components/tag-picker";

function toLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function CharacterDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data, deleteCharacter, updateCharacter } = useAppData();
  const character = data.characters.find((entry) => entry.id === params.id);
  const backgroundRef = useRef<HTMLTextAreaElement | null>(null);

  const [name, setName] = useState(character?.name ?? "");
  const [role, setRole] = useState<"PJ" | "PNJ">(character?.role ?? "PJ");
  const [selectedTags, setSelectedTags] = useState(character?.tags ?? []);
  const [playerNotes, setPlayerNotes] = useState(character?.playerNotes ?? "");
  const [background, setBackground] = useState(character?.background ?? "");
  const [objectivesText, setObjectivesText] = useState(
    character?.objectives?.join("\n") ?? ""
  );
  const [secretsText, setSecretsText] = useState(
    character?.secrets?.join("\n") ?? ""
  );
  const [isEditing, setIsEditing] = useState(false);

  if (!character) {
    return <div className="empty-state">Ce personnage est introuvable.</div>;
  }

  const currentCharacter = character;
  function insertAroundSelection(before: string, after = before) {
    const textarea = backgroundRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = background.slice(start, end);
    const nextValue =
      background.slice(0, start) + before + selectedText + after + background.slice(end);

    setBackground(nextValue);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    });
  }

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;

    updateCharacter({
      id: currentCharacter.id,
      name: name.trim(),
      role,
      tags: selectedTags,
      playerNotes: playerNotes.trim(),
      background: background.trim() || "Background a completer.",
      objectives: toLines(objectivesText),
      secrets: toLines(secretsText)
    });

    setIsEditing(false);
  }

  function handleCancel() {
    setName(currentCharacter.name);
    setRole(currentCharacter.role);
    setSelectedTags(currentCharacter.tags);
    setPlayerNotes(currentCharacter.playerNotes ?? "");
    setBackground(currentCharacter.background);
    setObjectivesText(currentCharacter.objectives.join("\n"));
    setSecretsText(currentCharacter.secrets.join("\n"));
    setIsEditing(false);
  }

  function handleDelete() {
    if (!window.confirm(`Supprimer la fiche "${currentCharacter.name}" ?`)) return;
    deleteCharacter(currentCharacter.id);
    router.push("/characters");
  }

  return (
    <>
      <PageHero
        kicker={`${currentCharacter.role} / fiche personnage`}
        title={currentCharacter.name}
        copy=""
        actions={
          <>
            <div className="hero-meta">
              <div className="badge-row">
                <TagBadge tag={currentCharacter.role} definitions={data.tagsRegistry} />
                {currentCharacter.status ? (
                  <TagBadge tag={currentCharacter.status} definitions={data.tagsRegistry} />
                ) : null}
                {currentCharacter.tags.map((tag) => (
                  <TagBadge key={tag} tag={tag} definitions={data.tagsRegistry} />
                ))}
              </div>
            </div>
            <Link href="/characters" className="button-primary">
              Retour aux personnages
            </Link>
            <button type="button" className="button-secondary" onClick={() => setIsEditing((value) => !value)}>
              {isEditing ? "Quitter l'edition" : "Mode editeur"}
            </button>
            <button type="button" className="button-secondary" onClick={handleDelete}>
              Supprimer la fiche
            </button>
          </>
        }
        aside={
          <div className="detail-grid">
            <div className="detail-block">
              <h3>Type</h3>
              <p>{currentCharacter.role}</p>
            </div>
            <div className="detail-block">
              <h3>Joueur</h3>
              <p>{currentCharacter.playerNotes?.trim() || "Aucune contrainte renseignee."}</p>
            </div>
          </div>
        }
      />

      <section className="note-page-stack">
        <div className="editor-block note-editor-block">
          {isEditing ? (
            <form className="note-edit-shell" onSubmit={handleSave}>
              <div className="note-edit-topbar">
                <span className="chip">Edition en cours</span>
                <div className="note-edit-actions">
                  <button type="submit" className="icon-action confirm" aria-label="Valider">
                    ✓
                  </button>
                  <button type="button" className="icon-action cancel" aria-label="Annuler" onClick={handleCancel}>
                    ✕
                  </button>
                </div>
              </div>
              <div className="form-stack">
                <div className="surface-grid" style={{ marginTop: 0 }}>
                  <div className="span-7 field">
                    <label htmlFor="character-edit-name">Nom</label>
                    <input id="character-edit-name" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="span-2 field">
                    <label htmlFor="character-edit-role">Type</label>
                    <select id="character-edit-role" value={role} onChange={(e) => setRole(e.target.value as "PJ" | "PNJ")}>
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
                <div className="field">
                  <label htmlFor="character-edit-player-notes">Joueur / contraintes</label>
                  <textarea
                    id="character-edit-player-notes"
                    value={playerNotes}
                    onChange={(e) => setPlayerNotes(e.target.value)}
                    placeholder="Allergies, phobies, limites de jeu, besoins particuliers..."
                  />
                </div>
                <div className="field">
                  <label htmlFor="character-edit-background">Background</label>
                  <div className="editor-toolbar note-toolbar">
                    <button type="button" className="editor-button" onClick={() => insertAroundSelection("**")}>
                      Gras
                    </button>
                    <button type="button" className="editor-button" onClick={() => insertAroundSelection("__")}>
                      Souligne
                    </button>
                    <button type="button" className="editor-button" onClick={() => insertAroundSelection("*")}>
                      Italique
                    </button>
                  </div>
                  <textarea
                    id="character-edit-background"
                    ref={backgroundRef}
                    className="note-content-editor"
                    value={background}
                    onChange={(e) => setBackground(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="character-edit-objectives">Objectifs</label>
                  <textarea
                    id="character-edit-objectives"
                    value={objectivesText}
                    onChange={(e) => setObjectivesText(e.target.value)}
                    placeholder="Un objectif par ligne"
                  />
                </div>
                <div className="field">
                  <label htmlFor="character-edit-secrets">Secrets</label>
                  <textarea
                    id="character-edit-secrets"
                    value={secretsText}
                    onChange={(e) => setSecretsText(e.target.value)}
                    placeholder="Un secret par ligne"
                  />
                </div>
              </div>
            </form>
          ) : (
            <div className="note-read-shell">
              <div className="note-read-header">
                <h2>{currentCharacter.name}</h2>
                <button type="button" className="editor-button" onClick={() => setIsEditing(true)}>
                  Modifier
                </button>
              </div>
              <div className="note-read-content">
                <RichTextPreview text={currentCharacter.background} />
              </div>
            </div>
          )}
        </div>

        <div className="surface-grid">
          <div className="detail-block span-12">
            <h3>Joueur / contraintes</h3>
            <p>{currentCharacter.playerNotes?.trim() || "Aucune contrainte renseignee pour l'instant."}</p>
          </div>

          <div className="detail-block span-6">
            <h3>Objectifs</h3>
            {currentCharacter.objectives.length ? (
              <ul>
                {currentCharacter.objectives.map((objective) => (
                  <li key={objective}>{objective}</li>
                ))}
              </ul>
            ) : (
              <p>Aucun objectif saisi pour l'instant.</p>
            )}
          </div>

          <div className="detail-block span-6">
            <h3>Secrets</h3>
            {currentCharacter.secrets.length ? (
              <ul>
                {currentCharacter.secrets.map((secret) => (
                  <li key={secret}>{secret}</li>
                ))}
              </ul>
            ) : (
              <p>Aucun secret saisi pour l'instant.</p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
