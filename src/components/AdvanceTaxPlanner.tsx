import { useCallback, useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, Coins, Info, Landmark } from "lucide-react";
import { CurrencyField } from "./CurrencyField";
import { FormSection } from "./FormSection";
import { Card } from "./ui/Card";
import { EmptyState } from "./ui/EmptyState";
import { HeroResult } from "./ui/HeroResult";
import { Note } from "./ui/Note";
import { StatRow } from "./ui/StatRow";
import { ToolLayout } from "./ui/ToolLayout";
import { calculateAdvanceTax } from "../utils/advanceTax";
import { calculateTax, calculateTaxComparison } from "../utils/taxCalculator";
import {
  ADVANCE_TAX_THRESHOLD,
  PRESUMPTIVE_PROFIT_PERCENT,
  PRESUMPTIVE_RECEIPTS_CEILING,
} from "../constants/advanceTaxRules";
import { LTCG_EXEMPTION, LTCG_RATE, STCG_RATE } from "../constants/equityRules";
import { OtherIncomeInput, TaxInput } from "../types";
import { formatCurrency } from "../utils/format";

type Field = keyof OtherIncomeInput;

const EMPTY: Record<Field, string> = {
  savingsInterest: "",
  fdInterest: "",
  dividend: "",
  stcgListed: "",
  stcgOther: "",
  ltcgListed: "",
  ltcgOther: "",
  freelanceReceipts: "",
  rentalIncome: "",
  employerTds: "",
  otherTds: "",
};

const DUE_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
};

export default function AdvanceTaxPlanner({ input }: { input: TaxInput }) {
  const [form, setForm] = useState(EMPTY);

  const handleChange = useCallback((name: string, value: string) => {
    setForm((previous) => ({ ...previous, [name]: value }));
  }, []);

  const other = useMemo<OtherIncomeInput>(
    () =>
      Object.fromEntries(
        Object.entries(form).map(([key, value]) => [
          key,
          value === "" ? 0 : Number(value),
        ])
      ) as unknown as OtherIncomeInput,
    [form]
  );

  const regime = useMemo(
    () =>
      input.grossIncome > 0 &&
      calculateTaxComparison(input).betterRegime === "old"
        ? ("old" as const)
        : ("new" as const),
    [input]
  );

  const salary = useMemo(
    () => calculateTax(input, regime),
    [input, regime]
  );

  const hasOtherIncome = useMemo(
    () =>
      other.savingsInterest +
        other.fdInterest +
        other.dividend +
        other.stcgListed +
        other.stcgOther +
        other.ltcgListed +
        other.ltcgOther +
        other.freelanceReceipts +
        other.rentalIncome >
      0,
    [other]
  );

  const result = useMemo(
    () =>
      input.grossIncome > 0 || hasOtherIncome
        ? calculateAdvanceTax(salary, other, regime, input.ageGroup)
        : null,
    [salary, other, regime, input.ageGroup, input.grossIncome, hasOtherIncome]
  );

  const overCeiling = other.freelanceReceipts > PRESUMPTIVE_RECEIPTS_CEILING;

  return (
    <ToolLayout
      form={
        <Card
          title="Income besides your salary"
          description="Everything your employer's TDS does not already cover."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CurrencyField
              id="savingsInterest"
              label="Savings account interest"
              value={form.savingsInterest}
              onChange={handleChange}
              hint="Deductible up to ₹10,000 under 80TTA — old regime only."
            />
            <CurrencyField
              id="fdInterest"
              label="Fixed deposit interest"
              value={form.fdInterest}
              onChange={handleChange}
              hint="The bank withholds 10%; you owe it at your slab rate."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <CurrencyField
              id="dividend"
              label="Dividend income"
              value={form.dividend}
              onChange={handleChange}
              hint="Taxed at slab rates in your hands since 2020."
            />
            <CurrencyField
              id="rentalIncome"
              label="Rent received"
              value={form.rentalIncome}
              onChange={handleChange}
              hint="30% standard deduction applies under section 24(a)."
            />
          </div>

          <div className="mt-5 pt-5 border-t border-slate-100">
            <h3 className="text-[13px] font-semibold text-slate-900 mb-1">
              Capital gains
            </h3>
            <p className="text-xs text-[color:var(--ink-muted)] mb-3">
              Split by where the shares are listed — the concessional rates
              reach Indian listed equity and nothing else.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CurrencyField
                id="stcgListed"
                label="Short-term — listed equity"
                value={form.stcgListed}
                onChange={handleChange}
                hint={`Held under 12 months. Section 111A, flat ${STCG_RATE}%.`}
              />
              <CurrencyField
                id="stcgOther"
                label="Short-term — foreign, unlisted, debt, property"
                value={form.stcgOther}
                onChange={handleChange}
                hint="Outside section 111A, so charged at your slab rate."
              />
              <CurrencyField
                id="ltcgListed"
                label="Long-term — listed equity"
                value={form.ltcgListed}
                onChange={handleChange}
                hint={`Section 112A, ${LTCG_RATE}% after the ${formatCurrency(LTCG_EXEMPTION)} annual shield.`}
              />
              <CurrencyField
                id="ltcgOther"
                label="Long-term — foreign, unlisted, debt, property"
                value={form.ltcgOther}
                onChange={handleChange}
                hint={`Section 112, ${LTCG_RATE}% from the first rupee — no shield.`}
              />
            </div>
          </div>

          <div className="mt-4">
            <CurrencyField
              id="freelanceReceipts"
              label="Freelance / consulting receipts"
              value={form.freelanceReceipts}
              onChange={handleChange}
              hint={`Gross, before expenses. ${PRESUMPTIVE_PROFIT_PERCENT}% is declared as profit under section 44ADA.`}
            />
          </div>

          {overCeiling && (
            <div className="mt-4">
              <Note tone="warn" icon={<AlertTriangle className="w-3.5 h-3.5" />}>
                Receipts are over the{" "}
                {formatCurrency(PRESUMPTIVE_RECEIPTS_CEILING)} ceiling for
                section 44ADA. Above it you must maintain books and have them
                audited, and the 50% presumption no longer applies — this
                estimate will overstate what you can shelter.
              </Note>
            </div>
          )}

          <div className="mt-5 pt-5 border-t border-slate-100">
            <h3 className="text-[13px] font-semibold text-slate-900 mb-3">
              Tax already deducted
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CurrencyField
                id="employerTds"
                label="TDS by your employer"
                value={form.employerTds}
                onChange={handleChange}
                hint="From your payslip or Form 26AS."
              />
              <CurrencyField
                id="otherTds"
                label="TDS by banks and others"
                value={form.otherTds}
                onChange={handleChange}
                hint="Check this against your AIS before relying on it."
              />
            </div>
          </div>
        </Card>
      }
      result={
        result === null ? (
          <EmptyState
            icon={<Coins className="w-6 h-6" />}
            title="Your advance tax appears here"
          >
            Add income your employer does not withhold on — interest, gains,
            freelance receipts — and the quarterly schedule is worked out as you
            type.
          </EmptyState>
        ) : (
          <HeroResult
            badge={result.advanceTaxDue ? "Advance tax due" : "Nothing due"}
            badgeTone={result.advanceTaxDue ? "warn" : "good"}
            value={formatCurrency(result.balancePayable)}
            caption="still to pay after TDS"
            footnote={
              result.advanceTaxDue ? (
                <span className="text-[color:var(--ink-secondary)]">
                  Over the {formatCurrency(ADVANCE_TAX_THRESHOLD)} threshold, so
                  it falls due in four instalments.
                </span>
              ) : (
                <span
                  className="font-semibold"
                  style={{ color: "var(--ink-success)" }}
                >
                  Under the threshold — settle it at filing
                </span>
              )
            }
          >
            <dl className="px-6 py-3 border-t border-slate-100 divide-y divide-slate-100">
              <StatRow
                label="Income taxed at slab rates"
                value={formatCurrency(result.slabIncome)}
                note={
                  result.slabTaxedGains > 0
                    ? "Salary, interest, dividend, rent, and gains outside 111A"
                    : "Salary, interest, dividend, rent, presumptive profit"
                }
              />
              {result.slabTaxedGains > 0 && (
                <StatRow
                  label="— of which short-term gains"
                  value={formatCurrency(result.slabTaxedGains)}
                  note="Foreign or unlisted, so no concessional rate"
                />
              )}
              {result.specialRateIncome > 0 && (
                <StatRow
                  label="Capital gains at flat rates"
                  value={formatCurrency(result.specialRateIncome)}
                  note={
                    result.exemptLongTermGains > 0
                      ? `After the ${formatCurrency(result.exemptLongTermGains)} shield under 112A`
                      : "Charged at their own rates, outside the slabs"
                  }
                />
              )}
              <StatRow
                label="Total liability"
                value={formatCurrency(result.totalLiability)}
                strong
              />
              <StatRow
                label="Less: TDS credited"
                value={`- ${formatCurrency(result.creditedTds)}`}
                credit
              />
            </dl>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60">
              <p className="text-xs text-[color:var(--ink-muted)]">
                Computed under the{" "}
                <strong className="text-slate-700">
                  {result.regime === "new" ? "new" : "old"} regime
                </strong>
                , the cheaper of the two at your income.
              </p>
            </div>
          </HeroResult>
        )
      }
    >
      {result?.advanceTaxDue && (
        <FormSection
          title="Your instalment schedule"
          description="Section 211 — cumulative, not additional"
          summary={`Four dates, ${formatCurrency(result.balancePayable)} in total`}
          icon={<CalendarClock className="w-[18px] h-[18px]" />}
          defaultOpen
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-[color:var(--ink-muted)]">
                <th scope="col" className="text-left font-medium pb-2">
                  Due by
                </th>
                <th scope="col" className="text-right font-medium pb-2">
                  Cumulative
                </th>
                <th scope="col" className="text-right font-medium pb-2">
                  Pay now
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {result.instalments.map((item) => (
                <tr
                  key={item.dueOn}
                  className={item.overdue ? "bg-amber-50/50" : ""}
                >
                  <td className="py-2.5 pr-3">
                    <span className="text-slate-900 font-medium">
                      {new Date(item.dueOn).toLocaleDateString(
                        "en-IN",
                        DUE_DATE_FORMAT
                      )}
                    </span>
                    <span className="block text-xs text-[color:var(--ink-muted)]">
                      {item.label} · {item.cumulativePercent}% of the liability
                      {item.overdue && " · date has passed"}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-[color:var(--ink-secondary)] whitespace-nowrap">
                    {formatCurrency(item.cumulativeAmount)}
                  </td>
                  <td className="py-2.5 pl-3 text-right tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Note tone="warn" icon={<AlertTriangle className="w-3.5 h-3.5" />}>
            Pay nothing until you file and the interest comes to roughly{" "}
            <strong>
              {formatCurrency(result.interest234B + result.interest234C)}
            </strong>{" "}
            — {formatCurrency(result.interest234C)} under section 234C for
            missing the instalments, and about{" "}
            {formatCurrency(result.interest234B)} under 234B for the four months
            from April to filing. Both run at 1% a month and neither is
            discretionary.
          </Note>

          <Note tone="info" icon={<Info className="w-3.5 h-3.5" />}>
            The simplest way to avoid all of this is to declare the other income
            to your employer, who will then withhold on it through payroll —
            section 192(2B). No instalments, no interest, nothing to remember.
          </Note>
        </FormSection>
      )}

      <FormSection
        title="How the second income is taxed"
        description="Where each source lands, and what the bank does not withhold"
        summary="Where each source lands, and what the bank does not withhold"
        icon={<Landmark className="w-[18px] h-[18px]" />}
      >
        <div className="text-sm space-y-3 text-[color:var(--ink-secondary)]">
          <p>
            <strong className="text-slate-900">Fixed deposits.</strong> The bank
            deducts 10% and stops there. At a 30% slab you still owe the other
            20%, and nobody will tell you so until the return is filed — which
            is the single most common reason a salaried taxpayer finds an
            unexpected demand in July.
          </p>
          <p>
            <strong className="text-slate-900">Capital gains.</strong> Charged
            at their own rates and kept out of the slabs, but they still count
            towards the surcharge thresholds — so a large gain can raise the
            rate on your salary too. That is why the surcharge here is computed
            on total income.
          </p>
          <p>
            <strong className="text-slate-900">Listed is not the same as
            traded.</strong> The concessional rates reach shares listed on a
            recognised Indian exchange. A US share is unlisted for this purpose
            however heavily it trades, so its short-term gain is charged at your
            slab rate rather than {STCG_RATE}%, and its long-term gain gets no
            part of the {formatCurrency(LTCG_EXEMPTION)} shield. That is the
            distinction the two columns above are for.
          </p>
          <p>
            <strong className="text-slate-900">Freelancing.</strong> Under
            section 44ADA you may declare {PRESUMPTIVE_PROFIT_PERCENT}% of gross
            receipts as profit and claim no expenses. It is usually favourable
            and always simpler — but it also moves you to ITR-4, and once you
            opt out you are barred from returning for five years.
          </p>
          <p>
            <strong className="text-slate-900">Check the AIS first.</strong> The
            Annual Information Statement is what the department already knows
            about your interest, dividends and trades. Reconcile against it
            before filing: a mismatch generates a notice on its own, whether or
            not any tax was actually short.
          </p>
        </div>
      </FormSection>
    </ToolLayout>
  );
}
