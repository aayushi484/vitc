import React from 'react';
import { CropInfo, LandRisk } from '@/lib/contracts';
import { translateCropCategory } from '@/lib/constants';
import { Sprout, Mountain, CheckCircle2, AlertTriangle } from 'lucide-react';

interface CropLandSummaryProps {
  crop: CropInfo;
  landRisk: LandRisk;
}

export const CropLandSummary: React.FC<CropLandSummaryProps> = ({ crop, landRisk }) => {
  const cropCategoryLabel = translateCropCategory(crop.category);

  const formatLandFlags = (flags: string[]) => {
    if (!flags || flags.length === 0) return 'Field boundaries verified clear';
    const friendlyMap: Record<string, string> = {
      NO_ENCROACHMENT: 'Clear boundaries, no encroachment',
      CLEAR_TERRAIN_SLOPE: 'Stable soil slope, low erosion risk',
      CLEAR_BOUNDARIES: 'Boundary pins verified on map',
      MINOR_TERRAIN_CONTOUR: 'Gentle terrain slope',
      SURFACE_RUNOFF_RISK: 'Rain runoff risk in low-lying area',
      CANAL_IRRIGATED: 'Direct canal water access',
      ZERO_EROSION: 'Zero soil erosion observed',
    };

    return flags
      .map((f) => friendlyMap[f] || f.replace(/_/g, ' ').toLowerCase())
      .join(' • ');
  };

  const isLowRisk = landRisk.score <= 30;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
      {/* Crop Info Card */}
      <div className="card-hard p-5 bg-white flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <div className="p-2 bg-paper border-ink rounded-ats">
              <Sprout className="w-5 h-5 text-accent" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                Declared Crop
              </span>
              <h4 className="text-base font-black text-ink">
                {crop.declared}
              </h4>
            </div>
          </div>

          <div className="mt-3 p-3 bg-paper rounded-ats border-ink">
            <div className="text-xs text-ink font-bold">
              Category: {cropCategoryLabel}
            </div>
            <p className="text-[11px] text-stone-600 mt-0.5">
              Standard growth cycle calibrated with regional climate station
            </p>
          </div>
        </div>
      </div>

      {/* Land & Boundary Risk Card */}
      <div className="card-hard p-5 bg-white flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <div className="p-2 bg-paper border-ink rounded-ats">
              <Mountain className="w-5 h-5 text-band-fair" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                Land & Boundary Status
              </span>
              <h4 className="text-base font-black text-ink">
                {isLowRisk ? 'Clear & Stable' : 'Monitored Plot'}
              </h4>
            </div>
          </div>

          <div className={`mt-3 p-3 rounded-ats border-ink ${isLowRisk ? 'bg-paper' : 'bg-amber-50'}`}>
            <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
              {isLowRisk ? (
                <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-band-fair flex-shrink-0" />
              )}
              <span>{formatLandFlags(landRisk.flags)}</span>
            </div>
            {landRisk.attestation_id && (
              <div className="text-[10px] font-mono text-stone-500 mt-1">
                Ref: {landRisk.attestation_id}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
