/**
 * Gratuity rules as they stand for FY 2026-27.
 *
 * Gratuity now sits under the Code on Social Security, 2020, which took effect
 * on 21 November 2025 and subsumed the Payment of Gratuity Act, 1972. The
 * arithmetic of the formula did not change; what changed is who qualifies and
 * what counts as "wages" - see WAGE_FLOOR_PERCENT and FIXED_TERM_MINIMUM_YEARS.
 */

/** Days of wages earned per completed year of service. */
export const DAYS_PER_YEAR = 15;

/**
 * Divisors differ by whether the employer is covered by the gratuity statute.
 * 26 treats a month as its working days only (Sundays excluded); employers
 * outside the statute use a plain 30-day month, which pays out less.
 */
export const MONTH_DIVISOR = {
  covered: 26,
  notCovered: 30,
} as const;

/**
 * Continuous service needed before gratuity is payable. The new codes cut this
 * to a single year for fixed-term employees - the headline eligibility change.
 */
export const MINIMUM_YEARS = 5;
export const FIXED_TERM_MINIMUM_YEARS = 1;

/** The five-year qualification is waived where service ends in death or disablement. */
export const WAIVED_ON_DEATH_OR_DISABLEMENT = true;

/** Statutory ceiling on the payout, and the lifetime cap on the tax exemption. */
export const GRATUITY_CEILING = 2000000;

/**
 * Section 10(10) exemption ceiling for non-government employees. It is a
 * lifetime aggregate across employers, not a per-payout allowance.
 */
export const TAX_EXEMPTION_LIMIT = 2000000;

/**
 * The new codes require "wages" (basic + DA + retaining allowance) to be at
 * least half of total remuneration. Where a salary was structured with a thin
 * basic to suppress statutory costs, the gratuity wage base is lifted to this
 * floor - which is why many payouts rise under the new regime.
 */
export const WAGE_FLOOR_PERCENT = 50;

/** Employers must settle gratuity within this many days of it falling due. */
export const PAYMENT_WINDOW_DAYS = 30;

/** Non-covered employees are paid on the average of this many months' salary. */
export const AVERAGING_MONTHS = 10;

export const CODE_EFFECTIVE_FROM = "21 November 2025";
