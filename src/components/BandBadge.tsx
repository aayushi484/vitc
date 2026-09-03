import React from 'react';
import { getScoreBand } from '@/lib/constants';
import { CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';

interface BandBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showKannada?: boolean;
}

export const BandBadge: React.FC<BandBadgeProps> = ({ score, size = 'md', showKannada = true }) => {
  const config = getScoreBand(score);

  const getIcon = () => {
    switch (config.iconName) {
      case 'check-circle-2':
        return <CheckCircle2 className={size === 'lg' ? 'w-5 h-5' : size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />;
      case 'alert-triangle':
        return <AlertTriangle className={size === 'lg' ? 'w-5 h-5' : size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />;
      case 'alert-octagon':
        return <AlertOctagon className={size === 'lg' ? 'w-5 h-5' : size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />;
    }
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs font-bold gap-1 rounded-ats border-ink',
    md: 'px-3 py-1 text-xs font-black gap-1.5 rounded-ats border-ink shadow-hard-sm',
    lg: 'px-4 py-2 text-sm font-black gap-2 rounded-ats border-ink shadow-hard',
  };

  return (
    <div className={`inline-flex items-center ${config.badgeBgClass} ${sizeClasses[size]}`}>
      {getIcon()}
      <span className="tracking-wider uppercase">{config.label}</span>
      {showKannada && (
        <span className="text-[11px] opacity-90 font-normal ml-0.5">
          ({config.kannadaLabel})
        </span>
      )}
    </div>
  );
};
