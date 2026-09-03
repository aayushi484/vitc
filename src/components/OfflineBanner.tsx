'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

interface OfflineBannerProps {
  lastVerifiedTimestamp?: string;
  isStale?: boolean;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  lastVerifiedTimestamp,
  isStale = false,
}) => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    setIsOffline(!navigator.onLine);

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline && !isStale) {
    return null;
  }

  const formattedTime = lastVerifiedTimestamp
    ? new Date(lastVerifiedTimestamp).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'Recent cached session';

  return (
    <div className="w-full bg-band-fair text-white px-4 py-2.5 border-b border-ink flex items-center justify-between text-xs font-bold">
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4 flex-shrink-0" />
        <span>
          Last verified {formattedTime}
        </span>
      </div>
      <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-black/20 text-[10px] uppercase font-bold tracking-wider text-white border border-white/20">
        Cached Offline
      </span>
    </div>
  );
};
