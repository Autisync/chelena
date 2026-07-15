import { z } from "zod";

export const pickupPointSchema = z.object({
  country: z.enum(["AO", "PT"]),
  name: z.string().min(1).max(120),
  address: z.string().min(1),
  city: z.string().min(1).max(120),
  hours: z.string().max(200).optional().nullable(),
  mapsUrl: z.string().url().optional().nullable().or(z.literal("")),
  isActive: z.boolean().default(true),
});
