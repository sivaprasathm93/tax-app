import { Suspense, lazy, useCallback, useMemo, useState } from "react";
import { Calculator, HelpCircle, Heart, UtensilsCrossed } from "lucide-react";
import { CurrencyField } from "./components/CurrencyField";
import { calculateTaxComparison } from "./utils/taxCalculator";
import {
  ASSESSMENT_YEAR,
  DEDUCTION_LIMITS,
  FINANCIAL_YEAR,
  MEAL_VOUCHER,
  METRO_CITIES,
} from "./constants/taxRules";
import { AgeGroup, CityType, TaxInput } from "./types";
import { formatCurrency } from "./utils/format";

// Kept out of the initial bundle - neither is needed for the first paint.
const HelpPanel = lazy(() => import("./components/HelpPanel"));
const TaxBreakdown = lazy(() =>
  import("./components/TaxBreakdown").then((m) => ({ default: m.TaxBreakdown }))
);

type FieldName = Exclude<keyof TaxInput, "ageGroup" | "cityType">;

const EMPTY_FORM: Record<FieldName, string> = {
  grossIncome: "",
  basicSalary: "",
  hraReceived: "",
  rentPaid: "",
  mealVouchers: "",
  employerNps: "",
  section80C: "",
  section80CCD1B: "",
  section80D: "",
  section24B: "",
  savingsInterest: "",
  professionalTax: "",
};

const AGE_OPTIONS: { value: AgeGroup; label: string }[] = [
  { value: "below60", label: "Below 60" },
  { value: "senior", label: "60 to 79 (senior)" },
  { value: "superSenior", label: "80 and above" },
];

const selectClass =
  "w-full py-3 px-3 text-base border-2 border-blue-200 rounded-lg shadow-sm bg-white " +
  "focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-colors duration-200";

function App() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [ageGroup, setAgeGroup] = useState<AgeGroup>("below60");
  const [cityType, setCityType] = useState<CityType>("metro");
  const [showHelp, setShowHelp] = useState(false);
  const [submitted, setSubmitted] = useState<TaxInput | null>(null);

  // Stable identity keeps every memoised CurrencyField from re-rendering.
  const handleFieldChange = useCallback((name: string, value: string) => {
    setForm((previous) => ({ ...previous, [name]: value }));
  }, []);

  const input = useMemo<TaxInput>(() => {
    const numbers = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, value === "" ? 0 : Number(value)])
    ) as Record<FieldName, number>;
    return { ...numbers, ageGroup, cityType };
  }, [form, ageGroup, cityType]);

  const handleCalculate = useCallback(() => setSubmitted(input), [input]);
  const handleReset = useCallback(() => {
    setForm(EMPTY_FORM);
    setSubmitted(null);
  }, []);
  const toggleHelp = useCallback(() => setShowHelp((open) => !open), []);

  // Only recomputed when the user actually submits, not on every keystroke.
  const comparison = useMemo(
    () => (submitted && submitted.grossIncome > 0 ? calculateTaxComparison(submitted) : null),
    [submitted]
  );

  const savingsLabel =
    ageGroup === "below60"
      ? `Savings interest - 80TTA (max ${formatCurrency(DEDUCTION_LIMITS.section80TTA)})`
      : `Interest income - 80TTB (max ${formatCurrency(DEDUCTION_LIMITS.section80TTB)})`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-6 sm:py-12 px-4 flex flex-col">
      <div className="max-w-7xl w-full mx-auto space-y-6 sm:space-y-8 flex-grow">
        <header className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-900">
            Income Tax Calculator FY {FINANCIAL_YEAR} (A.Y. {ASSESSMENT_YEAR})
          </h1>
          <p className="mt-2 text-sm sm:text-base text-blue-700/80 max-w-2xl mx-auto">
            Compare your liability under the old and new regimes using the
            Income-tax Act, 2025 and Income-tax Rules, 2026, both in force from
            1 April 2026.
          </p>
        </header>

        <div className="bg-white rounded-xl shadow-lg shadow-blue-100/50 p-6 sm:p-8 max-w-2xl mx-auto border border-blue-100/50">
          <div className="space-y-5">
            <CurrencyField
              id="grossIncome"
              label="Gross annual salary"
              value={form.grossIncome}
              onChange={handleFieldChange}
              placeholder="Enter your gross annual salary"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="ageGroup"
                  className="block text-sm font-semibold text-blue-900 mb-1.5"
                >
                  Age group
                </label>
                <select
                  id="ageGroup"
                  value={ageGroup}
                  onChange={(e) => setAgeGroup(e.target.value as AgeGroup)}
                  className={selectClass}
                >
                  {AGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-blue-600/70">
                  Sets the old regime basic exemption.
                </p>
              </div>

              <div>
                <label
                  htmlFor="cityType"
                  className="block text-sm font-semibold text-blue-900 mb-1.5"
                >
                  City of residence
                </label>
                <select
                  id="cityType"
                  value={cityType}
                  onChange={(e) => setCityType(e.target.value as CityType)}
                  className={selectClass}
                >
                  <option value="metro">Metro (50% HRA)</option>
                  <option value="nonMetro">Non-metro (40% HRA)</option>
                </select>
                <p className="mt-1 text-xs text-blue-600/70">
                  Metro from 1 Apr 2026: {METRO_CITIES.join(", ")}.
                </p>
              </div>
            </div>

            <CurrencyField
              id="basicSalary"
              label="Basic salary + DA (annual)"
              value={form.basicSalary}
              onChange={handleFieldChange}
              hint="Used for the HRA and employer NPS ceilings."
            />

            <section className="rounded-lg border-2 border-emerald-200 bg-emerald-50/60 p-4">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-emerald-900 mb-1">
                <UtensilsCrossed className="w-4 h-4" aria-hidden="true" />
                Meal voucher scheme - new this year
              </h2>
              <p className="text-xs text-emerald-900/80 mb-3">
                Rule 15(5)(a) of the Income-tax Rules, 2026 raised the exempt
                value to ₹{MEAL_VOUCHER.perMeal} per meal from 1 April 2026, and
                the benefit now applies under <strong>both</strong> regimes.
                Cash meal allowances stay fully taxable.
              </p>
              <CurrencyField
                id="mealVouchers"
                label="Meal vouchers / food card received (annual)"
                value={form.mealVouchers}
                onChange={handleFieldChange}
                max={MEAL_VOUCHER.annualCap}
                hint={`Max ${formatCurrency(MEAL_VOUCHER.annualCap)} = ₹${MEAL_VOUCHER.perMeal} × ${MEAL_VOUCHER.mealsPerDay} meals × ${MEAL_VOUCHER.workingDaysPerMonth} days × ${MEAL_VOUCHER.monthsPerYear} months.`}
              />
            </section>

            <CurrencyField
              id="employerNps"
              label="Employer NPS contribution - Sec 80CCD(2)"
              value={form.employerNps}
              onChange={handleFieldChange}
              hint="Allowed in both regimes: 14% of basic (new), 10% (old)."
            />

            <fieldset className="space-y-5 border-t border-blue-100 pt-5">
              <legend className="text-sm font-semibold text-blue-900 mb-1">
                Old regime only
              </legend>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CurrencyField
                  id="hraReceived"
                  label="HRA received (annual)"
                  value={form.hraReceived}
                  onChange={handleFieldChange}
                />
                <CurrencyField
                  id="rentPaid"
                  label="Rent paid (annual)"
                  value={form.rentPaid}
                  onChange={handleFieldChange}
                />
              </div>

              <CurrencyField
                id="section80C"
                label="Section 80C"
                value={form.section80C}
                onChange={handleFieldChange}
                max={DEDUCTION_LIMITS.section80C}
                hint={`Max ${formatCurrency(DEDUCTION_LIMITS.section80C)} - PF, ELSS, life insurance, tuition fees.`}
              />
              <CurrencyField
                id="section80CCD1B"
                label="Section 80CCD(1B) - own NPS"
                value={form.section80CCD1B}
                onChange={handleFieldChange}
                max={DEDUCTION_LIMITS.section80CCD1B}
                hint={`Max ${formatCurrency(DEDUCTION_LIMITS.section80CCD1B)}, over and above 80C.`}
              />
              <CurrencyField
                id="section80D"
                label="Section 80D - health insurance"
                value={form.section80D}
                onChange={handleFieldChange}
                max={DEDUCTION_LIMITS.section80D}
                hint={`Max ${formatCurrency(DEDUCTION_LIMITS.section80D)} including senior citizen parents.`}
              />
              <CurrencyField
                id="section24B"
                label="Section 24(b) - home loan interest"
                value={form.section24B}
                onChange={handleFieldChange}
                max={DEDUCTION_LIMITS.section24B}
                hint={`Max ${formatCurrency(DEDUCTION_LIMITS.section24B)} for a self-occupied property.`}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CurrencyField
                  id="savingsInterest"
                  label={savingsLabel}
                  value={form.savingsInterest}
                  onChange={handleFieldChange}
                  max={
                    ageGroup === "below60"
                      ? DEDUCTION_LIMITS.section80TTA
                      : DEDUCTION_LIMITS.section80TTB
                  }
                />
                <CurrencyField
                  id="professionalTax"
                  label="Professional tax paid"
                  value={form.professionalTax}
                  onChange={handleFieldChange}
                  max={DEDUCTION_LIMITS.professionalTax}
                  hint={`Max ${formatCurrency(DEDUCTION_LIMITS.professionalTax)} a year.`}
                />
              </div>
            </fieldset>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleCalculate}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3.5 rounded-lg
                           hover:bg-blue-700 active:bg-blue-800 transition-colors duration-200 text-base font-medium
                           shadow-md shadow-blue-600/20"
              >
                <Calculator className="w-5 h-5" aria-hidden="true" />
                Calculate tax
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="sm:w-32 px-6 py-3.5 rounded-lg border-2 border-blue-200 text-blue-700
                           hover:bg-blue-50 transition-colors duration-200 text-base font-medium"
              >
                Reset
              </button>
            </div>

            <button
              type="button"
              onClick={toggleHelp}
              aria-expanded={showHelp}
              className="w-full flex items-center justify-center gap-2 text-blue-700 hover:text-blue-800
                         py-2 rounded-lg hover:bg-blue-50/50 transition-colors duration-200 text-base"
            >
              <HelpCircle className="w-5 h-5" aria-hidden="true" />
              {showHelp ? "Hide rules for this year" : "Show rules for this year"}
            </button>

            {showHelp && (
              <Suspense
                fallback={
                  <p className="text-center text-sm text-blue-600 py-4">
                    Loading rules…
                  </p>
                }
              >
                <HelpPanel ageGroup={ageGroup} />
              </Suspense>
            )}
          </div>
        </div>

        {comparison && (
          <Suspense
            fallback={
              <p className="text-center text-sm text-blue-600 py-4">
                Preparing your breakdown…
              </p>
            }
          >
            <TaxBreakdown comparison={comparison} />
          </Suspense>
        )}
      </div>

      <footer className="text-center py-6 text-sm text-blue-600 flex flex-col items-center gap-1.5">
        <div className="flex items-center gap-1.5">
          Made with
          <Heart
            className="w-4 h-4 text-red-500 fill-current"
            aria-hidden="true"
          />
          for tax payers from Sivaprasath
        </div>
        <a
          href="https://github.com/sivaprasathm93/tax-app"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-blue-800"
        >
          GitHub repository
        </a>
      </footer>
    </div>
  );
}

export default App;
