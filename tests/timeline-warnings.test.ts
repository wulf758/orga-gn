import { describe, expect, it } from "vitest";

import {
  buildTimelineDayDeletionWarning,
  buildTimelineEntryDeletionWarning
} from "@/lib/timeline-warnings";

describe("timeline warning helpers", () => {
  it("mentions storyboard detachment when deleting a day with linked scenes", () => {
    const message = buildTimelineDayDeletionWarning({
      dayLabel: "Samedi",
      entryCount: 3,
      linkedScenes: [{ title: "Conseil de crise" }, { title: "Veille de nuit" }]
    });

    expect(message).toContain('Supprimer "Samedi" et ses 3 bloc(s) timeline ?');
    expect(message).toContain("2 scene(s) storyboard seront detachees");
  });

  it("keeps entry deletion messages simple when nothing is linked", () => {
    expect(
      buildTimelineEntryDeletionWarning({
        entryTitle: "Ouverture"
      })
    ).toBe('Supprimer le bloc "Ouverture" ?');
  });
});
