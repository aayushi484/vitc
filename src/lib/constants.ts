/**
 * AgriTrust Score (ATS) - Shared Constants & Translation Engine
 * Single Source of Truth for Score Bands, Colors, and Plain Phrasing.
 *
 * LAW (R1): Mobile-first, low-literacy assumed. Score shows as BAND first.
 */

export type ScoreBand = 'GOOD' | 'FAIR' | 'NEEDS_ATTENTION';

export interface BandConfig {
  band: ScoreBand;
  label: string;
  kannadaLabel: string;
  hindiLabel: string;
  description: string;
  colorHex: string;
  badgeBgClass: string;
  badgeTextClass: string;
  badgeBorderClass: string;
  heroBgClass: string;
  heroTextClass: string;
  iconName: 'check-circle-2' | 'alert-triangle' | 'alert-octagon';
}

export const SCORE_BANDS: Record<ScoreBand, BandConfig> = {
  GOOD: {
    band: 'GOOD',
    label: 'Good Condition',
    kannadaLabel: 'ಉತ್ತಮ ಸ್ಥಿತಿ',
    hindiLabel: 'अच्छी स्थिति',
    description: 'Field growth and satellite signals are strong and consistent.',
    colorHex: '#16A34A', // Exact token
    badgeBgClass: 'bg-[#16A34A]/15 text-[#166534] border-[#16A34A]',
    badgeTextClass: 'text-[#166534]',
    badgeBorderClass: 'border-[#16A34A]',
    heroBgClass: 'bg-[#16A34A] text-white',
    heroTextClass: 'text-white',
    iconName: 'check-circle-2',
  },
  FAIR: {
    band: 'FAIR',
    label: 'Fair Condition',
    kannadaLabel: 'ಸಾಧಾರಣ ಸ್ಥಿತಿ',
    hindiLabel: 'सामान्य स्थिति',
    description: 'Moderate crop canopy with minor variance in moisture or radar reading.',
    colorHex: '#D97706', // Exact token
    badgeBgClass: 'bg-[#D97706]/15 text-[#B45309] border-[#D97706]',
    badgeTextClass: 'text-[#B45309]',
    badgeBorderClass: 'border-[#D97706]',
    heroBgClass: 'bg-[#D97706] text-white',
    heroTextClass: 'text-white',
    iconName: 'alert-triangle',
  },
  NEEDS_ATTENTION: {
    band: 'NEEDS_ATTENTION',
    label: 'Needs Attention',
    kannadaLabel: 'ಗಮನ ಅಗತ್ಯವಿದೆ',
    hindiLabel: 'ध्यान देने योग्य',
    description: 'Vegetation reading is low or under active field verification.',
    colorHex: '#E11D48', // Exact token
    badgeBgClass: 'bg-[#E11D48]/15 text-[#BE123C] border-[#E11D48]',
    badgeTextClass: 'text-[#BE123C]',
    badgeBorderClass: 'border-[#E11D48]',
    heroBgClass: 'bg-[#E11D48] text-white',
    heroTextClass: 'text-white',
    iconName: 'alert-octagon',
  },
};

/**
 * Scale raw / corrected index (0.00 - 1.00) to 0 - 100 integer score.
 */
export function scaleIndexToScore(index: number): number {
  if (typeof index !== 'number' || isNaN(index)) return 0;
  if (index > 1.0) return Math.min(100, Math.max(0, Math.round(index)));
  return Math.min(100, Math.max(0, Math.round(index * 100)));
}

/**
 * Get Score Band based on scaled score (0 - 100).
 * Thresholds:
 * - >= 70 : GOOD
 * - 45 - 69 : FAIR
 * - < 45 : NEEDS_ATTENTION
 */
export function getScoreBand(score: number): BandConfig {
  const scaled = score <= 1.0 ? scaleIndexToScore(score) : Math.round(score);
  if (scaled >= 70) return SCORE_BANDS.GOOD;
  if (scaled >= 45) return SCORE_BANDS.FAIR;
  return SCORE_BANDS.NEEDS_ATTENTION;
}

/**
 * Plain-language translated reason for attribution keys.
 * NEVER mention algorithmic jargon or technical ratios.
 */
export interface TranslatedReason {
  key: string;
  title: string;
  detail: string;
  isPositive: boolean;
  icon: 'droplets' | 'radio' | 'map' | 'cloud-rain' | 'shield-check' | 'alert-circle';
}

export function translateAttribution(
  attribution: Record<string, number | undefined> = {},
  integrityFlag = false,
  integrityReason: string | null = null,
  gpsConsistent = true
): TranslatedReason[] {
  const reasons: TranslatedReason[] = [];

  // Integrity Flag check - ALWAYS transparently reported if active
  if (integrityFlag) {
    reasons.push({
      key: 'integrity_flag',
      title: 'Reading under review',
      detail: integrityReason || 'Field specialist is conducting ground verification',
      isPositive: false,
      icon: 'alert-circle',
    });
  }

  // Soil moisture (moisture_vwc)
  if (attribution.moisture_vwc !== undefined) {
    const vwc = attribution.moisture_vwc;
    if (vwc >= 0.25) {
      reasons.push({
        key: 'moisture_vwc',
        title: 'Adequate soil moisture',
        detail: 'Soil moisture reading agrees with satellite radar',
        isPositive: true,
        icon: 'droplets',
      });
    } else if (vwc >= 0.15) {
      reasons.push({
        key: 'moisture_vwc',
        title: 'Moderate soil moisture',
        detail: 'Field shows dry surface but sufficient sub-surface moisture',
        isPositive: true,
        icon: 'droplets',
      });
    } else {
      reasons.push({
        key: 'moisture_vwc',
        title: 'Dry soil condition',
        detail: 'Low surface moisture detected across the plot',
        isPositive: false,
        icon: 'droplets',
      });
    }
  }

  // Radar Canopy / Biomass (vh_vv_ratio)
  if (attribution.vh_vv_ratio !== undefined) {
    const ratio = attribution.vh_vv_ratio;
    if (ratio >= 0.20) {
      reasons.push({
        key: 'vh_vv_ratio',
        title: 'Dense crop canopy',
        detail: 'Radar reflection confirms healthy plant volume',
        isPositive: true,
        icon: 'radio',
      });
    } else if (ratio >= 0.12) {
      reasons.push({
        key: 'vh_vv_ratio',
        title: 'Normal crop growth',
        detail: 'Radar confirms steady canopy formation',
        isPositive: true,
        icon: 'radio',
      });
    } else {
      reasons.push({
        key: 'vh_vv_ratio',
        title: 'Sparse canopy detected',
        detail: 'Radar shows early stage or light vegetation cover',
        isPositive: false,
        icon: 'radio',
      });
    }
  }

  // 7-day Rainfall (exact contract key: 7d_rainfall_sum)
  const rainfall = attribution['7d_rainfall_sum'];
  if (rainfall !== undefined) {
    if (rainfall >= 25) {
      reasons.push({
        key: '7d_rainfall_sum',
        title: 'Beneficial recent rain',
        detail: `${Math.round(rainfall)} mm rain received in the past 7 days`,
        isPositive: true,
        icon: 'cloud-rain',
      });
    } else if (rainfall > 0) {
      reasons.push({
        key: '7d_rainfall_sum',
        title: 'Light recent rain',
        detail: `${Math.round(rainfall)} mm rain received in the past week`,
        isPositive: true,
        icon: 'cloud-rain',
      });
    } else {
      reasons.push({
        key: '7d_rainfall_sum',
        title: 'No recent rainfall',
        detail: 'Zero rain recorded in the past 7 days',
        isPositive: false,
        icon: 'cloud-rain',
      });
    }
  }

  // Field boundary alignment (intersection_fraction)
  if (attribution.intersection_fraction !== undefined) {
    const fraction = attribution.intersection_fraction;
    if (fraction >= 0.85) {
      reasons.push({
        key: 'intersection_fraction',
        title: 'Accurate boundary match',
        detail: 'Field edges precisely align with satellite grid',
        isPositive: true,
        icon: 'shield-check',
      });
    } else {
      reasons.push({
        key: 'intersection_fraction',
        title: 'Partial boundary overlap',
        detail: 'Small edge variance adjusted by terrain model',
        isPositive: false,
        icon: 'shield-check',
      });
    }
  }

  // Ground GPS consistency
  if (gpsConsistent) {
    reasons.push({
      key: 'gps_consistent',
      title: 'GPS verified on ground',
      detail: 'Field coordinates match official survey map',
      isPositive: true,
      icon: 'map',
    });
  }

  return reasons.slice(0, 3);
}

/**
 * Translate Crop Category to Farmer Friendly Label
 */
export function translateCropCategory(category: string): string {
  const norm = (category || '').toUpperCase();
  if (norm.includes('CASH')) return 'Cash crop';
  if (norm.includes('FOOD') || norm.includes('GRAIN') || norm.includes('CEREAL')) return 'Food grain crop';
  if (norm.includes('HORTI') || norm.includes('VEG') || norm.includes('FRUIT')) return 'Horticulture crop';
  return 'Mixed / other crop';
}

/**
 * Generate 1-line plain language advisory from 7-day weather forecast.
 */
export function generateWeatherAdvisory(daily: { date: string; rainfall_mm: number; temp_max_c: number }[] = []): string {
  if (!daily || daily.length === 0) {
    return 'Weather is steady this week. Ideal conditions for regular field care.';
  }

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const highRainDays = daily.filter((d) => d.rainfall_mm >= 15);

  if (highRainDays.length > 0) {
    const firstRain = highRainDays[0];
    const dayName = days[new Date(firstRain.date).getDay()] || 'this week';
    return `Heavy rain likely ${dayName} (${Math.round(firstRain.rainfall_mm)} mm) — pause irrigation and avoid spraying or soil probing then.`;
  }

  const moderateRainDays = daily.filter((d) => d.rainfall_mm >= 5);
  if (moderateRainDays.length > 0) {
    const firstRain = moderateRainDays[0];
    const dayName = days[new Date(firstRain.date).getDay()] || 'this week';
    return `Light showers expected on ${dayName} — good moisture for standing crops.`;
  }

  const highTempDays = daily.filter((d) => d.temp_max_c >= 38);
  if (highTempDays.length > 0) {
    return 'Warm and dry conditions ahead — check soil moisture and maintain scheduled morning watering.';
  }

  return 'Clear skies and favorable weather forecast for the next 7 days.';
}
