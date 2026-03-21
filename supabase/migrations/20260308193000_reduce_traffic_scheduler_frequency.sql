select cron.unschedule('traffic-scheduler-every-minute');

select cron.schedule(
  'traffic-scheduler-every-5-minutes',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://mnrkmiquglcfmzjeqfla.supabase.co/functions/v1/traffic-scheduler',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ucmttaXF1Z2xjZm16amVxZmxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NjczMTcsImV4cCI6MjA4ODM0MzMxN30.F0ApPZdnP6d1baZxHgnEq0SUb_rlaw1MwILxKV_IyOc", "x-cron-secret": "bindaas-cron-2026"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);
