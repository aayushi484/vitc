import http from 'http';

function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function verifyNoJs() {
  console.log('--- AUDIT V8: NO-JS SSR CONTENT AUDIT ---');

  const url = 'http://127.0.0.1:3000/card/cred_ats_ka_mandya_8801';
  const html = await fetchHtml(url);

  const checks = [
    { name: 'Farmer Name (Basavegowda Patil)', pattern: /Basavegowda Patil/ },
    { name: 'Band Badge (Good Condition)', pattern: /Good Condition/ },
    { name: 'Score (82)', pattern: />82</ },
    { name: 'Integrity Badge (Satellite & Radar Integrity Verified)', pattern: /Satellite &amp; Radar Integrity Verified|Satellite & Radar Integrity Verified/ },
    { name: 'Attestation Footer (Issued under AgriTrust ID)', pattern: /Issued under AgriTrust ID/ },
    { name: 'District (Mandya, Karnataka)', pattern: /Mandya,\s*Karnataka/ },
    { name: 'Mini Before/After Chart SVG Markup', pattern: /Satellite Error Correction/ },
  ];

  let passed = true;
  for (const check of checks) {
    if (check.pattern.test(html)) {
      console.log(`✅ [PASS] Found in SSR HTML without JS: "${check.name}"`);
    } else {
      console.error(`❌ [FAIL] Missing in SSR HTML: "${check.name}"`);
      passed = false;
    }
  }

  // Also check Shimoga under review badge
  const shimogaHtml = await fetchHtml('http://127.0.0.1:3000/card/cred_ats_ka_shimoga_8804');
  if (/Reading under review/.test(shimogaHtml)) {
    console.log(`✅ [PASS] Found in Shimoga SSR HTML without JS: "Reading under review" (integrity_flag=true)`);
  } else {
    console.error(`❌ [FAIL] Missing in Shimoga SSR HTML: "Reading under review"`);
    passed = false;
  }

  if (passed) {
    console.log('--- NO-JS SSR AUDIT PASSED ---\n');
  } else {
    process.exit(1);
  }
}

verifyNoJs().catch(console.error);
