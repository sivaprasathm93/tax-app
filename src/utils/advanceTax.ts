import {
  ADVANCE_TAX_THRESHOLD,
  INSTALMENTS,
  INTEREST_RATE_PER_MONTH,
  MONTHS_CHARGED_234C,
  PRESUMPTIVE_PROFIT_PERCENT,
  SAFE_HARBOUR_PERCENT,
} from "../constants/advanceTaxRules";
import {
  LTCG_EXEMPTION,
  LTCG_RATE,
  STCG_RATE,
} from "../constants/equityRules";
import { CESS_RATE } from "../constants/taxRules";
import {
  AdvanceTaxInstalment,
  AdvanceTaxResult,
  AgeGroup,
  OtherIncomeInput,
  Regime,
  TaxCalculation,
} from "../types";
import { computeSurcharge, taxOnTaxableIncome } from "./taxCalculator";
import { NEW_REGIME_SLABS, OLD_REGIME_SLABS } from "../constants/taxRules";

function safe(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

/**
 * Total liability once secondary income is added to salary, and the advance
 * tax schedule that follows.
 *
 * Capital gains are charged at their own flat rates and kept out of the slab
 * computation, but they still count towards the surcharge threshold - which is
 * why the surcharge is computed on the combined figure and then apportioned,
 * rather than being taken from the salary calculation unchanged.
 *
 * The salary side is passed in already computed, so this function never
 * disagrees with the main comparison about the same taxpayer.
 */
export function calculateAdvanceTax(
  salary: TaxCalculation,
  other: OtherIncomeInput,
  regime: Regime,
  ageGroup: AgeGroup,
  today: Date = new Date()
): AdvanceTaxResult {
  const savingsInterest = safe(other.savingsInterest);
  const fdInterest = safe(other.fdInterest);
  const dividend = safe(other.dividend);
  const rental = safe(other.rentalIncome);
  const receipts = safe(other.freelanceReceipts);
  const stcgListed = safe(other.stcgListed);
  const stcgOther = safe(other.stcgOther);
  const ltcgListed = safe(other.ltcgListed);
  const ltcgOther = safe(other.ltcgOther);

  // Section 44ADA: half of gross professional receipts is the declared profit,
  // and no expenses may be claimed against it.
  const presumptiveProfit = (receipts * PRESUMPTIVE_PROFIT_PERCENT) / 100;

  // House property carries a flat 30% standard deduction under section 24(a).
  const rentalTaxable = rental * 0.7;

  // A short-term gain outside section 111A - foreign shares, unlisted shares,
  // debt funds, property - has no concessional rate at all. It is ordinary
  // income, so it joins the slabs rather than being charged separately.
  const slabIncome =
    salary.taxableIncome +
    savingsInterest +
    fdInterest +
    dividend +
    rentalTaxable +
    presumptiveProfit +
    stcgOther;

  const charge = taxOnTaxableIncome(slabIncome, regime, ageGroup);

  // Section 112A shields the first Rs 1.25 lakh of long-term gains on listed
  // equity each year - once, across every such gain. Nothing else gets it:
  // a foreign share is not listed on a recognised Indian exchange, so its
  // long-term gain is charged under section 112 at the same 12.5% but from
  // the first rupee.
  const exemptLongTermGains = Math.min(ltcgListed, LTCG_EXEMPTION);
  const taxableLongTerm =
    Math.max(0, ltcgListed - exemptLongTermGains) + ltcgOther;

  const taxOnShortTermGains = (stcgListed * STCG_RATE) / 100;
  const taxOnLongTermGains = (taxableLongTerm * LTCG_RATE) / 100;

  // Only the gains charged at their own flat rate sit outside the slabs.
  const specialRateIncome = stcgListed + ltcgListed + ltcgOther;

  // Gains do not enter the slabs but do count towards the surcharge threshold,
  // so the surcharge is recomputed on total income and total tax.
  const totalIncome = slabIncome + specialRateIncome;
  const taxBeforeSurcharge =
    charge.taxBeforeRebate -
    charge.rebate -
    charge.rebateMarginalRelief +
    taxOnShortTermGains +
    taxOnLongTermGains;

  const slabs = regime === "new" ? NEW_REGIME_SLABS : OLD_REGIME_SLABS[ageGroup];
  const { surcharge, marginalRelief } = computeSurcharge(
    totalIncome,
    Math.max(0, taxBeforeSurcharge),
    slabs,
    regime
  );

  const taxPlusSurcharge = Math.max(
    0,
    taxBeforeSurcharge + surcharge - marginalRelief
  );
  const cess = (taxPlusSurcharge * CESS_RATE) / 100;
  const totalLiability = Math.round(taxPlusSurcharge + cess);

  const creditedTds = safe(other.employerTds) + safe(other.otherTds);
  const balancePayable = Math.max(0, totalLiability - creditedTds);
  const advanceTaxDue = balancePayable >= ADVANCE_TAX_THRESHOLD;

  /* ── The section 211 schedule ── */

  let alreadyScheduled = 0;
  const instalments: AdvanceTaxInstalment[] = INSTALMENTS.map((item) => {
    const cumulativeAmount = Math.round(
      (balancePayable * item.cumulativePercent) / 100
    );
    const amount = Math.max(0, cumulativeAmount - alreadyScheduled);
    alreadyScheduled = cumulativeAmount;

    return {
      label: item.label,
      dueOn: item.dueOn,
      cumulativePercent: item.cumulativePercent,
      cumulativeAmount,
      amount,
      overdue: new Date(item.dueOn) < today,
    };
  });

  /* ── What it costs to ignore the schedule ── */

  // Section 234C, assuming nothing is paid until filing: each instalment's
  // shortfall carries 1% a month for the months the statute charges. The
  // safe-harbour percentages apply to the first two instalments.
  const interest234C = advanceTaxDue
    ? INSTALMENTS.reduce((total, _instalment, index) => {
        const required = (balancePayable * SAFE_HARBOUR_PERCENT[index]) / 100;
        return (
          total +
          (required * INTEREST_RATE_PER_MONTH * MONTHS_CHARGED_234C[index]) / 100
        );
      }, 0)
    : 0;

  // Section 234B runs from 1 April until the tax is actually paid. Four months
  // to the 31 July filing date is the common case.
  const interest234B = advanceTaxDue
    ? (balancePayable * INTEREST_RATE_PER_MONTH * 4) / 100
    : 0;

  return {
    slabIncome,
    specialRateIncome,
    presumptiveProfit,
    taxOnSlabIncome: charge.taxBeforeRebate - charge.rebate,
    taxOnShortTermGains,
    taxOnLongTermGains,
    exemptLongTermGains,
    slabTaxedGains: stcgOther,
    cess,
    surcharge: Math.max(0, surcharge - marginalRelief),
    totalLiability,
    creditedTds,
    balancePayable,
    advanceTaxDue,
    instalments,
    interest234B: Math.round(interest234B),
    interest234C: Math.round(interest234C),
    regime,
  };
}
