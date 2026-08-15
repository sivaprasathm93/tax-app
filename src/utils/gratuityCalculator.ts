import {
  AVERAGING_MONTHS,
  DAYS_PER_YEAR,
  FIXED_TERM_MINIMUM_YEARS,
  GRATUITY_CEILING,
  MINIMUM_YEARS,
  MONTH_DIVISOR,
  TAX_EXEMPTION_LIMIT,
  WAGE_FLOOR_PERCENT,
} from "../constants/gratuityRules";
import { GratuityInput, GratuityResult, ServiceDuration } from "../types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Parses yyyy-mm-dd as a local date, avoiding the UTC shift `new Date(str)` applies. */
export function parseDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  // Rejects impossible dates like 2026-02-31, which Date would roll forward.
  return date.getMonth() === Number(month) - 1 ? date : null;
}

/**
 * Adds whole months, clamping the day to the target month's length: 31 Jan plus
 * one month is 28 Feb, not 3 March. This is also how a 29 February anniversary
 * is read in a non-leap year - as 28 February.
 */
function addMonths(date: Date, monthsToAdd: number): Date {
  const target = new Date(date.getFullYear(), date.getMonth() + monthsToAdd, 1);
  const daysInTarget = new Date(
    target.getFullYear(),
    target.getMonth() + 1,
    0
  ).getDate();
  target.setDate(Math.min(date.getDate(), daysInTarget));
  return target;
}

/**
 * Calendar difference between joining and exit, as years/months/days rather
 * than a decimal - the statute counts whole years and a part "in excess of six
 * months", so the month component has to survive intact.
 *
 * Works by walking forward from the joining date rather than subtracting each
 * component separately: a naive subtract-and-borrow goes negative whenever the
 * joining day-of-month is longer than the month before the exit date (joining
 * on the 31st and leaving on 1 March being the case that breaks it).
 */
export function serviceDuration(from: Date, to: Date): ServiceDuration {
  let years = to.getFullYear() - from.getFullYear();
  let months = to.getMonth() - from.getMonth();
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  // If that lands past the exit date, we counted one month too many.
  if (addMonths(from, years * 12 + months) > to) {
    months -= 1;
    if (months < 0) {
      years -= 1;
      months += 12;
    }
  }

  const anchor = addMonths(from, years * 12 + months);
  const days = Math.round((to.getTime() - anchor.getTime()) / MS_PER_DAY);

  return {
    years,
    months,
    days,
    totalDays: Math.round((to.getTime() - from.getTime()) / MS_PER_DAY),
  };
}

/**
 * Years fed into the formula.
 *
 * Employers under the statute round a trailing part-year up once it exceeds six
 * months (s.4(2)). Outside the statute, section 10(10)(iii) speaks only of
 * "completed years", so the remainder is dropped however close it lands.
 */
export function qualifyingYears(
  service: ServiceDuration,
  coverage: GratuityInput["coverage"]
): { years: number; roundedUp: boolean } {
  if (coverage === "notCovered") {
    return { years: Math.max(0, service.years), roundedUp: false };
  }
  const excessOverSixMonths =
    service.months > 6 || (service.months === 6 && service.days > 0);
  return {
    years: Math.max(0, service.years + (excessOverSixMonths ? 1 : 0)),
    roundedUp: excessOverSixMonths,
  };
}

/**
 * The wage the formula runs on. Under the new codes wages must be at least half
 * of total remuneration, so a salary built on a thin basic gets lifted to that
 * floor before gratuity is worked out.
 */
export function wageBase(
  monthlyWage: number,
  monthlyCtc: number
): { wage: number; floorApplied: boolean } {
  const declared = Math.max(0, monthlyWage);
  const floor = Math.max(0, monthlyCtc) * (WAGE_FLOOR_PERCENT / 100);
  return floor > declared
    ? { wage: floor, floorApplied: true }
    : { wage: declared, floorApplied: false };
}

export function calculateGratuity(input: GratuityInput): GratuityResult | null {
  const from = parseDate(input.joiningDate);
  const to = parseDate(input.exitDate);
  if (!from || !to || to <= from) return null;

  const service = serviceDuration(from, to);
  const { years, roundedUp } = qualifyingYears(service, input.coverage);
  const { wage, floorApplied } = wageBase(input.monthlyWage, input.monthlyCtc);

  // Death or disablement removes the qualifying-service bar entirely.
  const waived = input.exitReason === "deathOrDisablement";
  const minimumYears =
    input.employmentKind === "fixedTerm"
      ? FIXED_TERM_MINIMUM_YEARS
      : MINIMUM_YEARS;
  const eligible = waived || service.years >= minimumYears;

  const divisor = MONTH_DIVISOR[input.coverage];
  const rawAmount = eligible ? (wage * DAYS_PER_YEAR * years) / divisor : 0;

  const formulaAmount = Math.round(rawAmount);
  const entitlement = Math.min(formulaAmount, GRATUITY_CEILING);
  const amountReceived =
    input.amountReceived > 0 ? input.amountReceived : entitlement;

  // Section 10(10): government service is exempt without limit. Everyone else
  // gets the least of what was received, the statutory formula, and the
  // lifetime ceiling - anything paid above that is taxable salary.
  const fullyExempt = input.employerKind === "government";
  const exemptAmount = fullyExempt
    ? amountReceived
    : Math.min(amountReceived, formulaAmount, TAX_EXEMPTION_LIMIT);

  return {
    service,
    qualifyingYears: years,
    roundedUp,
    eligible,
    minimumYears,
    ineligibleReason: eligible
      ? undefined
      : `${minimumYears} ${minimumYears === 1 ? "year" : "years"} of continuous service is the minimum; this record shows ${service.years}.`,
    wageBase: wage,
    wageFloorApplied: floorApplied,
    formulaAmount,
    cappedByCeiling: formulaAmount > GRATUITY_CEILING,
    entitlement,
    amountReceived,
    exemptAmount,
    taxableAmount: Math.max(0, amountReceived - exemptAmount),
    fullyExempt,
  };
}

/** Human-readable formula, so the result never looks like a black box. */
export function formulaText(input: GratuityInput): string {
  const divisor = MONTH_DIVISOR[input.coverage];
  const wageLabel =
    input.coverage === "covered"
      ? "last drawn basic + DA"
      : `average basic + DA of the last ${AVERAGING_MONTHS} months`;
  return `(${wageLabel} × ${DAYS_PER_YEAR} × completed years) ÷ ${divisor}`;
}
