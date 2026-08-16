import { useState } from "react";
import { formatCurrency, formatPercent } from "../../utils/format";

export interface DonutSegment {
  key: string;
  label: string;
  amount: number;
  color: string;
  bgClass?: string;
}

interface Props {
  total: number;
  segments: DonutSegment[];
  centerLabel?: string;
  centerSub?: string;
  size?: number;
}

export function IncomeFlowDonut({
  total,
  segments,
  centerLabel,
  centerSub = "Annual Total",
  size = 200,
}: Props) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  if (total <= 0) return null;

  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let accumulatedOffset = 0;

  const activeSegment = segments.find((s) => s.key === hoveredKey);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      {/* SVG Donut */}
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          {/* Base track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="var(--viz-track)"
            strokeWidth={strokeWidth}
          />

          {/* Slices */}
          {segments.map((segment) => {
            if (segment.amount <= 0) return null;
            const percentage = segment.amount / total;
            const dashLength = percentage * circumference;
            const strokeDasharray = `${dashLength} ${circumference - dashLength}`;
            const strokeDashoffset = -accumulatedOffset;
            accumulatedOffset += dashLength;

            const isHovered = hoveredKey === segment.key;

            return (
              <circle
                key={segment.key}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={segment.color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setHoveredKey(segment.key)}
                onMouseLeave={() => setHoveredKey(null)}
                style={{
                  filter: isHovered
                    ? "drop-shadow(0 2px 6px rgba(0,0,0,0.15))"
                    : undefined,
                }}
              />
            );
          })}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
          <span className="text-[11px] font-medium text-[color:var(--ink-muted)] uppercase tracking-wider">
            {activeSegment ? activeSegment.label : centerSub}
          </span>
          <span className="text-base sm:text-lg font-bold text-slate-900 tabular-nums">
            {activeSegment
              ? formatCurrency(activeSegment.amount)
              : centerLabel ?? formatCurrency(total)}
          </span>
          {activeSegment && (
            <span className="text-xs font-semibold text-blue-700 tabular-nums">
              {formatPercent((activeSegment.amount / total) * 100)}
            </span>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="w-full space-y-2 text-xs">
        {segments.map((segment) => {
          if (segment.amount <= 0) return null;
          const pct = ((segment.amount / total) * 100).toFixed(1);
          const isHovered = hoveredKey === segment.key;

          return (
            <div
              key={segment.key}
              onMouseEnter={() => setHoveredKey(segment.key)}
              onMouseLeave={() => setHoveredKey(null)}
              className={`flex items-center justify-between p-1.5 rounded-lg transition-colors cursor-pointer ${
                isHovered ? "bg-slate-100" : "hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: segment.color }}
                  aria-hidden="true"
                />
                <span className="truncate font-medium text-slate-700">
                  {segment.label}
                </span>
              </div>
              <div className="flex items-center gap-2 tabular-nums shrink-0 font-medium">
                <span className="text-slate-900">
                  {formatCurrency(segment.amount)}
                </span>
                <span className="text-[color:var(--ink-muted)] w-10 text-right">
                  {pct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
