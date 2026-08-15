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
}

export interface ComparisonResult {
  newRegime: TaxCalculation;
  oldRegime: TaxCalculation;
  /** Positive when the new regime is cheaper. */
  difference: number;
  betterRegime: Regime | "equal";
}
