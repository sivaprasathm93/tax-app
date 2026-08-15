import { Suspense, lazy, useCallback, useMemo, useState } from "react";
import {
  BookOpen,
  Heart,
  Receipt,
  RotateCcw,
  UtensilsCrossed,
} from "lucide-react";
import { CurrencyField } from "./components/CurrencyField";
import { FormSection } from "./components/FormSection";
import { ResultPanel } from "./components/ResultPanel";
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
const TaxBreakdown = lazy(() =>
  import("./components/TaxBreakdown").then((m) => ({ default: m.TaxBreakdown }))
);
const HelpPanel = lazy(() => import("./components/HelpPanel"));

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
  { value: "senior", label: "60 to 79" },
  { value: "superSenior", label: "80 and above" },
];

const OLD_REGIME_FIELDS: FieldName[] = [
  "hraReceived",
  "section80C",
  "section80CCD1B",
  "section80D",
  "section24B",
  "savingsInterest",
  "professionalTax",
];

const selectClass =
  "w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3 text-base text-slate-900 " +
  "hover:border-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 focus:outline-none transition-colors";

function Select({
  id,
  label,
  hint,
  value,
  onChange,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-[13px] font-medium text-slate-700 mb-1.5">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={selectClass}
      >
        {children}
      </select>
      {hint && (
        <p className="mt-1.5 text-xs text-[color:var(--ink-muted)]">{hint}</p>
      )}
    </div>
  );
}

function App() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [ageGroup, setAgeGroup] = useState<AgeGroup>("below60");
  const [cityType, setCityType] = useState<CityType>("metro");

  // Stable identity keeps every memoised CurrencyField from re-rendering.
  const handleFieldChange = useCallback((name: string, value: string) => {
    setForm((previous) => ({ ...previous, [name]: value }));
  }, []);

  const handleReset = useCallback(() => setForm(EMPTY_FORM), []);

  const input = useMemo<TaxInput>(() => {
    const numbers = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [
        key,
        value === "" ? 0 : Number(value),
      ])
    ) as Record<FieldName, number>;
    return { ...numbers, ageGroup, cityType };
  }, [form, ageGroup, cityType]);

  // Live - the calculation is pure arithmetic, so there is no reason to make
  // the user press a button and then hunt for the result.
  const comparison = useMemo(
    () => (input.grossIncome > 0 ? calculateTaxComparison(input) : null),
    [input]
  );

  const scrollToBreakdown = useCallback(() => {
    document
      .getElementById("breakdown")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const allowanceTotal =
    Math.min(input.mealVouchers, MEAL_VOUCHER.annualCap) + input.employerNps;
  const oldRegimeTotal = OLD_REGIME_FIELDS.reduce(
    (total, field) => total + input[field],
    0
  );
  const anyValue = Object.values(form).some((value) => value !== "");

  const savingsLimit =
    ageGroup === "below60"
      ? DEDUCTION_LIMITS.section80TTA
      : DEDUCTION_LIMITS.section80TTB;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-grow">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
            FY {FINANCIAL_YEAR} · A.Y. {ASSESSMENT_YEAR}
          </p>
          <h1 className="mt-1.5 text-2xl sm:text-[2rem] font-semibold tracking-tight text-slate-900">
            Income Tax Calculator
          </h1>
          <p className="mt-2 text-[15px] text-[color:var(--ink-secondary)] max-w-2xl">
            Old regime versus new, worked out as you type. Rules from the
            Income-tax Act, 2025 and the Income-tax Rules, 2026 — both in force
            from 1 April 2026.
          </p>
        </header>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          {/* ── Step 1: the only field that is actually required ── */}
          <section className="lg:col-start-1 lg:row-start-1 rounded-2xl border border-slate-200 bg-white shadow-sm p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-[15px] font-semibold text-slate-900">
                  Your income
                </h2>
                <p className="text-xs text-[color:var(--ink-muted)]">
                  Start here — everything below is optional.
                </p>
              </div>
              {anyValue && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500
                             hover:text-slate-800 rounded-lg px-2 py-1 hover:bg-slate-100 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  Clear all
                </button>
              )}
            </div>

            <CurrencyField
              id="grossIncome"
              label="Gross annual salary"
              value={form.grossIncome}
              onChange={handleFieldChange}
              placeholder="0"
              size="lead"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <Select
                id="ageGroup"
                label="Age group"
                hint="Sets the old regime basic exemption."
                value={ageGroup}
                onChange={(value) => setAgeGroup(value as AgeGroup)}
              >
                {AGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              <Select
                id="cityType"
                label="City of residence"
                hint={`Metro since 1 Apr 2026: ${METRO_CITIES.join(", ")}.`}
                value={cityType}
                onChange={(value) => setCityType(value as CityType)}
              >
                <option value="metro">Metro — 50% HRA</option>
                <option value="nonMetro">Non-metro — 40% HRA</option>
              </Select>
            </div>
          </section>

          {/* ── The answer. Sticky beside the form on desktop; directly under
                 the income field on mobile, so it is never hunted for. ── */}
          <div className="lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:sticky lg:top-6">
            <ResultPanel
              comparison={comparison}
              onSeeBreakdown={scrollToBreakdown}
            />
          </div>

          {/* ── The optional detail, folded away until wanted ── */}
          <div className="lg:col-start-1 lg:row-start-2 space-y-3">
            <FormSection
              title="Tax-free allowances"
              description="Reduce your tax under both regimes"
              summary={
                allowanceTotal > 0
                  ? `${formatCurrency(allowanceTotal)} claimed`
                  : "Meal vouchers, employer NPS"
              }
              icon={<UtensilsCrossed className="w-[18px] h-[18px]" />}
              accent
            >
              <div className="rounded-xl bg-emerald-50/70 border border-emerald-100 px-3.5 py-3">
                <p className="text-xs text-emerald-900">
                  <strong>New this year.</strong> Rule 15(5)(a) raised meal
                  vouchers from ₹50 to ₹{MEAL_VOUCHER.perMeal} a meal on 1 April
                  2026, and they now count under{" "}
                  <strong>both</strong> regimes. Cash meal allowances still do
                  not qualify.
                </p>
              </div>

              <CurrencyField
                id="mealVouchers"
                label="Meal vouchers / food card"
                value={form.mealVouchers}
                onChange={handleFieldChange}
                max={MEAL_VOUCHER.annualCap}
                hint={`Up to ${formatCurrency(MEAL_VOUCHER.annualCap)} a year — ₹${MEAL_VOUCHER.perMeal} × ${MEAL_VOUCHER.mealsPerDay} meals × ${MEAL_VOUCHER.workingDaysPerMonth} days × ${MEAL_VOUCHER.monthsPerYear} months.`}
              />
              <CurrencyField
                id="basicSalary"
                label="Basic salary + DA"
                value={form.basicSalary}
                onChange={handleFieldChange}
                hint="Sets the ceiling for HRA and employer NPS below."
              />
              <CurrencyField
                id="employerNps"
                label="Employer NPS contribution"
                value={form.employerNps}
                onChange={handleFieldChange}
                hint="Sec 80CCD(2) — 14% of basic under the new regime, 10% under the old."
              />
            </FormSection>

            <FormSection
              title="Old regime deductions"
              description="Ignored entirely under the new regime"
              summary={
                oldRegimeTotal > 0
                  ? `${formatCurrency(oldRegimeTotal)} claimed`
                  : "HRA, 80C, 80D, home loan — skip if you use the new regime"
              }
              icon={<Receipt className="w-[18px] h-[18px]" />}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CurrencyField
                  id="hraReceived"
                  label="HRA received"
                  value={form.hraReceived}
                  onChange={handleFieldChange}
                />
                <CurrencyField
                  id="rentPaid"
                  label="Rent paid"
                  value={form.rentPaid}
                  onChange={handleFieldChange}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CurrencyField
                  id="section80C"
                  label="Section 80C"
                  value={form.section80C}
                  onChange={handleFieldChange}
                  max={DEDUCTION_LIMITS.section80C}
                  hint="PF, ELSS, insurance, tuition"
                />
                <CurrencyField
                  id="section80CCD1B"
                  label="Section 80CCD(1B)"
                  value={form.section80CCD1B}
                  onChange={handleFieldChange}
                  max={DEDUCTION_LIMITS.section80CCD1B}
                  hint="Your own NPS, over and above 80C"
                />
                <CurrencyField
                  id="section80D"
                  label="Section 80D"
                  value={form.section80D}
                  onChange={handleFieldChange}
                  max={DEDUCTION_LIMITS.section80D}
                  hint="Health insurance premiums"
                />
                <CurrencyField
                  id="section24B"
                  label="Section 24(b)"
                  value={form.section24B}
                  onChange={handleFieldChange}
                  max={DEDUCTION_LIMITS.section24B}
                  hint="Home loan interest"
                />
                <CurrencyField
                  id="savingsInterest"
                  label={ageGroup === "below60" ? "Section 80TTA" : "Section 80TTB"}
                  value={form.savingsInterest}
                  onChange={handleFieldChange}
                  max={savingsLimit}
                  hint={
                    ageGroup === "below60"
                      ? "Savings account interest"
                      : "Interest income, senior citizens"
                  }
                />
                <CurrencyField
                  id="professionalTax"
                  label="Professional tax"
                  value={form.professionalTax}
                  onChange={handleFieldChange}
                  max={DEDUCTION_LIMITS.professionalTax}
                  hint="Deducted by your employer"
                />
              </div>
            </FormSection>

            <FormSection
              title="This year's rules"
              description="Slabs, ceilings and what changed on 1 April 2026"
              summary="Slabs, ceilings and what changed on 1 April 2026"
              icon={<BookOpen className="w-[18px] h-[18px]" />}
            >
              <Suspense
                fallback={
                  <p className="text-sm text-[color:var(--ink-muted)] py-2">
                    Loading rules…
                  </p>
                }
              >
                <HelpPanel ageGroup={ageGroup} />
              </Suspense>
            </FormSection>
          </div>
        </div>

        {comparison && (
          <div className="mt-5">
            <Suspense
              fallback={
                <p className="text-center text-sm text-[color:var(--ink-muted)] py-6">
                  Preparing the breakdown…
                </p>
              }
            >
              <TaxBreakdown comparison={comparison} />
            </Suspense>
          </div>
        )}

        <p className="mt-6 text-xs text-[color:var(--ink-muted)] max-w-3xl">
          Salaried income only — capital gains, business income and other
          special-rate income are not modelled. This is a calculator, not tax
          advice.
        </p>
      </div>

      <footer className="border-t border-slate-200/80 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-[color:var(--ink-muted)]">
          <span className="inline-flex items-center gap-1.5">
            Made with
            <Heart
              className="w-4 h-4 text-red-500 fill-current"
              aria-hidden="true"
            />
            for tax payers from Sivaprasath
          </span>
          <a
            href="https://github.com/sivaprasathm93/tax-app"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-900 underline underline-offset-2 transition-colors"
          >
            GitHub repository
          </a>
        </div>
      </footer>
    </div>
  );
}

export default App;
