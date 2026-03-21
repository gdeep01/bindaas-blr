import { getTrackedLocation } from './commute';

interface LocationCoords {
  lat: number;
  lng: number;
}

const LOCATION_COORDS: Record<string, LocationCoords> = {
  'Silk Board Junction': { lat: 12.917, lng: 77.6227 },
  'Marathahalli Bridge': { lat: 12.9591, lng: 77.7009 },
  'KR Puram': { lat: 13.0012, lng: 77.6961 },
  'Hebbal Flyover': { lat: 13.0358, lng: 77.597 },
  'Electronic City Toll': { lat: 12.8456, lng: 77.6603 },
  'Whitefield Main Road': { lat: 12.9698, lng: 77.75 },
  'Koramangala Inner Ring Road': { lat: 12.9352, lng: 77.6245 },
  'MG Road': { lat: 12.9758, lng: 77.6066 },
  'Yeshwanthpur Circle': { lat: 13.0221, lng: 77.544 },
  'Jayanagar 4th Block': { lat: 12.9254, lng: 77.5838 },
  Indiranagar: { lat: 12.9784, lng: 77.6408 },
  'HSR Layout': { lat: 12.9116, lng: 77.6474 },
  'BTM Layout': { lat: 12.9166, lng: 77.6101 },
  Banashankari: { lat: 12.925, lng: 77.5468 },
  'JP Nagar': { lat: 12.9077, lng: 77.5858 },
  Rajajinagar: { lat: 12.9915, lng: 77.5545 },
  Malleswaram: { lat: 13.0035, lng: 77.57 },
  Sadashivanagar: { lat: 13.0077, lng: 77.5811 },
  Basavanagudi: { lat: 12.9417, lng: 77.5713 },
  Yelahanka: { lat: 13.1007, lng: 77.5963 },
  Bellandur: { lat: 12.9255, lng: 77.6765 },
  'Sarjapur Road': { lat: 12.901, lng: 77.6839 },
  'Bannerghatta Road': { lat: 12.8937, lng: 77.5977 },
  'Old Airport Road': { lat: 12.958, lng: 77.6482 },
  Domlur: { lat: 12.9609, lng: 77.6387 },
  'HAL Airport Road': { lat: 12.9545, lng: 77.6717 },
  'Outer Ring Road': { lat: 12.9382, lng: 77.6957 },
  'Kanakapura Road': { lat: 12.8857, lng: 77.5639 },
  'Hosur Road': { lat: 12.8868, lng: 77.6399 },
  Ulsoor: { lat: 12.982, lng: 77.6246 },
  Shivajinagar: { lat: 12.9848, lng: 77.6031 },
  Majestic: { lat: 12.9762, lng: 77.5713 },
  Peenya: { lat: 13.0329, lng: 77.5273 },
  'RT Nagar': { lat: 13.0224, lng: 77.5947 },
  Vijayanagar: { lat: 12.9719, lng: 77.5315 },
  'RR Nagar': { lat: 12.9275, lng: 77.5201 },
};

const BASE_TIME_OVERRIDES: Record<string, number> = {
  'Koramangala Inner Ring Road|Whitefield Main Road': 42,
  'Whitefield Main Road|Koramangala Inner Ring Road': 42,
  'Silk Board Junction|Marathahalli Bridge': 30,
  'Marathahalli Bridge|Silk Board Junction': 30,
  'MG Road|Hebbal Flyover': 28,
  'Hebbal Flyover|MG Road': 28,
  'Jayanagar 4th Block|Electronic City Toll': 26,
  'Electronic City Toll|Jayanagar 4th Block': 26,
  'Yeshwanthpur Circle|Whitefield Main Road': 38,
  'Whitefield Main Road|Yeshwanthpur Circle': 38,
};

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function getDistanceKm(from: LocationCoords, to: LocationCoords) {
  const earthRadiusKm = 6371;
  const latDelta = toRadians(to.lat - from.lat);
  const lngDelta = toRadians(to.lng - from.lng);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);

  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(lngDelta / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getRouteBaseTime(fromLocation: string, toLocation: string) {
  if (fromLocation === toLocation) {
    return 5;
  }

  const overrideKey = `${fromLocation}|${toLocation}`;
  const override = BASE_TIME_OVERRIDES[overrideKey];
  if (override !== undefined) return override;

  const fromCoords = LOCATION_COORDS[fromLocation];
  const toCoords = LOCATION_COORDS[toLocation];
  if (!fromCoords || !toCoords) {
    return 25;
  }

  const distanceKm = getDistanceKm(fromCoords, toCoords);

  if (distanceKm < 3) {
    return 12;
  }

  if (distanceKm < 7) {
    return 18;
  }

  if (distanceKm < 12) {
    return 26;
  }

  if (distanceKm < 18) {
    return 34;
  }

  return 42;
}

export function getWeightedRouteCongestion(fromCongestion: number, toCongestion: number) {
  return Math.round(fromCongestion * 0.6 + toCongestion * 0.4);
}

export function getRouteHash(fromLocation: string, toLocation: string) {
  const rawValue = `${fromLocation.toLowerCase()}|${toLocation.toLowerCase()}`;
  let hash = 0;

  for (let index = 0; index < rawValue.length; index += 1) {
    hash = (hash * 31 + rawValue.charCodeAt(index)) >>> 0;
  }

  return `${rawValue.replace(/[^a-z0-9]/gi, '')}${hash.toString(36)}`.slice(0, 32);
}

export function getTrackedRouteSummary(fromLocation: string, toLocation: string) {
  return {
    trackedFrom: getTrackedLocation(fromLocation),
    trackedTo: getTrackedLocation(toLocation),
    baseTime: getRouteBaseTime(fromLocation, toLocation),
  };
}
