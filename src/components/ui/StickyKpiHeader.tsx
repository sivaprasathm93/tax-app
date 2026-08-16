import { Zap, Sparkles, Sliders } from "lucide-react";
import { ComparisonResult } from "../../types";
import { formatCurrency, formatPercent } from "../../utils/format";

interface Props {
  comparison: ComparisonResult | null;
  mode: "quick" | "pro";
  onToggleMode: (mode: "quick" | "pro") => void;
  onOpenWizard: () => void;
  monthlyTakeHome?: number;
}

export function StickyKpiHeader({
  comparison,
  mode,
  onToggleMode,
  onOpenWizard,
  monthlyTakeHome,
}: Props) {
  const winner = comparison
    ? comparison.betterRegime === "old"
      ? comparison.oldRegime
      : comparison.newRegime
    : null;

  const saving = comparison ? Math.abs(comparison.difference) : 0;
  const inHandMonthly = monthlyTakeHome ?? (winner ? winner.takeHome / 12 : 0);

  return (
    <aside
      aria-label="Key financial indicators"
      className="sticky top-0 z-30 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md shadow-xs transition-all no-print"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left Side: Live Financial Pulse */}
        <div className="flex items-center gap-3 sm:gap-6 divide-x divide-slate-200 overflow-x-auto py-0.5">
          {/* Monthly In-Hand */}
          <div className="min-w-fit">
            <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase block">
              Monthly In-Hand
            </span>
            <span className="text-sm sm:text-base font-bold text-slate-900 tabular-nums">
              {inHandMonthly > 0 ? formatCurrency(inHandMonthly) : "—"}
            </span>
          </div>

          {/* Annual Tax */}
          <div className="pl-3 sm:pl-6 min-w-fit">
            <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase block">
              Annual Tax
            </span>
            <span className="text-sm sm:text-base font-bold text-slate-900 tabular-nums">
              {winner ? formatCurrency(winner.totalTax) : "—"}
            </span>
          </div>

          {/* Recommended Regime & Savings */}
          {comparison && (
            <div className="pl-3 sm:pl-6 min-w-fit flex items-center gap-2">
              <div>
                <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase block">
                  Best Regime
                </span>
                <span className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-emerald-700">
                  {comparison.betterRegime === "equal"
                    ? "Both Equal"
                    : comparison.betterRegime === "new"
                    ? "New Regime"
                    : "Old Regime"}
                  {saving > 0 && (
                    <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200/60 ml-1">
                      Save {formatCurrency(saving)}
                    </span>
                  )}
                </span>
              </div>
            </div>
          )}

          {/* Effective Tax Rate */}
          {winner && winner.grossIncome > 0 && (
            <div className="pl-3 sm:pl-6 hidden md:block min-w-fit">
              <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase block">
                Effective Rate
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-800 tabular-nums">
                {formatPercent(winner.effectiveRate)}
              </span>
            </div>
          )}
        </div>

        {/* Right Side: Mode Switcher & 60s Wizard CTA */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          {/* Quick 60s Wizard Trigger */}
          <button
            type="button"
            onClick={onOpenWizard}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 hover:text-blue-800 px-3 py-1.5 rounded-lg transition-colors border border-blue-200/80 shadow-2xs"
            title="Launch 60-Second Tax Quick Start Wizard"
          >
            <Zap className="w-3.5 h-3.5 fill-blue-600 text-blue-600" />
            <span className="hidden sm:inline">60s Quick Start</span>
            <span className="sm:hidden">60s</span>
          </button>

          {/* Quick / Pro Mode Toggle Pill */}
          <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs font-medium">
            <button
              type="button"
              onClick={() => onToggleMode("quick")}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                mode === "quick"
                  ? "bg-white text-slate-900 font-semibold shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Quick</span>
            </button>
            <button
              type="button"
              onClick={() => onToggleMode("pro")}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                mode === "pro"
                  ? "bg-white text-slate-900 font-semibold shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sliders className="w-3 h-3 text-blue-600" />
              <span>Pro</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
