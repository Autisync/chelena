"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { deleteBanner, toggleBannerActive } from "@/app/admin/banners/actions";
import { productImageUrl } from "@/lib/images/url";

type Banner = {
  id: string;
  title: string | null;
  placement: string;
  country: string | null;
  is_active: boolean | null;
  product_images: { storage_path_card: string } | null;
};

export function BannerCard({ banner }: { banner: Banner }) {
  const [pending, setPending] = useState(false);

  async function toggle() {
    setPending(true);
    await toggleBannerActive(banner.id, !banner.is_active);
    setPending(false);
  }

  async function remove() {
    setPending(true);
    await deleteBanner(banner.id);
    setPending(false);
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-background p-3">
      {banner.product_images && (
        // eslint-disable-next-line @next/next/no-img-element -- admin-only thumbnail
        <img
          src={productImageUrl(banner.product_images.storage_path_card)}
          alt={banner.title ?? ""}
          className="aspect-video w-full rounded object-cover"
        />
      )}
      <span className="text-sm font-medium">{banner.title ?? "(sem título)"}</span>
      <span className="text-xs text-muted-foreground">
        {banner.placement} · {banner.country ?? "AO+PT"}
      </span>
      <div className="flex gap-2">
        <Button size="sm" variant={banner.is_active ? "outline" : "default"} disabled={pending} onClick={toggle}>
          {banner.is_active ? "Desativar" : "Ativar"}
        </Button>
        <Button size="sm" variant="ghost" disabled={pending} onClick={remove}>
          Eliminar
        </Button>
      </div>
    </div>
  );
}
