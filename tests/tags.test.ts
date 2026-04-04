import { describe, expect, it } from "vitest";

import {
  getMergedTagDefinitions,
  getMergedTagSections,
  getTagLabelsForSection,
  normalizeTagDefinition,
  normalizeTagSectionDefinition
} from "@/lib/tags";
import type { TagDefinition } from "@/lib/types";

const definitions: TagDefinition[] = [
  {
    id: "tag-1",
    label: "alimar",
    section: "faction",
    sectionColor: "#000000",
    color: "#000000",
    description: ""
  },
  {
    id: "tag-2",
    label: "secret",
    section: "intrigues",
    sectionColor: "#111111",
    color: "#111111",
    description: ""
  },
  {
    id: "tag-3",
    label: "mara",
    section: "faction",
    sectionColor: "#222222",
    color: "#222222",
    description: ""
  }
];

describe("getTagLabelsForSection", () => {
  it("returns only tags that belong to the requested section", () => {
    expect(
      getTagLabelsForSection(["secret", "alimar", "mara"], definitions, "faction")
    ).toEqual(["alimar", "mara"]);
  });

  it("deduplicates repeated tags", () => {
    expect(
      getTagLabelsForSection(["alimar", "alimar", "secret"], definitions, "faction")
    ).toEqual(["alimar"]);
  });

  it("ignores tags that are unknown to the registry", () => {
    expect(
      getTagLabelsForSection(["inconnu", "secret", "alimar"], definitions, "faction")
    ).toEqual(["alimar"]);
  });
});

describe("tag normalization and merge rules", () => {
  it("forces the system tag into the system section", () => {
    expect(
      normalizeTagDefinition({
        id: "",
        label: "Prioritaire",
        section: "personnages",
        sectionColor: "#ffffff",
        color: "#000000",
        description: " "
      })
    ).toMatchObject({
      label: "prioritaire",
      section: "systeme",
      sectionColor: "#A63A24",
      color: "#A63A24",
      description: ""
    });
  });

  it("forces the system section color", () => {
    expect(
      normalizeTagSectionDefinition({
        id: "",
        label: "systeme",
        color: "#123456"
      })
    ).toMatchObject({
      label: "systeme",
      color: "#A63A24"
    });
  });

  it("adds missing sections inferred from tag definitions", () => {
    const mergedSections = getMergedTagSections(
      [{ id: "section-documents", label: "documents", color: "#6F5D4B" }],
      [
        {
          id: "tag-alliances",
          label: "alliances",
          section: "politique",
          sectionColor: "#998877",
          color: "#998877",
          description: ""
        }
      ]
    );

    expect(mergedSections.map((section) => section.label)).toContain("politique");
  });

  it("reinjects the system tag when it is missing from custom definitions", () => {
    const mergedDefinitions = getMergedTagDefinitions([
      {
        id: "tag-lore",
        label: "lore",
        section: "documents",
        sectionColor: "#6F5D4B",
        color: "#6F5D4B",
        description: ""
      }
    ]);

    expect(mergedDefinitions.some((definition) => definition.label === "prioritaire")).toBe(true);
  });
});
