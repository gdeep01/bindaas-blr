# Bindaas BLR

**Navigate Bengaluru, bindaas.**

A civic intelligence web app built for Bengaluru — real-time traffic, commute planning, area livability scores, garbage reporting, disaster alerts, and AI-powered predictions, all in one place. Updated every 30 minutes.

---

## Why This Exists

Bengaluru has some of the worst traffic in the world, patchy public information, and no single place where a resident can check what's actually happening in the city right now. Bindaas BLR is an attempt to fix that — a tool built by someone who lives here, for people who live here.

The name is intentional. *Bindaas* — carefree, confident, no-nonsense. That's the experience this app aims to give you when you're trying to get somewhere in this city.

---

## Features

### Live Traffic Dashboard
Real-time congestion levels across Bengaluru's major corridors, hotspots, and junctions. Sourced from TomTom's Traffic API and refreshed every 30 minutes. Shows current speed vs free-flow speed, ETA comparisons, and a live city sentiment gauge.

### Commute Planner
Set a from/to route and get departure time recommendations based on historical congestion patterns pulled from a 262,080-row route reliability dataset. Includes cost estimates across Auto, Ola/Uber, Metro, BMTC, and Bike, and a chance-of-delay score derived from actual trip records.

### Area Livability Index
Scored rankings (0–100) for 76 Bengaluru localities across quality of living, green cover, schools, healthcare, and industrial safety. Compare up to 3 areas side by side. Scores are based on publicly available data and proximity analysis.

### Garbage & Cleanliness Map
Community-driven garbage reporting with photo upload and location tagging. Displays official BBMP complaint hotspots and user-submitted reports on an interactive map. Includes a reporter leaderboard.

### Landslide & Disaster Alerts
Landslide risk predictions for Karnataka districts using elevation, slope gradient, and rainfall data. Earthquake data pulled via USGS feed. NASA EONET integration for active natural events.

### Smart Predictions
Hourly AI-generated traffic insights powered by Gemini 1.5 Flash. Predicts congestion windows, suggests alternate routes, and flags areas to avoid — regenerated every hour from live data.

### Property Price Map
Per-sqft price data across 76 localities with year-on-year growth trends. Data sourced from 99acres, NoBroker, Coldwell Banker India, and Square Yards. Displayed as an optional map layer.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS |
| Maps | Leaflet + Leaflet.markercluster |
| Backend / DB | Supabase (PostgreSQL) |
| Edge Functions | Supabase Deno Edge Functions |
| Traffic Data | TomTom Traffic API |
| Weather | OpenWeatherMap API |
| AI Predictions | Google Gemini 1.5 Flash |
| Scheduling | pg_cron (Supabase) |
| Deployment | Vercel |

---

## Architecture

```
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── dashboard/       # Dashboard-specific widgets
│   │   ├── mood/            # Area livability components
│   │   └── ui/              # Base UI primitives
│   ├── contexts/            # React context providers
│   ├── data/                # Static datasets (property prices, area moods)
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utilities, tokens, constants
│   ├── pages/               # Page-level components
│   └── integrations/        # Supabase client config
│
├── supabase/
│   └── functions/           # Edge functions
│       ├── traffic-scheduler/    # Fetches TomTom data, writes to DB
│       ├── traffic-insights/     # Gemini AI prediction generator
│       └── landslide-predictions/ # Landslide risk computation
```

### Data Pipeline

Traffic data flows like this:

```
TomTom API → traffic-scheduler (edge function) → traffic_history table → frontend
```

The `traffic-scheduler` runs on four pg_cron jobs:
- Every 30 minutes (base refresh)
- Every 15 minutes during peak hours (7:30–9:30 AM and 4:30–7:30 PM IST)

AI predictions run separately — Gemini reads the latest traffic snapshot every hour and generates structured predictions stored in Supabase, which the frontend reads without hitting Gemini directly on each page load.

---

## Database Tables

| Table | Purpose |
|---|---|
| `traffic_history` | Time-series traffic data per location |
| `route_reliability` | 262,080 rows of historical route performance by hour and day |
| `garbage_reports` | Community-submitted garbage sightings |
| `garbage_hotspots` | Official BBMP complaint locations |
| `ai_traffic_insights` | Gemini-generated predictions cache |
| `landslide_risk_zones` | District-level risk data for Karnataka |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project
- API keys for TomTom, OpenWeatherMap, and Google Gemini

### Local Setup

```bash
git clone https://github.com/gdeep01/bindaas-blr.git
cd bindaas-blr
npm install
```

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_TOMTOM_API_KEY=your_tomtom_key
VITE_OPENWEATHER_API_KEY=your_openweather_key
VITE_GEMINI_API_KEY=your_gemini_key
```

```bash
npm run dev
```

App runs at `http://localhost:8080`.

### Edge Functions

Deploy the Supabase edge functions:

```bash
supabase functions deploy traffic-scheduler
supabase functions deploy traffic-insights
supabase functions deploy landslide-predictions
```

Set the following secrets in Supabase:

```bash
supabase secrets set TOMTOM_API_KEY=your_key
supabase secrets set OPENWEATHER_API_KEY=your_key
supabase secrets set GEMINI_API_KEY=your_key
supabase secrets set CRON_SECRET=bindaas-scheduler-2026
```

### Scheduling

Run this in the Supabase SQL Editor to activate automatic data refresh:

```sql
select cron.schedule(
  'traffic-scheduler-every-30-min',
  '*/30 * * * *',
  $$
  select net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/traffic-scheduler',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer your_anon_key"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

---

## Deployment

Deployed on Vercel. The `vercel.json` at the project root handles SPA routing:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Add all environment variables from `.env` to Vercel's project settings before deploying.

---

## Data Sources & Attribution

| Data | Source |
|---|---|
| Live traffic | TomTom Traffic API |
| Weather | OpenWeatherMap |
| Property prices | 99acres, NoBroker, Coldwell Banker India, Square Yards |
| Garbage hotspots | BBMP public complaint data |
| Earthquake data | USGS Earthquake Hazards Program |
| Natural events | NASA EONET |
| AI predictions | Google Gemini 1.5 Flash |

Property price data reflects March 2026 residential apartment rates (super built-up area). All livability scores are estimates based on publicly available data.

---

## Project Status

Active development. Launched on Ugadi 2026.

Coverage is currently Bengaluru-only. The architecture is designed to support other Indian cities — the data pipeline, scheduler, and frontend are all city-agnostic with minor configuration changes.

---

## Contributing

Issues and pull requests are welcome. If you spot incorrect data for a locality, wrong congestion readings, or a UI bug on your device — open an issue with as much detail as you can.

For larger contributions, open an issue first to discuss the approach before sending a PR.

---

## License

MIT License. See `LICENSE` for details.

---

*Built in Bengaluru. For Bengaluru.*