import { TaxSlab, TaxCalculation, ComparisonResult } from "../types";

const NEW_TAX_SLABS: TaxSlab[] = [
  { min: 0, max: 400000, rate: 0 },
  { min: 400001, max: 800000, rate: 5 },
  { min: 800001, max: 1200000, rate: 10 },
  { min: 1200001, max: 1600000, rate: 15 },
  { min: 1600001, max: 2000000, rate: 20 },
  { min: 2000001, max: 2400000, rate: 25 },
  { min: 2400001, max: null, rate: 30 },
];

const OLD_TAX_SLABS: TaxSlab[] = [
  { min: 0, max: 250000, rate: 0 },
  { min: 250001, max: 500000, rate: 5 },
  { min: 500001, max: 1000000, rate: 20 },
  { min: 1000001, max: null, rate: 30 },
];

const NEW_TAX_STANDARD_DEDUCTION = 75000;
const OLD_TAX_STANDARD_DEDUCTION = 50000;
const NEW_TAX_REBATE_LIMIT = 1200000;
const OLD_TAX_REBATE_LIMIT = 500000;

function calculateTaxForNewRegime(
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
    const slabAmount = Math.min(remainingIncome, slabMax - slabMin + 1);

    const tax = (slabAmount * slab.rate) / 100;

    if (slabAmount > 0) {
      slabwiseTax.push({
        slab,
        amount: slabAmount,
        tax,
      });
    }

    totalTax += tax;
    remainingIncome -= slabAmount;
  }

  const rebate =
    taxableIncome <= rebateLimit ? Math.min(totalTax, maxRebate) : 0;
  const finalTax = Math.max(0, totalTax - rebate);
  const cess = finalTax * 0.04;
  const finalTaxValue = finalTax + cess;
  const netTax = (finalTaxValue / income) * 100;

  return {
    totalIncome: income,
    totalDecution: deduction,
    taxableIncome,
    slabwiseTax,
    totalTax,
    rebate,
    finalTaxValue,
    cess,
    netTax,
  };
}

function calculateTaxForOldRegime(
  income: number,
  slabs: TaxSlab[],
  standardDeduction: number,
  rebateLimit: number,
  maxRebate: number,
  hra: number,
  nps: number,
  eightC: number,
  lossOnHomeLoan: number,
  eightyD: number
): TaxCalculation {
  const oldTaxDeductions =
    hra + nps + eightC + lossOnHomeLoan + eightyD + standardDeduction;
  const deduction = income > 0 ? oldTaxDeductions : 0;
  const taxableIncome = Math.max(0, income - deduction);

  let remainingIncome = taxableIncome;
  let totalTax = 0;
  const slabwiseTax = [];

  for (const slab of slabs) {
    if (remainingIncome <= 0) break;

    const slabMin = slab.min;
    const slabMax = slab.max ?? Infinity;
    const slabAmount = Math.min(remainingIncome, slabMax - slabMin + 1);

    const tax = (slabAmount * slab.rate) / 100;

    if (slabAmount > 0) {
      slabwiseTax.push({
        slab,
        amount: slabAmount,
        tax,
      });
    }

    totalTax += tax;
    remainingIncome -= slabAmount;
  }

  const rebate =
    taxableIncome <= rebateLimit ? Math.min(totalTax, maxRebate) : 0;
  const finalTax = Math.max(0, totalTax - rebate);
  const cess = finalTax * 0.04;
  const finalTaxValue = finalTax + cess;
  const netTax = (finalTaxValue / income) * 100;

  return {
    totalIncome: income,
    totalDecution: deduction,
    taxableIncome,
    slabwiseTax,
    totalTax,
    rebate,
    finalTaxValue,
    cess,
    netTax,
  };
}

export function calculateTaxComparison(
  income: number,
  hra: number,
  nps: number,
  eightC: number,
  lossOnHomeLoan: number,
  eightyD: number
): ComparisonResult {
  const newTaxRegime = calculateTaxForNewRegime(
    income,
    NEW_TAX_SLABS,
    NEW_TAX_STANDARD_DEDUCTION,
    NEW_TAX_REBATE_LIMIT,
    60000
  );

  const hraValue = isNaN(hra) ? 0 : hra;
  const npsValue = isNaN(nps) ? 0 : nps;
  const eightCValue = isNaN(eightC) ? 0 : eightC;
  const lossOnHomeLoanValue = isNaN(lossOnHomeLoan) ? 0 : lossOnHomeLoan;
  const eightyDValue = isNaN(eightyD) ? 0 : eightyD;
  const oldTaxRegime = calculateTaxForOldRegime(
    income,
    OLD_TAX_SLABS,
    OLD_TAX_STANDARD_DEDUCTION,
    OLD_TAX_REBATE_LIMIT,
    12500,
    hraValue,
    npsValue,
    eightCValue,
    lossOnHomeLoanValue,
    eightyDValue
  );

  return {
    newTaxRegime,
    oldTaxRegime,
    difference: oldTaxRegime.finalTaxValue - newTaxRegime.finalTaxValue,
  };
}
