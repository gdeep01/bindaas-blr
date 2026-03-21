export interface LandslideRiskZone {
  district: string;
  lat: number;
  lng: number;
  zone: string;
  terrainRisk: string;
  elevation: number;
  slope: number;
  soilType: string;
  annualRainfall: number;
  historicalEvents: number;
  riskScore: number;
  riskLevel: 'critical' | 'high' | 'moderate' | 'low';
  weather: {
    rainfall: number;
    humidity: number;
    temperature: number;
    condition: string;
    description: string;
    windSpeed: number;
  } | null;
}

export interface Earthquake {
  id: string;
  magnitude: number;
  place: string;
  time: string;
  depth: number;
  lat: number;
  lng: number;
  type: string;
  alert: string | null;
  tsunami: number;
}

export interface NASAEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  lat: number;
  lng: number;
  source: string;
  categories: string[];
}

export function getRiskColor(level: string): string {
  switch (level) {
    case 'critical':
      return 'hsl(var(--danger))';
    case 'high':
      return 'hsl(var(--primary))';
    case 'moderate':
      return 'hsl(var(--warning))';
    case 'low':
      return 'hsl(var(--success))';
    default:
      return 'hsl(var(--muted-foreground))';
  }
}
