import {
  PrintDocument,
  PrintRow,
  PrintSection,
} from "./PrintDocument";
import { calculateBreakeven } from "../../utils/breakeven";
import {
  BreakevenResult,
  ComparisonResult,
  TakeHomeResult,
  TaxInput,
} from "../../types";
import { formatCurrency, formatPercent } from "../../utils/format";

interface Props {
  profileName: string;
  input: TaxInput;
  comparison: ComparisonResult;
  takeHome: TakeHomeResult | null;
}

function advice(breakeven: BreakevenResult): string {
  if (breakeven.unreachable) {
    return "The new regime is cheaper at this income whatever you claim. No amount of additional deduction would change that, so there is nothing to plan around — elect the new regime and stop.";
  }
  if (breakeven.shortfall > 0) {
    return `Claiming ${formatCurrency(breakeven.shortfall)} more in eligible deductions would make the old regime cheaper. Until then the new regime saves ${formatCurrency(breakeven.saving)}, and electing it is the correct choice.`;
  }
  if (breakeven.betterRegime === "old") {
    return `Deductions already exceed the breakeven, so the old regime saves ${formatCurrency(breakeven.saving)}. Declare it in the HR portal and keep proof of every line above — anything that cannot be evidenced in January is added back.`;
  }
  return "Both regimes cost the same at this level of deduction. Any further deduction tips the balance to the old regime.";
}

/**
 * The one-page record: computation, comparison and the recommendation that
 * follows from them. Written for someone reading it cold — a spouse, an
 * advisor, or the taxpayer themselves in nine months' time — so every figure
 * carries the reasoning that produced it.
 */
export function TaxSummarySheet({
  profileName,
  input,
  comparison,
  takeHome,
}: Props) {
  const { oldRegime, newRegime, betterRegime } = comparison;
  const winner = betterRegime === "old" ? oldRegime : newRegime;
  const breakeven = calculateBreakeven(input, comparison);

  return (
    <PrintDocument
      title="Income tax summary"
      subtitle={
        betterRegime === "equal"
          ? "Both regimes cost the same"
          : `${betterRegime === "old" ? "Old" : "New"} regime recommended — ${formatCurrency(breakeven.saving)} lower`
      }
      meta={profileName}
    >
      <PrintSection title="Recommendation">
        <p className="text-[10.5pt]">{advice(breakeven)}</p>
        <div className="mt-2">
          <PrintRow
            label="Total tax for the year"
            value={formatCurrency(winner.totalTax)}
            bold
          />
          <PrintRow
            label="Effective rate on gross income"
            value={formatPercent(winner.effectiveRate)}
          />
          <PrintRow
            label="Tax per month"
            value={formatCurrency(winner.totalTax / 12)}
          />
        </div>
      </PrintSection>

      <PrintSection title="Regime comparison">
        <div className="flex justify-between text-[9pt] font-semibold uppercase tracking-wider border-b border-black/30 pb-1 mb-1">
          <span />
          <span className="flex gap-8">
            <span className="w-28 text-right">Old regime</span>
            <span className="w-28 text-right">New regime</span>
          </span>
        </div>
        <TwoColumnRow
          label="Gross income"
          left={formatCurrency(oldRegime.grossIncome)}
          right={formatCurrency(newRegime.grossIncome)}
        />
        <TwoColumnRow
          label="Exemptions and deductions"
          left={`- ${formatCurrency(oldRegime.totalExemptions + oldRegime.totalDeductions)}`}
          right={`- ${formatCurrency(newRegime.totalExemptions + newRegime.totalDeductions)}`}
        />
        <TwoColumnRow
          label="Taxable income"
          left={formatCurrency(oldRegime.taxableIncome)}
          right={formatCurrency(newRegime.taxableIncome)}
          rule
        />
        <TwoColumnRow
          label="Tax on slabs"
          left={formatCurrency(oldRegime.taxBeforeRebate)}
          right={formatCurrency(newRegime.taxBeforeRebate)}
        />
        {(oldRegime.rebate > 0 || newRegime.rebate > 0) && (
          <TwoColumnRow
            label="Rebate u/s 87A"
            left={oldRegime.rebate > 0 ? `- ${formatCurrency(oldRegime.rebate)}` : "—"}
            right={newRegime.rebate > 0 ? `- ${formatCurrency(newRegime.rebate)}` : "—"}
          />
        )}
        {(oldRegime.rebateMarginalRelief > 0 ||
          newRegime.rebateMarginalRelief > 0) && (
          <TwoColumnRow
            label="Marginal relief u/s 87A"
            left={
              oldRegime.rebateMarginalRelief > 0
                ? `- ${formatCurrency(oldRegime.rebateMarginalRelief)}`
                : "—"
            }
            right={
              newRegime.rebateMarginalRelief > 0
                ? `- ${formatCurrency(newRegime.rebateMarginalRelief)}`
                : "—"
            }
          />
        )}
        {(oldRegime.surcharge > 0 || newRegime.surcharge > 0) && (
          <TwoColumnRow
            label="Surcharge"
            left={formatCurrency(oldRegime.surcharge)}
            right={formatCurrency(newRegime.surcharge)}
          />
        )}
        <TwoColumnRow
          label="Health & Education Cess at 4%"
          left={formatCurrency(oldRegime.cess)}
          right={formatCurrency(newRegime.cess)}
        />
        <TwoColumnRow
          label="Total tax"
          left={formatCurrency(oldRegime.totalTax)}
          right={formatCurrency(newRegime.totalTax)}
          rule
          bold
        />
      </PrintSection>

      <PrintSection title="Reliefs claimed">
        {[...oldRegime.exemptions, ...oldRegime.deductions].map((line) => (
          <PrintRow
            key={line.key}
            label={line.label}
            note={line.note}
            value={formatCurrency(line.amount)}
            indent
          />
        ))}
        <PrintRow
          label="Total under the old regime"
          value={formatCurrency(
            oldRegime.totalExemptions + oldRegime.totalDeductions
          )}
          rule
          bold
        />
        <PrintRow
          label="Total under the new regime"
          value={formatCurrency(
            newRegime.totalExemptions + newRegime.totalDeductions
          )}
          bold
        />
      </PrintSection>

      {!breakeven.unreachable && breakeven.required !== null && (
        <PrintSection title="Breakeven analysis">
          <PrintRow
            label="Discretionary deductions currently claimed"
            value={formatCurrency(breakeven.claimed)}
          />
          <PrintRow
            label="Deductions needed for the old regime to win"
            value={formatCurrency(breakeven.required)}
          />
          <PrintRow
            label={breakeven.shortfall > 0 ? "Shortfall" : "Surplus"}
            value={formatCurrency(
              breakeven.shortfall > 0
                ? breakeven.shortfall
                : breakeven.claimed - breakeven.required
            )}
            rule
            bold
          />
        </PrintSection>
      )}

      {takeHome && (
        <PrintSection title="Monthly take-home">
          <PrintRow
            label="Annual CTC"
            value={formatCurrency(
              takeHome.grossSalary + takeHome.totalRetirals
            )}
          />
          {takeHome.retirals.map((line) => (
            <PrintRow
              key={line.key}
              label={line.label}
              note={line.note}
              value={`- ${formatCurrency(line.annual)}`}
              indent
            />
          ))}
          <PrintRow
            label="Gross salary"
            value={formatCurrency(takeHome.grossSalary)}
            rule
            bold
          />
          {takeHome.deductions.map((line) => (
            <PrintRow
              key={line.key}
              label={line.label}
              note={line.note}
              value={`- ${formatCurrency(line.annual)}`}
              indent
            />
          ))}
          <PrintRow
            label="Annual take-home"
            value={formatCurrency(takeHome.annualInHand)}
            rule
            bold
          />
          <PrintRow
            label="Monthly bank credit"
            value={formatCurrency(takeHome.monthlyInHand)}
            note="in a month with no variable payout"
            bold
          />
        </PrintSection>
      )}
    </PrintDocument>
  );
}

function TwoColumnRow({
  label,
  left,
  right,
  bold = false,
  rule = false,
}: {
  label: string;
  left: string;
  right: string;
  bold?: boolean;
  rule?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 py-[3px] ${
        rule ? "border-t border-black/50 mt-1 pt-1" : ""
      } ${bold ? "font-semibold" : ""}`}
    >
      <span>{label}</span>
      <span className="flex gap-8 tabular-nums">
        <span className="w-28 text-right">{left}</span>
        <span className="w-28 text-right">{right}</span>
      </span>
    </div>
  );
}
