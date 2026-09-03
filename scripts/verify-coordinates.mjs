import fs from 'fs';
import path from 'path';

const DISTRICT_BBOXES = {
  Mandya: { minLat: 12.18, maxLat: 13.04, minLng: 76.32, maxLng: 77.34 },
  Hassan: { minLat: 12.51, maxLat: 13.55, minLng: 75.55, maxLng: 76.63 },
  Mysore: { minLat: 11.75, maxLat: 12.68, minLng: 75.90, maxLng: 77.10 },
  Shimoga: { minLat: 13.45, maxLat: 14.65, minLng: 74.62, maxLng: 76.08 },
  Bellary: { minLat: 14.50, maxLat: 15.85, minLng: 75.65, maxLng: 77.25 },
};

const fixturesPath = path.resolve('./src/lib/fixtures.ts');
const content = fs.readFileSync(fixturesPath, 'utf8');

// Check 1: Forbidden patterns check (MH-, PB-, MAHARASHTRA, PUNJAB, 2024-)
const forbiddenRegex = /\b(PARCEL-MH|PARCEL-PB|MH-[A-Za-z]|PB-[A-Za-z]|MAHARASHTRA|PUNJAB|2024-\d+)\b/i;
const forbiddenMatch = content.match(forbiddenRegex);

if (forbiddenMatch) {
  console.error(`❌ [FAIL] Forbidden state/parcel pattern found in fixtures.ts: "${forbiddenMatch[0]}"`);
  process.exit(1);
} else {
  console.log('✅ [PASS] Zero forbidden state/parcel patterns ("MH-", "PB-", "MAHARASHTRA", "PUNJAB", "2024-") found in fixtures.ts');
}

// Check 2: Verify all 5 Karnataka parcels coordinates against district bboxes
const parcelBlocks = content.split(/['"]([A-Z0-9-]+)['"]\s*:\s*\{/g);

let validParcels = 0;
for (let i = 1; i < parcelBlocks.length; i += 2) {
  const parcelId = parcelBlocks[i];
  const block = parcelBlocks[i + 1];

  if (!parcelId.startsWith('CEL-KA-') && !parcelId.startsWith('PARCEL-KA-')) {
    continue;
  }

  const districtMatch = block.match(/district:\s*['"]([^'"]+)['"]/);
  const latMatch = block.match(/lat:\s*([0-9.]+)/);
  const lngMatch = block.match(/lng:\s*([0-9.]+)/);

  if (!districtMatch || !latMatch || !lngMatch) {
    console.error(`❌ [FAIL] Missing district or coordinates for ${parcelId}`);
    process.exit(1);
  }

  const district = districtMatch[1];
  const lat = parseFloat(latMatch[1]);
  const lng = parseFloat(lngMatch[1]);

  const bbox = DISTRICT_BBOXES[district];
  if (!bbox) {
    console.error(`❌ [FAIL] Unknown district "${district}" for ${parcelId}`);
    process.exit(1);
  }

  const isLatValid = lat >= bbox.minLat && lat <= bbox.maxLat;
  const isLngValid = lng >= bbox.minLng && lng <= bbox.maxLng;

  if (isLatValid && isLngValid) {
    console.log(`✅ [PASS] ${parcelId} (${district}): [${lat}°N, ${lng}°E] strictly inside bbox [${bbox.minLat}-${bbox.maxLat}°N, ${bbox.minLng}-${bbox.maxLng}°E]`);
    validParcels++;
  } else {
    console.error(`❌ [FAIL] ${parcelId} (${district}): [${lat}°N, ${lng}°E] OUTSIDE district bbox!`);
    process.exit(1);
  }
}

if (validParcels === 5) {
  console.log(`\n🎉 [V1 VERIFIED PASS] All 5 Karnataka parcels strictly verified within their district geographic bboxes.`);
} else {
  console.error(`❌ [FAIL] Expected 5 Karnataka parcels, found ${validParcels}`);
  process.exit(1);
}
