import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { COUNTRY_COOKIE, isCountry } from "@/lib/country";
import { CheckoutForm } from "@/components/store/checkout-form";

export default async function CheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Checkout");

  const cookieStore = await cookies();
  const rawCountry = cookieStore.get(COUNTRY_COOKIE)?.value;
  const country = isCountry(rawCountry) ? rawCountry : "PT";

  const supabase = await createClient();
  const { data: pickupPoints } = await supabase
    .from("pickup_points")
    .select("id, name, city, hours")
    .eq("country", country)
    .eq("is_active", true)
    .order("name");

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="mb-8 font-heading text-3xl font-medium">{t("title")}</h1>
      <CheckoutForm locale={locale} country={country} pickupPoints={pickupPoints ?? []} />
    </main>
  );
}
