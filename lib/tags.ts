import { TagDefinition } from "@/lib/types";

export const DEFAULT_TAG_DEFINITIONS: TagDefinition[] = [
  {
    id: "tag-prioritaire",
    label: "prioritaire",
    section: "pilotage",
    sectionColor: "#A63A24",
    color: "#C84B31",
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
  const normalizedSection = normalizeTagSection(definition.section) || "general";

  return {
    id: definition.id?.trim() || `tag-${normalizedLabel.replace(/[^a-z0-9]+/g, "-")}`,
    label: normalizedLabel,
    section: normalizedSection,
    sectionColor: definition.sectionColor?.trim() || definition.color?.trim() || "#8C7B75",
    color: definition.color?.trim() || "#8C7B75",
    description: definition.description?.trim() || ""
  };
}

export function getMergedTagDefinitions(definitions?: TagDefinition[] | null) {
  const merged = new Map<string, TagDefinition>();

  for (const definition of DEFAULT_TAG_DEFINITIONS) {
    merged.set(normalizeTagLabel(definition.label), normalizeTagDefinition(definition));
  }

  for (const [index, definition] of (definitions ?? []).entries()) {
    const normalized = normalizeTagDefinition(definition, index);
    merged.set(normalizeTagLabel(normalized.label), normalized);
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

export function isPriorityTag(tag: string) {
  return normalizeTagLabel(tag) === "prioritaire";
}
