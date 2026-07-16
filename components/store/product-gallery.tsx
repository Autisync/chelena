"use client";

import { useState } from "react";
import Image from "next/image";
import { productImageUrl } from "@/lib/images/url";

type GalleryImage = { id: string; storage_path_detail: string; alt_text: string | null };

export function ProductGallery({ images, productName }: { images: GalleryImage[]; productName: string }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!images.length) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground">
        Sem imagem
      </div>
    );
  }

  const active = images[activeIndex];

  return (
    <div className="flex flex-col gap-2">
      <div className="aspect-square overflow-hidden rounded-xl bg-muted">
        <Image
          src={productImageUrl(active.storage_path_detail)}
          alt={active.alt_text ?? productName}
          width={1200}
          height={1200}
          priority
          className="h-full w-full object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((image, i) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`Imagem ${i + 1} de ${images.length}`}
              aria-current={i === activeIndex}
              className={`aspect-square overflow-hidden rounded-lg bg-muted ring-2 transition-colors ${
                i === activeIndex ? "ring-primary" : "ring-transparent hover:ring-border"
              }`}
            >
              <Image
                src={productImageUrl(image.storage_path_detail)}
                alt={image.alt_text ?? productName}
                width={200}
                height={200}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
