import { useState } from "react";
import { ComparisonResult } from "../../types";
import { formatCurrency, formatPercent } from "../../utils/format";

interface Props {
  comparison: ComparisonResult;
}

export function RegimeComparisonChart({ comparison }: Props) {
  const { newRegime, oldRegime, difference, betterRegime } = comparison;
  const [hoveredRegime, setHoveredRegime] = useState<"new" | "old" | null>(
    null
  );

  const maxTax = Math.max(newRegime.totalTax, oldRegime.totalTax, 1);
  const maxGross = Math.max(newRegime.grossIncome, oldRegime.grossIncome, 1);

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Tax & Deduction Comparison
        </h4>
        {difference !== 0 && (
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              betterRegime === "new"
                ? "bg-blue-50 text-blue-700"
                : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {betterRegime === "new" ? "New Regime" : "Old Regime"} saves{" "}
            {formatCurrency(Math.abs(difference))}
          </span>
        )}
      </div>

      {/* Side-by-side Visual Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* New Regime Card */}
        <div
          onMouseEnter={() => setHoveredRegime("new")}
          onMouseLeave={() => setHoveredRegime(null)}
          className={`p-3.5 rounded-xl border transition-all ${
            betterRegime === "new"
              ? "border-blue-300 bg-blue-50/40 shadow-xs"
              : "border-slate-200 bg-slate-50/40"
          } ${hoveredRegime === "new" ? "ring-2 ring-blue-400/40" : ""}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">New Regime</span>
            {betterRegime === "new" && (
              <span className="text-[10px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded">
                RECOMMENDED
              </span>
            )}
          </div>

          <div className="mt-2">
            <span className="text-xs text-slate-500">Annual Tax</span>
            <p className="text-lg font-bold text-slate-900 tabular-nums">
              {formatCurrency(newRegime.totalTax)}
            </p>
          </div>

          {/* SVG Progress / Stack Bar */}
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-[11px] text-slate-600">
              <span>Effective Rate</span>
              <span className="font-semibold tabular-nums">
                {formatPercent(newRegime.effectiveRate)}
              </span>
            </div>
            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  betterRegime === "new" ? "bg-blue-600" : "bg-slate-400"
                }`}
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(2, (newRegime.totalTax / maxTax) * 100)
                  )}%`,
                }}
              />
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-200/60 text-[11px] flex justify-between text-slate-600">
            <span>Deductions:</span>
            <span className="font-medium text-slate-800 tabular-nums">
              {formatCurrency(newRegime.totalDeductions + newRegime.totalExemptions)}
            </span>
          </div>
        </div>

        {/* Old Regime Card */}
        <div
          onMouseEnter={() => setHoveredRegime("old")}
          onMouseLeave={() => setHoveredRegime(null)}
          className={`p-3.5 rounded-xl border transition-all ${
            betterRegime === "old"
              ? "border-emerald-300 bg-emerald-50/40 shadow-xs"
              : "border-slate-200 bg-slate-50/40"
          } ${hoveredRegime === "old" ? "ring-2 ring-emerald-400/40" : ""}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">Old Regime</span>
            {betterRegime === "old" && (
              <span className="text-[10px] font-bold bg-emerald-600 text-white px-1.5 py-0.5 rounded">
                RECOMMENDED
              </span>
            )}
          </div>

          <div className="mt-2">
            <span className="text-xs text-slate-500">Annual Tax</span>
            <p className="text-lg font-bold text-slate-900 tabular-nums">
              {formatCurrency(oldRegime.totalTax)}
            </p>
          </div>

          {/* SVG Progress / Stack Bar */}
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-[11px] text-slate-600">
              <span>Effective Rate</span>
              <span className="font-semibold tabular-nums">
                {formatPercent(oldRegime.effectiveRate)}
              </span>
            </div>
            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  betterRegime === "old" ? "bg-emerald-600" : "bg-slate-400"
                }`}
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(2, (oldRegime.totalTax / maxTax) * 100)
                  )}%`,
                }}
              />
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-200/60 text-[11px] flex justify-between text-slate-600">
            <span>Deductions:</span>
            <span className="font-medium text-slate-800 tabular-nums">
              {formatCurrency(oldRegime.totalDeductions + oldRegime.totalExemptions)}
            </span>
          </div>
        </div>
      </div>

      {/* Taxable Income Breakdown Visual Strip */}
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
        <div className="flex justify-between items-center text-slate-700 font-medium mb-1.5">
          <span>Taxable Income Base</span>
          <span className="text-[11px] text-slate-500">Gross: {formatCurrency(maxGross)}</span>
        </div>
        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-[11px] text-slate-600 mb-0.5">
              <span>New Regime Base</span>
              <span className="font-semibold text-slate-900 tabular-nums">
                {formatCurrency(newRegime.taxableIncome)}
              </span>
            </div>
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden flex">
              <div
                className="bg-blue-500 h-full"
                style={{ width: `${(newRegime.taxableIncome / maxGross) * 100}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[11px] text-slate-600 mb-0.5">
              <span>Old Regime Base</span>
              <span className="font-semibold text-slate-900 tabular-nums">
                {formatCurrency(oldRegime.taxableIncome)}
              </span>
            </div>
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full"
                style={{ width: `${(oldRegime.taxableIncome / maxGross) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
