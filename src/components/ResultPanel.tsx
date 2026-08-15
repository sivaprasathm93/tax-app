import { memo } from "react";
import { ArrowDown, Scale, Wallet } from "lucide-react";
import { ComparisonResult, Regime, TaxCalculation } from "../types";
import { formatCurrency, formatPercent } from "../utils/format";

interface Props {
  comparison: ComparisonResult | null;
  onSeeBreakdown: () => void;
}

const REGIME_NAME: Record<Regime, string> = {
  new: "New tax regime",
  old: "Old tax regime",
};

/**
 * One bar of the comparison. This is an EMPHASIS chart, not a categorical one:
 * the regime that costs less carries the accent hue and the other is recessive
 * gray, so the answer reads before any label does. The value sits above the bar
 * as real text, so it can never be clipped by a short bar and screen readers
 * get it without the bar being announced at all.
 */
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
        {/* Square at the baseline, 4px rounded at the data end. */}
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
    <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
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
        Enter your gross annual salary and both regimes are worked out as you
        type — no button to press.
      </p>
    </div>
  );
}

export const ResultPanel = memo(function ResultPanel({
  comparison,
  onSeeBreakdown,
}: Props) {
  if (!comparison) return <EmptyState />;

  const { newRegime, oldRegime, difference, betterRegime } = comparison;
  const winner: TaxCalculation =
    betterRegime === "old" ? oldRegime : newRegime;
  const max = Math.max(newRegime.totalTax, oldRegime.totalTax);
  const saving = Math.abs(difference);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="p-6 pb-5">
        {betterRegime === "equal" ? (
          <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--ink-muted)]">
            Either regime
          </p>
        ) : (
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 rounded-full px-2.5 py-1">
            Lower tax
          </p>
        )}

        <p className="mt-2.5 text-[15px] font-semibold text-slate-900">
          {betterRegime === "equal"
            ? "Both cost the same"
            : REGIME_NAME[betterRegime]}
        </p>

        {/* The hero figure - the one number this view leads with. Proportional
            figures, not tabular: tabular-nums looks loose at display sizes. */}
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

      <div className="px-6 py-5 border-t border-slate-100 space-y-4">
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

      <dl className="px-6 py-3 border-t border-slate-100 divide-y divide-slate-100">
        <StatRow
          label="Take-home pay"
          value={formatCurrency(winner.takeHome)}
        />
        <StatRow
          label="Tax per month"
          value={formatCurrency(winner.totalTax / 12)}
        />
        <StatRow
          label="Effective rate"
          value={formatPercent(winner.effectiveRate)}
        />
      </dl>

      <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60">
        <button
          type="button"
          onClick={onSeeBreakdown}
          className="w-full inline-flex items-center justify-center gap-2 text-sm font-medium text-blue-700
                     hover:text-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40
                     rounded-lg py-1.5"
        >
          <Wallet className="w-4 h-4" aria-hidden="true" />
          See how this was calculated
        </button>
      </div>
    </div>
  );
});
