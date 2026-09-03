import React from 'react';
import { ServerCrash } from 'lucide-react';

interface DemoBannerProps {
  isDemo?: boolean;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({ isDemo = false }) => {
  if (!isDemo) return null;

  return (
    <div className="mb-4 bg-band-fair text-white px-4 py-3 border-ink rounded-ats shadow-hard flex items-center justify-between text-xs font-bold">
      <div className="flex items-center gap-2.5">
        <ServerCrash className="w-4 h-4 flex-shrink-0 text-white" />
        <span className="text-sm font-black">Demo data — backend offline</span>
      </div>
      <span className="px-2 py-1 rounded bg-black/20 text-[10px] uppercase tracking-wider font-extrabold text-white border border-white/20">
        Fixture Mode
      </span>
    </div>
  );
};
