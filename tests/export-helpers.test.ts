import { describe, expect, it } from "vitest";

import {
  getCharacterExportFactions,
  getCharacterExportMeta,
  getCharacterExportPlayerNotes
} from "@/lib/export-helpers";
import type { Character, TagDefinition } from "@/lib/types";

const definitions: TagDefinition[] = [
  {
    id: "tag-alimar",
    label: "alimar",
    section: "faction",
    sectionColor: "#7A4E2D",
    color: "#7A4E2D",
    description: ""
  },
  {
    id: "tag-mara",
    label: "mara",
    section: "faction",
    sectionColor: "#7A4E2D",
    color: "#7A4E2D",
    description: ""
  },
  {
    id: "tag-secret",
    label: "secret",
    section: "intrigues",
    sectionColor: "#6B4E71",
    color: "#6B4E71",
    description: ""
  }
];

function makeCharacter(overrides: Partial<Character> = {}): Character {
  return {
    id: "char-1",
    name: "Alwin Wepper",
    role: "PJ",
    tags: ["alimar", "secret"],
    playerNotes: "Allergie au latex",
    background: "Background",
    objectives: ["Objectif"],
    secrets: ["Secret"],
    ...overrides
  };
}

describe("export helpers", () => {
  it("reads factions only from the faction tag section", () => {
    expect(getCharacterExportFactions(makeCharacter(), definitions)).toEqual(["alimar"]);
  });

  it("returns role-only meta when no faction tag is present", () => {
    expect(
      getCharacterExportMeta(makeCharacter({ role: "PNJ", tags: ["secret"] }), definitions)
    ).toEqual(["PNJ"]);
  });

  it("returns role and joined faction labels when factions exist", () => {
    expect(
      getCharacterExportMeta(makeCharacter({ tags: ["mara", "alimar", "secret"] }), definitions)
    ).toEqual(["PJ", "mara, alimar"]);
  });

  it("omits player notes when export option is disabled", () => {
    expect(getCharacterExportPlayerNotes(makeCharacter(), false)).toBeNull();
  });

  it("omits empty player notes even when export option is enabled", () => {
    expect(getCharacterExportPlayerNotes(makeCharacter({ playerNotes: "   " }), true)).toBeNull();
  });

  it("returns trimmed player notes when export option is enabled", () => {
    expect(getCharacterExportPlayerNotes(makeCharacter({ playerNotes: "  Allergie au latex  " }), true)).toBe(
      "Allergie au latex"
    );
  });
});
