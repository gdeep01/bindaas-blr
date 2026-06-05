# Bindaas BLR

Bindaas BLR is a Bengaluru civic dashboard for traffic, commute planning, area livability, garbage reports, and city alerts.

The app is meant to answer one practical question: what is happening around Bengaluru right now, and how does it affect where you live or travel?

## What It Shows

- Live traffic congestion and hotspot data from TomTom
- Commute route timing, delay context, and reliability samples
- Area livability scores for Bengaluru localities
- Community garbage reports with photo and location support
- Garbage hotspots and map layers for civic visibility
- Weather, incident, road-work, earthquake, and natural-event layers
- Scheduled traffic insights generated from the latest stored traffic snapshot

## Data Notes

The dashboard hero is wired to app data, not random demo numbers.

- City congestion comes from the current traffic snapshot.
- Mood is derived from the current city congestion score.
- Rain risk comes from the current weather impact level.
- Reports use the stored garbage report count.
- Corridor and ticker numbers come from live traffic hotspots.
- If a value is unavailable, the UI shows `--` instead of inventing a number.

Some non-live datasets are still static project data:

- Livability scores are local project estimates.
- Property prices are stored in the repo as locality data.
- Metro station data is static reference data.

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Supabase
- Supabase Edge Functions
- Leaflet
- Recharts

## Local Setup

Install dependencies:

```bash
npm install
```

Create `.env` in the project root:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_TOMTOM_API_KEY=your_tomtom_key
VITE_OPENWEATHER_API_KEY=your_openweather_key
VITE_GEMINI_API_KEY=your_gemini_key
```

Run the app:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Run tests:

```bash
npm test
```

## Project Structure

```text
src/
  components/       reusable UI and feature components
  contexts/         shared app data providers
  data/             static Bengaluru datasets
  hooks/            React hooks
  integrations/     Supabase client and generated types
  lib/              utilities and data helpers
  pages/            route-level screens

supabase/
  functions/        Edge Functions
  migrations/       database migrations
  sql/              setup and hardening SQL
```

## Supabase Functions

The main backend jobs live in `supabase/functions`:

- `traffic-scheduler`
- `traffic-insights`
- `landslide-predictions`
- `civic-reports`
- `garbage-upvote`
- `update-display-name`

Set Supabase secrets for the API keys used by those functions before deploying them.

## License

MIT
