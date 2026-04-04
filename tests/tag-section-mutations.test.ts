import { describe, expect, it } from "vitest";

import { getEmptyAppData } from "@/lib/data";
import {
  createTagSectionList,
  deleteTagSectionAcrossAppData,
  updateTagSectionAcrossAppData
} from "@/lib/tag-section-mutations";

describe("tag section mutation helpers", () => {
  it("creates a new non-system section and keeps the list sorted", () => {
    const result = createTagSectionList(
      [
        { id: "section-systeme", label: "systeme", color: "#A63A24" },
        { id: "section-personnages", label: "personnages", color: "#7A4E2D" }
      ],
      { label: "objets", color: "#2A6F97" }
    );

    expect(result.map((section) => section.label)).toEqual([
      "objets",
      "personnages",
      "systeme"
    ].sort());
  });

  it("does not create duplicate or system sections", () => {
    const base = [
      { id: "section-systeme", label: "systeme", color: "#A63A24" },
      { id: "section-personnages", label: "personnages", color: "#7A4E2D" }
    ];

    expect(createTagSectionList(base, { label: "personnages", color: "#000000" })).toEqual(base);
    expect(createTagSectionList(base, { label: "systeme", color: "#000000" })).toEqual(base);
  });

  it("renames a section and propagates the new section name and color to its tags", () => {
    const data = {
      ...getEmptyAppData("Test"),
      tagSections: [
        { id: "section-systeme", label: "systeme", color: "#A63A24" },
        { id: "section-faction", label: "faction", color: "#7A4E2D" }
      ],
      tagsRegistry: [
        {
          id: "tag-alimar",
          label: "alimar",
          section: "faction",
          sectionColor: "#7A4E2D",
          color: "#7A4E2D",
          description: ""
        }
      ]
    };

    const next = updateTagSectionAcrossAppData(data, {
      id: "section-faction",
      label: "groupes",
      color: "#335577"
    });

    expect(next.tagSections.find((section) => section.id === "section-faction")).toMatchObject({
      label: "groupes",
      color: "#335577"
    });
    expect(next.tagsRegistry[0]).toMatchObject({
      section: "groupes",
      sectionColor: "#335577",
      color: "#335577"
    });
  });

  it("blocks deletion of a non-empty section", () => {
    const data = {
      ...getEmptyAppData("Test"),
      tagSections: [
        { id: "section-systeme", label: "systeme", color: "#A63A24" },
        { id: "section-faction", label: "faction", color: "#7A4E2D" }
      ],
      tagsRegistry: [
        {
          id: "tag-alimar",
          label: "alimar",
          section: "faction",
          sectionColor: "#7A4E2D",
          color: "#7A4E2D",
          description: ""
        }
      ]
    };

    const result = deleteTagSectionAcrossAppData(data, "section-faction");

    expect(result.status).toBe("blocked-used");
    expect(result.data).toEqual(data);
  });

  it("blocks deletion of the system section and allows deletion of an empty section", () => {
    const data = {
      ...getEmptyAppData("Test"),
      tagSections: [
        { id: "section-systeme", label: "systeme", color: "#A63A24" },
        { id: "section-objets", label: "objets", color: "#2A6F97" }
      ]
    };

    const blocked = deleteTagSectionAcrossAppData(data, "section-systeme");
    expect(blocked.status).toBe("blocked-system");

    const deleted = deleteTagSectionAcrossAppData(data, "section-objets");
    expect(deleted.status).toBe("deleted");
    expect(deleted.data.tagSections.map((section) => section.id)).toEqual(["section-systeme"]);
  });
});
