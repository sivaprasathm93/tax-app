import {
  EPS_MONTHLY_CAP,
  EPS_RATE,
  GRATUITY_PROVISION_PERCENT,
  MONTHS_PER_YEAR,
  PF_RATE,
  PF_WAGE_CEILING,
  annualProfessionalTax,
} from "../constants/payrollRules";
import { MEAL_VOUCHER } from "../constants/taxRules";
import {
  AgeGroup,
  CityType,
  PayLine,
  PfBasis,
  Regime,
  TakeHomeInput,
  TakeHomeResult,
  TaxInput,
} from "../types";
import { calculateTax, calculateTaxComparison } from "./taxCalculator";

/** Old-regime reliefs carry over from the income tax form, so both tools agree. */
export interface CarriedDeductions {
  ageGroup: AgeGroup;
  cityType: CityType;
  rentPaid: number;
  section80C: number;
  section80CCD1B: number;
  section80D: number;
  section24B: number;
  savingsInterest: number;
  lta: number;
  /** Annual cost of an employer car scheme, and the perquisite it attracts. */
  carLease: number;
  carPerquisite: number;
}

/**
 * Pulls the reliefs a salary calculation has to carry over out of the income
 * tax form. Every tool that prices a salary needs exactly this subset, and
 * three of them were assembling it by hand - which is how one of them ends up
 * quietly missing a field the others have.
 */
export function carriedDeductions(input: TaxInput): CarriedDeductions {
  return {
    ageGroup: input.ageGroup,
    cityType: input.cityType,
    rentPaid: input.rentPaid,
    section80C: input.section80C,
    section80CCD1B: input.section80CCD1B,
    section80D: input.section80D,
    section24B: input.section24B,
    savingsInterest: input.savingsInterest,
    lta: input.lta,
    carLease: input.carLease,
    carPerquisite: input.carPerquisite,
  };
}

function pct(amount: number, percent: number): number {
  return (Math.max(0, amount) * Math.max(0, percent)) / 100;
}

/**
 * Monthly wage the provident fund runs on. Employers either cap it at the
 * statutory ceiling - Rs 1,800 a month each side - or run it on full basic.
 * Both are lawful and the choice materially changes take-home, which is why
 * it is a question and not an assumption.
 */
function pfWage(monthlyBasic: number, basis: PfBasis): number {
  return basis === "ceiling"
    ? Math.min(monthlyBasic, PF_WAGE_CEILING)
    : monthlyBasic;
}

/**
 * The employer's 12%, split between the pension scheme and the fund. EPS is
 * always computed on the ceiling wage, so it freezes at Rs 1,250 a month
 * however large the basic - the rest of the 12% goes to EPF.
 */
export function splitEmployerPf(
  monthlyBasic: number,
  basis: PfBasis
): { epf: number; eps: number; total: number } {
  const wage = pfWage(monthlyBasic, basis);
  const total = pct(wage, PF_RATE);
  const eps = Math.min(pct(Math.min(wage, PF_WAGE_CEILING), EPS_RATE), EPS_MONTHLY_CAP);
  return { epf: total - eps, eps, total };
}

function pushLine(
  lines: PayLine[],
  key: string,
  label: string,
  annual: number,
  note?: string
) {
  if (annual > 0) lines.push({ key, label, annual, ...(note ? { note } : {}) });
}

/**
 * Decomposes an annual CTC into what the employer spends, what appears on the
 * payslip, and what actually reaches the bank.
 *
 * The distinction that trips people up is the first one: employer PF, the
 * gratuity provision, employer NPS and the group insurance premium are all
 * inside CTC but never inside gross salary. On an Rs 18 lakh CTC they account
 * for most of the gap between the offer letter and the payslip.
 */
export function calculateTakeHome(
  input: TakeHomeInput,
  carried: CarriedDeductions
): TakeHomeResult {
  const ctc = Math.max(0, input.annualCtc);
  const basic = pct(ctc, input.basicPercent);
  const monthlyBasic = basic / MONTHS_PER_YEAR;

  /* ── Employer side: inside CTC, outside the payslip ── */

  const employerPf = splitEmployerPf(monthlyBasic, input.employerPfBasis);
  const employerPfAnnual = employerPf.total * MONTHS_PER_YEAR;
  const gratuityProvision = input.gratuityInCtc
    ? pct(basic, GRATUITY_PROVISION_PERCENT)
    : 0;
  const employerNps = pct(basic, input.employerNpsPercent);
  const insurance = Math.max(0, input.insuranceAnnual);

  const retirals: PayLine[] = [];
  pushLine(
    retirals,
    "employerPf",
    "Employer PF",
    employerPfAnnual,
    input.employerPfBasis === "ceiling"
      ? `${PF_RATE}% of the Rs ${PF_WAGE_CEILING.toLocaleString("en-IN")} ceiling wage`
      : `${PF_RATE}% of full basic`
  );
  pushLine(
    retirals,
    "gratuity",
    "Gratuity provision",
    gratuityProvision,
    `${GRATUITY_PROVISION_PERCENT}% of basic - vests only after 5 years`
  );
  pushLine(
    retirals,
    "employerNps",
    "Employer NPS",
    employerNps,
    "Sec 80CCD(2) - deductible in both regimes"
  );
  pushLine(
    retirals,
    "insurance",
    "Group health & term cover",
    insurance,
    "Premium the employer pays"
  );

  const totalRetirals = retirals.reduce((total, item) => total + item.annual, 0);

  /* ── Earnings side: the payslip ── */

  const grossSalary = Math.max(0, ctc - totalRetirals);
  const hra = pct(basic, input.hraPercent);
  const variable = pct(ctc, input.variablePercent);
  const expectedVariable = pct(variable, input.variablePayout);
  const mealVouchers = Math.min(
    Math.max(0, input.mealVoucherMonthly) * MONTHS_PER_YEAR,
    MEAL_VOUCHER.annualCap
  );
  const flexi = Math.max(0, input.flexiAnnual);

  // Special allowance is the residual - whatever the named components leave
  // behind. A negative residual means the structure allocates more than the
  // CTC can carry, and the caller surfaces that rather than hiding it.
  const specialAllowance =
    grossSalary - basic - hra - variable - mealVouchers - flexi;

  const earnings: PayLine[] = [];
  pushLine(earnings, "basic", "Basic salary", basic, `${input.basicPercent}% of CTC`);
  pushLine(earnings, "hra", "House rent allowance", hra, `${input.hraPercent}% of basic`);
  pushLine(earnings, "special", "Special allowance", Math.max(0, specialAllowance), "The residual");
  pushLine(earnings, "meal", "Meal card", mealVouchers, "Tax-free under Rule 15(5)(a)");
  pushLine(earnings, "flexi", "Reimbursements", flexi, "Telephone, internet, books, LTA");
  pushLine(
    earnings,
    "variable",
    "Variable pay",
    variable,
    input.variablePayout < 100
      ? `Paid annually - modelled at ${input.variablePayout}%`
      : "Paid annually, not monthly"
  );

  /* ── The tax, which needs the earnings before the deductions ── */

  // Variable is counted at its expected payout: taxing 100% of a bonus the
  // employee only half expects would overstate the TDS every month.
  const taxableGross =
    grossSalary - variable + expectedVariable + employerNps;

  const monthlyGrossForPt = (grossSalary - variable) / MONTHS_PER_YEAR;
  const professionalTax = annualProfessionalTax(input.stateId, monthlyGrossForPt);

  const employeePfAnnual =
    pct(pfWage(monthlyBasic, input.employerPfBasis), PF_RATE) * MONTHS_PER_YEAR;
  const vpfAnnual = pct(basic, input.vpfPercent);

  // Section 80C is shared: PF and VPF land in the same Rs 1.5 lakh pot as the
  // employee's own ELSS and insurance, so they are added rather than stacked.
  const section80C = carried.section80C + employeePfAnnual + vpfAnnual;

  const taxInput: TaxInput = {
    grossIncome: taxableGross,
    ageGroup: carried.ageGroup,
    cityType: carried.cityType,
    basicSalary: basic,
    hraReceived: hra,
    rentPaid: carried.rentPaid,
    mealVouchers,
    employerNps,
    section80C,
    section80CCD1B: carried.section80CCD1B,
    section80D: carried.section80D,
    section24B: carried.section24B,
    savingsInterest: carried.savingsInterest,
    professionalTax,
    reimbursements: Math.max(0, flexi - carried.lta),
    lta: Math.min(carried.lta, flexi),
    carLease: carried.carLease,
    carPerquisite: carried.carPerquisite,
  };

  const regimeUsed: Regime =
    input.regime === "auto"
      ? calculateTaxComparison(taxInput).betterRegime === "old"
        ? "old"
        : "new"
      : input.regime;

  const annualTax = calculateTax(taxInput, regimeUsed).totalTax;

  /* ── Deductions side of the payslip ── */

  const deductions: PayLine[] = [];
  pushLine(
    deductions,
    "employeePf",
    "Employee PF",
    employeePfAnnual,
    `${PF_RATE}% of ${input.employerPfBasis === "ceiling" ? "the ceiling wage" : "basic"}`
  );
  pushLine(deductions, "vpf", "Voluntary PF", vpfAnnual, `${input.vpfPercent}% of basic`);
  pushLine(
    deductions,
    "professionalTax",
    "Professional tax",
    professionalTax,
    "Levied by your state"
  );
  pushLine(
    deductions,
    "tds",
    "Income tax (TDS)",
    annualTax,
    `${regimeUsed === "new" ? "New" : "Old"} regime`
  );

  const totalDeductions = deductions.reduce(
    (total, item) => total + item.annual,
    0
  );

  const fixedGross = grossSalary - variable;

  // Monthly credit excludes the variable entirely - it lands once a year, and
  // showing a twelfth of it every month is exactly the illusion the offer
  // letter already creates. TDS is spread evenly, which is how payroll does it.
  const monthlyDeductions =
    (employeePfAnnual + vpfAnnual + professionalTax + annualTax) /
    MONTHS_PER_YEAR;
  const monthlyInHand = fixedGross / MONTHS_PER_YEAR - monthlyDeductions;

  const annualInHand = grossSalary - variable + expectedVariable - totalDeductions;

  return {
    retirals,
    totalRetirals,
    earnings,
    grossSalary,
    fixedGross,
    deductions,
    totalDeductions,
    regimeUsed,
    annualTax,
    monthlyInHand,
    annualInHand,
    ctcToInHandRatio: ctc > 0 ? (annualInHand / ctc) * 100 : 0,
    taxInput,
  };
}

/** True when the named components ask for more than the CTC can carry. */
export function structureOverAllocated(result: TakeHomeResult): boolean {
  const named = result.earnings
    .filter((item) => item.key !== "special")
    .reduce((total, item) => total + item.annual, 0);
  return named > result.grossSalary + 1;
}
