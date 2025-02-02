import React, { useState } from "react";
import { Calculator, HelpCircle, Heart } from "lucide-react";
import { calculateTaxComparison } from "./utils/taxCalculator";
import { TaxBreakdown } from "./components/TaxBreakdown";
import { ComparisonResult } from "./types";

function App() {
  const [income, setIncome] = useState<string>("");
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const handleCalculate = () => {
    const incomeValue = parseFloat(income.replace(/,/g, ""));
    if (!isNaN(incomeValue)) {
      const result = calculateTaxComparison(incomeValue);
      setComparison(result);
    }
  };

  const handleIncomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d,]/g, "");
    setIncome(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-6 sm:py-12 px-4 flex flex-col">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 flex-grow">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-blue-900 mb-3 sm:mb-4">
            Income Tax Calculator 2025
          </h1>
          <p className="text-sm sm:text-base text-blue-700/80 max-w-2xl mx-auto">
            Compare your tax liability under the current and proposed 2025 tax
            regimes
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg shadow-blue-100/50 p-6 sm:p-8 max-w-2xl mx-auto border border-blue-100/50">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-blue-900 mb-2">
                Annual Income
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600">
                  ₹
                </span>
                <input
                  type="text"
                  value={income}
                  onChange={handleIncomeChange}
                  className="block w-full pl-9 pr-12 py-3 text-base sm:text-lg border-2 border-blue-200 rounded-lg shadow-sm 
                           focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200
                           placeholder:text-blue-300"
                  placeholder="Enter your annual income"
                />
              </div>
            </div>

            <button
              onClick={handleCalculate}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3.5 rounded-lg
                       hover:bg-blue-700 active:bg-blue-800 transition-colors duration-200 text-base font-medium
                       shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/30"
            >
              <Calculator className="w-5 h-5" />
              Calculate Tax
            </button>

            <button
              onClick={() => setShowHelp(!showHelp)}
              className="w-full flex items-center justify-center gap-2 text-blue-700 hover:text-blue-800 
                       py-2 rounded-lg hover:bg-blue-50/50 transition-all duration-200 text-base"
            >
              <HelpCircle className="w-5 h-5" />
              {showHelp ? "Hide Help" : "Show Help"}
            </button>

            {showHelp && (
              <div className="bg-blue-50/50 p-5 rounded-lg text-sm border border-blue-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-3">
                      Current Tax Regime
                    </h3>
                    <ul className="list-disc pl-5 space-y-1.5 text-blue-800">
                      <li>Income up to ₹3,00,000: 0%</li>
                      <li>₹3,00,001 to ₹6,00,000: 5%</li>
                      <li>₹6,00,001 to ₹9,00,000: 10%</li>
                      <li>₹9,00,001 to ₹12,00,000: 15%</li>
                      <li>₹12,00,001 to ₹15,00,000: 20%</li>
                      <li>Above ₹15,00,000: 30%</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-3">
                      Proposed 2025 Tax Regime
                    </h3>
                    <ul className="list-disc pl-5 space-y-1.5 text-blue-800">
                      <li>Income up to ₹4,00,000: 0%</li>
                      <li>₹4,00,001 to ₹8,00,000: 5%</li>
                      <li>₹8,00,001 to ₹12,00,000: 10%</li>
                      <li>₹12,00,001 to ₹16,00,000: 15%</li>
                      <li>₹16,00,001 to ₹20,00,000: 20%</li>
                      <li>₹20,00,001 to ₹24,00,000: 25%</li>
                      <li>Above ₹24,00,000: 30%</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4 space-y-2 border-t border-blue-100 pt-4 text-blue-700">
                  <p>
                    <strong>Current Regime:</strong> Standard deduction of
                    ₹50,000 and tax rebate under Section 87A up to ₹25,000 for
                    income up to ₹7,00,000.
                  </p>
                  <p>
                    <strong>Proposed 2025:</strong> Standard deduction of
                    ₹75,000 and tax rebate under Section 87A up to ₹60,000 for
                    income up to ₹12,00,000.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {comparison && <TaxBreakdown comparison={comparison} />}
      </div>

      <footer className="text-center py-6 text-sm text-blue-600 flex items-center justify-center gap-1.5">
        Made with{" "}
        <Heart className="w-4 h-4 text-red-500 fill-current animate-pulse" />{" "}
        for Tax payers From Sivaprasath
      </footer>
    </div>
  );
}

export default App;
