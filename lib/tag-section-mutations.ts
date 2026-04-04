import { AppData, TagSection } from "@/lib/types";
import {
  isSystemTagSection,
  normalizeTagDefinition,
  normalizeTagSection,
  normalizeTagSectionDefinition
} from "@/lib/tags";

export function createTagSectionList(
  sections: TagSection[],
  input: { label: string; color: string }
) {
  const nextLabel = normalizeTagSection(input.label);

  if (!nextLabel || isSystemTagSection(nextLabel)) {
    return sections;
  }

  const existing = sections.find(
    (section) => normalizeTagSection(section.label) === nextLabel
  );

  if (existing) {
    return sections;
  }

  const nextSection = normalizeTagSectionDefinition({
    id: `section-${nextLabel.replace(/[^a-z0-9]+/g, "-")}`,
    label: nextLabel,
    color: input.color
  });

  return [...sections, nextSection].sort((left, right) => left.label.localeCompare(right.label));
}

export function updateTagSectionAcrossAppData(
  data: AppData,
  input: { id: string; label: string; color: string }
) {
  const nextLabel = normalizeTagSection(input.label);
  if (!nextLabel) {
    return data;
  }

  const target = data.tagSections.find((section) => section.id === input.id);
  if (!target) {
    return data;
  }
  if (isSystemTagSection(target.label) || isSystemTagSection(nextLabel)) {
    return data;
  }

  const duplicate = data.tagSections.find(
    (section) =>
      section.id !== input.id && normalizeTagSection(section.label) === nextLabel
  );
  if (duplicate) {
    return data;
  }

  return {
    ...data,
    tagSections: data.tagSections
      .map((section) =>
        section.id === input.id
          ? normalizeTagSectionDefinition({
              ...section,
              label: nextLabel,
              color: input.color
            })
          : section
      )
      .sort((left, right) => left.label.localeCompare(right.label)),
    tagsRegistry: data.tagsRegistry.map((definition) =>
      normalizeTagSection(definition.section) === normalizeTagSection(target.label)
        ? normalizeTagDefinition({
            ...definition,
            section: nextLabel,
            sectionColor: input.color,
            color: input.color
          })
        : definition
    )
  };
}

export function deleteTagSectionAcrossAppData(data: AppData, id: string) {
  const target = data.tagSections.find((section) => section.id === id);
  if (!target) {
    return { data, status: "ignored" as const };
  }
  if (isSystemTagSection(target.label)) {
    return { data, status: "blocked-system" as const };
  }

  const isUsed = data.tagsRegistry.some(
    (definition) =>
      normalizeTagSection(definition.section) === normalizeTagSection(target.label)
  );

  if (isUsed) {
    return { data, status: "blocked-used" as const };
  }

  return {
    data: {
      ...data,
      tagSections: data.tagSections.filter((section) => section.id !== id)
    },
    status: "deleted" as const
  };
}
