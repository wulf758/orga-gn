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
});
