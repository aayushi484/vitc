import http from 'http';

const CARDS = [
  { id: 'cred_ats_ka_mandya_8801', district: 'Mandya', farmer: 'Basavegowda Patil' },
  { id: 'cred_ats_ka_hassan_8802', district: 'Hassan', farmer: 'Manjunatha Gowda' },
  { id: 'cred_ats_ka_mysore_8803', district: 'Mysore', farmer: 'Shivanna Swamy' },
  { id: 'cred_ats_ka_shimoga_8804', district: 'Shimoga', farmer: 'Renukamma Hegde' },
  { id: 'cred_ats_ka_bellary_8805', district: 'Bellary', farmer: 'Veerabhadrappa Ballari' },
];

function fetchTiming(url) {
  return new Promise((resolve, reject) => {
    const start = process.hrtime.bigint();
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        const end = process.hrtime.bigint();
        const durationMs = Number(end - start) / 1_000_000;
        resolve({ statusCode: res.statusCode, durationMs, length: data.length });
      });
    });
    req.on('error', reject);
  });
}

async function run() {
  console.log('--- AUDIT V7: SSR CARD RESPONSE LATENCY MEASUREMENT ---\n');
  console.log('Target benchmark: < 2000 ms on 4G (< 2.0s)');

  // Warmup
  await fetchTiming('http://127.0.0.1:3000/card/cred_ats_ka_mandya_8801');

  const results = [];

  for (const card of CARDS) {
    const url = `http://127.0.0.1:3000/card/${card.id}`;
    const times = [];

    for (let i = 0; i < 3; i++) {
      const res = await fetchTiming(url);
      times.push(res.durationMs);
    }

    const avgMs = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    const minMs = Math.round(Math.min(...times));
    const maxMs = Math.round(Math.max(...times));

    results.push({
      id: card.id,
      district: card.district,
      farmer: card.farmer,
      avgMs,
      minMs,
      maxMs,
      passed: avgMs < 2000,
    });

    console.log(`Card: ${card.id} (${card.district}) -> Avg: ${avgMs}ms [Min: ${minMs}ms, Max: ${maxMs}ms] | Status: ${avgMs < 2000 ? '✅ PASS' : '❌ FAIL'}`);
  }

  console.log('\n--- LATENCY MEASUREMENT COMPLETE ---\n');
}

run().catch(console.error);
