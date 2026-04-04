type TimelineLinkedScene = {
  title: string;
};

export function buildTimelineDayDeletionWarning(input: {
  dayLabel: string;
  entryCount: number;
  linkedScenes: TimelineLinkedScene[];
}) {
  const parts = [
    `Supprimer "${input.dayLabel}" et ses ${input.entryCount} bloc(s) timeline ?`
  ];

  if (input.linkedScenes.length > 0) {
    parts.push(
      "",
      `${input.linkedScenes.length} scene(s) storyboard seront detachees de ce jour et de leurs liens timeline, mais ne seront pas supprimees.`
    );
  }

  return parts.join("\n");
}

export function buildTimelineEntryDeletionWarning(input: {
  entryTitle: string;
  linkedSceneTitle?: string;
}) {
  const parts = [`Supprimer le bloc "${input.entryTitle}" ?`];

  if (input.linkedSceneTitle) {
    parts.push(
      "",
      `La scene storyboard "${input.linkedSceneTitle}" sera detachee de ce bloc et sortie du jour associe, mais elle ne sera pas supprimee.`
    );
  }

  return parts.join("\n");
}
