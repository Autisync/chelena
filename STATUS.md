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
- [ ] **Milestone 1 — Admin: products & images** — not started. Next up: admin layout nav shell,
      product CRUD (per-country tabs), image upload route (sharp pipeline: thumb/card/detail/
      banner, WebP, ≤200KB detail, EXIF strip), cropper, pickup points CRUD, settings page.
- [ ] **Milestone 2 — Storefront** — home page is a placeholder hero only; needs category tiles,
      featured/promo sections, listing+filters, PDP, country switcher, cart, SEO plumbing.
      **Run design-consultation (ui-ux-pro-max or impeccable skill) before this milestone** per
      the user's explicit instruction — establishes the real design system/tokens; current UI
      uses shadcn defaults only.
- [ ] **Milestone 3 — Checkout & orders** — `create_order`/`get_order_by_token` RPCs exist
      (migration 003) but no checkout form, confirmation/tracking pages, or admin pipeline board
      yet. `advance_order_status` RPC (admin transitions) not written yet.
- [ ] **Milestone 4 — Notifications** — schema + `create_order`'s initial `order_received` enqueue
      exist; no dispatcher, WhatsApp/Resend senders, or webhook yet.
- [ ] **Milestone 5 — Reviews, Google, banners, polish** — not started.
- [ ] **Milestone 6 — Production readiness** — not started.

## Immediate next steps (pick up here)

1. Verify `supabase start` + `supabase db push` + `supabase db seed` actually work in this
   environment (Docker required — check availability first).
2. Auth: email OTP + Google sign-in pages under `app/(store)/[locale]/account/`.
3. Run design-consultation before building real storefront UI (Milestone 2 requirement above).
4. Then proceed Milestone 1 → 2 → ... in order per the implementation plan.

## Known follow-ups / risks

- `middleware.ts` triggers a Next 16 deprecation warning (wants `proxy.ts`). Left as-is for now;
  revisit once next-intl's proxy-based middleware guidance is confirmed (see docs/DECISIONS.md).
- `lib/supabase/types.ts` is a stub (`Database = any`) until `supabase gen types` runs against a
  live instance — regenerate before writing any Supabase-typed query code.
- No test infra set up yet (Playwright/vitest) — needed before Milestone 6 exit test, but unit
  tests for `create_order` and the image pipeline should start as those pieces are built, not be
  deferred to the end.

## Session log

- 2026-07-15/16: Milestone 0 foundation built and committed (see git log). Stopping point for
  this /loop iteration — see commit for exact state. Resume cadence: user asked for a 3-hour
  gap; `ScheduleWakeup` caps a single call at 1 hour, so the loop re-arms itself hourly and
  only resumes real build work once ~3 cumulative hours have passed (tracked via commit
  timestamps / this file) — otherwise it just re-arms without churning tokens.
