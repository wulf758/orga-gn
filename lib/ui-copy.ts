type DeleteConfirmationOptions = {
  entityLabel: string;
  name: string;
  consequence?: string;
};

export function buildDeleteConfirmation({
  entityLabel,
  name,
  consequence
}: DeleteConfirmationOptions) {
  return `Supprimer ${entityLabel} "${name}" ?${
    consequence ? ` ${consequence}` : " Cette action est irreversible."
  }`;
}
