"use client";

import { useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { COUNTRY_COOKIE, isCountry, type Country } from "@/lib/country";
import { productImageUrl } from "@/lib/images/url";

type Banner = {
  id: string;
  title: string | null;
  target_url: string | null;
  country: string | null;
  storagePathBanner: string;
};

function readCountryCookie(): Country {
  const match = document.cookie.match(new RegExp(`(?:^|; )${COUNTRY_COOKIE}=([^;]+)`));
  const value = match?.[1];
  return isCountry(value) ? value : "PT";
}

const listeners = new Set<() => void>();
function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

// Client component so ISR on the home page isn't forced dynamic by a
// cookie read — same pattern as CountrySwitcher. Server passes down every
// active banner for the placement (country-nullable ones included); this
// just picks the one that matches the visitor's country client-side.
export function HomeBanner({ banners, placement }: { banners: Banner[]; placement: string }) {
  const country = useSyncExternalStore(subscribe, readCountryCookie, () => "PT" as Country);
  const banner = banners.find((b) => !b.country || b.country === country);
  if (!banner) return null;

  const image = (
    <Image
      src={productImageUrl(banner.storagePathBanner)}
      alt={banner.title ?? ""}
      width={1600}
      height={placement === "home_hero" ? 600 : 300}
      className="w-full rounded-2xl object-cover"
      priority={placement === "home_hero"}
    />
  );

  return (
    <div className="mx-auto max-w-6xl px-6">
      {banner.target_url ? <Link href={banner.target_url}>{image}</Link> : image}
    </div>
  );
}
