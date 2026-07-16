import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { inter, fraunces } from "@/lib/fonts";
import { SiteHeader } from "@/components/store/site-header";
import { Analytics } from "@vercel/analytics/react";
import { organizationJsonLd, websiteJsonLd } from "@/lib/json-ld";
import "../../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: { default: "Chelena", template: "%s | Chelena" },
  description: "Chelena — cosmetics, curated for Angola and Portugal.",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Required so static rendering + ISR works per-locale (next-intl docs).
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${inter.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {/* Organization + WebSite (with SearchAction) — site-wide, once per
            page load, per the SEO plan's JSON-LD requirement. Product and
            BreadcrumbList JSON-LD are added per-page (PDP, listing). */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd(locale)) }}
        />
        <NextIntlClientProvider messages={messages}>
          <SiteHeader locale={locale} />
          {children}
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
