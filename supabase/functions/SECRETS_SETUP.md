# Edge Function Secrets Setup

Go to: Supabase Dashboard -> Edge Functions -> [function name] -> Secrets

Set these secrets for EVERY function:

| Secret | Where to get it |
|--------|-----------------|
| SUPABASE_URL | Dashboard -> Settings -> API -> Project URL |
| SUPABASE_SERVICE_ROLE_KEY | Dashboard -> Settings -> API -> service_role (secret) |
| TOMTOM_API_KEY | developer.tomtom.com -> My Apps |
| OPENWEATHER_API_KEY | home.openweathermap.org -> API Keys |
| GEMINI_API_KEY | aistudio.google.com -> Get API Key |
| ALLOWED_ORIGIN | Your production domain e.g. https://bindaasblr.com |

IMPORTANT: Use SERVICE_ROLE_KEY not ANON_KEY.
The anon key cannot write to tables protected by RLS.

After setting secrets, test each function:

```bash
curl -X POST \
  https://mnrkmiquglcfmzjeqfla.supabase.co/functions/v1/traffic-scheduler \
  -H "Authorization: Bearer [ANON_KEY]" \
  -H "Content-Type: application/json" \
  -d "{}"
```

Then check Supabase Dashboard -> Table Editor -> traffic_history
A new row should appear within 5 seconds.

If no row appears: Dashboard -> Edge Functions ->
traffic-scheduler -> Logs -> look for [FATAL] or [TomTom] errors.
