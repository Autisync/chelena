"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type CountryPricing = {
  currency: "AOA" | "EUR";
  price: number;
  compareAtPrice: number | null;
  stock: number;
  isVisible: boolean;
};

type ProductFormValues = {
  slug: string;
  name: string;
  brand: string | null;
  descriptionPt: string | null;
  descriptionEn: string | null;
  categoryId: string | null;
  tags: string[];
  seoTitle: string | null;
  seoDescription: string | null;
  isActive: boolean;
  countries: Partial<Record<"AO" | "PT", CountryPricing>>;
};

type Category = { id: string; name_pt: string };

const DEFAULT_PRICING: Record<"AO" | "PT", CountryPricing> = {
  AO: { currency: "AOA", price: 0, compareAtPrice: null, stock: 0, isVisible: true },
  PT: { currency: "EUR", price: 0, compareAtPrice: null, stock: 0, isVisible: true },
};

export function ProductForm({
  action,
  defaultValues,
  submitLabel,
  categories,
}: {
  action: (formData: FormData) => void | Promise<void>;
  defaultValues?: Partial<ProductFormValues>;
  submitLabel: string;
  categories: Category[];
}) {
  const [enabledCountries, setEnabledCountries] = useState<Record<"AO" | "PT", boolean>>({
    AO: !!defaultValues?.countries?.AO,
    PT: defaultValues ? !!defaultValues.countries?.PT : true,
  });

  return (
    <form action={action} className="flex max-w-2xl flex-col gap-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" name="name" required defaultValue={defaultValues?.name} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" defaultValue={defaultValues?.slug} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="brand">Marca</Label>
          <Input id="brand" name="brand" defaultValue={defaultValues?.brand ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="categoryId">Categoria</Label>
          <select
            id="categoryId"
            name="categoryId"
            defaultValue={defaultValues?.categoryId ?? ""}
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">Sem categoria</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name_pt}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="descriptionPt">Descrição (PT)</Label>
          <Textarea id="descriptionPt" name="descriptionPt" rows={4} defaultValue={defaultValues?.descriptionPt ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="descriptionEn">Descrição (EN)</Label>
          <Textarea id="descriptionEn" name="descriptionEn" rows={4} defaultValue={defaultValues?.descriptionEn ?? ""} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
        <Input id="tags" name="tags" defaultValue={defaultValues?.tags?.join(", ") ?? ""} />
      </div>

      <fieldset className="flex flex-col gap-3 rounded-md border p-4">
        <legend className="px-1 text-sm font-medium">SEO</legend>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="seoTitle">Meta título</Label>
          <Input id="seoTitle" name="seoTitle" maxLength={70} defaultValue={defaultValues?.seoTitle ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="seoDescription">Meta descrição</Label>
          <Textarea id="seoDescription" name="seoDescription" rows={2} maxLength={160} defaultValue={defaultValues?.seoDescription ?? ""} />
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3 rounded-md border p-4">
        <legend className="px-1 text-sm font-medium">Preço, stock e visibilidade por país</legend>
        <Tabs defaultValue="AO">
          <TabsList>
            <TabsTrigger value="AO">Angola</TabsTrigger>
            <TabsTrigger value="PT">Portugal</TabsTrigger>
          </TabsList>
          {(["AO", "PT"] as const).map((country) => {
            const pricing = defaultValues?.countries?.[country] ?? DEFAULT_PRICING[country];
            return (
              <TabsContent key={country} value={country} className="flex flex-col gap-3 pt-3">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    name={`countries.${country}.enabled`}
                    checked={enabledCountries[country]}
                    onCheckedChange={(checked) =>
                      setEnabledCountries((prev) => ({ ...prev, [country]: checked === true }))
                    }
                  />
                  Disponível em {country === "AO" ? "Angola" : "Portugal"}
                </label>
                {enabledCountries[country] && (
                  <div className="grid grid-cols-2 gap-3">
                    <input type="hidden" name={`countries.${country}.currency`} value={pricing.currency} />
                    <div className="flex flex-col gap-1.5">
                      <Label>Preço ({pricing.currency})</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        name={`countries.${country}.price`}
                        required={enabledCountries[country]}
                        defaultValue={pricing.price}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label>Preço promo (opcional)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        name={`countries.${country}.compareAtPrice`}
                        defaultValue={pricing.compareAtPrice ?? ""}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label>Stock</Label>
                      <Input
                        type="number"
                        step="1"
                        min="0"
                        name={`countries.${country}.stock`}
                        required={enabledCountries[country]}
                        defaultValue={pricing.stock}
                      />
                    </div>
                    <label className="mt-6 flex items-center gap-2 text-sm">
                      <Checkbox name={`countries.${country}.isVisible`} defaultChecked={pricing.isVisible} />
                      Visível na loja
                    </label>
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </fieldset>

      <label className="flex items-center gap-2 text-sm">
        <Checkbox name="isActive" defaultChecked={defaultValues?.isActive ?? true} />
        Produto ativo
      </label>

      <Button type="submit" className="self-start">
        {submitLabel}
      </Button>
    </form>
  );
}
