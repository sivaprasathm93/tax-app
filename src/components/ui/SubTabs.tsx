import { memo } from "react";

interface Props<T extends string> {
  label: string;
  items: { id: T; label: string }[];
  active: T;
  onSelect: (id: T) => void;
}

/**
 * The pill switcher used both for the top-level tools and for the calculators
 * grouped inside one tab. Rendered as a tablist so a screen reader announces
 * "3 of 3" rather than three unrelated buttons.
 */
function SubTabsInner<T extends string>({
  label,
  items,
  active,
  onSelect,
}: Props<T>) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="no-print inline-flex flex-wrap gap-1 p-1 rounded-xl bg-slate-200/70"
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={active === item.id}
          onClick={() => onSelect(item.id)}
          className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${
                        active === item.id
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export const SubTabs = memo(SubTabsInner) as typeof SubTabsInner;
