import React from 'react';
import { Attribution } from '@/lib/contracts';
import { translateAttribution, TranslatedReason } from '@/lib/constants';
import {
  Droplets,
  Radio,
  MapPin,
  CloudRain,
  ShieldCheck,
  AlertTriangle,
  Check,
} from 'lucide-react';

interface AttributionListProps {
  // Attribution features: moisture_vwc, vh_vv_ratio, intersection_fraction, 7d_rainfall_sum
  attribution: Attribution | Record<string, number | undefined>;
  integrityFlag?: boolean;
  integrityFlagReason?: string | null;
  gpsConsistent?: boolean;
}

export const AttributionList: React.FC<AttributionListProps> = ({
  attribution,
  integrityFlag = false,
  integrityFlagReason = null,
  gpsConsistent = true,
}) => {
  const reasons: TranslatedReason[] = translateAttribution(
    attribution,
    integrityFlag,
    integrityFlagReason,
    gpsConsistent
  );

  const getReasonIcon = (iconName: TranslatedReason['icon'], isPositive: boolean) => {
    const iconClass = isPositive ? 'text-accent' : 'text-band-fair';
    switch (iconName) {
      case 'droplets':
        return <Droplets className={`w-5 h-5 ${iconClass}`} />;
      case 'radio':
        return <Radio className={`w-5 h-5 ${iconClass}`} />;
      case 'map':
        return <MapPin className={`w-5 h-5 ${iconClass}`} />;
      case 'cloud-rain':
        return <CloudRain className={`w-5 h-5 ${iconClass}`} />;
      case 'shield-check':
        return <ShieldCheck className={`w-5 h-5 ${iconClass}`} />;
      case 'alert-circle':
        return <AlertTriangle className="w-5 h-5 text-band-attention" />;
      default:
        return <Check className={`w-5 h-5 ${iconClass}`} />;
    }
  };

  return (
    <div className="card-hard p-5 bg-white">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-black text-ink">
            Why this score
          </h3>
          <p className="text-xs text-stone-600">
            Plain key observations from satellite & radar
          </p>
        </div>
        <span className="text-xs px-2.5 py-1 bg-emerald-50 text-accent font-bold rounded-ats border-ink">
          Verified factors
        </span>
      </div>

      {/* Honest Warning if reading is under review */}
      {integrityFlag && (
        <div className="mb-3 p-3.5 bg-red-50 border-ink rounded-ats flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-band-attention flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-red-900">
              Reading currently under review
            </h4>
            <p className="text-xs text-red-700 mt-0.5">
              {integrityFlagReason || 'A local agronomist has been requested to confirm crop condition.'}
            </p>
          </div>
        </div>
      )}

      {/* Reasons List (Top 3) */}
      <div className="space-y-2.5">
        {reasons.map((item, idx) => (
          <div
            key={idx}
            className={`p-3.5 rounded-ats border-ink flex items-start gap-3.5 ${
              item.isPositive
                ? 'bg-paper'
                : 'bg-amber-50'
            }`}
          >
            <div className="p-2 rounded-ats bg-white border-ink flex-shrink-0">
              {getReasonIcon(item.icon, item.isPositive)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-ink">
                  {item.title}
                </span>
                {item.isPositive ? (
                  <span className="text-[10px] font-bold text-accent bg-emerald-100 px-2 py-0.5 rounded border border-ink">
                    Positive
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-band-fair bg-amber-100 px-2 py-0.5 rounded border border-ink">
                    Note
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">
                {item.detail}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
