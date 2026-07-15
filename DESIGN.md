# Chelena — Design System

**Memorable thing:** the shelf feels curated, not scraped — like walking into a small,
well-lit boutique rather than a stock catalog. Every product photo gets room to breathe.

Written unattended (autonomous overnight build session, no interactive design consultation —
see STATUS.md session log). This is a confident v1 starting point built from the product
context in `docx/01-04`, not a locked brand. Swap the palette/fonts once real brand assets
exist (PRD open question — logo/colors TBD by Mauru).

## Positioning

Cosmetics for Angola and Portugal, single-seller, admin-verified checkout — not a generic
Shopify-template shop, not a marketplace. Two markets with different payment cultures (Multicaixa
vs MB Way) but one visual identity. The design has to read as trustworthy to someone who's about
to give their name and phone number to a business with no card-payment gate — warmth and clarity
matter more than trend-chasing.

## Typography

- **Display / headings:** `Fraunces` (variable, optical sizing) — a warm, slightly editorial
  serif with soft ink-trap details. Reads boutique, not corporate; distinct from the sea of
  geometric sans headlines in e-commerce templates. Used at large sizes only (h1/h2, hero copy).
- **Body / UI:** `Inter` — the workhorse. Excellent at small sizes, huge language coverage
  (matters for pt/en + eventual diacritics), and disappears into the background the way UI type
  should. Already the de facto default for Latin-script product UI; not fighting that here.
- **Scale:** 1.25 (major third) ratio, base 16px.
  `text-xs 12 / text-sm 14 / text-base 16 / text-lg 20 / text-xl 25 / text-2xl 31 / text-3xl 39 / text-4xl 49 / text-5xl 61`
- Admin uses body type only — no display font in the CRM (see "Two surfaces" below).

## Color

Warm, low-saturation neutrals with a single confident accent. Cosmetics photography (skin
tones, packaging) supplies most of the color on any given page — the UI palette's job is to
not compete with it.

```css
/* Light (default) */
--background: oklch(98% 0.005 80);      /* warm off-white, not clinical #fff */
--foreground: oklch(22% 0.02 40);       /* warm near-black */
--muted: oklch(94% 0.01 70);
--muted-foreground: oklch(48% 0.02 50);
--border: oklch(90% 0.012 60);
--card: oklch(100% 0 0);
--primary: oklch(38% 0.09 15);          /* deep terracotta / oxblood — confident, warm, not "beauty pink" cliché */
--primary-foreground: oklch(98% 0.01 40);
--accent: oklch(74% 0.13 55);           /* warm amber — promo badges, star ratings, highlights */
--destructive: oklch(55% 0.18 25);
--success: oklch(55% 0.13 145);

/* Dark */
--background: oklch(16% 0.015 40);
--foreground: oklch(95% 0.01 60);
--muted: oklch(24% 0.015 40);
--muted-foreground: oklch(68% 0.02 50);
--border: oklch(30% 0.015 40);
--card: oklch(20% 0.015 40);
--primary: oklch(72% 0.1 25);
--primary-foreground: oklch(16% 0.02 40);
--accent: oklch(74% 0.13 55);
```

Why terracotta/oxblood instead of the expected blush-pink: cosmetics e-commerce defaults to
pink-and-gold so hard it's become invisible. A deep warm red-brown reads as premium and
gender-neutral (Chelena sells to whoever buys cosmetics, not just one demographic), and it has
enough contrast to pass WCAG AA at UI sizes on both light and dark surfaces — blush pastels
usually can't.

All pairs above are AA-checked: `--primary`/`--primary-foreground` and
`--foreground`/`--background` exceed 4.5:1 in both themes.

## Two surfaces, one family

- **Storefront:** `Fraunces` headlines, warm background, `--primary` for CTAs, product photos
  full-bleed with generous margins. Motion is present (see below). This is the persuasion layer.
- **Admin:** `Inter` only, `--background`/`--card` swap to a slightly cooler, flatter neutral
  (reuse `--muted` as the page background, `--card` for panels), no display font, minimal
  motion, information density wins over whitespace. This is the operator's tool, not a showcase.
  The current `app/admin/layout.tsx` (`bg-muted/30`) already matches this instinct — keep it.

## Spacing & layout

- 4px base unit (Tailwind default scale, unchanged) — no need to reinvent this.
- Section rhythm on the storefront: `py-16` mobile / `py-24` desktop between major sections.
  Generous per hard rule #8 ("generous whitespace") — resist the urge to compress for more
  above-the-fold content; product photography needs room.
- Content max-width: `max-w-6xl` for browse/listing grids, `max-w-3xl` for reading-width text
  (PDP description, checkout steps).
- Grids: 2-col mobile / 4-col desktop for product cards (`grid-cols-2 lg:grid-cols-4`), gap-4
  mobile / gap-6 desktop.

## Radii & elevation

- `--radius: 0.75rem` (12px) base — soft but not bubbly. Cards use full radius; buttons/inputs
  use `0.5rem`. No fully-rounded (`9999px`) buttons — that reads as generic SaaS/template,
  works against the boutique positioning.
- Shadows are used sparingly and only on interactive elevation (hover on product cards, open
  dropdowns) — flat by default, per the "no template-looking generic UI" hard rule. Avoid the
  ambient-drop-shadow-on-everything look.

## Motion

- Product card hover: image scale `1.0 → 1.03` over 300ms ease-out, no other movement.
- Page-level: rely on Next.js view transitions / ISR revalidation rather than route-change
  spinners where possible; skeleton loaders (hard rule #8) use a subtle shimmer, not a spinner.
- Cart add: a small toast/slide-in confirmation, not a full modal — checkout should never feel
  interrupted (ties back to "zero-friction checkout" principle in the product overview).
- Respect `prefers-reduced-motion`: scale/shimmer effects drop to opacity-only fades.

## Implementation

Tokens above map directly onto shadcn's `@theme` block already present in `app/globals.css`
(`--background`, `--foreground`, `--primary`, etc. are the same variable names shadcn/ui
expects — this is a value swap, not a restructure). `Fraunces` and `Inter` load via
`next/font/google` alongside the existing Geist setup in `lib/fonts.ts` (Geist is dropped from
the storefront, kept nowhere — Chelena isn't a Vercel-brand product; see implementation commit
for the actual font swap).
