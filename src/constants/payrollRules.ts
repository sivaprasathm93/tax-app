/**
 * Payroll rules behind the CTC-to-in-hand decomposition.
 *
 * These are the deductions that turn a headline CTC into a bank credit:
 * provident fund under the EPF & MP Act, 1952, professional tax levied by the
 * states under Article 276, and the employer-side provisions that sit inside
 * CTC but never reach the payslip.
 */

/* ── Provident fund ─────────────────────────────────────────────────────── */

/** Employee and employer each contribute 12% of wages. */
export const PF_RATE = 12;

/**
 * The statutory wage ceiling for PF. Employers may either cap contributions
 * here - Rs 1,800 a month each side - or run PF on full basic, which raises
 * the retirement corpus and lowers take-home. Both are lawful; which one is in
 * force is an employer policy, so the calculator asks.
 */
export const PF_WAGE_CEILING = 15000;

/**
 * The employer's 12% splits: 8.33% to the Employees' Pension Scheme, the rest
 * to the provident fund proper. EPS is always computed on the ceiling wage, so
 * it is frozen at Rs 1,250 a month however large the basic.
 */
export const EPS_RATE = 8.33;
/** 8.33% of the ceiling wage is Rs 1,249.50; the EPFO rounds it to Rs 1,250. */
export const EPS_MONTHLY_CAP = Math.round((PF_WAGE_CEILING * EPS_RATE) / 100);

/** EPF interest declared for the year, credited annually. */
export const EPF_INTEREST_RATE = 8.25;

/**
 * Finance Act 2021. Interest on employee contributions above this in a year is
 * taxable as income from other sources, and the EPFO maintains a separate
 * taxable sub-account for the excess. The threshold rises to Rs 5,00,000 where
 * the employer makes no contribution at all.
 */
export const PF_TAXABLE_CONTRIBUTION_THRESHOLD = 250000;
export const PF_TAXABLE_THRESHOLD_NO_EMPLOYER = 500000;

/**
 * Employer gratuity provision carried in CTC. 15/26 of a month's basic per
 * year of service works out at 4.81% - it is an accrual, not something the
 * employee can draw before five years.
 */
export const GRATUITY_PROVISION_PERCENT = 4.81;

/* ── Professional tax ───────────────────────────────────────────────────── */

export interface PtSlab {
  /** Inclusive upper bound of monthly gross; null means "and above". */
  upTo: number | null;
  monthly: number;
}

export interface PtState {
  id: string;
  label: string;
  slabs: PtSlab[];
  /**
   * Extra levied in one month of the year, so the annual total lands on the
   * Rs 2,500 constitutional cap rather than 12 equal instalments.
   */
  annualTopUp: number;
  note: string;
}

/**
 * Article 276(2) of the Constitution caps professional tax at Rs 2,500 a year
 * per person, whatever a state legislates - which is why every schedule below
 * converges on the same annual figure at the top.
 */
export const PT_ANNUAL_CAP = 2500;

/**
 * State schedules, keyed on monthly gross salary. Union territories and the
 * states that levy no professional tax at all - Delhi, Haryana, Uttar Pradesh,
 * Rajasthan, Uttarakhand, Himachal Pradesh, Goa, Chandigarh - share the "none"
 * entry, since for the employee the effect is identical.
 */
export const PT_STATES: PtState[] = [
  {
    id: "none",
    label: "No professional tax (Delhi, Haryana, UP, Rajasthan, Goa…)",
    slabs: [{ upTo: null, monthly: 0 }],
    annualTopUp: 0,
    note: "These states and union territories levy no professional tax.",
  },
  {
    id: "karnataka",
    label: "Karnataka",
    slabs: [
      { upTo: 24999, monthly: 0 },
      { upTo: null, monthly: 200 },
    ],
    annualTopUp: 0,
    note: "Rs 200 a month once monthly salary crosses Rs 25,000.",
  },
  {
    id: "maharashtra",
    label: "Maharashtra",
    slabs: [
      { upTo: 7500, monthly: 0 },
      { upTo: 10000, monthly: 175 },
      { upTo: null, monthly: 200 },
    ],
    annualTopUp: 100,
    note: "Rs 200 a month, and Rs 300 in February to reach the Rs 2,500 cap.",
  },
  {
    id: "tamilNadu",
    label: "Tamil Nadu",
    slabs: [
      { upTo: 21000, monthly: 0 },
      { upTo: 30000, monthly: 135 },
      { upTo: 45000, monthly: 315 },
      { upTo: 60000, monthly: 690 },
      { upTo: 75000, monthly: 1025 },
      { upTo: null, monthly: 1250 },
    ],
    annualTopUp: 0,
    note: "Levied half-yearly by the local body; shown here as the monthly equivalent.",
  },
  {
    id: "telangana",
    label: "Telangana",
    slabs: [
      { upTo: 15000, monthly: 0 },
      { upTo: 20000, monthly: 150 },
      { upTo: null, monthly: 200 },
    ],
    annualTopUp: 0,
    note: "Rs 200 a month above Rs 20,000 of monthly salary.",
  },
  {
    id: "andhraPradesh",
    label: "Andhra Pradesh",
    slabs: [
      { upTo: 15000, monthly: 0 },
      { upTo: 20000, monthly: 150 },
      { upTo: null, monthly: 200 },
    ],
    annualTopUp: 0,
    note: "Rs 200 a month above Rs 20,000 of monthly salary.",
  },
  {
    id: "westBengal",
    label: "West Bengal",
    slabs: [
      { upTo: 10000, monthly: 0 },
      { upTo: 15000, monthly: 110 },
      { upTo: 25000, monthly: 130 },
      { upTo: 40000, monthly: 150 },
      { upTo: null, monthly: 200 },
    ],
    annualTopUp: 0,
    note: "Rs 200 a month above Rs 40,000 of monthly salary.",
  },
  {
    id: "gujarat",
    label: "Gujarat",
    slabs: [
      { upTo: 11999, monthly: 0 },
      { upTo: null, monthly: 200 },
    ],
    annualTopUp: 0,
    note: "Rs 200 a month once monthly salary crosses Rs 12,000.",
  },
  {
    id: "kerala",
    label: "Kerala",
    slabs: [
      { upTo: 11999, monthly: 0 },
      { upTo: 17499, monthly: 150 },
      { upTo: 20833, monthly: 180 },
      { upTo: null, monthly: 208 },
    ],
    annualTopUp: 4,
    note: "Levied half-yearly by the panchayat or municipality.",
  },
  {
    id: "madhyaPradesh",
    label: "Madhya Pradesh",
    slabs: [
      { upTo: 18750, monthly: 0 },
      { upTo: 25000, monthly: 125 },
      { upTo: 33333, monthly: 167 },
      { upTo: null, monthly: 208 },
    ],
    annualTopUp: 4,
    note: "Rs 208 a month, and Rs 212 in the last month of the year.",
  },
  {
    id: "odisha",
    label: "Odisha",
    slabs: [
      { upTo: 13304, monthly: 0 },
      { upTo: 25000, monthly: 125 },
      { upTo: null, monthly: 200 },
    ],
    annualTopUp: 100,
    note: "Rs 200 a month, with the balance of the Rs 2,500 cap in the final month.",
  },
  {
    id: "assam",
    label: "Assam",
    slabs: [
      { upTo: 10000, monthly: 0 },
      { upTo: 15000, monthly: 150 },
      { upTo: 25000, monthly: 180 },
      { upTo: null, monthly: 208 },
    ],
    annualTopUp: 4,
    note: "Rs 208 a month above Rs 25,000 of monthly salary.",
  },
  {
    id: "bihar",
    label: "Bihar",
    slabs: [
      { upTo: 25000, monthly: 0 },
      { upTo: 41666, monthly: 83 },
      { upTo: 83333, monthly: 166 },
      { upTo: null, monthly: 208 },
    ],
    annualTopUp: 4,
    note: "Assessed annually; shown here as the monthly equivalent.",
  },
  {
    id: "jharkhand",
    label: "Jharkhand",
    slabs: [
      { upTo: 25000, monthly: 0 },
      { upTo: 41666, monthly: 100 },
      { upTo: 66666, monthly: 150 },
      { upTo: 83333, monthly: 175 },
      { upTo: null, monthly: 208 },
    ],
    annualTopUp: 4,
    note: "Assessed annually; shown here as the monthly equivalent.",
  },
  {
    id: "punjab",
    label: "Punjab",
    slabs: [
      { upTo: 20833, monthly: 0 },
      { upTo: null, monthly: 200 },
    ],
    annualTopUp: 0,
    note: "Rs 200 a month for salaried taxpayers above the income tax threshold.",
  },
];

/** Professional tax for a month, from the schedule of the chosen state. */
export function monthlyProfessionalTax(
  stateId: string,
  monthlyGross: number
): number {
  const state = PT_STATES.find((item) => item.id === stateId) ?? PT_STATES[0];
  for (const slab of state.slabs) {
    if (slab.upTo === null || monthlyGross <= slab.upTo) return slab.monthly;
  }
  return 0;
}

/**
 * Professional tax for the year, including the top-up month and trimmed to the
 * Article 276 ceiling. Section 16(iii) allows this as a deduction, but only
 * under the old regime.
 */
export function annualProfessionalTax(
  stateId: string,
  monthlyGross: number
): number {
  const state = PT_STATES.find((item) => item.id === stateId) ?? PT_STATES[0];
  const monthly = monthlyProfessionalTax(stateId, monthlyGross);
  if (monthly <= 0) return 0;
  return Math.min(monthly * 12 + state.annualTopUp, PT_ANNUAL_CAP);
}

/* ── Structure defaults ─────────────────────────────────────────────────── */

/**
 * What a typical Indian offer letter looks like, used to seed the form. Basic
 * at 40% of CTC and HRA at half of that is the most common shape; the new
 * labour codes push the first figure towards 50%.
 */
export const STRUCTURE_DEFAULTS = {
  basicPercent: 40,
  hraPercent: 50,
  variablePercent: 0,
  variablePayout: 100,
  vpfPercent: 0,
  employerNpsPercent: 0,
} as const;

/**
 * The wage floor in the Code on Social Security, 2020. Basic below half of
 * total remuneration understates PF and gratuity, and the codes now disallow
 * it - so a structure under this figure is flagged rather than silently used.
 */
export const WAGE_FLOOR_PERCENT = 50;

export const MONTHS_PER_YEAR = 12;
