export const PRICE_DATA_LAST_UPDATED = 'March 2026';
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
  'Koramangala':           { trend: 'rising',  trendPercent: 18 },
  'Indiranagar':           { trend: 'rising',  trendPercent: 13 },
  'Jayanagar':             { trend: 'rising',  trendPercent: 11 },
  'Basavanagudi':          { trend: 'rising',  trendPercent: 8  },
  'Malleshwaram':          { trend: 'stable',  trendPercent: 4  },
  'Rajajinagar':           { trend: 'rising',  trendPercent: 14 },
  'MG Road':               { trend: 'rising',  trendPercent: 15 },
  'Lavelle Road/CBD':      { trend: 'rising',  trendPercent: 19 },
  'Richmond Town':         { trend: 'rising',  trendPercent: 8  },
  'Frazer Town':           { trend: 'rising',  trendPercent: 13 },
  'Ulsoor':                { trend: 'falling', trendPercent: 5  },
  'Cox Town':              { trend: 'rising',  trendPercent: 7  },
  'Wilson Garden':         { trend: 'rising',  trendPercent: 6  },
  'Cunningham Road':       { trend: 'stable',  trendPercent: 2  },
  'Domlur':                { trend: 'rising',  trendPercent: 10 },
  'Whitefield':            { trend: 'rising',  trendPercent: 29 },
  'Marathahalli':          { trend: 'rising',  trendPercent: 70 },
  'Sarjapur Road':         { trend: 'rising',  trendPercent: 16 },
  'Bellandur':             { trend: 'rising',  trendPercent: 18 },
  'Hoodi/ITPL':            { trend: 'rising',  trendPercent: 26 },
  'KR Puram':              { trend: 'rising',  trendPercent: 20 },
  'Varthur':               { trend: 'rising',  trendPercent: 23 },
  'Hoskote':               { trend: 'rising',  trendPercent: 20 },
  'Ramamurthy Nagar':      { trend: 'rising',  trendPercent: 12 },
  'Budigere Road':         { trend: 'rising',  trendPercent: 14 },
  'NRI Layout':            { trend: 'rising',  trendPercent: 10 },
  'Mahadevapura':          { trend: 'rising',  trendPercent: 75 },
  'TC Palaya':             { trend: 'rising',  trendPercent: 10 },
  'Hebbal':                { trend: 'rising',  trendPercent: 37 },
  'Yelahanka':             { trend: 'rising',  trendPercent: 34 },
  'Yelahanka New Town':    { trend: 'rising',  trendPercent: 20 },
  'Thanisandra':           { trend: 'rising',  trendPercent: 62 },
  'Hennur':                { trend: 'rising',  trendPercent: 29 },
  'Bagalur':               { trend: 'rising',  trendPercent: 31 },
  'Devanahalli':           { trend: 'rising',  trendPercent: 43 },
  'Jakkur':                { trend: 'rising',  trendPercent: 17 },
  'Kogilu':                { trend: 'rising',  trendPercent: 13 },
  'Kothanur':              { trend: 'rising',  trendPercent: 14 },
  'Vidyaranyapura':        { trend: 'falling', trendPercent: 1  },
  'RT Nagar':              { trend: 'rising',  trendPercent: 16 },
  'Horamavu':              { trend: 'rising',  trendPercent: 86 },
  'Nagawara':              { trend: 'rising',  trendPercent: 10 },
  'Manyata Tech Park':     { trend: 'rising',  trendPercent: 15 },
  'Doddaballapur':         { trend: 'rising',  trendPercent: 10 },
  'HSR Layout':            { trend: 'rising',  trendPercent: 38 },
  'BTM Layout':            { trend: 'rising',  trendPercent: 21 },
  'JP Nagar':              { trend: 'rising',  trendPercent: 32 },
  'Bannerghatta Road':     { trend: 'rising',  trendPercent: 30 },
  'Electronic City':       { trend: 'rising',  trendPercent: 25 },
  'Kanakapura Road':       { trend: 'rising',  trendPercent: 32 },
  'Banashankari':          { trend: 'rising',  trendPercent: 29 },
  'Begur':                 { trend: 'rising',  trendPercent: 14 },
  'Chandapura':            { trend: 'rising',  trendPercent: 11 },
  'Attibele':              { trend: 'rising',  trendPercent: 8  },
  'Jigani':                { trend: 'rising',  trendPercent: 41 },
  'Silk Board':            { trend: 'rising',  trendPercent: 18 },
  'Choodasandra':          { trend: 'rising',  trendPercent: 12 },
  'Gollahalli':            { trend: 'rising',  trendPercent: 11 },
  'Akshayanagar':          { trend: 'rising',  trendPercent: 14 },
  'Mysore Road':           { trend: 'rising',  trendPercent: 18 },
  'Kengeri':               { trend: 'rising',  trendPercent: 15 },
  'Nelamangala':           { trend: 'stable',  trendPercent: 0  },
  'Rajarajeshwari Nagar':  { trend: 'rising',  trendPercent: 14 },
  'BEML Layout':           { trend: 'rising',  trendPercent: 12 },
  'Magadi Road':           { trend: 'rising',  trendPercent: 31 },
  'Tumkur Road':           { trend: 'rising',  trendPercent: 6  },
  'Kadabagere':            { trend: 'rising',  trendPercent: 8  },
  'Mallasandra':           { trend: 'rising',  trendPercent: 10 },
  'Gollarapalya':          { trend: 'rising',  trendPercent: 8  },
  'Hesaraghatta':          { trend: 'rising',  trendPercent: 10 },
  'Kumbalakoppal':         { trend: 'rising',  trendPercent: 12 },
  'Outer Ring Road':       { trend: 'rising',  trendPercent: 22 },
  'Panathur':              { trend: 'rising',  trendPercent: 20 },
  'Kadubeesanahalli':      { trend: 'rising',  trendPercent: 18 },
  'Haralur Road':          { trend: 'rising',  trendPercent: 28 },
  'Carmelram':             { trend: 'rising',  trendPercent: 15 },
};

const createPrice = (input: LocalityPriceInput): LocalityPrice => {
  const trendData = AREA_TRENDS[input.name] ?? { trend: 'rising' as PriceTrend, trendPercent: 8 };
  return {
    ...input,
    range: `₹${input.minPricePerSqft.toLocaleString('en-IN')}–₹${input.maxPricePerSqft.toLocaleString('en-IN')}`,
    segment: getSegment(input.avgPricePerSqft),
    trend: trendData.trend,
    trendPercent: trendData.trendPercent,
  };
};

const rawPriceData: LocalityPriceInput[] = [
  { name: 'Koramangala', zone: 'Central', lat: 12.9352, lng: 77.6245, avgPricePerSqft: 17000, minPricePerSqft: 17900, maxPricePerSqft: 35000 },
  { name: 'Indiranagar', zone: 'Central', lat: 12.9784, lng: 77.6408, avgPricePerSqft: 19500, minPricePerSqft: 9200, maxPricePerSqft: 14000 },
  { name: 'Jayanagar', zone: 'Central', lat: 12.925, lng: 77.5938, avgPricePerSqft: 19500, minPricePerSqft: 12000, maxPricePerSqft: 44444 },
  { name: 'Basavanagudi', zone: 'Central', lat: 12.9422, lng: 77.5737, avgPricePerSqft: 16500, minPricePerSqft: 13660, maxPricePerSqft: 16381 },
  { name: 'Malleshwaram', zone: 'Central', lat: 13.0035, lng: 77.5648, avgPricePerSqft: 18900, minPricePerSqft: 13660, maxPricePerSqft: 16381 },
  { name: 'Rajajinagar', zone: 'Central', lat: 12.991, lng: 77.552, avgPricePerSqft: 16500, minPricePerSqft: 11950, maxPricePerSqft: 26950 },
  { name: 'MG Road', zone: 'Central', lat: 12.9756, lng: 77.6068, avgPricePerSqft: 20000, minPricePerSqft: 9000, maxPricePerSqft: 20000 },
  { name: 'Lavelle Road/CBD', zone: 'Central', lat: 12.9719, lng: 77.5995, avgPricePerSqft: 25750, minPricePerSqft: 20000, maxPricePerSqft: 30000 },
  { name: 'Richmond Town', zone: 'Central', lat: 12.9647, lng: 77.5988, avgPricePerSqft: 18000, minPricePerSqft: 9000, maxPricePerSqft: 16000 },
  { name: 'Frazer Town', zone: 'Central', lat: 12.998, lng: 77.612, avgPricePerSqft: 14200, minPricePerSqft: 9000, maxPricePerSqft: 14000 },
  { name: 'Ulsoor', zone: 'Central', lat: 12.982, lng: 77.62, avgPricePerSqft: 14150, minPricePerSqft: 14000, maxPricePerSqft: 19850 },
  { name: 'Cox Town', zone: 'Central', lat: 12.9954, lng: 77.6227, avgPricePerSqft: 9000, minPricePerSqft: 6000, maxPricePerSqft: 10000 },
  { name: 'Wilson Garden', zone: 'Central', lat: 12.95, lng: 77.595, avgPricePerSqft: 8500, minPricePerSqft: 7000, maxPricePerSqft: 10000 },
  { name: 'Cunningham Road', zone: 'Central', lat: 12.9895, lng: 77.5945, avgPricePerSqft: 21200, minPricePerSqft: 14000, maxPricePerSqft: 18000 },
  { name: 'Domlur', zone: 'Central', lat: 12.961, lng: 77.637, avgPricePerSqft: 16000, minPricePerSqft: 7000, maxPricePerSqft: 25000 },
 
  { name: 'Whitefield', zone: 'East', lat: 12.9698, lng: 77.75, avgPricePerSqft: 11200, minPricePerSqft: 7000, maxPricePerSqft: 13200 },
  { name: 'Marathahalli', zone: 'East', lat: 12.9591, lng: 77.701, avgPricePerSqft: 13900, minPricePerSqft: 10000, maxPricePerSqft: 15000 },
  { name: 'Sarjapur Road', zone: 'East', lat: 12.91, lng: 77.685, avgPricePerSqft: 12150, minPricePerSqft: 9500, maxPricePerSqft: 14000 },
  { name: 'Bellandur', zone: 'East', lat: 12.926, lng: 77.678, avgPricePerSqft: 13000, minPricePerSqft: 10000, maxPricePerSqft: 16000 },
  { name: 'Hoodi/ITPL', zone: 'East', lat: 12.9894, lng: 77.7179, avgPricePerSqft: 14950, minPricePerSqft: 8000, maxPricePerSqft: 12000 },
  { name: 'KR Puram', zone: 'East', lat: 13.0098, lng: 77.696, avgPricePerSqft: 8400, minPricePerSqft: 6500, maxPricePerSqft: 9500 },
  { name: 'Varthur', zone: 'East', lat: 12.9404, lng: 77.7473, avgPricePerSqft: 13900, minPricePerSqft: 5500, maxPricePerSqft: 8500 },
  { name: 'Hoskote', zone: 'East', lat: 13.0711, lng: 77.7982, avgPricePerSqft: 6876, minPricePerSqft: 4500, maxPricePerSqft: 7500 },
  { name: 'Ramamurthy Nagar', zone: 'East', lat: 13.015, lng: 77.668, avgPricePerSqft: 5500, minPricePerSqft: 3500, maxPricePerSqft: 6000 },
  { name: 'Budigere Road', zone: 'East', lat: 13.0415, lng: 77.7307, avgPricePerSqft: 7900, minPricePerSqft: 5000, maxPricePerSqft: 8000 },
  { name: 'NRI Layout', zone: 'East', lat: 13.0139, lng: 77.6835, avgPricePerSqft: 5500, minPricePerSqft: 4000, maxPricePerSqft: 6000 },
  { name: 'Mahadevapura', zone: 'East', lat: 12.9923, lng: 77.6892, avgPricePerSqft: 13550, minPricePerSqft: 7500, maxPricePerSqft: 10500 },
  { name: 'TC Palaya', zone: 'East', lat: 13.0255, lng: 77.6785, avgPricePerSqft: 5000, minPricePerSqft: 3500, maxPricePerSqft: 5500 },
 
  { name: 'Hebbal', zone: 'North', lat: 13.0358, lng: 77.597, avgPricePerSqft: 14200, minPricePerSqft: 9000, maxPricePerSqft: 13000 },
  { name: 'Yelahanka', zone: 'North', lat: 13.1007, lng: 77.5963, avgPricePerSqft: 11650, minPricePerSqft: 6500, maxPricePerSqft: 9000 },
  { name: 'Yelahanka New Town', zone: 'North', lat: 13.1031, lng: 77.586, avgPricePerSqft: 10500, minPricePerSqft: 8700, maxPricePerSqft: 11500 },
  { name: 'Thanisandra', zone: 'North', lat: 13.0606, lng: 77.6409, avgPricePerSqft: 8400, minPricePerSqft: 8500, maxPricePerSqft: 12500 },
  { name: 'Hennur', zone: 'North', lat: 13.0459, lng: 77.6427, avgPricePerSqft: 10100, minPricePerSqft: 5800, maxPricePerSqft: 7200 },
  { name: 'Bagalur', zone: 'North', lat: 13.1194, lng: 77.6601, avgPricePerSqft: 6500, minPricePerSqft: 7500, maxPricePerSqft: 11500 },
  { name: 'Devanahalli', zone: 'North', lat: 13.15, lng: 77.7118, avgPricePerSqft: 7100, minPricePerSqft: 6500, maxPricePerSqft: 10500 },
  { name: 'Jakkur', zone: 'North', lat: 13.0785, lng: 77.6065, avgPricePerSqft: 10450, minPricePerSqft: 7500, maxPricePerSqft: 10500 },
  { name: 'Kogilu', zone: 'North', lat: 13.0838, lng: 77.5979, avgPricePerSqft: 7900, minPricePerSqft: 6000, maxPricePerSqft: 9000 },
  { name: 'Kothanur', zone: 'North', lat: 13.0617, lng: 77.6499, avgPricePerSqft: 6800, minPricePerSqft: 5500, maxPricePerSqft: 7500 },
  { name: 'Vidyaranyapura', zone: 'North', lat: 13.075, lng: 77.555, avgPricePerSqft: 6450, minPricePerSqft: 5500, maxPricePerSqft: 7500 },
  { name: 'RT Nagar', zone: 'North', lat: 13.0218, lng: 77.594, avgPricePerSqft: 7500, minPricePerSqft: 4500, maxPricePerSqft: 6500 },
  { name: 'Horamavu', zone: 'North', lat: 13.0323, lng: 77.6599, avgPricePerSqft: 10900, minPricePerSqft: 4500, maxPricePerSqft: 6500 },
  { name: 'Nagawara', zone: 'North', lat: 13.0435, lng: 77.6207, avgPricePerSqft: 8450, minPricePerSqft: 7000, maxPricePerSqft: 10000 },
  { name: 'Manyata Tech Park', zone: 'North', lat: 13.0474, lng: 77.6212, avgPricePerSqft: 11000, minPricePerSqft: 7500, maxPricePerSqft: 11500 },
  { name: 'Doddaballapur', zone: 'North', lat: 13.15, lng: 77.5375, avgPricePerSqft: 5200, minPricePerSqft: 4800, maxPricePerSqft: 6200 },
 
  { name: 'HSR Layout', zone: 'South', lat: 12.9116, lng: 77.6474, avgPricePerSqft: 13200, minPricePerSqft: 20750, maxPricePerSqft: 33350 },
  { name: 'BTM Layout', zone: 'South', lat: 12.9166, lng: 77.6101, avgPricePerSqft: 10900, minPricePerSqft: 20000, maxPricePerSqft: 36000 },
  { name: 'JP Nagar', zone: 'South', lat: 12.9063, lng: 77.5857, avgPricePerSqft: 10450, minPricePerSqft: 7500, maxPricePerSqft: 12000 },
  { name: 'Bannerghatta Road', zone: 'South', lat: 12.8708, lng: 77.5956, avgPricePerSqft: 10100, minPricePerSqft: 6500, maxPricePerSqft: 8000 },
  { name: 'Electronic City', zone: 'South', lat: 12.8399, lng: 77.677, avgPricePerSqft: 7600, minPricePerSqft: 5950, maxPricePerSqft: 7500 },
  { name: 'Kanakapura Road', zone: 'South', lat: 12.88, lng: 77.565, avgPricePerSqft: 11550, minPricePerSqft: 7000, maxPricePerSqft: 14000 },
  { name: 'Banashankari', zone: 'South', lat: 12.9255, lng: 77.5468, avgPricePerSqft: 12350, minPricePerSqft: 7000, maxPricePerSqft: 10000 },
  { name: 'Begur', zone: 'South', lat: 12.875, lng: 77.635, avgPricePerSqft: 6950, minPricePerSqft: 5000, maxPricePerSqft: 7000 },
  { name: 'Chandapura', zone: 'South', lat: 12.8003, lng: 77.7045, avgPricePerSqft: 4500, minPricePerSqft: 3500, maxPricePerSqft: 5500 },
  { name: 'Attibele', zone: 'South', lat: 12.7791, lng: 77.7702, avgPricePerSqft: 4500, minPricePerSqft: 3000, maxPricePerSqft: 5000 },
  { name: 'Jigani', zone: 'South', lat: 12.7832, lng: 77.6412, avgPricePerSqft: 5000, minPricePerSqft: 4000, maxPricePerSqft: 6000 },
  { name: 'Silk Board', zone: 'South', lat: 12.9172, lng: 77.6228, avgPricePerSqft: 10500, minPricePerSqft: 7500, maxPricePerSqft: 10500 },
  { name: 'Choodasandra', zone: 'South', lat: 12.8899, lng: 77.6851, avgPricePerSqft: 6000, minPricePerSqft: 5000, maxPricePerSqft: 7000 },
  { name: 'Gollahalli', zone: 'South', lat: 12.8627, lng: 77.6432, avgPricePerSqft: 5800, minPricePerSqft: 5000, maxPricePerSqft: 7000 },
  { name: 'Akshayanagar', zone: 'South', lat: 12.8816, lng: 77.6248, avgPricePerSqft: 7200, minPricePerSqft: 5500, maxPricePerSqft: 7500 },
 
  { name: 'Mysore Road', zone: 'West', lat: 12.955, lng: 77.52, avgPricePerSqft: 8900, minPricePerSqft: 5000, maxPricePerSqft: 7000 },
  { name: 'Kengeri', zone: 'West', lat: 12.907, lng: 77.485, avgPricePerSqft: 7150, minPricePerSqft: 4500, maxPricePerSqft: 7000 },
  { name: 'Nelamangala', zone: 'West', lat: 13.0996, lng: 77.393, avgPricePerSqft: 5900, minPricePerSqft: 4000, maxPricePerSqft: 6000 },
  { name: 'Rajarajeshwari Nagar', zone: 'West', lat: 12.9237, lng: 77.4987, avgPricePerSqft: 5500, minPricePerSqft: 4500, maxPricePerSqft: 6500 },
  { name: 'BEML Layout', zone: 'West', lat: 12.9132, lng: 77.5144, avgPricePerSqft: 5500, minPricePerSqft: 4500, maxPricePerSqft: 6500 },
  { name: 'Magadi Road', zone: 'West', lat: 12.9729, lng: 77.5157, avgPricePerSqft: 10600, minPricePerSqft: 5000, maxPricePerSqft: 7000 },
  { name: 'Tumkur Road', zone: 'West', lat: 13.05, lng: 77.52, avgPricePerSqft: 18150, minPricePerSqft: 5000, maxPricePerSqft: 7000 },
  { name: 'Kadabagere', zone: 'West', lat: 12.9838, lng: 77.4548, avgPricePerSqft: 4500, minPricePerSqft: 3500, maxPricePerSqft: 5500 },
  { name: 'Mallasandra', zone: 'West', lat: 13.0301, lng: 77.4754, avgPricePerSqft: 6000, minPricePerSqft: 5000, maxPricePerSqft: 7000 },
  { name: 'Gollarapalya', zone: 'West', lat: 12.9718, lng: 77.4978, avgPricePerSqft: 4800, minPricePerSqft: 3500, maxPricePerSqft: 5500 },
  { name: 'Hesaraghatta', zone: 'West', lat: 13.1134, lng: 77.4856, avgPricePerSqft: 4500, minPricePerSqft: 7500, maxPricePerSqft: 9500 },
  { name: 'Kumbalakoppal', zone: 'West', lat: 12.9572, lng: 77.4687, avgPricePerSqft: 7000, minPricePerSqft: 5500, maxPricePerSqft: 7500 },
 
  { name: 'Outer Ring Road', zone: 'ORR Belt', lat: 12.9447, lng: 77.6914, avgPricePerSqft: 12500, minPricePerSqft: 7500, maxPricePerSqft: 10500 },
  { name: 'Panathur', zone: 'ORR Belt', lat: 12.9344, lng: 77.7014, avgPricePerSqft: 10949, minPricePerSqft: 8000, maxPricePerSqft: 11000 },
  { name: 'Kadubeesanahalli', zone: 'ORR Belt', lat: 12.9387, lng: 77.6944, avgPricePerSqft: 13000, minPricePerSqft: 8500, maxPricePerSqft: 11500 },
  { name: 'Haralur Road', zone: 'ORR Belt', lat: 12.8991, lng: 77.6631, avgPricePerSqft: 14600, minPricePerSqft: 8000, maxPricePerSqft: 11000 },
  { name: 'Carmelram', zone: 'ORR Belt', lat: 12.8922, lng: 77.6955, avgPricePerSqft: 9500, minPricePerSqft: 8000, maxPricePerSqft: 11000 },
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
