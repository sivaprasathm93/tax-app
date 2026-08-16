import { memo, useCallback, useId } from "react";

interface Props {
  id: string;
  label: string;
  value: string;
  onChange: (id: string, value: string) => void;
  hint?: string;
  placeholder?: string;
  /** Uppercases as the user types - PAN is always shown in capitals. */
  uppercase?: boolean;
  maxLength?: number;
  multiline?: boolean;
  invalid?: boolean;
  invalidHint?: string;
}

export const TextField = memo(function TextField({
  id,
  label,
  value,
  onChange,
  hint,
  placeholder,
  uppercase = false,
  maxLength,
  multiline = false,
  invalid = false,
  invalidHint,
}: Props) {
  const hintId = useId();

  const handleChange = useCallback(
    (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      const next = uppercase
        ? event.target.value.toUpperCase()
        : event.target.value;
      onChange(id, next);
    },
    [id, onChange, uppercase]
  );

  const shared = `block w-full rounded-xl border bg-white text-base text-slate-900 py-2.5 px-3
                  placeholder:text-slate-300 focus:outline-none focus:ring-4 transition-colors
                  ${
                    invalid
                      ? "border-amber-400 focus:border-amber-500 focus:ring-amber-500/15"
                      : "border-slate-300 hover:border-slate-400 focus:border-blue-500 focus:ring-blue-500/15"
                  }`;

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-[13px] font-medium text-slate-700 mb-1.5"
      >
        {label}
      </label>
      {multiline ? (
        <textarea
          id={id}
          rows={2}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          maxLength={maxLength}
          aria-describedby={hint || invalid ? hintId : undefined}
          aria-invalid={invalid || undefined}
          className={`${shared} resize-y`}
        />
      ) : (
        <input
          id={id}
          type="text"
          autoComplete="off"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          maxLength={maxLength}
          aria-describedby={hint || invalid ? hintId : undefined}
          aria-invalid={invalid || undefined}
          className={`${shared} ${uppercase ? "uppercase tracking-wide" : ""}`}
        />
      )}
      {(hint || (invalid && invalidHint)) && (
        <p
          id={hintId}
          className={`mt-1.5 text-xs ${
            invalid && invalidHint
              ? "text-amber-700 font-medium"
              : "text-[color:var(--ink-muted)]"
          }`}
        >
          {invalid && invalidHint ? invalidHint : hint}
        </p>
      )}
    </div>
  );
});
