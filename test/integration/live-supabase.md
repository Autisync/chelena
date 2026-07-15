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
**Not yet verified**: the happy path (valid product + stock decrement + order_items snapshot +
order_status_history + notifications row) — needs at least one seeded product with
`product_country` visible in a given country, which requires the image pipeline's demo-product
seed script (`scripts/seed-demo-products.ts`, not yet written — see STATUS.md).

## Not verified (needs a signed-up user)

Auth-gated paths (admin role guard, `is_admin()`, own-order `select` policy) need a real
`auth.users` row. Did not fabricate one via direct SQL insert into `auth.users` — that bypasses
GoTrue's own invariants (password hashing, confirmation tokens, etc.) and risks leaving the auth
schema in a state the Supabase Auth service doesn't expect. Signing up normally (email OTP or
Google) is a manual step for a real person with email access — see README "Create the first
admin".
