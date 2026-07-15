"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { productImageUrl } from "@/lib/images/url";

type ProductImage = {
  id: string;
  storage_path_card: string;
  alt_text: string | null;
  is_primary: boolean;
  is_advertisable: boolean;
};

export function ImageUploader({ productId, images }: { productId: string; images: ProductImage[] }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.set("file", file);
        formData.set("isPrimary", String(images.length === 0));
        const res = await fetch(`/api/admin/products/${productId}/images`, {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `upload failed (${res.status})`);
        }
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function toggle(imageId: string, field: "isPrimary" | "isAdvertisable", value: boolean) {
    await fetch(`/api/admin/products/${productId}/images/${imageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    router.refresh();
  }

  async function remove(imageId: string) {
    await fetch(`/api/admin/products/${productId}/images/${imageId}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-4 gap-3">
        {images.map((image) => (
          <div key={image.id} className="flex flex-col gap-1.5 rounded-md border p-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- admin-only thumbnail, next/image adds no value here */}
            <img
              src={productImageUrl(image.storage_path_card)}
              alt={image.alt_text ?? ""}
              className="aspect-square w-full rounded object-cover"
            />
            <label className="flex items-center gap-1.5 text-xs">
              <input
                type="checkbox"
                checked={image.is_primary}
                onChange={(e) => toggle(image.id, "isPrimary", e.target.checked)}
              />
              Principal
            </label>
            <label className="flex items-center gap-1.5 text-xs">
              <input
                type="checkbox"
                checked={image.is_advertisable}
                onChange={(e) => toggle(image.id, "isAdvertisable", e.target.checked)}
              />
              Publicitável (banners)
            </label>
            <Button type="button" variant="ghost" size="sm" onClick={() => remove(image.id)}>
              Remover
            </Button>
          </div>
        ))}
      </div>

      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={uploading}
          onChange={(e) => handleFiles(e.target.files)}
        />
        {uploading && <p className="mt-1 text-xs text-muted-foreground">A processar imagem…</p>}
        {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      </div>
    </div>
  );
}
