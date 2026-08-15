import { memo } from "react";
import { TaxSlab } from "../types";
import { formatCurrency } from "../utils/format";

interface Props {
  title: string;
  slabs: TaxSlab[];
}

function slabRange(slab: TaxSlab): string {
  if (slab.from === 0) return `Up to ${formatCurrency(slab.upTo ?? 0)}`;
  if (slab.upTo === null) return `Above ${formatCurrency(slab.from)}`;
  return `${formatCurrency(slab.from)} – ${formatCurrency(slab.upTo)}`;
}

export const TaxSlabTable = memo(function TaxSlabTable({ title, slabs }: Props) {
  return (
    <div>
      <h3 className="text-[15px] font-semibold text-slate-900 mb-2">{title}</h3>
      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
        {slabs.map((slab) => (
          <li
            key={slab.from}
            className="flex items-center justify-between gap-3 px-3.5 py-2 text-sm"
          >
            <span className="text-[color:var(--ink-secondary)]">
              {slabRange(slab)}
            </span>
            <span className="font-semibold text-slate-900 tabular-nums">
              {slab.rate}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
});
