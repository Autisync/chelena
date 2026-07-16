"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function setReviewApproved(reviewId: string, isApproved: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("reviews").update({ is_approved: isApproved }).eq("id", reviewId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/reviews");
}

export async function replyToReview(reviewId: string, reply: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("reviews").update({ admin_reply: reply || null }).eq("id", reviewId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/reviews");
}
