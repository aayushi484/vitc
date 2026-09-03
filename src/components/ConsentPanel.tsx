'use client';

import React, { useState } from 'react';
import { updateConsent } from '@/lib/api';
import { Shield, Eye, Lock, AlertTriangle, Check, RefreshCw } from 'lucide-react';

interface ConsentPanelProps {
  parcelId: string;
  initialConsent?: boolean;
  onConsentChange?: (granted: boolean) => void;
}

export const ConsentPanel: React.FC<ConsentPanelProps> = ({
  parcelId,
  initialConsent = true,
  onConsentChange,
}) => {
  const [isGranted, setIsGranted] = useState(initialConsent);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [backendSyncNotice, setBackendSyncNotice] = useState<string | null>(null);

  const handleToggle = () => {
    if (isGranted) {
      // Prompt confirmation sheet before pausing
      setIsModalOpen(true);
    } else {
      // Re-grant immediately
      applyConsent(true);
    }
  };

  const applyConsent = async (granted: boolean) => {
    const previousState = isGranted;
    // Optimistic UI update
    setIsGranted(granted);
    setIsModalOpen(false);
    onConsentChange?.(granted);
    setIsSaving(true);
    setBackendSyncNotice(null);

    try {
      const res = await updateConsent(parcelId, granted);
      if (res.isDemoFixture) {
        setBackendSyncNotice('Local consent saved (backend offline fixture)');
      } else {
        setBackendSyncNotice('Live consent state updated on server');
      }
      setTimeout(() => setBackendSyncNotice(null), 3500);
    } catch (err: any) {
      console.error('Consent update error, reverting:', err);
      // Revert optimistic update on failure
      setIsGranted(previousState);
      onConsentChange?.(previousState);
      setBackendSyncNotice('Failed to update consent. Reverted to previous state.');
      setTimeout(() => setBackendSyncNotice(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="card-hard p-5 bg-white">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Shield className="w-4 h-4 text-accent" />
            <h3 className="text-base font-black text-ink">
              Data Sharing & Verification Consent
            </h3>
          </div>
          <p className="text-xs text-stone-600">
            You own your field data. Control who can verify your field trust score.
          </p>
        </div>

        {/* Big Tap Target Switch with Hard Shadow */}
        <button
          type="button"
          onClick={handleToggle}
          disabled={isSaving}
          aria-label="Toggle field verification consent"
          className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-ink transition-colors duration-150 ease-in-out focus:outline-none ${
            isGranted ? 'bg-accent' : 'bg-stone-300'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white border-ink shadow-hard-sm transition duration-150 ease-in-out flex items-center justify-center text-[10px] font-bold ${
              isGranted ? 'translate-x-6 text-accent' : 'translate-x-0 text-stone-400'
            }`}
          >
            {isSaving ? (
              <RefreshCw className="w-3 h-3 animate-spin text-ink" />
            ) : isGranted ? (
              <Check className="w-3.5 h-3.5 stroke-[3] text-accent" />
            ) : (
              'OFF'
            )}
          </span>
        </button>
      </div>

      {backendSyncNotice && (
        <div className="mt-2 text-[11px] font-bold text-accent bg-emerald-50 px-2.5 py-1 rounded-ats border-ink flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5" />
          <span>{backendSyncNotice}</span>
        </div>
      )}

      {/* Current State Explanation */}
      <div
        className={`mt-4 p-3.5 rounded-ats border-ink text-xs ${
          isGranted
            ? 'bg-emerald-50 text-ink'
            : 'bg-red-50 text-red-950'
        }`}
      >
        <div className="font-bold flex items-center gap-1.5 mb-1">
          {isGranted ? (
            <>
              <Eye className="w-4 h-4 text-accent" />
              <span>Verification Active (AgriTrust ID Card readable)</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4 text-band-attention" />
              <span>Verification Paused by You (Data sharing blocked)</span>
            </>
          )}
        </div>
        <p className="text-[12px] opacity-90 leading-relaxed">
          {isGranted
            ? 'When an agricultural officer or partner scans your NFC card or QR code, only your field health score and crop status are verified.'
            : 'Your score is private. Anyone who taps or scans your ID card will be notified that verification has been paused by the farm owner.'}
        </p>
      </div>

      {/* Revocation Confirmation Sheet / Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="card-hard p-6 max-w-sm w-full bg-white text-left">
            <div className="w-10 h-10 rounded-ats bg-amber-100 border-ink text-band-fair flex items-center justify-center mb-4">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <h4 className="text-lg font-black text-ink mb-2">
              Pause Field Verification?
            </h4>

            <p className="text-xs text-stone-600 mb-4 leading-relaxed">
              If you pause consent, your field health score will immediately stop being served. Any scans of your AgriTrust card will return an inactive verification notice.
            </p>

            <div className="bg-paper p-3 rounded-ats text-xs text-stone-700 mb-5 border-ink flex items-center gap-2">
              <Check className="w-4 h-4 text-accent flex-shrink-0" />
              <span>You can turn consent back ON at any time from this screen.</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="py-2.5 px-4 bg-white text-ink btn-hard text-xs hover:bg-paper"
              >
                Keep Active
              </button>
              <button
                type="button"
                onClick={() => applyConsent(false)}
                className="py-2.5 px-4 bg-band-attention text-white btn-hard text-xs hover:bg-red-700"
              >
                Yes, Pause Sharing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
