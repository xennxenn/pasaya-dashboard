export function formatCurrency(amount: number | null | undefined, showCurrency = false): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '-';
  const formatted = new Intl.NumberFormat('th-TH', {
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
  return showCurrency ? `฿${formatted}` : formatted;
}

export function formatNumber(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '-';
  return new Intl.NumberFormat('th-TH', {
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(val: number | null | undefined, showPlus = true): string {
  if (val === null || val === undefined || isNaN(val)) return '-';
  const sign = showPlus && val > 0 ? '+' : '';
  return `${sign}${val.toFixed(1)}%`;
}

export function formatCompact(amount: number): string {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(0)}k`;
  }
  return amount.toString();
}
