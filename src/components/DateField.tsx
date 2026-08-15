import { memo, useCallback, useId } from "react";

interface Props {
  id: string;
  label: string;
  value: string;
  onChange: (id: string, value: string) => void;
  hint?: string;
  min?: string;
  max?: string;
  invalid?: boolean;
}

/**
 * A native date input. The platform picker is worth more here than a bespoke
 * calendar: it is keyboard-accessible, localised, and already familiar.
 */
export const DateField = memo(function DateField({
  id,
  label,
  value,
  onChange,
  hint,
  min,
  max,
  invalid = false,
}: Props) {
  const hintId = useId();

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange(id, event.target.value);
    },
    [id, onChange]
  );

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-[13px] font-medium text-slate-700 mb-1.5"
      >
        {label}
      </label>
      <input
        id={id}
        type="date"
        value={value}
        onChange={handleChange}
        min={min}
        max={max}
        aria-describedby={hint ? hintId : undefined}
        aria-invalid={invalid || undefined}
        className={`block w-full rounded-xl border bg-white py-2.5 px-3 text-base text-slate-900
                    focus:outline-none focus:ring-4 transition-colors
                    ${
                      invalid
                        ? "border-amber-400 focus:border-amber-500 focus:ring-amber-500/15"
                        : "border-slate-300 hover:border-slate-400 focus:border-blue-500 focus:ring-blue-500/15"
                    }`}
      />
      {hint && (
        <p id={hintId} className="mt-1.5 text-xs text-[color:var(--ink-muted)]">
          {hint}
        </p>
      )}
    </div>
  );
});
