import { STRUCTURE_DEFAULTS } from "./payrollRules";
import {
  Profile,
  RentDetails,
  TakeHomeInput,
  TaxFieldName,
} from "../types";

export const EMPTY_TAX_FORM: Record<TaxFieldName, string> = {
  grossIncome: "",
  basicSalary: "",
  hraReceived: "",
  rentPaid: "",
  mealVouchers: "",
  employerNps: "",
  section80C: "",
  section80CCD1B: "",
  section80D: "",
  section24B: "",
  savingsInterest: "",
  professionalTax: "",
  reimbursements: "",
  lta: "",
  carLease: "",
  carPerquisite: "",
};

export const DEFAULT_TAKE_HOME: TakeHomeInput = {
  annualCtc: 0,
  basicPercent: STRUCTURE_DEFAULTS.basicPercent,
  hraPercent: STRUCTURE_DEFAULTS.hraPercent,
  variablePercent: STRUCTURE_DEFAULTS.variablePercent,
  variablePayout: STRUCTURE_DEFAULTS.variablePayout,
  employerPfBasis: "ceiling",
  vpfPercent: STRUCTURE_DEFAULTS.vpfPercent,
  employerNpsPercent: STRUCTURE_DEFAULTS.employerNpsPercent,
  gratuityInCtc: true,
  insuranceAnnual: 0,
  mealVoucherMonthly: 0,
  flexiAnnual: 0,
  stateId: "none",
  regime: "auto",
};

/** The financial year the app is built around, used to seed receipt periods. */
export const FY_START_MONTH = "2026-04";

export const DEFAULT_RENT: RentDetails = {
  tenantName: "",
  landlordName: "",
  landlordPan: "",
  landlordAddress: "",
  rentalAddress: "",
  monthlyRent: 0,
  fromMonth: FY_START_MONTH,
  months: 12,
  frequency: "monthly",
};

export function emptyProfile(id: string, name: string): Profile {
  return {
    id,
    name,
    updatedAt: Date.now(),
    tax: { ...EMPTY_TAX_FORM },
    ageGroup: "below60",
    cityType: "metro",
    takeHome: { ...DEFAULT_TAKE_HOME },
    rent: { ...DEFAULT_RENT },
    offers: [],
  };
}
