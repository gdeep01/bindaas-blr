const fs = require('fs');

const dataFile = 'src/data/bengaluruPropertyPrices.ts';
const trendsFile = 'trends.txt';

// Read new trends
const trendLines = fs.readFileSync(trendsFile, 'utf8').split('\n').filter(Boolean);
const newTrends = {};
for (const line of trendLines) {
  const [name, valStr] = line.split(':');
  if (name && valStr) {
    const val = parseFloat(valStr.trim());
    let trend = 'stable';
    if (val > 0) trend = 'rising';
    else if (val < 0) trend = 'falling';
    
    newTrends[name.trim()] = { trend, trendPercent: Math.abs(val) };
  }
}

// Read the TS file
let tsContent = fs.readFileSync(dataFile, 'utf8');

// Parse out existing AREA_TRENDS to keep anything not in the new list
const regex = /const AREA_TRENDS: Record<string, \{ trend: PriceTrend; trendPercent: number \}> = \{([\s\S]*?)\};/;
const match = tsContent.match(regex);
if (!match) {
  console.error("Could not find AREA_TRENDS object.");
  process.exit(1);
}

const existingStr = match[1];
const existingTrends = {};
const lineRegex = /'([^']+)':\s*\{\s*trend:\s*'([^']+)',\s*trendPercent:\s*([\d.]+)\s*\}/g;
let m;
while ((m = lineRegex.exec(existingStr)) !== null) {
  existingTrends[m[1]] = { trend: m[2], trendPercent: parseFloat(m[3]) };
}

// Merge
const finalTrends = { ...existingTrends, ...newTrends };

// Format new AREA_TRENDS
let replacementLines = [];
for (const [name, data] of Object.entries(finalTrends)) {
  const nameStr = `'${name.replace(/'/g, "\\'")}'`.padEnd(24);
  replacementLines.push(`  ${nameStr}: { trend: '${data.trend.padEnd(7)}', trendPercent: ${data.trendPercent} },`);
}

const replacement = `const AREA_TRENDS: Record<string, { trend: PriceTrend; trendPercent: number }> = {\n${replacementLines.join('\n')}\n};`;

const newTsContent = tsContent.replace(regex, replacement);
fs.writeFileSync(dataFile, newTsContent);
console.log('Successfully updated AREA_TRENDS.');
