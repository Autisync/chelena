import { z } from "zod";

const countryPricingSchema = z.object({
  currency: z.enum(["AOA", "EUR"]),
  price: z.coerce.number().positive(),
  compareAtPrice: z.coerce.number().positive().optional().nullable(),
  stock: z.coerce.number().int().min(0),
  isVisible: z.boolean(),
});

// Server-side contract for product create/update — every route handler and
// server action re-validates against this (hard rule #4: zod on every route).
export const productSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be lowercase, hyphen-separated"),
  name: z.string().min(1).max(200),
  brand: z.string().max(120).optional().nullable(),
  descriptionPt: z.string().optional().nullable(),
  descriptionEn: z.string().optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  tags: z.array(z.string()).default([]),
  seoTitle: z.string().max(70).optional().nullable(),
  seoDescription: z.string().max(160).optional().nullable(),
  isActive: z.boolean().default(true),
  countries: z.object({
    AO: countryPricingSchema.optional(),
    PT: countryPricingSchema.optional(),
  }),
});

export type ProductInput = z.infer<typeof productSchema>;
