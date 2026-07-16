import { z } from "zod";

// Loose on purpose — settings are admin-only, free-form JSON blobs per key
// (whatsapp_numbers, payment_templates, google_place_id). Validate shape at
// the point of use (e.g. the notification dispatcher already destructures
// payment_templates defensively) rather than locking the schema down here.
export const settingValueSchema = z.string().min(1).refine(
  (value) => {
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  },
  { message: "must be valid JSON" }
);
