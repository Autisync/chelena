"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { bannerSchema } from "@/lib/validation/banner";

function parseFormData(formData: FormData) {
  return bannerSchema.parse({
    imageId: formData.get("imageId"),
    title: formData.get("title") || undefined,
    targetUrl: formData.get("targetUrl") || undefined,
    placement: formData.get("placement"),
    country: formData.get("country") || undefined,
    startsAt: formData.get("startsAt") || undefined,
    endsAt: formData.get("endsAt") || undefined,
    isActive: formData.get("isActive") === "on",
  });
}

export async function createBanner(formData: FormData) {
  const input = parseFormData(formData);
  const supabase = await createClient();
  const { error } = await supabase.from("banners").insert({
    image_id: input.imageId,
    title: input.title || null,
    target_url: input.targetUrl || null,
    placement: input.placement,
    country: input.country || null,
    starts_at: input.startsAt || null,
    ends_at: input.endsAt || null,
    is_active: input.isActive,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/banners");
}

export async function deleteBanner(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("banners").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/banners");
}

export async function toggleBannerActive(id: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("banners").update({ is_active: isActive }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/banners");
}
