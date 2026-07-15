# EXECUTION PROMPT — Build "Chelena" (paste into Claude Sonnet / Claude Code)

You are building **Chelena**, a production-ready e-commerce web app, end to end. The repository includes four specification documents — read ALL of them before writing any code, and treat them as the source of truth:

1. `01-product-overview.md` — what the product is
2. `02-prd.md` — requirements (P0 = mandatory), user stories, acceptance criteria
3. `03-architecture.md` — stack, full SQL schema, RLS rules, integrations, SEO plan
4. `04-implementation-plan.md` — build order (Milestones 0–6) and exit tests

## Mission

Implement **every P0 requirement** in the PRD, following the architecture doc exactly, in the milestone order given. The result must be deployable to Vercel + Supabase and usable by a real business on day one.

## Summary of the product (context, not a replacement for the docs)

Single-seller cosmetics shop for **Angola and Portugal**. Country switcher (AO/PT) drives catalog, currency (AOA/EUR), pickup points, and payment instructions. **Guest checkout** (account optional): customer submits a cart with name + phone + preferred channel (WhatsApp/email) + pickup point. **Admin CRM** at `/admin`: product CRUD with per-country price/stock, automatic image compression pipeline (WebP variants, ≤200 KB detail size) with cropper and "advertisable" flag, order pipeline board (`pending_review → verified → awaiting_payment → paid → preparing → ready_for_pickup → completed`, plus `cancelled`), pickup points, banner/ad manager, review moderation, settings. **Every status transition automatically notifies the customer** via WhatsApp Cloud API template or email (Resend), with retry and channel fallback. **Reviews** are on-site (verified purchase, moderated) with a Google review deep link and a cached Google-rating widget (Places API). **SEO is a first-class requirement**: SSR/ISR, JSON-LD (Product, Organization, BreadcrumbList, WebSite), hreflang pt-PT/pt-AO/en, sitemap, OG images, Core Web Vitals budget.

## Hard rules

1. **Stack:** Next.js 14+ App Router, TypeScript strict, Tailwind + shadcn/ui, Supabase (Postgres/Auth/Storage). No other database or storage.
2. **Schema:** use the SQL in `03-architecture.md` verbatim as migration `001` (fix only genuine syntax errors; document any change in `docs/DECISIONS.md`). All tables get RLS per the policy table in that doc.
3. **Business logic lives in Supabase** (RPCs, RLS, triggers) or server route handlers — never trust the client. `create_order` must be a Postgres function that validates stock and snapshots prices atomically.
4. **Security:** service-role key server-side only; zod validation on every route handler; rate limiting on checkout/review/auth; guest order access only via `tracking_token` checked server-side.
5. **Images:** process server-side with sharp exactly as specified (variants thumb 200 / card 600 / detail 1200 / banner 1600, WebP, strip EXIF, detail ≤ 200 KB). Never serve originals to the storefront.
6. **Notifications:** transition → row in `notifications` → dispatcher with max 3 attempts → fallback to the other channel. WhatsApp = Cloud API template messages (create the template payloads and a `docs/whatsapp-templates.md` with the exact template bodies to submit to Meta, in Portuguese). Provide a `MOCK_PROVIDERS=true` mode that logs instead of calling Meta/Resend so the app is fully testable without credentials.
7. **i18n:** `next-intl`; ALL user-facing strings in locale files; `pt` complete and default, `en` complete. Country ≠ language.
8. **Design quality bar:** modern, minimal, mobile-first. Product photography leads; generous whitespace; one accent color via CSS tokens; skeletons for loading; polished empty/error states; WCAG AA contrast; every interactive element keyboard-accessible. No template-looking generic UI.
9. **No placeholders in code paths** — every P0 feature must actually work. Where external credentials are required, the mock mode must exercise the full code path.
10. **Testing:** Playwright e2e for: browse→cart→checkout (guest), admin verify→status advance→notification enqueued, review submit+moderate. Unit tests for the image pipeline and `create_order`. All tests must pass.

## Deliverables

- Complete monorepo: Next.js app, `supabase/migrations`, `supabase/seed.sql` (categories, 4 pickup points, 8 demo products with generated placeholder images run through the real pipeline), tests, and:
  - `README.md` — setup, env vars table, local dev (supabase CLI), deploy steps (Vercel + Supabase), how to create the first admin.
  - `docs/whatsapp-templates.md` — Meta template submissions.
  - `docs/LAUNCH-CHECKLIST.md` — the manual prerequisites from `04-implementation-plan.md`.
  - `docs/DECISIONS.md` — any deviations from spec, with reasons.
- `.env.example` with every variable from `03-architecture.md`.

## Working method

- Follow Milestones 0→6 in order; after each milestone, run its **exit test** from `04-implementation-plan.md` and self-verify before continuing.
- Prefer boring, well-typed, maintainable code over cleverness. Comment the non-obvious (RLS intents, notification state machine, image pipeline decisions).
- If a requirement is ambiguous, choose the interpretation most consistent with the PRD's goals, implement it, and record it in `docs/DECISIONS.md` — do not stop to ask.

## Definition of done

Every P0 checkbox in `02-prd.md` is implemented and demonstrated by a passing test or a documented manual verification step; Lighthouse mobile on the PDP: SEO ≥ 95, Performance ≥ 85; the full order lifecycle works in mock-provider mode from a fresh clone using only the README.
