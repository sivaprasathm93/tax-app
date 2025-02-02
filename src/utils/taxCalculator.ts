import { TaxSlab, TaxCalculation, ComparisonResult } from '../types';

const PROPOSED_2025_TAX_SLABS: TaxSlab[] = [
  { min: 0, max: 400000, rate: 0 },
  { min: 400001, max: 800000, rate: 5 },
  { min: 800001, max: 1200000, rate: 10 },
  { min: 1200001, max: 1600000, rate: 15 },
  { min: 1600001, max: 2000000, rate: 20 },
  { min: 2000001, max: 2400000, rate: 25 },
  { min: 2400001, max: null, rate: 30 },
];

const CURRENT_TAX_SLABS: TaxSlab[] = [
  { min: 0, max: 300000, rate: 0 },
  { min: 300001, max: 600000, rate: 5 },
  { min: 600001, max: 900000, rate: 10 },
  { min: 900001, max: 1200000, rate: 15 },
  { min: 1200001, max: 1500000, rate: 20 },
  { min: 1500001, max: null, rate: 30 },
];

const PROPOSED_2025_STANDARD_DEDUCTION = 75000;
const CURRENT_STANDARD_DEDUCTION = 50000;
const PROPOSED_2025_REBATE_LIMIT = 1200000;
const CURRENT_REBATE_LIMIT = 700000;

function calculateTaxForRegime(
  income: number,
  slabs: TaxSlab[],
  standardDeduction: number,
  rebateLimit: number,
  maxRebate: number
): TaxCalculation {
  const deduction = income > 0 ? standardDeduction : 0;
  const taxableIncome = Math.max(0, income - deduction);
  
  let remainingIncome = taxableIncome;
  let totalTax = 0;
  const slabwiseTax = [];

  for (const slab of slabs) {
    if (remainingIncome <= 0) break;

    const slabMin = slab.min;
    const slabMax = slab.max ?? Infinity;
    const slabAmount = Math.min(
      remainingIncome,
      slabMax - slabMin + 1
    );
    
    const tax = (slabAmount * slab.rate) / 100;
    
    if (slabAmount > 0) {
      slabwiseTax.push({
        slab,
        amount: slabAmount,
        tax
      });
    }

    totalTax += tax;
    remainingIncome -= slabAmount;
  }

  const rebate = taxableIncome <= rebateLimit ? Math.min(totalTax, maxRebate) : 0;
  const finalTax = Math.max(0, totalTax - rebate);

  return {
    totalIncome: income,
    standardDeduction: deduction,
    taxableIncome,
    slabwiseTax,
    totalTax,
    rebate,
    finalTax
  };
}

export function calculateTaxComparison(income: number): ComparisonResult {
  const proposed2025 = calculateTaxForRegime(
    income,
    PROPOSED_2025_TAX_SLABS,
    PROPOSED_2025_STANDARD_DEDUCTION,
    PROPOSED_2025_REBATE_LIMIT,
    60000
  );

  const current = calculateTaxForRegime(
    income,
    CURRENT_TAX_SLABS,
    CURRENT_STANDARD_DEDUCTION,
    CURRENT_REBATE_LIMIT,
    25000
  );

  return {
    proposed2025,
    current,
    difference: current.finalTax - proposed2025.finalTax
  };
}