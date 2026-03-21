begin;

with ranked_history as (
  select
    ctid,
    row_number() over (
      partition by locality_name, snapshot_date
      order by created_at asc, id asc
    ) as row_number
  from public.locality_score_history
)
delete from public.locality_score_history
where ctid in (
  select ctid
  from ranked_history
  where row_number > 1
);

alter table public.locality_score_history
  drop constraint if exists locality_score_history_locality_name_snapshot_date_key,
  add constraint locality_score_history_locality_name_snapshot_date_key
    unique (locality_name, snapshot_date);

update public.garbage_reports
set moderation_status = case
  when status = 'resolved' then 'resolved'
  when status = 'in_progress' then 'confirmed'
  else 'reported'
end
where coalesce(moderation_status, '') = '' or moderation_status = 'reported';

drop index if exists idx_garbage_reports_status;

alter table public.garbage_reports
  drop column if exists status;

commit;
