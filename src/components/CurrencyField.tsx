import { memo, useCallback, useId } from "react";
import { formatNumber } from "../utils/format";

interface Props {
  id: string;
  label: string;
  value: string;
  onChange: (id: string, value: string) => void;
  hint?: string;
  max?: number;
  placeholder?: string;
  /** "lead" is the one prominent field at the top of the form. */
  size?: "default" | "lead";
}

/**
 * Memoised so typing in one field does not re-render the other eleven.
 * The parent passes a stable onChange and the field reports its own id back.
 */
export const CurrencyField = memo(function CurrencyField({
  id,
  label,
  value,
  onChange,
  hint,
  max,
  placeholder,
  size = "default",
}: Props) {
  const hintId = useId();

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      // Digits only - grouping separators are re-applied on display.
      onChange(id, event.target.value.replace(/[^\d]/g, ""));
    },
    [id, onChange]
  );

  const numeric = value === "" ? 0 : Number(value);
  const overLimit = max !== undefined && numeric > max;
  const lead = size === "lead";

  return (
    <div>
      <label
        htmlFor={id}
        className={`block font-medium text-slate-700 ${
          lead ? "text-sm mb-2" : "text-[13px] mb-1.5"
        }`}
      >
        {label}
      </label>
      <div className="relative">
        <span
          className={`absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none ${
            lead ? "text-lg" : "text-base"
          }`}
          aria-hidden="true"
        >
          ₹
        </span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={value === "" ? "" : formatNumber(numeric)}
          onChange={handleChange}
          placeholder={placeholder}
          aria-describedby={hint || overLimit ? hintId : undefined}
          aria-invalid={overLimit || undefined}
          className={`block w-full rounded-xl border bg-white tabular-nums text-slate-900
                      placeholder:text-slate-300 placeholder:font-normal
                      focus:outline-none focus:ring-4 transition-colors
                      ${lead ? "pl-9 pr-4 py-3.5 text-xl font-semibold" : "pl-8 pr-3 py-2.5 text-base"}
                      ${
                        overLimit
                          ? "border-amber-400 focus:border-amber-500 focus:ring-amber-500/15"
                          : "border-slate-300 hover:border-slate-400 focus:border-blue-500 focus:ring-blue-500/15"
                      }`}
        />
      </div>
      {(hint || overLimit) && (
        <p
          id={hintId}
          className={`mt-1.5 text-xs ${
            overLimit
              ? "text-amber-700 font-medium"
              : "text-[color:var(--ink-muted)]"
          }`}
        >
          {overLimit
            ? `Capped at ₹${formatNumber(max)} — the statutory limit.`
            : hint}
        </p>
      )}
    </div>
  );
});
