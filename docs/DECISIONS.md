# Decisions

Deviations from the spec docs, and resolutions to ambiguous requirements, with reasons. Newest first.

## P0 self-review against docx/02-prd.md — found and fixed 4 real gaps

Did a line-by-line pass of every P0 checkbox in the PRD against what's actually built (rather
than trusting STATUS.md's running narrative, which can drift). Found:

1. **Bug**: the `order_ready` WhatsApp/email notification never included the Google review link,
   even though `lib/notifications/templates.ts` renders it — `advance_order_status()` just never
   set it in the payload. Fixed in migration 008, verified the settings lookup logic directly
   (the extraction query, `value #>> '{}'`) against a real test value.
2. **Missing feature**: no free-text search existed at all ("Category and search pages with
   filters" is explicit P0). Added `?q=` support to the products listing page (`ilike` on name)
   plus a search box in `ProductFilters`. This also made the `WebSite` JSON-LD's `SearchAction`
   (added in the same pass) actually point somewhere real instead of a dead URL template.
3. **Missing feature**: price-range and brand filters were explicit P0 ("filters (category, price
   range, brand, in-stock)") but only category/in-stock/sort existed. Added both — brand via a
   distinct-values query, price range via `minPrice`/`maxPrice` params.
4. **Missing SEO**: only `Product` JSON-LD existed; `Organization`, `WebSite`, and `BreadcrumbList`
   (all explicit P0) were never added. Added `lib/json-ld.ts` with all three, wired
   Organization+WebSite into the locale layout (site-wide) and BreadcrumbList into the PDP and
   listing pages.

Also added a "verified purchase" badge on displayed reviews (PRD: "1–5 stars + text ... with
verified-purchase badge") — every review here is inherently a verified purchase (the only
insert path requires a completed order containing the product, see `app/api/reviews/route.ts`),
so this was just a missing UI label, not a data-model gap.

**Fixed in a follow-up pass**: the PDP gallery — `components/store/product-gallery.tsx`, verified
live by adding a real second image to a seeded product and confirming the thumbnail switcher works.

**Still-open gaps** (lower priority, noted for the next iteration): no post-checkout "claim this
order into a new account" prompt (P0: "Optional account... Post-checkout prompt to claim the
order into a new account"); home page still has no featured-products or `home_strip` promo-banner
sections. See STATUS.md for tracking.

## No custom rate limiting on auth — Supabase Auth already does it

Hard rule #4 says "rate limiting on checkout/review/auth". Checkout and reviews go through
Next.js route handlers (`lib/rate-limit.ts`, now Upstash-backed with an in-memory dev fallback —
see below), but there's no custom Next.js auth route to attach a limiter to: the login form
calls `supabase.auth.signInWithOtp()` / `signInWithOAuth()` directly from the client
(`components/auth/login-form.tsx`), and Supabase Auth (GoTrue) enforces its own rate limits on
those endpoints server-side, outside this app's code entirely. Building a redundant limiter in
front of a client-side SDK call that Supabase already protects would add complexity without
adding protection.

## Rate limiting: Upstash-backed with an in-memory dev fallback (implemented, unverified live)

`lib/rate-limit.ts` now tries Upstash Redis first (`@upstash/ratelimit` + `@upstash/redis`,
sliding window) and falls back to the original in-memory token bucket when
`UPSTASH_REDIS_REST_URL`/`_TOKEN` aren't set — this repo's `.env.local` has neither, so every
request in this environment exercises the fallback path, same situation as WhatsApp/Resend
behind `MOCK_PROVIDERS`. The checkout and review e2e tests both still pass end-to-end after this
change (confirms the async `rateLimit()` signature didn't break either route), but the actual
Upstash code path is genuinely untested — there's no way to verify it without a real Upstash
instance. Flagged in `docs/LAUNCH-CHECKLIST.md`.

## hreflang: locale-only (pt/en), not country-scoped (pt-PT/pt-AO)

The architecture doc's SEO plan calls for hreflang `pt-PT`, `pt-AO`, and `en`, implying country
needs to be part of the URL (it suggests "serve default country by domain path /pt and /ao
sections"). This build's actual routing is locale-only (`/pt`, `/en` — see `i18n/routing.ts`,
decided in Milestone 0) with country carried in a cookie, not the URL path. Retrofitting
country-scoped URLs at this point (Milestone 5) would mean restructuring every route under
`app/(store)/[locale]/` to `app/(store)/[locale]/[country]/` — a large, late change with wide
blast radius, versus `lib/seo.ts`'s current locale-only `pt`/`en` alternates which are still
correct (just not as granular as the ideal). Documented rather than silently shipped: if country-
specific SEO indexing becomes a real priority post-launch, this is the place to revisit it.

## Category filter links use category UUID, not slug

`app/(store)/[locale]/products/page.tsx` filters by `category_id` (uuid), so
`components/store/product-filters.tsx`, the home page's category tiles, and `app/sitemap.ts` all
link with `?category=<uuid>` rather than a prettier `?category=<slug>`. Slug-based would be
better SEO practice and was considered while building the sitemap, but switching now touches the
filter dropdown, the home page links, and the sitemap together — a real refactor, not a quick
fix, this late in the build. Left as a follow-up (see STATUS.md) rather than rushed.

## Bug found live: ambiguous `tracking_token` column in `create_order`

Testing the `create_order` happy path against the real linked database (not just its validation
errors, which had been checked earlier and passed) surfaced a genuine bug: `returning id,
tracking_token into v_order_id, v_tracking_token` failed with Postgres error 42702 ("column
reference tracking_token is ambiguous"). Cause: `create_order`'s `returns table (order_id uuid,
order_number text, tracking_token uuid)` signature implicitly declares `tracking_token` as a
PL/pgSQL variable in scope, which collides with the `orders.tracking_token` column referenced in
the same `RETURNING` clause. Fixed by qualifying the columns (`orders.id, orders.tracking_token`)
in a new migration (`005_fix_create_order_ambiguous_column.sql`) rather than editing the
already-applied `003` — migrations are append-only once applied to a real environment, even one
this early. Re-verified the full happy path afterward (order created, stock decremented,
`order_items` snapshotted correctly, `order_status_history` + `notifications` rows written,
guest tracking via `get_order_by_token` returns the order) — see
`test/integration/live-supabase.md`. This is exactly the class of bug that a type stub
(`Database = any`) and pure code review cannot catch — only running the SQL for real does.

## Secrets hygiene: real Supabase credentials moved out of `.env.example`

Mid-session, real credentials for a live Supabase project appeared written into `.env.example`
on disk. `.env.example` is meant to be a template (empty values, safe to have tracked/shared) —
even though this repo's `.gitignore` has a blanket `.env*` pattern that happens to keep it out of
git too, leaving real secrets in a file named "example" is bad hygiene (easy to `git add -f` by
habit, easy to paste into a doc, easy for a future contributor to assume it's safe to view). Moved
the real values to `.env.local` (the correct, conventionally-gitignored location for real local
secrets) and restored `.env.example` to empty placeholders. Used the CLI's already-authenticated
session (not the leaked keys) to link the project and push migrations — see STATUS.md "MAJOR
UPDATE" for what that unblocked.

## Did not fabricate an `auth.users` row via direct SQL

With a live database available, creating a test admin user by inserting directly into
`auth.users` was tempting (would unblock testing the admin role guard immediately). Didn't do
it: Supabase Auth (GoTrue) owns that table's invariants — password hashing, confirmation
tokens, instance_id, provider metadata — and a hand-crafted row that doesn't match what GoTrue
expects can leave the auth system in a broken state that's hard to diagnose later. A real
signup (email OTP or Google) is one manual step for whoever has access to a real inbox; not
worth the risk to save it. See README "Create the first admin".

## Bypassed the interactive `/design-consultation` gstack skill flow

The user's instruction was to "run a design consultation (ui-ux-pro-max or impeccable
design-consultation skill)" before Milestone 2. Invoking `/design-consultation` surfaced a
gstack-authored workflow built around multiple `AskUserQuestion` gates (product-context
confirmation, "want competitive research?", taste-profile conflicts, etc.) — appropriate for an
interactive session, but this is an unattended overnight `/loop` run with no one to answer. Per
the loop's own standing instruction ("do not block on questions; make reasonable
interpretations"), skipped the interactive gates and authored `DESIGN.md` directly: same
deliverable (a complete token system — palette, type, spacing, radii, motion — with rationale),
produced from the product context already loaded (docx/01-02) rather than through the skill's
question flow. Tokens were then applied to `app/globals.css` and `lib/fonts.ts` and verified
visually in a browser screenshot before committing.

## Next.js 16 / Turbopack instead of "14+"

`create-next-app@latest` installed Next.js 16.2.10 (Turbopack build by default). The architecture
doc says "14+" — 16 satisfies that constraint and is the current stable release as of build time.
Turbopack build is Next's default now; not fighting it. One consequence: Next 16 deprecates the
root `middleware.ts` convention in favor of `proxy.ts`. Kept `middleware.ts` for now since it still
works (deprecation warning only) and `proxy.ts` semantics need verification against next-intl's
middleware helper before switching — revisit before launch.

## Multiple root layouts instead of one `app/layout.tsx`

The architecture doc's frontend tree shows `(store)/[locale]/` and `admin/` as siblings under
`app/`. Next.js App Router requires exactly one `<html>/<body>` per render tree; since admin and
the storefront want different `lang` handling (admin is always `pt`, storefront is locale-driven),
each top-level group defines its own root layout (`app/(store)/[locale]/layout.tsx` and
`app/admin/layout.tsx`) instead of a shared `app/layout.tsx`. This is Next's documented
"multiple root layouts" pattern.

## `create_order` snapshots `product_name` via a second `select`

`product_country` doesn't carry the product name, so the RPC does a second lookup
(`select name from products`) per line item when snapshotting `order_items.product_name`. A
join would be marginally more efficient but the row-by-row loop structure (needed for the
per-item stock lock) made the extra `select` the simplest correct option; revisit if order sizes
get large enough for it to matter.

## `MOCK_PROVIDERS=true` required for local dev

Per hard rule #6, the app must be fully testable without WhatsApp/Resend credentials. Local dev
and CI default `.env.example` to `MOCK_PROVIDERS=true`; the notification dispatcher (Milestone 4)
checks this flag before ever calling Meta or Resend and logs the would-be request instead.

## Rate limiting: in-memory fallback when Upstash isn't configured

Hard rule #4 requires rate limiting on checkout/review/auth. Upstash Redis is the production
choice (serverless-friendly, works on Vercel), but requiring it for local dev would violate the
"testable without credentials" rule. When `UPSTASH_REDIS_REST_URL` is unset, the limiter falls
back to an in-process token bucket (adequate for a single dev/CI process, not for a multi-instance
production deployment — the env var must be set before launch, see `docs/LAUNCH-CHECKLIST.md`).

## Storage: only processed variants are ever public

Hard rule #5 says never serve originals to the storefront. Uploaded originals are written to a
non-public path (or a separate private bucket, TBD in Milestone 1) that only the service role can
read; only `product_images.storage_path_*` (variant paths) are exposed via the public-read
`product-images` bucket policy in `004_storage_buckets.sql`.
