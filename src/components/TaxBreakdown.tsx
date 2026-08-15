import { Fragment, memo, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { ComparisonResult, DeductionLine, Regime, TaxCalculation } from "../types";
import { formatCurrency, formatPercent } from "../utils/format";

interface Props {
  comparison: ComparisonResult;
}

interface MergedLine {
  key: string;
  label: string;
  note?: string;
  old?: number;
  new?: number;
}

/**
 * Lines up the same concept across both regimes by its stable key, so the
 * comparison table can show "HRA exemption: 3,30,000 | not allowed" on one row
 * instead of making the reader diff two separate stacks.
 */
function mergeLines(
  oldRegime: TaxCalculation,
  newRegime: TaxCalculation
): MergedLine[] {
  const order: string[] = [];
  const byKey = new Map<string, MergedLine>();

  const collect = (regime: Regime, lines: DeductionLine[]) => {
    for (const item of lines) {
      let entry = byKey.get(item.key);
      if (!entry) {
        entry = { key: item.key, label: item.label, note: item.note };
        byKey.set(item.key, entry);
        order.push(item.key);
      }
      entry[regime] = item.amount;
    }
  };

  collect("old", [...oldRegime.exemptions, ...oldRegime.deductions]);
  collect("new", [...newRegime.exemptions, ...newRegime.deductions]);

  return order.map((key) => byKey.get(key)!);
}

const cellBase = "text-right tabular-nums whitespace-nowrap";

function Row({
  label,
  note,
  oldValue,
  newValue,
  variant = "default",
  winner,
}: {
  label: string;
  note?: string;
  oldValue: string;
  newValue: string;
  variant?: "default" | "credit" | "subtotal" | "total";
  winner: Regime | "equal";
}) {
  const isTotal = variant === "total";
  const isSubtotal = variant === "subtotal";

  const labelClass = isTotal
    ? "font-semibold text-slate-900"
    : isSubtotal
      ? "font-medium text-slate-900"
      : "text-[color:var(--ink-secondary)]";

  const valueClass = (regime: Regime) => {
    const emphasised = winner === regime;
    if (isTotal) {
      return `${cellBase} font-semibold ${
        emphasised ? "text-slate-900" : "text-[color:var(--ink-secondary)]"
      }`;
    }
    if (variant === "credit") {
      return `${cellBase} text-[color:var(--ink-success)]`;
    }
    if (isSubtotal) return `${cellBase} font-medium text-slate-900`;
    return `${cellBase} text-slate-800`;
  };

  return (
    <tr
      className={
        isTotal
          ? "border-t-2 border-slate-300"
          : isSubtotal
            ? "border-t border-slate-200"
            : ""
      }
    >
      <th
        scope="row"
        className={`text-left font-normal py-2 pr-3 ${labelClass}`}
      >
        <span className={isTotal ? "text-base" : "text-sm"}>{label}</span>
        {note && (
          <span className="block text-xs text-[color:var(--ink-muted)]">
            {note}
          </span>
        )}
      </th>
      <td
        className={`py-2 px-3 text-sm ${valueClass("old")} ${
          winner === "old" ? "bg-blue-50/60" : ""
        } ${isTotal ? "text-base" : ""}`}
      >
        {oldValue}
      </td>
      <td
        className={`py-2 pl-3 text-sm ${valueClass("new")} ${
          winner === "new" ? "bg-blue-50/60" : ""
        } ${isTotal ? "text-base" : ""}`}
      >
        {newValue}
      </td>
    </tr>
  );
}

/**
 * Renders its own empty value cells rather than spanning all three columns, so
 * the winning column's tint runs as one continuous band down the table instead
 * of breaking at every heading.
 */
function GroupHeading({
  label,
  winner,
}: {
  label: string;
  winner: Regime | "equal";
}) {
  return (
    <tr>
      <td className="pt-5 pb-1 text-xs font-semibold uppercase tracking-wider text-[color:var(--ink-muted)]">
        {label}
      </td>
      <td className={winner === "old" ? "bg-blue-50/60" : ""} />
      <td className={winner === "new" ? "bg-blue-50/60" : ""} />
    </tr>
  );
}

const SlabTable = memo(function SlabTable({
  title,
  data,
}: {
  title: string;
  data: TaxCalculation;
}) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-slate-900 mb-2">{title}</h4>
      {data.slabwiseTax.length === 0 ? (
        <p className="text-sm text-[color:var(--ink-secondary)]">
          No taxable income after deductions.
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wider text-[color:var(--ink-muted)]">
              <th scope="col" className="text-left font-medium pb-2">
                Slab
              </th>
              <th scope="col" className="text-right font-medium pb-2">
                Income
              </th>
              <th scope="col" className="text-right font-medium pb-2">
                Tax
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.slabwiseTax.map((item) => (
              <tr key={item.slab.from}>
                <td className="py-2 pr-3 text-[color:var(--ink-secondary)]">
                  {formatCurrency(item.slab.from)} –{" "}
                  {item.slab.upTo ? formatCurrency(item.slab.upTo) : "above"}
                  <span className="block text-xs text-[color:var(--ink-muted)]">
                    @{item.slab.rate}%
                  </span>
                </td>
                <td className={`py-2 px-3 text-slate-800 ${cellBase}`}>
                  {formatCurrency(item.amount)}
                </td>
                <td
                  className={`py-2 pl-3 font-medium text-slate-900 ${cellBase}`}
                >
                  {formatCurrency(item.tax)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
});

export const TaxBreakdown = memo(function TaxBreakdown({ comparison }: Props) {
  const { oldRegime, newRegime, betterRegime } = comparison;
  const [showSlabs, setShowSlabs] = useState(false);
  const lines = useMemo(
    () => mergeLines(oldRegime, newRegime),
    [oldRegime, newRegime]
  );

  const money = (value: number | undefined, credit = false) =>
    value === undefined || value === 0
      ? "—"
      : credit
        ? `- ${formatCurrency(value)}`
        : formatCurrency(value);

  const taxRows: { label: string; note?: string; old: number; new: number; credit?: boolean }[] =
    [
      { label: "Tax on slabs", old: oldRegime.taxBeforeRebate, new: newRegime.taxBeforeRebate },
      {
        label: "Rebate u/s 87A",
        old: oldRegime.rebate,
        new: newRegime.rebate,
        credit: true,
      },
      {
        label: "Marginal relief u/s 87A",
        old: oldRegime.rebateMarginalRelief,
        new: newRegime.rebateMarginalRelief,
        credit: true,
      },
      { label: "Surcharge", old: oldRegime.surcharge, new: newRegime.surcharge },
      {
        label: "Marginal relief on surcharge",
        old: oldRegime.surchargeMarginalRelief,
        new: newRegime.surchargeMarginalRelief,
        credit: true,
      },
      {
        label: "Health & Education Cess",
        note: "4%",
        old: oldRegime.cess,
        new: newRegime.cess,
      },
    ].filter((row) => row.old > 0 || row.new > 0);

  return (
    <section
      id="breakdown"
      className="rounded-2xl border border-slate-200 bg-white shadow-sm scroll-mt-6"
    >
      <div className="px-5 sm:px-7 pt-6 pb-2">
        <h2 className="text-lg font-semibold text-slate-900">
          How this was calculated
        </h2>
        <p className="mt-1 text-sm text-[color:var(--ink-secondary)]">
          Every line both regimes apply, side by side. A dash means the regime
          does not allow that relief.
        </p>
      </div>

      <div className="px-5 sm:px-7 pb-6 overflow-x-auto">
        {/* Capped so the row label and its numbers stay close enough to track
            across; the card itself is page-width. */}
        <table className="w-full max-w-3xl min-w-[420px] border-collapse">
          <caption className="sr-only">
            Old and new tax regime compared line by line
          </caption>
          <colgroup>
            <col />
            <col className="w-[26%]" />
            <col className="w-[26%]" />
          </colgroup>
          <thead>
            <tr>
              <td />
              <th
                scope="col"
                className={`text-right text-sm font-semibold py-2 px-3 ${
                  betterRegime === "old"
                    ? "bg-blue-50/60 text-slate-900"
                    : "text-[color:var(--ink-secondary)]"
                }`}
              >
                Old regime
              </th>
              <th
                scope="col"
                className={`text-right text-sm font-semibold py-2 pl-3 ${
                  betterRegime === "new"
                    ? "bg-blue-50/60 text-slate-900"
                    : "text-[color:var(--ink-secondary)]"
                }`}
              >
                New regime
              </th>
            </tr>
          </thead>
          <tbody>
            <Row
              label="Gross income"
              oldValue={formatCurrency(oldRegime.grossIncome)}
              newValue={formatCurrency(newRegime.grossIncome)}
              winner={betterRegime}
            />

            <GroupHeading
              label="Less: exemptions & deductions"
              winner={betterRegime}
            />
            {lines.map((item) => (
              <Fragment key={item.key}>
                <Row
                  label={item.label}
                  note={item.note}
                  oldValue={money(item.old, true)}
                  newValue={money(item.new, true)}
                  variant="credit"
                  winner={betterRegime}
                />
              </Fragment>
            ))}

            <Row
              label="Taxable income"
              oldValue={formatCurrency(oldRegime.taxableIncome)}
              newValue={formatCurrency(newRegime.taxableIncome)}
              variant="subtotal"
              winner={betterRegime}
            />

            <GroupHeading label="Tax" winner={betterRegime} />
            {taxRows.map((row) => (
              <Row
                key={row.label}
                label={row.label}
                note={row.note}
                oldValue={money(row.old, row.credit)}
                newValue={money(row.new, row.credit)}
                variant={row.credit ? "credit" : "default"}
                winner={betterRegime}
              />
            ))}

            <Row
              label="Total tax"
              oldValue={formatCurrency(oldRegime.totalTax)}
              newValue={formatCurrency(newRegime.totalTax)}
              variant="total"
              winner={betterRegime}
            />
            <Row
              label="Effective rate"
              oldValue={formatPercent(oldRegime.effectiveRate)}
              newValue={formatPercent(newRegime.effectiveRate)}
              winner={betterRegime}
            />
            <Row
              label="Take-home pay"
              oldValue={formatCurrency(oldRegime.takeHome)}
              newValue={formatCurrency(newRegime.takeHome)}
              winner={betterRegime}
            />
          </tbody>
        </table>
      </div>

      <div className="border-t border-slate-100">
        <button
          type="button"
          onClick={() => setShowSlabs((value) => !value)}
          aria-expanded={showSlabs}
          aria-controls="slab-detail"
          className="w-full flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-medium
                     text-blue-700 hover:bg-slate-50 transition-colors"
        >
          {showSlabs ? "Hide slab-by-slab detail" : "Show slab-by-slab detail"}
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              showSlabs ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          />
        </button>

        {showSlabs && (
          <div
            id="slab-detail"
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-5 sm:px-7 pb-7 pt-1"
          >
            <SlabTable title="Old regime" data={oldRegime} />
            <SlabTable title="New regime" data={newRegime} />
          </div>
        )}
      </div>
    </section>
  );
});
