import { memo, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { bengaluruAreaMoods, getMoodEmoji, getMoodLabel, getMoodColor } from '@/data/moodData';
import {
  bengaluruPropertyPrices,
  formatPriceLabel,
  getPriceByLocalityName,
  getPriceSegmentColor,
  PRICE_DATA_LAST_UPDATED,
  PRICE_DATA_SOURCE,
  PriceTrend,
} from '@/data/bengaluruPropertyPrices';
import { bengaluruMetroStations, METRO_LINE_COLORS, METRO_LINE_LABELS } from '@/data/bengaluruMetroStations';
import { LandslideRiskZone, Earthquake, NASAEvent, getRiskColor } from '@/lib/landslideApi';
import { DEFAULT_LAYERS, GarbagePoint, Incident, MapLayers, RoadWork, TrafficLocation } from '@/lib/mapConstants';

interface TrafficMapInnerProps {
  locations: TrafficLocation[];
  incidents?: Incident[];
  roadWorks?: RoadWork[];
  garbagePoints?: GarbagePoint[];
  searchLocation?: { lat: number; lng: number; name: string } | null;
  mapMode?: 'traffic' | 'mood';
  mapLayers?: MapLayers;
  landslideZones?: LandslideRiskZone[];
  earthquakes?: Earthquake[];
  nasaEvents?: NASAEvent[];
  onMapClick?: () => void;
  initialView?: { center: [number, number]; zoom: number };
  disableAutoFit?: boolean;
}

const POPUP_PANEL = [
  'min-width: 180px',
  'max-width: 280px',
  'max-height: 220px',
  'font-size: 13px',
  'background: hsl(var(--card))',
  'color: hsl(var(--foreground))',
  'overflow-x: hidden',
  'overflow-y: auto',
].join('; ');

const POPUP_TITLE = [
  'font-weight: 500',
  'font-size: 14px',
  'font-style: normal',
  'font-family: inherit',
  'margin-bottom: 6px',
  'color: hsl(var(--foreground))',
  'border-bottom: 1px solid hsl(var(--border))',
  'padding-bottom: 4px',
  'padding-right: 20px',
  'word-break: break-word',
].join('; ');

const POPUP_META = 'color: hsl(var(--muted-foreground));';
const POPUP_TEXT = 'color: hsl(var(--foreground));';
const POPUP_ROW = 'margin: 4px 0;';
const POPUP_DIVIDER = 'margin: 8px 0; border: 0; border-top: 1px solid hsl(var(--border));';
const POPUP_OPTIONS = { autoPan: true, closeButton: true, autoClose: true, closeOnClick: false, maxWidth: 280, maxHeight: 220, minWidth: 200, className: 'bindaas-popup' };
const POPUP_IMAGE_GRID = 'display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-top: 8px; padding-top: 10px;';
const POPUP_IMAGE = 'width: 100%; height: 72px; object-fit: cover; border-radius: 2px; border: 1px solid hsl(var(--border));';
const KARNATAKA_BOUNDS = {
  minLat: 11.5,
  maxLat: 13.5,
  minLng: 74.0,
  maxLng: 78.6,
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const safeText = (value?: string, fallback = 'N/A') => escapeHtml(value?.trim() || fallback);

const safeUrl = (value?: string): string | null => {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.href;
    }
    return null;
  } catch {
    return null;
  }
};


const formatDate = (value?: string) => {
  if (!value) return 'Just now';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Just now';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatNumber = (value: number | undefined, suffix = '') => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '--';
  return `${value}${suffix}`;
};

const isWithinKarnatakaBounds = (lat: number, lng: number) =>
  lat >= KARNATAKA_BOUNDS.minLat &&
  lat <= KARNATAKA_BOUNDS.maxLat &&
  lng >= KARNATAKA_BOUNDS.minLng &&
  lng <= KARNATAKA_BOUNDS.maxLng;

const formatRupeeValue = (value: number) => `₹${value.toLocaleString('en-IN')}`;

const getCongestionColor = (level: number): string => {
  if (level < 30) return 'hsl(var(--success))';
  if (level < 55) return 'hsl(var(--warning))';
  if (level < 75) return 'hsl(var(--primary))';
  return 'hsl(var(--danger))';
};

const getSeverityColor = (severity: string): string => {
  switch (severity.toLowerCase()) {
    case 'high':
      return 'hsl(var(--danger))';
    case 'medium':
      return 'hsl(var(--warning))';
    default:
      return 'hsl(var(--muted-foreground))';
  }
};

const getGarbageColor = (type: string, severity?: string, moderationStatus?: string): string => {
  if (type === 'user_report') {
    if (moderationStatus === 'resolved') {
      return 'hsl(var(--success))';
    }
    return getSeverityColor(severity || 'low');
  }

  switch (type) {
    case 'dump_yard':
      return 'hsl(var(--danger))';
    case 'collection_center':
      return 'hsl(var(--success))';
    case 'hotspot':
      return 'hsl(var(--warning))';
    default:
      return 'hsl(var(--muted-foreground))';
  }
};

const getGarbageMarkerLabel = (type: GarbagePoint['type']) => {
  switch (type) {
    case 'user_report':
      return 'R';
    case 'dump_yard':
      return 'D';
    case 'collection_center':
      return 'C';
    default:
      return 'G';
  }
};

const getRiskLabel = (level: LandslideRiskZone['riskLevel']) => {
  switch (level) {
    case 'critical':
      return 'Critical Risk';
    case 'high':
      return 'High Risk';
    case 'moderate':
      return 'Moderate Risk';
    default:
      return 'Low Risk';
  }
};

const getEarthquakeColor = (magnitude: number) => {
  if (magnitude >= 5) return 'hsl(var(--danger))';
  if (magnitude >= 4) return 'hsl(var(--primary))';
  if (magnitude >= 3) return 'hsl(var(--warning))';
  return 'hsl(var(--muted-foreground))';
};

const getMetricBarColor = (score: number) => {
  if (score >= 75) return 'hsl(var(--success))';
  if (score >= 50) return 'hsl(var(--warning))';
  if (score >= 30) return 'hsl(var(--primary))';
  return 'hsl(var(--danger))';
};

const getTrendMeta = (trend: PriceTrend) => {
  switch (trend) {
    case 'rising':
      return { arrow: '↑', color: 'hsl(var(--success))' };
    case 'falling':
      return { arrow: '↓', color: 'hsl(var(--danger))' };
    case 'stable':
    default:
      return { arrow: '→', color: 'hsl(var(--muted-foreground))' };
  }
};

const makeCircularIcon = (label: string, color: string, size: number, fontSize: number) => {
  const style = `
    background-color: ${color};
    color: #ffffff;
    width: ${size}px;
    height: ${size}px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: ${fontSize}px;
    font-weight: 800;
    font-family: system-ui, -apple-system, sans-serif;
    border: 2px solid rgba(255,255,255,0.2);
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    white-space: nowrap;
    min-width: ${size}px;
    box-sizing: border-box;
  `;

  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="${style}">
        ${label}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

const createTrafficIcon = (congestionLevel: number) => {
  const color = getCongestionColor(congestionLevel);
  return makeCircularIcon(`${congestionLevel}%`, color, 40, 11);
};

const createMoodIcon = (mood: number) => {
  const emoji = getMoodEmoji(mood);
  const color = getMoodColor(mood);

  return L.divIcon({
    className: 'custom-mood-marker',
    html: `
      <div style="
        width: 36px;
        height: 36px;
        background: hsl(var(--card));
        border: 2px solid ${color};
        border-radius: 999px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        box-shadow: none;
      ">
        ${emoji}
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
};

const createPriceIcon = (label: string, color: string) =>
  L.divIcon({
    className: 'custom-price-marker',
    html: `
      <div style="
        width: 52px;
        height: 26px;
        border-radius: 4px;
        background: ${color};
        border: 1px solid rgba(255,255,255,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: hsl(var(--primary-foreground));
        font-size: 10px;
        font-weight: 700;
        box-shadow: none;
      ">
        ${label}
      </div>
    `,
    iconSize: [52, 26],
    iconAnchor: [26, 13],
    popupAnchor: [0, -13],
  });

const createMetroIcon = (line: keyof typeof METRO_LINE_COLORS, isInterchange: boolean) =>
  L.divIcon({
    className: 'custom-metro-marker',
    html: `
      <div style="
        width: 28px;
        height: 28px;
        border-radius: 999px;
        background: ${METRO_LINE_COLORS[line]};
        border: 2px solid rgba(255,255,255,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        color: hsl(var(--primary-foreground));
        font-size: 10px;
        font-weight: 700;
        box-shadow: none;
      ">
        ${isInterchange ? 'M⇄' : 'M'}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });

const createIncidentIcon = (severity: string) => makeCircularIcon('!', getSeverityColor(severity), 30, 16);
const createRoadWorkIcon = (severity: string) => makeCircularIcon('RW', getSeverityColor(severity), 30, 10);
const createGarbageIcon = (type: GarbagePoint['type'], severity?: string, moderationStatus?: string) =>
  makeCircularIcon(getGarbageMarkerLabel(type), getGarbageColor(type, severity, moderationStatus), 32, 11);
const createSearchMarkerIcon = () => makeCircularIcon('P', 'hsl(var(--primary))', 36, 13);

const TrafficMapInnerComponent = ({
  locations,
  incidents = [],
  roadWorks = [],
  garbagePoints = [],
  searchLocation,
  mapMode = 'traffic',
  mapLayers = DEFAULT_LAYERS,
  landslideZones = [],
  earthquakes = [],
  nasaEvents = [],
  onMapClick,
  initialView = { center: [12.9716, 77.5946], zoom: 11 },
  disableAutoFit = false,
}: TrafficMapInnerProps) => {
  const initialViewRef = useRef(initialView);
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const searchMarkerRef = useRef<L.Marker | null>(null);
  const metroCircleRefs = useRef<Map<string, L.Circle>>(new Map());
  const lastModeRef = useRef<'traffic' | 'mood' | null>(null);
  const openPopupIdRef = useRef<string | null>(null);

  const getMarkerId = useCallback((type: string, index: number, name: string) => `${type}-${index}-${name}`, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const metroCircles = metroCircleRefs.current;

    mapRef.current = L.map(mapContainerRef.current, {
      center: initialViewRef.current.center,
      zoom: initialViewRef.current.zoom,
      zoomControl: true,
      scrollWheelZoom: true,
      preferCanvas: true,
      zoomAnimation: true,
      fadeAnimation: false,
      markerZoomAnimation: false,
      tap: false,
      bounceAtZoomLimits: false,
    });

    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    if (isMobile) {
      mapRef.current.scrollWheelZoom.disable();
    } else {
      mapRef.current.scrollWheelZoom.disable();
      mapRef.current.on('click', () => mapRef.current?.scrollWheelZoom.enable());
      mapRef.current.on('mouseout', () => mapRef.current?.scrollWheelZoom.disable());
    }

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
    }).addTo(mapRef.current);

    mapRef.current.zoomControl.setPosition('bottomright');

    clusterGroupRef.current = L.markerClusterGroup({
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      maxClusterRadius: 50,
      spiderfyDistanceMultiplier: 1.5,
      removeOutsideVisibleBounds: false,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        let size = 40;
        let color = 'hsl(var(--foreground))';

        if (count >= 10) {
          size = 48;
          color = 'hsl(var(--primary))';
        } else if (count >= 5) {
          size = 44;
          color = 'hsl(var(--warning))';
        }

        return L.divIcon({
          html: `
            <div style="
              width: ${size}px;
              height: ${size}px;
              background: hsl(var(--card));
              border: 2px solid ${color};
              border-radius: 999px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 13px;
              font-weight: 700;
              color: ${color};
              box-shadow: none;
            ">${count}</div>
          `,
          className: 'marker-cluster-custom',
          iconSize: L.point(size, size),
          iconAnchor: L.point(size / 2, size / 2),
        });
      },
    });

    mapRef.current.addLayer(clusterGroupRef.current);
    mapRef.current.on('popupclose', () => {
      openPopupIdRef.current = null;
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      metroCircles.clear();
    };
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || !mapRef.current || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => {
      mapRef.current?.invalidateSize();
    });

    observer.observe(mapContainerRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !onMapClick) return;

    mapRef.current.on('click', onMapClick);

    return () => {
      mapRef.current?.off('click', onMapClick);
    };
  }, [onMapClick]);

  useEffect(() => {
    if (!mapRef.current) return;

    if (searchMarkerRef.current) {
      mapRef.current.removeLayer(searchMarkerRef.current);
      searchMarkerRef.current = null;
    }

    if (!searchLocation) return;

    searchMarkerRef.current = L.marker([searchLocation.lat, searchLocation.lng], {
      icon: createSearchMarkerIcon(),
      zIndexOffset: 1000,
    });

    searchMarkerRef.current.bindPopup(
      `<div style="${POPUP_PANEL}"><h4 style="${POPUP_TITLE}">${safeText(searchLocation.name, 'Pinned Location')}</h4><p style="${POPUP_META}">Search Result</p></div>`,
      POPUP_OPTIONS,
    );

    searchMarkerRef.current.addTo(mapRef.current);
    mapRef.current.flyTo([searchLocation.lat, searchLocation.lng], 15, { duration: 1 });

    const timer = window.setTimeout(() => searchMarkerRef.current?.openPopup(), 1100);
    return () => window.clearTimeout(timer);
  }, [searchLocation]);

  useEffect(() => {
    if (!mapRef.current || !clusterGroupRef.current) return;

    const newMarkerIds = new Set<string>();
    const currentOpenPopupId = openPopupIdRef.current;

    const upsertMarker = (
      id: string,
      lat: number,
      lng: number,
      icon: L.DivIcon,
      popupContent: string,
      popupHooks?: {
        onOpen?: (marker: L.Marker) => void;
        onClose?: () => void;
      },
    ) => {
      newMarkerIds.add(id);
      let marker = markersRef.current.get(id);

      if (marker) {
        const currentPos = marker.getLatLng();
        if (currentPos.lat !== lat || currentPos.lng !== lng) {
          marker.setLatLng([lat, lng]);
        }
        marker.setIcon(icon);
        const popup = marker.getPopup();
        if (popup) {
          const currentContent = popup.getContent();
          if (currentContent !== popupContent) {
            popup.setContent(popupContent);
          }
        }
      } else {
        marker = L.marker([lat, lng], { icon });
        marker.bindPopup(popupContent, POPUP_OPTIONS);
        marker.on('popupopen', () => {
          openPopupIdRef.current = id;
          popupHooks?.onOpen?.(marker!);
        });
        marker.on('popupclose', () => {
          popupHooks?.onClose?.();
        });
        markersRef.current.set(id, marker);
        clusterGroupRef.current?.addLayer(marker);
      }

      if (currentOpenPopupId === id) {
        setTimeout(() => marker?.openPopup(), 100);
      }
    };

    if (mapMode === 'traffic') {
      if (mapLayers.traffic) {
        locations.forEach((location, index) => {
          const id = getMarkerId('traffic', index, location.name);
          const priceData = mapLayers.pricePerSqft ? getPriceByLocalityName(location.name) : undefined;
          const priceTrend = priceData ? getTrendMeta(priceData.trend) : null;
          const trendColor =
            location.trend === 'up'
              ? 'hsl(var(--danger))'
              : location.trend === 'down'
                ? 'hsl(var(--success))'
                : 'hsl(var(--muted-foreground))';
          const trendLabel =
            location.trend === 'up' ? 'Trend: Up' : location.trend === 'down' ? 'Trend: Down' : 'Trend: Stable';
          const popupContent = `
            <div style="${POPUP_PANEL}">
              <h4 style="${POPUP_TITLE}">${safeText(location.name, 'Traffic Point')}</h4>
              <div style="font-size: 12px;">
                <p style="${POPUP_ROW}"><span style="${POPUP_META}">Congestion:</span> <span style="font-weight: 600; color: ${getCongestionColor(location.congestionLevel)};">${location.congestionLevel ?? '--'}%</span></p>
                ${location.trend ? `<p style="${POPUP_ROW}"><span style="${POPUP_META}">Status:</span> <span style="color: ${trendColor};">${trendLabel}</span></p>` : ''}
                ${location.eta ? `<p style="${POPUP_ROW}"><span style="${POPUP_META}">Delay:</span> <span style="color: hsl(var(--primary));">${safeText(location.eta)}</span></p>` : ''}
                ${
                  priceData && priceTrend
                    ? `
                      <hr style="${POPUP_DIVIDER}" />
                      <p style="${POPUP_ROW}"><span style="${POPUP_META}">Property:</span> <span style="${POPUP_TEXT}">${safeText(formatPriceLabel(priceData.avgPricePerSqft))} · ${safeText(priceData.segment)}</span></p>
                      <p style="${POPUP_ROW}"><span style="${POPUP_META}">Trend:</span> <span style="color: ${priceTrend.color};">${priceTrend.arrow} ${priceData.trendPercent}% YoY</span></p>
                    `
                    : ''
                }
              </div>
            </div>
          `;
          if (isWithinKarnatakaBounds(location.lat, location.lng)) {
            upsertMarker(id, location.lat, location.lng, createTrafficIcon(location.congestionLevel), popupContent);
          }
        });
      }

      if (mapLayers.incidents) {
        incidents.forEach((incident, index) => {
          if (!incident.lat || !incident.lng) return;
          if (!isWithinKarnatakaBounds(incident.lat, incident.lng)) return;
          const id = getMarkerId('incident', index, incident.location);
          const severityColor = getSeverityColor(incident.severity);
          const popupContent = `
            <div style="${POPUP_PANEL}">
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;"><span style="display: inline-block; padding: 3px 8px; background: hsl(var(--secondary)); border: 1px solid ${severityColor}; border-radius: 2px; font-size: 10px; font-weight: 700; color: ${severityColor}; text-transform: uppercase;">${safeText(incident.severity, 'Unknown')} Severity</span></div>
              <div style="margin-bottom: 6px; font-size: 11px; font-weight: 700; color: hsl(var(--muted-foreground)); text-transform: uppercase; letter-spacing: 0.12em;">Incident</div>
              <p style="${POPUP_ROW} ${POPUP_TEXT}"><strong>Location:</strong> ${safeText(incident.location)}</p>
              <p style="${POPUP_ROW} ${POPUP_TEXT}">${safeText(incident.description)}</p>
              ${incident.delay ? `<p style="margin: 8px 0 0; font-size: 12px; color: ${severityColor}; font-weight: 700;">Delay: ${safeText(incident.delay)}</p>` : ''}
            </div>
          `;
          upsertMarker(id, incident.lat, incident.lng, createIncidentIcon(incident.severity), popupContent);
        });
      }

      if (mapLayers.roadWorks) {
        roadWorks.forEach((roadWork, index) => {
          if (!roadWork.lat || !roadWork.lng) return;
          if (!isWithinKarnatakaBounds(roadWork.lat, roadWork.lng)) return;
          const id = getMarkerId('roadwork', index, roadWork.location);
          const severityColor = getSeverityColor(roadWork.severity);
          const popupContent = `
            <div style="${POPUP_PANEL}">
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;"><span style="display: inline-block; padding: 3px 8px; background: hsl(var(--secondary)); border: 1px solid ${severityColor}; border-radius: 2px; font-size: 10px; font-weight: 700; color: ${severityColor}; text-transform: uppercase;">${safeText(roadWork.severity, 'Unknown')} Impact</span></div>
              <h4 style="${POPUP_TITLE}">Road Work</h4>
              <p style="${POPUP_ROW} ${POPUP_TEXT}"><strong>Location:</strong> ${safeText(roadWork.location)}</p>
              <p style="${POPUP_ROW} ${POPUP_TEXT}">${safeText(roadWork.description)}</p>
            </div>
          `;
          upsertMarker(id, roadWork.lat, roadWork.lng, createRoadWorkIcon(roadWork.severity), popupContent);
        });
      }

      if (mapLayers.garbageOfficial || mapLayers.garbageCommunity) {
        garbagePoints.forEach((garbage, index) => {
          const isCommunityReport = garbage.type === 'user_report';
          if (isCommunityReport && !mapLayers.garbageCommunity) return;
          if (!isCommunityReport && !mapLayers.garbageOfficial) return;
          if (!isWithinKarnatakaBounds(garbage.lat, garbage.lng)) return;

          const id = getMarkerId('garbage', index, garbage.name);
          const color = getGarbageColor(garbage.type, garbage.severity, garbage.moderationStatus);
          const typeLabel =
            garbage.type === 'user_report'
              ? 'Citizen Report'
              : garbage.type === 'dump_yard'
                ? 'Dump Yard'
                : garbage.type === 'collection_center'
                  ? 'Collection Center'
                  : 'Known Hotspot';
          const popupContent = `
            <div style="${POPUP_PANEL}">
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;"><span style="display: inline-block; padding: 3px 8px; background: hsl(var(--secondary)); border: 1px solid ${color}; border-radius: 2px; font-size: 10px; font-weight: 700; color: ${color}; text-transform: uppercase;">${safeText(typeLabel)}</span></div>
              <h4 style="${POPUP_TITLE}">${safeText(garbage.name, 'Garbage Point')}</h4>
              <p style="${POPUP_ROW} ${POPUP_TEXT}">${safeText(garbage.description)}</p>
              ${garbage.reportType ? `<p style="${POPUP_ROW}"><span style="${POPUP_META}">Issue:</span> <span style="${POPUP_TEXT}">${safeText(garbage.reportType)}</span></p>` : ''}
              ${garbage.severity ? `<p style="${POPUP_ROW}"><span style="${POPUP_META}">Severity:</span> <span style="color: ${getSeverityColor(garbage.severity)};">${safeText(garbage.severity)}</span></p>` : ''}
              ${garbage.moderationStatus ? `<p style="${POPUP_ROW}"><span style="${POPUP_META}">Status:</span> <span style="color: ${color};">${safeText(garbage.moderationStatus)}</span></p>` : ''}
              ${typeof garbage.upvotes === 'number' ? `<p style="${POPUP_ROW}"><span style="${POPUP_META}">Upvotes:</span> <span style="${POPUP_TEXT}">${garbage.upvotes}</span></p>` : ''}
              ${
                garbage.imageUrls && garbage.imageUrls.length > 0
                  ? `<div style="${POPUP_IMAGE_GRID}">${garbage.imageUrls
                      .slice(0, 2)
                      .map((imageUrl, imageIndex) => {
                        const safeImageUrl = safeUrl(imageUrl);
                        if (!safeImageUrl) return '';
                        return `<a href="${safeImageUrl}" target="_blank" rel="noreferrer"><img src="${safeImageUrl}" alt="Garbage report image ${imageIndex + 1}" style="${POPUP_IMAGE}" /></a>`;
                      })
                      .join('')}</div>`
                  : ''
              }
              <p style="margin: 6px 0 0; font-size: 10px; color: hsl(var(--muted-foreground));">Reported: ${formatDate(garbage.reportedAt)}</p>
            </div>
          `;
          upsertMarker(id, garbage.lat, garbage.lng, createGarbageIcon(garbage.type, garbage.severity, garbage.moderationStatus), popupContent);
        });
      }

      if (mapLayers.landslide) {
        landslideZones.forEach((zone, index) => {
          if (!zone.lat || !zone.lng) return;
          if (!isWithinKarnatakaBounds(zone.lat, zone.lng)) return;
          const id = getMarkerId('landslide', index, zone.district);
          const color = getRiskColor(zone.riskLevel);
          const size = zone.riskLevel === 'critical' ? 40 : zone.riskLevel === 'high' ? 36 : 32;
          const icon = makeCircularIcon(`${zone.riskScore ?? '--'}`, color, size, size > 36 ? 10 : 9);
          const popupContent = `
            <div style="min-width: 220px; max-width: 280px; overflow: hidden; font-size: 13px; background: hsl(var(--card)); color: hsl(var(--foreground));">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; border-bottom: 1px solid hsl(var(--border)); padding-bottom: 6px;">
                <div><h4 style="font-weight: 700; color: hsl(var(--foreground)); margin: 0; font-size: 13px;">${zone.district || 'Risk Zone'}</h4><span style="font-size: 10px; color: ${color}; font-weight: 700; text-transform: uppercase;">${getRiskLabel(zone.riskLevel)}</span></div>
                <div style="width: 36px; height: 36px; border-radius: 999px; border: 2px solid ${color}; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: ${color};">${zone.riskScore ?? '--'}</div>
              </div>
              <div style="display: flex; gap: 6px; flex-wrap: wrap; font-size: 10px; margin-bottom: 4px; color: hsl(var(--foreground));"><span>${formatNumber(zone.elevation, 'm')} elevation</span><span>${formatNumber(zone.slope, 'deg')} slope</span><span>${formatNumber(zone.annualRainfall, 'mm/yr')} rainfall</span></div>
              <div style="font-size: 10px; color: hsl(var(--muted-foreground));"><span>${zone.soilType || 'N/A'}</span> | <span>${zone.historicalEvents ?? 0} past events</span> | <span>${zone.zone || 'N/A'}</span></div>
            </div>
          `;
          upsertMarker(id, zone.lat, zone.lng, icon, popupContent);
        });

        nasaEvents.forEach((event, index) => {
          if (!event.lat || !event.lng) return;
          if (!isWithinKarnatakaBounds(event.lat, event.lng)) return;
          const id = getMarkerId('nasa', index, event.id);
          const icon = makeCircularIcon('N', 'hsl(var(--info))', 32, 12);
          const popupContent = `
            <div style="min-width: 200px; max-width: 280px; overflow: hidden; font-size: 13px; background: hsl(var(--card)); color: hsl(var(--foreground));">
              <h4 style="${POPUP_TITLE}">NASA EONET Event</h4>
              <p style="font-size: 11px; color: hsl(var(--info)); font-weight: 700;">${safeText(event.title, 'Unnamed Event')}</p>
              <p style="font-size: 10px; color: hsl(var(--muted-foreground)); margin: 2px 0;">Reported: ${formatDate(event.date)}</p>
              ${(() => { const sourceUrl = safeUrl(event.source); return sourceUrl ? `<p style="font-size: 10px; margin: 4px 0;"><a href="${sourceUrl}" target="_blank" rel="noreferrer" style="color: hsl(var(--foreground));">View Source</a></p>` : ''; })()}
            </div>
          `;
          upsertMarker(id, event.lat, event.lng, icon, popupContent);
        });
      }

      if (mapLayers.pricePerSqft) {
        bengaluruPropertyPrices.forEach((price, index) => {
          const id = getMarkerId('price', index, price.name);
          const color = getPriceSegmentColor(price.segment);
          const trendMeta = getTrendMeta(price.trend);
          const popupContent = `
            <div style="${POPUP_PANEL}">
              <h4 style="${POPUP_TITLE}">${safeText(price.name)}</h4>
              <p style="${POPUP_ROW} ${POPUP_TEXT}">${safeText(`${formatRupeeValue(price.minPricePerSqft)}–${formatRupeeValue(price.maxPricePerSqft)} per sqft`)}</p>
              <p style="${POPUP_ROW}"><span style="${POPUP_META}">Avg:</span> <span style="${POPUP_TEXT}">${safeText(`${formatRupeeValue(price.avgPricePerSqft)} per sqft`)}</span></p>
              <p style="${POPUP_ROW}">
                <span style="display: inline-block; padding: 3px 8px; background: hsl(var(--secondary)); border: 1px solid ${color}; border-radius: 2px; font-size: 10px; font-weight: 700; color: ${color}; text-transform: uppercase;">
                  ${safeText(price.segment)}
                </span>
              </p>
              <p style="${POPUP_ROW}"><span style="${POPUP_META}">Trend:</span> <span style="color: ${trendMeta.color};">${trendMeta.arrow} ${price.trendPercent}% YoY</span></p>
              <p style="margin: 8px 0 0; font-size: 10px; color: hsl(var(--muted-foreground));">${safeText(`${PRICE_DATA_SOURCE} · ${PRICE_DATA_LAST_UPDATED}`)}</p>
            </div>
          `;
          if (isWithinKarnatakaBounds(price.lat, price.lng)) {
            upsertMarker(id, price.lat, price.lng, createPriceIcon(formatPriceLabel(price.avgPricePerSqft), color), popupContent);
          }
        });
      }

      if (mapLayers.earthquakes) {
        earthquakes.forEach((eq, index) => {
          if (!eq.lat || !eq.lng) return;
          if (!isWithinKarnatakaBounds(eq.lat, eq.lng)) return;
          const id = getMarkerId('earthquake', index, eq.id);
          const eqColor = getEarthquakeColor(eq.magnitude);
          const eqSize = Math.max(24, Math.min(40, eq.magnitude * 7));
          const magnitude = Number.isFinite(eq.magnitude) ? eq.magnitude.toFixed(1) : '--';
          const depth = Number.isFinite(eq.depth) ? eq.depth.toFixed(1) : '--';
          const icon = L.divIcon({
            className: 'custom-earthquake-marker',
            html: `<div style="width: ${eqSize}px; height: ${eqSize}px; background: hsl(var(--card)); border: 2px solid ${eqColor}; border-radius: 4px; transform: rotate(45deg); display: flex; align-items: center; justify-content: center; box-shadow: none;"><span style="transform: rotate(-45deg); font-size: 10px; font-weight: 700; color: ${eqColor};">${magnitude}</span></div>`,
            iconSize: [eqSize, eqSize],
            iconAnchor: [eqSize / 2, eqSize / 2],
            popupAnchor: [0, -eqSize / 2],
          });
          const popupContent = `
            <div style="min-width: 180px; max-width: 280px; overflow: hidden; font-size: 13px; background: hsl(var(--card)); color: hsl(var(--foreground));">
              <h4 style="${POPUP_TITLE}">Earthquake M${magnitude}</h4>
              <p style="font-size: 11px; color: hsl(var(--foreground)); margin: 2px 0;">${eq.place || 'N/A'}</p>
              <p style="font-size: 10px; color: hsl(var(--muted-foreground)); margin: 2px 0;">Depth: ${depth} km</p>
              <p style="font-size: 10px; color: hsl(var(--muted-foreground)); margin: 2px 0;">Reported: ${formatDate(eq.time)}</p>
            </div>
          `;
          upsertMarker(id, eq.lat, eq.lng, icon, popupContent);
        });
      }

      if (mapLayers.metroAccess) {
        bengaluruMetroStations.forEach((station, index) => {
          const id = getMarkerId('metro', index, station.name);
          const lineColor = METRO_LINE_COLORS[station.line];
          if (!isWithinKarnatakaBounds(station.lat, station.lng)) return;
          const popupContent = `
            <div style="${POPUP_PANEL}">
              <h4 style="${POPUP_TITLE}">${safeText(station.name)}</h4>
              <p style="${POPUP_ROW}"><span style="${POPUP_META}">Line:</span> <span style="${POPUP_TEXT}">${safeText(METRO_LINE_LABELS[station.line])}</span></p>
              ${
                station.isInterchange
                  ? `<p style="${POPUP_ROW}"><span style="display: inline-block; padding: 3px 8px; background: hsl(var(--secondary)); border: 1px solid ${lineColor}; border-radius: 2px; font-size: 10px; font-weight: 700; color: ${lineColor}; text-transform: uppercase;">Interchange</span></p>`
                  : ''
              }
            </div>
          `;

          upsertMarker(id, station.lat, station.lng, createMetroIcon(station.line, station.isInterchange), popupContent, {
            onOpen: () => {
              const existingCircle = metroCircleRefs.current.get(id);
              if (existingCircle) {
                existingCircle.remove();
              }

              const coverageCircle = L.circle([station.lat, station.lng], {
                radius: 1000,
                color: lineColor,
                fillColor: lineColor,
                fillOpacity: 0.08,
                weight: 1,
                dashArray: '4',
              }).addTo(mapRef.current!);

              metroCircleRefs.current.set(id, coverageCircle);
            },
            onClose: () => {
              metroCircleRefs.current.get(id)?.remove();
              metroCircleRefs.current.delete(id);
            },
          });
        });
      }
    } else {
      bengaluruAreaMoods.forEach((area, index) => {
        const id = getMarkerId('mood', index, area.id);
        const color = getMoodColor(area.overallMood);
        const emoji = getMoodEmoji(area.overallMood);
        const label = getMoodLabel(area.overallMood);
        const metricRows = area.metrics
          .map((metric) => {
            const barColor = getMetricBarColor(metric.score);
            return `<div style="display: flex; align-items: center; gap: 5px; margin: 2px 0;"><span style="font-size: 9px; color: hsl(var(--muted-foreground)); width: 115px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${metric.name}</span><div style="flex: 1; height: 2px; background: hsl(var(--border)); overflow: hidden;"><div style="height: 100%; width: ${metric.score}%; background: ${barColor};"></div></div><span style="font-size: 9px; font-weight: 700; color: ${barColor}; width: 20px; text-align: right;">${metric.score}</span></div>`;
          })
          .join('');
        const popupContent = `
          <div style="min-width: 240px; max-width: 280px; overflow: hidden; font-size: 13px; background: hsl(var(--card)); color: hsl(var(--foreground));">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; border-bottom: 1px solid hsl(var(--border)); padding-bottom: 6px;">
              <div><h4 style="font-weight: 700; color: hsl(var(--foreground)); margin: 0; font-size: 14px; font-style: normal; font-family: 'Arial Black', 'Helvetica Neue', sans-serif; letter-spacing: 0.02em;">${emoji} ${area.area}</h4><span style="font-size: 10px; color: ${color}; font-weight: 700;">${label}</span></div>
              <div style="width: 34px; height: 34px; border-radius: 999px; border: 2px solid ${color}; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: ${color};">${area.overallMood}</div>
            </div>
            ${metricRows}
          </div>
        `;
        upsertMarker(id, area.lat, area.lng, createMoodIcon(area.overallMood), popupContent);
      });
    }

    markersRef.current.forEach((marker, id) => {
      if (!newMarkerIds.has(id)) {
        metroCircleRefs.current.get(id)?.remove();
        metroCircleRefs.current.delete(id);
        clusterGroupRef.current?.removeLayer(marker);
        markersRef.current.delete(id);
      }
    });

    const shouldFitBounds = lastModeRef.current === null;
    lastModeRef.current = mapMode;

    if (shouldFitBounds && !disableAutoFit) {
      let allPoints: [number, number][] = [];
      if (mapMode === 'traffic') {
        if (mapLayers.traffic) allPoints.push(...locations.filter((loc) => isWithinKarnatakaBounds(loc.lat, loc.lng)).map((loc) => [loc.lat, loc.lng] as [number, number]));
        if (mapLayers.incidents) allPoints.push(...incidents.filter((item) => item.lat && item.lng && isWithinKarnatakaBounds(item.lat, item.lng)).map((item) => [item.lat!, item.lng!] as [number, number]));
        if (mapLayers.roadWorks) allPoints.push(...roadWorks.filter((item) => item.lat && item.lng && isWithinKarnatakaBounds(item.lat, item.lng)).map((item) => [item.lat!, item.lng!] as [number, number]));
        if (mapLayers.garbageOfficial) {
          allPoints.push(...garbagePoints.filter((item) => item.type !== 'user_report' && isWithinKarnatakaBounds(item.lat, item.lng)).map((item) => [item.lat, item.lng] as [number, number]));
        }
        if (mapLayers.garbageCommunity) {
          allPoints.push(...garbagePoints.filter((item) => item.type === 'user_report' && isWithinKarnatakaBounds(item.lat, item.lng)).map((item) => [item.lat, item.lng] as [number, number]));
        }
        if (mapLayers.landslide) allPoints.push(...landslideZones.filter((item) => isWithinKarnatakaBounds(item.lat, item.lng)).map((item) => [item.lat, item.lng] as [number, number]));
        if (mapLayers.earthquakes) allPoints.push(...earthquakes.filter((item) => isWithinKarnatakaBounds(item.lat, item.lng)).map((item) => [item.lat, item.lng] as [number, number]));
        if (mapLayers.pricePerSqft) allPoints.push(...bengaluruPropertyPrices.filter((item) => isWithinKarnatakaBounds(item.lat, item.lng)).map((item) => [item.lat, item.lng] as [number, number]));
        if (mapLayers.metroAccess) allPoints.push(...bengaluruMetroStations.filter((item) => isWithinKarnatakaBounds(item.lat, item.lng)).map((item) => [item.lat, item.lng] as [number, number]));
      } else {
        allPoints = bengaluruAreaMoods.map((area) => [area.lat, area.lng] as [number, number]);
      }

      if (allPoints.length > 0) {
        mapRef.current.fitBounds(L.latLngBounds(allPoints), {
          padding: [40, 40],
          maxZoom: mapMode === 'mood' ? 13 : mapLayers.landslide || mapLayers.earthquakes ? 8 : 13,
        });
      }
    }
  }, [disableAutoFit, earthquakes, garbagePoints, getMarkerId, incidents, landslideZones, locations, mapLayers, mapMode, nasaEvents, roadWorks]);

  return <div ref={mapContainerRef} role="application" aria-label="Interactive traffic map of Bengaluru" style={{ height: '100%', width: '100%', borderRadius: '4px', touchAction: 'pan-y' }} />;
};

const TrafficMapInner = memo(TrafficMapInnerComponent);

export default TrafficMapInner;
