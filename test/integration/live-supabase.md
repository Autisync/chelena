# Live Supabase verification (manual, one-time)

Not an automated test (no CI credentials for this project) — a record of what was manually
verified against the real linked Supabase project (`hwlpdoowbbhxkqpvcrch`, see STATUS.md) once
real credentials became available mid-session. Re-run these `curl`/`supabase db query` checks
after any migration change to the tables/RPCs involved, before trusting them again.

## Migrations apply cleanly

```
supabase db push
supabase migration list   # local == remote for 001-004
```
Confirmed 2026-07-16: all 4 migrations applied without error on a fresh project.

## RLS enforces the policy table (docx/03-architecture.md §2)

```bash
# public read allowed
curl "$URL/rest/v1/categories?select=slug" -H "apikey: $ANON" -H "Authorization: Bearer $ANON"
curl "$URL/rest/v1/pickup_points?select=name" -H "apikey: $ANON" -H "Authorization: Bearer $ANON"
# admin-only, must return [] for anon
curl "$URL/rest/v1/settings?select=key" -H "apikey: $ANON" -H "Authorization: Bearer $ANON"
```
Confirmed: categories/pickup_points return seeded rows for anon; settings returns `[]`.

## `create_order` RPC validates before writing

```bash
curl "$URL/rest/v1/rpc/create_order" -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
  -H "Content-Type: application/json" -d '{"p_country":"PT", ..., "p_items":[]}'
# -> {"code":"22023","message":"cart is empty"}

curl ... -d '{..., "p_items":[{"product_id":"00000000-0000-0000-0000-000000000000","quantity":1}]}'
# -> {"code":"22023","message":"product ... is not available in PT"}
```
Confirmed both reject correctly with the expected Postgres error code (22023) and message.

**Happy path — verified 2026-07-16** (after seeding 8 demo products via `npm run seed:demo`):
a real order against a real product (`batom-mate-terracota`, qty 2) via the anon key initially
failed with a genuine bug (42702 "tracking_token is ambiguous" — see docs/DECISIONS.md), fixed
in migration `005`. Re-ran after the fix:
- `create_order` returned `{order_id, order_number: "CH-2026-000002", tracking_token}`.
- `product_country.stock` decremented 25 → 23 (qty 2 ordered).
- `order_items` (service-role read) had the correct snapshot: name, unit_price, quantity.
- `order_status_history` had one row: `pending_review`, note "order created via create_order()".
- `notifications` had one queued `order_received` row with the right `order_number` payload.
- `get_order_by_token` (anon key) returned the full order — guest tracking path works.
- Confirmed anon **cannot** read `order_items`/`orders` directly without the token (RLS working
  as intended — guest orders have `user_id = null`, so the own-row policy correctly excludes
  direct anon reads; only the token RPC bypasses it, matching the architecture doc's design).
Test order and its stock delta were cleaned up afterward (service role, manual).

## Notification dispatch — verified 2026-07-16

Real checkout via the dev server (browser, cart from a real seeded product) → confirmed:
- Server log showed the exact rendered mock WhatsApp text: `[MOCK WhatsApp -> +244912345678]
  (order_received): Olá Beatriz Neto! Recebemos o seu pedido CH-2026-000004 na Chelena. ...`
  — customer name and order number correctly interpolated from the DB, not placeholders.
- `notifications` row for that order: `status=sent`, `attempts=1`,
  `provider_message_id=mock-<uuid>` — confirms `dispatchQueuedNotifications()` ran inline after
  the checkout API responded and correctly updated the row.
Test order cleaned up afterward. Retry/fallback path (2 failed WhatsApp → switch to email) not
exercised — would need a forced failure, not worth destabilizing the live project to test.

## Not verified (needs a signed-up user)

Auth-gated paths (admin role guard, `is_admin()`, own-order `select` policy) need a real
`auth.users` row. Did not fabricate one via direct SQL insert into `auth.users` — that bypasses
GoTrue's own invariants (password hashing, confirmation tokens, etc.) and risks leaving the auth
schema in a state the Supabase Auth service doesn't expect. Signing up normally (email OTP or
Google) is a manual step for a real person with email access — see README "Create the first
admin".
