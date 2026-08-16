import { ReactNode, memo } from "react";

interface Props {
  label: ReactNode;
  value: ReactNode;
  /** Secondary line under the label - a statutory reference or a caveat. */
  note?: ReactNode;
  strong?: boolean;
  /** Renders the value in the success ink, for money coming back. */
  credit?: boolean;
}

export const StatRow = memo(function StatRow({
  label,
  value,
  note,
  strong = false,
  credit = false,
}: Props) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <dt className="text-sm text-[color:var(--ink-secondary)] min-w-0">
        {label}
        {note && (
          <span className="block text-xs text-[color:var(--ink-muted)]">
            {note}
          </span>
        )}
      </dt>
      <dd
        className={`text-sm tabular-nums whitespace-nowrap ${
          strong ? "font-semibold text-slate-900" : "text-slate-800"
        }`}
        style={credit ? { color: "var(--ink-success)" } : undefined}
      >
        {value}
      </dd>
    </div>
  );
});
