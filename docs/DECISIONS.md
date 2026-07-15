# Decisions

Deviations from the spec docs, and resolutions to ambiguous requirements, with reasons. Newest first.

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
