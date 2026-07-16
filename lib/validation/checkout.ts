import { z } from "zod";

export const checkoutSchema = z.object({
  country: z.enum(["AO", "PT"]),
  customerName: z.string().min(1).max(200),
  customerPhone: z.string().min(6).max(30),
  customerEmail: z.string().email().optional().or(z.literal("")),
  preferredChannel: z.enum(["whatsapp", "email"]),
  pickupPointId: z.string().uuid(),
  notes: z.string().max(1000).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
  // Honeypot field — a real user never fills this in; bots that
  // autofill every input do (hard rule #4: "honeypot + server validation").
  website: z.string().max(0).optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
