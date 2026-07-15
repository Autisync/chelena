"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Button } from "@/components/ui/button";

const ASPECTS = [
  { key: "1:1", label: "1:1 (produto)", value: 1 },
  { key: "16:9", label: "16:9 (banner)", value: 16 / 9 },
] as const;

export function ImageCropDialog({
  file,
  onCancel,
  onConfirm,
}: {
  file: File;
  onCancel: () => void;
  onConfirm: (crop: { left: number; top: number; width: number; height: number }) => void;
}) {
  const [imageUrl] = useState(() => URL.createObjectURL(file));
  const [aspect, setAspect] = useState<number>(1);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/95 p-4">
      <div className="relative flex-1">
        <Cropper
          image={imageUrl}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>
      <div className="flex items-center justify-between gap-4 pt-4">
        <div className="flex gap-2">
          {ASPECTS.map((option) => (
            <Button
              key={option.key}
              type="button"
              size="sm"
              variant={aspect === option.value ? "default" : "outline"}
              onClick={() => setAspect(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={!croppedAreaPixels}
            onClick={() =>
              croppedAreaPixels &&
              onConfirm({
                left: Math.round(croppedAreaPixels.x),
                top: Math.round(croppedAreaPixels.y),
                width: Math.round(croppedAreaPixels.width),
                height: Math.round(croppedAreaPixels.height),
              })
            }
          >
            Recortar e enviar
          </Button>
        </div>
      </div>
    </div>
  );
}
