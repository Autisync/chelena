export const COUNTRY_COOKIE = "chelena_country";
export const COUNTRIES = ["AO", "PT"] as const;
export type Country = (typeof COUNTRIES)[number];

export const COUNTRY_CURRENCY: Record<Country, string> = {
  AO: "AOA",
  PT: "EUR",
};

export function isCountry(value: string | undefined | null): value is Country {
  return !!value && (COUNTRIES as readonly string[]).includes(value);
}

// Best-effort geo-IP suggestion from Vercel's request geo header, with a
// safe default. Real GEOIP_PROVIDER_KEY lookup can replace this later
// without changing the calling contract (see docs/DECISIONS.md).
export function suggestCountryFromHeader(countryHeader: string | null): Country {
  if (countryHeader === "AO") return "AO";
  if (countryHeader === "PT") return "PT";
  return "PT";
}
