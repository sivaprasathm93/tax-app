import { CalendarEvent } from "../types";

/** Escapes the characters RFC 5545 reserves inside a text value. */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** yyyy-mm-dd to the YYYYMMDD form a DATE value takes. */
function toIcsDate(value: string): string {
  return value.replace(/-/g, "");
}

/** The day after the last one covered - DTEND on an all-day event is exclusive. */
function dayAfter(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day + 1);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}

/**
 * Lines must be folded at 75 octets, continued with a leading space. Long
 * detail text is the common case here, and an unfolded line is quietly
 * rejected by some calendar clients rather than reported as an error.
 */
function fold(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [line.slice(0, 75)];
  let rest = line.slice(75);
  while (rest.length > 74) {
    parts.push(` ${rest.slice(0, 74)}`);
    rest = rest.slice(74);
  }
  if (rest.length > 0) parts.push(` ${rest}`);
  return parts.join("\r\n");
}

/**
 * An iCalendar file of the year's deadlines, importable into Google Calendar,
 * Outlook or Apple Calendar.
 *
 * All-day events with a one-day reminder rather than timed ones: these are
 * dates, not appointments, and an alarm at 9am on the day of an advance tax
 * instalment is a day too late to do anything about it.
 */
export function buildIcs(events: CalendarEvent[]): string {
  const stamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//tax-app//Salaried tax calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Indian tax deadlines FY 2026-27",
  ];

  for (const event of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${event.id}-fy2026-27@tax-app.local`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${toIcsDate(event.date)}`,
      `DTEND;VALUE=DATE:${dayAfter(event.endDate ?? event.date)}`,
      fold(`SUMMARY:${escapeText(event.title)}`),
      fold(`DESCRIPTION:${escapeText(event.detail)}`),
      "TRANSP:TRANSPARENT",
      "BEGIN:VALARM",
      "TRIGGER:-P1D",
      "ACTION:DISPLAY",
      fold(`DESCRIPTION:${escapeText(event.title)} — tomorrow`),
      "END:VALARM",
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

/**
 * Hands the file to the browser as a download. Built as a blob URL rather
 * than a data URL so nothing about the user's calendar ever appears in a URL,
 * and revoked immediately afterwards.
 */
export function downloadIcs(events: CalendarEvent[], filename: string): void {
  const blob = new Blob([buildIcs(events)], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
