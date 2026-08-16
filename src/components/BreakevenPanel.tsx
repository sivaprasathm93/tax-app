import { memo, useMemo } from "react";
import { Target, TrendingDown, TrendingUp } from "lucide-react";
import { calculateBreakeven, marginalReliefRate } from "../utils/breakeven";
import { ComparisonResult, TaxInput } from "../types";
import { formatCurrency } from "../utils/format";

interface Props {
  input: TaxInput;
  comparison: ComparisonResult;
}

/**
 * A two-segment bar showing claimed deductions against the level that would
 * make the old regime cheaper. This is an EMPHASIS chart, not a categorical
 * one: the claimed portion carries the accent, the shortfall stays recessive,
 * so the gap reads before any label does.
 */
function ProgressBar({ claimed, required }: { claimed: number; required: number }) {
  const filled = required > 0 ? Math.min((claimed / required) * 100, 100) : 100;

  return (
    <div
      className="h-5 w-full rounded-[4px] overflow-hidden"
      style={{ backgroundColor: "var(--viz-track)" }}
      aria-hidden="true"
    >
      <div
        className="h-full rounded-r-[4px] transition-[width] duration-300 ease-out"
        style={{
          width: `${filled}%`,
          backgroundColor:
            filled >= 100 ? "var(--ink-success)" : "var(--viz-accent)",
        }}
      />
    </div>
  );
}

/**
 * Answers the question every salaried taxpayer asks in April and again in
 * January: how much more would I have to be claiming for the old regime to be
 * worth it? The bisection that produces the figure lives in utils/breakeven.
 */
export const BreakevenPanel = memo(function BreakevenPanel({
  input,
  comparison,
}: Props) {
  const result = useMemo(
    () => calculateBreakeven(input, comparison),
    [input, comparison]
  );
  const marginal = useMemo(
    () =>
      marginalReliefRate(
        comparison.oldRegime.taxableIncome,
        "old",
        input.ageGroup
      ),
    [comparison.oldRegime.taxableIncome, input.ageGroup]
  );

  const oldWins = result.betterRegime === "old";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span
          className="shrink-0 grid place-items-center w-9 h-9 rounded-xl bg-blue-50 text-blue-700"
          aria-hidden="true"
        >
          <Target className="w-[18px] h-[18px]" />
        </span>
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-slate-900">
            Breakeven deductions
          </h2>
          <p className="text-xs text-[color:var(--ink-muted)]">
            What the old regime needs before it pays for itself
          </p>
        </div>
      </div>

      {result.unreachable ? (
        <p className="mt-4 text-sm text-[color:var(--ink-secondary)]">
          At this income the new regime wins whatever you claim — even wiping
          out taxable income entirely under the old regime would not close the
          gap. Nothing to plan around: take the new regime.
        </p>
      ) : (
        <>
          <div className="mt-4">
            <div className="flex items-baseline justify-between gap-3 mb-1.5">
              <span className="text-sm text-[color:var(--ink-secondary)]">
                Claiming now
              </span>
              <span className="text-sm font-semibold text-slate-900 tabular-nums">
                {formatCurrency(result.claimed)}
              </span>
            </div>
            <ProgressBar
              claimed={result.claimed}
              required={result.required ?? 0}
            />
            <div className="flex items-baseline justify-between gap-3 mt-1.5">
              <span className="text-xs text-[color:var(--ink-muted)]">
                Breakeven
              </span>
              <span className="text-xs text-[color:var(--ink-muted)] tabular-nums">
                {formatCurrency(result.required ?? 0)}
              </span>
            </div>
          </div>

          <div
            className={`mt-4 rounded-xl border px-3.5 py-3 ${
              oldWins
                ? "bg-emerald-50/70 border-emerald-100"
                : "bg-blue-50/70 border-blue-100"
            }`}
          >
            <p className="flex items-start gap-2 text-sm">
              <span
                className="shrink-0 mt-0.5"
                style={{
                  color: oldWins ? "var(--ink-success)" : "var(--viz-accent)",
                }}
                aria-hidden="true"
              >
                {oldWins ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
              </span>
              <span className="text-slate-800">
                {result.shortfall > 0 ? (
                  <>
                    You need{" "}
                    <strong className="text-slate-900">
                      {formatCurrency(result.shortfall)}
                    </strong>{" "}
                    more in eligible deductions before the old regime is
                    cheaper. Until then the new regime saves you{" "}
                    <strong className="text-slate-900">
                      {formatCurrency(result.saving)}
                    </strong>
                    .
                  </>
                ) : oldWins ? (
                  <>
                    You are past the breakeven by{" "}
                    <strong className="text-slate-900">
                      {formatCurrency(result.claimed - (result.required ?? 0))}
                    </strong>
                    . The old regime saves you{" "}
                    <strong className="text-slate-900">
                      {formatCurrency(result.saving)}
                    </strong>{" "}
                    — declare it in your HR portal.
                  </>
                ) : (
                  <>
                    Both regimes cost the same at this level of deduction.
                    Anything further you claim tips it to the old regime.
                  </>
                )}
              </span>
            </p>
          </div>

          {marginal > 0 && (
            <p className="mt-3 text-xs text-[color:var(--ink-muted)]">
              At your income the next rupee of old-regime deduction is worth{" "}
              <strong className="text-slate-700">{marginal.toFixed(1)}%</strong>{" "}
              in tax — that is what an extra ₹1,00,000 of 80C or 80D is actually
              saving you, after rebate and cess.
            </p>
          )}
        </>
      )}
    </section>
  );
});
