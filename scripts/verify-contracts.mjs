import fs from 'fs';

console.log('--- AUDIT V5: CONTRACT KEY EXACTNESS & SPEC DIFF ---');

const requiredFiles = [
  './src/lib/contracts.ts',
  './src/lib/constants.ts',
  './src/lib/fixtures.ts',
  './src/components/AttributionList.tsx',
];

let allHaveKey = true;
for (const file of requiredFiles) {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('7d_rainfall_sum')) {
    console.log(`✅ [PASS] "7d_rainfall_sum" present in ${file}`);
  } else {
    console.error(`❌ [FAIL] Missing "7d_rainfall_sum" in ${file}`);
    allHaveKey = false;
  }
}

// Check wrong key "rainfall_7d_sum_mm"
let hasWrongKey = false;
function searchWrongKey(dir) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = `${dir}/${file}`;
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      searchWrongKey(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('rainfall_7d_sum_mm')) {
        console.error(`❌ [FAIL] Found wrong key "rainfall_7d_sum_mm" in ${filePath}`);
        hasWrongKey = true;
      }
    }
  }
}
searchWrongKey('./src');

if (!hasWrongKey) {
  console.log('✅ [PASS] Zero occurrences of wrong key "rainfall_7d_sum_mm" anywhere in src/');
}

// Diff contracts.ts against frozen spec fields
const contractsContent = fs.readFileSync('./src/lib/contracts.ts', 'utf8');
const requiredFields = [
  'parcel_id',
  'raw_index',
  'corrected_index',
  'uncertainty_interval',
  'moisture_vwc',
  'vh_vv_ratio',
  'intersection_fraction',
  '7d_rainfall_sum',
  'integrity_flag',
  'integrity_flag_reason',
  'integrity_deviation_score',
  'gps_consistent',
  'computed_at',
  'forecast',
  'land_risk',
  'crop',
];

let allFieldsPresent = true;
for (const field of requiredFields) {
  if (contractsContent.includes(field)) {
    console.log(`✅ [PASS] Frozen spec field "${field}" matches contracts.ts`);
  } else {
    console.error(`❌ [FAIL] Missing spec field "${field}" in contracts.ts`);
    allFieldsPresent = false;
  }
}

if (allHaveKey && !hasWrongKey && allFieldsPresent) {
  console.log('--- CONTRACT AUDIT PASSED: ZERO DRIFT ---\n');
} else {
  process.exit(1);
}
