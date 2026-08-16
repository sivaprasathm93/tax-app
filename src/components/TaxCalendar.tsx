import { useCallback, useMemo, useState } from "react";
import { CalendarDays, CalendarPlus, AlertCircle, Info } from "lucide-react";
import { Note } from "./ui/Note";
import { SubTabs } from "./ui/SubTabs";
import { CALENDAR_EVENTS } from "../constants/calendar";
import { downloadIcs } from "../utils/ics";
import { CalendarAudience, CalendarEvent } from "../types";

type Filter = "all" | CalendarAudience;

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Everything" },
  { id: "everyone", label: "Salary only" },
  { id: "advanceTax", label: "Advance tax" },
  { id: "equity", label: "Foreign equity" },
];

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
};

function parse(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function describe(event: CalendarEvent): string {
  const start = parse(event.date);
  if (!event.endDate) {
    return start.toLocaleDateString("en-IN", {
      ...DATE_FORMAT,
      year: "numeric",
    });
  }
  const end = parse(event.endDate);
  return `${start.toLocaleDateString("en-IN", DATE_FORMAT)} – ${end.toLocaleDateString(
    "en-IN",
    { ...DATE_FORMAT, year: "numeric" }
  )}`;
}

/**
 * The financial year as a vertical timeline.
 *
 * Ordered by date rather than grouped by kind, because the question this
 * answers is "what is next", not "what advance tax dates exist". Everything
 * already past is dimmed but kept: an employee arriving in December still
 * needs to see that the April declaration happened without them.
 */
export default function TaxCalendar() {
  const [filter, setFilter] = useState<Filter>("all");
  const today = useMemo(() => new Date(), []);

  const events = useMemo(() => {
    const list =
      filter === "all"
        ? CALENDAR_EVENTS
        : CALENDAR_EVENTS.filter((event) => event.audience === filter);
    return [...list].sort((a, b) => a.date.localeCompare(b.date));
  }, [filter]);

  const nextUp = useMemo(
    () => events.find((event) => parse(event.endDate ?? event.date) >= today),
    [events, today]
  );

  const handleExport = useCallback(() => {
    downloadIcs(events, "indian-tax-deadlines-fy-2026-27.ics");
  }, [events]);

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold text-slate-900">
              Your tax year
            </h2>
            <p className="text-xs text-[color:var(--ink-muted)]">
              Every date that costs money to miss, in the order they arrive.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExport}
            className="no-print shrink-0 inline-flex items-center gap-2 rounded-xl border border-slate-300
                       bg-white px-3.5 py-2 text-sm font-medium text-slate-700
                       hover:border-slate-400 hover:bg-slate-50
                       focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20
                       transition-colors"
          >
            <CalendarPlus className="w-4 h-4" aria-hidden="true" />
            Add to your calendar
          </button>
        </div>

        <div className="mt-4">
          <SubTabs
            label="Filter deadlines"
            items={FILTERS}
            active={filter}
            onSelect={setFilter}
          />
        </div>

        {nextUp && (
          <div className="mt-4">
            <Note tone="info" icon={<CalendarDays className="w-3.5 h-3.5" />}>
              <strong>Next up — {describe(nextUp)}:</strong> {nextUp.title}.
            </Note>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 sm:p-6">
        <ol className="relative">
          {/* A single rule down the left edge, with each marker sitting on it. */}
          <span
            className="absolute left-[7px] top-2 bottom-2 w-px bg-slate-200"
            aria-hidden="true"
          />

          {events.map((event) => {
            const past = parse(event.endDate ?? event.date) < today;
            const isNext = event.id === nextUp?.id;

            return (
              <li key={event.id} className="relative pl-8 pb-6 last:pb-0">
                <span
                  className={`absolute left-0 top-1.5 w-[15px] h-[15px] rounded-full border-2 border-white ${
                    isNext
                      ? "bg-blue-600 ring-4 ring-blue-100"
                      : past
                        ? "bg-slate-300"
                        : event.statutory
                          ? "bg-amber-500"
                          : "bg-slate-400"
                  }`}
                  aria-hidden="true"
                />
                <div className={past ? "opacity-55" : ""}>
                  <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                    <span className="text-sm font-semibold text-slate-900 tabular-nums">
                      {describe(event)}
                    </span>
                    {event.statutory && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-amber-800 bg-amber-50 rounded-full px-2 py-0.5">
                        <AlertCircle className="w-3 h-3" aria-hidden="true" />
                        Statutory
                      </span>
                    )}
                    {isNext && (
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-700 bg-blue-50 rounded-full px-2 py-0.5">
                        Next
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[15px] font-medium text-slate-900">
                    {event.title}
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--ink-secondary)]">
                    {event.detail}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <Note tone="neutral" icon={<Info className="w-3.5 h-3.5" />}>
          The export is a standard .ics file with an all-day event and a
          reminder the day before each deadline. It imports into Google
          Calendar, Outlook and Apple Calendar alike — and it is generated in
          your browser, so no calendar account is ever connected to this app.
        </Note>
      </div>
    </div>
  );
}
