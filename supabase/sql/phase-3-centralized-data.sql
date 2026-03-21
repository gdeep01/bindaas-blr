begin;

alter table public.traffic_history
  add column if not exists weather_condition text,
  add column if not exists weather_temp numeric(5,2),
  add column if not exists day_of_week int,
  add column if not exists departure_hour int,
  add column if not exists is_peak_hour boolean,
  add column if not exists is_weekend boolean;

create table if not exists public.data_refresh_heartbeat (
  id int primary key default 1,
  last_refreshed_at timestamptz not null default now(),
  traffic_locations_updated int not null default 0,
  avg_city_congestion numeric(5,2),
  weather_condition text,
  weather_temp numeric(5,2)
);

alter table public.data_refresh_heartbeat enable row level security;

drop policy if exists "data_refresh_heartbeat_public_read" on public.data_refresh_heartbeat;
create policy "data_refresh_heartbeat_public_read"
  on public.data_refresh_heartbeat
  for select
  using (true);

drop policy if exists "data_refresh_heartbeat_service_role_write" on public.data_refresh_heartbeat;
create policy "data_refresh_heartbeat_service_role_write"
  on public.data_refresh_heartbeat
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create table if not exists public.ai_predictions (
  id uuid primary key default gen_random_uuid(),
  predicted_at timestamptz not null default now(),
  best_time_window_start time,
  best_time_window_end time,
  best_time_is_future boolean,
  next_1h_congestion int,
  next_2h_congestion int,
  next_3h_congestion int,
  city_summary text,
  avoid_areas text[] not null default '{}',
  alternate_routes jsonb not null default '[]'::jsonb,
  raw_gemini_response text,
  avg_congestion_at_prediction numeric(5,2),
  weather_at_prediction text,
  hour_of_prediction int,
  day_of_prediction int
);

create index if not exists idx_ai_predictions_predicted_at
  on public.ai_predictions (predicted_at desc);

alter table public.ai_predictions enable row level security;

drop policy if exists "ai_predictions_public_read" on public.ai_predictions;
create policy "ai_predictions_public_read"
  on public.ai_predictions
  for select
  using (true);

drop policy if exists "ai_predictions_service_role_write" on public.ai_predictions;
create policy "ai_predictions_service_role_write"
  on public.ai_predictions
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create table if not exists public.disaster_alerts (
  id uuid primary key default gen_random_uuid(),
  fetched_at timestamptz not null default now(),
  alert_type text,
  severity text,
  location_name text,
  description text,
  raw_data jsonb,
  expires_at timestamptz not null
);

create index if not exists idx_disaster_alerts_fetched_at
  on public.disaster_alerts (fetched_at desc);

create index if not exists idx_disaster_alerts_expires_at
  on public.disaster_alerts (expires_at asc);

alter table public.disaster_alerts enable row level security;

drop policy if exists "disaster_alerts_public_read" on public.disaster_alerts;
create policy "disaster_alerts_public_read"
  on public.disaster_alerts
  for select
  using (true);

drop policy if exists "disaster_alerts_service_role_write" on public.disaster_alerts;
create policy "disaster_alerts_service_role_write"
  on public.disaster_alerts
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

commit;
