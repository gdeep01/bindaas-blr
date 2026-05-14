# Bindaas BLR — Complete Application Documentation

> **Last Updated:** May 2026

---

## Table of Contents

1. [What Does This Application Do?](#1-what-does-this-application-do)
2. [Features Overview](#2-features-overview)
3. [Data Sources — Real vs Hardcoded](#3-data-sources--real-vs-hardcoded)
4. [Metrics & Calculation Methodologies](#4-metrics--calculation-methodologies)
5. [Tech Stack](#5-tech-stack)
6. [Architecture Overview](#6-architecture-overview)
7. [What Can Be Made Better](#7-what-can-be-made-better)

---

## 1. What Does This Application Do?

**Bindaas BLR** is a real-time urban intelligence dashboard for Bengaluru (Bangalore), India. It aggregates live traffic, weather, seismic, garbage management, and livability data into a single interactive interface.

The app answers questions like:
- *"How bad is traffic right now?"*
- *"Which areas are best for families to live in?"*
- *"Where should I invest — which areas have high future growth potential?"*
- *"Are there landslide risks in Karnataka today?"*
- *"Where are garbage dumping hotspots?"*

It auto-refreshes every **30 seconds** and combines multiple real-time APIs with AI-powered analysis.

---

## 2. Features Overview

### 2.1 Real-Time Traffic Dashboard
- **City Congestion Index** — A 0–100 gauge showing overall city traffic health, calculated from live TomTom API data.
- **Top Congestion Zones** — Live congestion levels for 10 key Bengaluru junctions (Silk Board, Marathahalli, KR Puram, Hebbal, etc.) with trend indicators (↑ ↓ →).
- **Corridor Status Panel** — Real-time delay analysis for major corridors showing base time vs actual time, delay in minutes, and impact score bar.
- **Today's Traffic Pattern** — Hourly trend chart showing actual congestion (past hours) and predicted congestion (future hours).

### 2.2 Quick Stats Cards
| Metric | Source |
|--------|--------|
| Average Commute Time | Calculated from live congestion × base commute times |
| Peak Hour | Detected from 24-hour historical traffic_history database records |
| Active Incidents | Live count from TomTom Incident API |
| Road Works | Live count from TomTom Incident API (category 9) |
| Garbage Reports | User-submitted reports stored in database |

### 2.3 Interactive Map (Leaflet)
- Traffic congestion heatmap markers (color-coded red/yellow/green)
- Live incident markers with severity
- Road works markers
- Garbage hotspots (static BBMP data + user reports)
- Landslide risk zones (Karnataka-wide)
- Earthquake markers (USGS data)
- NASA EONET natural event markers
- Search box for location lookup

### 2.4 AI Traffic Insights
- **Summary** — AI-generated natural language analysis of current traffic conditions
- **Predictions** — Time-specific congestion forecasts with insights
- **Best Time to Travel** — AI recommendation
- **Alternate Routes** — Suggested detours with estimated time savings
- **Avoid Areas** — List of areas to avoid right now
- Powered by Google Gemini (no API key required)

### 2.5 Garbage Management
- **Report Form** — Users can submit garbage reports (illegal dumping, bin overflow, waste burning, hazardous waste) with location coordinates and severity
- **Known Hotspots** — Static BBMP waste collection centers and dump yards displayed on map
- **User Reports** — Stored in database, displayed as markers on the map

### 2.6 Landslide & Natural Disaster Panel
- **Karnataka Landslide Risk Zones** — 30 districts with composite risk scores
- **Earthquake Monitoring** — Recent seismic activity near Karnataka (USGS)
- **NASA EONET Events** — Landslide and natural events tracked globally, filtered for India/Karnataka

### 2.7 City Mood Index (Livability Scores)
- **80+ Bengaluru localities** scored on 8 livability metrics
- **"Best For" Tags** — Auto-generated labels (Families, IT Professionals, Students, Budget Friendly, etc.)
- **Future Growth Potential Score** — Data-driven 0–100 score for each area
- **Growth Drivers & Risk Factors** — Per-area bullets explaining what's driving growth and what risks exist
- **Sorting** — By Growth Score, Overall Mood, or Alphabetical

### 2.8 Weather Integration
- Current weather conditions displayed with traffic impact level
- Weather impact multiplier applied to commute time calculations
- Per-zone weather fetched for landslide risk assessment

---

## 3. Data Sources — Real vs Hardcoded

### ✅ REAL-TIME DATA (Live API Calls)

| Data | Source | API | Update Frequency |
|------|--------|-----|-----------------|
| Traffic flow (speed, congestion) | TomTom Traffic Flow API v4 | `api.tomtom.com/traffic/services/4/flowSegmentData` | Every 30s |
| Traffic incidents (accidents, jams, closures) | TomTom Incident API v5 | `api.tomtom.com/traffic/services/5/incidentDetails` | Every 30s |
| Road works | TomTom Incident API v5 (category 9) | Same as above | Every 30s |
| Weather (Bengaluru) | OpenWeatherMap | `api.openweathermap.org/data/2.5/weather` | Every 30s |
| Weather (Karnataka zones) | OpenWeatherMap | Same, per-zone coordinates | On landslide panel load |
| Earthquakes | USGS Earthquake Hazards Program | `earthquake.usgs.gov/fdsnws/event/1/query` | On landslide panel load |
| NASA natural events | NASA EONET v3 | `eonet.gsfc.nasa.gov/api/v3/events` | On landslide panel load |
| AI predictions & insights | Google Gemini | Backend edge function | On demand |
| User garbage reports | Application database | Supabase | Real-time |
| Traffic history | Application database | Stored per 30s refresh | Continuous |

### 📊 HARDCODED / STATIC DATA

| Data | Location | Notes |
|------|----------|-------|
| Bengaluru key locations (10 junctions) | `traffic-insights/index.ts` | Names, coordinates, and base commute times. These are fixed reference points. |
| Karnataka landslide zones (30 districts) | `landslide-predictions/index.ts` | District coordinates, terrain risk levels, elevation, slope, soil type, annual rainfall, historical event counts. Based on Karnataka SDMA & GSI data but manually entered. |
| BBMP garbage hotspots (12 locations) | `src/data/garbageData.ts` | Collection centers, dump yards, known hotspots. Static BBMP locations. |
| Mood Index — 80+ area scores | `src/data/moodData.ts` | All 8 livability metrics per area are hardcoded estimates (0–100) based on geographic proximity analysis. |
| Growth data per area | `src/data/moodData.ts` | Infrastructure, commercial, price momentum, connectivity, undervaluation scores — manually assigned based on BMRCL announcements, real estate trends, and public project data. |
| "Best For" tag thresholds | `src/data/moodData.ts` | Rule-based: e.g., Schools≥75 + Healthcare≥70 + Parks≥60 → "Families" |


### 🔄 COMPUTED / DERIVED DATA

| Data | How It's Calculated |
|------|-------------------|
| Congestion Level per junction | `(1 - currentSpeed/freeFlowSpeed) × 100` from TomTom flow data |
| City Congestion Index (Sentiment Score) | Weighted average of all junction congestion levels |
| Average Commute Time | `baseCommute × (1 + congestion/100 × 1.5) × weatherMultiplier` |
| Peak Hour | Hour with highest average congestion from 24h database history |
| Corridor delay | `baseTime + congestionDelay + incidentDelay` |
| Hourly trend (past) | Stored in traffic_history database table |
| Hourly trend (predicted) | Pattern-based projection adjusted by current conditions |
| Landslide Risk Score | Composite formula (see Section 4) |
| Future Growth Score | Weighted formula (see Section 4) |
| Overall Mood Score | Simple average of 8 metric scores |

---

## 4. Metrics & Calculation Methodologies

### 4.1 Traffic Congestion Level
```
Congestion % = (1 - currentSpeed / freeFlowSpeed) × 100
```
- `currentSpeed` and `freeFlowSpeed` come from TomTom Traffic Flow API
- Clamped to 0–95%
- If API fails, returns -1

### 4.2 City Congestion Index (0–100)
```
sentimentScore = weightedAverage(allHotspotCongestionLevels)
```
Applied multipliers:
- Peak hour (8–10 AM, 5–8 PM): ×1.15
- Weekend: ×0.7
- Weather impact: none/low/moderate/severe → ×1.0/1.1/1.2/1.4

### 4.3 Average Commute Time
```
avgCommuteMinutes = avgBaseCommute × congestionMultiplier × weatherMultiplier
```
Where:
- `avgBaseCommute` = average of 10 junction base commute times (~8.8 min)
- `congestionMultiplier` = `1 + (avgCongestion/100) × 1.5`
- `weatherMultiplier` = 1.0 (clear) to 1.4 (severe weather)

### 4.4 Corridor Impact Score
```
impactScore = min(100, congestionLevel × 1.2 + (hasIncident ? 15 : 0) + (hasRoadWork ? 10 : 0))
```
Status thresholds:
- < 40% + no incident → "clear"
- < 65% → "moderate"
- ≥ 65% → "congested"

### 4.5 Weather Impact on Traffic
| Condition | Impact Level |
|-----------|-------------|
| Thunderstorm (200–299) | Severe |
| Heavy rain (≥502) | Severe |
| Moderate rain (501) | Moderate |
| Light rain (500) | Low |
| Fog/mist (visibility < 500m) | Severe |
| Fog/mist (visibility < 1000m) | Moderate |
| Wind > 15 m/s | Severe |
| Wind > 10 m/s | Low |

### 4.6 Landslide Risk Score (0–100)

Composite of 5 factors:

| Factor | Max Points | Calculation |
|--------|-----------|-------------|
| **Terrain Risk** | 35 | very_high=35, high=25, moderate=15, low=5 |
| **Slope** | 15 | `slope × 0.5`, capped at 15 |
| **Historical Events** | 10 | `historicalEvents × 0.3`, capped at 10 |
| **Rainfall (Real-time)** | 25 | >50mm=25, >30mm=20, >15mm=15, >5mm=8, >0=3 |
| **Humidity** | 5 | >90%=5, >80%=3, >70%=1 |
| **Cloud Cover** | 3 | >90%=3 |
| **Seismic Activity** | 10 | Based on nearby earthquake magnitude (≥5=10, ≥4=7, ≥3=4) |

Risk levels: ≥70 = Critical, ≥50 = High, ≥30 = Moderate, <30 = Low

### 4.7 Future Growth Potential Score (0–100)

Weighted model based on 5 pillars:

| Pillar | Weight | Max Raw | Description |
|--------|--------|---------|-------------|
| **Infrastructure** | 30% | 30 | Upcoming metro, road expansion, flyovers, civic upgrades |
| **Commercial** | 20% | 20 | New tech parks, office leasing, retail hubs |
| **Price Momentum** | 20% | 20 | 2–3 year property price CAGR |
| **Connectivity** | 15% | 15 | Distance to IT hubs, metro interchange, ORR access |
| **Undervaluation** | 15% | 15 | Quality of Life / Price ratio (hidden gems detector) |

```
Growth Score = (infra/30)×30 + (commercial/20)×20 + (priceMomentum/20)×20 + (connectivity/15)×15 + (undervaluation/15)×15
```

Each area also has:
- **Growth Drivers**: e.g., "Metro Phase 2 station", "IT hub expansion", "Peripheral Ring Road"
- **Risk Factors**: e.g., "Water stress", "Traffic saturation", "Infrastructure lag"

### 4.8 "Best For" Tag Generation

Auto-generated from metric thresholds:

| Tag | Rule |
|-----|------|
| Families | Schools≥75, Healthcare≥70, Parks≥60, Traffic≥40 |
| Students | Schools≥70, Entertainment≥60, Quality≤70 |
| IT Professionals | Traffic≥30, Entertainment≥60, Quality≥70 |
| Quiet Residential | Traffic≥50, Parks≥65, Entertainment≤55 |
| High Nightlife | Entertainment≥80 |
| Retirees | Parks≥75, Healthcare≥75, Traffic≥45 |
| Young Professionals | Entertainment≥65, Quality 65–85 |
| Budget Friendly | Quality≤55 |

### 4.9 Livability Metrics (8 Categories)

| Metric | Icon | Data Source Description |
|--------|------|----------------------|
| Quality of Living | 🏠 | Health, employment & wealth indicators |
| Parks & Green | 🌳 | Parks & green spaces within 1 km |
| Schools | 🏫 | Schools within 1 km radius |
| Healthcare | 🏥 | Hospitals within 2–4 km radius |
| Industrial Safety | 🏭 | Industrial zone proximity (inverse) |
| Entertainment | 🎭 | Restaurants, pubs, clubs & amusement parks nearby |
| Fire Station | 🚒 | Fire stations within 1–2 km radius |
| Traffic Flow | 🚦 | Live congestion, incidents & roadworks data |

**Overall Mood** = Simple average of all 8 scores (0–100).

---

## 5. Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 18** | UI framework |
| **TypeScript** | Type safety |
| **Vite** | Build tool & dev server |
| **Tailwind CSS** | Utility-first styling |
| **shadcn/ui** | Component library (Button, Card, Dialog, Tabs, Toast, etc.) |
| **Recharts** | Traffic trend charts |
| **Leaflet** | Interactive map with marker clusters |
| **Lucide React** | Icon library |
| **React Router DOM** | Client-side routing |
| **TanStack React Query** | Data fetching & caching |
| **React Hook Form + Zod** | Form validation (garbage report form) |
| **Sonner** | Toast notifications |

### Backend
| Technology | Purpose |
|-----------|---------|
| **Supabase** | Database, auth, edge functions |
| **PostgreSQL** | Data storage (traffic_history, garbage_reports) |
| **Edge Functions (Deno)** | Serverless API aggregation |
| **Google Gemini** | AI-powered traffic predictions |

### External APIs
| API | Provider | Used For |
|-----|----------|---------|
| Traffic Flow API v4 | TomTom | Real-time speed & congestion per junction |
| Traffic Incident API v5 | TomTom | Accidents, jams, road closures, road works |
| Weather API | OpenWeatherMap | Current weather, rainfall, visibility |
| Earthquake API | USGS | Seismic activity near Karnataka |
| EONET v3 | NASA | Natural disaster events (landslides) |
| Gemini AI | Google | Traffic analysis, predictions, route suggestions |

### Database Tables
| Table | Purpose |
|-------|---------|
| `traffic_history` | Stores congestion snapshots every 30s for trend analysis |
| `garbage_reports` | User-submitted garbage/waste reports with location |

---

## 6. Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                    Frontend (React)              │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │ Dashboard │ │   Map    │ │  Mood Index      │ │
│  │ (Index)   │ │(Leaflet) │ │  (80+ areas)     │ │
│  └─────┬─────┘ └────┬─────┘ └────────┬─────────┘ │
│        │             │                │           │
│  ┌─────▼─────────────▼────────────────▼─────────┐ │
│  │          API Layer (trafficApi.ts)            │ │
│  │          (landslideApi.ts)                    │ │
│  └──────────────────┬───────────────────────────┘ │
└─────────────────────┼───────────────────────────┘
                      │
              ┌───────▼───────┐
              │    Supabase   │
              │ (Edge Functions│
              │  + Database)   │
              └───────┬───────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
  ┌─────▼─────┐ ┌────▼────┐ ┌─────▼─────┐
  │  TomTom   │ │OpenWeather│ │USGS/NASA │
  │ Traffic   │ │   Map    │ │ Seismic  │
  └───────────┘ └─────────┘ └──────────┘
```

**Data Flow:**
1. Frontend calls edge functions every 30 seconds
2. Edge functions aggregate data from multiple external APIs in parallel
3. Processed data is returned to frontend and stored in database for historical analysis
4. AI predictions are generated on-demand using Gemini with current traffic context

---

## 7. What Can Be Made Better

### 🔴 High Priority

| Improvement | Current State | What to Do |
|-------------|--------------|------------|
| **Real livability data** | All 80+ area scores (Schools, Parks, Healthcare, etc.) are manually estimated | Integrate Google Places API or OpenStreetMap Overpass API to count actual amenities within radius per area |
| **Real property price data** | Growth "Price Momentum" scores are hardcoded | Integrate real estate APIs (99acres, MagicBricks) or scrape public data for actual CAGR |
| **User authentication** | No auth — garbage reports are anonymous | Add login/signup so reports are tied to users, enabling report tracking and moderation |
| **Mobile PWA** | Regular responsive web app | Add service worker, manifest.json, offline caching for mobile-app-like experience |
| **Error handling for API failures** | Basic try/catch, user sees "Loading..." forever if APIs are down | Add proper fallback UI, retry logic, and cached data display when APIs fail |

### 🟡 Medium Priority

| Improvement | Details |
|-------------|---------|
| **Historical trend analysis** | Store daily averages and show week-over-week, month-over-month trends. Currently only 24h history is used. |
| **Push notifications** | Alert users when their saved routes have incidents or when congestion spikes. The `useNotifications` hook exists but isn't fully implemented. |
| **Area comparison tool** | Side-by-side comparison of 2–3 areas on Mood Index metrics and growth potential. |
| **Growth score transparency** | Show users exactly how scores were calculated with expandable methodology per area. |
| **Map layer controls** | Let users toggle individual map layers (traffic, garbage, landslide, earthquakes) independently. |
| **Dark/Light mode** | Theme toggle — CSS variables are set up but no toggle UI exists. |
| **Rate limiting** | TomTom API has rate limits. Add caching layer (Redis or in-memory) in edge functions to avoid hitting limits. |
| **Garbage report moderation** | Currently all reports show immediately. Add admin review workflow. |

### 🟢 Nice to Have

| Improvement | Details |
|-------------|---------|
| **Commute route planner** | Enter origin/destination, get AI-recommended route with live conditions. |
| **Area-specific weather** | Show micro-weather per Bengaluru area instead of city-wide. |
| **Traffic camera feeds** | Integrate BTMC camera feeds if they have a public API. |
| **Social sentiment integration** | Analyze Twitter/X posts about Bengaluru traffic for crowd-sourced sentiment. |
| **Multi-city support** | Extend to other Indian metros (Hyderabad, Chennai, Mumbai). |
| **Gamification** | Reward users for garbage reports (points, badges, leaderboard). |
| **Data export** | Let users download traffic/mood data as CSV or PDF reports. |
| **Accessibility (a11y)** | Add ARIA labels, keyboard navigation, screen reader support. |
| **Performance optimization** | Lazy load map, virtualize large lists (80+ mood cards), reduce bundle size. |
| **Testing** | No tests exist currently. Add unit tests for calculation functions and integration tests for API calls. |

### 🏗️ Technical Debt

| Issue | Details |
|-------|---------|
| No test coverage | Zero unit or integration tests |
| Large monolithic Index.tsx | 467 lines — should be split into smaller page sections |
| Hardcoded API keys in edge functions | API keys should be managed via environment secrets (partially done) |
| No data caching strategy | Every 30s refresh hits all APIs — should cache and serve stale data when rate-limited |
| Leaflet CSS imported globally | Could cause conflicts; should be scoped |
| No CI/CD pipeline | No automated builds, tests, or deployments |

---

## Disclaimer

> All area livability ratings are based on publicly available data, geographic proximity analysis, and general public sentiment. They are not intended as subjective or official assessments. The Future Growth Potential Score estimates development potential based on publicly announced projects and historical trends — it is **not** investment advice.
