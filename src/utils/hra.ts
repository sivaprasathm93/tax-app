import { HRA_SALARY_PERCENT } from "../constants/taxRules";
import { CityType, HraResult, RentDetails, RentReceipt } from "../types";

/**
 * Rent above this in a year obliges the employee to report the landlord's PAN
 * to the employer - Circular 8/2013. Without it the employer must refuse the
 * exemption however genuine the rent is, which is what turns a missing PAN
 * into a January emergency.
 */
export const LANDLORD_PAN_THRESHOLD = 100000;

const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

/** The fifth character of a PAN encodes the holder type; "P" is an individual. */
export function isValidPan(value: string): boolean {
  return PAN_PATTERN.test(value.trim().toUpperCase());
}

/**
 * The three limbs of section 10(13A) read with Rule 2A, and which one bound
 * the answer. Naming the binding limb is the point: an employee whose
 * exemption is capped by rent paid can fix it by declaring rent honestly,
 * while one capped by 50% of basic cannot fix it at all without restructuring.
 */
export function computeHraDetail(
  hraReceived: number,
  rentPaid: number,
  basicSalary: number,
  cityType: CityType
): HraResult {
  const hra = Math.max(0, hraReceived);
  const rent = Math.max(0, rentPaid);
  const salary = Math.max(0, basicSalary);
  const percent = HRA_SALARY_PERCENT[cityType];

  const rentLessTenPercent = Math.max(0, rent - salary * 0.1);
  const percentOfSalary = (salary * percent) / 100;

  const limbs: { key: HraResult["limitedBy"]; value: number }[] = [
    { key: "hra", value: hra },
    { key: "rent", value: rentLessTenPercent },
    { key: "salary", value: percentOfSalary },
  ];

  const exemption =
    hra > 0 && rent > 0 && salary > 0
      ? Math.max(0, Math.min(hra, rentLessTenPercent, percentOfSalary))
      : 0;

  const binding =
    exemption > 0
      ? (limbs.reduce((lowest, item) =>
          item.value < lowest.value ? item : lowest
        ).key as HraResult["limitedBy"])
      : "none";

  return {
    actualHra: hra,
    rentLessTenPercent,
    percentOfSalary,
    exemption,
    limitedBy: binding,
    taxable: Math.max(0, hra - exemption),
    panRequired: rent > LANDLORD_PAN_THRESHOLD,
  };
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Parses "2026-04" into its year and zero-based month. */
function parseMonth(value: string): { year: number; month: number } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return null;
  const month = Number(match[2]) - 1;
  if (month < 0 || month > 11) return null;
  return { year: Number(match[1]), month };
}

function monthLabel(year: number, month: number): string {
  return `${MONTH_NAMES[month]} ${year}`;
}

/** Last day of the month, which is when a receipt for that month is dated. */
function endOfMonth(year: number, month: number): string {
  const last = new Date(year, month + 1, 0);
  return last.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Splits a tenancy into the receipts an HR portal will accept.
 *
 * Quarterly receipts are offered because most employers accept them and four
 * signatures are easier to get from a landlord than twelve - but the period
 * has to be stated on the face of the receipt, or it reads as a single
 * month's rent at three times the rate.
 */
export function buildReceipts(details: RentDetails): RentReceipt[] {
  const start = parseMonth(details.fromMonth);
  const rent = Math.max(0, details.monthlyRent);
  const months = Math.max(0, Math.min(details.months, 36));
  if (!start || rent <= 0 || months <= 0) return [];

  const step = details.frequency === "quarterly" ? 3 : 1;
  const receipts: RentReceipt[] = [];

  for (let offset = 0; offset < months; offset += step) {
    const span = Math.min(step, months - offset);
    const from = new Date(start.year, start.month + offset, 1);
    const to = new Date(start.year, start.month + offset + span - 1, 1);

    const period =
      span === 1
        ? monthLabel(from.getFullYear(), from.getMonth())
        : `${MONTH_NAMES[from.getMonth()]}${
            from.getFullYear() === to.getFullYear()
              ? ""
              : ` ${from.getFullYear()}`
          } – ${monthLabel(to.getFullYear(), to.getMonth())}`;

    receipts.push({
      index: receipts.length + 1,
      period,
      amount: rent * span,
      issuedOn: endOfMonth(to.getFullYear(), to.getMonth()),
    });
  }

  return receipts;
}

/** Total rent the receipts add up to - the figure that has to match the declaration. */
export function receiptsTotal(receipts: RentReceipt[]): number {
  return receipts.reduce((total, item) => total + item.amount, 0);
}
