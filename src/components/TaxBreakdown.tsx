import { ComparisonResult } from "../types";
import { IndianRupee, TrendingDown, TrendingUp } from "lucide-react";

interface Props {
  comparison: ComparisonResult;
}

export function TaxBreakdown({ comparison }: Props) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const RegimeTaxBreakdown = ({ data }: any) => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 p-5 bg-gradient-to-br from-blue-50/50 to-white rounded-lg text-sm sm:text-base border border-blue-100/50">
        <span className="text-blue-700">Total Income:</span>
        <span className="font-semibold text-blue-900">
          {formatCurrency(data.totalIncome)}
        </span>

        <span className="text-blue-700">Total Deduction:</span>
        <span className="font-semibold text-emerald-600">
          - {formatCurrency(data.totalDecution)}
        </span>

        <span className="text-blue-700">Taxable Income:</span>
        <span className="font-semibold text-blue-900">
          {formatCurrency(data.taxableIncome)}
        </span>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-blue-900 mb-4">
          Slab-wise Tax Calculation
        </h3>
        <div className="space-y-2">
          {data.slabwiseTax.map((item: any, index: number) => (
            <div
              key={index}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-gradient-to-br from-blue-50/30 to-white 
                            rounded-lg text-sm border border-blue-100/50 hover:shadow-md transition-shadow duration-200"
            >
              <div>
                <span className="text-sm text-blue-800">
                  {formatCurrency(item.slab.min)} -{" "}
                  {item.slab.max ? formatCurrency(item.slab.max) : "∞"}
                </span>
                <div className="text-xs text-blue-600">@{item.slab.rate}%</div>
              </div>
              <div className="flex sm:block justify-between">
                <span className="text-blue-700 sm:hidden">Amount:</span>
                <span className="text-right text-blue-900">
                  {formatCurrency(item.amount)}
                </span>
              </div>
              <div className="flex sm:block justify-between">
                <span className="text-blue-700 sm:hidden">Tax:</span>
                <span className="text-right font-medium text-blue-900">
                  {formatCurrency(item.tax)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-blue-100 pt-6">
        <div className="grid grid-cols-2 gap-4 text-sm sm:text-base">
          <span className="text-blue-700">Total Tax:</span>
          <span className="font-semibold text-blue-900">
            {formatCurrency(data.totalTax)}
          </span>

          {data.rebate > 0 && (
            <>
              <span className="text-blue-700">Tax Rebate (Section 87A):</span>
              <span className="font-semibold text-emerald-600">
                - {formatCurrency(data.rebate)}
              </span>
            </>
          )}

          <span className="text-blue-700">Cess 4%:</span>
          <span className="font-semibold text-blue-900">
            {formatCurrency(data.cess)}
          </span>

          <span className="text-blue-700">Net Tax %:</span>
          <span className="font-semibold text-blue-900">
            {formatCurrency(data.netTax)} %
          </span>

          <span className="text-lg font-bold text-blue-900">Final Tax:</span>
          <span className="text-lg font-bold text-blue-600">
            {formatCurrency(data.finalTaxValue)}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="bg-white rounded-xl shadow-lg shadow-blue-100/50 p-6 sm:p-8 w-full border border-blue-100/50">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-blue-900 mb-6">
              2025 Old Tax Regime
            </h2>
            <RegimeTaxBreakdown data={comparison.oldTaxRegime} />
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-blue-900 mb-6">
              2025 New Tax Regime
            </h2>
            <RegimeTaxBreakdown data={comparison.newTaxRegime} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg shadow-blue-100/50 p-6 sm:p-8 border border-blue-100/50">
        <h2 className="text-xl sm:text-2xl font-bold text-blue-900 mb-6 flex items-center gap-2">
          <IndianRupee className="w-6 h-6" />
          Tax Savings Comparison
        </h2>

        <div className="flex items-center gap-4">
          {comparison.difference > 0 ? (
            <>
              <TrendingDown className="w-6 h-6 text-emerald-500" />
              <div>
                <span className="text-lg font-semibold text-emerald-600">
                  You save {formatCurrency(comparison.difference)}
                </span>
                <p className="text-sm text-blue-700">
                  under the 2025 New tax regime
                </p>
              </div>
            </>
          ) : comparison.difference < 0 ? (
            <>
              <TrendingUp className="w-6 h-6 text-red-500" />
              <div>
                <span className="text-lg font-semibold text-red-600">
                  You pay {formatCurrency(Math.abs(comparison.difference))} more
                </span>
                <p className="text-sm text-blue-700">
                  under the 2025 New tax regime
                </p>
              </div>
            </>
          ) : (
            <span className="text-lg font-semibold text-blue-900">
              No difference in tax liability between the regimes
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
