begin;

-- route_reliability (no changes needed)
create table if not exists public.route_reliability (
  id uuid primary key default gen_random_uuid(),
  route_hash text not null,
  from_location text not null,
  to_location text not null,
  day_of_week int not null check (day_of_week between 0 and 6),
  departure_hour int not null check (departure_hour between 0 and 23),
  weather_condition text not null default 'unknown',
  avg_duration_mins numeric(8,2) not null default 0,
  p90_duration_mins numeric(8,2) not null default 0,
  min_duration_mins numeric(8,2) not null default 0,
  sample_count int not null default 0,
  last_updated timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (route_hash, day_of_week, departure_hour, weather_condition)
);

create index if not exists idx_route_reliability_lookup
  on public.route_reliability (route_hash, day_of_week, departure_hour, weather_condition);

alter table public.route_reliability enable row level security;

drop policy if exists "route_reliability_public_read" on public.route_reliability;
create policy "route_reliability_public_read"
  on public.route_reliability for select using (true);

drop policy if exists "route_reliability_service_role_write" on public.route_reliability;
create policy "route_reliability_service_role_write"
  on public.route_reliability for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- locality_score_history (no changes needed)
create table if not exists public.locality_score_history (
  id uuid primary key default gen_random_uuid(),
  locality_name text not null,
  overall_mood_score int not null,
  growth_score int,
  schools_score int,
  healthcare_score int,
  parks_score int,
  entertainment_score int,
  snapshot_date date not null default current_date,
  data_source text not null default 'system',
  created_at timestamptz not null default now()
);

create index if not exists idx_locality_score_history_lookup
  on public.locality_score_history (locality_name, snapshot_date desc);

alter table public.locality_score_history enable row level security;

drop policy if exists "locality_score_history_public_read" on public.locality_score_history;
create policy "locality_score_history_public_read"
  on public.locality_score_history for select using (true);

drop policy if exists "locality_score_history_service_role_write" on public.locality_score_history;
create policy "locality_score_history_service_role_write"
  on public.locality_score_history for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- digest_subscribers (FIXED — split policies)
create table if not exists public.digest_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  areas_of_interest text[] not null default '{}',
  subscribed_at timestamptz not null default now(),
  is_active boolean not null default true,
  unsubscribe_token uuid not null default gen_random_uuid()
);

alter table public.digest_subscribers enable row level security;

drop policy if exists "digest_subscribers_service_role_only" on public.digest_subscribers;
drop policy if exists "digest_anyone_can_subscribe" on public.digest_subscribers;
drop policy if exists "digest_service_role_manage" on public.digest_subscribers;

-- FIX: allow frontend to insert new subscribers
create policy "digest_anyone_can_subscribe"
  on public.digest_subscribers
  for insert
  with check (true);

-- service role manages everything else
create policy "digest_service_role_manage"
  on public.digest_subscribers for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- garbage_reports (FIXED — foreign key + check constraint)
alter table public.garbage_reports
  add column if not exists user_id uuid 
    references auth.users(id) on delete set null,
  add column if not exists moderation_status text not null default 'reported',
  add column if not exists upvotes int not null default 0,
  add column if not exists reporter_name text;

alter table public.garbage_reports
  drop constraint if exists garbage_reports_moderation_status_check,
  add constraint garbage_reports_moderation_status_check
    check (moderation_status in ('reported', 'confirmed', 'resolved'));

-- traffic_history (no changes needed)
alter table public.traffic_history
  add column if not exists recorded_week date;

update public.traffic_history
set recorded_week = date_trunc('week', recorded_at at time zone 'UTC')::date
where recorded_week is null;

create or replace function public.set_traffic_history_recorded_week()
returns trigger
language plpgsql
as $$
begin
  new.recorded_week := date_trunc('week', new.recorded_at at time zone 'UTC')::date;
  return new;
end;
$$;

drop trigger if exists traffic_history_set_recorded_week on public.traffic_history;
create trigger traffic_history_set_recorded_week
before insert or update of recorded_at on public.traffic_history
for each row
execute function public.set_traffic_history_recorded_week();

create index if not exists idx_traffic_history_recorded_week
  on public.traffic_history (recorded_week, recorded_at desc);

commit;
