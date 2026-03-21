// Known BBMP Waste Collection Centers and Garbage Hotspots in Bengaluru
export interface GarbageHotspot {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'collection_center' | 'dump_yard' | 'hotspot';
  description: string;
}

const GARBAGE_HOTSPOT_BOUNDS = {
  minLat: 12.7,
  maxLat: 13.2,
  minLng: 77.3,
  maxLng: 77.8,
};

// Static data from BBMP waste management locations
const rawGarbageHotspots: GarbageHotspot[] = [
  {
    id: 'bbmp-1',
    name: 'Mavallipura Landfill',
    lat: 13.1547,
    lng: 77.4892,
    type: 'dump_yard',
    description: 'Major BBMP landfill site - Mavallipura village'
  },
  {
    id: 'bbmp-2',
    name: 'KCDC Dry Waste Center - Indiranagar',
    lat: 12.9784,
    lng: 77.6408,
    type: 'collection_center',
    description: 'Dry waste collection and segregation center'
  },
  {
    id: 'bbmp-3',
    name: 'KCDC Dry Waste Center - Koramangala',
    lat: 12.9352,
    lng: 77.6245,
    type: 'collection_center',
    description: 'Dry waste collection center - 5th Block'
  },
  {
    id: 'bbmp-4',
    name: 'Mandur Landfill',
    lat: 12.9872,
    lng: 77.7523,
    type: 'dump_yard',
    description: 'Former landfill site - Mandur village'
  },
  {
    id: 'bbmp-5',
    name: 'Terra Firma Composting - Doddaballapur',
    lat: 13.2941,
    lng: 77.5363,
    type: 'collection_center',
    description: 'Organic waste composting facility'
  },
  {
    id: 'bbmp-6',
    name: 'DWCC - Jayanagar',
    lat: 12.9308,
    lng: 77.5838,
    type: 'collection_center',
    description: 'Dry Waste Collection Centre - 4th Block Jayanagar'
  },
  {
    id: 'bbmp-7',
    name: 'DWCC - HSR Layout',
    lat: 12.9116,
    lng: 77.6389,
    type: 'collection_center',
    description: 'Dry Waste Collection Centre - Sector 1'
  },
  {
    id: 'bbmp-8',
    name: 'Garbage Hotspot - Silk Board Junction',
    lat: 12.9177,
    lng: 77.6238,
    type: 'hotspot',
    description: 'Frequent illegal dumping area near flyover'
  },
  {
    id: 'bbmp-9',
    name: 'DWCC - Whitefield',
    lat: 12.9698,
    lng: 77.7500,
    type: 'collection_center',
    description: 'Dry Waste Collection Centre - ITPL area'
  },
  {
    id: 'bbmp-10',
    name: 'Garbage Hotspot - Marathahalli Bridge',
    lat: 12.9591,
    lng: 77.6971,
    type: 'hotspot',
    description: 'Known garbage accumulation spot under bridge'
  },
  {
    id: 'bbmp-11',
    name: 'DWCC - Malleshwaram',
    lat: 13.0067,
    lng: 77.5713,
    type: 'collection_center',
    description: 'Dry Waste Collection Centre - 8th Cross'
  },
  {
    id: 'bbmp-12',
    name: 'Garbage Hotspot - KR Market Area',
    lat: 12.9633,
    lng: 77.5777,
    type: 'hotspot',
    description: 'Market waste accumulation area'
  }
];

export const knownGarbageHotspots: GarbageHotspot[] = rawGarbageHotspots.filter(
  (hotspot) =>
    hotspot.lat >= GARBAGE_HOTSPOT_BOUNDS.minLat &&
    hotspot.lat <= GARBAGE_HOTSPOT_BOUNDS.maxLat &&
    hotspot.lng >= GARBAGE_HOTSPOT_BOUNDS.minLng &&
    hotspot.lng <= GARBAGE_HOTSPOT_BOUNDS.maxLng,
);

export const reportTypes = [
  { value: 'dumping', label: 'Illegal Dumping', icon: 'DUMP' },
  { value: 'overflow', label: 'Bin Overflow', icon: 'BIN' },
  { value: 'burning', label: 'Waste Burning', icon: 'BURN' },
  { value: 'hazardous', label: 'Hazardous Waste', icon: 'HAZ' },
  { value: 'other', label: 'Other', icon: 'OTHER' }
] as const;

