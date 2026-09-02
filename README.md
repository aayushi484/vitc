# AgriTrust Score (ATS) — Team Error404

AgriTrust Score (ATS) is a real-data frontend system for the Team Error404 hackathon. ATS corrects satellite optical vegetation-index inaccuracies on smallholder farms by combining radar, volumetric soil moisture (VWC), 7-day weather history, and parcel boundaries.

---

## 🧭 Mock-Judge Happy-Path Evaluation Script (U2)

Follow these exact 6 steps to evaluate the end-to-end system on desktop or mobile:

### Step 1: Hackathon Landing & Seed Selection
1. Open `http://localhost:3000/` (or production host).
2. **Expected on screen**:
   - Header: *"AgriTrust Score (ATS) — Karnataka Farming Belts (Mandya / Hassan)"*.
   - 5 Seeded Karnataka Cards: `Basavegowda Patil (Mandya • 82)`, `Manjunatha Gowda (Hassan • 64)`, `Shivanna Swamy (Mysore • 76)`, `Renukamma Hegde (Shimoga • 36 • Under Review)`, `Veerabhadrappa Ballari (Bellary • 52)`.
3. Tap **"Open Farmer Dashboard"** (`/farmer`).

---

### Step 2: Farmer Mobile Experience (Language Law R1)
1. On `/farmer`, view the top hero for **`CEL-KA-MANDYA-001`**.
2. **Expected on screen**:
   - Big Green Color Band: **`GOOD CONDITION`** (`ಉತ್ತಮ ಸ್ಥಿತಿ`).
   - Big Score Number: **`82 / 100`** with uncertainty note: *"Expected range: 78 – 86 points"*.
   - Section **"Why this score"**:
     - *"Adequate soil moisture — Soil moisture reading agrees with satellite radar"*
     - *"Dense crop canopy — Radar reflection confirms healthy plant volume"*
     - *"Beneficial recent rain — 34 mm rain received in the past 7 days"*
   - **Satellite Accuracy Correction Chart**: Raw optical satellite score (`48`) vs Ground-calibrated ATS index (`82`) showing `+34 pts ATS error correction`.
   - **7-Day Weather Outlook**: Rain in mm, temperatures, and 1-line advisory (*"Heavy rain likely Friday (22 mm) — pause irrigation and avoid spraying or soil probing then"*).
   - **Crop & Land Summary**: *"Paddy Rice (Food grain crop)"* & *"Canal irrigated, stable soil slope"*.

---

### Step 3: Real Consent Revocation Test (R3, V3, V12)
1. Scroll down to **"Data Sharing & Verification Consent"** on `/farmer`.
2. Tap the **Green Toggle** switch to pause sharing.
3. In the confirmation modal (*"Pause Field Verification?"*), tap **"Yes, Pause Sharing"**.
4. **Expected on screen**:
   - Immediate banner: **`Field Trust Score Paused`** (*"You turned off verification consent for parcel CEL-KA-MANDYA-001. Your score is currently not shared with any card scans."*).
   - Card status widget switches to inactive state.
5. Tap **"Resume Verification Consent"** to restore live verification.

---

### Step 4: Public Verification Card Scan / Tap (R2, R5, V8)
1. Open `/card/cred_ats_ka_mandya_8801` (or scan the QR code from phone).
2. **Expected on screen**:
   - Loads in **< 100 ms** via SSR, zero JavaScript required for core text.
   - Attestation Header: *"AgriTrust ID — Smallholder Verification Certificate"*.
   - Green Verification Seal: *"Basavegowda Patil — Mandya, Karnataka — Score: 82/100"*.
   - Integrity Badge: *"Satellite & Radar Integrity Verified — GPS: MATCH ✓"*.
   - Mini Before/After Chart with confidence interval.
   - Footer: *"Issued under AgriTrust ID"*.
3. *(Optional Under-Review Test)*: Open `/card/cred_ats_ka_shimoga_8804` and verify the integrity banner displays: **`Reading under review`** in amber/rose text.

---

### Step 5: Issue Card & Web NFC Encoding (R6, V13)
1. Open `/admin/issue-card`.
2. Select **`PARCEL-KA-HASSAN-002`** from the Karnataka dropdown.
3. Enter or edit farmer name: `Manjunatha Gowda`.
4. Click **"Create & Issue Credential"** (calls backend `POST /credentials`).
5. **Expected on screen**:
   - Live Card URL generated: `http://localhost:3000/card/cred_ats_parcel_ka_hassan_002_...`.
   - Client-side rendered QR code.
   - **Web NFC Action**: Tap **"Write Credential to Physical NFC Tag"** on Chrome Android to encode the NDEF URL record, or view the inline **"NFC Tools App Fallback Guide"** on iPhone.

---

### Step 6: Print Laminated Identity Card (CR80) (V14)
1. On `/admin/issue-card`, click **"Print Laminated Card (CR80)"**.
2. **Expected on screen**:
   - Dual-sided CR80 (3.375" × 2.125") card preview.
   - Front Face: Farmer Name, Mandya/Karnataka, Plot ID, Trust Score, Band Seal.
   - Back Face: High-Res QR code, Direct Certificate URL, exact **`Issued At`** timestamp, and **`District`** (`Mandya, Karnataka`).
   - Clean non-bank aesthetic (zero payment card / CVV / chip imagery).

---

## ⚡ Pre-Pitch Verification Gate

Run the automated verification suite:

```bash
npm run verify
```

This verifies:
1. `V1`: All 5 Karnataka parcels fall strictly within district geographic bounding boxes.
2. `V4`: Zero finance words across entire `src/` and zero algorithmic jargon in farmer/card views.
3. `V5`: Exact contract key (`7d_rainfall_sum`) and zero contract drift.
4. `V7`: SSR response latencies empirically measured below 100 ms.
5. `V8`: Zero-JS SSR markup and integrity badge rendering.
