import { memo, useCallback } from "react";
import { formatNumber } from "../utils/format";

interface Props {
  id: string;
  label: string;
  value: string;
  onChange: (id: string, value: string) => void;
  hint?: string;
  max?: number;
  placeholder?: string;
}

/**
 * Memoised so that typing in one field does not re-render the whole form.
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
}: Props) {
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      // Keep digits only - grouping separators are re-applied on display.
      onChange(id, event.target.value.replace(/[^\d]/g, ""));
    },
    [id, onChange]
  );

  const numeric = value === "" ? 0 : Number(value);
  const overLimit = max !== undefined && numeric > max;

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-semibold text-blue-900 mb-1.5"
      >
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600 pointer-events-none">
          ₹
        </span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          value={value === "" ? "" : formatNumber(numeric)}
          onChange={handleChange}
          placeholder={placeholder}
          aria-describedby={hint ? `${id}-hint` : undefined}
          className={`block w-full pl-9 pr-4 py-3 text-base border-2 rounded-lg shadow-sm
                     focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors duration-200
                     placeholder:text-blue-300 ${
                       overLimit
                         ? "border-amber-400 focus:border-amber-500"
                         : "border-blue-200 focus:border-blue-500"
                     }`}
        />
      </div>
      {hint && (
        <p
          id={`${id}-hint`}
          className={`mt-1 text-xs ${
            overLimit ? "text-amber-600 font-medium" : "text-blue-600/70"
          }`}
        >
          {overLimit
            ? `Above the statutory limit - only ₹${formatNumber(max)} will be allowed.`
            : hint}
        </p>
      )}
    </div>
  );
});
