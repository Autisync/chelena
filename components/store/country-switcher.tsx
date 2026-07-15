"use client";

import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { COUNTRY_COOKIE, isCountry, type Country } from "@/lib/country";

function readCountryCookie(): Country {
  const match = document.cookie.match(new RegExp(`(?:^|; )${COUNTRY_COOKIE}=([^;]+)`));
  const value = match?.[1];
  return isCountry(value) ? value : "PT";
}

// No native "cookie changed" event — this module is the sole writer, so it
// notifies subscribers itself right after writing (see writeCountryCookie).
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function writeCountryCookie(country: Country) {
  document.cookie = `${COUNTRY_COOKIE}=${country}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  listeners.forEach((listener) => listener());
}

// Client component (not server) so reading the country cookie doesn't force
// the whole route into dynamic rendering — the ISR home page and other
// static/SSG storefront pages stay cacheable; only this small widget is
// interactive. useSyncExternalStore (rather than useState+useEffect) is the
// React-sanctioned way to read external mutable state like a cookie without
// a hydration-mismatch flash. Cart-lock-to-country + confirm-on-switch (PRD)
// lands once the cart exists (Milestone 2 cart work).
export function CountrySwitcher() {
  const router = useRouter();
  const t = useTranslations("Country");
  const current = useSyncExternalStore(subscribe, readCountryCookie, () => "PT" as Country);

  function setCountry(country: Country) {
    if (country === current) return;
    writeCountryCookie(country);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1 rounded-full border border-border p-0.5 text-xs">
      {(["AO", "PT"] as const).map((country) => (
        <button
          key={country}
          type="button"
          onClick={() => setCountry(country)}
          aria-pressed={country === current}
          className={
            country === current
              ? "rounded-full bg-primary px-2.5 py-1 font-medium text-primary-foreground"
              : "rounded-full px-2.5 py-1 text-muted-foreground hover:text-foreground"
          }
        >
          {t(country)}
        </button>
      ))}
    </div>
  );
}
