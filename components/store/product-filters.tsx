"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";

type Category = { id: string; name_pt: string; name_en: string | null };

export function ProductFilters({
  categories,
  brands,
  locale,
}: {
  categories: Category[];
  brands: string[];
  locale: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("Products");
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "");

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateParam("q", search || null);
  }

  function handlePriceSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (minPrice) params.set("minPrice", minPrice);
    else params.delete("minPrice");
    if (maxPrice) params.set("maxPrice", maxPrice);
    else params.delete("maxPrice");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="mb-6 flex flex-col gap-3">
      <form onSubmit={handleSearchSubmit} className="flex max-w-sm gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="h-8"
        />
      </form>

      <div className="flex flex-wrap items-center gap-4 text-sm">
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

        {!!brands.length && (
          <label className="flex items-center gap-2">
            <select
              defaultValue={searchParams.get("brand") ?? ""}
              onChange={(e) => updateParam("brand", e.target.value || null)}
              className="h-8 rounded-md border border-input bg-transparent px-2"
            >
              <option value="">{t("allBrands")}</option>
              {brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
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

        <form onSubmit={handlePriceSubmit} className="flex items-center gap-1.5">
          <Input
            type="number"
            min="0"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder={t("minPrice")}
            className="h-8 w-20"
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="number"
            min="0"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder={t("maxPrice")}
            className="h-8 w-20"
          />
          <button type="submit" className="text-xs text-primary underline">
            {t("apply")}
          </button>
        </form>
      </div>
    </div>
  );
}
