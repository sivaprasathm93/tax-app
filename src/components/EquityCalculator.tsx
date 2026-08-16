import { useCallback, useMemo, useState } from "react";
import { AlertTriangle, Clock, Info, LineChart, TrendingUp } from "lucide-react";
import { DateField } from "./DateField";
import { FormSection } from "./FormSection";
import { Select } from "./Select";
import { Card } from "./ui/Card";
import { EmptyState } from "./ui/EmptyState";
import { HeroResult } from "./ui/HeroResult";
import { Note } from "./ui/Note";
import { NumberField } from "./ui/NumberField";
import { StatRow } from "./ui/StatRow";
import { ToolLayout } from "./ui/ToolLayout";
import { calculateEquity, daysToLongTerm } from "../utils/equity";
import {
  CURRENCIES,
  FX_RULE,
  HOLDING_MONTHS,
  LTCG_EXEMPTION,
  LTCG_RATE,
  STCG_RATE,
} from "../constants/equityRules";
import { EquityInput, EquityKind, ShareListing } from "../types";
import { formatCurrency, formatNumber } from "../utils/format";

const KIND_LABEL: Record<EquityKind, string> = {
  rsu: "RSU — restricted stock units",
  esop: "ESOP — stock options you exercise",
  espp: "ESPP — discounted share purchase",
};

const KIND_HINT: Record<EquityKind, string> = {
  rsu: "You paid nothing, so the whole market value on vesting is a perquisite.",
  esop: "The perquisite is the spread between market value and your exercise price.",
  espp: "The perquisite is the discount — market value less what you were charged.",
};

const EMPTY: Record<string, string> = {
  shares: "",
  fmvOnVest: "",
  exercisePrice: "",
  salePrice: "",
  marginalRate: "30",
  fxRate: "",
  sellToCoverShares: "",
};

export default function EquityCalculator() {
  const [form, setForm] = useState(EMPTY);
  const [dates, setDates] = useState({ vestDate: "", saleDate: "" });
  const [kind, setKind] = useState<EquityKind>("rsu");
  const [listing, setListing] = useState<ShareListing>("foreignOrUnlisted");
  const [currency, setCurrency] = useState<string>("USD");

  const handleChange = useCallback((name: string, value: string) => {
    setForm((previous) => ({ ...previous, [name]: value }));
  }, []);

  const handleDate = useCallback((name: string, value: string) => {
    setDates((previous) => ({ ...previous, [name]: value }));
  }, []);

  const isRupee = currency === "INR";
  const symbol =
    CURRENCIES.find((item) => item.code === currency)?.symbol ?? "₹";

  const input = useMemo<EquityInput>(
    () => ({
      kind,
      listing,
      shares: Number(form.shares) || 0,
      // RSUs cost the employee nothing, so the exercise price is forced to
      // zero rather than left as whatever was typed before switching kind.
      fmvOnVest: Number(form.fmvOnVest) || 0,
      exercisePrice: kind === "rsu" ? 0 : Number(form.exercisePrice) || 0,
      salePrice: Number(form.salePrice) || 0,
      vestDate: dates.vestDate,
      saleDate: dates.saleDate,
      marginalRate: Number(form.marginalRate) || 0,
      fxRate: isRupee ? 1 : Number(form.fxRate) || 0,
      currency,
      sellToCoverShares: Number(form.sellToCoverShares) || 0,
    }),
    [form, dates, kind, listing, currency, isRupee]
  );

  const ready =
    input.shares > 0 && input.fmvOnVest > 0 && (isRupee || input.fxRate > 0);

  const result = useMemo(
    () => (ready ? calculateEquity(input) : null),
    [input, ready]
  );

  const waitDays = result ? daysToLongTerm(result) : 0;

  return (
    <ToolLayout
      form={
        <Card
          title="Your grant"
          description="What vested, what it was worth, and what you paid for it."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              id="kind"
              label="Type of grant"
              value={kind}
              onChange={(value) => setKind(value as EquityKind)}
              hint={KIND_HINT[kind]}
            >
              {(Object.keys(KIND_LABEL) as EquityKind[]).map((id) => (
                <option key={id} value={id}>
                  {KIND_LABEL[id]}
                </option>
              ))}
            </Select>
            <Select
              id="listing"
              label="Where the shares are listed"
              value={listing}
              onChange={(value) => setListing(value as ShareListing)}
              hint={`Long-term after ${HOLDING_MONTHS[listing]} months.`}
            >
              <option value="foreignOrUnlisted">
                Foreign or unlisted — Google, Microsoft, Amazon, Meta
              </option>
              <option value="indianListed">
                Listed on an Indian exchange
              </option>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <NumberField
              id="shares"
              label="Shares vested"
              value={form.shares}
              onChange={handleChange}
              suffix="shares"
              placeholder="0"
            />
            <Select
              id="currency"
              label="Grant currency"
              value={currency}
              onChange={setCurrency}
              hint={isRupee ? undefined : FX_RULE}
            >
              {CURRENCIES.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label} ({item.symbol})
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <NumberField
              id="fmvOnVest"
              label={`Market value per share (${symbol})`}
              value={form.fmvOnVest}
              onChange={handleChange}
              decimal
              placeholder="0"
              hint="On the vesting or exercise date."
            />
            {kind === "rsu" ? (
              <NumberField
                id="salePrice"
                label={`Sale price per share (${symbol})`}
                value={form.salePrice}
                onChange={handleChange}
                decimal
                hint="Leave blank if you are still holding."
              />
            ) : (
              <NumberField
                id="exercisePrice"
                label={`${kind === "espp" ? "Price you were charged" : "Exercise price"} (${symbol})`}
                value={form.exercisePrice}
                onChange={handleChange}
                decimal
                hint={
                  kind === "espp"
                    ? "After the employee discount."
                    : "The strike price fixed at grant."
                }
              />
            )}
          </div>

          {kind !== "rsu" && (
            <div className="mt-4">
              <NumberField
                id="salePrice"
                label={`Sale price per share (${symbol})`}
                value={form.salePrice}
                onChange={handleChange}
                decimal
                hint="Leave blank if you are still holding."
              />
            </div>
          )}

          {!isRupee && (
            <div className="mt-4">
              <NumberField
                id="fxRate"
                label={`Exchange rate (₹ per ${symbol}1)`}
                value={form.fxRate}
                onChange={handleChange}
                decimal
                placeholder="0"
                hint={`${FX_RULE}, on the vesting date. Required before anything can be computed.`}
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <DateField
              id="vestDate"
              label="Vesting / exercise date"
              value={dates.vestDate}
              onChange={handleDate}
              max={dates.saleDate || undefined}
            />
            <DateField
              id="saleDate"
              label="Sale date"
              value={dates.saleDate}
              onChange={handleDate}
              min={dates.vestDate || undefined}
              hint="Leave blank if you have not sold."
            />
          </div>
        </Card>
      }
      result={
        result === null ? (
          <EmptyState
            icon={<LineChart className="w-6 h-6" />}
            title="Your equity tax appears here"
          >
            Enter the shares vested and their market value — and the exchange
            rate, for a foreign grant. Both stages of tax are worked out as you
            type.
          </EmptyState>
        ) : (
          <HeroResult
            badge={result.sold ? "Total tax" : "Tax on vesting"}
            badgeTone="neutral"
            value={formatCurrency(result.totalTax)}
            caption={
              result.sold
                ? "perquisite tax plus capital gains tax"
                : "perquisite tax withheld by your employer"
            }
            footnote={
              result.sold ? (
                <span className="text-[color:var(--ink-secondary)]">
                  {formatCurrency(result.netProceeds)} reaches you from the sale,
                  after capital gains tax.
                </span>
              ) : (
                <span className="text-[color:var(--ink-secondary)]">
                  You keep {formatNumber(result.netSharesRetained)} shares after
                  sell-to-cover.
                </span>
              )
            }
          >
            <dl className="px-6 py-3 border-t border-slate-100 divide-y divide-slate-100">
              <StatRow
                label="Perquisite on vesting"
                value={formatCurrency(result.perquisite)}
                note="Taxed as salary at your slab rate"
              />
              <StatRow
                label="Tax on the perquisite"
                value={formatCurrency(result.perquisiteTax)}
                strong
              />
              {result.sold && (
                <>
                  <StatRow
                    label="Capital gain"
                    value={formatCurrency(result.capitalGain)}
                    note={`Over the vesting value — not the exercise price`}
                  />
                  {result.exemptGain > 0 && (
                    <StatRow
                      label="Exempt under 112A"
                      value={`- ${formatCurrency(result.exemptGain)}`}
                      credit
                    />
                  )}
                  <StatRow
                    label={`${result.isLongTerm ? "Long" : "Short"}-term tax at ${result.capitalGainsRate}%`}
                    value={formatCurrency(result.capitalGainsTax)}
                    strong
                  />
                </>
              )}
            </dl>
            {result.sold && (
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60">
                <p className="inline-flex items-start gap-1.5 text-xs text-[color:var(--ink-muted)]">
                  <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    Held {formatNumber(result.holdingDays)} days.{" "}
                    {result.isLongTerm
                      ? `Past the ${result.holdingMonthsRequired}-month test, so the long-term rate applies.`
                      : `The ${result.holdingMonthsRequired}-month test needs about ${formatNumber(waitDays)} more days.`}
                  </span>
                </p>
              </div>
            )}
          </HeroResult>
        )
      }
    >
      {/* Only once a sell-to-cover has actually been entered. With the field
          left blank the "shortfall" is just the whole tax bill, and reporting
          that as a payroll recovery would be alarming and wrong. */}
      {result && input.sellToCoverShares > 0 && result.tdsShortfall > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-white p-5">
          <Note tone="warn" icon={<AlertTriangle className="w-3.5 h-3.5" />}>
            The {formatNumber(input.sellToCoverShares)} shares sold to cover tax
            raised {formatCurrency(result.sellToCoverValue)}, against{" "}
            {formatCurrency(result.perquisiteTax)} of tax due. The{" "}
            <strong>{formatCurrency(result.tdsShortfall)}</strong> shortfall is
            recovered from your salary in the same month — which is why a
            vesting month&apos;s payslip can look alarming.
          </Note>
        </div>
      )}

      {result && !result.isLongTerm && result.sold && result.capitalGain > 0 && (
        <div className="rounded-2xl border border-blue-200 bg-white p-5">
          <Note tone="info" icon={<TrendingUp className="w-3.5 h-3.5" />}>
            Selling about {formatNumber(waitDays)} days later would have made
            this long-term:{" "}
            {formatCurrency((result.taxableGain * LTCG_RATE) / 100)} of tax
            instead of {formatCurrency(result.capitalGainsTax)}. Worth weighing
            against the price risk of holding — this is arithmetic, not advice.
          </Note>
        </div>
      )}

      <FormSection
        title="Sell-to-cover"
        description="Shares your employer sold to fund the withholding"
        summary={
          input.sellToCoverShares > 0
            ? `${formatNumber(input.sellToCoverShares)} shares sold`
            : "Enter the shares your broker sold on vesting"
        }
        icon={<LineChart className="w-[18px] h-[18px]" />}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberField
            id="sellToCoverShares"
            label="Shares sold to cover tax"
            value={form.sellToCoverShares}
            onChange={handleChange}
            suffix="shares"
            max={input.shares}
            hint="From your broker's confirmation on the vesting date."
          />
          <NumberField
            id="marginalRate"
            label="Your marginal tax rate"
            value={form.marginalRate}
            onChange={handleChange}
            suffix="%"
            max={45}
            decimal
            hint="Including surcharge and cess — 31.2% is the common figure at 30%."
          />
        </div>
      </FormSection>

      <FormSection
        title="How employee equity is taxed"
        description="Two stages, two bases, and the mistake that costs you twice"
        summary="Two stages, two bases, and the mistake that costs you twice"
        icon={<Info className="w-[18px] h-[18px]" />}
      >
        <div className="text-sm space-y-3 text-[color:var(--ink-secondary)]">
          <p>
            <strong className="text-slate-900">Stage one, on vesting.</strong>{" "}
            The market value less whatever you paid is a perquisite, taxed as
            salary at your slab rate. Your employer must withhold on it, and
            almost always does so by selling part of the grant — you never see
            the cash, but it appears in your Form 16 as salary.
          </p>
          <p>
            <strong className="text-slate-900">Stage two, on sale.</strong> The
            gain is measured over the value already taxed at stage one, not over
            what you paid. Using the exercise price as the cost base is the most
            common error on an ITR carrying RSUs, and it means paying tax twice
            on the same money.
          </p>
          <p>
            <strong className="text-slate-900">Foreign shares are unlisted.</strong>{" "}
            However heavily a US share trades, it is not listed on a recognised
            Indian exchange — so it needs{" "}
            {HOLDING_MONTHS.foreignOrUnlisted} months to go long-term rather
            than {HOLDING_MONTHS.indianListed}, gets no benefit from section
            112A&apos;s {formatCurrency(LTCG_EXEMPTION)} shield, and its
            short-term gains are charged at your slab rate rather than the{" "}
            {STCG_RATE}% that section 111A applies to listed equity.
          </p>
          <p>
            <strong className="text-slate-900">The exchange rate.</strong>{" "}
            {FX_RULE}. For the perquisite it is the rate on the vesting date;
            for the capital gain it is the last day of the month before the
            sale. They will not be the same, and the difference is itself part
            of your gain.
          </p>
          <p>
            <strong className="text-slate-900">Schedule FA.</strong> Foreign
            shares held at any point in the calendar year must be reported in
            the Foreign Assets schedule of your return, whether or not you sold
            and whether or not there was any gain. The penalty for omitting them
            is not proportionate to the holding.
          </p>
        </div>
      </FormSection>
    </ToolLayout>
  );
}
