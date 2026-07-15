import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { CountrySwitcher } from "@/components/store/country-switcher";

// Stays a server component for the static nav labels (keeps the page
// cacheable under ISR); the country-aware bit is isolated to the
// CountrySwitcher client island — see its comment for why.
export async function SiteHeader({ locale }: { locale: string }) {
  const t = await getTranslations("Nav");

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href={`/${locale}`} className="font-heading text-xl font-medium">
          Chelena
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href={`/${locale}/products`} className="text-foreground hover:text-primary">
            {t("products")}
          </Link>
          <Link href={`/${locale}/orders/track`} className="text-muted-foreground hover:text-foreground">
            {t("trackOrder")}
          </Link>
          <Link href={`/${locale}/cart`} className="text-muted-foreground hover:text-foreground">
            {t("cart")}
          </Link>
          <Link href={`/${locale}/account/login`} className="text-muted-foreground hover:text-foreground">
            {t("account")}
          </Link>
          <CountrySwitcher />
        </nav>
      </div>
    </header>
  );
}
