/**
 * Intl formatters are expensive to construct, so they are built once at module
 * load instead of on every render of every currency cell.
 */
const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});

export function formatCurrency(amount: number): string {
  return currencyFormatter.format(Math.round(amount));
}

export function formatNumber(amount: number): string {
  return numberFormatter.format(amount);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

/** Strips grouping separators and stray characters from a currency input. */
export function parseAmount(value: string): number {
  const digitsOnly = value.replace(/[^\d.]/g, "");
  const parsed = Number.parseFloat(digitsOnly);
  return Number.isFinite(parsed) ? parsed : 0;
}
