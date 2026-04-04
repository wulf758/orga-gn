import { Character, TagDefinition } from "@/lib/types";
import { getTagLabelsForSection } from "@/lib/tags";

export function getCharacterExportFactions(
  character: Character,
  definitions: TagDefinition[]
) {
  return getTagLabelsForSection(character.tags, definitions, "faction");
}

export function getCharacterExportMeta(
  character: Character,
  definitions: TagDefinition[]
) {
  const meta: string[] = [character.role];
  const factions = getCharacterExportFactions(character, definitions);

  if (factions.length) {
    meta.push(factions.join(", "));
  }

  return meta;
}

export function getCharacterExportPlayerNotes(
  character: Character,
  includePlayerInfo: boolean
) {
  if (!includePlayerInfo) {
    return null;
  }

  const notes = character.playerNotes?.trim();
  return notes ? notes : null;
}
