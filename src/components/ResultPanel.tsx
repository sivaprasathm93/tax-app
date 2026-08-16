import { memo, useState } from "react";
import { ArrowDown, PieChart, BarChart2, Scale, Wallet } from "lucide-react";
import { ComparisonResult, Regime, TaxCalculation } from "../types";
import { formatCurrency, formatPercent } from "../utils/format";
import { IncomeFlowDonut } from "./charts/IncomeFlowDonut";
import { RegimeComparisonChart } from "./charts/RegimeComparisonChart";

interface Props {
  comparison: ComparisonResult | null;
  onSeeBreakdown: () => void;
}

const REGIME_NAME: Record<Regime, string> = {
  new: "New tax regime",
  old: "Old tax regime",
};

function ComparisonBar({
  name,
  amount,
  max,
  emphasised,
}: {
  name: string;
  amount: number;
  max: number;
  emphasised: boolean;
}) {
  const width = max > 0 ? Math.max((amount / max) * 100, amount > 0 ? 1.5 : 0) : 0;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span
          className={`text-sm ${
            emphasised
              ? "font-semibold text-slate-900"
              : "text-[color:var(--ink-secondary)]"
          }`}
        >
          {name}
        </span>
        <span
          className={`text-sm tabular-nums ${
            emphasised
              ? "font-semibold text-slate-900"
              : "text-[color:var(--ink-secondary)]"
          }`}
        >
          {formatCurrency(amount)}
        </span>
      </div>
      <div
        className="mt-1.5 h-5 w-full rounded-[4px] overflow-hidden"
        style={{ backgroundColor: "var(--viz-track)" }}
        aria-hidden="true"
      >
        <div
          className="h-full rounded-r-[4px] transition-[width] duration-300 ease-out"
          style={{
            width: `${width}%`,
            backgroundColor: emphasised
              ? "var(--viz-accent)"
              : "var(--viz-muted)",
          }}
        />
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <dt className="text-sm text-[color:var(--ink-secondary)]">{label}</dt>
      <dd className="text-sm font-semibold text-slate-900 tabular-nums">
        {value}
      </dd>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
      <span
        className="mx-auto grid place-items-center w-12 h-12 rounded-2xl bg-blue-50 text-blue-600"
        aria-hidden="true"
      >
        <Scale className="w-6 h-6" />
      </span>
      <p className="mt-3 text-[15px] font-semibold text-slate-900">
        Your comparison appears here
      </p>
      <p className="mt-1 text-sm text-[color:var(--ink-secondary)]">
        Enter your gross annual salary or launch the 60s Quick Start wizard to see
        both regimes worked out in real-time.
      </p>
    </div>
  );
}

export const ResultPanel = memo(function ResultPanel({
  comparison,
  onSeeBreakdown,
}: Props) {
  const [viewMode, setViewMode] = useState<"summary" | "charts">("summary");

  if (!comparison) return <EmptyState />;

  const { newRegime, oldRegime, difference, betterRegime } = comparison;
  const winner: TaxCalculation =
    betterRegime === "old" ? oldRegime : newRegime;
  const max = Math.max(newRegime.totalTax, oldRegime.totalTax);
  const saving = Math.abs(difference);

  // Data for the Donut Chart
  const donutSegments = [
    {
      key: "takeHome",
      label: "Net In-Hand Bank Credit",
      amount: winner.takeHome,
      color: "#10b981", // Emerald
    },
    {
      key: "tax",
      label: "Income Tax Liability",
      amount: winner.totalTax,
      color: "#2563eb", // Blue
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header View Switcher */}
      <div className="px-6 pt-5 pb-2 flex items-center justify-between border-b border-slate-100">
        <div>
          {betterRegime === "equal" ? (
            <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--ink-muted)]">
              Either regime
            </p>
          ) : (
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 rounded-full px-2.5 py-0.5 border border-emerald-200/60">
              Lower tax
            </p>
          )}
        </div>

        {/* Chart View Toggle */}
        <div className="inline-flex p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs font-medium">
          <button
            type="button"
            onClick={() => setViewMode("summary")}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md transition-all ${
              viewMode === "summary"
                ? "bg-white text-slate-900 font-semibold shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <BarChart2 className="w-3 h-3" />
            <span>Summary</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("charts")}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md transition-all ${
              viewMode === "charts"
                ? "bg-white text-slate-900 font-semibold shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <PieChart className="w-3 h-3 text-blue-600" />
            <span>Charts</span>
          </button>
        </div>
      </div>

      {viewMode === "summary" ? (
        <>
          <div className="p-6 pt-4 pb-5">
            <p className="text-[15px] font-semibold text-slate-900">
              {betterRegime === "equal"
                ? "Both cost the same"
                : REGIME_NAME[betterRegime]}
            </p>

            <p className="mt-1 text-[2.75rem] leading-none font-semibold tracking-tight text-slate-900">
              {formatCurrency(winner.totalTax)}
            </p>
            <p className="mt-1.5 text-sm text-[color:var(--ink-secondary)]">
              total tax for the year
            </p>

            {saving > 0 && (
              <p
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold"
                style={{ color: "var(--ink-success)" }}
              >
                <ArrowDown className="w-4 h-4" aria-hidden="true" />
                {formatCurrency(saving)} less than the{" "}
                {betterRegime === "new" ? "old" : "new"} regime
              </p>
            )}
          </div>

          <div className="px-6 py-4 border-t border-slate-100 space-y-3.5">
            <ComparisonBar
              name={REGIME_NAME.new}
              amount={newRegime.totalTax}
              max={max}
              emphasised={betterRegime !== "old"}
            />
            <ComparisonBar
              name={REGIME_NAME.old}
              amount={oldRegime.totalTax}
              max={max}
              emphasised={betterRegime === "old"}
            />
          </div>

          <dl className="px-6 py-2 border-t border-slate-100 divide-y divide-slate-100">
            <StatRow
              label="Monthly in-hand"
              value={formatCurrency(winner.takeHome / 12)}
            />
            <StatRow
              label="Annual take-home"
              value={formatCurrency(winner.takeHome)}
            />
            <StatRow
              label="Effective rate"
              value={formatPercent(winner.effectiveRate)}
            />
          </dl>
        </>
      ) : (
        <div className="p-5 space-y-6">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Salary Allocation Breakdown
            </h4>
            <IncomeFlowDonut
              total={winner.grossIncome}
              segments={donutSegments}
              centerLabel={formatCurrency(winner.takeHome / 12)}
              centerSub="Monthly In-Hand"
              size={180}
            />
          </div>

          <div className="pt-4 border-t border-slate-100">
            <RegimeComparisonChart comparison={comparison} />
          </div>
        </div>
      )}

      <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/70">
        <button
          type="button"
          onClick={onSeeBreakdown}
          className="w-full inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-blue-700
                     hover:text-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40
                     rounded-lg py-1.5 transition-colors"
        >
          <Wallet className="w-4 h-4" aria-hidden="true" />
          See step-by-step tax breakdown
        </button>
      </div>
    </div>
  );
});
