alter table public.garbage_reports
  add column if not exists image_urls text[] not null default '{}'::text[],
  add column if not exists reporter_ip_hash text;

create index if not exists garbage_reports_reporter_ip_hash_reported_at_idx
  on public.garbage_reports (reporter_ip_hash, reported_at desc);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'garbage-report-images',
  'garbage-report-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public can view garbage report images'
  ) then
    create policy "Public can view garbage report images"
      on storage.objects for select
      using (bucket_id = 'garbage-report-images');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Authenticated users can upload garbage report images'
  ) then
    create policy "Authenticated users can upload garbage report images"
      on storage.objects for insert
      to authenticated
      with check (bucket_id = 'garbage-report-images');
  end if;
end $$;
