import {
  HOLDING_MONTHS,
  LTCG_EXEMPTION,
  LTCG_RATE,
  SECTION_112A_APPLIES,
  STCG_RATE,
} from "../constants/equityRules";
import { EquityInput, EquityResult } from "../types";
import { parseDate } from "./gratuityCalculator";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Whole months between two dates, counted the way a holding period is: the
 * anniversary must actually have passed, so 23 months and 29 days is still
 * short-term.
 */
function monthsBetween(from: Date, to: Date): number {
  let months = (to.getFullYear() - from.getFullYear()) * 12;
  months += to.getMonth() - from.getMonth();
  if (to.getDate() < from.getDate()) months -= 1;
  return months;
}

/**
 * Two-stage taxation of employee equity.
 *
 * The confusion this resolves is that a vested RSU is taxed twice, on two
 * different bases, and the second base is not what the employee paid.
 *
 *   Stage 1, on vesting or exercise: the spread between fair market value and
 *   whatever the employee paid is salary. It is taxed at slab rates and the
 *   employer withholds on it, usually by selling some of the shares.
 *
 *   Stage 2, on sale: the gain over the FMV already taxed at stage 1 - not
 *   over the exercise price. Getting this wrong means paying tax twice on the
 *   same rupee, which is the single most common error on an ITR carrying RSUs.
 *
 * Both legs convert at the Rule 115 TT buying rate for their own relevant
 * date, which is why the rate is an input rather than a constant.
 */
export function calculateEquity(input: EquityInput): EquityResult {
  const fx = input.fxRate > 0 ? input.fxRate : 1;
  const shares = Math.max(0, input.shares);

  const fmvInr = Math.max(0, input.fmvOnVest) * fx;
  const exercisePriceInr = Math.max(0, input.exercisePrice) * fx;
  const salePriceInr = Math.max(0, input.salePrice) * fx;

  /* ── Stage 1: perquisite on vesting or exercise ── */

  const perquisite = Math.max(0, (fmvInr - exercisePriceInr) * shares);
  const perquisiteTax = (perquisite * Math.max(0, input.marginalRate)) / 100;

  // Sell-to-cover is valued at the vesting FMV, which is what the broker sells
  // at. A shortfall here lands on the employee as a payroll recovery.
  const sellToCoverShares = Math.min(
    Math.max(0, input.sellToCoverShares),
    shares
  );
  const sellToCoverValue = sellToCoverShares * fmvInr;
  const tdsShortfall = Math.max(0, perquisiteTax - sellToCoverValue);
  const netSharesRetained = shares - sellToCoverShares;

  /* ── Stage 2: capital gain on sale ── */

  const vest = parseDate(input.vestDate);
  const sale = parseDate(input.saleDate);
  const sold = salePriceInr > 0 && sale !== null && vest !== null && sale > vest;

  const holdingDays = sold
    ? Math.round((sale.getTime() - vest.getTime()) / MS_PER_DAY)
    : 0;
  const holdingMonths = sold ? monthsBetween(vest, sale) : 0;
  const holdingMonthsRequired = HOLDING_MONTHS[input.listing];
  const isLongTerm = sold && holdingMonths >= holdingMonthsRequired;

  // The cost base is the FMV already taxed as salary, not the exercise price.
  const capitalGain = sold ? (salePriceInr - fmvInr) * netSharesRetained : 0;

  const under112A = SECTION_112A_APPLIES[input.listing];
  const exemptGain =
    isLongTerm && under112A && capitalGain > 0
      ? Math.min(capitalGain, LTCG_EXEMPTION)
      : 0;

  const taxableGain = Math.max(0, capitalGain - exemptGain);

  // Short-term gains on foreign or unlisted shares fall outside section 111A,
  // so they are charged at the employee's own slab rate, not the flat 20%.
  const capitalGainsRate = !sold
    ? 0
    : isLongTerm
      ? LTCG_RATE
      : under112A
        ? STCG_RATE
        : Math.max(0, input.marginalRate);

  const capitalGainsTax = (taxableGain * capitalGainsRate) / 100;

  const proceeds = sold ? salePriceInr * netSharesRetained : 0;

  return {
    fmvInr,
    exercisePriceInr,
    salePriceInr,
    perquisite,
    perquisiteTax,
    sellToCoverValue,
    tdsShortfall,
    netSharesRetained,
    sold,
    holdingDays,
    holdingMonthsRequired,
    isLongTerm,
    capitalGain,
    exemptGain,
    taxableGain,
    capitalGainsRate,
    capitalGainsTax,
    totalTax: perquisiteTax + capitalGainsTax,
    netProceeds: proceeds - capitalGainsTax,
  };
}

/** Days still to run before the holding turns long-term. */
export function daysToLongTerm(result: EquityResult): number {
  if (!result.sold || result.isLongTerm) return 0;
  // Approximate: the exact date depends on the calendar, but the number is
  // only ever used to answer "is it worth waiting".
  return Math.max(0, result.holdingMonthsRequired * 30 - result.holdingDays);
}
