import { useCallback, useMemo } from "react";
import {
  AlertTriangle,
  Banknote,
  Building2,
  Info,
  PiggyBank,
  Wallet,
} from "lucide-react";
import { CurrencyField } from "./CurrencyField";
import { FormSection } from "./FormSection";
import { Select } from "./Select";
import { Card } from "./ui/Card";
import { EmptyState } from "./ui/EmptyState";
import { HeroResult } from "./ui/HeroResult";
import { Note } from "./ui/Note";
import { NumberField } from "./ui/NumberField";
import { StatRow } from "./ui/StatRow";
import { ToolLayout } from "./ui/ToolLayout";
import { useProfile } from "../state/profileContext";
import {
  MONTHS_PER_YEAR,
  PF_WAGE_CEILING,
  PT_STATES,
  WAGE_FLOOR_PERCENT,
} from "../constants/payrollRules";
import { MEAL_VOUCHER } from "../constants/taxRules";
import {
  calculateTakeHome,
  carriedDeductions,
  structureOverAllocated,
} from "../utils/takeHome";
import {
  PayLine,
  PfBasis,
  RegimeChoice,
  TakeHomeInput,
  TaxFieldName,
} from "../types";
import { formatCurrency, formatPercent } from "../utils/format";

/** Percentage and toggle fields are stored as numbers; money fields as strings. */
type PercentField =
  | "basicPercent"
  | "hraPercent"
  | "variablePercent"
  | "variablePayout"
  | "vpfPercent"
  | "employerNpsPercent";

type MoneyField = "annualCtc" | "insuranceAnnual" | "mealVoucherMonthly" | "flexiAnnual";

function LineList({
  lines,
  total,
  totalLabel,
  monthly = false,
}: {
  lines: PayLine[];
  total: number;
  totalLabel: string;
  /** Shows a monthly column alongside the annual one. */
  monthly?: boolean;
}) {
  if (lines.length === 0) {
    return (
      <p className="text-sm text-[color:var(--ink-muted)]">Nothing here yet.</p>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-xs uppercase tracking-wider text-[color:var(--ink-muted)]">
          <th scope="col" className="text-left font-medium pb-2">
            Component
          </th>
          {monthly && (
            <th scope="col" className="text-right font-medium pb-2">
              Monthly
            </th>
          )}
          <th scope="col" className="text-right font-medium pb-2">
            Annual
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {lines.map((item) => (
          <tr key={item.key}>
            <td className="py-2 pr-3 text-[color:var(--ink-secondary)]">
              {item.label}
              {item.note && (
                <span className="block text-xs text-[color:var(--ink-muted)]">
                  {item.note}
                </span>
              )}
            </td>
            {monthly && (
              <td className="py-2 px-3 text-right tabular-nums text-slate-800 whitespace-nowrap">
                {formatCurrency(item.annual / MONTHS_PER_YEAR)}
              </td>
            )}
            <td className="py-2 pl-3 text-right tabular-nums text-slate-800 whitespace-nowrap">
              {formatCurrency(item.annual)}
            </td>
          </tr>
        ))}
        <tr className="border-t-2 border-slate-300">
          <th scope="row" className="text-left font-semibold text-slate-900 py-2 pr-3">
            {totalLabel}
          </th>
          {monthly && (
            <td className="py-2 px-3 text-right tabular-nums font-semibold text-slate-900 whitespace-nowrap">
              {formatCurrency(total / MONTHS_PER_YEAR)}
            </td>
          )}
          <td className="py-2 pl-3 text-right tabular-nums font-semibold text-slate-900 whitespace-nowrap">
            {formatCurrency(total)}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export default function TakeHomeCalculator() {
  const { profile, update } = useProfile();
  const { takeHome: config, tax } = profile;

  const setConfig = useCallback(
    (patch: Partial<TakeHomeInput>) => {
      update({ takeHome: { ...config, ...patch } });
    },
    [config, update]
  );

  const handleMoney = useCallback(
    (name: string, value: string) => {
      setConfig({ [name as MoneyField]: value === "" ? 0 : Number(value) });
    },
    [setConfig]
  );

  const handlePercent = useCallback(
    (name: string, value: string) => {
      setConfig({ [name as PercentField]: value === "" ? 0 : Number(value) });
    },
    [setConfig]
  );

  // Old-regime reliefs are typed once on the income tax tab and reused here,
  // so the two tools can never disagree about the same taxpayer.
  const carried = useMemo(
    () =>
      carriedDeductions({
        ...(Object.fromEntries(
          Object.entries(tax).map(([key, value]) => [
            key,
            value === "" ? 0 : Number(value),
          ])
        ) as Record<TaxFieldName, number>),
        ageGroup: profile.ageGroup,
        cityType: profile.cityType,
      }),
    [profile.ageGroup, profile.cityType, tax]
  );

  const result = useMemo(
    () => (config.annualCtc > 0 ? calculateTakeHome(config, carried) : null),
    [config, carried]
  );

  const overAllocated = result !== null && structureOverAllocated(result);
  const basicBelowFloor = config.basicPercent < WAGE_FLOOR_PERCENT;

  const money = (field: MoneyField) =>
    config[field] === 0 ? "" : String(config[field]);
  const percent = (field: PercentField) => String(config[field]);

  return (
    <ToolLayout
      form={
        <Card
          title="Your offer"
          description="The headline number, and how it is split."
        >
          <CurrencyField
            id="annualCtc"
            label="Annual CTC"
            value={money("annualCtc")}
            onChange={handleMoney}
            placeholder="0"
            size="lead"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <NumberField
              id="basicPercent"
              label="Basic salary"
              value={percent("basicPercent")}
              onChange={handlePercent}
              suffix="% of CTC"
              max={100}
              hint="40% is the common default; the labour codes push it to 50%."
            />
            <NumberField
              id="hraPercent"
              label="HRA"
              value={percent("hraPercent")}
              onChange={handlePercent}
              suffix="% of basic"
              max={100}
              hint="50% of basic is standard in metro postings."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <NumberField
              id="variablePercent"
              label="Variable / performance pay"
              value={percent("variablePercent")}
              onChange={handlePercent}
              suffix="% of CTC"
              max={100}
              hint="Paid annually — it never reaches your monthly credit."
            />
            <NumberField
              id="variablePayout"
              label="Expected payout"
              value={percent("variablePayout")}
              onChange={handlePercent}
              suffix="%"
              max={100}
              hint="Model it at what you realistically expect, not at 100%."
            />
          </div>

          <div className="mt-4">
            <Select
              id="ptState"
              label="State you are payrolled in"
              value={config.stateId}
              onChange={(value) => setConfig({ stateId: value })}
              hint={
                PT_STATES.find((item) => item.id === config.stateId)?.note ?? ""
              }
            >
              {PT_STATES.map((state) => (
                <option key={state.id} value={state.id}>
                  {state.label}
                </option>
              ))}
            </Select>
          </div>

          {basicBelowFloor && config.annualCtc > 0 && (
            <div className="mt-4">
              <Note tone="warn" icon={<AlertTriangle className="w-3.5 h-3.5" />}>
                Basic is under {WAGE_FLOOR_PERCENT}% of CTC. The Code on Social
                Security requires wages to be at least half of total
                remuneration, so employers are moving towards that — which
                raises PF and gratuity, and lowers take-home.
              </Note>
            </div>
          )}

          {overAllocated && (
            <div className="mt-4">
              <Note tone="warn" icon={<AlertTriangle className="w-3.5 h-3.5" />}>
                Basic, HRA, the meal card and reimbursements together come to
                more than the CTC can carry once retirals are taken out. Lower
                one of them — special allowance has already been squeezed to
                zero.
              </Note>
            </div>
          )}
        </Card>
      }
      result={
        result === null ? (
          <EmptyState icon={<Wallet className="w-6 h-6" />} title="Your bank credit appears here">
            Enter your annual CTC and the monthly take-home is worked out as you
            type — retirals, PF, professional tax and TDS all removed.
          </EmptyState>
        ) : (
          <HeroResult
            badge="Monthly bank credit"
            value={formatCurrency(result.monthlyInHand)}
            caption="in a month with no variable payout"
            footnote={
              <span className="text-[color:var(--ink-secondary)]">
                {formatPercent(result.ctcToInHandRatio)} of your CTC reaches
                your account across the year.
              </span>
            }
          >
            <dl className="px-6 py-3 border-t border-slate-100 divide-y divide-slate-100">
              <StatRow
                label="Annual CTC"
                value={formatCurrency(config.annualCtc)}
              />
              <StatRow
                label="Less: employer retirals"
                value={`- ${formatCurrency(result.totalRetirals)}`}
                note="PF, gratuity, NPS, insurance"
              />
              <StatRow
                label="Gross salary"
                value={formatCurrency(result.grossSalary)}
                strong
              />
              <StatRow
                label="Less: payroll deductions"
                value={`- ${formatCurrency(result.totalDeductions)}`}
                note="PF, VPF, professional tax, TDS"
              />
              <StatRow
                label="Annual take-home"
                value={formatCurrency(result.annualInHand)}
                strong
              />
            </dl>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60">
              <p className="text-xs text-[color:var(--ink-muted)]">
                Tax computed under the{" "}
                <strong className="text-slate-700">
                  {result.regimeUsed === "new" ? "new" : "old"} regime
                </strong>{" "}
                at {formatCurrency(result.annualTax)} for the year, spread evenly
                across twelve months the way payroll does it.
              </p>
            </div>
          </HeroResult>
        )
      }
    >
      <FormSection
        title="Retirals & benefits"
        description="Inside your CTC, but never on your payslip"
        summary="PF basis, gratuity provision, employer NPS, insurance"
        icon={<Building2 className="w-[18px] h-[18px]" />}
      >
        <Note tone="info" icon={<Info className="w-3.5 h-3.5" />}>
          These four lines are the main reason an ₹18 lakh CTC is not an ₹18
          lakh salary. They are real money — the PF is yours and the insurance
          has value — but none of it is credited to your bank each month.
        </Note>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            id="employerPfBasis"
            label="Provident fund basis"
            value={config.employerPfBasis}
            onChange={(value) =>
              setConfig({ employerPfBasis: value as PfBasis })
            }
            hint={`Capping at the ₹${PF_WAGE_CEILING.toLocaleString("en-IN")} ceiling means ₹1,800 a month each side.`}
          >
            <option value="ceiling">Capped at the statutory ceiling</option>
            <option value="fullBasic">12% of full basic</option>
          </Select>
          <Select
            id="gratuityInCtc"
            label="Gratuity provision in CTC?"
            value={config.gratuityInCtc ? "yes" : "no"}
            onChange={(value) => setConfig({ gratuityInCtc: value === "yes" })}
            hint="4.81% of basic. Most offer letters include it; it vests only after 5 years."
          >
            <option value="yes">Yes — included</option>
            <option value="no">No</option>
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberField
            id="employerNpsPercent"
            label="Employer NPS"
            value={percent("employerNpsPercent")}
            onChange={handlePercent}
            suffix="% of basic"
            max={14}
            hint="Sec 80CCD(2) — deductible up to 14% under the new regime."
          />
          <NumberField
            id="vpfPercent"
            label="Voluntary PF (VPF)"
            value={percent("vpfPercent")}
            onChange={handlePercent}
            suffix="% of basic"
            max={88}
            hint="On top of the statutory 12%. Lowers take-home, raises your corpus."
          />
        </div>

        <CurrencyField
          id="insuranceAnnual"
          label="Group health & term premium"
          value={money("insuranceAnnual")}
          onChange={handleMoney}
          hint="The premium your employer pays on your behalf, if it is shown in your CTC."
        />
      </FormSection>

      <FormSection
        title="Tax-free components"
        description="Paid to you, but never taxed"
        summary={`Meal card, reimbursements`}
        icon={<PiggyBank className="w-[18px] h-[18px]" />}
        accent
      >
        <CurrencyField
          id="mealVoucherMonthly"
          label="Meal card loaded per month"
          value={money("mealVoucherMonthly")}
          onChange={handleMoney}
          max={MEAL_VOUCHER.annualCap / MONTHS_PER_YEAR}
          hint={`Up to ${formatCurrency(MEAL_VOUCHER.annualCap / MONTHS_PER_YEAR)} a month is exempt under Rule 15(5)(a) — in both regimes.`}
        />
        <CurrencyField
          id="flexiAnnual"
          label="Reimbursements claimed a year"
          value={money("flexiAnnual")}
          onChange={handleMoney}
          hint="Telephone, broadband, books and LTA, claimed against bills."
        />
        <Select
          id="regime"
          label="Tax regime for the TDS calculation"
          value={config.regime}
          onChange={(value) => setConfig({ regime: value as RegimeChoice })}
          hint="Auto picks whichever costs you less, using the deductions on the income tax tab."
        >
          <option value="auto">Auto — whichever is cheaper</option>
          <option value="new">New regime</option>
          <option value="old">Old regime</option>
        </Select>
      </FormSection>

      {result && (
        <>
          <FormSection
            title="Where the CTC goes"
            description="Every line, from the offer letter to your bank"
            summary={`${formatCurrency(result.totalRetirals)} never reaches your payslip`}
            icon={<Banknote className="w-[18px] h-[18px]" />}
            defaultOpen
          >
            <div>
              <h3 className="text-[13px] font-semibold text-slate-900 mb-2">
                Employer retirals — inside CTC, outside gross salary
              </h3>
              <LineList
                lines={result.retirals}
                total={result.totalRetirals}
                totalLabel="Total retirals"
              />
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-[13px] font-semibold text-slate-900 mb-2">
                Gross earnings — what your payslip shows
              </h3>
              <LineList
                lines={result.earnings}
                total={result.grossSalary}
                totalLabel="Gross salary"
                monthly
              />
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-[13px] font-semibold text-slate-900 mb-2">
                Payroll deductions
              </h3>
              <LineList
                lines={result.deductions}
                total={result.totalDeductions}
                totalLabel="Total deductions"
                monthly
              />
            </div>

            <Note tone="good" icon={<Wallet className="w-3.5 h-3.5" />}>
              <strong>{formatCurrency(result.monthlyInHand)}</strong> reaches
              your account each month, and{" "}
              <strong>{formatCurrency(result.annualInHand)}</strong> across the
              year once the variable is paid.
            </Note>
          </FormSection>
        </>
      )}
    </ToolLayout>
  );
}
