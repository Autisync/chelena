# Chelena build status

Autonomous build running via `/loop`, user asleep, self-paced. This file is the source of truth
across loop resumes/context compaction — read it first on every wake-up before touching code.

## Milestone progress (see docx/04-implementation-plan.md for full scope of each)

- [x] **Milestone 0 — Foundation**: Next.js 16 + TS + Tailwind + shadcn scaffold at repo root
      (not nested — see docs/DECISIONS.md). Supabase migrations 001-004 (schema verbatim +
      indexes, RLS + is_admin() + triggers, create_order/get_order_by_token RPCs, storage
      buckets). next-intl wired (pt default/en, `middleware.ts` sets locale + country cookie).
      Multiple-root-layout structure: `app/(store)/[locale]/` and `app/admin/` (role-guard stub).
      `.env.example`, README, docs/DECISIONS.md, docs/LAUNCH-CHECKLIST.md,
      docs/whatsapp-templates.md (draft) all written. `npm run build` passes.
      **Not yet done from M0 scope**: auth wiring (email OTP + Google sign-in UI/flow),
      `supabase start` + migrations not yet run/verified against a real local instance
      (no Docker verified in this env — verify next session), seed script for 8 demo products
      with real processed images (needs the image pipeline from M1 first, per seed.sql comment).
- [~] **Milestone 1 — Admin: products & images** — in progress. Done: admin nav shell
      (`components/admin/admin-nav.tsx`), product list/create/edit pages with per-country
      (AO/PT) price/stock/visibility tabs (`app/admin/products/**`), zod-validated server
      actions (`app/admin/products/actions.ts`, `lib/validation/product.ts`) using the admin's
      own RLS-scoped session (not service role — see actions.ts comment). Image pipeline done:
      `lib/images/process.ts` (sharp: thumb/card/detail/banner WebP variants, EXIF strip via
      `.rotate()` + no `.withMetadata()`, detail ≤200KB via quality step-down, no-upscale),
      unit-tested in `test/unit/image-pipeline.test.ts` (4 tests passing, `npm test`). Upload
      route `app/api/admin/products/[id]/images/route.ts` (admin-session-verified, processes
      in-memory — originals are never persisted, satisfying "never serve originals" trivially)
      + PATCH/DELETE at `.../images/[imageId]/route.ts` (toggle primary/advertisable, delete +
      storage cleanup). `components/admin/image-uploader.tsx` wired into the edit-product page,
      now with `components/admin/image-crop-dialog.tsx` (react-easy-crop, 1:1/16:9 presets) —
      crop rect posted to the upload route and passed through to `processProductImage`'s `crop`
      option. Category picker added (native `<select>`, not shadcn's Select — see
      docs/DECISIONS.md for why). Pickup points CRUD done: `app/admin/pickup-points/` (list +
      inline edit-in-place rows + create form + delete, zod-validated actions).
      **Not yet done**: "advertisable" flag surfaces in image-uploader but nothing consumes it
      yet (banners manager), reviews moderation, settings page (payment templates/WhatsApp
      number/Google place id — seeded placeholder rows exist), dashboard widgets.
- [~] **Milestone 2 — Storefront** — design system done: `DESIGN.md` (Fraunces display font +
      Inter body, warm-neutral palette with terracotta/oxblood accent — see file for full
      rationale). Note on process: the `/design-consultation` gstack skill was invoked per the
      user's instruction but its flow is built around many interactive AskUserQuestion gates
      (competitive research prompts, taste-profile confirmation, etc.) that would block
      indefinitely in this unattended overnight session — bypassed the interactive flow and
      authored DESIGN.md directly using the product context already established, then applied
      the tokens (documented in docs/DECISIONS.md). Tokens applied to `app/globals.css`
      (`:root`/`.dark`) and fonts swapped in `lib/fonts.ts` (Geist → Inter/Fraunces); verified
      visually in the browser (screenshot: warm bg, serif headline, terracotta CTA rendering
      correctly) and `npm run build`/`lint` clean. Home page hero updated to use `font-heading`.
      Site header + country switcher done: `components/store/site-header.tsx` (server component,
      stays static/ISR-friendly) + `components/store/country-switcher.tsx` (client island using
      `useSyncExternalStore` to read/write the country cookie without forcing the route dynamic —
      verified in-browser that `/pt` stays prerendered (`●` in the build output) and the toggle
      correctly flips the `chelena_country` cookie and re-renders). Nav links to
      products/cart/orders-track/account are wired but those pages don't exist yet (expected
      404s until built below).
      **Not yet done**: category tiles, featured/promo sections, listing+filters, PDP, cart,
      SEO plumbing (sitemap/OG/JSON-LD). This is most of Milestone 2's remaining scope.
- [ ] **Milestone 3 — Checkout & orders** — `create_order`/`get_order_by_token` RPCs exist
      (migration 003) but no checkout form, confirmation/tracking pages, or admin pipeline board
      yet. `advance_order_status` RPC (admin transitions) not written yet.
- [ ] **Milestone 4 — Notifications** — schema + `create_order`'s initial `order_received` enqueue
      exist; no dispatcher, WhatsApp/Resend senders, or webhook yet.
- [ ] **Milestone 5 — Reviews, Google, banners, polish** — not started.
- [ ] **Milestone 6 — Production readiness** — not started.

## Immediate next steps (pick up here)

1. Product listing page (`app/(store)/[locale]/products/page.tsx`): server component, query
   `products` joined to `product_country` filtered by the country cookie (read server-side via
   `cookies()` here — fine for this page since it's inherently per-country dynamic, unlike the
   home page) and `is_visible=true`, filters (category/brand/price/in-stock) + sort as URL
   search params, grid using the `grid-cols-2 lg:grid-cols-4` pattern from DESIGN.md.
2. PDP (`app/(store)/[locale]/products/[slug]/page.tsx`): gallery (use `product_images`,
   `productImageUrl()` helper from `lib/images/url.ts`), price in local currency, stock badge,
   JSON-LD Product schema, related products. ISR (`export const revalidate`).
3. Home page needs real content: category tiles (query `categories`), featured products
   (`tags` contains 'featured' or a `is_featured` flag — schema doesn't have one, decide in
   docs/DECISIONS.md), banner slots (banners table + placement `home_hero`/`home_strip` — table
   exists, no admin UI to populate it yet, so this will render empty until the banners manager
   (below) exists — build banners admin CRUD before/alongside this if banner slots matter now).
4. Cart: localStorage-persisted (per architecture doc "State" section), country-locked with a
   confirm dialog on country switch if the cart is non-empty and the new country differs
   (`CountrySwitcher` in `components/store/country-switcher.tsx` currently just refreshes with
   no cart-awareness — needs a cart context to check against).
5. Settings page, banners manager, reviews moderation, dashboard widgets — all still pending
   from Milestone 1 (see above), all low-risk CRUD following the products/pickup-points pattern.
6. SEO plumbing: sitemap.xml, robots.txt, OG images, hreflang alternates — do this alongside
   the listing/PDP pages, not as an afterthought (easier to get `generateMetadata` right per
   page while building it than to retrofit).
7. Docker is NOT available in this environment — `supabase start`/`db push`/`db seed` have not
   been run against a live instance. All SQL has been carefully hand-reviewed but is unverified;
   verify in a real environment (or once Docker becomes available) before relying on it.

## Test status

`npm test` (vitest): 4/4 passing, all in `test/unit/image-pipeline.test.ts`. No Playwright
config yet (Milestone 6 exit test needs it) — `@playwright/test` is not installed.
`create_order`'s correctness can't be unit-tested without a live Postgres (it's a SQL function);
covering it needs either a Supabase-in-CI setup or Playwright hitting a real local instance.

## Known follow-ups / risks

- `middleware.ts` triggers a Next 16 deprecation warning (wants `proxy.ts`). Left as-is for now;
  revisit once next-intl's proxy-based middleware guidance is confirmed (see docs/DECISIONS.md).
- `lib/supabase/types.ts` is a stub (`Database = any`) until `supabase gen types` runs against a
  live instance — regenerate before writing any Supabase-typed query code.
- No test infra set up yet (Playwright/vitest) — needed before Milestone 6 exit test, but unit
  tests for `create_order` and the image pipeline should start as those pieces are built, not be
  deferred to the end.

## Session log

- 2026-07-15/16: Milestone 0 foundation built and committed. Repo pushed to
  https://github.com/Autisync/chelena.git (user requested this explicitly mid-session, remote
  `origin`/`main` now tracked — future commits should be pushed too unless told otherwise).
  Milestone 1 started: admin nav shell + product CRUD (list/create/edit, per-country pricing)
  landed, build+lint clean. Resume cadence: user asked for a 3-hour gap; `ScheduleWakeup` caps
  a single call at 1 hour, so the loop re-arms hourly and uses each wake to keep building
  (judged more useful than idling) rather than literally waiting 3 hours.
