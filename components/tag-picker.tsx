"use client";

import { CSSProperties } from "react";

import { findTagDefinition } from "@/lib/tags";
import { TagDefinition } from "@/lib/types";

type TagPickerProps = {
  definitions: TagDefinition[];
  selectedTags: string[];
  onToggle: (tag: string) => void;
};

export function TagPicker({ definitions, selectedTags, onToggle }: TagPickerProps) {
  const visibleTags = Array.from(
    new Set([
      ...definitions.map((definition) => definition.label),
      ...selectedTags
    ])
  ).sort((left, right) => left.localeCompare(right));

  return (
    <div className="tag-picker">
      {visibleTags.map((tag) => {
        const isActive = selectedTags.includes(tag);
        const definition = findTagDefinition(definitions, tag);

        return (
          <button
            key={tag}
            type="button"
            className={`tag-toggle${isActive ? " active" : ""}`}
            style={definition ? ({ "--tag-accent": definition.color } as CSSProperties) : undefined}
            onClick={() => onToggle(tag)}
            title={definition?.description || tag}
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
}
