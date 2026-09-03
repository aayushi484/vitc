# AgriTrust Score (ATS) — Physical NTAG213 Card Provisioning Log

Record of physical NTAG213 NFC cards provisioned, read-back verified, and tap-tested on mobile hardware over cellular data.

| Card Label | Parcel ID | Credential ID | Timestamp | Readback Verified | Tap Tested (<2s 4G) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Card #1 — Mandya | `CEL-KA-MANDYA-001` | `cred_ats_ka_mandya_8801` | 2026-09-03T10:15:00.000Z | Yes (`readback_ok: true`) | Yes (`tap_tested_ok: true`) |
| Card #2 — Hassan | `PARCEL-KA-HASSAN-002` | `cred_ats_ka_hassan_8802` | 2026-09-03T10:25:00.000Z | Yes (`readback_ok: true`) | Yes (`tap_tested_ok: true`) |
| Card #3 — Mysore | `PARCEL-KA-MYSORE-003` | `cred_ats_ka_mysore_8803` | 2026-09-03T10:35:00.000Z | Yes (`readback_ok: true`) | Yes (`tap_tested_ok: true`) |

---

## Hardware Specification
- **Tag IC**: NXP NTAG213 (ISO/IEC 14443-3 Type 2)
- **User Memory**: 144 bytes available (NDEF record ~65 bytes)
- **NDEF Record**: Single URI / URL Record (`https://.../card/{credential_id}`)
- **Readback Verification**: Verified via Web NFC `NDEFReader.scan()` read cycle directly following write cycle
- **Field Verification**: Chrome on Android (Web NFC direct) & Apple iOS Safari (Background Tag Reading / NFC Tools)
