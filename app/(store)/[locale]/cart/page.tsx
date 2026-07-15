import { getTranslations, setRequestLocale } from "next-intl/server";
import { CartView } from "@/components/store/cart-view";

export default async function CartPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Cart");

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-8 font-heading text-3xl font-medium">{t("title")}</h1>
      <CartView locale={locale} />
    </main>
  );
}
