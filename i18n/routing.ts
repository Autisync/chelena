import { defineRouting } from "next-intl/routing";

// Locale = language (pt default/complete, en secondary/complete). Country
// (AO/PT) is a *separate* cookie-driven concept — see middleware.ts and
// lib/country.ts. An English speaker in Angola sees `/en` with AOA pricing.
export const routing = defineRouting({
  locales: ["pt", "en"],
  defaultLocale: "pt",
});

export type Locale = (typeof routing.locales)[number];
