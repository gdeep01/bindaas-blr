interface LocationCoords {
  lat: number;
  lng: number;
}

export const ALL_COMMUTE_LOCATIONS = [
  "Silk Board Junction",
  "Marathahalli Bridge",
  "KR Puram",
  "Hebbal Flyover",
  "Electronic City Toll",
  "Whitefield Main Road",
  "Koramangala Inner Ring Road",
  "MG Road",
  "Yeshwanthpur Circle",
  "Jayanagar 4th Block",
  "Indiranagar",
  "HSR Layout",
  "BTM Layout",
  "Banashankari",
  "JP Nagar",
  "Rajajinagar",
  "Malleswaram",
  "Sadashivanagar",
  "Basavanagudi",
  "Yelahanka",
  "Bellandur",
  "Sarjapur Road",
  "Bannerghatta Road",
  "Old Airport Road",
  "Domlur",
  "HAL Airport Road",
  "Outer Ring Road",
  "Kanakapura Road",
  "Hosur Road",
  "Ulsoor",
  "Shivajinagar",
  "Majestic",
  "Peenya",
  "RT Nagar",
  "Vijayanagar",
  "RR Nagar",
] as const;

export const TRACKED_LOCATIONS = [
  { name: "Silk Board Junction", lat: 12.9172, lng: 77.623 },
  { name: "Marathahalli Bridge", lat: 12.9591, lng: 77.6974 },
  { name: "KR Puram", lat: 13.005, lng: 77.694 },
  { name: "Hebbal Flyover", lat: 13.045, lng: 77.597 },
  { name: "Whitefield Main Road", lat: 12.9698, lng: 77.7499 },
  { name: "Koramangala Inner Ring Road", lat: 12.9279, lng: 77.6271 },
  { name: "MG Road", lat: 12.9757, lng: 77.6094 },
  { name: "Jayanagar 4th Block", lat: 12.9308, lng: 77.5831 },
  { name: "Electronic City Toll", lat: 12.8399, lng: 77.677 },
  { name: "Yeshwanthpur Circle", lat: 13.0291, lng: 77.5483 },
  { name: "Indiranagar", lat: 12.9784, lng: 77.6408 },
  { name: "HSR Layout", lat: 12.9116, lng: 77.6389 },
  { name: "BTM Layout", lat: 12.9166, lng: 77.6101 },
  { name: "Banashankari", lat: 12.9255, lng: 77.5468 },
  { name: "JP Nagar", lat: 12.9063, lng: 77.5857 },
  { name: "Rajajinagar", lat: 12.9901, lng: 77.5521 },
  { name: "Malleswaram", lat: 13.0035, lng: 77.5673 },
  { name: "Sadashivanagar", lat: 13.005, lng: 77.58 },
  { name: "Basavanagudi", lat: 12.9422, lng: 77.5757 },
  { name: "Yelahanka", lat: 13.1007, lng: 77.5963 },
  { name: "Bellandur", lat: 12.9261, lng: 77.6762 },
  { name: "Sarjapur Road", lat: 12.901, lng: 77.686 },
  { name: "Bannerghatta Road", lat: 12.8933, lng: 77.5976 },
  { name: "Old Airport Road", lat: 12.9592, lng: 77.6484 },
  { name: "Domlur", lat: 12.9609, lng: 77.6387 },
  { name: "HAL Airport Road", lat: 12.9608, lng: 77.6484 },
  { name: "Outer Ring Road", lat: 12.9355, lng: 77.6849 },
  { name: "Kanakapura Road", lat: 12.9013, lng: 77.5703 },
  { name: "Hosur Road", lat: 12.8958, lng: 77.6137 },
  { name: "Ulsoor", lat: 12.9794, lng: 77.6208 },
  { name: "Shivajinagar", lat: 12.9851, lng: 77.601 },
  { name: "Majestic", lat: 12.9767, lng: 77.5713 },
  { name: "Peenya", lat: 13.0289, lng: 77.5189 },
  { name: "RT Nagar", lat: 13.0207, lng: 77.594 },
  { name: "Vijayanagar", lat: 12.9719, lng: 77.531 },
  { name: "RR Nagar", lat: 12.9279, lng: 77.5225 },
  { name: "Kempegowda International Airport", lat: 13.1986, lng: 77.7066 },
  { name: "KSR Bengaluru City Railway Station", lat: 12.9775, lng: 77.5713 },
  { name: "Yeshwanthpur Railway Station", lat: 13.0199, lng: 77.5546 },
  { name: "Bengaluru Cantonment Railway Station", lat: 12.9987, lng: 77.5996 },
] as const;

export const AIRPORT_LOCATIONS = [
  { name: "Kempegowda International Airport", lat: 13.1986, lng: 77.7066 },
  { name: "KSR Bengaluru City Railway Station", lat: 12.9775, lng: 77.5713 },
  { name: "Yeshwanthpur Railway Station", lat: 13.0199, lng: 77.5546 },
  { name: "Bengaluru Cantonment Railway Station", lat: 12.9987, lng: 77.5996 },
] as const;

const LOCATION_COORDS: Record<string, LocationCoords> = {
  "Silk Board Junction": { lat: 12.917, lng: 77.6227 },
  "Marathahalli Bridge": { lat: 12.9591, lng: 77.7009 },
  "KR Puram": { lat: 13.0012, lng: 77.6961 },
  "Hebbal Flyover": { lat: 13.0358, lng: 77.597 },
  "Electronic City Toll": { lat: 12.8399, lng: 77.677 },
  "Whitefield Main Road": { lat: 12.9698, lng: 77.75 },
  "Koramangala Inner Ring Road": { lat: 12.9352, lng: 77.6245 },
  "MG Road": { lat: 12.9758, lng: 77.6066 },
  "Yeshwanthpur Circle": { lat: 13.0291, lng: 77.5483 },
  "Jayanagar 4th Block": { lat: 12.9254, lng: 77.5838 },
  Indiranagar: { lat: 12.9784, lng: 77.6408 },
  "HSR Layout": { lat: 12.9116, lng: 77.6389 },
  "BTM Layout": { lat: 12.9166, lng: 77.6101 },
  Banashankari: { lat: 12.9255, lng: 77.5468 },
  "JP Nagar": { lat: 12.9063, lng: 77.5857 },
  Rajajinagar: { lat: 12.9901, lng: 77.5521 },
  Malleswaram: { lat: 13.0035, lng: 77.5673 },
  Sadashivanagar: { lat: 13.005, lng: 77.58 },
  Basavanagudi: { lat: 12.9422, lng: 77.5757 },
  Yelahanka: { lat: 13.1007, lng: 77.5963 },
  Bellandur: { lat: 12.9261, lng: 77.6762 },
  "Sarjapur Road": { lat: 12.901, lng: 77.686 },
  "Bannerghatta Road": { lat: 12.8933, lng: 77.5976 },
  "Old Airport Road": { lat: 12.9592, lng: 77.6484 },
  Domlur: { lat: 12.9609, lng: 77.6387 },
  "HAL Airport Road": { lat: 12.9608, lng: 77.6484 },
  "Outer Ring Road": { lat: 12.9355, lng: 77.6849 },
  "Kanakapura Road": { lat: 12.9013, lng: 77.5703 },
  "Hosur Road": { lat: 12.8958, lng: 77.6137 },
  Ulsoor: { lat: 12.9794, lng: 77.6208 },
  Shivajinagar: { lat: 12.9851, lng: 77.601 },
  Majestic: { lat: 12.9767, lng: 77.5713 },
  Peenya: { lat: 13.0289, lng: 77.5189 },
  "RT Nagar": { lat: 13.0207, lng: 77.594 },
  Vijayanagar: { lat: 12.9719, lng: 77.531 },
  "RR Nagar": { lat: 12.9279, lng: 77.5225 },
  "Kempegowda International Airport": { lat: 13.1986, lng: 77.7066 },
  "KSR Bengaluru City Railway Station": { lat: 12.9775, lng: 77.5713 },
  "Yeshwanthpur Railway Station": { lat: 13.0199, lng: 77.5546 },
  "Bengaluru Cantonment Railway Station": { lat: 12.9987, lng: 77.5996 },
};

const BASE_TIME_OVERRIDES: Record<string, number> = {
  "Koramangala Inner Ring Road|Whitefield Main Road": 42,
  "Whitefield Main Road|Koramangala Inner Ring Road": 42,
  "Silk Board Junction|Marathahalli Bridge": 30,
  "Marathahalli Bridge|Silk Board Junction": 30,
  "MG Road|Hebbal Flyover": 28,
  "Hebbal Flyover|MG Road": 28,
  "Jayanagar 4th Block|Electronic City Toll": 26,
  "Electronic City Toll|Jayanagar 4th Block": 26,
  "Yeshwanthpur Circle|Whitefield Main Road": 38,
  "Whitefield Main Road|Yeshwanthpur Circle": 38,
};

export const NEAREST_TRACKED: Record<string, string> = {
  "Electronic City Toll": "Koramangala Inner Ring Road",
  "Yeshwanthpur Circle": "Hebbal Flyover",
  Indiranagar: "KR Puram",
  "HSR Layout": "Koramangala Inner Ring Road",
  "BTM Layout": "Silk Board Junction",
  Banashankari: "Jayanagar 4th Block",
  "JP Nagar": "Jayanagar 4th Block",
  Rajajinagar: "Hebbal Flyover",
  Malleswaram: "Hebbal Flyover",
  Sadashivanagar: "Hebbal Flyover",
  Basavanagudi: "Jayanagar 4th Block",
  Yelahanka: "Hebbal Flyover",
  Bellandur: "Marathahalli Bridge",
  "Sarjapur Road": "Marathahalli Bridge",
  "Bannerghatta Road": "Silk Board Junction",
  "Old Airport Road": "KR Puram",
  Domlur: "KR Puram",
  "HAL Airport Road": "KR Puram",
  "Outer Ring Road": "Marathahalli Bridge",
  "Kanakapura Road": "Jayanagar 4th Block",
  "Hosur Road": "Silk Board Junction",
  Ulsoor: "MG Road",
  Shivajinagar: "MG Road",
  Majestic: "MG Road",
  Peenya: "Hebbal Flyover",
  "RT Nagar": "Hebbal Flyover",
  Vijayanagar: "Hebbal Flyover",
  "RR Nagar": "Jayanagar 4th Block",
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

export function getTrackedLocation(location: string) {
  return NEAREST_TRACKED[location] || location;
}

export function getRouteBaseTime(fromLocation: string, toLocation: string) {
  if (fromLocation === toLocation) {
    return 5;
  }

  const overrideKey = `${fromLocation}|${toLocation}`;
  if (BASE_TIME_OVERRIDES[overrideKey]) {
    return BASE_TIME_OVERRIDES[overrideKey];
  }

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
  const [a, b] = [fromLocation, toLocation].sort();
  return btoa(`${a}|${b}`).replace(/[^a-zA-Z0-9]/g, "");
}

export function getTrackedRouteSummary(fromLocation: string, toLocation: string) {
  return {
    trackedFrom: getTrackedLocation(fromLocation),
    trackedTo: getTrackedLocation(toLocation),
    baseTime: getRouteBaseTime(fromLocation, toLocation),
  };
}
