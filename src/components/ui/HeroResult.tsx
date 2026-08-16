import { ReactNode, memo } from "react";

interface Props {
  /** Small uppercase pill above the figure. */
  badge?: string;
  badgeTone?: "good" | "warn" | "neutral";
  /** What the figure is, in words. */
  title?: string;
  value: string;
  caption: string;
  /** One line under the figure - the saving, the shortfall, the warning. */
  footnote?: ReactNode;
  children?: ReactNode;
}

const BADGE_TONE = {
  good: "text-emerald-700 bg-emerald-50",
  warn: "text-amber-800 bg-amber-50",
  neutral: "text-[color:var(--ink-muted)] bg-slate-100",
};

/**
 * The result card every tool leads with. Keeping one component means the
 * hero figure sits at the same size and rhythm on all eleven of them, so
 * moving between tools never feels like moving between apps.
 */
export const HeroResult = memo(function HeroResult({
  badge,
  badgeTone = "good",
  title,
  value,
  caption,
  footnote,
  children,
}: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="p-6 pb-5">
        {badge && (
          <p
            className={`inline-flex items-center gap-1.5 text-xs font-semibold uppercase
                        tracking-wider rounded-full px-2.5 py-1 ${BADGE_TONE[badgeTone]}`}
          >
            {badge}
          </p>
        )}
        {title && (
          <p className="mt-2.5 text-[15px] font-semibold text-slate-900">
            {title}
          </p>
        )}
        {/* Proportional figures, not tabular - tabular-nums looks loose at
            display sizes. */}
        <p
          className={`text-[2.75rem] leading-none font-semibold tracking-tight text-slate-900 ${
            title ? "mt-1" : "mt-2.5"
          }`}
        >
          {value}
        </p>
        <p className="mt-1.5 text-sm text-[color:var(--ink-secondary)]">
          {caption}
        </p>
        {footnote && <div className="mt-3 text-sm">{footnote}</div>}
      </div>
      {children}
    </div>
  );
});
