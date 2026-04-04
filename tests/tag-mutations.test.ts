import { describe, expect, it } from "vitest";

import { getEmptyAppData } from "@/lib/data";
import {
  deleteTagAcrossAppData,
  renameTagAcrossAppData,
  renameTagInList
} from "@/lib/tag-mutations";

function makeFixture() {
  const data = getEmptyAppData("Test");

  return {
    ...data,
    documents: [
      {
        slug: "doc-1",
        kind: "note" as const,
        title: "Doc",
        icon: "D",
        summary: "Resume",
        category: "Lore",
        updatedAt: "Maintenant",
        tags: ["ancien", "autre", "ancien"],
        content: [{ heading: "Doc", paragraphs: ["Texte"] }]
      }
    ],
    plotCategories: [
      { slug: "cat-plot", title: "Plot", summary: "", updatedAt: "Maintenant", tags: ["ancien"] }
    ],
    plots: [
      {
        id: "plot-1",
        title: "Intrigue",
        categorySlug: "cat-plot",
        stage: "A lancer" as const,
        summary: "Résumé",
        content: "Contenu",
        tags: ["ancien"],
        beats: [],
        characters: [],
        linkedPages: []
      }
    ],
    organizationCategories: [
      { slug: "cat-org", title: "Orga", summary: "", updatedAt: "Maintenant", tags: ["ancien"] }
    ],
    tasks: [
      {
        id: "task-1",
        title: "Tache",
        categorySlug: "cat-org",
        summary: "Résumé",
        content: "Contenu",
        tags: ["ancien"],
        owner: "Orga",
        dueLabel: "Sans échéance",
        status: "Planifie" as const
      }
    ],
    meetingCategories: [
      { slug: "cat-meet", title: "Meet", summary: "", updatedAt: "Maintenant", tags: ["ancien"] }
    ],
    meetings: [
      {
        id: "meeting-1",
        categorySlug: "cat-meet",
        title: "Réunion",
        dateLabel: "Date",
        focus: "Focus",
        notes: "",
        tags: ["ancien"],
        agenda: []
      }
    ],
    characters: [
      {
        id: "char-1",
        name: "Alim",
        role: "PJ" as const,
        tags: ["ancien", "autre"],
        background: "Texte",
        objectives: [],
        secrets: []
      }
    ],
    timelineDays: [
      { id: "day-1", label: "Jour 1", dateISO: "2026-04-04", order: 0 }
    ],
    timelineEntries: [
      {
        id: "entry-1",
        dayId: "day-1",
        title: "Bloc",
        startTime: "10:00",
        endTime: "10:30",
        location: "Lieu",
        summary: "Résumé",
        tags: ["ancien", "autre"]
      }
    ],
    storyboardScenes: [
      {
        id: "scene-1",
        title: "Scene",
        startTime: "10:00",
        endTime: "10:30",
        location: "Lieu",
        status: "A cadrer" as const,
        summary: "Résumé",
        tags: ["ancien"],
        cards: []
      }
    ],
    kraftItems: [
      {
        id: "kraft-1",
        title: "Objet",
        summary: "Résumé",
        tags: ["ancien"],
        owner: "Orga",
        status: "A commencer" as const
      }
    ]
  };
}

describe("tag mutation helpers", () => {
  it("renames a tag without duplicating it inside the same list", () => {
    expect(renameTagInList(["ancien", "autre", "ancien"], "ancien", "nouveau")).toEqual([
      "nouveau",
      "autre"
    ]);
  });

  it("propagates a tag rename across all taggable collections", () => {
    const next = renameTagAcrossAppData(makeFixture(), "ancien", "nouveau");

    expect(next.documents[0].tags).toEqual(["nouveau", "autre"]);
    expect(next.plotCategories[0].tags).toEqual(["nouveau"]);
    expect(next.plots[0].tags).toEqual(["nouveau"]);
    expect(next.organizationCategories[0].tags).toEqual(["nouveau"]);
    expect(next.tasks[0].tags).toEqual(["nouveau"]);
    expect(next.meetingCategories[0].tags).toEqual(["nouveau"]);
    expect(next.meetings[0].tags).toEqual(["nouveau"]);
    expect(next.characters[0].tags).toEqual(["nouveau", "autre"]);
    expect(next.timelineEntries[0].tags).toEqual(["nouveau", "autre"]);
    expect(next.storyboardScenes[0].tags).toEqual(["nouveau"]);
    expect(next.kraftItems[0].tags).toEqual(["nouveau"]);
  });

  it("propagates a tag deletion across all taggable collections", () => {
    const next = deleteTagAcrossAppData(makeFixture(), "ancien");

    expect(next.documents[0].tags).toEqual(["autre"]);
    expect(next.plotCategories[0].tags).toEqual([]);
    expect(next.plots[0].tags).toEqual([]);
    expect(next.organizationCategories[0].tags).toEqual([]);
    expect(next.tasks[0].tags).toEqual([]);
    expect(next.meetingCategories[0].tags).toEqual([]);
    expect(next.meetings[0].tags).toEqual([]);
    expect(next.characters[0].tags).toEqual(["autre"]);
    expect(next.timelineEntries[0].tags).toEqual(["autre"]);
    expect(next.storyboardScenes[0].tags).toEqual([]);
    expect(next.kraftItems[0].tags).toEqual([]);
  });
});
