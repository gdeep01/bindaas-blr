export const ALL_COMMUTE_LOCATIONS = [
  'Silk Board Junction',
  'Marathahalli Bridge',
  'KR Puram',
  'Hebbal Flyover',
  'Electronic City Toll',
  'Whitefield Main Road',
  'Koramangala Inner Ring Road',
  'MG Road',
  'Yeshwanthpur Circle',
  'Jayanagar 4th Block',
  'Indiranagar',
  'HSR Layout',
  'BTM Layout',
  'Banashankari',
  'JP Nagar',
  'Rajajinagar',
  'Malleswaram',
  'Sadashivanagar',
  'Basavanagudi',
  'Yelahanka',
  'Bellandur',
  'Sarjapur Road',
  'Bannerghatta Road',
  'Old Airport Road',
  'Domlur',
  'HAL Airport Road',
  'Outer Ring Road',
  'Kanakapura Road',
  'Hosur Road',
  'Ulsoor',
  'Shivajinagar',
  'Majestic',
  'Peenya',
  'RT Nagar',
  'Vijayanagar',
  'RR Nagar',
] as const;

export type CommuteLocation = (typeof ALL_COMMUTE_LOCATIONS)[number];

export const NEAREST_TRACKED_LOCATIONS: Record<string, string> = {
  'Electronic City Toll': 'Silk Board Junction',
  'Yeshwanthpur Circle': 'MG Road',
  Indiranagar: 'Koramangala Inner Ring Road',
  'HSR Layout': 'Silk Board Junction',
  'BTM Layout': 'Silk Board Junction',
  Banashankari: 'Jayanagar 4th Block',
  'JP Nagar': 'Jayanagar 4th Block',
  Rajajinagar: 'MG Road',
  Malleswaram: 'MG Road',
  Sadashivanagar: 'Hebbal Flyover',
  Basavanagudi: 'Jayanagar 4th Block',
  Yelahanka: 'Hebbal Flyover',
  Bellandur: 'Marathahalli Bridge',
  'Sarjapur Road': 'Silk Board Junction',
  'Bannerghatta Road': 'Silk Board Junction',
  'Old Airport Road': 'Koramangala Inner Ring Road',
  Domlur: 'Koramangala Inner Ring Road',
  'HAL Airport Road': 'Marathahalli Bridge',
  'Outer Ring Road': 'Marathahalli Bridge',
  'Kanakapura Road': 'Jayanagar 4th Block',
  'Hosur Road': 'Silk Board Junction',
  Ulsoor: 'MG Road',
  Shivajinagar: 'MG Road',
  Majestic: 'MG Road',
  Peenya: 'MG Road',
  'RT Nagar': 'Hebbal Flyover',
  Vijayanagar: 'MG Road',
  'RR Nagar': 'MG Road',
};

type Zone = 'north' | 'south' | 'east' | 'west' | 'central';

const LOCATION_ZONE: Record<string, Zone> = {
  'Hebbal Flyover': 'north',
  Yelahanka: 'north',
  'RT Nagar': 'north',
  Sadashivanagar: 'north',
  Nagawara: 'north',
  'Electronic City Toll': 'south',
  'Bannerghatta Road': 'south',
  'JP Nagar': 'south',
  'Jayanagar 4th Block': 'south',
  Banashankari: 'south',
  'Kanakapura Road': 'south',
  'Hosur Road': 'south',
  Basavanagudi: 'south',
  'Koramangala Inner Ring Road': 'south',
  'Silk Board Junction': 'south',
  'HSR Layout': 'south',
  'BTM Layout': 'south',
  'Whitefield Main Road': 'east',
  'KR Puram': 'east',
  'Marathahalli Bridge': 'east',
  Bellandur: 'east',
  'HAL Airport Road': 'east',
  'Old Airport Road': 'east',
  'Outer Ring Road': 'east',
  'Sarjapur Road': 'east',
  Indiranagar: 'east',
  Domlur: 'east',
  'Yeshwanthpur Circle': 'west',
  Rajajinagar: 'west',
  Malleswaram: 'west',
  Peenya: 'west',
  Vijayanagar: 'west',
  'RR Nagar': 'west',
  'MG Road': 'central',

  Ulsoor: 'central',
  Shivajinagar: 'central',
  Majestic: 'central',
};

const ROUTE_DISTANCES_KM: Record<string, number> = {
  'koramangala-whitefield': 18,
  'silk board-hebbal': 22,
  'yeshwanthpur-electronic city': 28,
  'mg road-airport': 40,
  'marathahalli-electronic city': 20,
  'hebbal-whitefield': 18,
  'jayanagar-indiranagar': 12,
  'silk board-marathahalli': 8,
};

export function getRouteDistance(from: string, to: string): number {
  const f = (from || '').toLowerCase().split(' ')[0];
  const t = (to || '').toLowerCase().split(' ')[0];
  const key = `${f}-${t}`;
  const reverseKey = `${t}-${f}`;
  return ROUTE_DISTANCES_KM[key] ?? ROUTE_DISTANCES_KM[reverseKey] ?? 15; // 15km default
}

export function getTrackedLocation(location: string) {
  return NEAREST_TRACKED_LOCATIONS[location] || location;
}

export function getBaseTime(from: string, to: string): number {
  const zoneFrom = LOCATION_ZONE[from] || 'central';
  const zoneTo = LOCATION_ZONE[to] || 'central';

  if (from === to) return 5;
  if (zoneFrom === zoneTo) return 15;

  const adjacent: Record<Zone, Zone[]> = {
    north: ['central', 'west', 'east'],
    south: ['central', 'east', 'west'],
    east: ['central', 'north', 'south'],
    west: ['central', 'north', 'south'],
    central: ['north', 'south', 'east', 'west'],
  };

  if (adjacent[zoneFrom]?.includes(zoneTo)) return 30;
  return 45;
}

// Bengaluru commute fares — simple, user-friendly averages.
export const BIKE_COST_PER_KM = 4; // ₹/km

export const getAutoFare = (distanceKm: number) => Math.max(36, distanceKm * 18);

export const getCabFare = (distanceKm: number) => Math.max(100, distanceKm * 24);

const metroFare = (km: number) =>
  km <= 2 ? 10 : km <= 5 ? 20 : km <= 10 ? 35 : km <= 15 ? 50 : km <= 20 ? 70 : 95;

const bmtcFare = (km: number) =>
  km <= 5 ? 10 : km <= 10 ? 15 : km <= 15 ? 20 : km <= 20 ? 25 : 30;

export const getMetroFare = (distanceKm: number) => metroFare(distanceKm);

export const getBmtcFare = (distanceKm: number) => bmtcFare(distanceKm);

export function parseHourLabel(timeStr: string): number {
  const cleaned = timeStr.trim().toUpperCase();
  const match = cleaned.match(/^(\d{1,2})\s*(AM|PM)$/);

  if (match) {
    let hour = Number.parseInt(match[1], 10);
    const period = match[2];

    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;

    return hour;
  }

  const colonMatch = cleaned.match(/^(\d{1,2}):/);
  if (colonMatch) return Number.parseInt(colonMatch[1], 10);
  return Number.parseInt(cleaned, 10) || 0;
}

export function formatHourRange(startHour: number, duration = 2) {
  const formatHour = (hour: number) => {
    const normalized = ((hour % 24) + 24) % 24;
    const period = normalized >= 12 ? 'PM' : 'AM';
    const hour12 = normalized % 12 === 0 ? 12 : normalized % 12;
    return `${hour12}:00 ${period}`;
  };

  return `${formatHour(startHour)} – ${formatHour(startHour + duration)}`;
}
