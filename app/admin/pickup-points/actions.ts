"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { pickupPointSchema } from "@/lib/validation/pickup-point";

function parseFormData(formData: FormData) {
  return pickupPointSchema.parse({
    country: formData.get("country"),
    name: formData.get("name"),
    address: formData.get("address"),
    city: formData.get("city"),
    hours: formData.get("hours") || null,
    mapsUrl: formData.get("mapsUrl") || null,
    isActive: formData.get("isActive") === "on",
  });
}

export async function createPickupPoint(formData: FormData) {
  const input = parseFormData(formData);
  const supabase = await createClient();
  const { error } = await supabase.from("pickup_points").insert({
    country: input.country,
    name: input.name,
    address: input.address,
    city: input.city,
    hours: input.hours,
    maps_url: input.mapsUrl || null,
    is_active: input.isActive,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/pickup-points");
}

export async function updatePickupPoint(id: string, formData: FormData) {
  const input = parseFormData(formData);
  const supabase = await createClient();
  const { error } = await supabase
    .from("pickup_points")
    .update({
      country: input.country,
      name: input.name,
      address: input.address,
      city: input.city,
      hours: input.hours,
      maps_url: input.mapsUrl || null,
      is_active: input.isActive,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/pickup-points");
}

export async function deletePickupPoint(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("pickup_points").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/pickup-points");
}
