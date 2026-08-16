/**
 * Rules for the payments that fall due when employment ends, other than
 * gratuity - which has its own file.
 */

/**
 * Section 10(10AA)(ii) ceiling for non-government employees, raised from
 * Rs 3,00,000 by notification 31/2023 with effect from 1 April 2023. It is a
 * lifetime aggregate across every employer, not a fresh allowance per job.
 */
export const LEAVE_ENCASHMENT_CEILING = 2500000;

/** The averaging window and the leave the statute will count, per year served. */
export const LEAVE_AVERAGING_MONTHS = 10;
export const LEAVE_DAYS_PER_YEAR_LIMIT = 30;

/** Days in the month the statute uses to convert a monthly salary to a daily one. */
export const DAYS_IN_MONTH_FOR_LEAVE = 30;
