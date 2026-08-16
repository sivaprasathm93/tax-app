import { ReactNode, memo } from "react";

interface Props {
  title: string;
  description?: string;
  /** Rendered at the top-right - a reset button, a count, an action. */
  action?: ReactNode;
  children: ReactNode;
}

/** A plain white panel with a heading. The non-collapsible sibling of FormSection. */
export const Card = memo(function Card({
  title,
  description,
  action,
  children,
}: Props) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
          {description && (
            <p className="text-xs text-[color:var(--ink-muted)]">
              {description}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </section>
  );
});
