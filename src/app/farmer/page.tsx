'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ScoreWithMeta, fetchScore, ConsentRevokedError, getLocalConsent } from '@/lib/api';
import { SEEDED_CARDS } from '@/lib/fixtures';
import { getClientSession, signOut, AtsSession } from '@/lib/supabase';
import { ScoreHero } from '@/components/ScoreHero';
import { AttributionList } from '@/components/AttributionList';
import { WeatherStrip } from '@/components/WeatherStrip';
import { CropLandSummary } from '@/components/CropLandSummary';
import { ConsentPanel } from '@/components/ConsentPanel';
import { MiniBeforeAfterChart } from '@/components/MiniBeforeAfterChart';
import { DemoBanner } from '@/components/DemoBanner';
import {
  ShieldCheck,
  ExternalLink,
  RefreshCw,
  User,
  AlertTriangle,
  ChevronDown,
  Layers,
  LogOut,
  Check,
  QrCode,
} from 'lucide-react';

export default function FarmerDashboard() {
  const router = useRouter();
  const [session, setSession] = useState<AtsSession | null>(null);
  const [selectedParcelId, setSelectedParcelId] = useState<string>('CEL-KA-MANDYA-001');
  const [scoreData, setScoreData] = useState<ScoreWithMeta | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isConsentRevoked, setIsConsentRevoked] = useState<boolean>(false);

  // Initialize session & enforce farmer parcel scoping
  useEffect(() => {
    const activeSession = getClientSession();
    if (activeSession) {
      setSession(activeSession);
      if (activeSession.user.role === 'farmer' && activeSession.user.parcel_id) {
        setSelectedParcelId(activeSession.user.parcel_id);
      }
    }
  }, []);

  // Find if a card credential was issued for this parcel
  const matchingCard = Object.values(SEEDED_CARDS).find(
    (c) => c.parcel_id === selectedParcelId
  );
  const cardUrl = matchingCard ? `/card/${matchingCard.credential_id}` : null;

  const loadData = async (parcelId: string) => {
    setLoading(true);
    setError(null);
    const hasConsent = getLocalConsent(parcelId);
    setIsConsentRevoked(!hasConsent);

    if (!hasConsent) {
      setLoading(false);
      return;
    }

    try {
      const data = await fetchScore(parcelId);
      setScoreData(data);
      setIsConsentRevoked(false);
    } catch (err: any) {
      if (err instanceof ConsentRevokedError || err?.name === 'ConsentRevokedError') {
        setIsConsentRevoked(true);
      } else {
        setError(err?.message || 'Could not load field trust score.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedParcelId);
  }, [selectedParcelId]);

  const handleConsentChange = (granted: boolean) => {
    if (!granted) {
      setIsConsentRevoked(true);
    } else {
      setIsConsentRevoked(false);
      loadData(selectedParcelId);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const isAdmin = session?.user?.role === 'admin';

  return (
    <main className="min-h-screen bg-paper pb-20 pt-4 px-3 sm:px-6 max-w-lg mx-auto">
      {/* Top Bar with Brand & Logout */}
      <header className="flex items-center justify-between py-2 px-1 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-ats bg-accent flex items-center justify-center text-white border-ink shadow-hard-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black text-ink tracking-tight leading-none font-heading">
              AgriTrust
            </h1>
            <p className="text-[10px] font-bold text-accent mt-0.5">
              Field Health & Trust Hub
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Admin Role: Allow parcel switching across Karnataka Belts */}
          {isAdmin ? (
            <div className="relative">
              <select
                value={selectedParcelId}
                onChange={(e) => setSelectedParcelId(e.target.value)}
                aria-label="Select Karnataka Farm Parcel"
                className="appearance-none bg-white text-xs font-bold text-ink py-1.5 pl-2.5 pr-7 rounded-ats border-ink shadow-hard-sm focus:outline-none cursor-pointer"
              >
                <option value="CEL-KA-MANDYA-001">Mandya (Paddy)</option>
                <option value="PARCEL-KA-HASSAN-002">Hassan (Cotton)</option>
                <option value="PARCEL-KA-MYSORE-003">Mysore (Sugarcane)</option>
                <option value="PARCEL-KA-SHIMOGA-004">Shimoga (Arecanut)</option>
                <option value="PARCEL-KA-BELLARY-005">Bellary (Cotton)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-ink absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          ) : (
            <div className="px-2.5 py-1 bg-white border-ink rounded-ats text-[11px] font-bold text-ink shadow-hard-sm">
              {selectedParcelId}
            </div>
          )}

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleSignOut}
            title="Sign out of AgriTrust"
            aria-label="Sign out"
            className="p-1.5 bg-white border-ink rounded-ats text-stone-600 hover:text-ink shadow-hard-sm active:translate-x-[1px] active:translate-y-[1px]"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Loud Demo Banner if backend offline (Amendment #3, O2) */}
      {scoreData?.isDemoFixture && <DemoBanner isDemo={true} />}

      {/* Farmer Greeting Profile Card */}
      <div className="card-hard p-4 bg-white mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-ats bg-paper border-ink text-accent flex items-center justify-center font-bold text-base">
            <User className="w-5 h-5 text-accent" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-accent tracking-wider block">
              Farmer Profile
            </span>
            <h2 className="text-base font-black text-ink leading-snug font-heading">
              {scoreData?.farmer_display_name || session?.user?.name || 'Basavegowda Patil'}
            </h2>
            <p className="text-xs text-stone-500">
              {scoreData?.district || session?.user?.district || 'Mandya'}, {scoreData?.state || 'Karnataka'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => loadData(selectedParcelId)}
          disabled={loading}
          aria-label="Refresh analysis data"
          className="p-2 text-stone-600 hover:text-ink rounded-ats border-ink bg-paper shadow-hard-sm transition active:translate-x-[1px] active:translate-y-[1px]"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-accent' : ''}`} />
        </button>
      </div>

      {/* Loading Skeleton */}
      {loading && !scoreData && (
        <div className="card-hard p-10 bg-white text-center my-4">
          <RefreshCw className="w-8 h-8 text-accent animate-spin mx-auto mb-3" />
          <p className="text-sm font-bold text-ink">Calibrating Satellite & Radar Data...</p>
          <p className="text-xs text-stone-500 mt-1">Applying soil moisture and radar index adjustments</p>
        </div>
      )}

      {/* Error Retry State */}
      {error && !loading && (
        <div className="card-hard p-6 bg-red-50 text-center mb-4">
          <AlertTriangle className="w-8 h-8 text-band-attention mx-auto mb-2" />
          <h3 className="text-sm font-bold text-red-900 mb-1">Failed to Load Field Score</h3>
          <p className="text-xs text-red-700 mb-4">{error}</p>
          <button
            type="button"
            onClick={() => loadData(selectedParcelId)}
            className="py-2 px-4 bg-white text-ink btn-hard text-xs"
          >
            Retry Verification
          </button>
        </div>
      )}

      {/* Revoked Consent State - Polite Status Card per O2 / O3 */}
      {isConsentRevoked && !loading && (
        <div className="card-hard p-6 bg-white mb-4 text-center">
          <div className="w-12 h-12 rounded-ats bg-amber-50 border-ink text-band-fair flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-ink mb-1">
            Sharing paused — your score is hidden until you resume
          </h3>
          <p className="text-xs text-stone-600 leading-relaxed max-w-xs mx-auto mb-5">
            You turned off verification consent for parcel {selectedParcelId}. Public card scans and partner verifications are temporarily paused.
          </p>
          <button
            type="button"
            onClick={() => handleConsentChange(true)}
            className="w-full py-3 px-4 bg-accent text-white btn-hard text-xs flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Resume Verification Consent</span>
          </button>
        </div>
      )}

      {/* Main Content when Active and Consent is Granted */}
      {!loading && !isConsentRevoked && scoreData && (
        <div className="space-y-4">
          
          {/* 1. Band Hero (Good / Fair / Needs Attention + Big Number + Uncertainty) */}
          <ScoreHero
            correctedIndex={scoreData.corrected_index}
            rawIndex={scoreData.raw_index}
            uncertaintyInterval={scoreData.uncertainty_interval}
            computedAt={scoreData.computed_at}
            parcelId={scoreData.parcel_id}
          />

          {/* 2. "Why this score" (Top 3 Plain-Language Observations) */}
          <AttributionList
            attribution={scoreData.attribution}
            integrityFlag={scoreData.integrity_flag}
            integrityFlagReason={scoreData.integrity_flag_reason}
            gpsConsistent={scoreData.gps_consistent}
          />

          {/* 3. Satellite Correction Visualizer (Optical vs ATS Ground-Calibrated) */}
          <MiniBeforeAfterChart
            rawIndex={scoreData.raw_index}
            correctedIndex={scoreData.corrected_index}
            uncertaintyInterval={scoreData.uncertainty_interval}
          />

          {/* 4. Weather Outlook (7-Day Strip + Plain Farmer Advisory) */}
          <WeatherStrip dailyForecast={scoreData.forecast.daily} />

          {/* 5. Crop & Land Summary */}
          <CropLandSummary crop={scoreData.crop} landRisk={scoreData.land_risk} />

          {/* 6. Card Status Widget (AgriTrust ID issued vs Not issued) */}
          <div className="card-hard p-4 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-ats bg-paper border-ink text-accent flex items-center justify-center">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-black text-ink block">
                    AgriTrust ID Card
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-accent font-bold mt-0.5">
                    {cardUrl ? (
                      <>
                        <span>AgriTrust ID issued</span>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </>
                    ) : (
                      <span className="text-stone-500 font-medium">Not issued</span>
                    )}
                  </div>
                </div>
              </div>

              {cardUrl ? (
                <Link
                  href={cardUrl}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 py-2 px-3.5 bg-accent text-white text-xs btn-hard"
                >
                  <span>Open Card</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <Link
                  href="/admin/issue-card"
                  className="inline-flex items-center gap-1.5 py-2 px-3.5 bg-white text-ink text-xs btn-hard"
                >
                  <span>Issue NFC</span>
                </Link>
              )}
            </div>
          </div>

          {/* 7. Consent Panel */}
          <ConsentPanel
            parcelId={scoreData.parcel_id}
            initialConsent={scoreData.consent_granted !== false}
            onConsentChange={handleConsentChange}
          />
        </div>
      )}

      {/* Bottom Navigation */}
      <footer className="mt-8 pt-4 border-t border-stone-200 text-center text-xs text-stone-500">
        <div className="flex items-center justify-center gap-4 font-bold text-accent mb-2">
          <Link href="/farmer" className="hover:underline text-ink">
            Farmer App
          </Link>
          <span>•</span>
          <Link href="/admin/issue-card" className="hover:underline">
            Issue NFC Card
          </Link>
          <span>•</span>
          <Link href={cardUrl || '/card/cred_ats_ka_mandya_8801'} className="hover:underline">
            Public Card
          </Link>
        </div>
        <p className="text-[11px] text-stone-400">
          AgriTrust Score (ATS) • Production Karnataka Belts
        </p>
      </footer>
    </main>
  );
}
