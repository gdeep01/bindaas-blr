begin;

create table if not exists public.garbage_report_votes (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.garbage_reports(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (report_id, user_id)
);

create index if not exists idx_garbage_report_votes_report
  on public.garbage_report_votes (report_id);

create index if not exists idx_garbage_report_votes_user
  on public.garbage_report_votes (user_id);

alter table public.garbage_report_votes enable row level security;

drop policy if exists "garbage_report_votes_service_role_only" on public.garbage_report_votes;
create policy "garbage_report_votes_service_role_only"
  on public.garbage_report_votes
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

commit;
