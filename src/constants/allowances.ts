import { AllowanceOption } from "../types";
import { MEAL_VOUCHER } from "./taxRules";

/**
 * The flexible benefit components an employee can ask payroll to carve out of
 * special allowance.
 *
 * Every one of these is a reimbursement or a voucher, not a cash allowance -
 * that distinction is the whole game. A "telephone allowance" paid in cash is
 * fully taxable salary; the same money reimbursed against a bill is not a
 * perquisite at all. Restructuring works because the employee moves money from
 * the first column to the second, at no cost to the employer.
 */
export const ALLOWANCE_OPTIONS: AllowanceOption[] = [
  {
    id: "mealVouchers",
    label: "Meal card / food vouchers",
    requirement:
      "Non-transferable card usable only for food and non-alcoholic drinks. Cash meal allowance does not qualify.",
    authority: "Rule 15(5)(a)",
    annualCap: MEAL_VOUCHER.annualCap,
    bothRegimes: true,
    suggested: MEAL_VOUCHER.annualCap,
  },
  {
    id: "telephone",
    label: "Telephone & broadband",
    requirement:
      "Reimbursed against bills in your name, for connections used for official work.",
    authority: "Rule 3(7)(ix)",
    annualCap: null,
    bothRegimes: true,
    suggested: 36000,
  },
  {
    id: "books",
    label: "Books & periodicals",
    requirement:
      "Bills for professional books, journals and subscriptions relevant to your role.",
    authority: "Rule 3(7)(ix)",
    annualCap: null,
    bothRegimes: true,
    suggested: 24000,
  },
  {
    id: "employerNps",
    label: "Employer NPS contribution",
    requirement:
      "Employer routes part of your CTC into your NPS Tier-I account. Locked until 60, which is the trade-off.",
    authority: "Sec 80CCD(2)",
    annualCap: null,
    bothRegimes: true,
    suggested: 0,
  },
  {
    id: "fuelAndDriver",
    label: "Car lease, fuel & driver",
    requirement:
      "Employer-leased car used partly for official duty. Taxed on a fixed monthly figure rather than on what it costs, so most of the spend never becomes salary.",
    authority: "Rule 3(7)(vii)",
    annualCap: null,
    // A valuation rule, not an exemption - section 115BAC leaves it alone.
    bothRegimes: true,
    suggested: 600000,
  },
  {
    id: "lta",
    label: "Leave travel concession",
    requirement:
      "Actual travel cost within India for you and your family, twice in a block of four years. Old regime only.",
    authority: "Sec 10(5)",
    annualCap: null,
    bothRegimes: false,
    suggested: 60000,
  },
];

/**
 * Section 80CCD(2) ceilings. The new regime is the more generous of the two
 * here, which is unusual - it is the one deduction worth restructuring for
 * even after moving off the old regime.
 */
export const EMPLOYER_NPS_CEILING = { new: 14, old: 10 } as const;

/**
 * Motor car perquisite - Rule 3(7)(vii).
 *
 * This one is not an exemption but a valuation rule, and that is precisely why
 * it is worth so much. Where the employer owns or leases the car and meets the
 * running costs, the employee is taxed on a fixed monthly figure rather than
 * on what the arrangement actually costs. An employer spending Rs 8 lakh a
 * year on lease, fuel, insurance and a driver creates a taxable perquisite of
 * Rs 39,600 - the other Rs 7.6 lakh is simply not salary.
 *
 * Because it is a valuation rule and not an exemption, section 115BAC does not
 * withdraw it: unlike LTA, it survives under the new regime.
 */
export const CAR_PERQUISITE = {
  /** Engine capacity threshold, in litres, that separates the two bands. */
  engineThresholdLitres: 1.6,
  smallEngineMonthly: 1800,
  largeEngineMonthly: 2400,
  /** Added where the employer also provides a driver. */
  driverMonthly: 900,
} as const;

/**
 * The taxable perquisite for a year of employer-provided car and driver.
 * Fixed by the rule, so it does not move with what the car actually costs.
 */
export function carPerquisiteValue(
  largeEngine: boolean,
  withDriver: boolean
): number {
  const car = largeEngine
    ? CAR_PERQUISITE.largeEngineMonthly
    : CAR_PERQUISITE.smallEngineMonthly;
  const driver = withDriver ? CAR_PERQUISITE.driverMonthly : 0;
  return (car + driver) * 12;
}
