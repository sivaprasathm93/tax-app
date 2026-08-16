import { ShareListing } from "../types";

/**
 * Capital gains on shares, as aligned by the Finance (No. 2) Act, 2024 and
 * carried into the Income-tax Act, 2025.
 *
 * The 2024 rationalisation did two things that matter to an employee holding
 * RSUs: it took long-term gains on all assets to a single 12.5% rate, and it
 * cut the holding period tests to two - twelve months for listed securities,
 * twenty-four for everything else. Indexation went with it.
 */
export const STCG_RATE = 20;
export const LTCG_RATE = 12.5;

/**
 * Section 112A shields the first Rs 1,25,000 of long-term gains on listed
 * equity in a year. It is a single annual allowance across every such gain,
 * not one per holding.
 */
export const LTCG_EXEMPTION = 125000;

/**
 * Holding period after which a gain is long-term. Foreign shares - the RSUs
 * most Indian tech employees actually hold - are unlisted for this purpose
 * however heavily traded they are on their home exchange, so they need the
 * full twenty-four months.
 */
export const HOLDING_MONTHS: Record<ShareListing, number> = {
  indianListed: 12,
  foreignOrUnlisted: 24,
};

/**
 * Foreign shares are not listed on a recognised Indian stock exchange, so
 * neither the concessional 112A treatment nor its Rs 1.25 lakh exemption
 * applies. Short-term gains on them are taxed at slab rates rather than the
 * flat 20% that section 111A charges on listed equity.
 */
export const SECTION_112A_APPLIES: Record<ShareListing, boolean> = {
  indianListed: true,
  foreignOrUnlisted: false,
};

/**
 * Rule 115 fixes the exchange rate for converting foreign income: the State
 * Bank of India telegraphic transfer buying rate on the relevant date. For a
 * perquisite that is the date of exercise or vesting, and for a capital gain
 * it is the last day of the month preceding the transfer - so the two legs of
 * the same holding can convert at materially different rates.
 */
export const FX_RULE = "Rule 115 — SBI TT buying rate";

export const CURRENCIES = [
  { code: "INR", label: "Indian rupee", symbol: "₹" },
  { code: "USD", label: "US dollar", symbol: "$" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "GBP", label: "Pound sterling", symbol: "£" },
  { code: "SGD", label: "Singapore dollar", symbol: "S$" },
] as const;
