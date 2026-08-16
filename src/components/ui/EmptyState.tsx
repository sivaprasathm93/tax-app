import { ReactNode, memo } from "react";

interface Props {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}

/** The placeholder every result panel shows before its first input arrives. */
export const EmptyState = memo(function EmptyState({
  icon,
  title,
  children,
}: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
      <span
        className="mx-auto grid place-items-center w-12 h-12 rounded-2xl bg-blue-50 text-blue-600"
        aria-hidden="true"
      >
        {icon}
      </span>
      <p className="mt-3 text-[15px] font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-[color:var(--ink-secondary)]">
        {children}
      </p>
    </div>
  );
});
