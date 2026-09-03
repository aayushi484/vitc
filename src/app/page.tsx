import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Smartphone,
  Radio,
  ExternalLink,
  CheckCircle2,
  Lock,
  LogIn,
} from 'lucide-react';
import { SEEDED_CARDS } from '@/lib/fixtures';
import { getScoreBand, scaleIndexToScore } from '@/lib/constants';

export default function Home() {
  const cardsList = Object.values(SEEDED_CARDS);

  return (
    <main className="min-h-screen bg-paper text-ink">
      {/* Hero Header */}
      <div className="border-b border-ink bg-white pb-12 pt-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-ats bg-paper border-ink text-accent text-xs font-bold uppercase tracking-wider mb-4 shadow-hard-sm">
            <ShieldCheck className="w-4 h-4" />
            <span>Karnataka Farming Belts (Mandya / Hassan / Mysore)</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-ink mb-3 leading-tight font-heading">
            AgriTrust Score <span className="text-accent">(ATS)</span>
          </h1>

          <p className="text-sm sm:text-base text-stone-600 max-w-2xl mx-auto leading-relaxed">
            Ground-calibrated satellite vegetation index & trust verification credential for smallholder farms. Eliminates optical satellite errors using radar and soil moisture data.
          </p>

          {/* Core Routes CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <Link
              href="/farmer"
              className="py-3 px-6 bg-accent text-white font-black text-sm btn-hard flex items-center gap-2"
            >
              <Smartphone className="w-5 h-5" />
              <span>Open Farmer Dashboard</span>
            </Link>

            <Link
              href="/login"
              className="py-3 px-6 bg-white text-ink font-bold text-sm btn-hard flex items-center gap-2"
            >
              <LogIn className="w-5 h-5 text-accent" />
              <span>Sign In / Roles</span>
            </Link>

            <Link
              href="/admin/issue-card"
              className="py-3 px-6 bg-paper text-ink font-bold text-sm btn-hard flex items-center gap-2"
            >
              <Radio className="w-5 h-5 text-accent" />
              <span>Issue NFC & QR Card</span>
            </Link>

            <Link
              href="/card/cred_ats_ka_mandya_8801"
              className="py-3 px-6 bg-paper text-stone-700 font-bold text-sm btn-hard flex items-center gap-2"
            >
              <ShieldCheck className="w-5 h-5 text-accent" />
              <span>Public Card (Mandya)</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Grid: Seeded Cards & Specifications */}
      <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 space-y-10">
        
        {/* Seeded Verification Cards Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-black text-ink flex items-center gap-2 font-heading">
                <ShieldCheck className="w-5 h-5 text-accent" />
                <span>Seeded Karnataka Verification Cards</span>
              </h2>
              <p className="text-xs text-stone-500">
                Click to open any card on your phone (SSR rendered, &lt;2s 4G, works offline)
              </p>
            </div>
            <span className="text-xs text-accent font-mono font-bold bg-emerald-50 px-2 py-1 rounded-ats border-ink">
              PUBLIC / NO AUTH
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cardsList.map((card) => {
              const score = card.score;
              const scaledScore = scaleIndexToScore(score.corrected_index);
              const band = getScoreBand(scaledScore);

              return (
                <Link
                  key={card.credential_id}
                  href={`/card/${card.credential_id}`}
                  className="card-hard p-5 bg-white flex flex-col justify-between hover:translate-x-[-1px] hover:translate-y-[-1px] transition-transform"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-ats uppercase ${band.badgeBgClass}`}>
                        {band.label}
                      </span>
                      <span className="text-xs font-mono text-stone-500 font-medium">
                        {card.parcel_id}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-ink font-heading">
                      {card.farmer_display_name}
                    </h3>
                    <p className="text-xs text-stone-600 mt-0.5">
                      {card.district}, {card.state} • Crop: {score.crop.declared}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-stone-500 font-bold block uppercase">Trust Score</span>
                      <span className="text-xl font-black text-ink font-heading">
                        {scaledScore}
                        <span className="text-xs font-normal text-stone-400">/100</span>
                      </span>
                    </div>

                    <div className="inline-flex items-center gap-1 text-xs font-bold text-accent">
                      <span>Open Card</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Feature Highlights & Rules Compliance Matrix */}
        <div className="card-hard p-6 bg-white">
          <h3 className="text-base font-black text-ink mb-4 flex items-center gap-2 font-heading">
            <CheckCircle2 className="w-5 h-5 text-accent" />
            <span>Production System Architecture</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-ats bg-paper border-ink">
              <div className="font-bold text-accent flex items-center gap-1.5 mb-1">
                <Smartphone className="w-4 h-4" />
                <span>R1: Farmer Language Law</span>
              </div>
              <p className="text-stone-600 leading-relaxed">
                Mobile-first layout with Band-first score (Good/Fair/Needs attention), plain translation map, and zero finance terms.
              </p>
            </div>

            <div className="p-4 rounded-ats bg-paper border-ink">
              <div className="font-bold text-accent flex items-center gap-1.5 mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>R2: Public Verification Card</span>
              </div>
              <p className="text-stone-600 leading-relaxed">
                Zero auth wall, server-rendered in &lt;100ms, renders with pure HTML without JS, identity-credential aesthetic.
              </p>
            </div>

            <div className="p-4 rounded-ats bg-paper border-ink">
              <div className="font-bold text-accent flex items-center gap-1.5 mb-1">
                <Lock className="w-4 h-4" />
                <span>R3: Real Farmer Consent Control</span>
              </div>
              <p className="text-stone-600 leading-relaxed">
                First-class toggle on /farmer calling updateConsent. Revocation halts score serving and presents 403 status politely.
              </p>
            </div>

            <div className="p-4 rounded-ats bg-paper border-ink">
              <div className="font-bold text-accent flex items-center gap-1.5 mb-1">
                <Radio className="w-4 h-4" />
                <span>R6: Web NFC & QR Fallback</span>
              </div>
              <p className="text-stone-600 leading-relaxed">
                One-click NDEFReader URI write on Chrome Android with immediate readback verification, guided iOS/NFC Tools instructions, and dual-sided printable CR80 cards.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="border-t border-ink py-6 px-4 text-center text-xs text-stone-500 bg-white">
        AgriTrust Score (ATS) • Production Karnataka Belts
      </footer>
    </main>
  );
}
