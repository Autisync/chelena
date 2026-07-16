import { routing } from "@/i18n/routing";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Locale-only alternates (pt/en) — country is a cookie, not a URL segment,
// in this build, so true pt-PT/pt-AO hreflang per the architecture doc's SEO
// plan isn't implemented (see docs/DECISIONS.md "hreflang").
export function localeAlternates(path: string) {
  const languages: Record<string, string> = {};
  for (const locale of routing.locales) {
    languages[locale] = `${BASE_URL}/${locale}${path}`;
  }
  return {
    canonical: `${BASE_URL}/${routing.defaultLocale}${path}`,
    languages,
  };
}
