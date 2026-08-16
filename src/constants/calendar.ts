import { CalendarEvent } from "../types";

/**
 * The salaried taxpayer's year for FY 2026-27.
 *
 * Dates that are statutory carry a penalty or interest for being missed;
 * the rest are employer or practical deadlines where the cost is only
 * inconvenience - though missing the proof submission window in January is
 * inconvenience measured in a month of over-withheld salary.
 */
export const CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: "regime-election",
    date: "2026-04-01",
    endDate: "2026-04-30",
    title: "Declare your regime to your employer",
    detail:
      "Your HR portal opens the investment declaration for the year. Choosing nothing means the new regime by default. Nothing here is binding — you may still switch when you file.",
    audience: "everyone",
    statutory: false,
  },
  {
    id: "q1-advance",
    date: "2026-06-15",
    title: "First advance tax instalment — 15%",
    detail:
      "Due if your liability after TDS exceeds ₹10,000. Section 234C charges 1% a month on the shortfall, with a grace at 12% rather than 15%.",
    audience: "advanceTax",
    statutory: true,
  },
  {
    id: "form16",
    date: "2026-06-15",
    title: "Form 16 issued by your employer",
    detail:
      "Part A comes from TRACES and Part B from payroll. Check that the gross salary and the deductions allowed match what you declared.",
    audience: "everyone",
    statutory: false,
  },
  {
    id: "itr-previous",
    date: "2026-07-31",
    title: "File your return for FY 2025-26",
    detail:
      "The deadline for the year that has just ended. Filing late costs ₹5,000 under section 234F and forfeits the right to carry losses forward.",
    audience: "everyone",
    statutory: true,
  },
  {
    id: "q2-advance",
    date: "2026-09-15",
    title: "Second advance tax instalment — 45% cumulative",
    detail:
      "Cumulative, not additional: 45% of the year's liability must have been paid in total by this date. The 234C grace here is 36%.",
    audience: "advanceTax",
    statutory: true,
  },
  {
    id: "proof-window",
    date: "2026-12-01",
    endDate: "2027-01-31",
    title: "Investment proof submission window",
    detail:
      "Rent receipts with the landlord's PAN, 80C and 80D receipts, home loan interest certificate, LTA bills. Anything you declared in April and cannot now prove is added back — and the tax on it comes out of February and March salary.",
    audience: "everyone",
    statutory: false,
  },
  {
    id: "q3-advance",
    date: "2026-12-15",
    title: "Third advance tax instalment — 75% cumulative",
    detail:
      "By now three quarters of the year's liability should be paid. Capital gains realised after this date are treated leniently under the 234C proviso.",
    audience: "advanceTax",
    statutory: true,
  },
  {
    id: "final-tds",
    date: "2027-02-01",
    endDate: "2027-02-28",
    title: "Employer trues up your TDS",
    detail:
      "Payroll reconciles what you declared against what you proved and adjusts the last two months' deductions. A February payslip is often much smaller than the eleven before it.",
    audience: "everyone",
    statutory: false,
  },
  {
    id: "q4-advance",
    date: "2027-03-15",
    title: "Fourth advance tax instalment — 100%",
    detail:
      "The whole liability must be paid by today. Anything after this is self-assessment tax and carries interest under section 234B from 1 April.",
    audience: "advanceTax",
    statutory: true,
  },
  {
    id: "year-end",
    date: "2027-03-31",
    title: "Last day to make tax-saving investments",
    detail:
      "80C, 80D and 80CCD(1B) all close with the financial year. An ELSS purchase on 1 April counts towards the next year, not this one.",
    audience: "everyone",
    statutory: true,
  },
  {
    id: "form16-current",
    date: "2027-06-15",
    title: "Form 16 for FY 2026-27",
    detail:
      "Download your AIS and Form 26AS from the income tax portal at the same time and reconcile all three before you file.",
    audience: "everyone",
    statutory: false,
  },
  {
    id: "itr-current",
    date: "2027-07-31",
    title: "File your return for FY 2026-27",
    detail:
      "ITR-1 if salary and one house property; ITR-2 once there are capital gains or foreign shares. This is also your last chance to switch regime for the year.",
    audience: "everyone",
    statutory: true,
  },
  {
    id: "schedule-fa",
    date: "2027-07-31",
    title: "Report foreign shares in Schedule FA",
    detail:
      "Any foreign holding at any point in calendar 2026 must be disclosed, sold or not, gain or none. The penalty for omission is not proportionate to the holding.",
    audience: "equity",
    statutory: true,
  },
];
