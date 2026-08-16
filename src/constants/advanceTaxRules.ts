/**
 * Advance tax and the interest that follows from getting it wrong.
 *
 * A salaried taxpayer whose only income is salary never meets this: the
 * employer's TDS discharges the liability. It bites the moment there is a
 * second source - interest, capital gains, freelance receipts, dividends -
 * because nobody withholds enough on those.
 */

/** Below this residual liability, no advance tax is due at all. */
export const ADVANCE_TAX_THRESHOLD = 10000;

/**
 * Section 211 instalments. The percentages are cumulative: by 15 September the
 * taxpayer must have paid 45% of the year's liability in total, not a further
 * 45% on top of June's 15%.
 */
export const INSTALMENTS = [
  { label: "First instalment", dueOn: "2026-06-15", cumulativePercent: 15 },
  { label: "Second instalment", dueOn: "2026-09-15", cumulativePercent: 45 },
  { label: "Third instalment", dueOn: "2026-12-15", cumulativePercent: 75 },
  { label: "Fourth instalment", dueOn: "2027-03-15", cumulativePercent: 100 },
] as const;

/**
 * Section 234C charges 1% a month for three months on each of the first three
 * shortfalls, and one month on the last. Sections 234A and 234B run at the
 * same 1% a month on the unpaid balance.
 */
export const INTEREST_RATE_PER_MONTH = 1;
export const MONTHS_CHARGED_234C = [3, 3, 3, 1] as const;

/**
 * Section 234C gives a 12% and 36% grace on the first two instalments - pay at
 * least that much and no interest is charged even though the target was 15%
 * and 45%. It exists because gains and receipts cannot always be predicted in
 * June.
 */
export const SAFE_HARBOUR_PERCENT = [12, 36, 75, 100] as const;

/**
 * Section 44ADA presumptive taxation: a professional with gross receipts under
 * the ceiling may declare half of them as profit and claim no expenses at all.
 * The ceiling is Rs 75 lakh where at most 5% of receipts are in cash.
 */
export const PRESUMPTIVE_PROFIT_PERCENT = 50;
export const PRESUMPTIVE_RECEIPTS_CEILING = 7500000;

/**
 * Interest on a savings bank account is deductible under section 80TTA, and
 * section 80TTB gives senior citizens a larger allowance that covers fixed
 * deposits too. Both are old regime only.
 */
export const TDS_RATE_ON_INTEREST = 10;

/** Advance tax paid by 31 March still counts; after that it is self-assessment. */
export const FINAL_INSTALMENT_DATE = "2027-03-15";
export const ITR_DUE_DATE = "2027-07-31";
