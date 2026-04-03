"use client";

import { CSSProperties } from "react";

import { findTagDefinition, groupTagDefinitionsBySection, normalizeTagLabel } from "@/lib/tags";
import { TagDefinition } from "@/lib/types";

type TagPickerProps = {
  definitions: TagDefinition[];
  selectedTags: string[];
  onToggle: (tag: string) => void;
};

export function TagPicker({ definitions, selectedTags, onToggle }: TagPickerProps) {
  const definitionMap = new Map(
    definitions.map((definition) => [normalizeTagLabel(definition.label), definition] as const)
  );

  const mergedDefinitions = [
    ...definitions,
    ...selectedTags
      .filter((tag) => !definitionMap.has(normalizeTagLabel(tag)))
      .map((tag) => ({
        id: `tag-${normalizeTagLabel(tag)}`,
        label: tag,
        section: "general",
        sectionColor: "#8C7B75",
        color: "#8C7B75",
        description: ""
      }))
  ];
  const groupedDefinitions = groupTagDefinitionsBySection(mergedDefinitions);

  return (
    <div className="tag-picker-groups">
      {groupedDefinitions.map((group) => (
        <section className="tag-picker-group" key={group.section}>
          <div className="tag-picker-group-header">
            <span className="tag-section-dot" style={{ backgroundColor: group.sectionColor }} />
            <span>{group.section}</span>
          </div>
          <div className="tag-picker">
            {group.definitions.map((definition) => {
              const isActive = selectedTags.includes(definition.label);
              const currentDefinition = findTagDefinition(definitions, definition.label) ?? definition;

              return (
                <button
                  key={definition.id}
                  type="button"
                  className={`tag-toggle${isActive ? " active" : ""}`}
                  style={
                    currentDefinition
                      ? ({ "--tag-accent": currentDefinition.sectionColor } as CSSProperties)
                      : undefined
                  }
                  onClick={() => onToggle(definition.label)}
                  title={currentDefinition?.description || definition.label}
                >
                  {definition.label}
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
