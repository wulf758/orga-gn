import { describe, expect, it } from "vitest";

import { getTagLabelsForSection } from "@/lib/tags";
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
});
