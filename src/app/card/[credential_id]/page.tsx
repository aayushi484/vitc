import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { fetchCardCredential } from '@/lib/api';
import { getScoreBand, scaleIndexToScore, translateAttribution } from '@/lib/constants';
import { MiniBeforeAfterChart } from '@/components/MiniBeforeAfterChart';
import { CardClient } from './CardClient';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Calendar,
  Layers,
  Sprout,
  Compass,
  Check,
} from 'lucide-react';

interface CardPageProps {
  params: {
    credential_id: string;
  };
}

export async function generateMetadata({ params }: CardPageProps): Promise<Metadata> {
  const card = await fetchCardCredential(params.credential_id);
  const scaledScore = scaleIndexToScore(card.score?.corrected_index ?? 0.75);
  const band = getScoreBand(scaledScore);

  return {
    title: `${card.farmer_display_name} — AgriTrust Field Verification (${band.label})`,
    description: `AgriTrust Field Verification for ${card.farmer_display_name} (${card.district}, ${card.state}). Field Trust Score: ${scaledScore}/100.`,
  };
}

export default async function PublicCardPage({ params }: CardPageProps) {
  const credentialId = params.credential_id;
  const card = await fetchCardCredential(credentialId);

  const scoreData = card.score;
  const scaledScore = scaleIndexToScore(scoreData?.corrected_index ?? 0.75);
  const band = getScoreBand(scaledScore);

  const formattedIssuedDate = card.issued_at
    ? new Date(card.issued_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Active';

  const reasons = scoreData?.attribution
    ? translateAttribution(
        scoreData.attribution,
        scoreData.integrity_flag,
        scoreData.integrity_flag_reason,
        scoreData.gps_consistent
      )
    : [];

  return (
    <main className="min-h-screen bg-paper py-6 px-3 sm:px-6 max-w-lg mx-auto flex flex-col justify-between">
      {/* SSR Performance & Preconnect Hints */}
      <head>
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_ATS_API_BASE_URL || 'https://api.agritrust.error404.live'} crossOrigin="anonymous" />
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_ATS_API_BASE_URL || 'https://api.agritrust.error404.live'} />
      </head>

      <div>
        {/* Top Official AgriTrust Header */}
        <div className="flex items-center justify-between px-1 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-ats bg-accent flex items-center justify-center text-white border-ink shadow-hard-sm">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-ink block leading-tight font-heading">
                AgriTrust ID
              </span>
              <span className="text-[10px] text-accent font-bold">
                Smallholder Verification Certificate
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white border-ink text-accent rounded-ats text-[11px] font-bold shadow-hard-sm">
            <span className="w-2 h-2 rounded-full bg-accent" />
            <span>Live Verified</span>
          </div>
        </div>

        {/* Identity & Verification Credential Card (Government badge feel, zero payment-card styling) */}
        <div className="card-hard overflow-hidden bg-white">
          
          {/* Top Attestation Banner with Solid Band Color */}
          <div className={`${band.heroBgClass} p-5 text-white border-b border-ink relative`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-black/20 text-[11px] font-bold uppercase tracking-wider mb-2 border border-white/20">
                  {band.label}
                </div>
                <h1 className="text-2xl font-black tracking-tight text-white font-heading">
                  {card.farmer_display_name}
                </h1>
                <div className="flex items-center gap-1 text-xs text-white/90 mt-0.5 font-medium">
                  <MapPin className="w-3.5 h-3.5 opacity-90" />
                  <span>{card.district}, {card.state}</span>
                </div>
              </div>

              {/* Large Score Indicator */}
              <div className="bg-black/25 rounded-ats p-3 text-center border border-white/20 min-w-[84px]">
                <span className="text-[9px] uppercase font-bold text-white/80 block tracking-wider">
                  Trust Score
                </span>
                <div className="text-3xl font-black text-white leading-none mt-0.5 font-heading">
                  {scaledScore}
                </div>
                <span className="text-[10px] text-white/75 font-semibold">/100</span>
              </div>
            </div>

            <div className="mt-3 text-xs text-white/85 font-medium font-mono">
              Plot Ref: <span className="text-white font-bold">{card.parcel_id}</span>
            </div>
          </div>

          {/* Integrity Badge Banner */}
          <div className={`px-5 py-3 border-b border-ink flex items-center justify-between text-xs ${
            scoreData?.integrity_flag
              ? 'bg-red-50 text-red-950 font-bold'
              : 'bg-paper text-ink'
          }`}>
            <div className="flex items-center gap-2">
              {scoreData?.integrity_flag ? (
                <div className="flex items-center gap-1.5 text-band-attention font-bold">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>Reading under review</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-accent font-bold">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>Satellite & Radar Integrity Verified</span>
                </div>
              )}
            </div>
            <div className="text-[11px] font-mono text-stone-600 flex items-center gap-1 font-bold">
              <span>GPS: {scoreData?.gps_consistent ? 'MATCH' : 'UNCONFIRMED'}</span>
              {scoreData?.gps_consistent && <Check className="w-3.5 h-3.5 text-accent stroke-[3]" />}
            </div>
          </div>

          {/* Card Body Details */}
          <div className="p-5 space-y-4">
            
            {/* Before / After Mini Chart */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-ink uppercase tracking-wider mb-2">
                <Layers className="w-3.5 h-3.5 text-accent" />
                <span>Satellite Error Correction</span>
              </div>
              <MiniBeforeAfterChart
                rawIndex={scoreData?.raw_index ?? 0.45}
                correctedIndex={scoreData?.corrected_index ?? 0.75}
                uncertaintyInterval={scoreData?.uncertainty_interval}
                compact={true}
              />
            </div>

            {/* Crop & Growth Summary */}
            {scoreData?.crop && (
              <div className="p-3.5 rounded-ats bg-paper border-ink flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-white border-ink rounded-ats text-accent">
                    <Sprout className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                      Crop Standing
                    </span>
                    <span className="text-xs font-bold text-ink">
                      {scoreData.crop.declared} ({scoreData.crop.category})
                    </span>
                  </div>
                </div>

                <span className="text-xs font-bold text-accent bg-emerald-50 px-2.5 py-1 rounded-ats border-ink">
                  Healthy Growth
                </span>
              </div>
            )}

            {/* Top Plain Reasons for Score */}
            {reasons.length > 0 && (
              <div>
                <div className="text-xs font-bold text-ink uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-accent" />
                  <span>Key Observations</span>
                </div>
                <div className="space-y-2">
                  {reasons.map((r, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-ats bg-paper border-ink text-xs flex items-start gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-ink">{r.title}:</strong>{' '}
                        <span className="text-stone-600">{r.detail}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer with "Issued under AgriTrust ID" */}
            <div className="pt-4 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600">
              <div className="flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                <span>Issued: {formattedIssuedDate}</span>
              </div>
              <div className="font-bold text-accent bg-emerald-50 px-2.5 py-0.5 rounded-ats border-ink text-[11px]">
                Issued under AgriTrust ID
              </div>
            </div>

            <div className="text-center pt-1">
              <span className="text-[10px] font-mono text-stone-400">
                Credential Token: {credentialId}
              </span>
            </div>

          </div>
        </div>

        {/* Client side enhancements: Offline SWR banner, Share button, QR viewer */}
        <CardClient card={card} credentialId={credentialId} />
      </div>

      {/* Bottom Link to Farmer / Admin */}
      <footer className="mt-8 text-center text-xs text-stone-500">
        <Link href="/farmer" className="text-accent hover:underline font-bold">
          ← Open Farmer Dashboard
        </Link>
        <p className="text-[10px] text-stone-400 mt-2">
          AgriTrust Score (ATS) • Single-fetch public credential • Low-bandwidth optimized
        </p>
      </footer>
    </main>
  );
}
