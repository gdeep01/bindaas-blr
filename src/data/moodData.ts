// SimCity-style Mood Index data for Bengaluru areas
// Scores derived from publicly available geographic data (nearby amenities, infrastructure proximity)

export interface AreaMetric {
  name: string;
  score: number; // 0-100
  icon: string;
  source: string; // data source description
}

export interface GrowthData {
  infra: number;        // 0-30: upcoming metro, road expansion, flyovers, civic upgrades
  commercial: number;   // 0-20: tech parks, office leasing, retail hubs
  priceMomentum: number; // 0-20: 2-3yr CAGR of property prices
  connectivity: number; // 0-15: distance to IT hubs, metro interchange, ORR access
  undervaluation: number; // 0-15: QoL / price ratio (hidden gems)
  drivers: string[];    // what's driving growth
  risks: string[];      // risk factors
}

export type BestForTag = 'Families' | 'Students' | 'IT Professionals' | 'Quiet Residential' | 'High Nightlife' | 'Retirees' | 'Young Professionals' | 'Budget Friendly';

export interface AreaMood {
  id: string;
  area: string;
  lat: number;
  lng: number;
  overallMood: number; // 0-100
  metrics: AreaMetric[];
  bestFor: BestForTag[];
  growthScore: number; // 0-100
  growthData: GrowthData;
}

export const moodCategories = [
  { key: 'quality', label: 'Quality of Living', icon: 'QOL', source: 'Health, employment & wealth indicators' },
  { key: 'parks', label: 'Parks & Green', icon: 'PARK', source: 'Parks & green spaces within 1 km' },
  { key: 'schools', label: 'Schools', icon: 'SCH', source: 'Schools within 1 km radius' },
  { key: 'healthcare', label: 'Healthcare', icon: 'HLTH', source: 'Hospitals within 2-4 km radius' },
  { key: 'factories', label: 'Industrial Safety', icon: 'SAFE', source: 'Industrial zone proximity' },
  { key: 'entertainment', label: 'Entertainment', icon: 'FUN', source: 'Restaurants, pubs, clubs & amusement parks nearby' },
  { key: 'fire', label: 'Fire Station', icon: 'FIRE', source: 'Fire stations within 1-2 km radius' },
  { key: 'traffic', label: 'Traffic Flow', icon: 'FLOW', source: 'Live congestion, incidents & roadworks data' },
];

// Helper: q=Quality of Living, p=Parks, s=Schools, h=Healthcare, f=Industrial Safety, e=Entertainment, fi=Fire Station, t=Traffic
const m = (q: number, p: number, s: number, h: number, f: number, e: number, fi: number, t: number): AreaMetric[] => [
  { name: 'Quality of Living', score: q, icon: 'QOL', source: 'Health, employment & wealth indicators' },
  { name: 'Parks & Green', score: p, icon: 'PARK', source: 'Parks & green spaces within 1 km' },
  { name: 'Schools', score: s, icon: 'SCH', source: 'Schools within 1 km radius' },
  { name: 'Healthcare', score: h, icon: 'HLTH', source: 'Hospitals within 2-4 km radius' },
  { name: 'Industrial Safety', score: f, icon: 'SAFE', source: 'Industrial zone proximity' },
  { name: 'Entertainment', score: e, icon: 'FUN', source: 'Restaurants, pubs, clubs & amusement parks nearby' },
  { name: 'Fire Station', score: fi, icon: 'FIRE', source: 'Fire stations within 1-2 km radius' },
  { name: 'Traffic Flow', score: t, icon: 'FLOW', source: 'Live congestion, incidents & roadworks data' },
];

const avg = (metrics: AreaMetric[]) => Math.round(metrics.reduce((s, m) => s + m.score, 0) / metrics.length);

// Auto-generate "Best For" tags based on metric scores
const generateBestFor = (q: number, p: number, s: number, h: number, _f: number, e: number, _fi: number, t: number): BestForTag[] => {
  const tags: BestForTag[] = [];
  if (s >= 75 && h >= 70 && p >= 60 && t >= 40) tags.push('Families');
  if (s >= 70 && e >= 60 && q <= 70) tags.push('Students');
  if (t >= 30 && e >= 60 && q >= 70) tags.push('IT Professionals');
  if (t >= 50 && p >= 65 && e <= 55) tags.push('Quiet Residential');
  if (e >= 80) tags.push('High Nightlife');
  if (p >= 75 && h >= 75 && t >= 45) tags.push('Retirees');
  if (e >= 65 && q >= 65 && q <= 85) tags.push('Young Professionals');
  if (q <= 55) tags.push('Budget Friendly');
  return tags.length ? tags : ['Young Professionals'];
};

// Growth score data per area: [infra(0-30), commercial(0-20), priceMomentum(0-20), connectivity(0-15), undervaluation(0-15)]
// + drivers[] + risks[]
interface GrowthInput {
  i: number; c: number; p: number; cn: number; u: number;
  d: string[]; r: string[];
}

const calcGrowthScore = (g: GrowthInput): number =>
  Math.min(100, Math.round(
    (g.i / 30) * 30 + (g.c / 20) * 20 + (g.p / 20) * 20 + (g.cn / 15) * 15 + (g.u / 15) * 15
  ));

// Growth data for each area (based on BMRCL, BBMP, real estate trends)
const growthMap: Record<string, GrowthInput> = {
  'mg-road':        { i: 10, c: 18, p: 8,  cn: 14, u: 3,  d: ['Metro interchange hub', 'Premium commercial corridor'], r: ['Saturated market', 'High entry prices'] },
  'brigade-road':   { i: 10, c: 17, p: 8,  cn: 14, u: 3,  d: ['Metro connectivity', 'Retail & F&B hub'], r: ['Traffic saturation', 'Limited new supply'] },
  'cubbon-park':    { i: 8,  c: 12, p: 6,  cn: 13, u: 2,  d: ['Government hub', 'Heritage premium'], r: ['No new development scope', 'High prices'] },
  'shivajinagar':   { i: 20, c: 10, p: 14, cn: 12, u: 12, d: ['Metro Phase 2 station', 'Redevelopment potential'], r: ['Congestion', 'Old infrastructure'] },
  'majestic':       { i: 25, c: 8,  p: 12, cn: 15, u: 14, d: ['Multi-modal transit hub', 'Metro interchange'], r: ['Overcrowding', 'Commercial-only zone'] },
  'chickpet':       { i: 18, c: 8,  p: 10, cn: 12, u: 13, d: ['Metro Green Line', 'Heritage redevelopment'], r: ['Congestion', 'Commercial dominance'] },
  'gandhinagar':    { i: 18, c: 8,  p: 10, cn: 12, u: 12, d: ['Metro proximity', 'Central location'], r: ['Dense old construction', 'Limited parking'] },
  'avenue-road':    { i: 15, c: 7,  p: 8,  cn: 11, u: 13, d: ['Metro access', 'Commercial heritage'], r: ['Very dense', 'No residential growth'] },
  'koramangala':    { i: 15, c: 18, p: 10, cn: 13, u: 4,  d: ['Startup hub', 'Premium F&B corridor'], r: ['Saturated', 'Traffic congestion'] },
  'jayanagar':      { i: 12, c: 12, p: 8,  cn: 13, u: 5,  d: ['Metro Phase 1', 'Established residential'], r: ['Mature market', 'Limited new plots'] },
  'jp-nagar':       { i: 14, c: 12, p: 10, cn: 12, u: 7,  d: ['Metro extension', 'Growing commercial'], r: ['Water supply issues', 'Traffic'] },
  'btm-layout':     { i: 12, c: 14, p: 12, cn: 11, u: 10, d: ['Metro access', 'Startup growth'], r: ['Dense construction', 'Parking issues'] },
  'hsr-layout':     { i: 18, c: 15, p: 14, cn: 12, u: 8,  d: ['HSR metro station', 'IT corridor proximity'], r: ['Bellandur lake pollution', 'Traffic'] },
  'banashankari':   { i: 14, c: 10, p: 8,  cn: 11, u: 8,  d: ['Metro Phase 2', 'Residential growth'], r: ['Water stress', 'Traffic saturation'] },
  'basavanagudi':   { i: 10, c: 10, p: 6,  cn: 12, u: 5,  d: ['Heritage value', 'Metro connectivity'], r: ['Old construction', 'No new supply'] },
  'girinagar':      { i: 12, c: 8,  p: 8,  cn: 10, u: 9,  d: ['Undervalued near south core', 'Civic upgrades'], r: ['Limited commercial', 'Narrow roads'] },
  'kumaraswamy-layout': { i: 15, c: 8, p: 12, cn: 10, u: 11, d: ['Metro Phase 2 station', 'Affordable zone'], r: ['Infrastructure gap', 'Water issues'] },
  'padmanabhanagar': { i: 13, c: 8, p: 10, cn: 10, u: 10, d: ['Metro extension planned', 'Residential growth'], r: ['Water table issues', 'Traffic'] },
  'wilson-garden':  { i: 14, c: 12, p: 12, cn: 12, u: 9,  d: ['Central location', 'Metro access'], r: ['Dense area', 'Limited parking'] },
  'lalbagh':        { i: 10, c: 10, p: 6,  cn: 12, u: 5,  d: ['Green premium', 'Heritage value'], r: ['No new development', 'High prices'] },
  'uttarahalli':    { i: 18, c: 10, p: 14, cn: 9,  u: 12, d: ['Metro Phase 2', 'Peripheral Ring Road'], r: ['Infrastructure gap', 'Water issues'] },
  'kanakapura-road': { i: 22, c: 12, p: 16, cn: 10, u: 11, d: ['Metro extension', 'NICE Road access', 'Affordable growth'], r: ['Distance from core', 'Infrastructure lag'] },
  'indiranagar':    { i: 10, c: 16, p: 8,  cn: 14, u: 3,  d: ['Premium lifestyle hub', 'Metro Purple Line'], r: ['Saturated market', 'Peak prices'] },
  'whitefield':     { i: 25, c: 18, p: 16, cn: 11, u: 10, d: ['Metro Purple Line extension', 'IT hub expansion', 'Upcoming infrastructure'], r: ['Traffic congestion', 'Water stress'] },
  'kr-puram':       { i: 22, c: 12, p: 14, cn: 10, u: 13, d: ['Metro interchange', 'Peripheral Ring Road', 'Affordable'], r: ['Industrial proximity', 'Old infrastructure'] },
  'marathahalli':   { i: 18, c: 16, p: 12, cn: 12, u: 9,  d: ['ORR IT corridor', 'Metro access coming'], r: ['Extreme traffic', 'Overbuilt'] },
  'cv-raman-nagar': { i: 16, c: 12, p: 12, cn: 11, u: 10, d: ['HAL area development', 'Metro proximity'], r: ['Defense restrictions', 'Old layout'] },
  'old-airport-road': { i: 14, c: 14, p: 10, cn: 13, u: 7, d: ['Central connectivity', 'Commercial growth'], r: ['Traffic', 'Noise'] },
  'domlur':         { i: 12, c: 16, p: 10, cn: 14, u: 5,  d: ['IT hub', 'Central location'], r: ['Saturated', 'High prices'] },
  'varthur':        { i: 22, c: 14, p: 16, cn: 9,  u: 13, d: ['IT corridor expansion', 'Affordable prices', 'Road widening'], r: ['Lake pollution', 'Infrastructure lag'] },
  'brookefield':    { i: 20, c: 16, p: 14, cn: 10, u: 10, d: ['Whitefield IT spillover', 'Metro extension'], r: ['Traffic', 'Water issues'] },
  'kadugodi':       { i: 22, c: 14, p: 14, cn: 10, u: 12, d: ['Metro terminal station', 'ITIR proximity'], r: ['Peripheral location', 'Basic infrastructure'] },
  'hoodi':          { i: 20, c: 14, p: 14, cn: 10, u: 11, d: ['Metro extension', 'IT corridor'], r: ['Traffic congestion', 'Dense construction'] },
  'harlur':         { i: 18, c: 14, p: 14, cn: 11, u: 9,  d: ['IT corridor proximity', 'Residential growth'], r: ['Traffic', 'Infrastructure lag'] },
  'sarjapur-road':  { i: 22, c: 16, p: 16, cn: 10, u: 11, d: ['IT hub expansion', 'Road widening', 'Affordable growth'], r: ['Traffic nightmare', 'Water stress'] },
  'bellandur':      { i: 18, c: 16, p: 14, cn: 11, u: 10, d: ['ORR IT corridor', 'Commercial growth'], r: ['Lake issues', 'Traffic saturation'] },
  'hebbal':         { i: 22, c: 16, p: 12, cn: 13, u: 8,  d: ['Flyover upgrade', 'Airport corridor', 'IT parks'], r: ['Traffic bottleneck', 'High prices'] },
  'yelahanka':      { i: 25, c: 14, p: 14, cn: 12, u: 10, d: ['Airport proximity', 'Aerospace hub', 'Metro Phase 3'], r: ['Distance from core', 'Air force restrictions'] },
  'sahakara-nagar': { i: 16, c: 12, p: 10, cn: 12, u: 8,  d: ['North Bengaluru growth', 'Good infrastructure'], r: ['Mature market', 'Limited scope'] },
  'rt-nagar':       { i: 18, c: 12, p: 12, cn: 11, u: 10, d: ['Metro Phase 2', 'Central north location'], r: ['Old infrastructure', 'Congestion'] },
  'hennur':         { i: 22, c: 14, p: 16, cn: 11, u: 12, d: ['Road widening', 'IT park development', 'Affordable'], r: ['Infrastructure lag', 'Water issues'] },
  'thanisandra':    { i: 24, c: 14, p: 16, cn: 11, u: 13, d: ['Metro Phase 2', 'Manyata Tech Park proximity', 'Road upgrades'], r: ['Infrastructure gap', 'Traffic'] },
  'nagavara':       { i: 20, c: 14, p: 14, cn: 12, u: 10, d: ['Manyata proximity', 'Lake development', 'Metro access'], r: ['Traffic', 'Dense construction'] },
  'jakkur':         { i: 18, c: 12, p: 12, cn: 11, u: 10, d: ['Aerospace corridor', 'Green zone premium'], r: ['Air force restrictions', 'Limited commercial'] },
  'devanahalli':    { i: 28, c: 16, p: 18, cn: 10, u: 14, d: ['Airport city', 'BIAL IT Investment Region', 'Peripheral Ring Road'], r: ['Far from core', 'Infrastructure still developing'] },
  'kogilu':         { i: 20, c: 10, p: 14, cn: 10, u: 12, d: ['Yelahanka corridor growth', 'Affordable'], r: ['Basic infrastructure', 'Limited connectivity'] },
  'malleshwaram':   { i: 10, c: 12, p: 6,  cn: 13, u: 3,  d: ['Heritage premium', 'Metro Green Line'], r: ['Saturated', 'No new development land'] },
  'rajajinagar':    { i: 14, c: 14, p: 10, cn: 12, u: 7,  d: ['Metro access', 'Orion Mall corridor'], r: ['Mature market', 'Traffic'] },
  'vijayanagar':    { i: 16, c: 12, p: 12, cn: 11, u: 9,  d: ['Metro extension', 'Residential demand'], r: ['Traffic', 'Water issues'] },
  'nagarbhavi':     { i: 18, c: 10, p: 14, cn: 10, u: 11, d: ['BU campus proximity', 'Metro Phase 3'], r: ['Infrastructure gap', 'Distance from IT hubs'] },
  'peenya':         { i: 20, c: 16, p: 14, cn: 11, u: 14, d: ['Industrial to IT conversion', 'Metro access', 'Affordable'], r: ['Industrial pollution', 'Poor aesthetics'] },
  'yeshwanthpur':   { i: 18, c: 14, p: 12, cn: 12, u: 10, d: ['Metro interchange', 'Commercial growth'], r: ['Industrial remnants', 'Traffic'] },
  'mahalakshmi-layout': { i: 14, c: 12, p: 10, cn: 12, u: 8, d: ['Central west location', 'Metro proximity'], r: ['Mature market', 'Limited scope'] },
  'basaveshwara-nagar': { i: 14, c: 12, p: 10, cn: 11, u: 8, d: ['West Bengaluru hub', 'Good connectivity'], r: ['Old infrastructure', 'Limited growth'] },
  'kengeri':        { i: 24, c: 12, p: 16, cn: 9,  u: 13, d: ['Metro terminal station', 'NICE Road', 'Peripheral Ring Road'], r: ['Far from core', 'Infrastructure developing'] },
  'rajarajeshwari-nagar': { i: 20, c: 12, p: 14, cn: 10, u: 12, d: ['Metro Phase 2', 'University area growth'], r: ['Infrastructure lag', 'Water stress'] },
  'electronic-city': { i: 22, c: 18, p: 14, cn: 11, u: 11, d: ['IT hub expansion', 'Elevated corridor', 'Phase 2 growth'], r: ['Distance from core', 'Monotone urban landscape'] },
  'bommanahalli':   { i: 18, c: 14, p: 14, cn: 11, u: 11, d: ['ORR proximity', 'Silk Board metro'], r: ['Traffic nightmare', 'Dense construction'] },
  'madiwala':       { i: 16, c: 14, p: 12, cn: 12, u: 9,  d: ['Metro access', 'Central south location'], r: ['Congestion', 'Dense area'] },
  'silk-board':     { i: 22, c: 14, p: 14, cn: 12, u: 13, d: ['Metro interchange (4 lines)', 'Elevated corridor'], r: ['Worst traffic in city', 'Construction disruption'] },
  'hosa-road':      { i: 22, c: 14, p: 16, cn: 10, u: 12, d: ['Electronic City proximity', 'Road upgrades', 'Affordable'], r: ['Infrastructure lag', 'Water issues'] },
  'begur':          { i: 18, c: 12, p: 14, cn: 10, u: 12, d: ['Affordable south corridor', 'Road widening'], r: ['Basic infrastructure', 'Water stress'] },
  'arekere':        { i: 16, c: 12, p: 12, cn: 11, u: 10, d: ['Bannerghatta Road corridor', 'Residential growth'], r: ['Traffic', 'Infrastructure'] },
  'ramamurthy-nagar': { i: 20, c: 12, p: 14, cn: 10, u: 12, d: ['Road widening', 'Affordable east corridor'], r: ['Infrastructure gap', 'Traffic'] },
  'banaswadi':      { i: 18, c: 12, p: 12, cn: 11, u: 10, d: ['Metro Purple Line', 'Central east location'], r: ['Old infrastructure', 'Dense'] },
  'kalyan-nagar':   { i: 16, c: 14, p: 12, cn: 12, u: 8,  d: ['IT park proximity', 'Good connectivity'], r: ['Maturing market', 'Traffic'] },
  'hbr-layout':     { i: 18, c: 12, p: 14, cn: 11, u: 10, d: ['Manyata Tech Park proximity', 'Metro extension'], r: ['Traffic congestion', 'Water issues'] },
  'kammanahalli':   { i: 16, c: 12, p: 12, cn: 11, u: 9,  d: ['Lifestyle hub growing', 'Metro extension'], r: ['Narrow roads', 'Dense'] },
  'mysore-road':    { i: 22, c: 12, p: 14, cn: 11, u: 13, d: ['Metro Purple Line', 'NICE Road', 'Affordable corridor'], r: ['Industrial pockets', 'Infrastructure gap'] },
  'nayandahalli':   { i: 20, c: 10, p: 14, cn: 10, u: 13, d: ['Metro station', 'Affordable west corridor'], r: ['Industrial area', 'Basic infrastructure'] },
  'chord-road':     { i: 16, c: 12, p: 12, cn: 11, u: 11, d: ['Central connectivity', 'Metro access'], r: ['Traffic', 'Old construction'] },
  'outer-ring-road-east': { i: 20, c: 18, p: 14, cn: 12, u: 10, d: ['IT corridor backbone', 'Metro overlay planned'], r: ['Extreme traffic', 'Overbuilt commercial'] },
  'outer-ring-road-north': { i: 20, c: 14, p: 14, cn: 12, u: 10, d: ['Tech park corridor', 'Infrastructure upgrades'], r: ['Traffic congestion', 'Dense commercial'] },
  'sadashivanagar': { i: 8,  c: 10, p: 4,  cn: 13, u: 2,  d: ['Ultra-premium heritage', 'Green canopy'], r: ['No growth scope', 'Peak prices'] },
  'vasanth-nagar':  { i: 10, c: 12, p: 6,  cn: 13, u: 3,  d: ['Central premium', 'Heritage value'], r: ['Saturated', 'Very high prices'] },
  'richmond-town':  { i: 10, c: 14, p: 8,  cn: 14, u: 3,  d: ['CBD proximity', 'Premium address'], r: ['Saturated', 'No new land'] },
  'langford-town':  { i: 10, c: 12, p: 6,  cn: 13, u: 3,  d: ['South central premium', 'Quiet enclave'], r: ['No new development', 'Peak prices'] },
  'frazer-town':    { i: 14, c: 12, p: 12, cn: 12, u: 9,  d: ['Heritage charm', 'F&B corridor growth'], r: ['Old construction', 'Limited parking'] },
  'ulsoor':         { i: 14, c: 14, p: 10, cn: 13, u: 7,  d: ['Lake development', 'Central east premium'], r: ['Dense area', 'High prices'] },
  'austin-town':    { i: 14, c: 12, p: 12, cn: 12, u: 10, d: ['Central location value', 'Metro access'], r: ['Old infrastructure', 'Dense construction'] },
  'anekal':         { i: 26, c: 14, p: 18, cn: 8,  u: 14, d: ['Peripheral Ring Road', 'Electronics Manufacturing Cluster', 'Very affordable'], r: ['Very far from core', 'Rural infrastructure'] },
  'chandapura':     { i: 24, c: 12, p: 16, cn: 8,  u: 14, d: ['Electronic City Phase 2 proximity', 'Affordable', 'Road upgrades'], r: ['Far from core', 'Basic infrastructure'] },
  'bannerghatta-road': { i: 18, c: 14, p: 12, cn: 11, u: 9, d: ['Metro extension', 'IT proximity', 'Green corridor'], r: ['Traffic', 'Single road dependency'] },
  'tumkur-road':    { i: 22, c: 14, p: 14, cn: 10, u: 13, d: ['Metro Phase 2', 'Industrial to IT conversion', 'Affordable'], r: ['Industrial proximity', 'Infrastructure gap'] },
  'jalahalli':      { i: 18, c: 12, p: 12, cn: 10, u: 11, d: ['Defense area development', 'Affordable north-west'], r: ['Defense restrictions', 'Limited commercial'] },
  'vidyaranyapura': { i: 18, c: 10, p: 12, cn: 10, u: 10, d: ['Green zone premium', 'IISc proximity'], r: ['Limited commercial', 'Infrastructure'] },
};

const defaultGrowth: GrowthInput = { i: 14, c: 10, p: 10, cn: 10, u: 10, d: ['General area development'], r: ['Infrastructure constraints'] };

const area = (id: string, name: string, lat: number, lng: number, q: number, p: number, s: number, h: number, f: number, e: number, fi: number, t: number): AreaMood => {
  const metrics = m(q, p, s, h, f, e, fi, t);
  const bestFor = generateBestFor(q, p, s, h, f, e, fi, t);
  const gInput = growthMap[id] || defaultGrowth;
  const growthScore = calcGrowthScore(gInput);
  const growthData: GrowthData = {
    infra: gInput.i,
    commercial: gInput.c,
    priceMomentum: gInput.p,
    connectivity: gInput.cn,
    undervaluation: gInput.u,
    drivers: gInput.d,
    risks: gInput.r,
  };
  return { id, area: name, lat, lng, overallMood: avg(metrics), metrics, bestFor, growthScore, growthData };
};

export const bengaluruAreaMoods: AreaMood[] = [
  // Central Bengaluru
  area('mg-road', 'MG Road', 12.9756, 77.6068, 85, 50, 70, 88, 95, 92, 75, 30),
  area('brigade-road', 'Brigade Road', 12.9726, 77.6066, 83, 40, 65, 85, 95, 95, 72, 28),
  area('cubbon-park', 'Cubbon Park Area', 12.9763, 77.5929, 88, 95, 75, 90, 98, 70, 80, 40),
  area('shivajinagar', 'Shivajinagar', 12.9857, 77.6048, 55, 25, 62, 72, 65, 60, 60, 25),
  area('majestic', 'Majestic / KSR', 12.9771, 77.5713, 42, 15, 45, 55, 50, 48, 55, 18),
  area('chickpet', 'Chickpet', 12.9686, 77.5751, 45, 12, 50, 55, 55, 45, 52, 20),
  area('gandhinagar', 'Gandhinagar', 12.9800, 77.5750, 48, 18, 52, 58, 55, 50, 55, 22),
  area('avenue-road', 'Avenue Road', 12.9730, 77.5780, 40, 10, 48, 50, 50, 42, 50, 15),

  // South Bengaluru
  area('koramangala', 'Koramangala', 12.9352, 77.6245, 82, 65, 78, 85, 90, 88, 60, 35),
  area('jayanagar', 'Jayanagar', 12.9250, 77.5938, 85, 82, 90, 88, 95, 72, 72, 50),
  area('jp-nagar', 'JP Nagar', 12.9063, 77.5857, 78, 72, 82, 80, 90, 65, 70, 48),
  area('btm-layout', 'BTM Layout', 12.9166, 77.6101, 65, 45, 60, 62, 80, 72, 50, 30),
  area('hsr-layout', 'HSR Layout', 12.9116, 77.6474, 78, 72, 70, 68, 88, 80, 55, 38),
  area('banashankari', 'Banashankari', 12.9255, 77.5468, 75, 70, 80, 78, 88, 58, 68, 42),
  area('basavanagudi', 'Basavanagudi', 12.9422, 77.5737, 82, 78, 85, 82, 95, 60, 75, 55),
  area('girinagar', 'Girinagar', 12.9380, 77.5520, 72, 62, 70, 68, 85, 50, 62, 48),
  area('kumaraswamy-layout', 'Kumaraswamy Layout', 12.9100, 77.5600, 60, 42, 58, 55, 72, 45, 52, 38),
  area('padmanabhanagar', 'Padmanabhanagar', 12.9130, 77.5560, 68, 55, 65, 62, 80, 48, 58, 42),
  area('wilson-garden', 'Wilson Garden', 12.9500, 77.5950, 72, 45, 68, 75, 85, 62, 60, 35),
  area('lalbagh', 'Lalbagh Area', 12.9507, 77.5848, 78, 92, 72, 78, 92, 58, 68, 38),
  area('uttarahalli', 'Uttarahalli', 12.8950, 77.5450, 58, 40, 55, 50, 70, 38, 48, 42),
  area('kanakapura-road', 'Kanakapura Road', 12.8800, 77.5650, 62, 55, 60, 55, 72, 42, 50, 35),

  // East Bengaluru
  area('indiranagar', 'Indiranagar', 12.9784, 77.6408, 88, 60, 80, 82, 92, 95, 65, 40),
  area('whitefield', 'Whitefield', 12.9698, 77.7500, 70, 55, 75, 65, 60, 58, 55, 28),
  area('kr-puram', 'KR Puram', 13.0098, 77.6960, 50, 35, 55, 48, 40, 38, 52, 20),
  area('marathahalli', 'Marathahalli', 12.9591, 77.7010, 62, 38, 60, 58, 55, 55, 48, 22),
  area('cv-raman-nagar', 'CV Raman Nagar', 12.9850, 77.6600, 65, 48, 62, 60, 68, 50, 55, 32),
  area('old-airport-road', 'Old Airport Road', 12.9650, 77.6500, 72, 40, 68, 72, 78, 65, 58, 25),
  area('domlur', 'Domlur', 12.9610, 77.6370, 78, 48, 70, 75, 85, 72, 60, 32),
  area('varthur', 'Varthur', 12.9400, 77.7400, 52, 40, 50, 42, 45, 35, 40, 30),
  area('brookefield', 'Brookefield', 12.9570, 77.7250, 68, 52, 70, 60, 62, 55, 48, 28),
  area('kadugodi', 'Kadugodi', 12.9900, 77.7600, 55, 42, 55, 48, 50, 40, 45, 32),
  area('hoodi', 'Hoodi', 12.9880, 77.7150, 60, 45, 58, 52, 55, 48, 48, 25),
  area('harlur', 'Harlur', 12.9100, 77.6600, 72, 55, 68, 62, 78, 60, 52, 35),
  area('sarjapur-road', 'Sarjapur Road', 12.9100, 77.6850, 65, 48, 62, 55, 65, 52, 48, 25),
  area('bellandur', 'Bellandur', 12.9260, 77.6780, 62, 35, 60, 55, 58, 55, 45, 22),

  // North Bengaluru
  area('hebbal', 'Hebbal', 13.0358, 77.5970, 72, 68, 65, 70, 75, 55, 62, 32),
  area('yelahanka', 'Yelahanka', 13.1007, 77.5963, 68, 80, 70, 62, 72, 50, 70, 58),
  area('sahakara-nagar', 'Sahakara Nagar', 13.0600, 77.5800, 75, 70, 75, 72, 82, 55, 68, 48),
  area('rt-nagar', 'RT Nagar', 13.0218, 77.5940, 62, 48, 60, 65, 72, 50, 58, 35),
  area('hennur', 'Hennur', 13.0450, 77.6350, 60, 50, 58, 55, 65, 45, 50, 38),
  area('thanisandra', 'Thanisandra', 13.0600, 77.6400, 58, 45, 55, 50, 62, 42, 48, 35),
  area('nagavara', 'Nagavara', 13.0440, 77.6150, 62, 55, 58, 58, 68, 48, 52, 32),
  area('jakkur', 'Jakkur', 13.0700, 77.6050, 70, 72, 65, 60, 75, 45, 62, 52),
  area('devanahalli', 'Devanahalli', 13.2468, 77.7107, 52, 65, 48, 40, 60, 30, 48, 62),
  area('kogilu', 'Kogilu', 13.0800, 77.5950, 58, 55, 52, 48, 68, 35, 50, 50),

  // West Bengaluru
  area('malleshwaram', 'Malleshwaram', 13.0035, 77.5648, 84, 78, 92, 90, 95, 68, 78, 55),
  area('rajajinagar', 'Rajajinagar', 12.9910, 77.5520, 72, 60, 75, 78, 70, 62, 68, 45),
  area('vijayanagar', 'Vijayanagar', 12.9700, 77.5350, 70, 58, 72, 70, 78, 55, 65, 48),
  area('nagarbhavi', 'Nagarbhavi', 12.9610, 77.5100, 62, 55, 60, 55, 70, 42, 55, 45),
  area('peenya', 'Peenya', 13.0290, 77.5210, 42, 22, 40, 45, 18, 28, 45, 30),
  area('yeshwanthpur', 'Yeshwanthpur', 13.0230, 77.5540, 58, 35, 55, 62, 55, 48, 55, 32),
  area('mahalakshmi-layout', 'Mahalakshmi Layout', 13.0100, 77.5480, 72, 55, 68, 70, 78, 55, 62, 42),
  area('basaveshwara-nagar', 'Basaveshwara Nagar', 12.9880, 77.5380, 70, 52, 68, 68, 75, 52, 60, 42),
  area('kengeri', 'Kengeri', 12.9070, 77.4850, 52, 55, 50, 45, 55, 32, 45, 45),
  area('rajarajeshwari-nagar', 'RR Nagar', 12.9200, 77.5100, 60, 52, 58, 55, 65, 42, 50, 40),

  // South-East Bengaluru
  area('electronic-city', 'Electronic City', 12.8399, 77.6770, 60, 40, 55, 50, 35, 45, 70, 30),
  area('bommanahalli', 'Bommanahalli', 12.8990, 77.6200, 55, 32, 52, 50, 60, 48, 48, 28),
  area('madiwala', 'Madiwala', 12.9210, 77.6150, 58, 38, 55, 58, 68, 52, 50, 30),
  area('silk-board', 'Silk Board Area', 12.9170, 77.6230, 48, 20, 45, 50, 60, 42, 45, 12),
  area('hosa-road', 'Hosa Road', 12.8700, 77.6900, 55, 42, 50, 45, 55, 38, 42, 35),
  area('begur', 'Begur', 12.8750, 77.6350, 52, 38, 48, 45, 58, 35, 42, 35),
  area('arekere', 'Arekere', 12.8950, 77.6050, 60, 42, 55, 52, 68, 45, 48, 32),

  // North-East / Outer
  area('ramamurthy-nagar', 'Ramamurthy Nagar', 13.0150, 77.6680, 55, 38, 52, 50, 55, 42, 48, 28),
  area('banaswadi', 'Banaswadi', 13.0100, 77.6450, 62, 45, 60, 60, 68, 52, 52, 32),
  area('kalyan-nagar', 'Kalyan Nagar', 13.0270, 77.6360, 72, 58, 68, 68, 78, 62, 58, 38),
  area('hbr-layout', 'HBR Layout', 13.0350, 77.6200, 65, 52, 62, 58, 72, 48, 55, 38),
  area('kammanahalli', 'Kammanahalli', 13.0150, 77.6400, 68, 48, 62, 62, 72, 58, 55, 35),

  // South-West
  area('mysore-road', 'Mysore Road', 12.9550, 77.5200, 52, 35, 50, 52, 50, 38, 48, 30),
  area('nayandahalli', 'Nayandahalli', 12.9550, 77.5100, 50, 32, 48, 48, 52, 35, 45, 32),
  area('chord-road', 'Chord Road', 12.9800, 77.5350, 55, 30, 52, 58, 58, 45, 50, 28),

  // Outer Ring Road Corridor
  area('outer-ring-road-east', 'ORR East (Marathahalli-Sarjapur)', 12.9400, 77.6950, 58, 32, 55, 52, 55, 48, 42, 18),
  area('outer-ring-road-north', 'ORR North (Hebbal-KR Puram)', 13.0200, 77.6500, 55, 35, 52, 55, 58, 42, 48, 20),

  // Premium / Cantonment
  area('sadashivanagar', 'Sadashivanagar', 13.0050, 77.5780, 90, 85, 88, 92, 98, 62, 82, 52),
  area('vasanth-nagar', 'Vasanth Nagar', 12.9880, 77.5920, 85, 72, 78, 85, 95, 68, 75, 42),
  area('richmond-town', 'Richmond Town', 12.9650, 77.5980, 82, 60, 72, 82, 95, 75, 70, 38),
  area('langford-town', 'Langford Town', 12.9500, 77.5900, 80, 58, 70, 78, 92, 65, 68, 42),
  area('frazer-town', 'Frazer Town', 12.9980, 77.6120, 72, 48, 65, 70, 78, 72, 58, 38),
  area('ulsoor', 'Ulsoor', 12.9820, 77.6200, 70, 55, 65, 72, 80, 65, 60, 35),
  area('austin-town', 'Austin Town', 12.9680, 77.6150, 65, 38, 58, 65, 75, 58, 52, 32),

  // Outer South
  area('anekal', 'Anekal', 12.7100, 77.6950, 42, 55, 38, 32, 40, 22, 35, 55),
  area('chandapura', 'Chandapura', 12.8000, 77.7050, 45, 48, 42, 35, 42, 25, 38, 50),
  area('bannerghatta-road', 'Bannerghatta Road', 12.8700, 77.5950, 62, 68, 58, 55, 65, 45, 50, 28),

  // Outer North-West
  area('tumkur-road', 'Tumkur Road', 13.0500, 77.5200, 48, 30, 45, 48, 35, 32, 45, 35),
  area('jalahalli', 'Jalahalli', 13.0450, 77.5350, 55, 48, 52, 55, 52, 38, 50, 42),
  area('vidyaranyapura', 'Vidyaranyapura', 13.0750, 77.5550, 62, 65, 60, 55, 70, 38, 55, 50),
];

export const getMoodEmoji = (score: number): string => {
  if (score >= 70) return '😊';
  if (score >= 50) return '😐';
  return '😞';
};

export const getMoodLabel = (score: number): string => {
  if (score >= 80) return 'Thriving';
  if (score >= 65) return 'Happy';
  if (score >= 50) return 'Okay';
  if (score >= 35) return 'Struggling';
  return 'Critical';
};

export const getMoodColor = (score: number): string => {
  if (score >= 80) return 'hsl(var(--success))';
  if (score >= 65) return 'hsl(var(--foreground))';
  if (score >= 50) return 'hsl(var(--warning))';
  if (score >= 35) return 'hsl(var(--primary))';
  return 'hsl(var(--danger))';
};

export const getMoodColorClass = (score: number): string => {
  if (score >= 80) return 'text-traffic-low';
  if (score >= 65) return 'text-primary';
  if (score >= 50) return 'text-traffic-moderate';
  if (score >= 35) return 'text-traffic-high';
  return 'text-traffic-severe';
};

export const getMoodBg = (score: number): string => {
  if (score >= 80) return 'bg-traffic-low';
  if (score >= 65) return 'bg-primary';
  if (score >= 50) return 'bg-traffic-moderate';
  if (score >= 35) return 'bg-traffic-high';
  return 'bg-traffic-severe';
};

export const getMoodGlow = (score: number): string => {
  if (score >= 80) return 'rgba(34, 197, 94, 0.24)';
  if (score >= 65) return 'rgba(255, 255, 255, 0.2)';
  if (score >= 50) return 'rgba(234, 179, 8, 0.24)';
  if (score >= 35) return 'rgba(255, 107, 0, 0.24)';
  return 'rgba(239, 68, 68, 0.24)';
};

