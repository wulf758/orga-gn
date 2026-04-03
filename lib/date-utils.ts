export function formatDateLabel(dateISO?: string, fallback = "Sans echeance") {
  if (!dateISO) {
    return fallback;
  }

  const date = new Date(`${dateISO}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

export function formatDateTimeLabel(
  dateISO?: string,
  timeLabel?: string,
  fallback = "Date a fixer"
) {
  const dateLabel = formatDateLabel(dateISO, fallback);

  if (!dateISO) {
    return fallback;
  }

  if (!timeLabel) {
    return dateLabel;
  }

  return `${dateLabel} - ${timeLabel}`;
}

export function daysUntil(dateISO?: string) {
  if (!dateISO) {
    return null;
  }

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const target = new Date(`${dateISO}T12:00:00`);

  if (Number.isNaN(target.getTime())) {
    return null;
  }

  const diff = target.getTime() - startOfToday.getTime();

  return Math.round(diff / 86400000);
}

export function formatReminder(dateISO?: string) {
  const diff = daysUntil(dateISO);

  if (diff === null) {
    return "Date non definie";
  }

  if (diff < 0) {
    return `En retard de ${Math.abs(diff)} jour(s)`;
  }

  if (diff === 0) {
    return "Aujourd'hui";
  }

  if (diff === 1) {
    return "Demain";
  }

  return `Dans ${diff} jours`;
}
