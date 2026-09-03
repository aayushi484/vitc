'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CardCredential } from '@/lib/contracts';
import { getScoreBand, scaleIndexToScore } from '@/lib/constants';
import { Printer, X, ShieldCheck, QrCode, MapPin, Calendar, Info } from 'lucide-react';

interface PrintCardModalProps {
  card: CardCredential;
  cardUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

export const PrintCardModal: React.FC<PrintCardModalProps> = ({
  card,
  cardUrl,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const scaledScore = scaleIndexToScore(card.score?.corrected_index ?? 0.75);
  const band = getScoreBand(scaledScore);

  const formattedIssuedDate = card.issued_at
    ? new Date(card.issued_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Active';

  const formattedIssuedDateShort = card.issued_at
    ? new Date(card.issued_at).toLocaleDateString('en-IN')
    : 'Active';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 print:p-0 print:bg-white">
      <div className="card-hard max-w-2xl w-full p-6 bg-white flex flex-col max-h-[90vh] overflow-y-auto print:max-w-none print:w-auto print:p-0 print:border-none print:shadow-none">
        
        {/* Header (hidden in print) */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-200 print:hidden">
          <div>
            <h3 className="text-lg font-black text-ink flex items-center gap-2">
              <Printer className="w-5 h-5 text-accent" />
              <span>Print Laminated Field ID Card</span>
            </h3>
            <p className="text-xs text-stone-500">
              Standard 3.375&quot; × 2.125&quot; (CR80) dual-sided farm verification credential
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-accent text-white font-bold text-xs btn-hard flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print Sheet</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-stone-500 hover:text-ink rounded-ats hover:bg-stone-100 transition border border-transparent hover:border-ink"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Card Area */}
        <div className="flex flex-col md:flex-row gap-6 justify-center items-center py-4 print:py-0 print:flex-row print:gap-4">
          
          {/* FRONT OF THE CARD - Solid Ink & Accent Green Theme (Flat tokens) */}
          <div className="w-[340px] h-[215px] bg-[#111111] text-white rounded-ats p-4 border-ink shadow-hard relative flex flex-col justify-between overflow-hidden print:shadow-none print:border-2 print:border-black">
            {/* Watermark seal */}
            <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10 pointer-events-none">
              <ShieldCheck className="w-40 h-40 text-white" />
            </div>

            {/* Card Header */}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-ats bg-accent border border-emerald-400/50 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="text-xs font-black tracking-wider uppercase text-emerald-400">
                    AgriTrust ID
                  </h4>
                  <p className="text-[9px] text-stone-300 font-mono">
                    VERIFIED FARM CREDENTIAL
                  </p>
                </div>
              </div>

              <div className="px-2 py-0.5 rounded-ats bg-accent border border-emerald-400 text-[10px] font-bold text-white uppercase">
                {band.label}
              </div>
            </div>

            {/* Farmer Info & Big Score */}
            <div className="flex items-center justify-between relative z-10 my-auto">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-stone-400 block font-bold">
                  Farmer Name
                </span>
                <div className="text-base font-black text-white leading-tight">
                  {card.farmer_display_name}
                </div>
                <div className="text-[10px] text-stone-300 mt-0.5">
                  {card.district}, {card.state}
                </div>
                <div className="text-[9px] font-mono text-emerald-400 mt-1">
                  Plot: {card.parcel_id}
                </div>
              </div>

              {/* Score Display */}
              <div className="bg-stone-900 px-3 py-2 rounded-ats border border-stone-700 text-center">
                <span className="text-[8px] uppercase tracking-wider text-stone-400 block font-bold">
                  Trust Score
                </span>
                <div className="text-2xl font-black text-emerald-400 font-heading">
                  {scaledScore}
                  <span className="text-xs font-medium text-stone-400">/100</span>
                </div>
              </div>
            </div>

            {/* Card Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-stone-800 relative z-10 text-[9px] text-stone-400 font-mono">
              <span>ATS ID: {card.credential_id.substring(0, 18)}...</span>
              <span>Issued: {formattedIssuedDateShort}</span>
            </div>
          </div>

          {/* BACK OF THE CARD - Clean White, QR, Exact Timestamps */}
          <div className="w-[340px] h-[215px] bg-white text-ink rounded-ats p-4 border-ink shadow-hard relative flex flex-col justify-between overflow-hidden print:shadow-none print:border-2 print:border-black">
            
            {/* Top Security & Instructions */}
            <div>
              <div className="flex items-center justify-between border-b border-stone-200 pb-1.5">
                <div className="flex items-center gap-1.5 text-[10px] font-black text-ink uppercase tracking-wider">
                  <QrCode className="w-3.5 h-3.5 text-accent" />
                  <span>Instant Scan & Tap Verification</span>
                </div>
                <span className="text-[9px] font-mono text-stone-500 font-bold">NTAG213 / QR</span>
              </div>
              <p className="text-[9px] text-stone-600 mt-1 leading-tight">
                Scan with smartphone camera or tap with NFC to open the live satellite vegetation index & farm verification certificate.
              </p>
            </div>

            {/* Middle: QR Code + District + Timestamp */}
            <div className="flex items-center gap-3 my-0.5">
              <div className="p-1 bg-white border-ink rounded-ats flex-shrink-0">
                <QRCodeSVG
                  value={cardUrl}
                  size={62}
                  level="M"
                  includeMargin={false}
                />
              </div>
              <div className="text-[9px] text-stone-700 leading-tight space-y-1">
                <div className="font-bold text-ink flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-accent flex-shrink-0" />
                  <span>District: <strong>{card.district || 'Mandya'}, {card.state || 'Karnataka'}</strong></span>
                </div>
                <div className="text-stone-700 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-accent flex-shrink-0" />
                  <span>Issued At: <strong>{formattedIssuedDate}</strong></span>
                </div>
                <div className="font-mono break-all text-[8px] text-accent bg-emerald-50 p-1 rounded border border-ink">
                  {cardUrl}
                </div>
              </div>
            </div>

            {/* Disclaimer Footer */}
            <div className="pt-1 border-t border-stone-200 text-[8px] text-stone-500 flex items-center justify-between font-mono">
              <span>AgriTrust Verification System (ATS)</span>
              <span>Public Credential • No Auth Wall</span>
            </div>
          </div>

        </div>

        {/* Print Instructions footer (hidden in print, zero emojis) */}
        <div className="mt-4 pt-3 border-t border-stone-200 text-xs text-stone-600 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-1.5">
            <Info className="w-4 h-4 text-accent flex-shrink-0" />
            <span>Recommendation: Print on 250+ GSM cardstock or thermal PVC card printer for field durability.</span>
          </div>
          <button
            type="button"
            onClick={handlePrint}
            className="text-accent font-bold hover:underline"
          >
            Open Print Dialog →
          </button>
        </div>

      </div>
    </div>
  );
};
