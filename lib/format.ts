const formatters = new Map<string, Intl.NumberFormat>();

/** Formats an amount in minor units (pence) for display, e.g. 250 → "£2.50". */
export function formatPrice(minorUnits: number, currency = "gbp"): string {
  const code = currency.toUpperCase();
  let formatter = formatters.get(code);
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-GB", { style: "currency", currency: code });
    formatters.set(code, formatter);
  }
  return formatter.format(minorUnits / 100);
}
