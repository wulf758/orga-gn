import { describe, expect, it } from "vitest";

import {
  parseDocumentContent,
  serializeDocumentContent
} from "@/lib/document-content";

describe("document content helpers", () => {
  it("preserves sections, paragraphs, and bullets when round-tripping", () => {
    const original = [
      {
        heading: "Vue d'ensemble",
        paragraphs: ["Premier paragraphe.", "Second paragraphe."],
        bullets: ["Point A", "Point B"]
      },
      {
        heading: "Rappels",
        paragraphs: ["Une note finale."]
      }
    ];

    const serialized = serializeDocumentContent(original, "Fallback");
    const parsed = parseDocumentContent(serialized, "Fallback");

    expect(parsed).toEqual(original);
  });

  it("keeps a fallback section when text is empty", () => {
    expect(parseDocumentContent("", "Titre vide")).toEqual([
      {
        heading: "Titre vide",
        paragraphs: []
      }
    ]);
  });

  it("creates multiple paragraphs from blank-line-separated text", () => {
    expect(
      parseDocumentContent("## Scene\n\nPremier bloc.\n\nSecond bloc.", "Fallback")
    ).toEqual([
      {
        heading: "Scene",
        paragraphs: ["Premier bloc.", "Second bloc."]
      }
    ]);
  });

  it("reads bullets without creating empty paragraphs", () => {
    expect(
      parseDocumentContent("## Rappels\n\n- Torche\n- Clef", "Fallback")
    ).toEqual([
      {
        heading: "Rappels",
        paragraphs: [],
        bullets: ["Torche", "Clef"]
      }
    ]);
  });
});
