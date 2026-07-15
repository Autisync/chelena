import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";

export const revalidate = 60; // ISR — home page

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Home");

  return (
    <main className="flex-1">
      <section className="mx-auto flex max-w-5xl flex-col items-start gap-6 px-6 py-24 sm:py-32">
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
          {t("heroTitle")}
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">{t("heroSubtitle")}</p>
        <Button size="lg">{t("heroCta")}</Button>
      </section>
    </main>
  );
}
