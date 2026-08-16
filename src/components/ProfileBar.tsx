import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Copy,
  Download,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useProfile } from "../state/profileContext";

interface Props {
  /** Called when the user asks for the PDF; null disables the button. */
  onExport: (() => void) | null;
  exporting: boolean;
}

/**
 * Profile switcher and the export action.
 *
 * Profiles exist so one household can keep "Self", "Spouse" and two competing
 * offers apart without four browser tabs. They live in localStorage and
 * nowhere else, which is stated in the menu rather than buried in a footer —
 * someone typing a real salary deserves to be told where it goes.
 */
export function ProfileBar({ onExport, exporting }: Props) {
  const { profile, profiles, persistent, switchTo, create, duplicate, rename, remove } =
    useProfile();
  const [open, setOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Dismiss on an outside click or Escape, the two things every menu owes its
  // user and the two most often left out.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setRenaming(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setRenaming(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const startRename = useCallback(() => {
    setDraft(profile.name);
    setRenaming(true);
  }, [profile.name]);

  const commitRename = useCallback(() => {
    rename(draft);
    setRenaming(false);
  }, [draft, rename]);

  const handleCreate = useCallback(() => {
    create(`Profile ${profiles.length + 1}`);
    setOpen(false);
  }, [create, profiles.length]);

  const handleDuplicate = useCallback(() => {
    duplicate(`${profile.name} copy`);
    setOpen(false);
  }, [duplicate, profile.name]);

  return (
    <div className="no-print flex flex-wrap items-center gap-2">
      <div className="relative" ref={containerRef}>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-haspopup="menu"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white
                     px-3.5 py-2 text-sm font-medium text-slate-700
                     hover:border-slate-400 hover:bg-slate-50
                     focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20
                     transition-colors"
        >
          <span className="text-[color:var(--ink-muted)]">Profile</span>
          <span className="text-slate-900 max-w-[160px] truncate">
            {profile.name}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          />
        </button>

        {open && (
          <div
            role="menu"
            className="absolute left-0 z-20 mt-1.5 w-72 rounded-xl border border-slate-200
                       bg-white shadow-lg overflow-hidden"
          >
            <ul className="py-1 max-h-64 overflow-y-auto">
              {profiles.map((item) => (
                <li key={item.id}>
                  <div className="group flex items-center">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        switchTo(item.id);
                        setOpen(false);
                      }}
                      className="flex-1 min-w-0 flex items-center gap-2 px-3.5 py-2 text-left text-sm
                                 hover:bg-slate-50 transition-colors"
                    >
                      <Check
                        className={`w-4 h-4 shrink-0 ${
                          item.id === profile.id
                            ? "text-blue-600"
                            : "text-transparent"
                        }`}
                        aria-hidden="true"
                      />
                      <span className="truncate text-slate-800">
                        {item.name}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(item.id)}
                      aria-label={`Delete ${item.name}`}
                      className="shrink-0 mr-2 rounded-lg p-1.5 text-slate-300
                                 hover:text-red-600 hover:bg-red-50
                                 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40
                                 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-slate-100 py-1">
              {renaming ? (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    commitRename();
                  }}
                  className="flex gap-2 px-3.5 py-2"
                >
                  <input
                    type="text"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    aria-label="Profile name"
                    className="min-w-0 flex-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm
                               focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white
                               hover:bg-blue-700 transition-colors"
                  >
                    Save
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  role="menuitem"
                  onClick={startRename}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-left text-sm text-slate-700
                             hover:bg-slate-50 transition-colors"
                >
                  <Pencil className="w-4 h-4 text-slate-400" aria-hidden="true" />
                  Rename this profile
                </button>
              )}

              <button
                type="button"
                role="menuitem"
                onClick={handleDuplicate}
                className="w-full flex items-center gap-2 px-3.5 py-2 text-left text-sm text-slate-700
                           hover:bg-slate-50 transition-colors"
              >
                <Copy className="w-4 h-4 text-slate-400" aria-hidden="true" />
                Duplicate — the quick way to build “Offer B”
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={handleCreate}
                className="w-full flex items-center gap-2 px-3.5 py-2 text-left text-sm text-slate-700
                           hover:bg-slate-50 transition-colors"
              >
                <Plus className="w-4 h-4 text-slate-400" aria-hidden="true" />
                New blank profile
              </button>
            </div>

            <p className="flex items-start gap-2 border-t border-slate-100 bg-slate-50/70
                          px-3.5 py-2.5 text-xs text-[color:var(--ink-muted)]">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
              {persistent
                ? "Saved in this browser only. Nothing is uploaded, and clearing site data deletes it."
                : "This browser is blocking local storage, so profiles will not survive a reload."}
            </p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onExport ?? undefined}
        disabled={onExport === null || exporting}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white
                   px-3.5 py-2 text-sm font-medium text-slate-700
                   hover:border-slate-400 hover:bg-slate-50
                   disabled:opacity-50 disabled:hover:border-slate-300 disabled:hover:bg-white
                   focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20
                   transition-colors"
      >
        <Download className="w-4 h-4" aria-hidden="true" />
        Export PDF
      </button>
    </div>
  );
}
