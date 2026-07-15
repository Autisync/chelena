import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { processProductImage } from "@/lib/images/process";

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const metaSchema = z.object({
  altText: z.string().max(200).optional(),
  isPrimary: z.coerce.boolean().optional().default(false),
  isAdvertisable: z.coerce.boolean().optional().default(false),
});

// Upload -> sharp pipeline -> Storage. Admin-only: verified against the
// caller's session (not just presence of a service-role key on the server),
// per hard rule #3's "re-verify the session" defense in depth.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: productId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }
  if (!ACCEPTED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "unsupported file type" }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "file too large" }, { status: 400 });
  }

  const meta = metaSchema.parse({
    altText: formData.get("altText") ?? undefined,
    isPrimary: formData.get("isPrimary") ?? undefined,
    isAdvertisable: formData.get("isAdvertisable") ?? undefined,
  });

  const inputBuffer = Buffer.from(await file.arrayBuffer());
  const variants = await processProductImage(inputBuffer);

  const admin = createAdminClient();
  const imageId = crypto.randomUUID();
  const paths: Record<string, string> = {};

  for (const [variant, buffer] of Object.entries(variants)) {
    const path = `${productId}/${imageId}-${variant}.webp`;
    const { error } = await admin.storage.from("product-images").upload(path, buffer, {
      contentType: "image/webp",
      cacheControl: "31536000",
      upsert: false,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    paths[variant] = path;
  }

  if (meta.isPrimary) {
    await admin.from("product_images").update({ is_primary: false }).eq("product_id", productId);
  }

  const { data: row, error: insertError } = await admin
    .from("product_images")
    .insert({
      id: imageId,
      product_id: productId,
      storage_path_thumb: paths.thumb,
      storage_path_card: paths.card,
      storage_path_detail: paths.detail,
      storage_path_banner: paths.banner,
      alt_text: meta.altText ?? null,
      is_primary: meta.isPrimary,
      is_advertisable: meta.isAdvertisable,
    })
    .select()
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  return NextResponse.json({ image: row }, { status: 201 });
}
