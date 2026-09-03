import React from 'react';
import { getScoreBand, scaleIndexToScore } from '@/lib/constants';
import { ShieldCheck, Info, Check } from 'lucide-react';

interface ScoreHeroProps {
  correctedIndex: number;
  rawIndex?: number;
  uncertaintyInterval?: [number, number];
  computedAt?: string;
  parcelId: string;
}

export const ScoreHero: React.FC<ScoreHeroProps> = ({
  correctedIndex,
  rawIndex,
  uncertaintyInterval,
  computedAt,
  parcelId,
}) => {
  const scaledScore = scaleIndexToScore(correctedIndex);
  const band = getScoreBand(scaledScore);

  // Compute uncertainty numbers in 0-100 scale
  let lowScore = scaledScore;
  let highScore = scaledScore;

  if (uncertaintyInterval && Array.isArray(uncertaintyInterval) && uncertaintyInterval.length === 2) {
    lowScore = scaleIndexToScore(uncertaintyInterval[0]);
    highScore = scaleIndexToScore(uncertaintyInterval[1]);
  }

  const formattedDate = computedAt
    ? new Date(computedAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Recently verified';

  return (
    <div className="card-hard overflow-hidden bg-white">
      {/* Top Band Header - Solid Band Color Field per Design System Law */}
      <div className={`${band.heroBgClass} p-5 text-center border-b border-ink relative`}>
        <div className="relative z-10 flex flex-col items-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-black/20 text-xs font-bold uppercase tracking-wider text-white mb-2 border border-white/20">
            Field Status
          </div>

          <h2 className="text-3xl font-black tracking-tight text-white uppercase">
            {band.label}
          </h2>

          <p className="text-xs font-medium text-white/90 mt-1">
            {band.kannadaLabel} • {band.description}
          </p>
        </div>
      </div>

      {/* Main Score & Metric Display */}
      <div className="p-6 pt-5 bg-white text-ink flex flex-col items-center text-center">
        <div className="text-xs uppercase font-bold text-stone-600 tracking-wider mb-1 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-accent" />
          <span>Field Trust Score</span>
        </div>

        {/* Big Number */}
        <div className="flex items-baseline justify-center my-1">
          <span
            className="text-7xl font-black tracking-tight font-heading"
            style={{ color: band.colorHex }}
          >
            {scaledScore}
          </span>
          <span className="text-2xl font-bold text-stone-400 ml-1">/100</span>
        </div>

        {/* Uncertainty Note */}
        {uncertaintyInterval && (
          <div className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 bg-paper rounded-ats text-xs font-medium text-stone-700 border-ink">
            <Info className="w-3.5 h-3.5 text-stone-500 flex-shrink-0" />
            <span>
              Expected range: <strong className="text-ink">{lowScore} – {highScore}</strong> points
            </span>
          </div>
        )}

        {/* Satellite Correction Indicator */}
        {rawIndex !== undefined && (
          <div className="w-full mt-5 pt-4 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600">
            <div className="text-left">
              <span className="block font-bold text-ink">Parcel: {parcelId}</span>
              <span className="text-[11px] text-stone-500">Scan: {formattedDate}</span>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-ats bg-emerald-50 text-accent font-bold border-ink">
                <span>Radar & Soil Calibrated</span>
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
