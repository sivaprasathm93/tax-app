import {
  ALLOWANCE_OPTIONS,
  EMPLOYER_NPS_CEILING,
  carPerquisiteValue,
} from "../constants/allowances";
import { AllowanceSaving, Regime, TaxInput } from "../types";
import { calculateTax } from "./taxCalculator";

/** Where each allowance lands on the tax input, once payroll carves it out. */
const FIELD_FOR: Record<string, keyof TaxInput | null> = {
  mealVouchers: "mealVouchers",
  telephone: "reimbursements",
  books: "reimbursements",
  employerNps: "employerNps",
  lta: "lta",
  fuelAndDriver: "carLease",
};

function amountFor(input: TaxInput, optionId: string): number {
  switch (optionId) {
    case "mealVouchers":
      return input.mealVouchers;
    case "employerNps":
      return input.employerNps;
    case "lta":
      return input.lta;
    case "fuelAndDriver":
      return input.carLease;
    // Telephone and books share one reimbursements field on the form, so the
    // headroom each still has is only meaningful in the aggregate.
    case "telephone":
    case "books":
      return input.reimbursements;
    default:
      return 0;
  }
}

/**
 * The taxpayer's position with a further `amount` routed into `optionId`.
 *
 * The car scheme needs its own handling: moving salary into it brings a
 * statutory perquisite back the other way, and adding the cost without the
 * perquisite would price the option as though the whole lease were tax-free.
 * A large engine with a driver is assumed - the conservative case, since it
 * produces the larger perquisite and so the smaller saving.
 */
function applyOption(
  input: TaxInput,
  optionId: string,
  field: keyof TaxInput,
  amount: number
): TaxInput {
  const next: TaxInput = {
    ...input,
    [field]: (input[field] as number) + amount,
  };

  if (optionId === "fuelAndDriver" && next.carPerquisite <= 0) {
    next.carPerquisite = carPerquisiteValue(true, true);
  }

  return next;
}

/**
 * What each allowance is worth, measured rather than assumed.
 *
 * The naive answer is "amount times your slab rate", and it is wrong often
 * enough to matter: a taxpayer sitting just under the section 87A ceiling
 * saves nothing at all by restructuring, and one just over a surcharge
 * threshold saves considerably more than their slab rate. So each option is
 * priced by running the whole computation twice, with and without it.
 */
export function priceAllowances(
  input: TaxInput,
  regime: Regime
): AllowanceSaving[] {
  const baseline = calculateTax(input, regime).totalTax;

  return ALLOWANCE_OPTIONS.map((option) => {
    const field = FIELD_FOR[option.id];
    const claimed = amountFor(input, option.id);

    // Headroom left under the statutory ceiling, or the suggested figure when
    // the ceiling is bounded by actual spend instead.
    const ceiling =
      option.id === "employerNps"
        ? (input.basicSalary * EMPLOYER_NPS_CEILING[regime]) / 100
        : (option.annualCap ?? claimed + option.suggested);

    const headroom = Math.max(0, ceiling - claimed);

    if (field === null || headroom <= 0) {
      return { option, amount: headroom, taxSaved: 0 };
    }

    // LTA is withdrawn by section 115BAC, so under the new regime the
    // restructuring buys nothing.
    if (!option.bothRegimes && regime === "new") {
      return { option, amount: headroom, taxSaved: 0 };
    }

    const withOption = applyOption(input, option.id, field, headroom);
    const after = calculateTax(withOption, regime).totalTax;

    return { option, amount: headroom, taxSaved: Math.max(0, baseline - after) };
  }).sort((a, b) => b.taxSaved - a.taxSaved);
}

/**
 * Total saving if every remaining allowance is taken up.
 *
 * Summed from the individually priced figures rather than recomputed on the
 * combined position, and the two differ: taking all of them can push the
 * taxpayer down a slab, at which point the last few are worth less than they
 * were priced at. So the combined figure is computed properly here.
 */
export function totalRestructuringSaving(
  input: TaxInput,
  regime: Regime,
  savings: AllowanceSaving[]
): number {
  const baseline = calculateTax(input, regime).totalTax;

  const combined = savings.reduce<TaxInput>((draft, saving) => {
    const field = FIELD_FOR[saving.option.id];
    if (field === null || saving.taxSaved <= 0) return draft;
    return applyOption(draft, saving.option.id, field, saving.amount);
  }, input);

  return Math.max(0, baseline - calculateTax(combined, regime).totalTax);
}
