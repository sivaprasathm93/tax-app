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
  return `${formatCurrency(slab.from)} - ${formatCurrency(slab.upTo)}`;
}

export const TaxSlabTable = memo(function TaxSlabTable({ title, slabs }: Props) {
  return (
    <div>
      <h3 className="text-base font-semibold text-blue-900 mb-3">{title}</h3>
      <ul className="divide-y divide-blue-100 rounded-lg border border-blue-100 bg-white/70">
        {slabs.map((slab) => (
          <li
            key={slab.from}
            className="flex items-center justify-between px-4 py-2.5 text-sm"
          >
            <span className="text-blue-800">{slabRange(slab)}</span>
            <span className="font-semibold text-blue-900 tabular-nums">
              {slab.rate}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
});
