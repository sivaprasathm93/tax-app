export type Regime = "old" | "new";

export type AgeGroup = "below60" | "senior" | "superSenior";

export type CityType = "metro" | "nonMetro";

export interface TaxSlab {
  /** Inclusive lower bound of the slab. */
  from: number;
  /** Exclusive upper bound; null means "and above". */
  upTo: number | null;
  /** Percentage rate applied to income falling inside the slab. */
  rate: number;
}

export interface SlabTaxRow {
  slab: TaxSlab;
  /** Portion of taxable income that fell into this slab. */
  amount: number;
  tax: number;
}

export interface DeductionLine {
  /**
   * Regime-independent identity, so the same concept can be lined up across
   * both regimes in the comparison table even when the ceilings differ.
   */
  key: string;
  label: string;
  amount: number;
  /** Explains a regime-specific ceiling, e.g. "14% of basic". */
  note?: string;
  /** Set when the entered amount was trimmed to a statutory ceiling. */
  cappedFrom?: number;
}

export interface TaxCalculation {
  regime: Regime;
  grossIncome: number;
  exemptions: DeductionLine[];
  deductions: DeductionLine[];
  totalExemptions: number;
  totalDeductions: number;
  taxableIncome: number;
  slabwiseTax: SlabTaxRow[];
  /** Tax from the slabs, before any rebate, surcharge or cess. */
  taxBeforeRebate: number;
  rebate: number;
  /** Section 87A marginal relief - new regime only. */
  rebateMarginalRelief: number;
  surcharge: number;
  surchargeMarginalRelief: number;
  cess: number;
  /** Total payable, rounded to the nearest rupee. */
  totalTax: number;
  /** Total tax as a percentage of gross income. */
  effectiveRate: number;
  /** Gross income less the total tax. */
  takeHome: number;
}

export interface TaxInput {
  grossIncome: number;
  ageGroup: AgeGroup;
  cityType: CityType;
  basicSalary: number;
  hraReceived: number;
  rentPaid: number;
  mealVouchers: number;
  employerNps: number;
  section80C: number;
  section80CCD1B: number;
  section80D: number;
  section24B: number;
  savingsInterest: number;
  professionalTax: number;
  /**
   * Telephone, broadband and books reimbursed against bills. Not a perquisite
   * at all under Rule 3(7)(ix), so it survives in both regimes.
   */
  reimbursements: number;
  /** Leave travel concession under section 10(5) - old regime only. */
  lta: number;
  /**
   * Annual cost of an employer-provided car: lease, fuel, maintenance and
   * driver. Only the statutory perquisite below is taxed on it.
   */
  carLease: number;
  /**
   * The Rule 3(7)(vii) perquisite this attracts for the year. Held as a
   * figure rather than derived, because it turns on the engine capacity and
   * whether a driver is provided - facts the tax engine has no other use for.
   */
  carPerquisite: number;
}

/** Every money field on the income tax form, as raw input strings. */
export type TaxFieldName = Exclude<keyof TaxInput, "ageGroup" | "cityType">;

export interface ComparisonResult {
  newRegime: TaxCalculation;
  oldRegime: TaxCalculation;
  /** Positive when the new regime is cheaper. */
  difference: number;
  betterRegime: Regime | "equal";
}

/* ── Gratuity ───────────────────────────────────────────────────────────── */

/** Whether the employer falls under the gratuity statute (10+ employees). */
export type GratuityCoverage = "covered" | "notCovered";

export type EmployerKind = "private" | "government";

/** Fixed-term staff qualify after one year under the new labour codes. */
export type EmploymentKind = "permanent" | "fixedTerm";

export type ExitReason = "resignation" | "deathOrDisablement";

export interface GratuityInput {
  /** ISO yyyy-mm-dd, as produced by <input type="date">. */
  joiningDate: string;
  exitDate: string;
  /** Last drawn basic + DA per month, or the 10-month average if not covered. */
  monthlyWage: number;
  /** Total monthly CTC; 0 when not supplied. Drives the 50% wage floor. */
  monthlyCtc: number;
  coverage: GratuityCoverage;
  employerKind: EmployerKind;
  employmentKind: EmploymentKind;
  exitReason: ExitReason;
  /** Actual payout where it differs from the entitlement; 0 means "same". */
  amountReceived: number;
}

export interface ServiceDuration {
  years: number;
  months: number;
  days: number;
  totalDays: number;
}

export interface GratuityResult {
  service: ServiceDuration;
  /** Years actually used in the formula, after any rounding. */
  qualifyingYears: number;
  /** True when a part-year over six months was rounded up. */
  roundedUp: boolean;
  eligible: boolean;
  minimumYears: number;
  ineligibleReason?: string;
  /** Monthly wage the formula ran on, after the 50%-of-CTC floor. */
  wageBase: number;
  wageFloorApplied: boolean;
  /** Formula output before the statutory ceiling is applied. */
  formulaAmount: number;
  cappedByCeiling: boolean;
  /** Payable entitlement, after the ceiling. */
  entitlement: number;
  amountReceived: number;
  exemptAmount: number;
  taxableAmount: number;
  fullyExempt: boolean;
}

/* ── Regime breakeven ───────────────────────────────────────────────────── */

export interface BreakevenResult {
  /** Old-regime deductions the taxpayer is claiming today. */
  claimed: number;
  /**
   * Deductions at which both regimes cost the same. Null when no amount of
   * deduction can close the gap - the old regime loses at every level.
   */
  required: number | null;
  /** Positive when more deductions are still needed to make the old regime win. */
  shortfall: number;
  /** Tax saved today by taking the better regime. */
  saving: number;
  betterRegime: Regime | "equal";
  /** True when the old regime cannot win however much is claimed. */
  unreachable: boolean;
}

/* ── Payroll: CTC to in-hand ────────────────────────────────────────────── */

/** Employers either cap PF at the statutory wage ceiling or run it on full basic. */
export type PfBasis = "ceiling" | "fullBasic";

export type RegimeChoice = Regime | "auto";

export interface TakeHomeInput {
  annualCtc: number;
  /** Basic as a percentage of CTC - the single lever every structure turns on. */
  basicPercent: number;
  /** HRA as a percentage of basic. */
  hraPercent: number;
  /** Variable / performance pay as a percentage of CTC. */
  variablePercent: number;
  /** Expected payout of that variable, 0-100. */
  variablePayout: number;
  employerPfBasis: PfBasis;
  /** Voluntary PF, as a percentage of basic, on top of the statutory 12%. */
  vpfPercent: number;
  /** Employer NPS as a percentage of basic - section 80CCD(2). */
  employerNpsPercent: number;
  /** Whether the CTC carries a gratuity provision line. */
  gratuityInCtc: boolean;
  /** Employer-borne group health / term premium, annual. */
  insuranceAnnual: number;
  /** Meal card loaded per month. */
  mealVoucherMonthly: number;
  /** Other tax-free reimbursements (telephone, books, LTA), annual. */
  flexiAnnual: number;
  stateId: string;
  regime: RegimeChoice;
}

export interface PayLine {
  key: string;
  label: string;
  /** Annual amount. Monthly figures are derived, never stored twice. */
  annual: number;
  note?: string;
}

export interface TakeHomeResult {
  /** CTC components that never reach the payslip. */
  retirals: PayLine[];
  totalRetirals: number;
  /** Everything on the earnings side of the payslip. */
  earnings: PayLine[];
  grossSalary: number;
  /** Fixed gross, i.e. gross less variable pay - what arrives every month. */
  fixedGross: number;
  deductions: PayLine[];
  totalDeductions: number;
  /** Regime the tax was worked out under, after resolving "auto". */
  regimeUsed: Regime;
  annualTax: number;
  /** Bank credit in a month with no variable payout. */
  monthlyInHand: number;
  /** Take-home across the year, variable included. */
  annualInHand: number;
  /** In-hand as a percentage of CTC. */
  ctcToInHandRatio: number;
  /** The tax input this result was computed from, for reuse in the summary. */
  taxInput: TaxInput;
}

/* ── Salary restructuring advisor ───────────────────────────────────────── */

export interface AllowanceOption {
  id: string;
  label: string;
  /** What the employee has to do to claim it. */
  requirement: string;
  /** Statutory basis, shown so the ask to HR can cite it. */
  authority: string;
  /** Ceiling for the year; null when it is bounded by actual spend alone. */
  annualCap: number | null;
  /** True when the exemption survives under the new regime too. */
  bothRegimes: boolean;
  /** Suggested annual amount when the employee has not entered one. */
  suggested: number;
}

export interface AllowanceSaving {
  option: AllowanceOption;
  amount: number;
  /** Tax saved by moving this much of salary into the allowance. */
  taxSaved: number;
}

/* ── Rent receipts ──────────────────────────────────────────────────────── */

export type ReceiptFrequency = "monthly" | "quarterly";

export interface RentDetails {
  tenantName: string;
  landlordName: string;
  landlordPan: string;
  landlordAddress: string;
  rentalAddress: string;
  monthlyRent: number;
  /** yyyy-mm of the first month covered. */
  fromMonth: string;
  months: number;
  frequency: ReceiptFrequency;
}

export interface RentReceipt {
  index: number;
  /** "April 2026" or "April – June 2026". */
  period: string;
  amount: number;
  /** Date the receipt is dated - the last day of the period. */
  issuedOn: string;
}

export interface HraResult {
  actualHra: number;
  rentLessTenPercent: number;
  percentOfSalary: number;
  exemption: number;
  /** Which of the three limbs bound the answer. */
  limitedBy: "hra" | "rent" | "salary" | "none";
  taxable: number;
  /** Rent above this in the year needs the landlord's PAN. */
  panRequired: boolean;
}

/* ── Equity: ESOP / RSU / ESPP ──────────────────────────────────────────── */

export type EquityKind = "rsu" | "esop" | "espp";

/** Listed-in-India shares get the 12-month test; everything else 24 months. */
export type ShareListing = "indianListed" | "foreignOrUnlisted";

export interface EquityInput {
  kind: EquityKind;
  listing: ShareListing;
  shares: number;
  /** FMV per share on the vesting or exercise date, in the source currency. */
  fmvOnVest: number;
  /** What the employee paid per share - 0 for RSUs. */
  exercisePrice: number;
  /** Per share on sale; 0 when not yet sold. */
  salePrice: number;
  vestDate: string;
  saleDate: string;
  /** Marginal slab rate applied to the perquisite, as a percentage. */
  marginalRate: number;
  /** Rule 115 TT buying rate. 1 when the grant is already in rupees. */
  fxRate: number;
  currency: string;
  /** Shares the employer sold to fund the TDS. */
  sellToCoverShares: number;
}

export interface EquityResult {
  /** Per-share figures converted to rupees at the Rule 115 rate. */
  fmvInr: number;
  exercisePriceInr: number;
  salePriceInr: number;
  perquisite: number;
  perquisiteTax: number;
  sellToCoverValue: number;
  /** Positive when the sell-to-cover raised less than the tax due. */
  tdsShortfall: number;
  netSharesRetained: number;
  sold: boolean;
  holdingDays: number;
  holdingMonthsRequired: number;
  isLongTerm: boolean;
  capitalGain: number;
  /** Section 112A's 1.25L annual shield, only for long-term gains. */
  exemptGain: number;
  taxableGain: number;
  capitalGainsRate: number;
  capitalGainsTax: number;
  totalTax: number;
  /** Sale proceeds less both taxes. */
  netProceeds: number;
}

/* ── EPF, VPF and retirement corpus ─────────────────────────────────────── */

export interface EpfInput {
  monthlyBasic: number;
  /** Employee VPF as a percentage of basic, over the statutory 12%. */
  vpfPercent: number;
  employerBasis: PfBasis;
  employeeBasis: PfBasis;
  /** Balance already accumulated. */
  openingBalance: number;
  years: number;
  /** Expected annual increment, as a percentage. */
  annualIncrement: number;
  interestRate: number;
}

export interface EpfYearRow {
  year: number;
  monthlyBasic: number;
  employeeContribution: number;
  employerEpfContribution: number;
  epsContribution: number;
  vpfContribution: number;
  interest: number;
  closingBalance: number;
}

export interface EpfResult {
  monthly: {
    employee: number;
    vpf: number;
    employerEpf: number;
    eps: number;
    total: number;
  };
  /** Employee + VPF for the first year - the figure the 2.5L rule tests. */
  annualEmployeeContribution: number;
  taxableContribution: number;
  /** Interest on the excess contribution, taxable as other income. */
  taxableInterestFirstYear: number;
  rows: EpfYearRow[];
  corpus: number;
  totalContributed: number;
  totalInterest: number;
  /** Separate EPS pot - it buys a pension, not a lump sum. */
  epsTotal: number;
}

/* ── Leave encashment ───────────────────────────────────────────────────── */

export interface LeaveEncashmentInput {
  employerKind: EmployerKind;
  /** Average monthly basic + DA over the last ten months. */
  monthlySalary: number;
  yearsOfService: number;
  leaveDaysEncashed: number;
  /** Leave credited per year of service under the employer's own scheme. */
  leaveDaysPerYear: number;
  amountReceived: number;
  /** Exemption already used at earlier employers - the ceiling is lifetime. */
  previouslyExempted: number;
}

export interface LeaveEncashmentLimb {
  label: string;
  amount: number;
  note?: string;
}

export interface LeaveEncashmentResult {
  perDaySalary: number;
  /** Days the statute allows, capped at 30 per completed year. */
  eligibleDays: number;
  limbs: LeaveEncashmentLimb[];
  exempt: number;
  taxable: number;
  fullyExempt: boolean;
  /** Which limb bound the exemption. */
  boundBy: string;
}

/* ── Advance tax and secondary income ───────────────────────────────────── */

export interface OtherIncomeInput {
  savingsInterest: number;
  fdInterest: number;
  dividend: number;
  /** Listed Indian equity and equity mutual funds - section 111A, flat 20%. */
  stcgListed: number;
  /**
   * Foreign shares, unlisted shares, debt funds, property. Outside section
   * 111A, so charged at the taxpayer's own slab rate.
   */
  stcgOther: number;
  /** Listed equity - section 112A, 12.5% with the Rs 1.25 lakh annual shield. */
  ltcgListed: number;
  /** Everything else long-term - section 112, 12.5% with no shield. */
  ltcgOther: number;
  /** Gross freelance receipts, taxed at 50% under section 44ADA. */
  freelanceReceipts: number;
  rentalIncome: number;
  /** TDS the employer has already deducted from salary. */
  employerTds: number;
  /** TDS already deducted at source on the non-salary income. */
  otherTds: number;
}

export interface AdvanceTaxInstalment {
  label: string;
  dueOn: string;
  /** Cumulative percentage of liability due by this date. */
  cumulativePercent: number;
  cumulativeAmount: number;
  /** Payable at this instalment, net of the earlier ones. */
  amount: number;
  /** True once the date has passed. */
  overdue: boolean;
}

export interface AdvanceTaxResult {
  /**
   * Slab income - salary plus interest, dividend, rent, presumptive profit,
   * and any short-term gain that falls outside section 111A.
   */
  slabIncome: number;
  specialRateIncome: number;
  presumptiveProfit: number;
  taxOnSlabIncome: number;
  taxOnShortTermGains: number;
  taxOnLongTermGains: number;
  exemptLongTermGains: number;
  /** Short-term gains pushed into the slabs because 111A does not reach them. */
  slabTaxedGains: number;
  cess: number;
  surcharge: number;
  totalLiability: number;
  creditedTds: number;
  balancePayable: number;
  advanceTaxDue: boolean;
  instalments: AdvanceTaxInstalment[];
  /** Interest that accrues if nothing is paid until filing. */
  interest234B: number;
  interest234C: number;
  regime: Regime;
}

/* ── Tax calendar ───────────────────────────────────────────────────────── */

export type CalendarAudience = "everyone" | "advanceTax" | "equity";

export interface CalendarEvent {
  id: string;
  /** ISO yyyy-mm-dd. Window events carry an end date too. */
  date: string;
  endDate?: string;
  title: string;
  detail: string;
  audience: CalendarAudience;
  /** True where missing the date costs money rather than convenience. */
  statutory: boolean;
}

/* ── Job offer comparison ───────────────────────────────────────────────── */

export interface OfferInput {
  id: string;
  name: string;
  annualCtc: number;
  basicPercent: number;
  hraPercent: number;
  variablePercent: number;
  variablePayout: number;
  /** Joining / retention bonus paid in year one only. */
  joiningBonus: number;
  /** Total equity grant value, vesting evenly over the years below. */
  equityGrant: number;
  equityVestYears: number;
  employerNpsPercent: number;
  employerPfBasis: PfBasis;
  gratuityInCtc: boolean;
  insuranceAnnual: number;
  mealVoucherMonthly: number;
  stateId: string;
}

export interface OfferResult {
  input: OfferInput;
  takeHome: TakeHomeResult;
  /** Equity vesting in a single year, before tax. */
  annualEquity: number;
  /**
   * The rate the equity and joining bonus actually bore, as a percentage.
   * Reported rather than assumed: it comes out of charging them, not out of
   * a slab table. Zero when the offer carries neither.
   */
  equityTaxRate: number;
  /** Year-one cash: in-hand plus joining bonus plus post-tax equity. */
  firstYearNet: number;
  /** Steady-state annual net, once the joining bonus has gone. */
  steadyStateNet: number;
  /** Gap to the offer being compared against. */
  deltaMonthlyInHand: number;
  deltaFirstYearNet: number;
}

/* ── Profiles ───────────────────────────────────────────────────────────── */

/**
 * Everything a saved profile holds. Kept as one flat, JSON-safe shape so it
 * round-trips through localStorage without a migration layer.
 */
export interface Profile {
  id: string;
  name: string;
  updatedAt: number;
  tax: Record<TaxFieldName, string>;
  ageGroup: AgeGroup;
  cityType: CityType;
  takeHome: TakeHomeInput;
  rent: RentDetails;
  offers: OfferInput[];
}
