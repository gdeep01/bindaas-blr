const fs = require('fs');

const moodDataFile = 'src/data/moodData.ts';
let content = fs.readFileSync(moodDataFile, 'utf8');

const newGrowthEntries = {
  'lavelle-road': { i: 10, c: 18, p: 10, cn: 15, u: 2, d: ['Premium retail core', 'Heart of CBD'], r: ['Saturated market', 'Peak pricing'] },
  'cunningham-road': { i: 12, c: 16, p: 10, cn: 14, u: 4, d: ['Healthcare institutions', 'Central proximity'], r: ['Limited expansion scope'] },
  'benson-town': { i: 10, c: 10, p: 12, cn: 12, u: 6, d: ['Old Bangalore charm', 'Quiet residential'], r: ['Narrower roads', 'Old infra'] },
  'cox-town': { i: 12, c: 10, p: 10, cn: 11, u: 8, d: ['Traditional residential', 'Community vibe'], r: ['Traffic congestion'] },
  'jayanagar-4th-block': { i: 15, c: 18, p: 12, cn: 14, u: 3, d: ['Retail & F&B hub', 'Metro core'], r: ['Extremely dense', 'High entry prices'] },
  'sarakki': { i: 16, c: 12, p: 14, cn: 13, u: 9, d: ['JP Nagar proximity', 'Metro Green Line'], r: ['Traffic bottlenecks'] },
  'hulimavu': { i: 18, c: 12, p: 14, cn: 10, u: 11, d: ['Bannerghatta corridor', 'Lake proximity'], r: ['Encroachment issues', 'Traffic'] },
  'bilekahalli': { i: 16, c: 14, p: 12, cn: 11, u: 10, d: ['IIMB proximity', 'IT companies nearby'], r: ['High road congestion'] },
  'begur-road': { i: 18, c: 10, p: 14, cn: 9, u: 12, d: ['Affordable apartments', 'Residential expansion'], r: ['Infrastructure lag'] },
  'gottigere': { i: 16, c: 8, p: 12, cn: 8, u: 13, d: ['Bannerghatta extension', 'Affordable residential'], r: ['Far from core'] },
  'haralur-road': { i: 18, c: 14, p: 16, cn: 12, u: 9, d: ['HSR spillover', 'ORR connectivity'], r: ['Infrastructure stress'] },
  'choodasandra': { i: 16, c: 12, p: 14, cn: 11, u: 10, d: ['Developing residential', 'Quiet location'], r: ['Limited public transport'] },
  'electronic-city-ph2': { i: 20, c: 18, p: 14, conn: 11, u: 12, d: ['Tech park expansion', 'Metro connectivity'], r: ['Industrial noise'] },
  'jigani': { i: 15, c: 16, p: 10, cn: 8, u: 14, d: ['Industrial hub growth', 'Low entry price'], r: ['Pollution risks', 'Far from city'] },
  'attibele': { i: 14, c: 14, p: 10, cn: 7, u: 15, d: ['Logistics hub', 'Manufacturing belt'], r: ['Distance to city center'] },
  'madivala': { i: 14, c: 16, p: 12, cn: 14, u: 7, d: ['Transit interchange hub', 'Commercial retail'], r: ['Severe traffic congestion'] },
  'silk-board-junction': { i: 25, c: 12, p: 8, cn: 15, u: 6, d: ['Major metro interchange', 'Connectivity hub'], r: ['Critical traffic levels'] },
  'kodihalli': { i: 14, c: 16, p: 10, cn: 13, u: 6, d: ['HAL area proximity', 'Healthcare corridor'], r: ['Noisy environment'] },
  'murugeshpalya': { i: 14, c: 15, p: 10, cn: 12, u: 8, d: ['Old Airport proximity', 'Established IT'], r: ['Narrower lanes'] },
  'marathahalli-bridge': { i: 18, c: 16, p: 12, cn: 14, u: 7, d: ['ORR backbone', 'Retail dominance'], r: ['Congestion bottleneck'] },
  'whitefield-main-road': { i: 20, c: 18, p: 14, cn: 11, u: 9, d: ['IT corridor heart', 'Metro access'], r: ['Extreme peak hour traffic'] },
  'itpl': { i: 22, c: 20, p: 14, cn: 12, u: 8, d: ['Tech park benchmark', 'Metro extension'], r: ['Saturated commercial'] },
  'kundalahalli': { i: 18, c: 16, p: 14, cn: 12, u: 9, d: ['IT corridor access', 'Residential mix'], r: ['Road construction delays'] },
  'kaggadasapura': { i: 15, c: 10, p: 12, cn: 11, u: 10, d: ['Affordable residential', 'Defense proximity'], r: ['Railway crossing bottlenecks'] },
  'mahadevapura': { i: 22, c: 18, p: 14, cn: 12, u: 9, d: ['ORR expansion', 'Commercial growth'], r: ['Pollution', 'Extreme traffic'] },
  'hoskote': { i: 25, c: 12, p: 16, cn: 8, u: 14, d: ['Industrial corridor', 'Satellite town potential'], r: ['Still rural in parts'] },
  'hrbr-layout': { i: 16, c: 14, p: 15, cn: 12, u: 7, d: ['Food & beverage hub', 'Planned layout'], r: ['Price peaking'] },
  'horamavu': { i: 18, c: 12, p: 14, cn: 10, u: 11, d: ['Rapid residential growth', 'Outer East value'], r: ['Water & drainage issues'] },
  'manyata-tech-park': { i: 20, c: 18, p: 14, cn: 13, u: 8, d: ['North IT engine', 'Infrastructure upgrades'], r: ['Traffic saturation'] },
  'hennur-road': { i: 24, c: 14, p: 16, cn: 12, u: 11, d: ['Airport road growth', 'Widened highways'], r: ['Public transport gaps'] },
  'kothanur': { i: 18, c: 10, p: 16, cn: 11, u: 12, d: ['Villas & gated communities', 'Lush greenery'], r: ['Far from metro'] },
  'bagalur-road': { i: 26, c: 12, p: 18, cn: 10, u: 14, d: ['Future North core', 'Aerospace park proximity'], r: ['Infrastructure lag'] },
  'yeshwanthpur-circle': { i: 18, c: 16, p: 10, cn: 14, u: 7, d: ['Intermodal transit hub', 'Industrial redevelopment'], r: ['Crowding'] },
  'bel-circle': { i: 16, c: 14, p: 14, cn: 12, u: 9, d: ['Public sector institutions', 'Quiet residential'], r: ['Restricted zones'] },
  'magadi-road': { i: 20, c: 12, p: 14, cn: 11, u: 12, d: ['Industrial growth', 'West connectivity'], r: ['Developing infra'] },
  'rajarajeshwari-nagar': { i: 18, c: 12, p: 16, cn: 11, u: 10, d: ['Education institutions', 'Spiritual landmarks'], r: ['Distance from East IT'] },
  'beml-layout': { i: 15, c: 12, p: 15, cn: 12, u: 8, d: ['Quiet planned enclave', 'Residential premium'], r: ['Mature market'] },
  'nelamangala': { i: 22, c: 14, p: 12, cn: 8, u: 15, d: ['Logistics hub', 'Highway connectivity'], r: ['Far from city center'] },
};

const newAreaEntries = [
  "area('lavelle-road', 'Lavelle Road', 12.9716, 77.5946, 92, 70, 85, 90, 95, 92, 75, 35),",
  "area('cunningham-road', 'Cunningham Road', 12.9833, 77.5917, 88, 65, 80, 88, 92, 85, 72, 30),",
  "area('benson-town', 'Benson Town', 13.0012, 77.6089, 78, 75, 72, 70, 85, 65, 60, 45),",
  "area('cox-town', 'Cox Town', 13.0041, 77.6211, 75, 70, 70, 68, 80, 60, 55, 42),",
  "area('jayanagar-4th-block', 'Jayanagar 4th Block', 12.9343, 77.5812, 85, 80, 90, 88, 95, 85, 70, 25),",
  "area('sarakki', 'Sarakki', 12.9112, 77.5669, 72, 65, 75, 72, 82, 62, 60, 40),",
  "area('hulimavu', 'Hulimavu', 12.8837, 77.6089, 65, 55, 68, 60, 75, 58, 50, 32),",
  "area('bilekahalli', 'Bilekahalli', 12.8923, 77.6198, 68, 52, 70, 75, 78, 62, 52, 30),",
  "area('begur-road', 'Begur Road', 12.8756, 77.6187, 60, 45, 62, 58, 72, 50, 45, 35),",
  "area('gottigere', 'Gottigere', 12.8634, 77.6023, 58, 48, 60, 55, 70, 45, 42, 38),",
  "area('haralur-road', 'Haralur Road', 12.8956, 77.6645, 72, 50, 68, 62, 75, 65, 50, 32),",
  "area('choodasandra', 'Choodasandra', 12.8889, 77.6712, 65, 48, 60, 55, 70, 52, 45, 38),",
  "area('electronic-city-ph2', 'Electronic City Phase 2', 12.8289, 77.6812, 62, 38, 55, 52, 40, 50, 65, 30),",
  "area('jigani', 'Jigani', 12.7923, 77.6312, 45, 35, 40, 38, 25, 30, 40, 48),",
  "area('attibele', 'Attibele', 12.7756, 77.7634, 42, 32, 38, 35, 22, 28, 38, 52),",
  "area('madivala', 'Madivala', 12.9234, 77.6234, 55, 35, 58, 65, 60, 62, 55, 15),",
  "area('silk-board-junction', 'Silk Board Junction', 12.9172, 77.6227, 45, 18, 42, 50, 55, 40, 45, 5),",
  "area('kodihalli', 'Kodihalli', 12.9578, 77.6489, 75, 45, 72, 82, 80, 75, 60, 30),",
  "area('murugeshpalya', 'Murugeshpalya', 12.9634, 77.6556, 70, 42, 68, 75, 78, 70, 58, 28),",
  "area('marathahalli-bridge', 'Marathahalli Bridge', 12.9545, 77.7012, 58, 35, 55, 58, 52, 58, 45, 18),",
  "area('whitefield-main-road', 'Whitefield Main Road', 12.9712, 77.7401, 68, 48, 72, 70, 65, 68, 52, 22),",
  "area('itpl', 'ITPL', 12.9863, 77.727, 72, 52, 70, 72, 68, 75, 55, 25),",
  "area('kundalahalli', 'Kundalahalli', 12.9745, 77.7089, 65, 42, 65, 68, 62, 68, 50, 24),",
  "area('kaggadasapura', 'Kaggadasapura', 12.9901, 77.6823, 68, 55, 62, 60, 78, 55, 52, 38),",
  "area('mahadevapura', 'Mahadevapura', 12.9934, 77.7012, 62, 38, 60, 62, 55, 65, 50, 18),",
  "area('hoskote', 'Hoskote', 13.0712, 77.7989, 50, 42, 45, 40, 48, 35, 40, 55),",
  "area('hrbr-layout', 'HRBR Layout', 13.0145, 77.6489, 78, 72, 80, 75, 88, 78, 62, 40),",
  "area('horamavu', 'Horamavu', 13.0212, 77.6623, 65, 48, 62, 55, 75, 52, 48, 35),",
  "area('manyata-tech-park', 'Manyata Tech Park Area', 13.0478, 77.6212, 68, 45, 65, 68, 62, 72, 55, 20),",
  "area('hennur-road', 'Hennur Road', 13.0423, 77.6345, 70, 55, 68, 62, 78, 65, 52, 38),",
  "area('kothanur', 'Kothanur', 13.0634, 77.5812, 72, 62, 65, 58, 82, 58, 48, 45),",
  "area('bagalur-road', 'Bagalur Road', 13.1234, 77.6712, 55, 50, 52, 45, 65, 40, 42, 52),",
  "area('yeshwanthpur-circle', 'Yeshwanthpur Circle', 13.0212, 77.5367, 60, 40, 62, 75, 70, 62, 65, 22),",
  "area('bel-circle', 'BEL Circle', 13.0312, 77.5489, 72, 65, 75, 78, 85, 60, 68, 35),",
  "area('magadi-road', 'Magadi Road', 12.9712, 77.5156, 52, 45, 55, 52, 60, 42, 50, 30),",
  "area('rajarajeshwari-nagar', 'Rajarajeshwari Nagar', 12.9234, 77.4923, 78, 72, 82, 75, 88, 62, 65, 45),",
  "area('beml-layout', 'BEML Layout', 12.9389, 77.5034, 75, 70, 78, 72, 85, 60, 62, 42),",
  "area('nelamangala', 'Nelamangala', 13.0978, 77.3923, 48, 45, 42, 40, 52, 32, 45, 58),"
];

// Add to growthMap
let growthMapStr = "const growthMap: Record<string, GrowthInput> = {";
for (const [id, data] of Object.entries(newGrowthEntries)) {
  const entry = `  '${id}': ${JSON.stringify(data).replace(/"(\w+)":/g, '$1:')},`;
  if (!content.includes(`'${id}':`)) {
    content = content.replace(growthMapStr, growthMapStr + '\n' + entry);
  }
}

// Add to bengaluruAreaMoods
const areaMoodsStart = "export const bengaluruAreaMoods: AreaMood[] = [";
for (const area of newAreaEntries) {
  const match = area.match(/'([^']+)'/);
  const id = match ? match[1] : null;
  if (id && !content.includes(`'${id}'`)) {
    content = content.replace(areaMoodsStart, areaMoodsStart + '\n  ' + area);
  }
}

fs.writeFileSync(moodDataFile, content);
console.log('Successfully updated moodData.ts with new areas.');
