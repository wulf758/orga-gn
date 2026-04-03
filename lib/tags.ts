import { TagDefinition } from "@/lib/types";

export const DEFAULT_TAG_DEFINITIONS: TagDefinition[] = [
  {
    id: "tag-prioritaire",
    label: "prioritaire",
    color: "#C84B31",
    description: "Remonte dans le tableau de bord pour signaler un sujet chaud."
  },
  {
    id: "tag-brouillon",
    label: "brouillon",
    color: "#8C7B75",
    description: "Contenu encore en construction."
  },
  {
    id: "tag-lore",
    label: "lore",
    color: "#6F5D4B",
    description: "Contexte, univers et informations de fond."
  },
  {
    id: "tag-faction",
    label: "faction",
    color: "#7A4E2D",
    description: "Element relie a une faction ou un groupe."
  },
  {
    id: "tag-secret",
    label: "secret",
    color: "#6B4E71",
    description: "Information sensible ou cachee."
  },
  {
    id: "tag-logistique",
    label: "logistique",
    color: "#2A6F97",
    description: "Materiel, terrain, installation et intendance."
  },
  {
    id: "tag-rituel",
    label: "rituel",
    color: "#A36A00",
    description: "Ceremonie, procedure ou passage symbolique."
  },
  {
    id: "tag-validation",
    label: "validation",
    color: "#C68B1E",
    description: "Element en attente d'arbitrage ou de validation."
  }
];

export function normalizeTagLabel(value: string) {
  return value.trim().toLowerCase();
}

export function normalizeTagDefinition(definition: TagDefinition, index = 0): TagDefinition {
  const normalizedLabel = normalizeTagLabel(definition.label) || `tag-${index + 1}`;

  return {
    id: definition.id?.trim() || `tag-${normalizedLabel.replace(/[^a-z0-9]+/g, "-")}`,
    label: normalizedLabel,
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

export function isPriorityTag(tag: string) {
  return normalizeTagLabel(tag) === "prioritaire";
}
