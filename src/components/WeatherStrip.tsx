import React from 'react';
import { DailyForecast } from '@/lib/contracts';
import { generateWeatherAdvisory } from '@/lib/constants';
import { Cloud, CloudRain, Sun, Compass } from 'lucide-react';

interface WeatherStripProps {
  dailyForecast?: DailyForecast[];
}

export const WeatherStrip: React.FC<WeatherStripProps> = ({ dailyForecast = [] }) => {
  const safeDaily = Array.isArray(dailyForecast) ? dailyForecast : [];
  const advisory = generateWeatherAdvisory(safeDaily);

  const getDayLabel = (dateStr?: string, index = 0) => {
    if (index === 0) return 'Today';
    if (index === 1) return 'Tmrw';
    if (!dateStr) return `D+${index}`;
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return `D+${index}`;
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } catch {
      return `D+${index}`;
    }
  };

  const getWeatherIcon = (rainfall = 0) => {
    if (rainfall > 0) return <CloudRain className="w-6 h-6 text-sky-700" />;
    return <Sun className="w-6 h-6 text-band-fair" />;
  };

  return (
    <div className="card-hard p-5 bg-white">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-base font-black text-ink flex items-center gap-1.5">
            <Cloud className="w-4 h-4 text-sky-700" />
            <span>7-Day Weather Outlook</span>
          </h3>
          <p className="text-xs text-stone-600">
            Field rain & temperature guidance
          </p>
        </div>
        <span className="text-xs px-2.5 py-1 bg-paper text-ink font-bold rounded-ats border-ink">
          7 Days
        </span>
      </div>

      {/* One-line farmer advisory banner */}
      <div className="mb-4 p-3.5 bg-paper border-ink rounded-ats flex items-start gap-2.5">
        <Compass className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
        <p className="text-xs font-semibold text-ink leading-snug">
          {advisory}
        </p>
      </div>

      {/* Horizontal Scrollable Daily Forecast Strip */}
      {safeDaily.length === 0 ? (
        <div className="p-4 text-center text-xs text-stone-500 bg-paper rounded-ats border-ink">
          Weather station telemetry sync in progress...
        </div>
      ) : (
        <div className="flex gap-2.5 overflow-x-auto pb-2 pt-1 no-scrollbar -mx-1 px-1">
          {safeDaily.map((day, idx) => {
            const rainfall = day?.rainfall_mm ?? 0;
            const tempMax = day?.temp_max_c ?? 30;
            const tempMin = day?.temp_min_c ?? 20;
            const isToday = idx === 0;

            return (
              <div
                key={idx}
                className={`flex-shrink-0 w-20 py-3 px-2 rounded-ats border-ink flex flex-col items-center justify-between text-center ${
                  isToday
                    ? 'bg-emerald-50 shadow-hard-sm'
                    : 'bg-paper'
                }`}
              >
                <span className={`text-xs font-bold ${isToday ? 'text-accent' : 'text-ink'}`}>
                  {getDayLabel(day?.date, idx)}
                </span>

                <div className="my-2 flex items-center justify-center h-7">
                  {getWeatherIcon(rainfall)}
                </div>

                <div className="text-[11px] font-bold text-ink">
                  {Math.round(rainfall)} <span className="text-[10px] font-normal text-stone-500">mm</span>
                </div>

                <div className="text-[10px] text-stone-500 mt-0.5 font-mono">
                  {Math.round(tempMax)}° / {Math.round(tempMin)}°
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
