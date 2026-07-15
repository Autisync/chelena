import sharp from "sharp";

export type ImageVariant = "thumb" | "card" | "detail" | "banner";

const VARIANT_WIDTH: Record<ImageVariant, number> = {
  thumb: 200,
  card: 600,
  detail: 1200,
  banner: 1600,
};

const DETAIL_MAX_BYTES = 200 * 1024;

// Process an uploaded original entirely in memory — the original buffer is
// never persisted, which is how hard rule #5 ("never serve originals to the
// storefront") is satisfied: there's nothing to accidentally serve.
// `sharp()` without `.withMetadata()` strips EXIF by default; `.rotate()`
// bakes in the EXIF orientation before that metadata is dropped.
export async function processProductImage(
  input: Buffer,
  { crop }: { crop?: { left: number; top: number; width: number; height: number } } = {}
): Promise<Record<ImageVariant, Buffer>> {
  let base = sharp(input).rotate();
  if (crop) base = base.extract(crop);
  const baseBuffer = await base.toBuffer();

  const variants = await Promise.all(
    (Object.keys(VARIANT_WIDTH) as ImageVariant[]).map(async (variant) => {
      const width = VARIANT_WIDTH[variant];
      let quality = 80;
      let buffer = await sharp(baseBuffer)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality })
        .toBuffer();

      if (variant === "detail") {
        while (buffer.length > DETAIL_MAX_BYTES && quality > 30) {
          quality -= 10;
          buffer = await sharp(baseBuffer)
            .resize({ width, withoutEnlargement: true })
            .webp({ quality })
            .toBuffer();
        }
      }

      return [variant, buffer] as const;
    })
  );

  return Object.fromEntries(variants) as Record<ImageVariant, Buffer>;
}
