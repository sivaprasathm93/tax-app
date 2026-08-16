import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  BookOpen,
  Heart,
  Receipt,
  RotateCcw,
  UtensilsCrossed,
  Sparkles,
  Sliders,
  Zap,
} from "lucide-react";
import { CurrencyField } from "./components/CurrencyField";
import { FormSection } from "./components/FormSection";
import { ProfileBar } from "./components/ProfileBar";
import { ResultPanel } from "./components/ResultPanel";
import { Select } from "./components/Select";
import { SubTabs } from "./components/ui/SubTabs";
import { StickyKpiHeader } from "./components/ui/StickyKpiHeader";
import { QuickWizardModal } from "./components/QuickWizardModal";
import { DashboardSideWidgets } from "./components/widgets/DashboardSideWidgets";
import { TaxSummarySheet } from "./components/print/TaxSummarySheet";
import { usePrint } from "./state/printContext";
import { useProfile } from "./state/profileContext";
import { calculateTakeHome, carriedDeductions } from "./utils/takeHome";
import { calculateTaxComparison } from "./utils/taxCalculator";
import { carPerquisiteValue } from "./constants/allowances";
import { EMPTY_TAX_FORM } from "./constants/defaults";
import {
  ASSESSMENT_YEAR,
  DEDUCTION_LIMITS,
  FINANCIAL_YEAR,
  MEAL_VOUCHER,
  METRO_CITIES,
} from "./constants/taxRules";
import { AgeGroup, CityType, TaxFieldName, TaxInput } from "./types";
import { formatCurrency } from "./utils/format";

// Everything past the income tax form is fetched only when its tab is opened.
const TaxBreakdown = lazy(() =>
  import("./components/TaxBreakdown").then((m) => ({ default: m.TaxBreakdown }))
);
const HelpPanel = lazy(() => import("./components/HelpPanel"));
const BreakevenPanel = lazy(() =>
  import("./components/BreakevenPanel").then((m) => ({
    default: m.BreakevenPanel,
  }))
);
const TakeHomeCalculator = lazy(
  () => import("./components/TakeHomeCalculator")
);
const OfferComparison = lazy(() => import("./components/OfferComparison"));
const HraAndDocuments = lazy(() => import("./components/HraAndDocuments"));
const RetiralsTab = lazy(() => import("./components/RetiralsTab"));
const EquityCalculator = lazy(() => import("./components/EquityCalculator"));
const AdvanceTaxPlanner = lazy(() => import("./components/AdvanceTaxPlanner"));
const TaxCalendar = lazy(() => import("./components/TaxCalendar"));

type Tool =
  | "tax"
  | "takeHome"
  | "offers"
  | "hra"
  | "retirals"
  | "equity"
  | "advanceTax"
  | "calendar";

const TOOLS: { id: Tool; label: string }[] = [
  { id: "tax", label: "Income tax" },
  { id: "takeHome", label: "Take-home" },
  { id: "offers", label: "Offers" },
  { id: "hra", label: "HRA & docs" },
  { id: "retirals", label: "Retirals" },
  { id: "equity", label: "Equity" },
  { id: "advanceTax", label: "Advance tax" },
  { id: "calendar", label: "Calendar" },
];

const HEADINGS: Record<Tool, { title: string; blurb: string; document: string }> =
  {
    tax: {
      title: "Income Tax Calculator",
      blurb:
        "Old regime versus new, worked out as you type. Rules from the Income-tax Act, 2025 and the Income-tax Rules, 2026 — both in force from 1 April 2026.",
      document: `Income Tax Calculator FY ${FINANCIAL_YEAR} (A.Y. ${ASSESSMENT_YEAR})`,
    },
    takeHome: {
      title: "CTC to Take-Home",
      blurb:
        "Where an ₹18 lakh CTC actually goes. Employer retirals, provident fund, professional tax and TDS, removed one line at a time.",
      document: `Take-Home Salary Calculator FY ${FINANCIAL_YEAR}`,
    },
    offers: {
      title: "Offer Comparison",
      blurb:
        "Two offers, side by side, on the numbers that matter — monthly in-hand and net income, not the headline CTC.",
      document: `Job Offer Comparison FY ${FINANCIAL_YEAR}`,
    },
    hra: {
      title: "HRA & Rent Receipts",
      blurb:
        "Your exemption under section 10(13A), and a printable set of receipts your HR portal will accept.",
      document: `HRA Calculator & Rent Receipts FY ${FINANCIAL_YEAR}`,
    },
    retirals: {
      title: "Retirals & Exit Payouts",
      blurb:
        "Gratuity, provident fund and leave encashment — the three sums that decide what leaving is worth.",
      document: `Gratuity, EPF & Leave Encashment FY ${FINANCIAL_YEAR}`,
    },
    equity: {
      title: "ESOP, RSU & ESPP Tax",
      blurb:
        "Two stages, two bases: the perquisite on vesting, and the capital gain on sale over the value already taxed.",
      document: `ESOP & RSU Tax Calculator FY ${FINANCIAL_YEAR}`,
    },
    advanceTax: {
      title: "Advance Tax Planner",
      blurb:
        "Interest, gains and freelance income your employer never withheld on — and the four dates that keep 234B and 234C away.",
      document: `Advance Tax Planner FY ${FINANCIAL_YEAR}`,
    },
    calendar: {
      title: "Tax Calendar",
      blurb:
        "Every date in the salaried year that costs money to miss, exportable to your own calendar.",
      document: `Tax Calendar FY ${FINANCIAL_YEAR}`,
    },
  };

const OLD_REGIME_FIELDS: TaxFieldName[] = [
  "hraReceived",
  "section80C",
  "section80CCD1B",
  "section80D",
  "section24B",
  "savingsInterest",
  "professionalTax",
  "lta",
];

const AGE_OPTIONS: { value: AgeGroup; label: string }[] = [
  { value: "below60", label: "Below 60" },
  { value: "senior", label: "60 to 79" },
  { value: "superSenior", label: "80 and above" },
];

const CAR_PERQUISITE_OPTIONS = [
  { value: carPerquisiteValue(false, false), label: "Up to 1.6L engine, no driver" },
  { value: carPerquisiteValue(false, true), label: "Up to 1.6L engine, with driver" },
  { value: carPerquisiteValue(true, false), label: "Above 1.6L engine, no driver" },
  { value: carPerquisiteValue(true, true), label: "Above 1.6L engine, with driver" },
].map((option) => ({
  value: option.value,
  label: `${option.label} — ${formatCurrency(option.value)} taxable`,
}));

const DEFAULT_CAR_PERQUISITE = carPerquisiteValue(true, true);

const FALLBACK = (
  <p className="text-sm text-[color:var(--ink-muted)] py-6">Loading…</p>
);

function useTool() {
  const [active, setActive] = useState<Tool>("tax");
  const [opened, setOpened] = useState<Set<Tool>>(() => new Set<Tool>(["tax"]));

  const select = useCallback((next: Tool) => {
    setActive(next);
    setOpened((current) =>
      current.has(next) ? current : new Set(current).add(next)
    );
  }, []);

  return { active, opened, select };
}

function App() {
  const { profile, profiles, switchTo, update } = useProfile();
  const { print, printing } = usePrint();

  const [mode, setMode] = useState<"quick" | "pro">("quick");
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);

  const tool = useTool();

  useEffect(() => {
    document.title = HEADINGS[tool.active].document;
  }, [tool.active]);

  const form = profile.tax;

  const handleFieldChange = useCallback(
    (name: string, value: string) => {
      update({ tax: { ...profile.tax, [name]: value } });
    },
    [profile.tax, update]
  );

  const handleReset = useCallback(
    () => update({ tax: { ...EMPTY_TAX_FORM } }),
    [update]
  );

  const input = useMemo<TaxInput>(() => {
    const numbers = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [
        key,
        value === "" ? 0 : Number(value),
      ])
    ) as Record<TaxFieldName, number>;

    return {
      ...numbers,
      carPerquisite:
        numbers.carLease > 0 && numbers.carPerquisite <= 0
          ? DEFAULT_CAR_PERQUISITE
          : numbers.carPerquisite,
      ageGroup: profile.ageGroup,
      cityType: profile.cityType,
    };
  }, [form, profile.ageGroup, profile.cityType]);

  const comparison = useMemo(
    () => (input.grossIncome > 0 ? calculateTaxComparison(input) : null),
    [input]
  );

  const monthlyTakeHome = useMemo(() => {
    if (profile.takeHome.annualCtc > 0) {
      const th = calculateTakeHome(profile.takeHome, carriedDeductions(input));
      return th.inHandMonthly;
    }
    if (comparison) {
      const winner =
        comparison.betterRegime === "old"
          ? comparison.oldRegime
          : comparison.newRegime;
      return winner.takeHome / 12;
    }
    return 0;
  }, [profile.takeHome, input, comparison]);

  const handleApplyWizard = useCallback(
    (data: {
      grossIncome: number;
      basicSalary: number;
      hraReceived: number;
      rentPaid: number;
      cityType: CityType;
      section80C: number;
      section80D: number;
      mealVouchers: number;
    }) => {
      update({
        cityType: data.cityType,
        tax: {
          ...profile.tax,
          grossIncome: String(data.grossIncome),
          basicSalary: String(data.basicSalary),
          hraReceived: String(data.hraReceived),
          rentPaid: String(data.rentPaid),
          section80C: String(data.section80C),
          section80D: String(data.section80D),
          mealVouchers: String(data.mealVouchers),
        },
        takeHome: {
          ...profile.takeHome,
          annualCtc: data.grossIncome,
          basicPercent: 50,
          hraPercent: data.rentPaid > 0 ? 20 : 0,
        },
      });
    },
    [profile, update]
  );

  const handleApplyOptimization = useCallback(
    (field: string, amount: number) => {
      update({
        tax: {
          ...profile.tax,
          [field]: String(amount),
        },
      });
    },
    [profile.tax, update]
  );

  const scrollToBreakdown = useCallback(() => {
    document
      .getElementById("breakdown")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleExport = useCallback(() => {
    if (!comparison) return;
    const takeHome =
      profile.takeHome.annualCtc > 0
        ? calculateTakeHome(profile.takeHome, carriedDeductions(input))
        : null;

    print(
      <TaxSummarySheet
        profileName={profile.name}
        input={input}
        comparison={comparison}
        takeHome={takeHome}
      />,
      `Tax summary ${FINANCIAL_YEAR} - ${profile.name}`
    );
  }, [comparison, input, print, profile]);

  const allowanceTotal =
    Math.min(input.mealVouchers, MEAL_VOUCHER.annualCap) +
    input.employerNps +
    input.reimbursements +
    Math.max(0, input.carLease - input.carPerquisite);
  const oldRegimeTotal = OLD_REGIME_FIELDS.reduce(
    (total, field) => total + input[field],
    0
  );
  const anyValue = Object.values(form).some((value) => value !== "");

  const savingsLimit =
    profile.ageGroup === "below60"
      ? DEDUCTION_LIMITS.section80TTA
      : DEDUCTION_LIMITS.section80TTB;

  const heading = HEADINGS[tool.active];

  return (
    <div id="app-root" className="min-h-screen flex flex-col bg-slate-50/50">
      {/* ── Sticky Top KPI Header ── */}
      <StickyKpiHeader
        comparison={comparison}
        mode={mode}
        onToggleMode={setMode}
        onOpenWizard={() => setIsWizardOpen(true)}
        monthlyTakeHome={monthlyTakeHome}
      />

      {/* ── 60-Second Quick Start Wizard Modal ── */}
      <QuickWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onApply={handleApplyWizard}
      />

      {/* ── Main Full-Width Cockpit Container ── */}
      <main className="w-full max-w-[1780px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-grow">
        {/* App Title & Profile Bar */}
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                FY {FINANCIAL_YEAR} · A.Y. {ASSESSMENT_YEAR}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700">
                {mode === "quick" ? (
                  <>
                    <Sparkles className="w-3 h-3 text-amber-500" /> Quick Mode
                  </>
                ) : (
                  <>
                    <Sliders className="w-3 h-3 text-blue-600" /> Pro Detail Mode
                  </>
                )}
              </span>
            </div>
            <h1 className="mt-1.5 text-2xl sm:text-[2rem] font-bold tracking-tight text-slate-900">
              {heading.title}
            </h1>
            <p className="mt-1.5 text-[15px] text-[color:var(--ink-secondary)] max-w-3xl">
              {heading.blurb}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ProfileBar
              onExport={comparison ? handleExport : null}
              exporting={printing}
            />
          </div>
        </header>

        {/* ── SubTabs Navigation ── */}
        <div className="mb-6 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <SubTabs
            label="Calculator"
            items={TOOLS}
            active={tool.active}
            onSelect={tool.select}
          />
        </div>

        {/* ── Full-Width Responsive Cockpit Layout (Main Workspace + Side Widgets) ── */}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_360px] items-start">
          {/* Main Interactive Workspace */}
          <div className="min-w-0 space-y-6">
            {/* ── Income Tax Tab ── */}
            <div
              className={`${
                tool.active === "tax" ? "grid" : "hidden"
              } gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start`}
            >
              <div className="space-y-4 lg:col-start-1 lg:row-start-1">
                {/* Quick Mode Onboarding Banner */}
                {mode === "quick" && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-slate-50 border border-blue-200/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span className="p-2 rounded-xl bg-blue-600 text-white shrink-0 shadow-2xs">
                        <Zap className="w-4 h-4" />
                      </span>
                      <div>
                        <h2 className="text-sm font-bold text-slate-900">
                          Need a 60-Second Tax Estimate?
                        </h2>
                        <p className="text-xs text-slate-600">
                          Auto-split salary and compare New vs Old regimes
                          instantly.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setIsWizardOpen(true)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3.5 py-2 rounded-lg transition-colors shadow-2xs"
                      >
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        Launch 60s Wizard
                      </button>
                      <button
                        type="button"
                        onClick={() => setMode("pro")}
                        className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 px-2.5 py-2 rounded-lg hover:bg-white/60 transition-colors"
                      >
                        Switch to Pro
                      </button>
                    </div>
                  </div>
                )}

                <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 sm:p-6">
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
                      value={profile.ageGroup}
                      onChange={(value) =>
                        update({ ageGroup: value as AgeGroup })
                      }
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
                      value={profile.cityType}
                      onChange={(value) =>
                        update({ cityType: value as CityType })
                      }
                    >
                      <option value="metro">Metro — 50% HRA</option>
                      <option value="nonMetro">Non-metro — 40% HRA</option>
                    </Select>
                  </div>
                </section>

                {comparison && (
                  <Suspense fallback={FALLBACK}>
                    <BreakevenPanel input={input} comparison={comparison} />
                  </Suspense>
                )}

                {/* ── Tax-Free Allowances Section ── */}
                <FormSection
                  title="Tax-free allowances"
                  description="Reduce your tax under both regimes"
                  summary={
                    allowanceTotal > 0
                      ? `${formatCurrency(allowanceTotal)} claimed`
                      : "Meal vouchers, reimbursements, employer NPS"
                  }
                  icon={<UtensilsCrossed className="w-[18px] h-[18px]" />}
                  accent
                >
                  <div className="rounded-xl bg-emerald-50/70 border border-emerald-100 px-3.5 py-3">
                    <p className="text-xs text-emerald-900">
                      <strong>New this year.</strong> Rule 15(5)(a) raised meal
                      vouchers from ₹50 to ₹{MEAL_VOUCHER.perMeal} a meal on 1
                      April 2026, and they now count under <strong>both</strong>{" "}
                      regimes. Cash meal allowances still do not qualify.
                    </p>
                  </div>

                  <CurrencyField
                    id="mealVouchers"
                    label="Meal vouchers / food card"
                    value={form.mealVouchers}
                    onChange={handleFieldChange}
                    max={MEAL_VOUCHER.annualCap}
                    hint={`Up to ${formatCurrency(
                      MEAL_VOUCHER.annualCap
                    )} a year — ₹${MEAL_VOUCHER.perMeal} × ${
                      MEAL_VOUCHER.mealsPerDay
                    } meals × ${MEAL_VOUCHER.workingDaysPerMonth} days × ${
                      MEAL_VOUCHER.monthsPerYear
                    } months.`}
                  />

                  <CurrencyField
                    id="basicSalary"
                    label="Basic salary + DA"
                    value={form.basicSalary}
                    onChange={handleFieldChange}
                    hint="Sets the ceiling for HRA and employer NPS below."
                  />

                  {(mode === "pro" || input.employerNps > 0) && (
                    <CurrencyField
                      id="employerNps"
                      label="Employer NPS contribution"
                      value={form.employerNps}
                      onChange={handleFieldChange}
                      hint="Sec 80CCD(2) — 14% of basic under the new regime, 10% under the old."
                    />
                  )}

                  {(mode === "pro" || input.reimbursements > 0) && (
                    <CurrencyField
                      id="reimbursements"
                      label="Telephone, internet & books"
                      value={form.reimbursements}
                      onChange={handleFieldChange}
                      hint="Rule 3(7)(ix) — reimbursed against bills, so not a perquisite in either regime."
                    />
                  )}

                  {(mode === "pro" || input.carLease > 0) && (
                    <>
                      <CurrencyField
                        id="carLease"
                        label="Employer car — lease, fuel & driver"
                        value={form.carLease}
                        onChange={handleFieldChange}
                        hint="What the whole arrangement costs your employer for the year."
                      />
                      {input.carLease > 0 && (
                        <>
                          <Select
                            id="carPerquisite"
                            label="Car and driver provided"
                            value={
                              form.carPerquisite ||
                              String(DEFAULT_CAR_PERQUISITE)
                            }
                            onChange={(value) =>
                              handleFieldChange("carPerquisite", value)
                            }
                            hint="Rule 3(7)(vii) fixes the taxable perquisite by engine size, not by cost."
                          >
                            {CAR_PERQUISITE_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </Select>
                          <div className="rounded-xl bg-emerald-50/70 border border-emerald-100 px-3.5 py-3">
                            <p className="text-xs text-emerald-900">
                              Your employer spends{" "}
                              {formatCurrency(input.carLease)} and you are taxed
                              on {formatCurrency(input.carPerquisite || 0)} of
                              it. The other{" "}
                              <strong>
                                {formatCurrency(
                                  Math.max(
                                    0,
                                    input.carLease -
                                      (input.carPerquisite || 0)
                                  )
                                )}
                              </strong>{" "}
                              never becomes salary — and because this is a
                              valuation rule rather than an exemption, it
                              survives under both regimes.
                            </p>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </FormSection>

                {/* ── Old Regime Deductions Section ── */}
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
                      id="section80D"
                      label="Section 80D"
                      value={form.section80D}
                      onChange={handleFieldChange}
                      max={DEDUCTION_LIMITS.section80D}
                      hint="Health insurance premiums"
                    />

                    {(mode === "pro" || input.section80CCD1B > 0) && (
                      <CurrencyField
                        id="section80CCD1B"
                        label="Section 80CCD(1B)"
                        value={form.section80CCD1B}
                        onChange={handleFieldChange}
                        max={DEDUCTION_LIMITS.section80CCD1B}
                        hint="Your own NPS, over and above 80C"
                      />
                    )}

                    {(mode === "pro" || input.section24B > 0) && (
                      <CurrencyField
                        id="section24B"
                        label="Section 24(b)"
                        value={form.section24B}
                        onChange={handleFieldChange}
                        max={DEDUCTION_LIMITS.section24B}
                        hint="Home loan interest"
                      />
                    )}

                    {(mode === "pro" || input.savingsInterest > 0) && (
                      <CurrencyField
                        id="savingsInterest"
                        label={
                          profile.ageGroup === "below60"
                            ? "Section 80TTA"
                            : "Section 80TTB"
                        }
                        value={form.savingsInterest}
                        onChange={handleFieldChange}
                        max={savingsLimit}
                        hint={
                          profile.ageGroup === "below60"
                            ? "Savings account interest"
                            : "Interest income, senior citizens"
                        }
                      />
                    )}

                    {(mode === "pro" || input.professionalTax > 0) && (
                      <CurrencyField
                        id="professionalTax"
                        label="Professional tax"
                        value={form.professionalTax}
                        onChange={handleFieldChange}
                        max={DEDUCTION_LIMITS.professionalTax}
                        hint="Deducted by your employer"
                      />
                    )}

                    {(mode === "pro" || input.lta > 0) && (
                      <CurrencyField
                        id="lta"
                        label="Leave travel concession"
                        value={form.lta}
                        onChange={handleFieldChange}
                        hint="Sec 10(5) — actual travel, twice in four years"
                      />
                    )}
                  </div>
                </FormSection>

                <FormSection
                  title="This year's rules"
                  description="Slabs, ceilings and what changed on 1 April 2026"
                  summary="Slabs, ceilings and what changed on 1 April 2026"
                  icon={<BookOpen className="w-[18px] h-[18px]" />}
                >
                  <Suspense fallback={FALLBACK}>
                    <HelpPanel ageGroup={profile.ageGroup} />
                  </Suspense>
                </FormSection>
              </div>

              {/* ── Sticky Live Results & Chart Panel ── */}
              <div className="lg:col-start-2 lg:row-start-1 lg:sticky lg:top-14">
                <ResultPanel
                  comparison={comparison}
                  onSeeBreakdown={scrollToBreakdown}
                />
              </div>
            </div>

            {tool.active === "tax" && comparison && (
              <div className="mt-6">
                <Suspense fallback={FALLBACK}>
                  <TaxBreakdown comparison={comparison} />
                </Suspense>
              </div>
            )}

            {/* ── Secondary Tool Tabs ── */}
            <Suspense fallback={FALLBACK}>
              {tool.opened.has("takeHome") && (
                <div
                  className={tool.active === "takeHome" ? undefined : "hidden"}
                >
                  <TakeHomeCalculator />
                </div>
              )}
              {tool.opened.has("offers") && (
                <div
                  className={tool.active === "offers" ? undefined : "hidden"}
                >
                  <OfferComparison input={input} />
                </div>
              )}
              {tool.opened.has("hra") && (
                <div className={tool.active === "hra" ? undefined : "hidden"}>
                  <HraAndDocuments input={input} />
                </div>
              )}
              {tool.opened.has("retirals") && (
                <div
                  className={tool.active === "retirals" ? undefined : "hidden"}
                >
                  <RetiralsTab />
                </div>
              )}
              {tool.opened.has("equity") && (
                <div
                  className={tool.active === "equity" ? undefined : "hidden"}
                >
                  <EquityCalculator />
                </div>
              )}
              {tool.opened.has("advanceTax") && (
                <div
                  className={
                    tool.active === "advanceTax" ? undefined : "hidden"
                  }
                >
                  <AdvanceTaxPlanner input={input} />
                </div>
              )}
              {tool.opened.has("calendar") && (
                <div
                  className={tool.active === "calendar" ? undefined : "hidden"}
                >
                  <TaxCalendar />
                </div>
              )}
            </Suspense>

            {/* ── Mobile/Tablet collapsible side widgets (shown below on < xl screens) ── */}
            <div className="xl:hidden mt-8 pt-6 border-t border-slate-200">
              <DashboardSideWidgets
                input={input}
                comparison={comparison}
                activeProfile={profile}
                profiles={profiles}
                onSwitchProfile={switchTo}
                onNavigateTool={tool.select}
                onApplyOptimization={handleApplyOptimization}
              />
            </div>
          </div>

          {/* ── Right Side Panel (Widescreen Cockpit Widgets) ── */}
          <div className="hidden xl:block xl:sticky xl:top-14 space-y-4">
            <DashboardSideWidgets
              input={input}
              comparison={comparison}
              activeProfile={profile}
              profiles={profiles}
              onSwitchProfile={switchTo}
              onNavigateTool={tool.select}
              onApplyOptimization={handleApplyOptimization}
            />
          </div>
        </div>

        <p className="mt-8 text-xs text-[color:var(--ink-muted)] max-w-3xl">
          Every figure here is an estimate worked out in your browser from the
          statutory rules in force for FY {FINANCIAL_YEAR}. Nothing you type is
          transmitted anywhere. This is a calculator, not tax advice — and where
          a number will be relied on, check it against your Form 16 and your
          AIS.
        </p>
      </main>

      <footer className="border-t border-slate-200/80 py-6 mt-auto bg-white">
        <div className="max-w-[1780px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-[color:var(--ink-muted)]">
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
