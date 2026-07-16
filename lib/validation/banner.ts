import { z } from "zod";

export const bannerSchema = z.object({
  imageId: z.string().uuid(),
  title: z.string().max(200).optional(),
  targetUrl: z.string().url().optional().or(z.literal("")),
  placement: z.enum(["home_hero", "home_strip", "category_top"]),
  country: z.enum(["AO", "PT", ""]).optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  isActive: z.boolean().default(true),
});
