import { memo } from "react";
import { IndianRupee, TrendingDown, TrendingUp } from "lucide-react";
import { ComparisonResult, TaxCalculation } from "../types";
import { formatCurrency, formatPercent } from "../utils/format";

interface Props {
  comparison: ComparisonResult;
}

function Row({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "credit" | "total";
}) {
  const valueClass =
    tone === "credit"
      ? "text-emerald-600"
      : tone === "total"
        ? "text-blue-600 text-lg"
        : "text-blue-900";
  return (
    <>
      <span
        className={
          tone === "total"
            ? "text-lg font-bold text-blue-900"
            : "text-blue-700"
        }
      >
        {label}
      </span>
      <span className={`font-semibold text-right tabular-nums ${valueClass}`}>
        {value}
      </span>
    </>
  );
}

/**
 * Declared at module scope rather than inside TaxBreakdown so React keeps the
 * same component type across renders instead of unmounting the whole subtree.
 */
const RegimePanel = memo(function RegimePanel({
  title,
  data,
  highlight,
}: {
  title: string;
  data: TaxCalculation;
  highlight: boolean;
}) {
  const reliefApplied = data.rebateMarginalRelief + data.surchargeMarginalRelief;

  return (
    <div
      className={`rounded-xl p-5 border-2 ${
        highlight
          ? "border-emerald-300 bg-emerald-50/40"
          : "border-blue-100 bg-white"
      }`}
    >
      <div className="flex items-center justify-between mb-5 gap-2">
        <h2 className="text-xl font-bold text-blue-900">{title}</h2>
        {highlight && (
          <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full whitespace-nowrap">
            Lower tax
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 p-4 bg-blue-50/40 rounded-lg text-sm border border-blue-100/50">
        <Row label="Gross income" value={formatCurrency(data.grossIncome)} />
        {data.exemptions.map((item) => (
          <Row
            key={item.label}
            label={item.label}
            value={`- ${formatCurrency(item.amount)}`}
            tone="credit"
          />
        ))}
        {data.deductions.map((item) => (
          <Row
            key={item.label}
            label={item.label}
            value={`- ${formatCurrency(item.amount)}`}
            tone="credit"
          />
        ))}
        <Row label="Taxable income" value={formatCurrency(data.taxableIncome)} />
      </div>

      {data.slabwiseTax.length > 0 && (
        <div className="mt-5">
          <h3 className="text-base font-semibold text-blue-900 mb-3">
            Slab-wise tax
          </h3>
          <div className="space-y-2">
            {data.slabwiseTax.map((item) => (
              <div
                key={item.slab.from}
                className="grid grid-cols-3 gap-3 px-4 py-2.5 bg-blue-50/30 rounded-lg text-sm border border-blue-100/50"
              >
                <div>
                  <div className="text-blue-800">
                    {formatCurrency(item.slab.from)} –{" "}
                    {item.slab.upTo ? formatCurrency(item.slab.upTo) : "∞"}
                  </div>
                  <div className="text-xs text-blue-600">@{item.slab.rate}%</div>
                </div>
                <div className="text-right text-blue-900 tabular-nums self-center">
                  {formatCurrency(item.amount)}
                </div>
                <div className="text-right font-medium text-blue-900 tabular-nums self-center">
                  {formatCurrency(item.tax)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-blue-100 mt-5 pt-5">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <Row label="Tax on slabs" value={formatCurrency(data.taxBeforeRebate)} />

          {data.rebate > 0 && (
            <Row
              label="Rebate u/s 87A"
              value={`- ${formatCurrency(data.rebate)}`}
              tone="credit"
            />
          )}
          {data.rebateMarginalRelief > 0 && (
            <Row
              label="Marginal relief u/s 87A"
              value={`- ${formatCurrency(data.rebateMarginalRelief)}`}
              tone="credit"
            />
          )}
          {data.surcharge > 0 && (
            <Row label="Surcharge" value={formatCurrency(data.surcharge)} />
          )}
          {data.surchargeMarginalRelief > 0 && (
            <Row
              label="Marginal relief on surcharge"
              value={`- ${formatCurrency(data.surchargeMarginalRelief)}`}
              tone="credit"
            />
          )}

          <Row label="Health & Education Cess (4%)" value={formatCurrency(data.cess)} />
          <Row
            label="Effective rate on gross"
            value={formatPercent(data.effectiveRate)}
          />
          <Row
            label="Total tax payable"
            value={formatCurrency(data.totalTax)}
            tone="total"
          />
        </div>

        {reliefApplied > 0 && (
          <p className="mt-3 text-xs text-emerald-700">
            Marginal relief of {formatCurrency(reliefApplied)} applied so the tax
            does not exceed the income earned past the threshold.
          </p>
        )}
      </div>
    </div>
  );
});

export const TaxBreakdown = memo(function TaxBreakdown({ comparison }: Props) {
  const { oldRegime, newRegime, difference, betterRegime } = comparison;

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-xl shadow-lg shadow-blue-100/50 p-5 sm:p-7 border border-blue-100/50">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RegimePanel
            title="Old tax regime"
            data={oldRegime}
            highlight={betterRegime === "old"}
          />
          <RegimePanel
            title="New tax regime"
            data={newRegime}
            highlight={betterRegime === "new"}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg shadow-blue-100/50 p-6 sm:p-8 border border-blue-100/50">
        <h2 className="text-xl sm:text-2xl font-bold text-blue-900 mb-5 flex items-center gap-2">
          <IndianRupee className="w-6 h-6" aria-hidden="true" />
          Which regime costs less?
        </h2>

        <div className="flex items-center gap-4">
          {betterRegime === "new" ? (
            <>
              <TrendingDown
                className="w-7 h-7 text-emerald-500 shrink-0"
                aria-hidden="true"
              />
              <div>
                <p className="text-lg font-semibold text-emerald-600">
                  You save {formatCurrency(difference)} under the new regime
                </p>
                <p className="text-sm text-blue-700">
                  {formatCurrency(newRegime.totalTax)} against{" "}
                  {formatCurrency(oldRegime.totalTax)} under the old regime.
                </p>
              </div>
            </>
          ) : betterRegime === "old" ? (
            <>
              <TrendingUp
                className="w-7 h-7 text-red-500 shrink-0"
                aria-hidden="true"
              />
              <div>
                <p className="text-lg font-semibold text-red-600">
                  You save {formatCurrency(Math.abs(difference))} under the old
                  regime
                </p>
                <p className="text-sm text-blue-700">
                  {formatCurrency(oldRegime.totalTax)} against{" "}
                  {formatCurrency(newRegime.totalTax)} under the new regime.
                </p>
              </div>
            </>
          ) : (
            <p className="text-lg font-semibold text-blue-900">
              Both regimes cost the same:{" "}
              {formatCurrency(newRegime.totalTax)}.
            </p>
          )}
        </div>
      </div>
    </div>
  );
});
