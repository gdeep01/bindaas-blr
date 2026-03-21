begin;

drop policy if exists "Anyone can report garbage issues" on public.garbage_reports;
drop policy if exists "Authenticated users can insert garbage reports" on public.garbage_reports;
create policy "Authenticated users can insert garbage reports"
  on public.garbage_reports
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Service role can insert traffic data" on public.traffic_history;
drop policy if exists "Service role only can insert traffic data" on public.traffic_history;
create policy "Service role only can insert traffic data"
  on public.traffic_history
  for insert
  with check (auth.role() = 'service_role');

commit;
