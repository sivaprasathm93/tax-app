import {
  AgeGroup,
  BreakevenResult,
  ComparisonResult,
  Regime,
  TaxInput,
} from "../types";
import { taxOnTaxableIncome } from "./taxCalculator";

/** Reliefs the taxpayer chooses, as against the ones every salaried person gets. */
const DISCRETIONARY_KEYS = new Set([
  "hra",
  "lta",
  "section80C",
  "section80CCD1B",
  "section80D",
  "section24B",
  "savingsInterest",
  "professionalTax",
]);

/**
 * How much the taxpayer is claiming under the old regime by choice - HRA, 80C,
 * 80D, home loan interest and the rest. The standard deduction, employer NPS
 * and meal vouchers are excluded: they arrive whatever the taxpayer does, and
 * counting them would understate the gap that has to be closed.
 */
function discretionaryRelief(comparison: ComparisonResult): number {
  const { oldRegime } = comparison;
  return [...oldRegime.exemptions, ...oldRegime.deductions]
    .filter((item) => DISCRETIONARY_KEYS.has(item.key))
    .reduce((total, item) => total + item.amount, 0);
}

/**
 * The deduction level at which both regimes cost the same.
 *
 * Solved by bisection rather than algebraically. Tax is piecewise linear in
 * income, but section 87A marginal relief, the surcharge bands and their own
 * marginal relief put kinks and a flat stretch into the curve, so there is no
 * closed form worth trusting. Tax is monotone non-increasing in relief, which
 * is all bisection needs, and 60 halvings of a 5-crore interval land inside a
 * rupee.
 *
 * The answer is reported to the nearest 100 rupees: quoting a taxpayer a
 * breakeven of "Rs 4,63,271" implies a precision that the underlying estimate
 * of their own 80C and 80D spending does not have.
 */
export function calculateBreakeven(
  input: TaxInput,
  comparison: ComparisonResult
): BreakevenResult {
  const { newRegime, oldRegime, difference, betterRegime } = comparison;
  const claimed = discretionaryRelief(comparison);
  const target = newRegime.totalTax;

  // Relief the old regime grants regardless - everything already applied,
  // less the discretionary part we are about to solve for.
  const fixedRelief =
    oldRegime.totalExemptions + oldRegime.totalDeductions - claimed;
  const baseTaxable = Math.max(0, input.grossIncome - fixedRelief);

  const oldTaxAt = (relief: number) =>
    taxOnTaxableIncome(
      Math.max(0, baseTaxable - relief),
      "old",
      input.ageGroup
    ).totalTax;

  // With nothing claimed the old regime is at its worst; if it still wins
  // there, no further deduction is needed to justify choosing it.
  if (oldTaxAt(0) <= target) {
    return {
      claimed,
      required: 0,
      shortfall: 0,
      saving: Math.abs(difference),
      betterRegime,
      unreachable: false,
    };
  }

  let low = 0;
  let high = baseTaxable;

  // Wiping out taxable income entirely is the most any deduction can do. Where
  // that still loses, the old regime is unreachable at this income.
  if (oldTaxAt(high) > target) {
    return {
      claimed,
      required: null,
      shortfall: 0,
      saving: Math.abs(difference),
      betterRegime,
      unreachable: true,
    };
  }

  for (let i = 0; i < 60 && high - low > 1; i++) {
    const mid = (low + high) / 2;
    if (oldTaxAt(mid) > target) low = mid;
    else high = mid;
  }

  const required = Math.ceil(high / 100) * 100;

  return {
    claimed,
    required,
    shortfall: Math.max(0, required - claimed),
    saving: Math.abs(difference),
    betterRegime,
    unreachable: false,
  };
}

/**
 * What the next rupee of deduction is actually worth, as a percentage.
 *
 * Probed rather than read off the slab table: the headline rate overstates the
 * saving wherever section 87A marginal relief is flattening the curve, and
 * understates it just above a surcharge threshold. This is the number that
 * answers "is another Rs 50,000 into 80C worth locking money away for".
 */
export function marginalReliefRate(
  taxableIncome: number,
  regime: Regime,
  ageGroup: AgeGroup
): number {
  const step = 10000;
  const here = taxOnTaxableIncome(taxableIncome, regime, ageGroup).totalTax;
  const lower = taxOnTaxableIncome(
    Math.max(0, taxableIncome - step),
    regime,
    ageGroup
  ).totalTax;
  return ((here - lower) / step) * 100;
}
