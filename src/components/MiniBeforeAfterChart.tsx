import React from 'react';
import { scaleIndexToScore } from '@/lib/constants';
import { ArrowRight } from 'lucide-react';

interface MiniBeforeAfterChartProps {
  rawIndex: number;
  correctedIndex: number;
  uncertaintyInterval?: [number, number];
  compact?: boolean;
}

export const MiniBeforeAfterChart: React.FC<MiniBeforeAfterChartProps> = ({
  rawIndex,
  correctedIndex,
  uncertaintyInterval,
  compact = false,
}) => {
  const rawScore = scaleIndexToScore(rawIndex);
  const correctedScore = scaleIndexToScore(correctedIndex);

  const rawHeight = Math.max(12, rawScore);
  const correctedHeight = Math.max(12, correctedScore);

  const gain = correctedScore - rawScore;

  let lowScore = correctedScore;
  let highScore = correctedScore;
  if (uncertaintyInterval && Array.isArray(uncertaintyInterval) && uncertaintyInterval.length === 2) {
    lowScore = scaleIndexToScore(uncertaintyInterval[0]);
    highScore = scaleIndexToScore(uncertaintyInterval[1]);
  }

  return (
    <div className={`w-full card-hard p-4 bg-white ${compact ? 'py-3' : 'py-4'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-ink">
            Satellite vs Ground-Calibrated Index
          </h4>
        </div>
        {gain > 0 && (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-ats bg-emerald-100 text-accent border-ink">
            +{gain} pts ATS error correction
          </span>
        )}
      </div>

      {/* Mini Visual Comparison Chart */}
      <div className="mt-3 flex items-end justify-around gap-4 h-28 px-4 pt-4 pb-2 bg-paper rounded-ats border-ink relative">
        {/* Baseline grid lines */}
        <div className="absolute inset-x-4 top-4 border-b border-dashed border-stone-300 pointer-events-none" />
        <div className="absolute inset-x-4 top-14 border-b border-dashed border-stone-300 pointer-events-none" />

        {/* 1. Raw Optical Satellite Bar */}
        <div className="flex flex-col items-center flex-1 max-w-[100px] h-full justify-end">
          <span className="text-xs font-bold text-stone-700 mb-1">
            {rawScore}
          </span>
          <div
            className="w-full bg-stone-500 rounded-t border-t border-x border-ink relative transition-all duration-300"
            style={{ height: `${rawHeight}%` }}
          />
          <span className="text-[10px] font-bold text-stone-600 mt-1.5 uppercase tracking-wider text-center line-clamp-1">
            Raw Optical
          </span>
        </div>

        {/* Arrow / Correction bridge */}
        <div className="flex flex-col items-center justify-center text-stone-500 mb-6 flex-shrink-0">
          <ArrowRight className="w-4 h-4 text-accent stroke-[2.5]" />
          <span className="text-[9px] text-accent font-bold mt-0.5">Radar+VWC</span>
        </div>

        {/* 2. ATS Corrected Ground-Truth Bar */}
        <div className="flex flex-col items-center flex-1 max-w-[100px] h-full justify-end">
          <span className="text-xs font-black text-accent mb-1 flex items-center gap-0.5">
            {correctedScore}
            <span className="text-[10px] text-stone-500 font-normal">/100</span>
          </span>
          <div
            className="w-full bg-accent rounded-t border-t border-x border-ink relative transition-all duration-300"
            style={{ height: `${correctedHeight}%` }}
          >
            {/* Uncertainty range envelope marker */}
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-1 bg-white border border-ink rounded-full" />
          </div>
          <span className="text-[10px] font-bold text-accent mt-1.5 uppercase tracking-wider text-center line-clamp-1">
            ATS Corrected
          </span>
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-between text-[11px] text-stone-500 px-1 font-mono">
        <span>Raw optical: {(rawIndex).toFixed(2)}</span>
        <span>Expected range: {lowScore}–{highScore}</span>
      </div>
    </div>
  );
};
