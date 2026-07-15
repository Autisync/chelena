-- Storage buckets: public-read (processed images only — originals are never
-- served, see docs/DECISIONS.md). Writes go through server routes using the
-- service role, so no INSERT/UPDATE/DELETE storage policies are needed for
-- anon/authenticated.
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('banners', 'banners', true)
on conflict (id) do nothing;

create policy "product-images public read"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "banners public read"
  on storage.objects for select
  using (bucket_id = 'banners');
