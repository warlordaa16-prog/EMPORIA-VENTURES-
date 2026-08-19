export function formatCurrency(amount: number | undefined | null, currency: string = 'UGX'): string {
  const val = Math.round(Number(amount) || 0);
  const formattedNumber = new Intl.NumberFormat('en-US').format(val);
  return `${currency} ${formattedNumber}`;
}

export function parseCurrencyInput(value: string): number {
  const cleaned = value.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : Math.round(parsed);
}
