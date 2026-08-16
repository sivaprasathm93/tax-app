import {
  DAYS_IN_MONTH_FOR_LEAVE,
  LEAVE_AVERAGING_MONTHS,
  LEAVE_DAYS_PER_YEAR_LIMIT,
  LEAVE_ENCASHMENT_CEILING,
} from "../constants/separationRules";
import {
  LeaveEncashmentInput,
  LeaveEncashmentLimb,
  LeaveEncashmentResult,
} from "../types";

/**
 * Section 10(10AA) for private-sector employees.
 *
 * The exemption is the least of four limbs, and the third is the one that
 * catches people out: however generous an employer's own leave policy is, the
 * statute counts a maximum of 30 days' leave per completed year of service.
 * An employee who accumulated 45 days a year for a decade is credited with
 * 300 days, not 450.
 *
 * Government employees are exempt without limit under section 10(10AA)(i).
 */
export function calculateLeaveEncashment(
  input: LeaveEncashmentInput
): LeaveEncashmentResult {
  const monthly = Math.max(0, input.monthlySalary);
  const years = Math.max(0, Math.floor(input.yearsOfService));
  const daysEncashed = Math.max(0, input.leaveDaysEncashed);
  const perDaySalary = monthly / DAYS_IN_MONTH_FOR_LEAVE;

  const received =
    input.amountReceived > 0 ? input.amountReceived : perDaySalary * daysEncashed;

  if (input.employerKind === "government") {
    return {
      perDaySalary,
      eligibleDays: daysEncashed,
      limbs: [
        {
          label: "Government service",
          amount: received,
          note: "Sec 10(10AA)(i) - exempt without any monetary ceiling",
        },
      ],
      exempt: received,
      taxable: 0,
      fullyExempt: true,
      boundBy: "Government service",
    };
  }

  // Limb 3: leave standing to credit, but never more than 30 days a year.
  const statutoryDays = years * LEAVE_DAYS_PER_YEAR_LIMIT;
  const eligibleDays = Math.min(daysEncashed, statutoryDays);

  // The lifetime ceiling is reduced by whatever earlier employers already
  // sheltered, so a second encashment rarely gets the full Rs 25 lakh.
  const remainingCeiling = Math.max(
    0,
    LEAVE_ENCASHMENT_CEILING - Math.max(0, input.previouslyExempted)
  );

  const limbs: LeaveEncashmentLimb[] = [
    {
      label: "Amount actually received",
      amount: received,
    },
    {
      label: `Average salary for ${LEAVE_AVERAGING_MONTHS} months`,
      amount: monthly * LEAVE_AVERAGING_MONTHS,
      note: "Basic + DA, averaged over the last ten months",
    },
    {
      label: "Leave the statute will count",
      amount: perDaySalary * eligibleDays,
      note: `${eligibleDays} days — capped at ${LEAVE_DAYS_PER_YEAR_LIMIT} a year for ${years} ${years === 1 ? "year" : "years"}`,
    },
    {
      label: "Statutory ceiling",
      amount: remainingCeiling,
      note:
        input.previouslyExempted > 0
          ? "Rs 25,00,000 lifetime, less what earlier employers exempted"
          : "Rs 25,00,000, a lifetime aggregate across employers",
    },
  ];

  const lowest = limbs.reduce((least, limb) =>
    limb.amount < least.amount ? limb : least
  );
  const exempt = Math.max(0, Math.min(lowest.amount, received));

  return {
    perDaySalary,
    eligibleDays,
    limbs,
    exempt,
    taxable: Math.max(0, received - exempt),
    fullyExempt: received > 0 && exempt >= received,
    boundBy: lowest.label,
  };
}
