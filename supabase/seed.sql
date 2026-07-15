-- Seed data: 2 categories, 4 pickup points (2 AO / 2 PT), settings placeholders.
-- Demo products with real processed images are added by
-- `scripts/seed-demo-products.ts` (Milestone 1, once the image pipeline exists)
-- rather than raw SQL, since they need to go through sharp to satisfy hard
-- rule #5 (never serve originals). Run: `npx tsx scripts/seed-demo-products.ts`.

insert into categories (slug, name_pt, name_en, sort_order) values
  ('rosto', 'Rosto', 'Face', 1),
  ('corpo', 'Corpo', 'Body', 2)
on conflict (slug) do nothing;

insert into pickup_points (country, name, address, city, hours, maps_url) values
  ('AO', 'Chelena Talatona', 'Rua Principal, Talatona', 'Luanda', 'Seg-Sáb 9h-18h', null),
  ('AO', 'Chelena Ingombota', 'Rua da Missão, Ingombota', 'Luanda', 'Seg-Sáb 9h-18h', null),
  ('PT', 'Chelena Lisboa', 'Av. da Liberdade, 100', 'Lisboa', 'Seg-Sex 10h-19h', null),
  ('PT', 'Chelena Porto', 'Rua de Santa Catarina, 200', 'Porto', 'Seg-Sex 10h-19h', null);

insert into settings (key, value) values
  ('whatsapp_numbers', '{"AO": null, "PT": null}'),
  ('payment_templates', '{
    "AO": "Multicaixa referência: entidade XXXXX, referência {{payment_reference}}, valor {{amount}} AOA.",
    "PT": "MB Way: XXX XXX XXX, ou IBAN PT50 XXXX XXXX XXXX XXXX XXXX X, referência {{order_number}}."
  }'),
  ('google_place_id', 'null')
on conflict (key) do nothing;
