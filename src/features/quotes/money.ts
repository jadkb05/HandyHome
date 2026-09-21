export const DEFAULT_QUOTE_CURRENCY = "MAD";

export function formatQuoteAmount(amount: { toString(): string } | string, currency: string): string {
  const value = Number(typeof amount === "string" ? amount : amount.toString());
  if (!Number.isFinite(value)) {
    return currency;
  }
  return `${value.toFixed(2)} ${currency}`;
}
