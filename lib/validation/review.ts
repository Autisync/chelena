import { z } from "zod";

export const reviewSchema = z.object({
  trackingToken: z.string().uuid(),
  productId: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  body: z.string().max(2000).optional(),
  // Honeypot, same pattern as checkout.
  website: z.string().max(0).optional(),
});
