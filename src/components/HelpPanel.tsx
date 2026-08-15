import { memo } from "react";
import { UtensilsCrossed } from "lucide-react";
import { TaxSlabTable } from "./TaxSlabTable";
import {
  ASSESSMENT_YEAR,
  DEDUCTION_LIMITS,
  EMPLOYER_NPS_PERCENT,
  FINANCIAL_YEAR,
  HRA_SALARY_PERCENT,
  MEAL_VOUCHER,
  NEW_REGIME_SLABS,
  OLD_REGIME_SLABS,
  REBATE_87A,
  STANDARD_DEDUCTION,
} from "../constants/taxRules";
import { AgeGroup } from "../types";
import { formatCurrency, formatNumber } from "../utils/format";

interface Props {
  ageGroup: AgeGroup;
}

/**
 * Lazily loaded from App - the reference tables are only mounted when the
 * user actually opens this section, keeping them out of the first paint.
 * It renders inside a FormSection, so it carries no card chrome of its own.
 */
const HelpPanel = memo(function HelpPanel({ ageGroup }: Props) {
  return (
    <div className="text-sm space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TaxSlabTable
          title={`Old regime slabs (FY ${FINANCIAL_YEAR})`}
          slabs={OLD_REGIME_SLABS[ageGroup]}
        />
        <TaxSlabTable
          title={`New regime slabs (FY ${FINANCIAL_YEAR})`}
          slabs={NEW_REGIME_SLABS}
        />
      </div>

      <section className="rounded-lg border-2 border-emerald-200 bg-emerald-50/70 p-4">
        <h3 className="flex items-center gap-2 text-base font-semibold text-emerald-900 mb-2">
          <UtensilsCrossed className="w-5 h-5" aria-hidden="true" />
          Meal vouchers / food cards - new for FY {FINANCIAL_YEAR}
        </h3>
        <p className="text-emerald-900/90 mb-2">
          Rule 15(5)(a) of the Income-tax Rules, 2026 raised the exempt value of
          employer-provided meals and food vouchers from ₹50 to{" "}
          <strong>₹{MEAL_VOUCHER.perMeal} per meal</strong> with effect from
          1 April 2026, and — unlike earlier years — the exemption is now
          available under <strong>both</strong> the old and the new regime.
        </p>
        <p className="text-emerald-900/90 mb-2">
          At {MEAL_VOUCHER.mealsPerDay} meals a day across{" "}
          {MEAL_VOUCHER.workingDaysPerMonth} working days for{" "}
          {MEAL_VOUCHER.monthsPerYear} months, the annual ceiling works out to{" "}
          <strong>{formatCurrency(MEAL_VOUCHER.annualCap)}</strong> (it was
          ₹26,400 at the old ₹50 rate).
        </p>
        <ul className="list-disc pl-5 space-y-1 text-emerald-900/80">
          <li>
            The voucher or card must be non-transferable and usable only for
            food and non-alcoholic beverages.
          </li>
          <li>
            A <em>cash</em> meal allowance gets no relief — it is taxed like any
            other cash allowance.
          </li>
          <li>
            Tea, snacks and free meals beyond the per-meal ceiling stay outside
            the exemption.
          </li>
        </ul>
      </section>

      <section className="space-y-2 text-[color:var(--ink-secondary)]">
        <h3 className="text-[15px] font-semibold text-slate-900">
          Other rules applied for A.Y. {ASSESSMENT_YEAR}
        </h3>
        <p>
          <strong>Standard deduction:</strong>{" "}
          {formatCurrency(STANDARD_DEDUCTION.new)} under the new regime,{" "}
          {formatCurrency(STANDARD_DEDUCTION.old)} under the old.
        </p>
        <p>
          <strong>Section 87A rebate:</strong> up to{" "}
          {formatCurrency(REBATE_87A.new.maxRebate)} where taxable income stays
          within {formatCurrency(REBATE_87A.new.incomeCeiling)} under the new
          regime — with marginal relief just above that line — against{" "}
          {formatCurrency(REBATE_87A.old.maxRebate)} up to{" "}
          {formatCurrency(REBATE_87A.old.incomeCeiling)} under the old regime.
        </p>
        <p>
          <strong>HRA (old regime only):</strong> the least of actual HRA, rent
          paid minus 10% of basic, and {HRA_SALARY_PERCENT.metro}% of basic in a
          metro / {HRA_SALARY_PERCENT.nonMetro}% elsewhere. On 1 April 2026 the{" "}
          {HRA_SALARY_PERCENT.metro}% metro list grew from Delhi, Mumbai,
          Kolkata and Chennai to add Bengaluru, Pune, Hyderabad and Ahmedabad.
        </p>
        <p>
          <strong>Employer NPS — Sec 80CCD(2):</strong> allowed in both regimes,
          at {EMPLOYER_NPS_PERCENT.new}% of basic + DA under the new regime and{" "}
          {EMPLOYER_NPS_PERCENT.old}% under the old (non-government employees).
        </p>
        <p>
          <strong>Old regime deduction ceilings:</strong> 80C{" "}
          {formatCurrency(DEDUCTION_LIMITS.section80C)}, 80CCD(1B){" "}
          {formatCurrency(DEDUCTION_LIMITS.section80CCD1B)}, 80D{" "}
          {formatCurrency(DEDUCTION_LIMITS.section80D)}, 24(b){" "}
          {formatCurrency(DEDUCTION_LIMITS.section24B)}, 80TTA ₹
          {formatNumber(DEDUCTION_LIMITS.section80TTA)} / 80TTB ₹
          {formatNumber(DEDUCTION_LIMITS.section80TTB)} for senior citizens.
        </p>
        <p>
          <strong>Surcharge:</strong> 10% / 15% / 25% / 37% above ₹50L / ₹1Cr /
          ₹2Cr / ₹5Cr of taxable income under the old regime, capped at 25%
          under the new regime. Marginal relief is applied at each threshold.
          Health &amp; Education Cess of 4% is added on top.
        </p>
      </section>

    </div>
  );
});

export default HelpPanel;
