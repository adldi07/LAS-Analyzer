const fs = require('fs');
const path = require('path');
const lasParser = require('../src/services/lasParser');

const filePath = path.join(__dirname, '../files/Well_Data (las).las');
const lasContent = fs.readFileSync(filePath, 'utf-8');
const parsed = lasParser.parse(lasContent);

console.log('=== CURVES WITH SPECIAL CHARACTERS ===');
const specialCurves = parsed.curves.filter(c =>
  c.mnemonic.includes('(') ||
  c.mnemonic.includes('/') ||
  c.mnemonic.includes('_')
);

console.log(`Found ${specialCurves.length} curves with special characters:`);
specialCurves.forEach(c => {
  console.log(`- ${c.mnemonic} (${c.unit})`);
});

console.log('\n=== ALL CURVES ===');
console.log(`Total curves: ${parsed.curves.length}`);
parsed.curves.forEach(c => {
  console.log(`- ${c.mnemonic.padEnd(20)} .${c.unit.padEnd(10)} : ${c.description}`);
});

console.log('\n=== DATA CHECK ===');
console.log(`Total data points: ${parsed.data.length}`);
console.log('First data point keys:', Object.keys(parsed.data[0]).slice(0, 10));

// Check if special curve names are in data
if (parsed.data[0]['ROP(min/ft)'] !== undefined) {
  console.log('✅ ROP(min/ft) found in data:', parsed.data[0]['ROP(min/ft)']);
}
if (parsed.data[0]['ROP(ft/hr)'] !== undefined) {
  console.log('✅ ROP(ft/hr) found in data:', parsed.data[0]['ROP(ft/hr)']);
}