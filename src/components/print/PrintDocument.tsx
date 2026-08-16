import { ReactNode } from "react";
import { ASSESSMENT_YEAR, FINANCIAL_YEAR } from "../../constants/taxRules";

interface Props {
  title: string;
  subtitle?: string;
  /** Shown top-right - a profile name, a period, a landlord. */
  meta?: string;
  children: ReactNode;
}

/**
 * Masthead and footer shared by every printed document.
 *
 * Deliberately plain black on white: printers drop background colours by
 * default, and a document that only reads correctly with "print backgrounds"
 * enabled is a document that will reach an HR portal looking broken.
 */
export function PrintDocument({ title, subtitle, meta, children }: Props) {
  const generated = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <article className="print-page text-[11pt] leading-normal text-black">
      <header className="flex items-start justify-between gap-6 border-b-2 border-black pb-3">
        <div>
          <h1 className="text-[17pt] font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-0.5 text-[10pt]">{subtitle}</p>}
        </div>
        <div className="text-right text-[9pt]">
          {meta && <p className="font-semibold">{meta}</p>}
          <p>
            FY {FINANCIAL_YEAR} · A.Y. {ASSESSMENT_YEAR}
          </p>
        </div>
      </header>

      <div className="mt-4">{children}</div>

      <footer className="mt-6 border-t border-black/40 pt-2 text-[8pt]">
        <p>
          Generated on {generated} · Calculated in the browser, no data was
          transmitted or stored on any server.
        </p>
        <p className="mt-0.5">
          An estimate based on the statutory rules in force for FY{" "}
          {FINANCIAL_YEAR}. Not tax advice.
        </p>
      </footer>
    </article>
  );
}

/** A two-column figure row, the unit every printed statement is built from. */
export function PrintRow({
  label,
  value,
  note,
  bold = false,
  rule = false,
  indent = false,
}: {
  label: string;
  value: string;
  note?: string;
  bold?: boolean;
  /** Draws a line above, for subtotals and totals. */
  rule?: boolean;
  indent?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 py-[3px] ${
        rule ? "border-t border-black/50 mt-1 pt-1" : ""
      } ${bold ? "font-semibold" : ""}`}
    >
      <span className={indent ? "pl-4" : ""}>
        {label}
        {note && <span className="text-[8.5pt] text-black/70"> — {note}</span>}
      </span>
      <span className="tabular-nums whitespace-nowrap">{value}</span>
    </div>
  );
}

export function PrintSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="print-avoid-break mt-4">
      <h2 className="text-[10pt] font-bold uppercase tracking-wider border-b border-black/60 pb-0.5 mb-1.5">
        {title}
      </h2>
      {children}
    </section>
  );
}
