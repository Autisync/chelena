import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return profile?.role === "admin" ? user : null;
}

const patchSchema = z.object({
  isPrimary: z.boolean().optional(),
  isAdvertisable: z.boolean().optional(),
  altText: z.string().max(200).optional(),
  sortOrder: z.number().int().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id: productId, imageId } = await params;
  const body = patchSchema.parse(await request.json());
  const db = createAdminClient();

  if (body.isPrimary) {
    await db.from("product_images").update({ is_primary: false }).eq("product_id", productId);
  }

  const { error } = await db
    .from("product_images")
    .update({
      ...(body.isPrimary !== undefined && { is_primary: body.isPrimary }),
      ...(body.isAdvertisable !== undefined && { is_advertisable: body.isAdvertisable }),
      ...(body.altText !== undefined && { alt_text: body.altText }),
      ...(body.sortOrder !== undefined && { sort_order: body.sortOrder }),
    })
    .eq("id", imageId)
    .eq("product_id", productId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id: productId, imageId } = await params;
  const db = createAdminClient();

  const { data: image } = await db
    .from("product_images")
    .select("storage_path_thumb, storage_path_card, storage_path_detail, storage_path_banner")
    .eq("id", imageId)
    .eq("product_id", productId)
    .single();

  if (image) {
    const paths = [
      image.storage_path_thumb,
      image.storage_path_card,
      image.storage_path_detail,
      image.storage_path_banner,
    ].filter(Boolean) as string[];
    if (paths.length) await db.storage.from("product-images").remove(paths);
  }

  const { error } = await db.from("product_images").delete().eq("id", imageId).eq("product_id", productId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
