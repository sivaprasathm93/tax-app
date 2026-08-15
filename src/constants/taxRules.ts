import { AgeGroup, Regime, TaxSlab } from "../types";

/**
 * Rules for FY 2026-27 (Tax Year 2026-27 / A.Y. 2027-28).
 *
 * Governed by the Income-tax Act, 2025 and the Income-tax Rules, 2026, both
 * effective 1 April 2026. Budget 2026 left the slab structure of both regimes
 * untouched; the notable change for salaried taxpayers is the meal voucher
 * limit (see MEAL_VOUCHER) and the widened metro list for HRA (see METRO_CITIES).
 */
export const FINANCIAL_YEAR = "2026-27";
export const ASSESSMENT_YEAR = "2027-28";

export const NEW_REGIME_SLABS: TaxSlab[] = [
  { from: 0, upTo: 400000, rate: 0 },
  { from: 400000, upTo: 800000, rate: 5 },
  { from: 800000, upTo: 1200000, rate: 10 },
  { from: 1200000, upTo: 1600000, rate: 15 },
  { from: 1600000, upTo: 2000000, rate: 20 },
  { from: 2000000, upTo: 2400000, rate: 25 },
  { from: 2400000, upTo: null, rate: 30 },
];

/**
 * The old regime keeps its age-based basic exemption: 2.5L below 60,
 * 3L for senior citizens (60-79) and 5L for super senior citizens (80+).
 */
export const OLD_REGIME_SLABS: Record<AgeGroup, TaxSlab[]> = {
  below60: [
    { from: 0, upTo: 250000, rate: 0 },
    { from: 250000, upTo: 500000, rate: 5 },
    { from: 500000, upTo: 1000000, rate: 20 },
    { from: 1000000, upTo: null, rate: 30 },
  ],
  senior: [
    { from: 0, upTo: 300000, rate: 0 },
    { from: 300000, upTo: 500000, rate: 5 },
    { from: 500000, upTo: 1000000, rate: 20 },
    { from: 1000000, upTo: null, rate: 30 },
  ],
  superSenior: [
    { from: 0, upTo: 500000, rate: 0 },
    { from: 500000, upTo: 1000000, rate: 20 },
    { from: 1000000, upTo: null, rate: 30 },
  ],
};

export const STANDARD_DEDUCTION: Record<Regime, number> = {
  new: 75000,
  old: 50000,
};

/**
 * Section 87A. The new regime rebate carries marginal relief, so tax never
 * exceeds the income earned above the rebate ceiling. The old regime has none.
 */
export const REBATE_87A: Record<
  Regime,
  { incomeCeiling: number; maxRebate: number; marginalRelief: boolean }
> = {
  new: { incomeCeiling: 1200000, maxRebate: 60000, marginalRelief: true },
  old: { incomeCeiling: 500000, maxRebate: 12500, marginalRelief: false },
};

/** Surcharge bands, applied on income tax before cess. Highest crossed band wins. */
export const SURCHARGE_BANDS: Record<Regime, { above: number; rate: number }[]> =
  {
    // The new regime caps surcharge at 25% - the 37% top rate does not apply.
    new: [
      { above: 5000000, rate: 10 },
      { above: 10000000, rate: 15 },
      { above: 20000000, rate: 25 },
    ],
    old: [
      { above: 5000000, rate: 10 },
      { above: 10000000, rate: 15 },
      { above: 20000000, rate: 25 },
      { above: 50000000, rate: 37 },
    ],
  };

/** Health & Education Cess on tax plus surcharge. */
export const CESS_RATE = 4;

/**
 * Meal vouchers / food cards - Rule 15(5)(a) of the Income-tax Rules, 2026.
 *
 * The per-meal ceiling rose from Rs 50 to Rs 200 with effect from 1 April 2026,
 * and the exemption is now available under BOTH regimes (previously old only).
 * Vouchers must be non-transferable and usable only for food and non-alcoholic
 * beverages; a cash meal allowance stays fully taxable.
 */
export const MEAL_VOUCHER = {
  perMeal: 200,
  mealsPerDay: 2,
  workingDaysPerMonth: 22,
  monthsPerYear: 12,
  /** 200 x 2 meals x 22 days x 12 months = Rs 1,05,600 (was Rs 26,400 at Rs 50/meal). */
  annualCap: 200 * 2 * 22 * 12,
} as const;

/**
 * HRA - section 10(13A) read with Rule 2A. From 1 April 2026 Bengaluru, Pune,
 * Hyderabad and Ahmedabad join the 50% metro list.
 */
export const METRO_CITIES = [
  "Delhi",
  "Mumbai",
  "Kolkata",
  "Chennai",
  "Bengaluru",
  "Pune",
  "Hyderabad",
  "Ahmedabad",
] as const;

export const HRA_SALARY_PERCENT = { metro: 50, nonMetro: 40 } as const;

/** Caps on the old-regime chapter VI-A deductions this calculator supports. */
export const DEDUCTION_LIMITS = {
  section80C: 150000,
  section80CCD1B: 50000,
  /** 25k self + 25k parents, or 50k + 50k where both are senior citizens. */
  section80D: 100000,
  section24B: 200000,
  /** 80TTA for savings interest; 80TTB is the senior citizen equivalent. */
  section80TTA: 10000,
  section80TTB: 50000,
  professionalTax: 2500,
} as const;

/**
 * Employer NPS under section 80CCD(2) survives in both regimes. The new regime
 * allows 14% of basic + DA for everyone; the old regime stays at 10% for
 * non-government employees.
 */
export const EMPLOYER_NPS_PERCENT: Record<Regime, number> = { new: 14, old: 10 };
