import { ReactNode, memo, useId, useState } from "react";
import { ChevronDown } from "lucide-react";

interface Props {
  title: string;
  description?: string;
  /** Shown in the collapsed header so the user knows what is already filled in. */
  summary?: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  accent?: boolean;
  children: ReactNode;
}

/**
 * A collapsible group of fields. Collapsing by default is what keeps the form
 * from reading as one undifferentiated wall of twelve inputs - the header
 * summary means the user can still see what is inside without opening it.
 */
export const FormSection = memo(function FormSection({
  title,
  description,
  summary,
  icon,
  defaultOpen = false,
  accent = false,
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <section
      className={`rounded-2xl border bg-white overflow-hidden transition-shadow ${
        accent ? "border-emerald-200" : "border-slate-200"
      } ${open ? "shadow-sm" : ""}`}
    >
      <h2>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={panelId}
          className="w-full flex items-center gap-3 text-left px-5 py-4 hover:bg-slate-50/80 transition-colors"
        >
          {icon && (
            <span
              className={`shrink-0 grid place-items-center w-9 h-9 rounded-xl ${
                accent
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-blue-50 text-blue-700"
              }`}
              aria-hidden="true"
            >
              {icon}
            </span>
          )}
          <span className="flex-1 min-w-0">
            <span className="block text-[15px] font-semibold text-slate-900">
              {title}
            </span>
            <span className="block text-xs text-slate-500 truncate">
              {open || !summary ? description : summary}
            </span>
          </span>
          <ChevronDown
            className={`w-5 h-5 shrink-0 text-slate-400 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          />
        </button>
      </h2>

      {open && (
        <div id={panelId} className="px-5 pb-5 pt-1 space-y-4">
          {children}
        </div>
      )}
    </section>
  );
});
