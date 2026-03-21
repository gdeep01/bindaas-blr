export interface TrafficLocation {
  name: string;
  lat: number;
  lng: number;
  congestionLevel: number;
  trend?: 'up' | 'down' | 'stable';
  eta?: string;
}

export interface Incident {
  location: string;
  severity: string;
  description: string;
  delay?: string;
  lat?: number;
  lng?: number;
}

export interface RoadWork {
  location: string;
  description: string;
  severity: string;
  lat?: number;
  lng?: number;
}

export interface GarbagePoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'collection_center' | 'dump_yard' | 'hotspot' | 'user_report';
  description: string;
  severity?: string;
  reportType?: string;
  reportedAt?: string;
  reporterName?: string | null;
  moderationStatus?: string;
  upvotes?: number;
  imageUrls?: string[];
}

export interface MapLayers {
  traffic: boolean;
  incidents: boolean;
  roadWorks: boolean;
  garbageOfficial: boolean;
  garbageCommunity: boolean;
  landslide: boolean;
  earthquakes: boolean;
  pricePerSqft: boolean;
  metroAccess: boolean;
}

export const DEFAULT_LAYERS: MapLayers = {
  traffic: true,
  incidents: true,
  roadWorks: false,
  garbageOfficial: false,
  garbageCommunity: false,
  landslide: false,
  earthquakes: false,
  pricePerSqft: false,
  metroAccess: false,
};

export const getInitialLayers = (): MapLayers => {
  if (typeof window === 'undefined') {
    return DEFAULT_LAYERS;
  }

  try {
    const stored = window.localStorage.getItem('mapLayers');
    if (!stored) {
      return DEFAULT_LAYERS;
    }

    const parsed = JSON.parse(stored) as Partial<MapLayers>;
    // Always override these to false regardless of stored value
    return {
      ...DEFAULT_LAYERS,
      ...parsed,
      pricePerSqft: false,
      metroAccess: false,
      roadWorks: false,
    };
  } catch {
    return DEFAULT_LAYERS;
  }
};
