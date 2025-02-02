export interface TaxSlab {
  min: number;
  max: number | null;
  rate: number;
}

export interface TaxCalculation {
  totalIncome: number;
  totalDecution: number;
  taxableIncome: number;
  slabwiseTax: {
    slab: TaxSlab;
    amount: number;
    tax: number;
  }[];
  totalTax: number;
  rebate: number;
  finalTaxValue: number;
  cess: number;
  netTax: number;
}

export interface ComparisonResult {
  newTaxRegime: TaxCalculation;
  oldTaxRegime: TaxCalculation;
  difference: number;
}
