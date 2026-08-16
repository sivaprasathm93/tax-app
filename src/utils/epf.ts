import {
  EPF_INTEREST_RATE,
  MONTHS_PER_YEAR,
  PF_RATE,
  PF_TAXABLE_CONTRIBUTION_THRESHOLD,
  PF_WAGE_CEILING,
} from "../constants/payrollRules";
import { EpfInput, EpfResult, EpfYearRow, PfBasis } from "../types";
import { splitEmployerPf } from "./takeHome";

function pfWage(monthlyBasic: number, basis: PfBasis): number {
  return basis === "ceiling"
    ? Math.min(monthlyBasic, PF_WAGE_CEILING)
    : monthlyBasic;
}

/**
 * Projects the provident fund forward.
 *
 * Interest is credited annually on the running monthly balance, which is what
 * the EPFO actually does - a flat annual rate applied to the closing balance
 * would overstate the corpus, because contributions made in March have not
 * been invested for a year. Working month by month keeps that honest.
 *
 * EPS is tracked separately and deliberately excluded from the corpus: it buys
 * a pension under a formula of its own, and showing it inside the lump sum is
 * the single most common way these projections mislead.
 */
export function calculateEpf(input: EpfInput): EpfResult {
  const rate = input.interestRate > 0 ? input.interestRate : EPF_INTEREST_RATE;
  const monthlyRate = rate / 100 / MONTHS_PER_YEAR;
  const years = Math.max(1, Math.min(Math.round(input.years), 40));

  const firstYearEmployer = splitEmployerPf(
    input.monthlyBasic,
    input.employerBasis
  );
  const firstYearEmployee =
    (pfWage(input.monthlyBasic, input.employeeBasis) * PF_RATE) / 100;
  const firstYearVpf = (input.monthlyBasic * Math.max(0, input.vpfPercent)) / 100;

  const rows: EpfYearRow[] = [];
  let balance = Math.max(0, input.openingBalance);
  let totalContributed = balance;
  let totalInterest = 0;
  let epsTotal = 0;
  let monthlyBasic = Math.max(0, input.monthlyBasic);

  for (let year = 1; year <= years; year++) {
    const employer = splitEmployerPf(monthlyBasic, input.employerBasis);
    const employee = (pfWage(monthlyBasic, input.employeeBasis) * PF_RATE) / 100;
    const vpf = (monthlyBasic * Math.max(0, input.vpfPercent)) / 100;
    const monthlyInflow = employee + vpf + employer.epf;

    // Interest accrues on the opening balance for the full year, and on each
    // month's contribution only for the months it has actually been invested.
    let yearInterest = balance * (rate / 100);
    for (let month = 0; month < MONTHS_PER_YEAR; month++) {
      yearInterest += monthlyInflow * monthlyRate * (MONTHS_PER_YEAR - month);
    }

    const contributions = monthlyInflow * MONTHS_PER_YEAR;
    balance += contributions + yearInterest;
    totalContributed += contributions;
    totalInterest += yearInterest;
    epsTotal += employer.eps * MONTHS_PER_YEAR;

    rows.push({
      year,
      monthlyBasic,
      employeeContribution: employee * MONTHS_PER_YEAR,
      employerEpfContribution: employer.epf * MONTHS_PER_YEAR,
      epsContribution: employer.eps * MONTHS_PER_YEAR,
      vpfContribution: vpf * MONTHS_PER_YEAR,
      interest: yearInterest,
      closingBalance: balance,
    });

    monthlyBasic *= 1 + Math.max(0, input.annualIncrement) / 100;
  }

  // Finance Act 2021: interest on employee contributions above Rs 2.5 lakh in
  // a year is taxable, and the EPFO holds the excess in a separate taxable
  // sub-account. VPF is what usually pushes someone over.
  const annualEmployeeContribution =
    (firstYearEmployee + firstYearVpf) * MONTHS_PER_YEAR;
  const taxableContribution = Math.max(
    0,
    annualEmployeeContribution - PF_TAXABLE_CONTRIBUTION_THRESHOLD
  );

  return {
    monthly: {
      employee: firstYearEmployee,
      vpf: firstYearVpf,
      employerEpf: firstYearEmployer.epf,
      eps: firstYearEmployer.eps,
      total: firstYearEmployee + firstYearVpf + firstYearEmployer.total,
    },
    annualEmployeeContribution,
    taxableContribution,
    // Charged on the average balance of the taxable sub-account over the year,
    // which for a first year of contributions is roughly half of it.
    taxableInterestFirstYear: (taxableContribution * (rate / 100)) / 2,
    rows,
    corpus: balance,
    totalContributed,
    totalInterest,
    epsTotal,
  };
}

/**
 * The VPF percentage at which the employee's own contribution reaches the
 * Rs 2.5 lakh taxable threshold. Above this, interest on the excess is taxed
 * at slab rates and VPF stops beating a plain fixed deposit for a top-bracket
 * taxpayer.
 */
export function vpfThresholdPercent(
  monthlyBasic: number,
  employeeBasis: PfBasis
): number {
  if (monthlyBasic <= 0) return 0;
  const statutory =
    (pfWage(monthlyBasic, employeeBasis) * PF_RATE) / 100 * MONTHS_PER_YEAR;
  const headroom = PF_TAXABLE_CONTRIBUTION_THRESHOLD - statutory;
  if (headroom <= 0) return 0;
  return (headroom / (monthlyBasic * MONTHS_PER_YEAR)) * 100;
}
