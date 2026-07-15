"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

type Category = { id: string; name_pt: string; name_en: string | null };

export function ProductFilters({ categories, locale }: { categories: Category[]; locale: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("Products");

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-4 text-sm">
      {!!categories.length && (
        <label className="flex items-center gap-2">
          <select
            defaultValue={searchParams.get("category") ?? ""}
            onChange={(e) => updateParam("category", e.target.value || null)}
            className="h-8 rounded-md border border-input bg-transparent px-2"
          >
            <option value="">{t("allCategories")}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {locale === "en" ? category.name_en ?? category.name_pt : category.name_pt}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="flex items-center gap-2">
        <span className="text-muted-foreground">{t("sortLabel")}</span>
        <select
          defaultValue={searchParams.get("sort") ?? ""}
          onChange={(e) => updateParam("sort", e.target.value || null)}
          className="h-8 rounded-md border border-input bg-transparent px-2"
        >
          <option value="">{t("sortDefault")}</option>
          <option value="price_asc">{t("sortPriceAsc")}</option>
          <option value="price_desc">{t("sortPriceDesc")}</option>
        </select>
      </label>
      <label className="flex items-center gap-1.5">
        <input
          type="checkbox"
          defaultChecked={searchParams.get("inStock") === "1"}
          onChange={(e) => updateParam("inStock", e.target.checked ? "1" : null)}
        />
        {t("inStockOnly")}
      </label>
    </div>
  );
}
