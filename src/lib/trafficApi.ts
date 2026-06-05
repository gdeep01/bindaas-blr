interface HotspotData {
  name: string;
  congestionLevel: number;
  congestion1h?: number | null;
  congestion3h?: number | null;
  trend: 'up' | 'down' | 'stable';
  eta: string;
  etaMinutes: number;
  isRealData?: boolean;
  currentSpeed?: number | null;
  freeFlowSpeed?: number | null;
  lat: number;
  lng: number;
}

interface Incident {
  location: string;
  severity: string;
  description: string;
  delay?: string;
  lat?: number;
  lng?: number;
}

interface RoadWork {
  location: string;
  description: string;
  severity: string;
  lat?: number;
  lng?: number;
}

interface RouteImpact {
  corridor: string;
  baseTime: number;
  actualTime: number;
  delay: number;
  impactScore: number;
  status: 'clear' | 'moderate' | 'congested';
  hasIncident?: boolean;
  hasRoadWork?: boolean;
}

interface WeatherData {
  condition: string;
  description: string;
  temperature: number;
  humidity: number;
  visibility: number;
  windSpeed: number;
  icon: string;
  impactLevel: 'none' | 'low' | 'moderate' | 'severe';
}

interface TrafficMetrics {
  avgCommuteMinutes: number;
  commuteChangePercent: number;
  peakHour: string;
  peakCongestion: number;
  incidents: Incident[];
  incidentCount: number;
  roadWorks: RoadWork[];
  roadWorksCount: number;
  routeImpacts: RouteImpact[];
  weather?: WeatherData;
}

interface TrafficData {
  hotspots: HotspotData[];
  sentimentScore: number;
  timestamp: string;
  isPeakHour: boolean;
  isWeekend: boolean;
  currentHour: number;
  dataSource?: string;
  metrics?: TrafficMetrics;
}

interface HourlyDataPoint {
  time: string;
  congestion?: number;
  predicted?: number;
}

interface AIInsights {
  summary: string;
  predictions: Array<{
    time: string;
    congestionLevel: number;
    insight: string;
  }>;
  bestTimeToTravel: string;
  avoidAreas: string[];
  alternateRoutes: Array<{
    from: string;
    to: string;
    via: string;
    savings: string;
  }>;
}

interface StationTrafficData {
  location_name: string;
  congestion_level: number;
  current_speed: number | null;
  free_flow_speed: number | null;
  recorded_at: string;
}

export type {
  TrafficData,
  HotspotData,
  HourlyDataPoint,
  AIInsights,
  TrafficMetrics,
  Incident,
  RoadWork,
  RouteImpact,
  WeatherData,
  StationTrafficData,
};
