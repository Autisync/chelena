export function formatMoney(amount: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale === "en" ? "en-PT" : "pt-PT", {
    style: "currency",
    currency,
    currencyDisplay: currency === "AOA" ? "code" : "symbol",
    maximumFractionDigits: 2,
  }).format(amount);
}
