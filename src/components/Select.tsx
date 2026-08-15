import { ReactNode, memo } from "react";

interface Props {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}

export const selectClass =
  "w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3 text-base text-slate-900 " +
  "hover:border-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 focus:outline-none transition-colors";

export const Select = memo(function Select({
  id,
  label,
  hint,
  value,
  onChange,
  children,
}: Props) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-[13px] font-medium text-slate-700 mb-1.5"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={selectClass}
      >
        {children}
      </select>
      {hint && (
        <p className="mt-1.5 text-xs text-[color:var(--ink-muted)]">{hint}</p>
      )}
    </div>
  );
});
