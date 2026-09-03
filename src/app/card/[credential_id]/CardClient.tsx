'use client';

import React, { useEffect, useState } from 'react';
import { CardCredential } from '@/lib/contracts';
import { getOfflineCardCacheKey } from '@/lib/api';
import { OfflineBanner } from '@/components/OfflineBanner';
import { Share2, Check, QrCode, ShieldCheck, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface CardClientProps {
  card: CardCredential;
  credentialId: string;
}

export const CardClient: React.FC<CardClientProps> = ({ card, credentialId }) => {
  const [copied, setCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  // Persist card data for offline SWR on client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href);
      try {
        const cacheKey = getOfflineCardCacheKey(credentialId);
        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            card,
            cachedAt: new Date().toISOString(),
          })
        );
      } catch (err) {
        console.warn('Failed to cache card for offline:', err);
      }
    }
  }, [card, credentialId]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `AgriTrust Card — ${card.farmer_display_name}`,
          text: `Verified Field Trust Score for ${card.farmer_display_name} (${card.district || 'Plot'}): ${card.score?.corrected_index ? Math.round(card.score.corrected_index * 100) : ''}/100`,
          url: window.location.href,
        });
        return;
      } catch {
        // Fallback to copy
      }
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignored
    }
  };

  return (
    <>
      <div className="mt-3">
        <OfflineBanner lastVerifiedTimestamp={card.issued_at} />
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleShare}
          className="py-2.5 px-4 bg-white text-ink text-xs btn-hard flex items-center gap-1.5"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-accent stroke-[3]" />
              <span>Link Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4 text-stone-600" />
              <span>Share Verification</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => setShowQrModal(true)}
          className="py-2.5 px-4 bg-emerald-50 text-accent text-xs btn-hard flex items-center gap-1.5"
        >
          <QrCode className="w-4 h-4 text-accent" />
          <span>Show QR Code</span>
        </button>
      </div>

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="card-hard p-6 max-w-xs w-full text-center bg-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-accent">
                <ShieldCheck className="w-4 h-4" />
                <span>Field Verification QR</span>
              </div>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="p-1 text-stone-400 hover:text-ink rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-600 mb-4">
              Scan with any smartphone camera to verify this farm credential
            </p>

            <div className="p-3 bg-white border-ink rounded-ats inline-block shadow-hard-sm mb-4">
              <QRCodeSVG
                value={currentUrl || `https://agritrust.error404.live/card/${credentialId}`}
                size={180}
                level="M"
              />
            </div>

            <p className="text-[10px] font-mono text-stone-500 break-all mb-4 bg-paper p-2 rounded-ats border-ink">
              {credentialId}
            </p>

            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 bg-ink text-white font-bold text-xs btn-hard"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
