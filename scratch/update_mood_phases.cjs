const fs = require('fs');

const moodDataFile = 'src/data/moodData.ts';
let content = fs.readFileSync(moodDataFile, 'utf8');

const newGrowthEntries = {
  'jp-nagar-1-3': { i: 15, c: 14, p: 12, cn: 13, u: 6, d: ['Established premium residential', 'Metro connectivity'], r: ['Limited new supply'] },
  'jp-nagar-4-6': { i: 14, c: 16, p: 10, cn: 12, u: 8, d: ['Commercial retail growth', 'High apartment density'], r: ['Traffic bottlenecks'] },
  'jp-nagar-7-8': { i: 18, c: 10, p: 14, cn: 11, u: 10, d: ['Developing residential enclave', 'Quiet zones'], r: ['Distance to main ORR'] },
  'banashankari-stg3': { i: 16, c: 12, p: 14, cn: 12, u: 8, d: ['Educational institutions nearby', 'Well-planned parks'], r: ['Water table issues'] },
  'ecity-toll': { i: 22, c: 14, p: 10, cn: 15, u: 11, d: ['Major transit entry point', 'Commercial visibility'], r: ['Severe peak traffic'] },
  'horamavu-agara': { i: 18, c: 10, p: 14, cn: 10, u: 12, d: ['Lake development', 'Affordable housing'], r: ['Infrastructure lag'] },
};

const newAreaEntries = [
  "area('jp-nagar-1-3', 'JP Nagar Phase 1-3', 12.9107, 77.5845, 82, 75, 85, 82, 90, 70, 72, 45),",
  "area('jp-nagar-4-6', 'JP Nagar Phase 4-6', 12.9012, 77.5901, 75, 65, 78, 75, 88, 72, 65, 38),",
  "area('jp-nagar-7-8', 'JP Nagar Phase 7-8', 12.8934, 77.5956, 70, 68, 72, 65, 80, 55, 60, 42),",
  "area('banashankari-stg3', 'Banashankari Stage 3', 12.9089, 77.5389, 78, 72, 80, 75, 85, 58, 68, 42),",
  "area('ecity-toll', 'Electronic City Toll', 12.8445, 77.6734, 58, 35, 52, 50, 40, 52, 60, 22),",
  "area('horamavu-agara', 'Horamavu Agara', 13.0178, 77.6656, 62, 55, 58, 52, 70, 48, 45, 32),"
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
console.log('Successfully updated moodData.ts with additional sub-phases.');
