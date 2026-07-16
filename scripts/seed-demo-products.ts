// Seeds 8 demo products with generated placeholder images run through the
// real image pipeline (hard rule: "seed script for demo products with
// generated placeholder images run through the real pipeline" — no real
// product photography exists yet, so this synthesizes a simple colored
// swatch + label per product via sharp/SVG rather than sourcing stock photos,
// which would need licensing and isn't the point of a dev seed).
//
// Run: node --env-file=.env.local --import tsx scripts/seed-demo-products.ts

import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";
import { processProductImage } from "../lib/images/process";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (.env.local)");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

type DemoProduct = {
  slug: string;
  name: string;
  brand: string;
  category: "rosto" | "corpo";
  descriptionPt: string;
  color: string;
  priceAO: number;
  pricePT: number;
};

const PRODUCTS: DemoProduct[] = [
  { slug: "creme-hidratante-facial", name: "Creme Hidratante Facial", brand: "Chelena", category: "rosto", descriptionPt: "Hidratação profunda para todos os tipos de pele, com ácido hialurónico.", color: "#e8c4a0", priceAO: 12500, pricePT: 18.9 },
  { slug: "serum-vitamina-c", name: "Sérum Vitamina C", brand: "Chelena", category: "rosto", descriptionPt: "Sérum iluminador com vitamina C pura para uma pele mais radiante.", color: "#f0a868", priceAO: 18500, pricePT: 24.9 },
  { slug: "protetor-solar-fps50", name: "Protetor Solar FPS 50", brand: "Chelena", category: "rosto", descriptionPt: "Proteção solar de amplo espectro, toque seco, não deixa marcas brancas.", color: "#fbe1a8", priceAO: 9800, pricePT: 15.5 },
  { slug: "batom-mate-terracota", name: "Batom Mate Terracota", brand: "Chelena", category: "rosto", descriptionPt: "Cor intensa de longa duração em acabamento mate aveludado.", color: "#8a3b2f", priceAO: 6500, pricePT: 12.0 },
  { slug: "oleo-corporal-nutritivo", name: "Óleo Corporal Nutritivo", brand: "Chelena", category: "corpo", descriptionPt: "Óleo seco de rápida absorção com manteiga de karité e óleo de argan.", color: "#c98a4b", priceAO: 15200, pricePT: 21.0 },
  { slug: "esfoliante-corporal-cafe", name: "Esfoliante Corporal de Café", brand: "Chelena", category: "corpo", descriptionPt: "Esfoliação suave que renova a pele e estimula a circulação.", color: "#5c3a26", priceAO: 8900, pricePT: 14.9 },
  { slug: "locao-hidratante-corpo", name: "Loção Hidratante Corporal", brand: "Chelena", category: "corpo", descriptionPt: "Textura leve de absorção rápida para hidratação diária.", color: "#f5d9c0", priceAO: 7200, pricePT: 11.5 },
  { slug: "creme-maos-reparador", name: "Creme de Mãos Reparador", brand: "Chelena", category: "corpo", descriptionPt: "Repara e protege a pele das mãos, com manteiga de karité.", color: "#e0b48f", priceAO: 4500, pricePT: 8.5 },
];

async function generatePlaceholder(name: string, color: string): Promise<Buffer> {
  const svg = `
    <svg width="1600" height="1600" xmlns="http://www.w3.org/2000/svg">
      <rect width="1600" height="1600" fill="${color}" />
      <text x="800" y="800" font-family="Georgia, serif" font-size="72" fill="#2a1810"
            text-anchor="middle" dominant-baseline="middle">${escapeXml(name)}</text>
    </svg>`;
  return sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer();
}

function escapeXml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function main() {
  const { data: categories } = await supabase.from("categories").select("id, slug");
  const categoryBySlug = new Map((categories ?? []).map((c) => [c.slug, c.id]));

  for (const demo of PRODUCTS) {
    console.log(`Seeding ${demo.slug}...`);

    const { data: existing } = await supabase.from("products").select("id").eq("slug", demo.slug).maybeSingle();
    if (existing) {
      console.log(`  already exists, skipping`);
      continue;
    }

    const { data: product, error: productError } = await supabase
      .from("products")
      .insert({
        slug: demo.slug,
        name: demo.name,
        brand: demo.brand,
        description_pt: demo.descriptionPt,
        category_id: categoryBySlug.get(demo.category) ?? null,
        is_active: true,
        seo_title: demo.name,
        seo_description: demo.descriptionPt,
      })
      .select("id")
      .single();

    if (productError || !product) {
      console.error(`  failed to insert product: ${productError?.message}`);
      continue;
    }

    const { error: countryError } = await supabase.from("product_country").insert([
      { product_id: product.id, country: "AO", currency: "AOA", price: demo.priceAO, stock: 25, is_visible: true },
      { product_id: product.id, country: "PT", currency: "EUR", price: demo.pricePT, stock: 25, is_visible: true },
    ]);
    if (countryError) console.error(`  failed to insert product_country: ${countryError.message}`);

    const original = await generatePlaceholder(demo.name, demo.color);
    const variants = await processProductImage(original);
    const imageId = crypto.randomUUID();
    const paths: Record<string, string> = {};

    for (const [variant, buffer] of Object.entries(variants)) {
      const path = `${product.id}/${imageId}-${variant}.webp`;
      const { error: uploadError } = await supabase.storage.from("product-images").upload(path, buffer, {
        contentType: "image/webp",
        cacheControl: "31536000",
        upsert: false,
      });
      if (uploadError) {
        console.error(`  failed to upload ${variant}: ${uploadError.message}`);
        continue;
      }
      paths[variant] = path;
    }

    const { error: imageError } = await supabase.from("product_images").insert({
      id: imageId,
      product_id: product.id,
      storage_path_thumb: paths.thumb,
      storage_path_card: paths.card,
      storage_path_detail: paths.detail,
      storage_path_banner: paths.banner,
      alt_text: demo.name,
      is_primary: true,
      is_advertisable: true,
    });
    if (imageError) console.error(`  failed to insert product_images: ${imageError.message}`);

    console.log(`  done`);
  }

  console.log("Seed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
