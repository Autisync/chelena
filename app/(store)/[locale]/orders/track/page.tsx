import { getTranslations, setRequestLocale } from "next-intl/server";
import { TrackOrderForm } from "@/components/store/track-order-form";

export default async function TrackOrderPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Tracking");

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="mb-2 font-heading text-3xl font-medium">{t("title")}</h1>
      <p className="mb-6 text-sm text-muted-foreground">{t("trackHint")}</p>
      <TrackOrderForm locale={locale} />
    </main>
  );
}
