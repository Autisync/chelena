import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { processProductImage } from "@/lib/images/process";

async function makeTestJpeg(width: number, height: number) {
  return sharp({
    create: { width, height, channels: 3, background: { r: 200, g: 120, b: 90 } },
  })
    .jpeg()
    .withExifMerge({ IFD0: { Make: "TestCam" } })
    .toBuffer();
}

describe("processProductImage", () => {
  it("produces all four WebP variants at the spec'd widths", async () => {
    const input = await makeTestJpeg(2000, 2000);
    const variants = await processProductImage(input);

    expect(Object.keys(variants).sort()).toEqual(["banner", "card", "detail", "thumb"]);

    for (const [name, width] of [
      ["thumb", 200],
      ["card", 600],
      ["detail", 1200],
      ["banner", 1600],
    ] as const) {
      const meta = await sharp(variants[name]).metadata();
      expect(meta.format).toBe("webp");
      expect(meta.width).toBe(width);
    }
  });

  it("keeps the detail variant at or under 200KB", async () => {
    // A noisy source is worst-case for WebP compression — a good stress test
    // for the quality step-down loop.
    const noisy = await sharp({
      create: { width: 3000, height: 3000, channels: 3, background: "white" },
    })
      .composite(
        Array.from({ length: 40 }, () => ({
          input: {
            create: {
              width: 50,
              height: 50,
              channels: 3,
              background: { r: Math.random() * 255, g: Math.random() * 255, b: Math.random() * 255 },
            },
          },
          left: Math.floor(Math.random() * 2950),
          top: Math.floor(Math.random() * 2950),
        }))
      )
      .jpeg()
      .toBuffer();

    const variants = await processProductImage(noisy);
    expect(variants.detail.length).toBeLessThanOrEqual(200 * 1024);
  });

  it("strips EXIF metadata", async () => {
    const input = await makeTestJpeg(800, 800);
    const variants = await processProductImage(input);
    const meta = await sharp(variants.card).metadata();
    expect(meta.exif).toBeUndefined();
  });

  it("does not upscale images smaller than a variant's target width", async () => {
    const input = await makeTestJpeg(100, 100);
    const variants = await processProductImage(input);
    const meta = await sharp(variants.card).metadata();
    expect(meta.width).toBeLessThanOrEqual(100);
  });
});
