import { AppData } from "@/lib/types";
import { normalizeTagLabel } from "@/lib/tags";

export function renameTagInList(tags: string[], previousLabel: string, nextLabel: string) {
  return Array.from(
    new Set(
      tags.map((tag) =>
        normalizeTagLabel(tag) === normalizeTagLabel(previousLabel) ? nextLabel : tag
      )
    )
  );
}

export function removeTagFromList(tags: string[], label: string) {
  return tags.filter((tag) => normalizeTagLabel(tag) !== normalizeTagLabel(label));
}

export function renameTagAcrossAppData(
  data: AppData,
  previousLabel: string,
  nextLabel: string
): AppData {
  return {
    ...data,
    documents: data.documents.map((document) => ({
      ...document,
      tags: renameTagInList(document.tags, previousLabel, nextLabel)
    })),
    plotCategories: data.plotCategories.map((category) => ({
      ...category,
      tags: renameTagInList(category.tags, previousLabel, nextLabel)
    })),
    plots: data.plots.map((plot) => ({
      ...plot,
      tags: renameTagInList(plot.tags, previousLabel, nextLabel)
    })),
    organizationCategories: data.organizationCategories.map((category) => ({
      ...category,
      tags: renameTagInList(category.tags, previousLabel, nextLabel)
    })),
    tasks: data.tasks.map((task) => ({
      ...task,
      tags: renameTagInList(task.tags, previousLabel, nextLabel)
    })),
    meetingCategories: data.meetingCategories.map((category) => ({
      ...category,
      tags: renameTagInList(category.tags, previousLabel, nextLabel)
    })),
    meetings: data.meetings.map((meeting) => ({
      ...meeting,
      tags: renameTagInList(meeting.tags, previousLabel, nextLabel)
    })),
    characters: data.characters.map((character) => ({
      ...character,
      tags: renameTagInList(character.tags, previousLabel, nextLabel)
    })),
    timelineEntries: data.timelineEntries.map((entry) => ({
      ...entry,
      tags: renameTagInList(entry.tags, previousLabel, nextLabel)
    })),
    storyboardScenes: data.storyboardScenes.map((scene) => ({
      ...scene,
      tags: renameTagInList(scene.tags, previousLabel, nextLabel)
    })),
    kraftItems: data.kraftItems.map((item) => ({
      ...item,
      tags: renameTagInList(item.tags, previousLabel, nextLabel)
    }))
  };
}

export function deleteTagAcrossAppData(data: AppData, label: string): AppData {
  return {
    ...data,
    documents: data.documents.map((document) => ({
      ...document,
      tags: removeTagFromList(document.tags, label)
    })),
    plotCategories: data.plotCategories.map((category) => ({
      ...category,
      tags: removeTagFromList(category.tags, label)
    })),
    plots: data.plots.map((plot) => ({
      ...plot,
      tags: removeTagFromList(plot.tags, label)
    })),
    organizationCategories: data.organizationCategories.map((category) => ({
      ...category,
      tags: removeTagFromList(category.tags, label)
    })),
    tasks: data.tasks.map((task) => ({
      ...task,
      tags: removeTagFromList(task.tags, label)
    })),
    meetingCategories: data.meetingCategories.map((category) => ({
      ...category,
      tags: removeTagFromList(category.tags, label)
    })),
    meetings: data.meetings.map((meeting) => ({
      ...meeting,
      tags: removeTagFromList(meeting.tags, label)
    })),
    characters: data.characters.map((character) => ({
      ...character,
      tags: removeTagFromList(character.tags, label)
    })),
    timelineEntries: data.timelineEntries.map((entry) => ({
      ...entry,
      tags: removeTagFromList(entry.tags, label)
    })),
    storyboardScenes: data.storyboardScenes.map((scene) => ({
      ...scene,
      tags: removeTagFromList(scene.tags, label)
    })),
    kraftItems: data.kraftItems.map((item) => ({
      ...item,
      tags: removeTagFromList(item.tags, label)
    }))
  };
}
