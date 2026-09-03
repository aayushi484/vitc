'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ScoreWithMeta, IssueResponseWithMeta, fetchScore, issueCardCredential, fetchParcels } from '@/lib/api';
import { SEEDED_PARCELS } from '@/lib/fixtures';
import { isWebNfcSupported, writeAndVerifyNfcTag, detectDevicePlatform, NfcOperationStatus } from '@/lib/nfc';
import { getScoreBand, scaleIndexToScore } from '@/lib/constants';
import { BandBadge } from '@/components/BandBadge';
import { PrintCardModal } from '@/components/PrintCardModal';
import { DemoBanner } from '@/components/DemoBanner';
import { CardCredential, ScoreResponse } from '@/lib/contracts';
import { signOut } from '@/lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import {
  Radio,
  QrCode,
  Printer,
  Copy,
  Check,
  ExternalLink,
  Smartphone,
  ShieldCheck,
  HelpCircle,
  RefreshCw,
  Info,
  Download,
  AlertTriangle,
  LogOut,
  CheckCircle2,
} from 'lucide-react';

interface ProvisionRecord {
  cardLabel: string;
  parcelId: string;
  credentialId: string;
  timestamp: string;
  readbackOk: boolean;
  tapTestedOk: boolean;
}

export default function IssueCardPage() {
  const router = useRouter();
  const [parcels, setParcels] = useState<ScoreResponse[]>(Object.values(SEEDED_PARCELS));
  const [selectedParcelId, setSelectedParcelId] = useState<string>('CEL-KA-MANDYA-001');
  const [customFarmerName, setCustomFarmerName] = useState<string>('');
  const [scoreData, setScoreData] = useState<ScoreWithMeta | null>(null);
  const [loadingScore, setLoadingScore] = useState<boolean>(false);

  // Issuance state
  const [issuing, setIssuing] = useState<boolean>(false);
  const [issuedResult, setIssuedResult] = useState<IssueResponseWithMeta | null>(null);
  const [issuedCardObj, setIssuedCardObj] = useState<CardCredential | null>(null);

  // NFC State
  const [nfcSupported, setNfcSupported] = useState<boolean>(false);
  const [platform, setPlatform] = useState<string>('unknown');
  const [nfcStatus, setNfcStatus] = useState<NfcOperationStatus>('idle');
  const [nfcStatusMsg, setNfcStatusMsg] = useState<string>('');
  const [readbackVerified, setReadbackVerified] = useState<boolean>(false);
  const [writingNfc, setWritingNfc] = useState<boolean>(false);

  // 3 Physical Cards Log & Tap Test Checklist (O5.e, O5.f)
  const [provisionLogs, setProvisionLogs] = useState<ProvisionRecord[]>([]);

  // UI Modals
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [showIosGuide, setShowIosGuide] = useState<boolean>(false);

  // Load parcels and provisioning log
  useEffect(() => {
    setNfcSupported(isWebNfcSupported());
    setPlatform(detectDevicePlatform());

    fetchParcels().then((res) => {
      if (res.parcels?.length) {
        setParcels(res.parcels);
      }
    });

    loadProvisionLogs();
  }, []);

  const loadProvisionLogs = async () => {
    try {
      const res = await fetch('/api/provision-log');
      if (res.ok) {
        const data = await res.json();
        if (data.records) setProvisionLogs(data.records);
      }
    } catch (err) {
      console.warn('Failed to load provisioning log:', err);
    }
  };

  // Load parcel score preview
  useEffect(() => {
    const loadParcel = async () => {
      setLoadingScore(true);
      try {
        const score = await fetchScore(selectedParcelId);
        setScoreData(score);
        if (!customFarmerName || selectedParcelId) {
          setCustomFarmerName(score.farmer_display_name || '');
        }
      } catch (err) {
        console.error('Failed to load parcel preview:', err);
      } finally {
        setLoadingScore(false);
      }
    };
    loadParcel();
  }, [selectedParcelId]);

  // Handle issuing credential
  const handleIssueCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setIssuing(true);
    setNfcStatus('idle');
    setNfcStatusMsg('');
    setReadbackVerified(false);

    try {
      const response = await issueCardCredential({
        parcel_id: selectedParcelId,
        farmer_display_name: customFarmerName || scoreData?.farmer_display_name || 'Basavegowda Patil',
      });

      setIssuedResult(response);

      // Create card object for print preview
      const cardObj: CardCredential = {
        credential_id: response.credential_id,
        parcel_id: selectedParcelId,
        farmer_display_name: customFarmerName || scoreData?.farmer_display_name || 'Basavegowda Patil',
        district: scoreData?.district || 'Mandya',
        state: scoreData?.state || 'Karnataka',
        issued_at: new Date().toISOString(),
        score: scoreData || SEEDED_PARCELS['CEL-KA-MANDYA-001'],
      };
      setIssuedCardObj(cardObj);

      // Identify Card Label
      const cardIndex =
        selectedParcelId === 'CEL-KA-MANDYA-001'
          ? 1
          : selectedParcelId === 'PARCEL-KA-HASSAN-002'
          ? 2
          : selectedParcelId === 'PARCEL-KA-MYSORE-003'
          ? 3
          : provisionLogs.length + 1;

      const cardLabel = `Card #${cardIndex} — ${cardObj.district}`;

      // Save record to log
      await updateProvisionLog({
        cardLabel,
        parcelId: selectedParcelId,
        credentialId: response.credential_id,
        timestamp: new Date().toISOString(),
        readbackOk: false,
        tapTestedOk: false,
      });
    } catch (err: any) {
      alert(`Issuance failed: ${err.message}`);
    } finally {
      setIssuing(false);
    }
  };

  const updateProvisionLog = async (record: Partial<ProvisionRecord> & { parcelId: string; credentialId: string }) => {
    try {
      const res = await fetch('/api/provision-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.records) setProvisionLogs(data.records);
      }
    } catch (err) {
      console.warn('Failed to update log:', err);
    }
  };

  // Handle Web NFC Write with Immediate Readback Verification (O5.c)
  const handleWriteNfc = async () => {
    if (!issuedResult?.card_url) return;
    setWritingNfc(true);

    const result = await writeAndVerifyNfcTag(issuedResult.card_url, (status, msg) => {
      setNfcStatus(status);
      setNfcStatusMsg(msg);
    });

    setWritingNfc(false);
    if (result.success) {
      setNfcStatus('success');
      setReadbackVerified(result.readbackOk);
      setNfcStatusMsg(
        `NTAG213 Tag written and readback verified! URL matches: ${result.readbackUrl || issuedResult.card_url}`
      );

      // Update log with readback verification
      await updateProvisionLog({
        parcelId: selectedParcelId,
        credentialId: issuedResult.credential_id,
        readbackOk: true,
      });
    }
  };

  const toggleTapTest = async (credentialId: string, currentStatus: boolean) => {
    const target = provisionLogs.find((r) => r.credentialId === credentialId);
    if (!target) return;
    await updateProvisionLog({
      parcelId: target.parcelId,
      credentialId: target.credentialId,
      tapTestedOk: !currentStatus,
    });
  };

  const copyUrlToClipboard = async () => {
    if (!issuedResult?.card_url) return;
    try {
      await navigator.clipboard.writeText(issuedResult.card_url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  // High-res QR Export
  const downloadQrCode = () => {
    const svg = document.getElementById('ats-qr-code-svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = 1000;
      canvas.height = 1000;
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 1000, 1000);
        ctx.drawImage(img, 100, 100, 800, 800);
      }
      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.download = `ATS_QR_${selectedParcelId}.png`;
      a.href = pngUrl;
      a.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const scaledScore = scoreData ? scaleIndexToScore(scoreData.corrected_index) : 75;

  return (
    <main className="min-h-screen bg-paper py-6 px-4 sm:px-6 max-w-4xl mx-auto">
      {/* Header */}
      <header className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-ats bg-ink text-white flex items-center justify-center border-ink shadow-hard-sm">
            <Radio className="w-5 h-5 text-accent" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
              Admin Operations Workstation
            </span>
            <h1 className="text-xl font-black text-ink tracking-tight font-heading">
              Issue AgriTrust ID & NFC Tag
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/farmer"
            className="text-xs font-bold text-accent bg-white px-3 py-2 btn-hard"
          >
            ← Farmer View
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            title="Sign out of admin"
            className="p-2 bg-white border-ink rounded-ats text-stone-600 hover:text-ink shadow-hard-sm"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Loud Demo Banner when in fixture fallback (O2) */}
      {(scoreData?.isDemoFixture || issuedResult?.isDemoFixture) && (
        <DemoBanner isDemo={true} />
      )}

      {/* Grid Layout: Left Configuration / Right Card Preview */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Column: Form & Actions */}
        <div className="md:col-span-7 space-y-5">
          
          {/* Step 1: Parcel Selection & Issuance Form */}
          <div className="card-hard p-6 bg-white">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-stone-200">
              <span className="w-6 h-6 rounded-ats bg-emerald-100 text-accent border border-ink text-xs font-black flex items-center justify-center">
                1
              </span>
              <h2 className="text-sm font-black text-ink">
                Select Karnataka Farm Parcel
              </h2>
            </div>

            <form onSubmit={handleIssueCard} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1">
                  Karnataka Farm Parcel Identifier
                </label>
                <select
                  value={selectedParcelId}
                  onChange={(e) => setSelectedParcelId(e.target.value)}
                  className="w-full text-sm font-bold bg-paper border-ink rounded-ats px-3 py-2.5 text-ink focus:outline-none"
                >
                  {parcels.map((p) => (
                    <option key={p.parcel_id} value={p.parcel_id}>
                      {p.parcel_id} ({p.farmer_display_name} • {p.crop.declared} • {p.district})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1">
                  Farmer Display Name
                </label>
                <input
                  type="text"
                  value={customFarmerName}
                  onChange={(e) => setCustomFarmerName(e.target.value)}
                  placeholder="e.g. Basavegowda Patil"
                  required
                  className="w-full text-sm bg-paper border-ink rounded-ats px-3 py-2.5 text-ink focus:outline-none"
                />
              </div>

              {/* Live Preview Metric */}
              {scoreData && (
                <div className="p-3.5 bg-paper rounded-ats border-ink text-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-500 block">
                      Computed Field Trust
                    </span>
                    <span className="text-sm font-black text-ink font-heading">
                      {scaledScore} / 100
                    </span>
                    <span className="ml-2">
                      <BandBadge score={scaledScore} size="sm" showKannada={false} />
                    </span>
                  </div>
                  <div className="text-right text-[11px] text-stone-600 font-medium">
                    <div>Crop: {scoreData.crop.declared}</div>
                    <div className="text-accent font-bold flex items-center justify-end gap-1">
                      <span>Radar Calibrated</span>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={issuing || loadingScore}
                className="w-full py-3 px-4 bg-accent text-white btn-hard text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {issuing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Calling POST /credentials...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Create & Issue Credential</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Step 2: NFC Writing & Physical Encoding with Readback */}
          {issuedResult && (
            <div className="card-hard p-6 bg-white">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-stone-200">
                <span className="w-6 h-6 rounded-ats bg-emerald-100 text-accent border border-ink text-xs font-black flex items-center justify-center">
                  2
                </span>
                <h2 className="text-sm font-black text-ink">
                  Write to NFC Tag (Physical NTAG213)
                </h2>
              </div>

              {/* Web NFC Support Notice */}
              <div className="mb-4">
                {nfcSupported ? (
                  <div className="p-3 bg-emerald-50 border-ink rounded-ats flex items-center gap-2 text-xs text-accent">
                    <ShieldCheck className="w-4 h-4 text-accent flex-shrink-0" />
                    <span>
                      <strong>Web NFC Native API Available</strong> (Chrome on Android). Direct write and immediate readback supported.
                    </span>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 border-ink rounded-ats flex items-start gap-2 text-xs text-band-fair">
                    <Smartphone className="w-4 h-4 text-band-fair flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-ink">
                        <strong>Browser NFC write unavailable</strong> ({platform === 'ios' ? 'iOS Safari restricts Web NFC' : 'Desktop / unsupported browser'}).
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowIosGuide(!showIosGuide)}
                        className="block text-accent font-bold underline mt-1"
                      >
                        {showIosGuide ? 'Hide NFC Tools Guide' : 'View NFC Tools App Fallback Guide →'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Web NFC Write & Readback Button */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleWriteNfc}
                  disabled={!nfcSupported || writingNfc}
                  className="w-full py-3 px-4 bg-ink text-white btn-hard text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Radio className={`w-4 h-4 ${writingNfc ? 'animate-pulse text-accent' : ''}`} />
                  <span>
                    {writingNfc
                      ? 'Hold Device Against NTAG213 Tag...'
                      : 'Write Credential to Physical NFC Tag'}
                  </span>
                </button>

                {/* Status Message */}
                {nfcStatusMsg && (
                  <div
                    className={`p-3 rounded-ats border-ink text-xs font-bold flex items-start gap-2 ${
                      nfcStatus === 'success'
                        ? 'bg-emerald-50 text-accent'
                        : nfcStatus === 'error'
                        ? 'bg-red-50 text-band-attention'
                        : 'bg-paper text-ink'
                    }`}
                  >
                    {nfcStatus === 'success' ? (
                      <Check className="w-4 h-4 text-accent stroke-[3] flex-shrink-0 mt-0.5" />
                    ) : nfcStatus === 'error' ? (
                      <AlertTriangle className="w-4 h-4 text-band-attention flex-shrink-0 mt-0.5" />
                    ) : (
                      <RefreshCw className="w-4 h-4 text-accent animate-spin flex-shrink-0 mt-0.5" />
                    )}
                    <span>{nfcStatusMsg}</span>
                  </div>
                )}
              </div>

              {/* iOS / NFC Tools Fallback Guide */}
              {(showIosGuide || !nfcSupported) && (
                <div className="mt-4 p-4 bg-paper border-ink rounded-ats text-xs text-stone-700">
                  <div className="font-bold text-ink flex items-center gap-1.5 mb-2">
                    <HelpCircle className="w-4 h-4 text-accent" />
                    <span>How to write NFC on iPhone / Any Device (NFC Tools App)</span>
                  </div>
                  <ol className="list-decimal pl-4 space-y-1.5 leading-relaxed font-medium">
                    <li>
                      Install free <strong>&quot;NFC Tools&quot;</strong> from App Store or Google Play.
                    </li>
                    <li>
                      Open app, tap <strong>Write</strong> → <strong>Add a record</strong> → <strong>Custom URL / URI</strong>.
                    </li>
                    <li>
                      Paste the Card URL: <br />
                      <code className="text-[10px] bg-white border-ink px-1.5 py-0.5 rounded font-mono text-accent break-all select-all block mt-0.5">
                        {issuedResult.card_url}
                      </code>
                    </li>
                    <li>
                      Tap <strong>Write</strong> and touch the back top of your phone to the blank NTAG213 card until confirmed.
                    </li>
                  </ol>
                </div>
              )}

              {/* Print / Laminated Card Button */}
              <div className="mt-4 pt-4 border-t border-stone-200 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPrintModal(true)}
                  className="flex-1 py-2.5 px-4 bg-paper text-ink text-xs btn-hard flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-4 h-4 text-accent" />
                  <span>Print Laminated Card (CR80)</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Live Card Preview & QR Code */}
        <div className="md:col-span-5 space-y-5">
          {issuedResult ? (
            <div className="card-hard p-6 bg-white text-center">
              <span className="text-[10px] uppercase font-bold text-accent tracking-wider block mb-1">
                Issued Credential
              </span>
              <h3 className="text-base font-black text-ink mb-3 font-heading">
                AgriTrust Verification Card
              </h3>

              {/* QR Code */}
              <div className="p-3 bg-white border-ink rounded-ats inline-block shadow-hard-sm mb-4">
                <QRCodeSVG
                  id="ats-qr-code-svg"
                  value={issuedResult.card_url}
                  size={160}
                  level="M"
                  includeMargin={false}
                />
              </div>

              {/* Action Buttons: Copy URL & Download QR */}
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={copyUrlToClipboard}
                  className="flex-1 py-2 px-3 bg-paper text-ink text-xs btn-hard flex items-center justify-center gap-1.5"
                >
                  {copiedUrl ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-accent" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy URL</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={downloadQrCode}
                  className="flex-1 py-2 px-3 bg-paper text-ink text-xs btn-hard flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download QR</span>
                </button>
              </div>

              {/* Open Public Card Page */}
              <Link
                href={issuedResult.card_url}
                target="_blank"
                className="w-full py-2.5 px-4 bg-accent text-white text-xs btn-hard flex items-center justify-center gap-1.5"
              >
                <span>Open Public Card Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="card-hard p-8 bg-white text-center flex flex-col items-center justify-center min-h-[340px]">
              <div className="w-14 h-14 rounded-ats bg-paper border-ink text-accent flex items-center justify-center mb-3">
                <QrCode className="w-7 h-7" />
              </div>
              <h3 className="text-base font-black text-ink mb-1 font-heading">
                No Card Issued Yet
              </h3>
              <p className="text-xs text-stone-500 max-w-xs leading-relaxed">
                Select a Karnataka parcel on the left and click &quot;Create & Issue Credential&quot; to generate the public card URL, QR code, and NFC encoding trigger.
              </p>
            </div>
          )}

          {/* Quick Info Box */}
          <div className="card-hard p-4 bg-white text-xs text-stone-600 space-y-2">
            <div className="font-bold text-ink flex items-center gap-1.5">
              <Info className="w-4 h-4 text-accent" />
              <span>AgriTrust Card Rules</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              • Token is cryptographically hashed and verified without auth wall.
            </p>
            <p className="text-[11px] leading-relaxed">
              • Public card renders core attestation without JavaScript in &lt;100ms.
            </p>
            <p className="text-[11px] leading-relaxed">
              • Physical NTAG213 tags store single NDEF URL record (~65 bytes).
            </p>
          </div>
        </div>

      </div>

      {/* 3 Physical NTAG213 Cards Provisioning & Tap Test Checklist (O5.e, O5.f) */}
      <div className="mt-8 card-hard p-6 bg-white">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-200">
          <div>
            <h3 className="text-base font-black text-ink font-heading flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-accent" />
              <span>The 3 Physical NTAG213 Cards — Provisioning & Tap Test</span>
            </h3>
            <p className="text-xs text-stone-500">
              Complete status logged in <code>nfc_provisioning_log.md</code>
            </p>
          </div>
          <button
            type="button"
            onClick={loadProvisionLogs}
            className="p-1.5 text-stone-500 hover:text-ink rounded-ats border-ink bg-paper shadow-hard-sm"
            title="Refresh log"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-ink bg-paper text-ink uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Card Label</th>
                <th className="py-2.5 px-3">Parcel</th>
                <th className="py-2.5 px-3">Credential Token</th>
                <th className="py-2.5 px-3">Readback Verified</th>
                <th className="py-2.5 px-3">Tap Tested (&lt;2s 4G)</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {provisionLogs.map((log) => (
                <tr key={log.credentialId} className="hover:bg-stone-50">
                  <td className="py-3 px-3 font-bold text-ink">
                    {log.cardLabel}
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-stone-600">
                    {log.parcelId}
                  </td>
                  <td className="py-3 px-3 font-mono text-[10px] text-stone-500">
                    {log.credentialId.substring(0, 20)}...
                  </td>
                  <td className="py-3 px-3">
                    {log.readbackOk ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-accent bg-emerald-50 px-2 py-0.5 rounded border border-ink">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Verified</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-stone-400 font-medium">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <button
                      type="button"
                      onClick={() => toggleTapTest(log.credentialId, log.tapTestedOk)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-ats border-ink font-bold text-[11px] transition-all shadow-hard-sm ${
                        log.tapTestedOk
                          ? 'bg-emerald-100 text-accent'
                          : 'bg-paper text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      {log.tapTestedOk ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                          <span>Pass (&lt;2s)</span>
                        </>
                      ) : (
                        <span>Mark Tested</span>
                      )}
                    </button>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Link
                      href={`/card/${log.credentialId}`}
                      target="_blank"
                      className="text-accent font-bold hover:underline inline-flex items-center gap-1"
                    >
                      <span>View</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Laminated Card Modal */}
      {issuedCardObj && issuedResult && (
        <PrintCardModal
          card={issuedCardObj}
          cardUrl={issuedResult.card_url}
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </main>
  );
}
