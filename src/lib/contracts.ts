/**
 * AgriTrust Score (ATS) - Core Contract Definitions
 * Strict interface matching backend API specifications.
 */

export interface DailyForecast {
  date: string; // YYYY-MM-DD
  rainfall_mm: number;
  temp_max_c: number;
  temp_min_c: number;
}

export interface Attribution {
  moisture_vwc?: number; // Volumetric soil moisture (0.0 - 1.0)
  vh_vv_ratio?: number; // Radar cross-polarization ratio
  intersection_fraction?: number; // Field boundary overlap with satellite pixels (0.0 - 1.0)
  '7d_rainfall_sum'?: number; // 7-day cumulative rainfall in mm (exact contract key)
  [key: string]: number | undefined;
}

export interface LandRisk {
  score: number; // 0 - 100 risk score (lower is safer)
  flags: string[]; // e.g. ["CLEAR_BOUNDARIES", "SLOPE_STABLE"]
  attestation_id?: string;
  trend_flag?: 'stable' | 'improving' | 'degrading' | string;
}

export interface CropInfo {
  declared: string; // e.g., "Paddy Rice", "Cotton", "Sugarcane", "Arecanut"
  category: 'CASH' | 'FOOD' | 'HORTICULTURE' | 'OTHER' | string;
  risk_weight: number;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface ScoreResponse {
  parcel_id: string;
  farmer_display_name?: string;
  district?: string;
  state?: string;
  coordinates?: Coordinates;
  raw_index: number; // Raw optical satellite vegetation index (0.00 - 1.00)
  corrected_index: number; // ATS corrected ground-truth index (0.00 - 1.00)
  uncertainty_interval: [number, number]; // [lower_bound, upper_bound]
  attribution: Attribution;
  integrity_flag: boolean; // Flagged if satellite anomaly is detected
  integrity_flag_reason: string | null;
  integrity_deviation_score: number;
  gps_consistent: boolean;
  computed_at: string; // ISO 8601 UTC
  forecast: {
    daily: DailyForecast[];
  };
  land_risk: LandRisk;
  crop: CropInfo;
  consent_granted?: boolean; // Farmer consent state
}

export interface CardCredential {
  credential_id: string;
  parcel_id: string;
  farmer_display_name: string;
  district?: string;
  state?: string;
  issued_at: string; // ISO 8601 UTC
  score: ScoreResponse;
}

export interface IssueCardRequest {
  parcel_id: string;
  farmer_display_name?: string;
}

export interface IssueCardResponse {
  credential_id: string;
  card_url: string;
}

export interface ConsentUpdateRequest {
  parcel_id: string;
  consent_granted: boolean;
}

export interface ConsentUpdateResponse {
  parcel_id: string;
  consent_granted: boolean;
  updated_at: string;
}
