import { OfferInput, OfferResult } from "../types";
import { CarriedDeductions, calculateTakeHome } from "./takeHome";
import { calculateTax } from "./taxCalculator";
import { STRUCTURE_DEFAULTS } from "../constants/payrollRules";
import { createId } from "./profileStorage";

export function emptyOffer(name: string): OfferInput {
  return {
    id: createId(),
    name,
    annualCtc: 0,
    basicPercent: STRUCTURE_DEFAULTS.basicPercent,
    hraPercent: STRUCTURE_DEFAULTS.hraPercent,
    variablePercent: 0,
    variablePayout: 100,
    joiningBonus: 0,
    equityGrant: 0,
    equityVestYears: 4,
    employerNpsPercent: 0,
    employerPfBasis: "ceiling",
    gratuityInCtc: true,
    insuranceAnnual: 0,
    mealVoucherMonthly: 0,
    stateId: "none",
  };
}

/**
 * Prices an offer the way a candidate should read it: not by its CTC, but by
 * what actually arrives.
 *
 * Three things routinely inflate a headline CTC without improving anyone's
 * life - employer retirals, a variable component that pays out at 70%, and a
 * joining bonus that appears once and is then quietly absent from year two.
 * Reporting first-year and steady-state numbers separately is the point of
 * this function: an offer that wins in year one can lose from year two on.
 *
 * Equity is valued at grant price and taxed as a perquisite at the marginal
 * rate, because that is how a vest is charged. What the share is worth on the
 * vesting date is unknowable, and pretending otherwise is how offer
 * comparisons go wrong.
 */
export function evaluateOffer(
  offer: OfferInput,
  carried: CarriedDeductions
): OfferResult {
  const takeHome = calculateTakeHome(
    {
      annualCtc: offer.annualCtc,
      basicPercent: offer.basicPercent,
      hraPercent: offer.hraPercent,
      variablePercent: offer.variablePercent,
      variablePayout: offer.variablePayout,
      employerPfBasis: offer.employerPfBasis,
      vpfPercent: 0,
      employerNpsPercent: offer.employerNpsPercent,
      gratuityInCtc: offer.gratuityInCtc,
      insuranceAnnual: offer.insuranceAnnual,
      mealVoucherMonthly: offer.mealVoucherMonthly,
      flexiAnnual: 0,
      stateId: offer.stateId,
      regime: "auto",
    },
    carried
  );

  const vestYears = Math.max(1, offer.equityVestYears);
  const annualEquity = Math.max(0, offer.equityGrant) / vestYears;
  const joiningBonus = Math.max(0, offer.joiningBonus);

  /**
   * Equity and the joining bonus are salary in the year they land, so they are
   * charged by re-running the computation with them included rather than by
   * multiplying through a marginal rate.
   *
   * The difference is not academic. On a Rs 12 lakh offer the salary alone
   * sits under the section 87A ceiling and its marginal rate is zero - but a
   * vest on top pushes income past that ceiling and is taxed in full. A rate
   * probed at the salary position would have called that equity tax-free.
   */
  const taxOn = (extra: number) =>
    extra <= 0
      ? takeHome.annualTax
      : calculateTax(
          {
            ...takeHome.taxInput,
            grossIncome: takeHome.taxInput.grossIncome + extra,
          },
          takeHome.regimeUsed
        ).totalTax;

  const taxOnEquity = taxOn(annualEquity) - takeHome.annualTax;
  const taxOnBoth = taxOn(annualEquity + joiningBonus) - takeHome.annualTax;

  const extras = annualEquity + joiningBonus;
  const equityTaxRate = extras > 0 ? (taxOnBoth / extras) * 100 : 0;

  const steadyStateNet =
    takeHome.annualInHand + annualEquity - Math.max(0, taxOnEquity);

  return {
    input: offer,
    takeHome,
    annualEquity,
    equityTaxRate,
    firstYearNet:
      takeHome.annualInHand + extras - Math.max(0, taxOnBoth),
    steadyStateNet,
    deltaMonthlyInHand: 0,
    deltaFirstYearNet: 0,
  };
}

/**
 * Evaluates a set of offers and fills in each one's gap to the baseline - the
 * first in the list, which the UI keeps as the current job.
 */
export function compareOffers(
  offers: OfferInput[],
  carried: CarriedDeductions
): OfferResult[] {
  const results = offers.map((offer) => evaluateOffer(offer, carried));
  const baseline = results[0];
  if (!baseline) return results;

  return results.map((result) => ({
    ...result,
    deltaMonthlyInHand:
      result.takeHome.monthlyInHand - baseline.takeHome.monthlyInHand,
    deltaFirstYearNet: result.firstYearNet - baseline.firstYearNet,
  }));
}
