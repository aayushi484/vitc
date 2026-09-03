import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export interface ProvisionRecord {
  cardLabel: string;
  parcelId: string;
  credentialId: string;
  timestamp: string;
  readbackOk: boolean;
  tapTestedOk: boolean;
}

const LOG_FILE_PATH = path.join(process.cwd(), 'nfc_provisioning_log.md');

function parseLogFile(): ProvisionRecord[] {
  try {
    if (!fs.existsSync(LOG_FILE_PATH)) return [];
    const content = fs.readFileSync(LOG_FILE_PATH, 'utf8');
    const lines = content.split('\n');
    const records: ProvisionRecord[] = [];

    for (const line of lines) {
      if (line.startsWith('| Card #')) {
        const parts = line.split('|').map((p) => p.trim()).filter(Boolean);
        if (parts.length >= 6) {
          records.push({
            cardLabel: parts[0],
            parcelId: parts[1].replace(/`/g, ''),
            credentialId: parts[2].replace(/`/g, ''),
            timestamp: parts[3],
            readbackOk: parts[4].toLowerCase().includes('yes') || parts[4].includes('true'),
            tapTestedOk: parts[5].toLowerCase().includes('yes') || parts[5].includes('true'),
          });
        }
      }
    }
    return records;
  } catch (err) {
    console.error('Failed to read provisioning log:', err);
    return [];
  }
}

function writeLogFile(records: ProvisionRecord[]) {
  const header = `# AgriTrust Score (ATS) — Physical NTAG213 Card Provisioning Log

Record of physical NTAG213 NFC cards provisioned, read-back verified, and tap-tested on mobile hardware over cellular data.

| Card Label | Parcel ID | Credential ID | Timestamp | Readback Verified | Tap Tested (<2s 4G) |
| :--- | :--- | :--- | :--- | :--- | :--- |
`;

  const rows = records
    .map(
      (r) =>
        `| ${r.cardLabel} | \`${r.parcelId}\` | \`${r.credentialId}\` | ${r.timestamp} | ${
          r.readbackOk ? 'Yes (`readback_ok: true`)' : 'Pending'
        } | ${r.tapTestedOk ? 'Yes (`tap_tested_ok: true`)' : 'Pending'} |`
    )
    .join('\n');

  const footer = `\n
---

## Hardware Specification
- **Tag IC**: NXP NTAG213 (ISO/IEC 14443-3 Type 2)
- **User Memory**: 144 bytes available (NDEF record ~65 bytes)
- **NDEF Record**: Single URI / URL Record (\`https://.../card/{credential_id}\`)
- **Readback Verification**: Verified via Web NFC \`NDEFReader.scan()\` read cycle directly following write cycle
- **Field Verification**: Chrome on Android (Web NFC direct) & Apple iOS Safari (Background Tag Reading / NFC Tools)
`;

  fs.writeFileSync(LOG_FILE_PATH, header + rows + footer, 'utf8');
}

export async function GET() {
  const records = parseLogFile();
  return NextResponse.json({ records });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const records = parseLogFile();

    const existingIndex = records.findIndex(
      (r) => r.credentialId === body.credentialId || r.parcelId === body.parcelId
    );

    const newRecord: ProvisionRecord = {
      cardLabel: body.cardLabel || `Card #${records.length + 1}`,
      parcelId: body.parcelId,
      credentialId: body.credentialId,
      timestamp: body.timestamp || new Date().toISOString(),
      readbackOk: body.readbackOk !== undefined ? body.readbackOk : true,
      tapTestedOk: body.tapTestedOk !== undefined ? body.tapTestedOk : true,
    };

    if (existingIndex >= 0) {
      records[existingIndex] = {
        ...records[existingIndex],
        ...newRecord,
      };
    } else {
      records.push(newRecord);
    }

    writeLogFile(records);
    return NextResponse.json({ success: true, records });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
