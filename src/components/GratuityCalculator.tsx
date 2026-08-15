import { useCallback, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUp,
  BadgeCheck,
  CalendarDays,
  Info,
  Wallet,
} from "lucide-react";
import { CurrencyField } from "./CurrencyField";
import { DateField } from "./DateField";
import { FormSection } from "./FormSection";
import { Select } from "./Select";
import { calculateGratuity, formulaText } from "../utils/gratuityCalculator";
import {
  AVERAGING_MONTHS,
  CODE_EFFECTIVE_FROM,
  DAYS_PER_YEAR,
  FIXED_TERM_MINIMUM_YEARS,
  GRATUITY_CEILING,
  MINIMUM_YEARS,
  MONTH_DIVISOR,
  PAYMENT_WINDOW_DAYS,
  TAX_EXEMPTION_LIMIT,
  WAGE_FLOOR_PERCENT,
} from "../constants/gratuityRules";
import {
  EmployerKind,
  EmploymentKind,
  ExitReason,
  GratuityCoverage,
  GratuityInput,
  GratuityResult,
} from "../types";
import { formatCurrency, formatNumber } from "../utils/format";

type MoneyField = "monthlyWage" | "monthlyCtc" | "amountReceived";
type DateFieldName = "joiningDate" | "exitDate";

const EMPTY_MONEY: Record<MoneyField, string> = {
  monthlyWage: "",
  monthlyCtc: "",
  amountReceived: "",
};

function describeService(result: GratuityResult): string {
  const { years, months, days } = result.service;
  const parts = [
    `${years} ${years === 1 ? "year" : "years"}`,
    `${months} ${months === 1 ? "month" : "months"}`,
    `${days} ${days === 1 ? "day" : "days"}`,
  ];
  return parts.join(", ");
}

function StatRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <dt className="text-sm text-[color:var(--ink-secondary)]">{label}</dt>
      <dd
        className={`text-sm tabular-nums ${
          strong ? "font-semibold text-slate-900" : "text-slate-800"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function Note({
  tone,
  icon,
  children,
}: {
  tone: "info" | "warn" | "good";
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const palette = {
    info: "bg-blue-50 border-blue-100 text-blue-900",
    warn: "bg-amber-50 border-amber-200 text-amber-900",
    good: "bg-emerald-50 border-emerald-100 text-emerald-900",
  }[tone];
  return (
    <div className={`flex gap-2 rounded-xl border px-3.5 py-3 ${palette}`}>
      <span className="shrink-0 mt-0.5" aria-hidden="true">
        {icon}
      </span>
      <p className="text-xs leading-relaxed">{children}</p>
    </div>
  );
}

function GratuityResultPanel({
  result,
  input,
}: {
  result: GratuityResult | null;
  input: GratuityInput;
}) {
  if (!result) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
        <span
          className="mx-auto grid place-items-center w-12 h-12 rounded-2xl bg-blue-50 text-blue-600"
          aria-hidden="true"
        >
          <CalendarDays className="w-6 h-6" />
        </span>
        <p className="mt-3 text-[15px] font-semibold text-slate-900">
          Your gratuity appears here
        </p>
        <p className="mt-1 text-sm text-[color:var(--ink-secondary)]">
          Add your joining date, last working day and monthly basic + DA — the
          payout is worked out as you type.
        </p>
      </div>
    );
  }

  if (!result.eligible) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-white shadow-sm overflow-hidden">
        <div className="p-6">
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-800 bg-amber-50 rounded-full px-2.5 py-1">
            Not yet eligible
          </p>
          <p className="mt-2.5 text-[2rem] leading-none font-semibold tracking-tight text-slate-900">
            {formatCurrency(0)}
          </p>
          <p className="mt-2 text-sm text-[color:var(--ink-secondary)]">
            {result.ineligibleReason}
          </p>
        </div>
        <dl className="px-6 py-3 border-t border-slate-100 divide-y divide-slate-100">
          <StatRow label="Service so far" value={describeService(result)} />
          <StatRow
            label="Minimum needed"
            value={`${result.minimumYears} ${result.minimumYears === 1 ? "year" : "years"}`}
          />
        </dl>
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60">
          <p className="text-xs text-[color:var(--ink-muted)]">
            The bar is waived entirely where service ends in death or
            disablement — switch “Reason for leaving” to see that.
          </p>
        </div>
      </div>
    );
  }

  const paidAboveEntitlement = result.amountReceived > result.entitlement;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="p-6 pb-5">
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 rounded-full px-2.5 py-1">
          <BadgeCheck className="w-3.5 h-3.5" aria-hidden="true" />
          Eligible
        </p>
        {/* Hero figure - proportional figures, not tabular, at display size. */}
        <p className="mt-2.5 text-[2.75rem] leading-none font-semibold tracking-tight text-slate-900">
          {formatCurrency(result.entitlement)}
        </p>
        <p className="mt-1.5 text-sm text-[color:var(--ink-secondary)]">
          gratuity payable
        </p>

        {result.taxableAmount > 0 ? (
          <p className="mt-3 text-sm font-medium text-amber-800">
            {formatCurrency(result.taxableAmount)} of this is taxable
          </p>
        ) : (
          <p
            className="mt-3 text-sm font-semibold"
            style={{ color: "var(--ink-success)" }}
          >
            Entirely tax-free
          </p>
        )}
      </div>

      <dl className="px-6 py-3 border-t border-slate-100 divide-y divide-slate-100">
        <StatRow label="Service" value={describeService(result)} />
        <StatRow
          label="Years counted"
          value={`${result.qualifyingYears}${result.roundedUp ? " (rounded up)" : ""}`}
        />
        <StatRow label="Wage base / month" value={formatCurrency(result.wageBase)} />
        {paidAboveEntitlement && (
          <StatRow
            label="Amount received"
            value={formatCurrency(result.amountReceived)}
          />
        )}
        <StatRow
          label="Tax-free"
          value={formatCurrency(result.exemptAmount)}
          strong
        />
        <StatRow label="Taxable" value={formatCurrency(result.taxableAmount)} strong />
      </dl>

      <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 space-y-2.5">
        <p className="text-xs text-[color:var(--ink-muted)]">
          {formulaText(input)} ={" "}
          <span className="tabular-nums">
            ({formatNumber(result.wageBase)} × {DAYS_PER_YEAR} ×{" "}
            {result.qualifyingYears}) ÷ {MONTH_DIVISOR[input.coverage]}
          </span>{" "}
          = {formatCurrency(result.formulaAmount)}
        </p>
        {result.wageFloorApplied && (
          <Note tone="good" icon={<ArrowUp className="w-3.5 h-3.5" />}>
            Your basic + DA was below {WAGE_FLOOR_PERCENT}% of CTC, so the new
            labour codes lift the wage base to{" "}
            {formatCurrency(result.wageBase)} a month. That is the change that
            raises most payouts.
          </Note>
        )}
        {result.cappedByCeiling && (
          <Note tone="warn" icon={<AlertTriangle className="w-3.5 h-3.5" />}>
            The formula gives {formatCurrency(result.formulaAmount)}, above the{" "}
            {formatCurrency(GRATUITY_CEILING)} statutory ceiling — the payout is
            capped there.
          </Note>
        )}
        {result.fullyExempt && (
          <Note tone="info" icon={<Info className="w-3.5 h-3.5" />}>
            Government service is exempt under section 10(10)(i) with no
            monetary ceiling.
          </Note>
        )}
      </div>
    </div>
  );
}

export default function GratuityCalculator() {
  const [dates, setDates] = useState<Record<DateFieldName, string>>({
    joiningDate: "",
    exitDate: "",
  });
  const [money, setMoney] = useState(EMPTY_MONEY);
  const [coverage, setCoverage] = useState<GratuityCoverage>("covered");
  const [employerKind, setEmployerKind] = useState<EmployerKind>("private");
  const [employmentKind, setEmploymentKind] =
    useState<EmploymentKind>("permanent");
  const [exitReason, setExitReason] = useState<ExitReason>("resignation");

  const handleDateChange = useCallback((name: string, value: string) => {
    setDates((previous) => ({ ...previous, [name]: value }));
  }, []);

  const handleMoneyChange = useCallback((name: string, value: string) => {
    setMoney((previous) => ({ ...previous, [name]: value }));
  }, []);

  const input = useMemo<GratuityInput>(
    () => ({
      joiningDate: dates.joiningDate,
      exitDate: dates.exitDate,
      monthlyWage: money.monthlyWage === "" ? 0 : Number(money.monthlyWage),
      monthlyCtc: money.monthlyCtc === "" ? 0 : Number(money.monthlyCtc),
      amountReceived:
        money.amountReceived === "" ? 0 : Number(money.amountReceived),
      coverage,
      employerKind,
      employmentKind,
      exitReason,
    }),
    [dates, money, coverage, employerKind, employmentKind, exitReason]
  );

  const result = useMemo(
    () => (input.monthlyWage > 0 ? calculateGratuity(input) : null),
    [input]
  );

  const datesOutOfOrder =
    dates.joiningDate !== "" &&
    dates.exitDate !== "" &&
    dates.exitDate <= dates.joiningDate;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      <section className="lg:col-start-1 lg:row-start-1 rounded-2xl border border-slate-200 bg-white shadow-sm p-5 sm:p-6">
        <div className="mb-4">
          <h2 className="text-[15px] font-semibold text-slate-900">
            Your service
          </h2>
          <p className="text-xs text-[color:var(--ink-muted)]">
            Gratuity is paid on completed years, so the dates do most of the
            work.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DateField
            id="joiningDate"
            label="Date of joining"
            value={dates.joiningDate}
            onChange={handleDateChange}
            max={dates.exitDate || undefined}
          />
          <DateField
            id="exitDate"
            label="Last working day"
            value={dates.exitDate}
            onChange={handleDateChange}
            min={dates.joiningDate || undefined}
            invalid={datesOutOfOrder}
            hint={
              datesOutOfOrder
                ? "The last working day must fall after the joining date."
                : undefined
            }
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <Select
            id="employmentKind"
            label="Type of employment"
            value={employmentKind}
            onChange={(value) => setEmploymentKind(value as EmploymentKind)}
            hint={`Fixed-term staff qualify after ${FIXED_TERM_MINIMUM_YEARS} year under the new codes, against ${MINIMUM_YEARS}.`}
          >
            <option value="permanent">Permanent</option>
            <option value="fixedTerm">Fixed-term contract</option>
          </Select>
          <Select
            id="exitReason"
            label="Reason for leaving"
            value={exitReason}
            onChange={(value) => setExitReason(value as ExitReason)}
            hint="Death or disablement waives the qualifying-service bar."
          >
            <option value="resignation">
              Resignation, retirement or end of term
            </option>
            <option value="deathOrDisablement">Death or disablement</option>
          </Select>
        </div>

        <div className="mt-5 pt-5 border-t border-slate-100">
          <h2 className="text-[15px] font-semibold text-slate-900 mb-1">
            Your salary
          </h2>
          <p className="text-xs text-[color:var(--ink-muted)] mb-4">
            {coverage === "covered"
              ? "Last drawn monthly basic + DA."
              : `Average monthly basic + DA over your last ${AVERAGING_MONTHS} months.`}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CurrencyField
              id="monthlyWage"
              label={
                coverage === "covered"
                  ? "Last drawn basic + DA"
                  : `Average basic + DA (${AVERAGING_MONTHS} months)`
              }
              value={money.monthlyWage}
              onChange={handleMoneyChange}
              placeholder="0"
            />
            <CurrencyField
              id="monthlyCtc"
              label="Total monthly CTC"
              value={money.monthlyCtc}
              onChange={handleMoneyChange}
              hint={`Optional — used to apply the ${WAGE_FLOOR_PERCENT}% wage floor.`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <Select
              id="coverage"
              label="Employer covered by the gratuity statute?"
              value={coverage}
              onChange={(value) => setCoverage(value as GratuityCoverage)}
              hint="Covered once the employer has had 10 or more employees."
            >
              <option value="covered">Yes — 10 or more employees</option>
              <option value="notCovered">No</option>
            </Select>
            <Select
              id="employerKind"
              label="Type of employer"
              value={employerKind}
              onChange={(value) => setEmployerKind(value as EmployerKind)}
              hint="Government gratuity is fully exempt from tax."
            >
              <option value="private">Private sector</option>
              <option value="government">Government</option>
            </Select>
          </div>
        </div>
      </section>

      <div className="lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:sticky lg:top-6">
        <GratuityResultPanel result={result} input={input} />
      </div>

      <div className="lg:col-start-1 lg:row-start-2 space-y-3">
        <FormSection
          title="Employer paid a different amount?"
          description="Enter the actual payout to split it into tax-free and taxable"
          summary={
            money.amountReceived !== ""
              ? `${formatCurrency(Number(money.amountReceived))} received`
              : "Only needed if the payout differs from the entitlement"
          }
          icon={<Wallet className="w-[18px] h-[18px]" />}
        >
          <CurrencyField
            id="amountReceived"
            label="Gratuity actually received"
            value={money.amountReceived}
            onChange={handleMoneyChange}
            hint="Anything an employer pays above the statutory formula is taxable in full, however it is labelled."
          />
        </FormSection>

        <FormSection
          title="How gratuity works"
          description={`Rules under the Code on Social Security, in force since ${CODE_EFFECTIVE_FROM}`}
          summary={`Rules under the Code on Social Security, in force since ${CODE_EFFECTIVE_FROM}`}
          icon={<Info className="w-[18px] h-[18px]" />}
        >
          <div className="text-sm space-y-3 text-[color:var(--ink-secondary)]">
            <p>
              <strong className="text-slate-900">The formula.</strong> Employers
              under the statute pay{" "}
              {DAYS_PER_YEAR} days&apos; wages for each completed year, dividing
              the monthly wage by {MONTH_DIVISOR.covered} — a month&apos;s
              working days, Sundays excluded. Employers outside it divide by{" "}
              {MONTH_DIVISOR.notCovered}, which pays less for the same salary.
            </p>
            <p>
              <strong className="text-slate-900">Part years.</strong> Under the
              statute a trailing part-year counts as a full year once it exceeds
              six months, so 7 years and 7 months is paid as 8. Outside the
              statute only completed years count and the remainder is dropped.
            </p>
            <p>
              <strong className="text-slate-900">
                What changed under the new codes.
              </strong>{" "}
              Wages must now be at least {WAGE_FLOOR_PERCENT}% of total
              remuneration. Where a salary was built on a thin basic, the
              gratuity base rises to that floor — which is why many payouts are
              larger than under the old structure. Fixed-term employees also
              qualify after {FIXED_TERM_MINIMUM_YEARS} year rather than{" "}
              {MINIMUM_YEARS}.
            </p>
            <p>
              <strong className="text-slate-900">Ceilings and tax.</strong> The
              payout is capped at {formatCurrency(GRATUITY_CEILING)}. Government
              gratuity is fully exempt; for everyone else section 10(10) exempts
              the least of what was received, the statutory formula, and{" "}
              {formatCurrency(TAX_EXEMPTION_LIMIT)} — and that ceiling is a
              lifetime total across employers, not a fresh allowance per job.
            </p>
            <p>
              <strong className="text-slate-900">Payment.</strong> Gratuity
              falls due on exit and must be settled within{" "}
              {PAYMENT_WINDOW_DAYS} days, with interest running after that.
            </p>
          </div>
        </FormSection>
      </div>
    </div>
  );
}
