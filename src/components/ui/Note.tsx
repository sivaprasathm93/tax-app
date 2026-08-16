import { ReactNode, memo } from "react";

export type NoteTone = "info" | "warn" | "good" | "neutral";

const PALETTE: Record<NoteTone, string> = {
  info: "bg-blue-50 border-blue-100 text-blue-900",
  warn: "bg-amber-50 border-amber-200 text-amber-900",
  good: "bg-emerald-50 border-emerald-100 text-emerald-900",
  neutral: "bg-slate-50 border-slate-200 text-slate-700",
};

/**
 * The small coloured callout used throughout the suite for statutory notes and
 * caps. Lifted out of GratuityCalculator, where it started, so every tool
 * carries the same four tones instead of inventing its own.
 */
export const Note = memo(function Note({
  tone = "info",
  icon,
  children,
}: {
  tone?: NoteTone;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={`flex gap-2 rounded-xl border px-3.5 py-3 ${PALETTE[tone]}`}>
      {icon && (
        <span className="shrink-0 mt-0.5" aria-hidden="true">
          {icon}
        </span>
      )}
      <div className="text-xs leading-relaxed">{children}</div>
    </div>
  );
});
