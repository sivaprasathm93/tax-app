import { useCallback, useMemo } from "react";
import { Briefcase, Info, Plus, Trophy, X } from "lucide-react";
import { CurrencyField } from "./CurrencyField";
import { Select } from "./Select";
import { Note } from "./ui/Note";
import { NumberField } from "./ui/NumberField";
import { useProfile } from "../state/profileContext";
import { compareOffers, emptyOffer } from "../utils/offers";
import { carriedDeductions } from "../utils/takeHome";
import { PT_STATES } from "../constants/payrollRules";
import { OfferInput, OfferResult, PfBasis, TaxInput } from "../types";
import { formatCurrency } from "../utils/format";

const MAX_OFFERS = 4;

/** The rows of the comparison grid, in the order a candidate should read them. */
interface Metric {
  label: string;
  note?: string;
  value: (result: OfferResult) => number;
  /** Where a bigger number is better - most of them, but not tax. */
  higherIsBetter: boolean;
  emphasis?: boolean;
}

const METRICS: Metric[] = [
  {
    label: "Annual CTC",
    note: "What the offer letter says",
    value: (r) => r.input.annualCtc,
    higherIsBetter: true,
  },
  {
    label: "Employer retirals",
    note: "In the CTC, never on your payslip",
    value: (r) => r.takeHome.totalRetirals,
    higherIsBetter: false,
  },
  {
    label: "Gross salary",
    value: (r) => r.takeHome.grossSalary,
    higherIsBetter: true,
  },
  {
    label: "Income tax",
    note: "At the cheaper regime for each",
    value: (r) => r.takeHome.annualTax,
    higherIsBetter: false,
  },
  {
    label: "Monthly in-hand",
    note: "The number that pays your rent",
    value: (r) => r.takeHome.monthlyInHand,
    higherIsBetter: true,
    emphasis: true,
  },
  {
    label: "Equity, a year",
    note: "Grant value spread over the vesting period",
    value: (r) => r.annualEquity,
    higherIsBetter: true,
  },
  {
    label: "Year one, net",
    note: "In-hand plus joining bonus plus post-tax equity",
    value: (r) => r.firstYearNet,
    higherIsBetter: true,
    emphasis: true,
  },
  {
    label: "Year two onward, net",
    note: "Once the joining bonus is gone",
    value: (r) => r.steadyStateNet,
    higherIsBetter: true,
    emphasis: true,
  },
];

function OfferForm({
  offer,
  index,
  onChange,
  onRemove,
}: {
  offer: OfferInput;
  index: number;
  onChange: (id: string, patch: Partial<OfferInput>) => void;
  onRemove: (id: string) => void;
}) {
  const set = (patch: Partial<OfferInput>) => onChange(offer.id, patch);

  const money = (name: string, value: string) =>
    set({ [name]: value === "" ? 0 : Number(value) });
  const percent = (name: string, value: string) =>
    set({ [name]: value === "" ? 0 : Number(value) });

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <input
          type="text"
          value={offer.name}
          onChange={(event) => set({ name: event.target.value })}
          aria-label={`Name of offer ${index + 1}`}
          className="min-w-0 flex-1 text-[15px] font-semibold text-slate-900 bg-transparent
                     border-b border-transparent hover:border-slate-300 focus:border-blue-500
                     focus:outline-none pb-0.5 transition-colors"
        />
        {index > 0 && (
          <button
            type="button"
            onClick={() => onRemove(offer.id)}
            aria-label={`Remove ${offer.name}`}
            className="shrink-0 rounded-lg p-1 text-slate-400 hover:text-slate-700
                       hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <CurrencyField
        id={`ctc-${offer.id}`}
        label="Annual CTC"
        value={offer.annualCtc === 0 ? "" : String(offer.annualCtc)}
        onChange={(_, value) => money("annualCtc", value)}
        placeholder="0"
      />

      <div className="grid grid-cols-2 gap-3 mt-3">
        <NumberField
          id={`basic-${offer.id}`}
          label="Basic"
          value={String(offer.basicPercent)}
          onChange={(_, value) => percent("basicPercent", value)}
          suffix="%"
          max={100}
        />
        <NumberField
          id={`hra-${offer.id}`}
          label="HRA of basic"
          value={String(offer.hraPercent)}
          onChange={(_, value) => percent("hraPercent", value)}
          suffix="%"
          max={100}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 mt-3">
        <NumberField
          id={`variable-${offer.id}`}
          label="Variable"
          value={String(offer.variablePercent)}
          onChange={(_, value) => percent("variablePercent", value)}
          suffix="% CTC"
          max={100}
        />
        <NumberField
          id={`payout-${offer.id}`}
          label="Expected payout"
          value={String(offer.variablePayout)}
          onChange={(_, value) => percent("variablePayout", value)}
          suffix="%"
          max={100}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 mt-3">
        <CurrencyField
          id={`bonus-${offer.id}`}
          label="Joining bonus"
          value={offer.joiningBonus === 0 ? "" : String(offer.joiningBonus)}
          onChange={(_, value) => money("joiningBonus", value)}
        />
        <CurrencyField
          id={`equity-${offer.id}`}
          label="Equity grant"
          value={offer.equityGrant === 0 ? "" : String(offer.equityGrant)}
          onChange={(_, value) => money("equityGrant", value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 mt-3">
        <NumberField
          id={`vest-${offer.id}`}
          label="Vesting over"
          value={String(offer.equityVestYears)}
          onChange={(_, value) => percent("equityVestYears", value)}
          suffix="years"
          min={1}
          max={10}
        />
        <NumberField
          id={`nps-${offer.id}`}
          label="Employer NPS"
          value={String(offer.employerNpsPercent)}
          onChange={(_, value) => percent("employerNpsPercent", value)}
          suffix="% basic"
          max={14}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 mt-3">
        <CurrencyField
          id={`meal-${offer.id}`}
          label="Meal card per month"
          value={
            offer.mealVoucherMonthly === 0
              ? ""
              : String(offer.mealVoucherMonthly)
          }
          onChange={(_, value) => money("mealVoucherMonthly", value)}
        />
        <CurrencyField
          id={`insurance-${offer.id}`}
          label="Insurance premium in CTC"
          value={offer.insuranceAnnual === 0 ? "" : String(offer.insuranceAnnual)}
          onChange={(_, value) => money("insuranceAnnual", value)}
        />
        <Select
          id={`state-${offer.id}`}
          label="State"
          value={offer.stateId}
          onChange={(value) => set({ stateId: value })}
        >
          {PT_STATES.map((state) => (
            <option key={state.id} value={state.id}>
              {state.label}
            </option>
          ))}
        </Select>
        <Select
          id={`pf-${offer.id}`}
          label="PF basis"
          value={offer.employerPfBasis}
          onChange={(value) => set({ employerPfBasis: value as PfBasis })}
        >
          <option value="ceiling">Capped at the ceiling</option>
          <option value="fullBasic">12% of full basic</option>
        </Select>
        <Select
          id={`gratuity-${offer.id}`}
          label="Gratuity in CTC"
          value={offer.gratuityInCtc ? "yes" : "no"}
          onChange={(value) => set({ gratuityInCtc: value === "yes" })}
        >
          <option value="yes">Yes — included</option>
          <option value="no">No</option>
        </Select>
      </div>
    </section>
  );
}

export default function OfferComparison({ input }: { input: TaxInput }) {
  const { profile, update } = useProfile();

  // Seeded on first open rather than stored empty, so the tab is never a
  // blank page with an "add" button.
  const offers = useMemo<OfferInput[]>(() => {
    if (profile.offers.length > 0) return profile.offers;
    return [
      { ...emptyOffer("Current job"), annualCtc: input.grossIncome },
      emptyOffer("Offer A"),
    ];
  }, [profile.offers, input.grossIncome]);

  const setOffers = useCallback(
    (next: OfferInput[]) => update({ offers: next }),
    [update]
  );

  const handleChange = useCallback(
    (id: string, patch: Partial<OfferInput>) => {
      setOffers(
        offers.map((offer) => (offer.id === id ? { ...offer, ...patch } : offer))
      );
    },
    [offers, setOffers]
  );

  const handleRemove = useCallback(
    (id: string) => setOffers(offers.filter((offer) => offer.id !== id)),
    [offers, setOffers]
  );

  const handleAdd = useCallback(() => {
    setOffers([
      ...offers,
      emptyOffer(`Offer ${String.fromCharCode(64 + offers.length)}`),
    ]);
  }, [offers, setOffers]);

  const carried = useMemo(() => carriedDeductions(input), [input]);

  const results = useMemo(
    () => compareOffers(offers, carried),
    [offers, carried]
  );

  const priced = results.filter((result) => result.input.annualCtc > 0);
  const withExtras = priced.filter(
    (result) => result.annualEquity > 0 || result.input.joiningBonus > 0
  );
  const best =
    priced.length > 1
      ? priced.reduce((winner, item) =>
          item.steadyStateNet > winner.steadyStateNet ? item : winner
        )
      : null;

  return (
    <div className="space-y-5">
      {priced.length > 1 && best && (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span
              className="shrink-0 grid place-items-center w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700"
              aria-hidden="true"
            >
              <Trophy className="w-[18px] h-[18px]" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                Best on steady-state cash
              </p>
              <p className="mt-0.5 text-[19px] font-semibold text-slate-900">
                {best.input.name}
              </p>
              <p className="mt-1 text-sm text-[color:var(--ink-secondary)]">
                {formatCurrency(best.takeHome.monthlyInHand)} a month in hand,{" "}
                {formatCurrency(best.steadyStateNet)} a year net from year two —
                once the joining bonus has gone and the variable has paid out at
                the rate you expect.
              </p>
            </div>
          </div>
        </section>
      )}

      {priced.length > 1 && (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 sm:px-6 pt-5 pb-2">
            <h2 className="text-[15px] font-semibold text-slate-900">
              Side by side
            </h2>
            <p className="text-xs text-[color:var(--ink-muted)]">
              Differences are measured against {priced[0].input.name}.
            </p>
          </div>
          <div className="px-5 sm:px-6 pb-6 overflow-x-auto">
            <table className="w-full text-sm min-w-[520px] border-collapse">
              <caption className="sr-only">
                Offers compared on CTC, tax, in-hand pay and net income
              </caption>
              <thead>
                <tr>
                  <td />
                  {priced.map((result) => (
                    <th
                      key={result.input.id}
                      scope="col"
                      className={`text-right text-sm font-semibold py-2 px-3 whitespace-nowrap ${
                        best?.input.id === result.input.id
                          ? "bg-emerald-50/70 text-slate-900"
                          : "text-[color:var(--ink-secondary)]"
                      }`}
                    >
                      {result.input.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {METRICS.map((metric) => {
                  const values = priced.map(metric.value);
                  const target = metric.higherIsBetter
                    ? Math.max(...values)
                    : Math.min(...values);

                  return (
                    <tr
                      key={metric.label}
                      className={
                        metric.emphasis ? "border-t border-slate-200" : ""
                      }
                    >
                      <th
                        scope="row"
                        className={`text-left font-normal py-2 pr-3 ${
                          metric.emphasis
                            ? "font-medium text-slate-900"
                            : "text-[color:var(--ink-secondary)]"
                        }`}
                      >
                        {metric.label}
                        {metric.note && (
                          <span className="block text-xs text-[color:var(--ink-muted)]">
                            {metric.note}
                          </span>
                        )}
                      </th>
                      {priced.map((result, index) => {
                        const value = values[index];
                        const isBest = value === target && priced.length > 1;
                        return (
                          <td
                            key={result.input.id}
                            className={`py-2 px-3 text-right tabular-nums whitespace-nowrap ${
                              best?.input.id === result.input.id
                                ? "bg-emerald-50/70"
                                : ""
                            } ${
                              metric.emphasis && isBest
                                ? "font-semibold text-slate-900"
                                : "text-slate-800"
                            }`}
                          >
                            {formatCurrency(value)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}

                <tr className="border-t-2 border-slate-300">
                  <th
                    scope="row"
                    className="text-left font-semibold text-slate-900 py-2 pr-3"
                  >
                    Monthly in-hand vs {priced[0].input.name}
                  </th>
                  {priced.map((result) => (
                    <td
                      key={result.input.id}
                      className={`py-2 px-3 text-right tabular-nums font-semibold whitespace-nowrap ${
                        best?.input.id === result.input.id
                          ? "bg-emerald-50/70"
                          : ""
                      }`}
                      style={{
                        color:
                          result.deltaMonthlyInHand > 0
                            ? "var(--ink-success)"
                            : result.deltaMonthlyInHand < 0
                              ? "#b45309"
                              : undefined,
                      }}
                    >
                      {result.deltaMonthlyInHand === 0
                        ? "—"
                        : `${result.deltaMonthlyInHand > 0 ? "+" : "−"}${formatCurrency(
                            Math.abs(result.deltaMonthlyInHand)
                          )}`}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          <div className="px-5 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/60">
            <Note tone="info" icon={<Info className="w-3.5 h-3.5" />}>
              {withExtras.length > 0 ? (
                <>
                  Equity and joining bonuses are charged by re-running the
                  whole computation with them included, not at a flat rate —
                  which works out at{" "}
                  {withExtras
                    .map(
                      (r) =>
                        `${r.equityTaxRate.toFixed(1)}% for ${r.input.name}`
                    )
                    .join(" and ")}
                  . What the share is worth on its vesting date is unknowable,
                  so the equity row is valued at grant price: treat it as a
                  stated intention, not a promise.
                </>
              ) : (
                <>
                  Add an equity grant or joining bonus and each is charged as
                  salary in the year it lands, by re-running the whole
                  computation with it included rather than at a flat rate.
                </>
              )}
            </Note>
          </div>
        </section>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {offers.map((offer, index) => (
          <OfferForm
            key={offer.id}
            offer={offer}
            index={index}
            onChange={handleChange}
            onRemove={handleRemove}
          />
        ))}

        {offers.length < MAX_OFFERS && (
          <button
            type="button"
            onClick={handleAdd}
            className="no-print rounded-2xl border-2 border-dashed border-slate-300 bg-white/50
                       p-5 min-h-[180px] grid place-items-center text-sm font-medium text-slate-500
                       hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50/30
                       focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20
                       transition-colors"
          >
            <span className="inline-flex flex-col items-center gap-2">
              <Plus className="w-6 h-6" aria-hidden="true" />
              Add another offer
            </span>
          </button>
        )}
      </div>

      {priced.length <= 1 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
          <span
            className="mx-auto grid place-items-center w-12 h-12 rounded-2xl bg-blue-50 text-blue-600"
            aria-hidden="true"
          >
            <Briefcase className="w-6 h-6" />
          </span>
          <p className="mt-3 text-[15px] font-semibold text-slate-900">
            Add a CTC to at least two offers
          </p>
          <p className="mt-1 text-sm text-[color:var(--ink-secondary)] max-w-md mx-auto">
            The comparison appears once there is something to compare — CTC,
            retirals, tax, monthly in-hand and net income across the first two
            years, side by side.
          </p>
        </div>
      )}
    </div>
  );
}
