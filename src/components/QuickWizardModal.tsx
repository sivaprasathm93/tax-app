import { useState } from "react";
import {
  X,
  Zap,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
} from "lucide-react";
import { CurrencyField } from "./CurrencyField";
import { CityType, TaxInput } from "../types";
import { calculateTaxComparison } from "../utils/taxCalculator";
import { formatCurrency } from "../utils/format";
import { MEAL_VOUCHER } from "../constants/taxRules";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApply: (data: {
    grossIncome: number;
    basicSalary: number;
    hraReceived: number;
    rentPaid: number;
    cityType: CityType;
    section80C: number;
    section80D: number;
    mealVouchers: number;
  }) => void;
}

const PRESET_CTCS = [
  { label: "₹10 LPA", value: 1000000 },
  { label: "₹18 LPA", value: 1800000 },
  { label: "₹25 LPA", value: 2500000 },
  { label: "₹35 LPA", value: 3500000 },
  { label: "₹50 LPA", value: 5000000 },
];

const PRESET_RENTS = [
  { label: "No Rent", value: 0 },
  { label: "₹15k /mo", value: 180000 },
  { label: "₹25k /mo", value: 300000 },
  { label: "₹35k /mo", value: 420000 },
  { label: "₹50k /mo", value: 600000 },
];

export function QuickWizardModal({ isOpen, onClose, onApply }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [grossInput, setGrossInput] = useState<string>("1800000");
  const [rentInput, setRentInput] = useState<string>("300000");
  const [cityType, setCityType] = useState<CityType>("metro");
  const [has80C, setHas80C] = useState<boolean>(true);
  const [has80D, setHas80D] = useState<boolean>(true);
  const [optMealCard, setOptMealCard] = useState<boolean>(true);

  if (!isOpen) return null;

  const gross = Number(grossInput) || 0;
  const rentPaid = Number(rentInput) || 0;
  const section80C = has80C ? 150000 : 0;
  const section80D = has80D ? 25000 : 0;
  const mealVouchers = optMealCard ? MEAL_VOUCHER.annualCap : 0;

  // Derive standard Indian salary structuring:
  // 50% Basic, 20% HRA (if paying rent) or 20% standard, balance Special Allowance
  const basicSalary = Math.round(gross * 0.5);
  const hraReceived = rentPaid > 0 ? Math.round(gross * 0.2) : 0;

  // Run calculation simulation
  const simulatedInput: TaxInput = {
    grossIncome: gross,
    ageGroup: "below60",
    cityType,
    basicSalary,
    hraReceived,
    rentPaid,
    mealVouchers,
    employerNps: 0,
    section80C,
    section80CCD1B: 0,
    section80D,
    section24B: 0,
    savingsInterest: 0,
    professionalTax: 2400,
    reimbursements: 0,
    lta: 0,
    carLease: 0,
    carPerquisite: 0,
  };

  const comparison = gross > 0 ? calculateTaxComparison(simulatedInput) : null;
  const winner = comparison
    ? comparison.betterRegime === "old"
      ? comparison.oldRegime
      : comparison.newRegime
    : null;

  const handleFinish = () => {
    onApply({
      grossIncome: gross,
      basicSalary,
      hraReceived,
      rentPaid,
      cityType,
      section80C,
      section80D,
      mealVouchers,
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="wizard-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-600 text-white">
              <Zap className="w-4 h-4" />
            </span>
            <div>
              <h3 id="wizard-title" className="text-base font-bold text-slate-900">
                60-Second Tax Health Check
              </h3>
              <p className="text-xs text-slate-500">
                Step {step} of 3 — Instant salary & tax optimizer
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Indicators */}
        <div className="px-6 pt-3">
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step >= s ? "bg-blue-600" : "bg-slate-200"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-grow">
          {/* STEP 1: Income & Location */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="wizard-ctc-input"
                  className="block text-sm font-semibold text-slate-900 mb-1"
                >
                  What is your Annual Gross Salary / CTC?
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  Enter your total annual compensation or select a quick preset.
                </p>
                <CurrencyField
                  id="wizard-ctc-input"
                  value={grossInput}
                  onChange={setGrossInput}
                  placeholder="e.g. 18,00,000"
                />

                {/* Preset Chips */}
                <div className="flex flex-wrap gap-2 mt-2.5">
                  {PRESET_CTCS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setGrossInput(String(preset.value))}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                        gross === preset.value
                          ? "bg-blue-50 border-blue-400 text-blue-700 font-semibold"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* City Selection */}
              <div className="pt-3 border-t border-slate-100">
                <label className="block text-sm font-semibold text-slate-900 mb-1">
                  Where do you work/reside?
                </label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setCityType("metro")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      cityType === "metro"
                        ? "border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-sm font-bold text-slate-900 block">
                      Metro City (50% HRA)
                    </span>
                    <span className="text-xs text-slate-500 block mt-0.5">
                      Bengaluru, Mumbai, Delhi, Pune, Hyderabad, Chennai, Kolkata, Ahmedabad
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCityType("nonMetro")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      cityType === "nonMetro"
                        ? "border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-sm font-bold text-slate-900 block">
                      Non-Metro (40% HRA)
                    </span>
                    <span className="text-xs text-slate-500 block mt-0.5">
                      All other cities & towns across India
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Rent & Deductions */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="wizard-rent-input"
                  className="block text-sm font-semibold text-slate-900 mb-1"
                >
                  Annual Rent Paid (for HRA exemption)
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  Enter total rent paid in the year (e.g. ₹25,000/mo = ₹3,00,000/year).
                </p>
                <CurrencyField
                  id="wizard-rent-input"
                  value={rentInput}
                  onChange={setRentInput}
                  placeholder="e.g. 3,00,000"
                />

                {/* Rent Preset Chips */}
                <div className="flex flex-wrap gap-2 mt-2.5">
                  {PRESET_RENTS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setRentInput(String(preset.value))}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                        rentPaid === preset.value
                          ? "bg-blue-50 border-blue-400 text-blue-700 font-semibold"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Deductions Checkboxes */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <span className="block text-sm font-semibold text-slate-900">
                  Quick Tax-Saving Profile
                </span>

                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-100/60 transition-colors">
                  <input
                    type="checkbox"
                    checked={has80C}
                    onChange={(e) => setHas80C(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-900 block">
                      Section 80C Full Limit (₹1,50,000)
                    </span>
                    <span className="text-slate-500">
                      Includes EPF, ELSS mutual funds, PPF, Term Insurance, Life Insurance.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-100/60 transition-colors">
                  <input
                    type="checkbox"
                    checked={has80D}
                    onChange={(e) => setHas80D(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-900 block">
                      Section 80D Health Insurance (₹25,000)
                    </span>
                    <span className="text-slate-500">
                      Medical insurance premium for self and family.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-100/60 transition-colors">
                  <input
                    type="checkbox"
                    checked={optMealCard}
                    onChange={(e) => setOptMealCard(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-900 block">
                      Tax-Free Meal Vouchers / Sodexo (₹52,800)
                    </span>
                    <span className="text-slate-500">
                      Rule 15(5)(a) ₹200/day tax exemption (valid in BOTH regimes).
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* STEP 3: Instant Verdict & Strategy */}
          {step === 3 && comparison && winner && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-900 text-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-500/30">
                    <Sparkles className="w-3.5 h-3.5" />
                    Recommended: {comparison.betterRegime === "new" ? "New Tax Regime" : "Old Tax Regime"}
                  </span>
                  {comparison.difference !== 0 && (
                    <span className="text-xs font-semibold text-emerald-300">
                      Saves {formatCurrency(Math.abs(comparison.difference))}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-800">
                  <div>
                    <span className="text-xs text-slate-400 block">Monthly Take-Home</span>
                    <p className="text-2xl font-bold text-white tabular-nums mt-0.5">
                      {formatCurrency(winner.takeHome / 12)}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Total Annual Tax</span>
                    <p className="text-2xl font-bold text-emerald-400 tabular-nums mt-0.5">
                      {formatCurrency(winner.totalTax)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Side by side summary */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="font-bold text-slate-900 block mb-1">New Regime</span>
                  <div className="space-y-1 text-slate-600">
                    <div className="flex justify-between">
                      <span>Standard Ded:</span>
                      <span className="font-medium text-slate-900">₹75,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax Payable:</span>
                      <span className="font-bold text-slate-900">{formatCurrency(comparison.newRegime.totalTax)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="font-bold text-slate-900 block mb-1">Old Regime</span>
                  <div className="space-y-1 text-slate-600">
                    <div className="flex justify-between">
                      <span>Deductions:</span>
                      <span className="font-medium text-slate-900">{formatCurrency(comparison.oldRegime.totalDeductions + comparison.oldRegime.totalExemptions)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax Payable:</span>
                      <span className="font-bold text-slate-900">{formatCurrency(comparison.oldRegime.totalTax)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200/70 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p>
                  We have auto-structured your salary into 50% Basic ({formatCurrency(basicSalary)}), HRA ({formatCurrency(hraReceived)}), and exemptions. Clicking below will load this into your active profile.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 px-3 py-2 rounded-lg transition-colors"
            >
              Skip
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              disabled={gross <= 0}
              onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded-lg transition-colors shadow-2xs"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg transition-colors shadow-2xs"
            >
              <Sparkles className="w-4 h-4" />
              Apply to Profile & Explore
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
