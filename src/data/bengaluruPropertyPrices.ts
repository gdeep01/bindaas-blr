import { LOCALITY_PRICE_MAP } from '@/lib/localityPrices';

export const PRICE_DATA_LAST_UPDATED = 'May 2026';
export const PRICE_DATA_SOURCE = '99acres · NoBroker · Coldwell Banker India · Square Yards';
export const PRICE_DATA_NOTE = 'Residential apartments, super built-up area.';

export type PriceSegment = 'luxury' | 'premium' | 'mid' | 'affordable';
export type PriceTrend = 'rising' | 'stable' | 'falling';
export type BengaluruZone = 'Central' | 'East' | 'North' | 'South' | 'West' | 'ORR Belt';

export interface LocalityPrice {
  name: string;
  zone: BengaluruZone;
  lat: number;
  lng: number;
  avgPricePerSqft: number;
  minPricePerSqft: number;
  maxPricePerSqft: number;
  range: string;
  segment: PriceSegment;
  trend: PriceTrend;
  trendPercent: number;
}

interface LocalityPriceInput {
  name: string;
  zone: BengaluruZone;
  lat: number;
  lng: number;
  avgPricePerSqft: number;
  minPricePerSqft: number;
  maxPricePerSqft: number;
}

const getSegment = (avgPricePerSqft: number): PriceSegment => {
  if (avgPricePerSqft >= 20000) return 'luxury';
  if (avgPricePerSqft >= 10000) return 'premium';
  if (avgPricePerSqft >= 6000) return 'mid';
  return 'affordable';
};

const AREA_TRENDS: Record<string, { trend: PriceTrend; trendPercent: number }> = {
  'Koramangala'           : { trend: 'rising', trendPercent: 12.5 },
  'Indiranagar'           : { trend: 'rising', trendPercent: 11.8 },
  'Jayanagar'             : { trend: 'rising', trendPercent: 13.7 },
  'Basavanagudi'          : { trend: 'rising', trendPercent: 12 },
  'Malleshwaram'          : { trend: 'rising', trendPercent: 10.1 },
  'Rajajinagar'           : { trend: 'rising', trendPercent: 11.5 },
  'MG Road'               : { trend: 'rising', trendPercent: 8.5 },
  'Lavelle Road/CBD'      : { trend: 'rising', trendPercent: 19 },
  'Richmond Town'         : { trend: 'rising', trendPercent: 9.5 },
  'Frazer Town'           : { trend: 'rising', trendPercent: 8.8 },
  'Ulsoor'                : { trend: 'rising', trendPercent: 8.5 },
  'Cox Town'              : { trend: 'rising', trendPercent: 7.5 },
  'Wilson Garden'         : { trend: 'rising', trendPercent: 7.2 },
  'Cunningham Road'       : { trend: 'rising', trendPercent: 9 },
  'Domlur'                : { trend: 'rising', trendPercent: 10.5 },
  'Whitefield'            : { trend: 'rising', trendPercent: 14.5 },
  'Marathahalli'          : { trend: 'rising', trendPercent: 11.2 },
  'Sarjapur Road'         : { trend: 'rising', trendPercent: 13 },
  'Bellandur'             : { trend: 'rising', trendPercent: 11.5 },
  'Hoodi/ITPL'            : { trend: 'rising', trendPercent: 26 },
  'KR Puram'              : { trend: 'rising', trendPercent: 10.8 },
  'Varthur'               : { trend: 'rising', trendPercent: 11 },
  'Hoskote'               : { trend: 'rising', trendPercent: 9.5 },
  'Ramamurthy Nagar'      : { trend: 'rising', trendPercent: 13.2 },
  'Budigere Road'         : { trend: 'rising', trendPercent: 14 },
  'NRI Layout'            : { trend: 'rising', trendPercent: 10 },
  'Mahadevapura'          : { trend: 'rising', trendPercent: 11 },
  'TC Palaya'             : { trend: 'rising', trendPercent: 10 },
  'Hebbal'                : { trend: 'rising', trendPercent: 10.5 },
  'Yelahanka'             : { trend: 'rising', trendPercent: 9 },
  'Yelahanka New Town'    : { trend: 'rising', trendPercent: 20 },
  'Thanisandra'           : { trend: 'rising', trendPercent: 9 },
  'Hennur'                : { trend: 'rising', trendPercent: 29 },
  'Bagalur'               : { trend: 'rising', trendPercent: 31 },
  'Devanahalli'           : { trend: 'rising', trendPercent: 11 },
  'Jakkur'                : { trend: 'rising', trendPercent: 10 },
  'Kogilu'                : { trend: 'rising', trendPercent: 9 },
  'Kothanur'              : { trend: 'rising', trendPercent: 8.5 },
  'Vidyaranyapura'        : { trend: 'rising', trendPercent: 9 },
  'RT Nagar'              : { trend: 'rising', trendPercent: 9.5 },
  'Horamavu'              : { trend: 'rising', trendPercent: 1.6 },
  'Nagawara'              : { trend: 'rising', trendPercent: 10 },
  'Manyata Tech Park'     : { trend: 'rising', trendPercent: 15 },
  'Doddaballapur'         : { trend: 'rising', trendPercent: 10 },
  'HSR Layout'            : { trend: 'rising', trendPercent: 12 },
  'BTM Layout'            : { trend: 'rising', trendPercent: 11.5 },
  'JP Nagar'              : { trend: 'rising', trendPercent: 10 },
  'Bannerghatta Road'     : { trend: 'rising', trendPercent: 10.2 },
  'Electronic City'       : { trend: 'rising', trendPercent: 24.4 },
  'Kanakapura Road'       : { trend: 'rising', trendPercent: 9.5 },
  'Banashankari'          : { trend: 'rising', trendPercent: 18.8 },
  'Begur'                 : { trend: 'rising', trendPercent: 9.5 },
  'Chandapura'            : { trend: 'rising', trendPercent: 9.5 },
  'Attibele'              : { trend: 'rising', trendPercent: 8.5 },
  'Jigani'                : { trend: 'rising', trendPercent: 8 },
  'Silk Board'            : { trend: 'rising', trendPercent: 18 },
  'Choodasandra'          : { trend: 'rising', trendPercent: 9 },
  'Gollahalli'            : { trend: 'rising', trendPercent: 11 },
  'Akshayanagar'          : { trend: 'rising', trendPercent: 14 },
  'Mysore Road'           : { trend: 'rising', trendPercent: 8.5 },
  'Kengeri'               : { trend: 'rising', trendPercent: 8.5 },
  'Nelamangala'           : { trend: 'rising', trendPercent: 7 },
  'Rajarajeshwari Nagar'  : { trend: 'rising', trendPercent: 8 },
  'BEML Layout'           : { trend: 'rising', trendPercent: 7.5 },
  'Magadi Road'           : { trend: 'rising', trendPercent: 8.2 },
  'Tumkur Road'           : { trend: 'rising', trendPercent: 8.5 },
  'Kadabagere'            : { trend: 'rising', trendPercent: 8 },
  'Mallasandra'           : { trend: 'rising', trendPercent: 10 },
  'Gollarapalya'          : { trend: 'rising', trendPercent: 8 },
  'Hesaraghatta'          : { trend: 'rising', trendPercent: 10 },
  'Kumbalakoppal'         : { trend: 'rising', trendPercent: 12 },
  'Outer Ring Road'       : { trend: 'rising', trendPercent: 22 },
  'Panathur'              : { trend: 'rising', trendPercent: 20 },
  'Kadubeesanahalli'      : { trend: 'rising', trendPercent: 18 },
  'Haralur Road'          : { trend: 'rising', trendPercent: 11 },
  'Carmelram'             : { trend: 'rising', trendPercent: 15 },
  'Sadashivanagar'        : { trend: 'rising', trendPercent: 10.5 },
  'Lavelle Road'          : { trend: 'rising', trendPercent: 9.8 },
  'Cubbon Park Area'      : { trend: 'rising', trendPercent: 9.2 },
  'Brigade Road'          : { trend: 'rising', trendPercent: 8.2 },
  'Vasanth Nagar'         : { trend: 'rising', trendPercent: 11.2 },
  'Benson Town'           : { trend: 'rising', trendPercent: 9.3 },
  'Langford Town'         : { trend: 'rising', trendPercent: 9 },
  'Austin Town'           : { trend: 'rising', trendPercent: 7.8 },
  'Shivajinagar'          : { trend: 'rising', trendPercent: 8.5 },
  'Jayanagar 4th Block'   : { trend: 'rising', trendPercent: 13.5 },
  'Sarakki'               : { trend: 'rising', trendPercent: 10.5 },
  'Padmanabhanagar'       : { trend: 'rising', trendPercent: 9.8 },
  'Girinagar'             : { trend: 'rising', trendPercent: 9.5 },
  'JP Nagar Phase 1-3'    : { trend: 'rising', trendPercent: 10.2 },
  'JP Nagar Phase 4-6'    : { trend: 'rising', trendPercent: 9.5 },
  'JP Nagar Phase 7-8'    : { trend: 'rising', trendPercent: 9 },
  'Banashankari Stage 3'  : { trend: 'rising', trendPercent: 10.8 },
  'Hosa Road'             : { trend: 'rising', trendPercent: 12 },
  'Hulimavu'              : { trend: 'rising', trendPercent: 10.5 },
  'Bilekahalli'           : { trend: 'rising', trendPercent: 10 },
  'Arekere'               : { trend: 'rising', trendPercent: 9.8 },
  'Begur Road'            : { trend: 'rising', trendPercent: 9.5 },
  'Gottigere'             : { trend: 'rising', trendPercent: 9.2 },
  'Uttarahalli'           : { trend: 'rising', trendPercent: 9 },
  'Bommanahalli'          : { trend: 'rising', trendPercent: 10 },
  'Haralur'               : { trend: 'rising', trendPercent: 11 },
  'Electronic City Phase 2': { trend: 'rising', trendPercent: 12 },
  'Electronic City Toll'  : { trend: 'rising', trendPercent: 10 },
  'Madivala'              : { trend: 'rising', trendPercent: 10.5 },
  'Silk Board Junction'   : { trend: 'rising', trendPercent: 10 },
  'Silk Board Area'       : { trend: 'rising', trendPercent: 10 },
  'Kodihalli'             : { trend: 'rising', trendPercent: 10.2 },
  'Old Airport Road'      : { trend: 'rising', trendPercent: 10 },
  'Murugeshpalya'         : { trend: 'rising', trendPercent: 9.8 },
  'Marathahalli Bridge'   : { trend: 'rising', trendPercent: 11 },
  'Whitefield Main Road'  : { trend: 'rising', trendPercent: 13.5 },
  'ITPL'                  : { trend: 'rising', trendPercent: 13 },
  'Hoodi'                 : { trend: 'rising', trendPercent: 12.5 },
  'Brookefield'           : { trend: 'rising', trendPercent: 12 },
  'Kundalahalli'          : { trend: 'rising', trendPercent: 11.5 },
  'Kaggadasapura'         : { trend: 'rising', trendPercent: 10.5 },
  'Kadugodi'              : { trend: 'rising', trendPercent: 10.5 },
  'Banaswadi'             : { trend: 'rising', trendPercent: 10.2 },
  'HRBR Layout'           : { trend: 'rising', trendPercent: 10.5 },
  'HBR Layout'            : { trend: 'rising', trendPercent: 10 },
  'Kammanahalli'          : { trend: 'rising', trendPercent: 9.8 },
  'Horamavu Agara'        : { trend: 'rising', trendPercent: 1.6 },
  'Kalyan Nagar'          : { trend: 'falling', trendPercent: 11 },
  'Manyata Tech Park Area': { trend: 'rising', trendPercent: 11 },
  'Sahakara Nagar'        : { trend: 'rising', trendPercent: 22 },
  'Hennur Road'           : { trend: 'rising', trendPercent: 9.5 },
  'Bagalur Road'          : { trend: 'rising', trendPercent: 12 },
  'Yeshwanthpur'          : { trend: 'rising', trendPercent: 10.5 },
  'Yeshwanthpur Circle'   : { trend: 'rising', trendPercent: 10.5 },
  'BEL Circle'            : { trend: 'rising', trendPercent: 10.2 },
  'Mahalakshmi Layout'    : { trend: 'rising', trendPercent: 10 },
  'Vijayanagar'           : { trend: 'rising', trendPercent: 9.8 },
  'Chord Road'            : { trend: 'rising', trendPercent: 9.5 },
  'Nagarbhavi'            : { trend: 'rising', trendPercent: 9.2 },
  'RR Nagar'              : { trend: 'rising', trendPercent: 9 },
  'Peenya'                : { trend: 'rising', trendPercent: 8 },
};

const normalizeName = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

const createPrice = (input: LocalityPriceInput): LocalityPrice => {
  const trendData = AREA_TRENDS[input.name] ?? { trend: 'rising' as PriceTrend, trendPercent: 8 };
  
  // Pull updated price from the localityPrices.ts library if it exists
  let overridePrice = LOCALITY_PRICE_MAP[input.name];
  
  // Fuzzy match if exact match fails
  if (overridePrice === undefined) {
    const inputNorm = normalizeName(input.name);
    for (const [key, price] of Object.entries(LOCALITY_PRICE_MAP)) {
      const keyNorm = normalizeName(key);
      if (inputNorm.includes(keyNorm) || keyNorm.includes(inputNorm)) {
        overridePrice = price;
        break;
      }
    }
  }

  const avgPrice = overridePrice ?? input.avgPricePerSqft;
  let minPrice = input.minPricePerSqft;
  let maxPrice = input.maxPricePerSqft;

  if (overridePrice !== undefined && overridePrice !== input.avgPricePerSqft) {
    const ratio = overridePrice / input.avgPricePerSqft;
    minPrice = Math.round(input.minPricePerSqft * ratio);
    maxPrice = Math.round(input.maxPricePerSqft * ratio);
  }

  return {
    ...input,
    avgPricePerSqft: avgPrice,
    minPricePerSqft: minPrice,
    maxPricePerSqft: maxPrice,
    range: `₹${minPrice.toLocaleString('en-IN')}–₹${maxPrice.toLocaleString('en-IN')}`,
    segment: getSegment(avgPrice),
    trend: trendData.trend,
    trendPercent: trendData.trendPercent,
  };
};

const rawPriceData: LocalityPriceInput[] = [
  { name: 'Sadashivanagar', zone: 'North', lat: 13.0092, lng: 77.5726, avgPricePerSqft: 30000, minPricePerSqft: 25000, maxPricePerSqft: 35000 },
  { name: 'Lavelle Road', zone: 'Central', lat: 12.9716, lng: 77.5946, avgPricePerSqft: 10000, minPricePerSqft: 8000, maxPricePerSqft: 12000 },
  { name: 'Cubbon Park Area', zone: 'Central', lat: 12.9763, lng: 77.5929, avgPricePerSqft: 10000, minPricePerSqft: 8000, maxPricePerSqft: 12000 },
  { name: 'Cunningham Road', zone: 'Central', lat: 12.9833, lng: 77.5917, avgPricePerSqft: 21200, minPricePerSqft: 14000, maxPricePerSqft: 18000 },
  { name: 'MG Road', zone: 'Central', lat: 12.9757, lng: 77.6011, avgPricePerSqft: 20000, minPricePerSqft: 9000, maxPricePerSqft: 20000 },
  { name: 'Brigade Road', zone: 'Central', lat: 12.9719, lng: 77.6075, avgPricePerSqft: 19000, minPricePerSqft: 15000, maxPricePerSqft: 25000 },
  { name: 'Vasanth Nagar', zone: 'Central', lat: 12.99, lng: 77.5933, avgPricePerSqft: 18000, minPricePerSqft: 15000, maxPricePerSqft: 22000 },
  { name: 'Richmond Town', zone: 'Central', lat: 12.9612, lng: 77.5996, avgPricePerSqft: 18000, minPricePerSqft: 9000, maxPricePerSqft: 16000 },
  { name: 'Malleshwaram', zone: 'West', lat: 13.0035, lng: 77.5709, avgPricePerSqft: 18900, minPricePerSqft: 13660, maxPricePerSqft: 16381 },
  { name: 'Benson Town', zone: 'Central', lat: 13.0012, lng: 77.6089, avgPricePerSqft: 10000, minPricePerSqft: 8000, maxPricePerSqft: 12000 },
  { name: 'Langford Town', zone: 'Central', lat: 12.9551, lng: 77.5989, avgPricePerSqft: 10000, minPricePerSqft: 8000, maxPricePerSqft: 12000 },
  { name: 'Frazer Town', zone: 'Central', lat: 12.9987, lng: 77.6148, avgPricePerSqft: 14200, minPricePerSqft: 9000, maxPricePerSqft: 14000 },
  { name: 'Cox Town', zone: 'Central', lat: 13.0041, lng: 77.6211, avgPricePerSqft: 9000, minPricePerSqft: 6000, maxPricePerSqft: 10000 },
  { name: 'Wilson Garden', zone: 'Central', lat: 12.9479, lng: 77.5921, avgPricePerSqft: 8500, minPricePerSqft: 7000, maxPricePerSqft: 10000 },
  { name: 'Ulsoor', zone: 'Central', lat: 12.9825, lng: 77.6209, avgPricePerSqft: 14150, minPricePerSqft: 14000, maxPricePerSqft: 19850 },
  { name: 'Austin Town', zone: 'Central', lat: 12.9637, lng: 77.6201, avgPricePerSqft: 10000, minPricePerSqft: 8000, maxPricePerSqft: 12000 },
  { name: 'Shivajinagar', zone: 'Central', lat: 12.9856, lng: 77.601, avgPricePerSqft: 13500, minPricePerSqft: 10000, maxPricePerSqft: 18000 },
  { name: 'Jayanagar', zone: 'South', lat: 12.9308, lng: 77.5832, avgPricePerSqft: 19500, minPricePerSqft: 12000, maxPricePerSqft: 44444 },
  { name: 'Jayanagar 4th Block', zone: 'South', lat: 12.9343, lng: 77.5812, avgPricePerSqft: 10000, minPricePerSqft: 8000, maxPricePerSqft: 12000 },
  { name: 'Basavanagudi', zone: 'South', lat: 12.9416, lng: 77.5756, avgPricePerSqft: 16500, minPricePerSqft: 13660, maxPricePerSqft: 16381 },
  { name: 'Sarakki', zone: 'South', lat: 12.9112, lng: 77.5669, avgPricePerSqft: 10000, minPricePerSqft: 8000, maxPricePerSqft: 12000 },
  { name: 'Padmanabhanagar', zone: 'South', lat: 12.9217, lng: 77.5531, avgPricePerSqft: 10000, minPricePerSqft: 8000, maxPricePerSqft: 12000 },
  { name: 'Girinagar', zone: 'South', lat: 12.9347, lng: 77.5551, avgPricePerSqft: 10000, minPricePerSqft: 8000, maxPricePerSqft: 12000 },
  { name: 'JP Nagar Phase 1-3', zone: 'South', lat: 12.9107, lng: 77.5845, avgPricePerSqft: 10000, minPricePerSqft: 8000, maxPricePerSqft: 12000 },
  { name: 'JP Nagar Phase 4-6', zone: 'South', lat: 12.9012, lng: 77.5901, avgPricePerSqft: 10000, minPricePerSqft: 8000, maxPricePerSqft: 12000 },
  { name: 'JP Nagar Phase 7-8', zone: 'South', lat: 12.8934, lng: 77.5956, avgPricePerSqft: 10000, minPricePerSqft: 8000, maxPricePerSqft: 12000 },
  { name: 'JP Nagar', zone: 'South', lat: 12.9063, lng: 77.5857, avgPricePerSqft: 10450, minPricePerSqft: 7500, maxPricePerSqft: 12000 },
  { name: 'Banashankari', zone: 'South', lat: 12.9256, lng: 77.5468, avgPricePerSqft: 12350, minPricePerSqft: 7000, maxPricePerSqft: 10000 },
  { name: 'Banashankari Stage 3', zone: 'South', lat: 12.9089, lng: 77.5389, avgPricePerSqft: 10000, minPricePerSqft: 8000, maxPricePerSqft: 12000 },
  { name: 'BTM Layout', zone: 'South', lat: 12.9166, lng: 77.6101, avgPricePerSqft: 10900, minPricePerSqft: 20000, maxPricePerSqft: 36000 },
  { name: 'Bannerghatta Road', zone: 'South', lat: 12.8933, lng: 77.5971, avgPricePerSqft: 10100, minPricePerSqft: 6500, maxPricePerSqft: 8000 },
  { name: 'Hosa Road', zone: 'South', lat: 12.8731, lng: 77.6478, avgPricePerSqft: 10000, minPricePerSqft: 8000, maxPricePerSqft: 12000 },
  { name: 'Hulimavu', zone: 'South', lat: 12.8837, lng: 77.6089, avgPricePerSqft: 10000, minPricePerSqft: 8000, maxPricePerSqft: 12000 },
  { name: 'Bilekahalli', zone: 'South', lat: 12.8923, lng: 77.6198, avgPricePerSqft: 10000, minPricePerSqft: 8000, maxPricePerSqft: 12000 },
  { name: 'Arekere', zone: 'South', lat: 12.8801, lng: 77.6156, avgPricePerSqft: 10000, minPricePerSqft: 8000, maxPricePerSqft: 12000 },
  { name: 'Begur', zone: 'South', lat: 12.8712, lng: 77.6234, avgPricePerSqft: 6950, minPricePerSqft: 5000, maxPricePerSqft: 7000 },
  { name: 'Begur Road', zone: 'South', lat: 12.8756, lng: 77.6187, avgPricePerSqft: 10000, minPricePerSqft: 8000, maxPricePerSqft: 12000 },
  { name: 'Gottigere', zone: 'South', lat: 12.8634, lng: 77.6023, avgPricePerSqft: 10000, minPricePerSqft: 8000, maxPricePerSqft: 12000 },
  { name: 'Uttarahalli', zone: 'South', lat: 12.9023, lng: 77.5289, avgPricePerSqft: 10000, minPricePerSqft: 8000, maxPricePerSqft: 12000 },
  { name: 'Kanakapura Road', zone: 'South', lat: 12.8812, lng: 77.5712, avgPricePerSqft: 11550, minPricePerSqft: 7000, maxPricePerSqft: 14000 },
  { name: 'Bommanahalli', zone: 'South', lat: 12.8998, lng: 77.6401, avgPricePerSqft: 10000, minPricePerSqft: 8000, maxPricePerSqft: 12000 },
  { name: 'Haralur', zone: 'ORR Belt', lat: 12.8923, lng: 77.6678, avgPricePerSqft: 10000, minPricePerSqft: 8000, maxPricePerSqft: 12000 },
  { name: 'Haralur Road', zone: 'ORR Belt', lat: 12.8956, lng: 77.6645, avgPricePerSqft: 14600, minPricePerSqft: 8000, maxPricePerSqft: 11000 },
  { name: 'Choodasandra', zone: 'South', lat: 12.8889, lng: 77.6712, avgPricePerSqft: 6000, minPricePerSqft: 5000, maxPricePerSqft: 7000 },
  { name: 'Electronic City', zone: 'South', lat: 12.8399, lng: 77.677, avgPricePerSqft: 7600, minPricePerSqft: 5950, maxPricePerSqft: 7500 },
  { name: 'Electronic City Phase 2', zone: 'South', lat: 12.8289, lng: 77.6812, avgPricePerSqft: 6800, minPricePerSqft: 5500, maxPricePerSqft: 8000 },
  { name: 'Electronic City Toll', zone: 'South', lat: 12.8445, lng: 77.6734, avgPricePerSqft: 10000, minPricePerSqft: 8000, maxPricePerSqft: 12000 },
  { name: 'Chandapura', zone: 'South', lat: 12.8012, lng: 77.6934, avgPricePerSqft: 4500, minPricePerSqft: 3500, maxPricePerSqft: 5500 },
  { name: 'Attibele', zone: 'South', lat: 12.7756, lng: 77.7634, avgPricePerSqft: 4500, minPricePerSqft: 3000, maxPricePerSqft: 5000 },
  { name: 'Jigani', zone: 'South', lat: 12.7923, lng: 77.6312, avgPricePerSqft: 5000, minPricePerSqft: 4000, maxPricePerSqft: 6000 },
  { name: 'Madivala', zone: 'South', lat: 12.9234, lng: 77.6234, avgPricePerSqft: 8500, minPricePerSqft: 6000, maxPricePerSqft: 11000 },
  { name: 'Silk Board Junction', zone: 'South', lat: 12.9172, lng: 77.6227, avgPricePerSqft: 10000, minPricePerSqft: 8000, maxPricePerSqft: 12000 },
  { name: 'Silk Board Area', zone: 'South', lat: 12.9167, lng: 77.6201, avgPricePerSqft: 10000, minPricePerSqft: 8000, maxPricePerSqft: 12000 },
  { name: 'Koramangala', zone: 'South', lat: 12.9352, lng: 77.6245, avgPricePerSqft: 17000, minPricePerSqft: 17900, maxPricePerSqft: 35000 },
  { name: 'Indiranagar', zone: 'East', lat: 12.9784, lng: 77.6408, avgPricePerSqft: 19500, minPricePerSqft: 9200, maxPricePerSqft: 14000 },
  { name: 'Domlur', zone: 'East', lat: 12.9612, lng: 77.6398, avgPricePerSqft: 16000, minPricePerSqft: 7000, maxPricePerSqft: 25000 },
  { name: 'Kodihalli', zone: 'East', lat: 12.9578, lng: 77.6489, avgPricePerSqft: 10000, minPricePerSqft: 8000, maxPricePerSqft: 12000 },
  { name: 'Old Airport Road', zone: 'East', lat: 12.9612, lng: 77.6534, avgPricePerSqft: 10000, minPricePerSqft: 8000, maxPricePerSqft: 12000 },
  { name: 'Murugeshpalya', zone: 'East', lat: 12.9634, lng: 77.6556, avgPricePerSqft: 10000, minPricePerSqft: 8000, maxPricePerSqft: 12000 },
  { name: 'HSR Layout', zone: 'South', lat: 12.9116, lng: 77.6473, avgPricePerSqft: 13200, minPricePerSqft: 20750, maxPricePerSqft: 33350 },
  { name: 'Bellandur', zone: 'ORR Belt', lat: 12.9256, lng: 77.6701, avgPricePerSqft: 13000, minPricePerSqft: 10000, maxPricePerSqft: 16000 },
  { name: 'Sarjapur Road', zone: 'East', lat: 12.9089, lng: 77.6789, avgPricePerSqft: 12150, minPricePerSqft: 9500, maxPricePerSqft: 14000 },
  { name: 'Marathahalli', zone: 'East', lat: 12.9591, lng: 77.6972, avgPricePerSqft: 13900, minPricePerSqft: 10000, maxPricePerSqft: 15000 },
  { name: 'Marathahalli Bridge', zone: 'East', lat: 12.9545, lng: 77.7012, avgPricePerSqft: 10000, minPricePerSqft: 8000, maxPricePerSqft: 12000 },
  { name: 'Whitefield', zone: 'East', lat: 12.9698, lng: 77.7499, avgPricePerSqft: 11200, minPricePerSqft: 7000, maxPricePerSqft: 13200 },
  { name: 'Whitefield Main Road', zone: 'East', lat: 12.9712, lng: 77.7401, avgPricePerSqft: 10000, minPricePerSqft: 8000, maxPricePerSqft: 12000 },
  { name: 'ITPL', zone: 'East', lat: 12.9863, lng: 77.727, avgPricePerSqft: 10000, minPricePerSqft: 8000, maxPricePerSqft: 12000 },
  { name: 'Hoodi', zone: 'East', lat: 12.9812, lng: 77.7145, avgPricePerSqft: 10000, minPricePerSqft: 8000, maxPricePerSqft: 12000 },
  { name: 'Brookefield', zone: 'East', lat: 12.9756, lng: 77.7201, avgPricePerSqft: 10500, minPricePerSqft: 8000, maxPricePerSqft: 13000 },
  { name: 'Kundalahalli', zone: 'East', lat: 12.9745, lng: 77.7089, avgPricePerSqft: 10000, minPricePerSqft: 8000, maxPricePerSqft: 12000 },
  { name: 'Kaggadasapura', zone: 'East', lat: 12.9901, lng: 77.6823, avgPricePerSqft: 10000, minPricePerSqft: 8000, maxPricePerSqft: 12000 },
  { name: 'Mahadevapura', zone: 'East', lat: 12.9934, lng: 77.7012, avgPricePerSqft: 13550, minPricePerSqft: 7500, maxPricePerSqft: 10500 },
  { name: 'KR Puram', zone: 'East', lat: 13.0089, lng: 77.6934, avgPricePerSqft: 8400, minPricePerSqft: 6500, maxPricePerSqft: 9500 },
  { name: 'Varthur', zone: 'East', lat: 12.9412, lng: 77.7401, avgPricePerSqft: 13900, minPricePerSqft: 5500, maxPricePerSqft: 8500 },
  { name: 'Kadugodi', zone: 'East', lat: 12.9923, lng: 77.7623, avgPricePerSqft: 10000, minPricePerSqft: 8000, maxPricePerSqft: 12000 },
  { name: 'Hoskote', zone: 'East', lat: 13.0712, lng: 77.7989, avgPricePerSqft: 6876, minPricePerSqft: 4500, maxPricePerSqft: 7500 },
  { name: 'Banaswadi', zone: 'East', lat: 13.0112, lng: 77.6534, avgPricePerSqft: 10000, minPricePerSqft: 8000, maxPricePerSqft: 12000 },
  { name: 'HRBR Layout', zone: 'North', lat: 13.0145, lng: 77.6489, avgPricePerSqft: 10000, minPricePerSqft: 8000, maxPricePerSqft: 12000 },
  { name: 'HBR Layout', zone: 'North', lat: 13.0178, lng: 77.6412, avgPricePerSqft: 10000, minPricePerSqft: 8000, maxPricePerSqft: 12000 },
  { name: 'Kammanahalli', zone: 'North', lat: 13.0089, lng: 77.6378, avgPricePerSqft: 8500, minPricePerSqft: 6000, maxPricePerSqft: 11000 },
  { name: 'Horamavu', zone: 'North', lat: 13.0212, lng: 77.6623, avgPricePerSqft: 10900, minPricePerSqft: 4500, maxPricePerSqft: 6500 },
  { name: 'Horamavu Agara', zone: 'North', lat: 13.0178, lng: 77.6656, avgPricePerSqft: 10000, minPricePerSqft: 8000, maxPricePerSqft: 12000 },
  { name: 'Kalyan Nagar', zone: 'North', lat: 13.0256, lng: 77.6489, avgPricePerSqft: 10000, minPricePerSqft: 8000, maxPricePerSqft: 12000 },
  { name: 'Ramamurthy Nagar', zone: 'East', lat: 13.0312, lng: 77.6701, avgPricePerSqft: 5500, minPricePerSqft: 3500, maxPricePerSqft: 6000 },
  { name: 'Hebbal', zone: 'North', lat: 13.0456, lng: 77.5912, avgPricePerSqft: 14200, minPricePerSqft: 9000, maxPricePerSqft: 13000 },
  { name: 'Manyata Tech Park Area', zone: 'North', lat: 13.0478, lng: 77.6212, avgPricePerSqft: 10000, minPricePerSqft: 8000, maxPricePerSqft: 12000 },
  { name: 'RT Nagar', zone: 'North', lat: 13.0234, lng: 77.5923, avgPricePerSqft: 7500, minPricePerSqft: 4500, maxPricePerSqft: 6500 },
  { name: 'Sahakara Nagar', zone: 'North', lat: 13.0534, lng: 77.5934, avgPricePerSqft: 11500, minPricePerSqft: 8000, maxPricePerSqft: 15000 },
  { name: 'Vidyaranyapura', zone: 'North', lat: 13.0623, lng: 77.5556, avgPricePerSqft: 6450, minPricePerSqft: 5500, maxPricePerSqft: 7500 },
  { name: 'Jakkur', zone: 'North', lat: 13.0712, lng: 77.5923, avgPricePerSqft: 10450, minPricePerSqft: 7500, maxPricePerSqft: 10500 },
  { name: 'Hennur Road', zone: 'North', lat: 13.0423, lng: 77.6345, avgPricePerSqft: 10000, minPricePerSqft: 8000, maxPricePerSqft: 12000 },
  { name: 'Thanisandra', zone: 'North', lat: 13.0567, lng: 77.6278, avgPricePerSqft: 8400, minPricePerSqft: 8500, maxPricePerSqft: 12500 },
  { name: 'Kothanur', zone: 'North', lat: 13.0634, lng: 77.5812, avgPricePerSqft: 6800, minPricePerSqft: 5500, maxPricePerSqft: 7500 },
  { name: 'Kogilu', zone: 'North', lat: 13.0756, lng: 77.6034, avgPricePerSqft: 7900, minPricePerSqft: 6000, maxPricePerSqft: 9000 },
  { name: 'Yelahanka', zone: 'North', lat: 13.1006, lng: 77.5963, avgPricePerSqft: 11650, minPricePerSqft: 6500, maxPricePerSqft: 9000 },
  { name: 'Bagalur Road', zone: 'North', lat: 13.1234, lng: 77.6712, avgPricePerSqft: 10000, minPricePerSqft: 8000, maxPricePerSqft: 12000 },
  { name: 'Devanahalli', zone: 'North', lat: 13.2456, lng: 77.7145, avgPricePerSqft: 7100, minPricePerSqft: 6500, maxPricePerSqft: 10500 },
  { name: 'Rajajinagar', zone: 'West', lat: 12.9912, lng: 77.5534, avgPricePerSqft: 16500, minPricePerSqft: 11950, maxPricePerSqft: 26950 },
  { name: 'Yeshwanthpur', zone: 'West', lat: 13.0234, lng: 77.5389, avgPricePerSqft: 9500, minPricePerSqft: 7000, maxPricePerSqft: 12000 },
  { name: 'Yeshwanthpur Circle', zone: 'West', lat: 13.0212, lng: 77.5367, avgPricePerSqft: 10000, minPricePerSqft: 8000, maxPricePerSqft: 12000 },
  { name: 'BEL Circle', zone: 'West', lat: 13.0312, lng: 77.5489, avgPricePerSqft: 10000, minPricePerSqft: 8000, maxPricePerSqft: 12000 },
  { name: 'Mahalakshmi Layout', zone: 'West', lat: 13.0078, lng: 77.5423, avgPricePerSqft: 10000, minPricePerSqft: 8000, maxPricePerSqft: 12000 },
  { name: 'Vijayanagar', zone: 'West', lat: 12.9712, lng: 77.5289, avgPricePerSqft: 10000, minPricePerSqft: 8000, maxPricePerSqft: 12000 },
  { name: 'Chord Road', zone: 'West', lat: 12.9856, lng: 77.5212, avgPricePerSqft: 10000, minPricePerSqft: 8000, maxPricePerSqft: 12000 },
  { name: 'Nagarbhavi', zone: 'West', lat: 12.9534, lng: 77.5089, avgPricePerSqft: 10000, minPricePerSqft: 8000, maxPricePerSqft: 12000 },
  { name: 'RR Nagar', zone: 'West', lat: 12.9267, lng: 77.5123, avgPricePerSqft: 10000, minPricePerSqft: 8000, maxPricePerSqft: 12000 },
  { name: 'Mysore Road', zone: 'West', lat: 12.9456, lng: 77.4934, avgPricePerSqft: 8900, minPricePerSqft: 5000, maxPricePerSqft: 7000 },
  { name: 'Magadi Road', zone: 'West', lat: 12.9712, lng: 77.5156, avgPricePerSqft: 10600, minPricePerSqft: 5000, maxPricePerSqft: 7000 },
  { name: 'Rajarajeshwari Nagar', zone: 'West', lat: 12.9234, lng: 77.4923, avgPricePerSqft: 5500, minPricePerSqft: 4500, maxPricePerSqft: 6500 },
  { name: 'Kengeri', zone: 'West', lat: 12.9078, lng: 77.4823, avgPricePerSqft: 7150, minPricePerSqft: 4500, maxPricePerSqft: 7000 },
  { name: 'Peenya', zone: 'West', lat: 13.0289, lng: 77.5167, avgPricePerSqft: 10000, minPricePerSqft: 8000, maxPricePerSqft: 12000 },
  { name: 'Tumkur Road', zone: 'West', lat: 13.0456, lng: 77.5056, avgPricePerSqft: 18150, minPricePerSqft: 5000, maxPricePerSqft: 7000 },
  { name: 'BEML Layout', zone: 'West', lat: 12.9389, lng: 77.5034, avgPricePerSqft: 5500, minPricePerSqft: 4500, maxPricePerSqft: 6500 },
  { name: 'Nelamangala', zone: 'West', lat: 13.0978, lng: 77.3923, avgPricePerSqft: 5900, minPricePerSqft: 4000, maxPricePerSqft: 6000 },
];

export const bengaluruPropertyPrices: LocalityPrice[] = rawPriceData.map(createPrice);

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[./()-]/g, ' ')
    .replace(/\bcentral business district\b/g, 'cbd')
    .replace(/\brr\b/g, 'rajarajeshwari nagar')
    .replace(/\s+/g, ' ')
    .trim();

const tokenize = (value: string) => normalizeText(value).split(' ').filter(Boolean);

export const getPriceByLocalityName = (name: string): LocalityPrice | undefined => {
  const normalized = normalizeText(name);
  const inputTokens = tokenize(name);

  return bengaluruPropertyPrices.find((price) => {
    const normalizedName = normalizeText(price.name);
    if (normalizedName === normalized) return true;
    if (normalizedName.includes(normalized) || normalized.includes(normalizedName)) return true;

    const localityTokens = tokenize(price.name);
    return inputTokens.every((token) => localityTokens.includes(token)) || localityTokens.every((token) => inputTokens.includes(token));
  });
};

export const getPriceSegmentColor = (segment: PriceSegment): string => {
  switch (segment) {
    case 'luxury':
      return 'hsl(var(--danger))';
    case 'premium':
      return 'hsl(var(--primary))';
    case 'mid':
      return 'hsl(var(--warning))';
    case 'affordable':
    default:
      return 'hsl(var(--success))';
  }
};

export const formatPriceLabel = (avg: number): string => {
  if (avg >= 10000) return `₹${Math.round(avg / 1000)}K`;
  const value = (avg / 1000).toFixed(1).replace(/\.0$/, '');
  return `₹${value}K`;
};

export const getPricesByZone = (zone: BengaluruZone): LocalityPrice[] =>
  bengaluruPropertyPrices.filter((price) => price.zone === zone);

export const getCityPriceStats = () => {
  const values = bengaluruPropertyPrices.map((price) => price.avgPricePerSqft).sort((a, b) => a - b);
  const total = values.reduce((sum, value) => sum + value, 0);
  const middle = Math.floor(values.length / 2);
  const median =
    values.length % 2 === 0
      ? Math.round((values[middle - 1] + values[middle]) / 2)
      : values[middle];

  return {
    min: values[0],
    max: values[values.length - 1],
    avg: Math.round(total / values.length),
    median,
    totalLocalities: values.length,
  };
};
