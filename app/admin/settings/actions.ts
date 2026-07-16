"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { settingValueSchema } from "@/lib/validation/settings";

export async function updateSetting(key: string, formData: FormData) {
  const raw = String(formData.get("value") ?? "");
  const parsed = settingValueSchema.safeParse(raw);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "invalid JSON");

  const supabase = await createClient();
  const { error } = await supabase
    .from("settings")
    .upsert({ key, value: JSON.parse(raw) });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/settings");
}
