import { memo, useCallback, useId } from "react";

interface Props {
  id: string;
  label: string;
  value: string;
  onChange: (id: string, value: string) => void;
  hint?: string;
  min?: number;
  max?: number;
  /** Rendered inside the field, e.g. "%", "years", "shares". */
  suffix?: string;
  step?: number;
  /** Allows a decimal point; years and share counts stay whole. */
  decimal?: boolean;
  placeholder?: string;
}

/**
 * The plain-number sibling of CurrencyField, for percentages, counts and
 * durations. Kept separate rather than adding a mode to CurrencyField: the
 * rupee prefix, the grouping separators and the statutory-cap warning are all
 * wrong here, and folding them behind a flag would only hide that.
 */
export const NumberField = memo(function NumberField({
  id,
  label,
  value,
  onChange,
  hint,
  min,
  max,
  suffix,
  decimal = false,
  placeholder,
}: Props) {
  const hintId = useId();

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const cleaned = decimal
        ? event.target.value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1")
        : event.target.value.replace(/[^\d]/g, "");
      onChange(id, cleaned);
    },
    [id, onChange, decimal]
  );

  const numeric = value === "" ? NaN : Number(value);
  const outOfRange =
    Number.isFinite(numeric) &&
    ((max !== undefined && numeric > max) ||
      (min !== undefined && numeric < min));

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-[13px] font-medium text-slate-700 mb-1.5"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode={decimal ? "decimal" : "numeric"}
          autoComplete="off"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          aria-describedby={hint || outOfRange ? hintId : undefined}
          aria-invalid={outOfRange || undefined}
          className={`block w-full rounded-xl border bg-white tabular-nums text-slate-900 text-base
                      py-2.5 pl-3 placeholder:text-slate-300
                      focus:outline-none focus:ring-4 transition-colors
                      ${suffix ? "pr-16" : "pr-3"}
                      ${
                        outOfRange
                          ? "border-amber-400 focus:border-amber-500 focus:ring-amber-500/15"
                          : "border-slate-300 hover:border-slate-400 focus:border-blue-500 focus:ring-blue-500/15"
                      }`}
        />
        {suffix && (
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none"
            aria-hidden="true"
          >
            {suffix}
          </span>
        )}
      </div>
      {(hint || outOfRange) && (
        <p
          id={hintId}
          className={`mt-1.5 text-xs ${
            outOfRange
              ? "text-amber-700 font-medium"
              : "text-[color:var(--ink-muted)]"
          }`}
        >
          {outOfRange
            ? `Enter a value between ${min ?? 0} and ${max}.`
            : hint}
        </p>
      )}
    </div>
  );
});
