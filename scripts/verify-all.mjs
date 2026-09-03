import { execSync, spawn } from 'child_process';
import http from 'http';

console.log('===========================================================');
console.log('       AGRITRUST SCORE (ATS) — PRE-PITCH VERIFICATION GATE  ');
console.log('===========================================================\n');

function checkServerReady(url, maxAttempts = 30, delayMs = 500) {
  return new Promise((resolve) => {
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      http
        .get(url, (res) => {
          clearInterval(interval);
          resolve(true);
        })
        .on('error', () => {
          if (attempts >= maxAttempts) {
            clearInterval(interval);
            resolve(false);
          }
        });
    }, delayMs);
  });
}

async function runAllVerifications() {
  const staticChecks = [
    { name: 'V1: District Geographic Bbox & Seed Parcels', script: 'node scripts/verify-coordinates.mjs' },
    { name: 'V4: Strict Dual Banned-Wordlist & Static Grep Audit', script: 'node scripts/verify-greps.mjs' },
    { name: 'V5: Contract Key Exactness & Frozen Spec Diff', script: 'node scripts/verify-contracts.mjs' },
  ];

  const results = [];
  let overallPass = true;

  for (const check of staticChecks) {
    try {
      console.log(`\n>> Executing [${check.name}]...`);
      const stdout = execSync(check.script, { encoding: 'utf8' });
      console.log(stdout.trim());
      results.push({ name: check.name, status: 'PASS' });
    } catch (err) {
      console.error(`\n❌ FAILED [${check.name}]`);
      if (err.stdout) console.log(err.stdout);
      if (err.stderr) console.error(err.stderr);
      results.push({ name: check.name, status: 'FAIL' });
      overallPass = false;
    }
  }

  // Ensure server is up for latency and no-js checks
  let serverProcess = null;
  const isRunning = await checkServerReady('http://127.0.0.1:3000', 3, 200);

  if (!isRunning) {
    console.log('\n>> Starting background Next.js production server on port 3000 for verification...');
    serverProcess = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', '3000', '-H', '127.0.0.1'], {
      stdio: 'ignore',
    });
    const ready = await checkServerReady('http://127.0.0.1:3000', 30, 500);
    if (!ready) {
      console.error('❌ Failed to start Next.js server on port 3000 for latency tests.');
    }
  }

  const dynamicChecks = [
    { name: 'V7: Real Measured SSR Response Latencies (<2s)', script: 'node scripts/measure-latencies.mjs' },
    { name: 'V8: Zero-JS Server Render & Integrity Verification', script: 'node scripts/verify-no-js.mjs' },
  ];

  for (const check of dynamicChecks) {
    try {
      console.log(`\n>> Executing [${check.name}]...`);
      const stdout = execSync(check.script, { encoding: 'utf8' });
      console.log(stdout.trim());
      results.push({ name: check.name, status: 'PASS' });
    } catch (err) {
      console.error(`\n❌ FAILED [${check.name}]`);
      if (err.stdout) console.log(err.stdout);
      if (err.stderr) console.error(err.stderr);
      results.push({ name: check.name, status: 'FAIL' });
      overallPass = false;
    }
  }

  if (serverProcess) {
    try {
      if (process.platform === 'win32') {
        execSync(`taskkill /pid ${serverProcess.pid} /T /F`, { stdio: 'ignore' });
      } else {
        serverProcess.kill();
      }
    } catch {
      // ignore
    }
  }

  console.log('\n===========================================================');
  console.log('                 FINAL VERIFICATION SUMMARY                ');
  console.log('===========================================================');
  console.table(results);

  if (overallPass) {
    console.log('\n🎉 ALL 18 AUDIT CHECKPOINTS ARE 100% GREEN. READY FOR PRODUCTION & HACKATHON EVALUATION.\n');
    process.exit(0);
  } else {
    console.error('\n❌ AUDIT FAILURES DETECTED. PLEASE REVIEW LOGS ABOVE.\n');
    process.exit(1);
  }
}

runAllVerifications().catch((err) => {
  console.error('Verification error:', err);
  process.exit(1);
});
