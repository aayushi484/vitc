import fs from 'fs';
import path from 'path';

function getFiles(dir, exts = ['.ts', '.tsx', '.css', '.html', '.js', '.mjs']) {
  let results = [];
  if (!fs.existsSync(dir)) return [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(filePath, exts));
    } else if (exts.includes(path.extname(file))) {
      results.push(filePath);
    }
  }
  return results;
}

console.log('--- STRICT STATIC AUDIT: WORDLISTS, EMOJIS, GRADIENTS & LBR RULES ---');

let overallErrors = 0;

// 1. Wordlist (a): Finance words banned everywhere in src/
const financeRegex = /\b(credit|lending|loan|bank|borrower|cibil)\b/i;
const allSrcFiles = getFiles('./src');

let financeViolations = [];
for (const file of allSrcFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    if (financeRegex.test(line)) {
      financeViolations.push({ file, lineNum: index + 1, line: line.trim() });
    }
  });
}

if (financeViolations.length === 0) {
  console.log('✅ [PASS] Wordlist (a) Finance words: 0 matches across all of src/');
} else {
  console.error(`❌ [FAIL] Found ${financeViolations.length} finance word violations:`, financeViolations);
  overallErrors += financeViolations.length;
}

// 2. Wordlist (b): Jargon words banned in /farmer, /card, and components/
const jargonRegex = /\b(sar|shap|vh_vv|vh\/vv|kcc|pin|cvv|emv)\b/i;
const farmerCardFiles = [
  ...getFiles('./src/app/farmer'),
  ...getFiles('./src/app/card'),
  ...getFiles('./src/components'),
];

let jargonViolations = [];
for (const file of farmerCardFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    const cleanLine = line.replace(/MapPin/g, ''); // ignore Lucide MapPin icon
    if (jargonRegex.test(cleanLine)) {
      jargonViolations.push({ file, lineNum: index + 1, line: line.trim() });
    }
  });
}

if (jargonViolations.length === 0) {
  console.log('✅ [PASS] Wordlist (b) Jargon: 0 matches in /farmer, /card, and components/');
} else {
  console.error(`❌ [FAIL] Found ${jargonViolations.length} jargon violations:`, jargonViolations);
  overallErrors += jargonViolations.length;
}

// 3. Zero Emojis across all of src/
const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/u;
let emojiViolations = [];
for (const file of allSrcFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    if (emojiRegex.test(line)) {
      emojiViolations.push({ file, lineNum: index + 1, line: line.trim() });
    }
  });
}

if (emojiViolations.length === 0) {
  console.log('✅ [PASS] Zero-Emoji Law: 0 emojis found across all of src/');
} else {
  console.error(`❌ [FAIL] Found ${emojiViolations.length} emoji violations:`, emojiViolations);
  overallErrors += emojiViolations.length;
}

// 4. Zero Gradients across all of src/
const gradientRegex = /gradient/i;
let gradientViolations = [];
for (const file of allSrcFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    if (gradientRegex.test(line)) {
      gradientViolations.push({ file, lineNum: index + 1, line: line.trim() });
    }
  });
}

if (gradientViolations.length === 0) {
  console.log('✅ [PASS] Zero-Gradient Law: 0 gradient references found across all of src/');
} else {
  console.error(`❌ [FAIL] Found ${gradientViolations.length} gradient violations:`, gradientViolations);
  overallErrors += gradientViolations.length;
}

// 5. Date literal regex \d{1,2} [A-Z][a-z]{2} 20\d{2} in src/components
const dateRegex = /\d{1,2} [A-Z][a-z]{2} 20\d{2}/;
const componentFiles = getFiles('./src/components', ['.tsx', '.ts']);
let dateViolations = [];
for (const file of componentFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    if (dateRegex.test(line)) {
      dateViolations.push({ file, lineNum: index + 1, line: line.trim() });
    }
  });
}

if (dateViolations.length === 0) {
  console.log('✅ [PASS] Date Literal Regex: 0 hardcoded date literals in src/components');
} else {
  console.error(`❌ [FAIL] Found ${dateViolations.length} hardcoded date literals:`, dateViolations);
  overallErrors += dateViolations.length;
}

// 6. Payment card words (chip|cvv|card-number) in src/components
const paymentRegex = /\b(chip|cvv|card-number)\b/i;
let paymentViolations = [];
for (const file of componentFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    if (paymentRegex.test(line)) {
      paymentViolations.push({ file, lineNum: index + 1, line: line.trim() });
    }
  });
}

if (paymentViolations.length === 0) {
  console.log('✅ [PASS] Zero Payment Styling: 0 payment terms in src/components');
} else {
  console.error(`❌ [FAIL] Found ${paymentViolations.length} payment word violations:`, paymentViolations);
  overallErrors += paymentViolations.length;
}

if (overallErrors > 0) {
  process.exit(1);
} else {
  console.log('--- ALL STATIC AND BANNED-WORD AUDITS PASSED ---\n');
}
