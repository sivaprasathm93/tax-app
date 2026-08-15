import {
  CESS_RATE,
  DEDUCTION_LIMITS,
  EMPLOYER_NPS_PERCENT,
  HRA_SALARY_PERCENT,
  MEAL_VOUCHER,
  NEW_REGIME_SLABS,
  OLD_REGIME_SLABS,
  REBATE_87A,
  STANDARD_DEDUCTION,
  SURCHARGE_BANDS,
} from "../constants/taxRules";
import {
  ComparisonResult,
  DeductionLine,
  Regime,
  SlabTaxRow,
  TaxCalculation,
  TaxInput,
  TaxSlab,
} from "../types";

/** Treats NaN, negatives and undefined as zero so partial forms still calculate. */
function safe(value: number | undefined): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : 0;
}

function line(
  label: string,
  entered: number,
  limit = Infinity
): DeductionLine | null {
  const amount = Math.min(safe(entered), limit);
  if (amount <= 0) return null;
  return amount < safe(entered)
    ? { label, amount, cappedFrom: safe(entered) }
    : { label, amount };
}

function sum(lines: DeductionLine[]): number {
  return lines.reduce((total, item) => total + item.amount, 0);
}

/**
 * Walks the slabs and taxes only the income that falls inside each band.
 * Bounds are half-open ([from, upTo)) so no rupee is taxed twice or skipped.
 */
export function computeSlabTax(
  taxableIncome: number,
  slabs: TaxSlab[]
): { tax: number; rows: SlabTaxRow[] } {
  let tax = 0;
  const rows: SlabTaxRow[] = [];

  for (const slab of slabs) {
    const upper = slab.upTo ?? Infinity;
    const amount = Math.max(0, Math.min(taxableIncome, upper) - slab.from);
    if (amount <= 0) continue;

    const slabTax = (amount * slab.rate) / 100;
    rows.push({ slab, amount, tax: slabTax });
    tax += slabTax;
  }

  return { tax, rows };
}

/**
 * HRA exemption under section 10(13A) / Rule 2A - the least of the three limbs.
 * "Salary" here means basic pay plus dearness allowance.
 */
export function computeHraExemption(
  hraReceived: number,
  rentPaid: number,
  basicSalary: number,
  cityType: "metro" | "nonMetro"
): number {
  const hra = safe(hraReceived);
  const rent = safe(rentPaid);
  const salary = safe(basicSalary);
  if (hra <= 0 || rent <= 0 || salary <= 0) return 0;

  const percent = HRA_SALARY_PERCENT[cityType];
  return Math.max(
    0,
    Math.min(hra, rent - salary * 0.1, (salary * percent) / 100)
  );
}

/**
 * Surcharge on income above the band thresholds, with marginal relief so that
 * crossing a threshold never costs more than the income earned beyond it.
 */
function computeSurcharge(
  taxableIncome: number,
  taxAfterRebate: number,
  slabs: TaxSlab[],
  regime: Regime
): { surcharge: number; marginalRelief: number } {
  const bands = SURCHARGE_BANDS[regime];
  let bandIndex = -1;
  for (let i = bands.length - 1; i >= 0; i--) {
    if (taxableIncome > bands[i].above) {
      bandIndex = i;
      break;
    }
  }
  if (bandIndex < 0 || taxAfterRebate <= 0) {
    return { surcharge: 0, marginalRelief: 0 };
  }

  const band = bands[bandIndex];
  const surcharge = (taxAfterRebate * band.rate) / 100;

  // At exactly the threshold the previous (lower) band rate still applies.
  const previousRate = bandIndex > 0 ? bands[bandIndex - 1].rate : 0;
  const taxAtThreshold = computeSlabTax(band.above, slabs).tax;
  const payableAtThreshold = taxAtThreshold * (1 + previousRate / 100);

  const payableNow = taxAfterRebate + surcharge;
  const ceiling = payableAtThreshold + (taxableIncome - band.above);
  const marginalRelief = Math.max(0, payableNow - ceiling);

  return { surcharge, marginalRelief };
}

/**
 * Exemptions that reduce salary income before any regime-specific deduction.
 * Meal vouchers now sit here for BOTH regimes - Rule 15(5)(a) of the
 * Income-tax Rules, 2026 extended the benefit to the new regime from FY 2026-27.
 */
function buildExemptions(input: TaxInput, regime: Regime): DeductionLine[] {
  const lines: DeductionLine[] = [];

  const meal = line(
    `Meal vouchers (Rule 15(5)(a), max ${MEAL_VOUCHER.annualCap.toLocaleString("en-IN")})`,
    input.mealVouchers,
    MEAL_VOUCHER.annualCap
  );
  if (meal) lines.push(meal);

  if (regime === "old") {
    const hraExempt = computeHraExemption(
      input.hraReceived,
      input.rentPaid,
      input.basicSalary,
      input.cityType
    );
    if (hraExempt > 0) {
      lines.push({ label: "HRA exemption (Sec 10(13A))", amount: hraExempt });
    }
  }

  return lines;
}

/** Deductions available under the given regime, each trimmed to its ceiling. */
function buildDeductions(input: TaxInput, regime: Regime): DeductionLine[] {
  const lines: DeductionLine[] = [];

  lines.push({
    label: "Standard deduction",
    amount: STANDARD_DEDUCTION[regime],
  });

  // Employer NPS survives in both regimes, at different ceilings.
  const npsCeiling = (safe(input.basicSalary) * EMPLOYER_NPS_PERCENT[regime]) / 100;
  const employerNps = line(
    `Employer NPS - Sec 80CCD(2) (max ${EMPLOYER_NPS_PERCENT[regime]}% of basic)`,
    input.employerNps,
    npsCeiling
  );
  if (employerNps) lines.push(employerNps);

  if (regime === "old") {
    const optional: (DeductionLine | null)[] = [
      line("Section 80C", input.section80C, DEDUCTION_LIMITS.section80C),
      line(
        "Section 80CCD(1B) - NPS self",
        input.section80CCD1B,
        DEDUCTION_LIMITS.section80CCD1B
      ),
      line(
        "Section 80D - health insurance",
        input.section80D,
        DEDUCTION_LIMITS.section80D
      ),
      line(
        "Section 24(b) - home loan interest",
        input.section24B,
        DEDUCTION_LIMITS.section24B
      ),
      line(
        input.ageGroup === "below60"
          ? "Section 80TTA - savings interest"
          : "Section 80TTB - interest income",
        input.savingsInterest,
        input.ageGroup === "below60"
          ? DEDUCTION_LIMITS.section80TTA
          : DEDUCTION_LIMITS.section80TTB
      ),
      line(
        "Professional tax",
        input.professionalTax,
        DEDUCTION_LIMITS.professionalTax
      ),
    ];
    for (const item of optional) if (item) lines.push(item);
  }

  return lines;
}

export function calculateTax(input: TaxInput, regime: Regime): TaxCalculation {
  const grossIncome = safe(input.grossIncome);
  const slabs =
    regime === "new" ? NEW_REGIME_SLABS : OLD_REGIME_SLABS[input.ageGroup];

  const exemptions = grossIncome > 0 ? buildExemptions(input, regime) : [];
  const totalExemptions = sum(exemptions);

  const deductions = grossIncome > 0 ? buildDeductions(input, regime) : [];
  const totalDeductions = sum(deductions);

  const taxableIncome = Math.max(
    0,
    grossIncome - totalExemptions - totalDeductions
  );

  const { tax: taxBeforeRebate, rows: slabwiseTax } = computeSlabTax(
    taxableIncome,
    slabs
  );

  // Section 87A rebate, plus marginal relief where the regime provides it.
  const rebateRule = REBATE_87A[regime];
  let rebate = 0;
  let rebateMarginalRelief = 0;

  if (taxableIncome <= rebateRule.incomeCeiling) {
    rebate = Math.min(taxBeforeRebate, rebateRule.maxRebate);
  } else if (rebateRule.marginalRelief) {
    // Tax must never exceed the income earned above the rebate ceiling.
    const incomeAboveCeiling = taxableIncome - rebateRule.incomeCeiling;
    if (taxBeforeRebate > incomeAboveCeiling) {
      rebateMarginalRelief = taxBeforeRebate - incomeAboveCeiling;
    }
  }

  const taxAfterRebate = Math.max(
    0,
    taxBeforeRebate - rebate - rebateMarginalRelief
  );

  const { surcharge, marginalRelief: surchargeMarginalRelief } =
    computeSurcharge(taxableIncome, taxAfterRebate, slabs, regime);

  const taxPlusSurcharge = taxAfterRebate + surcharge - surchargeMarginalRelief;
  const cess = (taxPlusSurcharge * CESS_RATE) / 100;
  const totalTax = Math.round(taxPlusSurcharge + cess);

  return {
    regime,
    grossIncome,
    exemptions,
    deductions,
    totalExemptions,
    totalDeductions,
    taxableIncome,
    slabwiseTax,
    taxBeforeRebate,
    rebate,
    rebateMarginalRelief,
    surcharge,
    surchargeMarginalRelief,
    cess,
    totalTax,
    effectiveRate: grossIncome > 0 ? (totalTax / grossIncome) * 100 : 0,
  };
}

export function calculateTaxComparison(input: TaxInput): ComparisonResult {
  const newRegime = calculateTax(input, "new");
  const oldRegime = calculateTax(input, "old");
  const difference = oldRegime.totalTax - newRegime.totalTax;

  return {
    newRegime,
    oldRegime,
    difference,
    betterRegime: difference > 0 ? "new" : difference < 0 ? "old" : "equal",
  };
}
