import { TagDefinition, TagSection } from "@/lib/types";

export const SYSTEM_TAG_SECTION = {
  id: "section-systeme",
  label: "systeme",
  color: "#A63A24"
} satisfies TagSection;

export const DEFAULT_TAG_SECTIONS: TagSection[] = [
  SYSTEM_TAG_SECTION,
  { id: "section-pilotage", label: "pilotage", color: "#A63A24" },
  { id: "section-documents", label: "documents", color: "#6F5D4B" },
  { id: "section-personnages", label: "personnages", color: "#7A4E2D" },
  { id: "section-intrigues", label: "intrigues", color: "#6B4E71" },
  { id: "section-kraft", label: "kraft", color: "#2A6F97" }
];

export const DEFAULT_TAG_DEFINITIONS: TagDefinition[] = [
  {
    id: "tag-prioritaire",
    label: "prioritaire",
    section: SYSTEM_TAG_SECTION.label,
    sectionColor: SYSTEM_TAG_SECTION.color,
    color: SYSTEM_TAG_SECTION.color,
    description: "Remonte dans le tableau de bord pour signaler un sujet chaud."
  },
  {
    id: "tag-brouillon",
    label: "brouillon",
    section: "pilotage",
    sectionColor: "#A63A24",
    color: "#8C7B75",
    description: "Contenu encore en construction."
  },
  {
    id: "tag-lore",
    label: "lore",
    section: "documents",
    sectionColor: "#6F5D4B",
    color: "#6F5D4B",
    description: "Contexte, univers et informations de fond."
  },
  {
    id: "tag-faction",
    label: "faction",
    section: "personnages",
    sectionColor: "#7A4E2D",
    color: "#7A4E2D",
    description: "Element relie a une faction ou un groupe."
  },
  {
    id: "tag-secret",
    label: "secret",
    section: "intrigues",
    sectionColor: "#6B4E71",
    color: "#6B4E71",
    description: "Information sensible ou cachee."
  },
  {
    id: "tag-logistique",
    label: "logistique",
    section: "kraft",
    sectionColor: "#2A6F97",
    color: "#2A6F97",
    description: "Materiel, terrain, installation et intendance."
  },
  {
    id: "tag-rituel",
    label: "rituel",
    section: "intrigues",
    sectionColor: "#6B4E71",
    color: "#A36A00",
    description: "Ceremonie, procedure ou passage symbolique."
  },
  {
    id: "tag-validation",
    label: "validation",
    section: "pilotage",
    sectionColor: "#A63A24",
    color: "#C68B1E",
    description: "Element en attente d'arbitrage ou de validation."
  }
];

export function normalizeTagLabel(value: string) {
  return value.trim().toLowerCase();
}

export function normalizeTagSection(value: string) {
  return value.trim().toLowerCase();
}

export function normalizeTagDefinition(definition: TagDefinition, index = 0): TagDefinition {
  const normalizedLabel = normalizeTagLabel(definition.label) || `tag-${index + 1}`;
  const normalizedSection = isSystemTagLabel(normalizedLabel)
    ? SYSTEM_TAG_SECTION.label
    : normalizeTagSection(definition.section) || "general";
  const normalizedColor = isSystemTagLabel(normalizedLabel)
    ? SYSTEM_TAG_SECTION.color
    : definition.color?.trim() || "#8C7B75";
  const normalizedSectionColor = isSystemTagLabel(normalizedLabel)
    ? SYSTEM_TAG_SECTION.color
    : definition.sectionColor?.trim() || definition.color?.trim() || "#8C7B75";

  return {
    id: definition.id?.trim() || `tag-${normalizedLabel.replace(/[^a-z0-9]+/g, "-")}`,
    label: normalizedLabel,
    section: normalizedSection,
    sectionColor: normalizedSectionColor,
    color: normalizedColor,
    description: definition.description?.trim() || ""
  };
}

export function normalizeTagSectionDefinition(section: TagSection, index = 0): TagSection {
  const normalizedLabel = normalizeTagSection(section.label) || `section-${index + 1}`;

  return {
    id: section.id?.trim() || `section-${normalizedLabel.replace(/[^a-z0-9]+/g, "-")}`,
    label: normalizedLabel,
    color:
      normalizedLabel === SYSTEM_TAG_SECTION.label
        ? SYSTEM_TAG_SECTION.color
        : section.color?.trim() || "#8C7B75"
  };
}

export function getMergedTagSections(sections?: TagSection[] | null, definitions?: TagDefinition[] | null) {
  const merged = new Map<string, TagSection>();

  const sourceSections =
    sections && sections.length ? sections : DEFAULT_TAG_SECTIONS;

  for (const [index, section] of sourceSections.entries()) {
    const normalized = normalizeTagSectionDefinition(section, index);
    merged.set(normalizeTagSection(normalized.label), normalized);
  }

  if (!merged.has(normalizeTagSection(SYSTEM_TAG_SECTION.label))) {
    merged.set(
      normalizeTagSection(SYSTEM_TAG_SECTION.label),
      normalizeTagSectionDefinition(SYSTEM_TAG_SECTION)
    );
  }

  for (const [index, definition] of (definitions ?? []).entries()) {
    const normalizedSection = normalizeTagSection(definition.section) || `section-${index + 1}`;
    if (!merged.has(normalizedSection)) {
      merged.set(normalizedSection, {
        id: `section-${normalizedSection.replace(/[^a-z0-9]+/g, "-")}`,
        label: normalizedSection,
        color: definition.sectionColor?.trim() || definition.color?.trim() || "#8C7B75"
      });
    }
  }

  return Array.from(merged.values()).sort((left, right) => {
    if (isSystemTagSection(left.label)) return -1;
    if (isSystemTagSection(right.label)) return 1;
    return left.label.localeCompare(right.label);
  });
}

export function getMergedTagDefinitions(definitions?: TagDefinition[] | null) {
  const merged = new Map<string, TagDefinition>();
  const sourceDefinitions =
    definitions && definitions.length ? definitions : DEFAULT_TAG_DEFINITIONS;

  for (const [index, definition] of sourceDefinitions.entries()) {
    const normalized = normalizeTagDefinition(definition, index);
    merged.set(normalizeTagLabel(normalized.label), normalized);
  }

  if (!merged.has(normalizeTagLabel("prioritaire"))) {
    const systemDefinition = normalizeTagDefinition(DEFAULT_TAG_DEFINITIONS[0]);
    merged.set(normalizeTagLabel(systemDefinition.label), systemDefinition);
  }

  return Array.from(merged.values()).sort((left, right) => left.label.localeCompare(right.label));
}

export function findTagDefinition(definitions: TagDefinition[], tag: string) {
  const normalized = normalizeTagLabel(tag);
  return definitions.find((definition) => normalizeTagLabel(definition.label) === normalized) ?? null;
}

export function groupTagDefinitionsBySection(definitions: TagDefinition[]) {
  const groups = new Map<string, { section: string; sectionColor: string; definitions: TagDefinition[] }>();

  for (const definition of definitions) {
    const key = normalizeTagSection(definition.section);
    const existing = groups.get(key);

    if (existing) {
      existing.definitions.push(definition);
    } else {
      groups.set(key, {
        section: definition.section,
        sectionColor: definition.sectionColor,
        definitions: [definition]
      });
    }
  }

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      definitions: group.definitions.sort((left, right) => left.label.localeCompare(right.label))
    }))
    .sort((left, right) => left.section.localeCompare(right.section));
}

export function groupTagDefinitionsWithSections(
  definitions: TagDefinition[],
  sections: TagSection[]
) {
  const groupedDefinitions = groupTagDefinitionsBySection(definitions);
  const groupsBySection = new Map(
    groupedDefinitions.map((group) => [normalizeTagSection(group.section), group] as const)
  );

  return sections.map((section) => {
    const existing = groupsBySection.get(normalizeTagSection(section.label));
    return {
      section: section.label,
      sectionColor: section.color,
      definitions: existing?.definitions ?? []
    };
  });
}

export function isPriorityTag(tag: string) {
  return isSystemTagLabel(tag);
}

export function isSystemTagLabel(tag: string) {
  return normalizeTagLabel(tag) === "prioritaire";
}

export function isSystemTagSection(section: string) {
  return normalizeTagSection(section) === SYSTEM_TAG_SECTION.label;
}

export function getTagLabelsForSection(
  tags: string[],
  definitions: TagDefinition[],
  section: string
) {
  const normalizedSection = normalizeTagSection(section);

  return Array.from(
    new Set(
      tags.filter((tag) => {
        const definition = definitions.find(
          (entry) => normalizeTagLabel(entry.label) === normalizeTagLabel(tag)
        );

        return normalizeTagSection(definition?.section ?? "") === normalizedSection;
      })
    )
  );
}
