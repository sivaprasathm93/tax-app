export interface TaxSlab {
  min: number;
  max: number | null;
  rate: number;
}

export interface TaxCalculation {
  totalIncome: number;
  standardDeduction: number;
  taxableIncome: number;
  slabwiseTax: {
    slab: TaxSlab;
    amount: number;
    tax: number;
  }[];
  totalTax: number;
  rebate: number;
  finalTax: number;
}

export interface ComparisonResult {
  proposed2025: TaxCalculation;
  current: TaxCalculation;
  difference: number;
}