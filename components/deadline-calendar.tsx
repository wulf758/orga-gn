"use client";

import Link from "next/link";
import { useState } from "react";

type CalendarEntry = {
  id: string;
  title: string;
  dateISO: string;
  reminder: string;
  lane: string;
  status: string;
  tone?: "success" | "warning";
  href: string;
};

type DeadlineCalendarProps = {
  entries: CalendarEntry[];
};

const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function toDate(dateISO: string) {
  return new Date(`${dateISO}T12:00:00`);
}

function addMonths(baseDate: Date, offset: number) {
  return new Date(baseDate.getFullYear(), baseDate.getMonth() + offset, 1);
}

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function DeadlineCalendar({ entries }: DeadlineCalendarProps) {
  const datedEntries = entries
    .filter((entry) => entry.dateISO)
    .slice()
    .sort((left, right) => left.dateISO.localeCompare(right.dateISO));
  const initialDate = datedEntries.length ? toDate(datedEntries[0].dateISO) : new Date();
  const [monthOffset, setMonthOffset] = useState(0);
  const visibleMonth = addMonths(initialDate, monthOffset);
  const today = new Date();
  const monthTitle = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric"
  }).format(visibleMonth);
  const firstDayOfMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
  const monthStartOffset = (firstDayOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth(),
    1 - monthStartOffset
  );

  const entryMap = Object.fromEntries(
    datedEntries.map((entry) => [entry.id, entry])
  );
  const entriesByDate = datedEntries.reduce<Record<string, CalendarEntry[]>>((acc, entry) => {
    acc[entry.dateISO] ??= [];
    acc[entry.dateISO].push(entryMap[entry.id]);
    return acc;
  }, {});

  const cells = Array.from({ length: 42 }, (_, index) => {
    const cellDate = new Date(
      gridStart.getFullYear(),
      gridStart.getMonth(),
      gridStart.getDate() + index
    );
    const key = `${cellDate.getFullYear()}-${String(cellDate.getMonth() + 1).padStart(2, "0")}-${String(cellDate.getDate()).padStart(2, "0")}`;

    return {
      key,
      date: cellDate,
      isCurrentMonth: cellDate.getMonth() === visibleMonth.getMonth(),
      isToday: isSameDay(cellDate, today),
      entries: entriesByDate[key] ?? []
    };
  });

  return (
    <div className="calendar-shell">
      <div className="calendar-topbar">
        <div>
          <p className="section-kicker">Calendrier orga</p>
          <h3 className="calendar-title">{monthTitle}</h3>
        </div>
        <div className="calendar-nav">
          <button type="button" className="editor-button" onClick={() => setMonthOffset((value) => value - 1)}>
            Mois precedent
          </button>
          <button type="button" className="editor-button" onClick={() => setMonthOffset(0)}>
            Mois de reference
          </button>
          <button type="button" className="editor-button" onClick={() => setMonthOffset((value) => value + 1)}>
            Mois suivant
          </button>
        </div>
      </div>

      <div className="calendar-grid">
        {WEEKDAY_LABELS.map((label) => (
          <div className="calendar-weekday" key={label}>
            {label}
          </div>
        ))}

        {cells.map((cell) => (
          <div
            className={`calendar-cell${cell.isCurrentMonth ? "" : " muted"}${cell.isToday ? " today" : ""}`}
            key={cell.key}
          >
            <div className="calendar-date">{cell.date.getDate()}</div>
            <div className="calendar-entry-list">
              {cell.entries.slice(0, 3).map((entry) => (
                <Link
                  href={entry.href}
                  className={`calendar-entry${entry.tone ? ` ${entry.tone}` : ""}`}
                  key={entry.id}
                  title={`${entry.title} - ${entry.lane} - ${entry.status}`}
                >
                  <span className="calendar-entry-title">{entry.title}</span>
                  <span className="calendar-entry-meta">{entry.status}</span>
                </Link>
              ))}
              {cell.entries.length > 3 ? (
                <span className="calendar-more">+{cell.entries.length - 3} autre(s)</span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
