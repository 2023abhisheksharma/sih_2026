export interface GeoPoint {
  lat: number;
  lon: number;
}

export interface ResearchStation {
  id: string;
  name: string;
  lat: number;
  lon: number;
  country: string;
  elevation_m: number;
}

export interface Iceberg {
  id: string;
  name: string;
  lat: number;
  lon: number;
  length_km: number;
  width_km: number;
  draft_m: number;
  drift_speed_mps: number;
  drift_heading_deg: number;
  prediction_confidence: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  source_type: 'REAL_HISTORICAL' | 'SATELLITE_DERIVED' | 'SIMULATED';
  last_updated: string;
}

export interface TrajectoryPoint {
  hour: number;
  lat: number;
  lon: number;
  speed_mps: number;
  heading_deg: number;
  timestamp: string;
}

export interface TrajectoryUncertainty {
  hour: number;
  radius_km: number;
  confidence_pct: number;
  semi_major_km: number;
  semi_minor_km: number;
  orientation_deg: number;
}

export interface TrajectoryResponse {
  iceberg_id: string;
  model_type: string;
  horizon_hours: number;
  trajectory: TrajectoryPoint[];
  uncertainty: TrajectoryUncertainty[];
  evaluation_mae_km: Record<string, number>;
}

export interface EnvironmentalSummary {
  region_name: string;
  bounds: {
    min_lat: number;
    max_lat: number;
    min_lon: number;
    max_lon: number;
  };
  mean_sea_ice_concentration: number;
  mean_wind_speed_knots: number;
  mean_ocean_current_mps: number;
  surface_temp_celsius: number;
  active_icebergs_count: number;
  high_risk_icebergs_count: number;
  timestamp: string;
}

export interface EnvironmentResponse {
  summary: EnvironmentalSummary;
  stations: ResearchStation[];
  icebergs: Iceberg[];
  sea_ice_layer_url: string;
  ocean_current_layer_url: string;
  wind_layer_url: string;
}

export interface RouteWaypoint {
  lat: number;
  lon: number;
  cumulative_distance_km: number;
  segment_speed_knots: number;
  eta_hours: number;
  local_risk: number;
  sea_ice_conc: number;
}

export interface RouteExplanation {
  primary_reason: string;
  predicted_iceberg_risk_pct: number;
  sea_ice_exposure_pct: number;
  fuel_cost_pct: number;
  weather_exposure_pct: number;
  key_factors: string[];
}

export interface RouteOption {
  route_id: string;
  name: string;
  description: string;
  distance_km: number;
  estimated_fuel_liters: number;
  travel_time_hours: number;
  travel_time_formatted: string;
  average_risk_score: number;
  max_risk_score: number;
  is_recommended: boolean;
  waypoints: RouteWaypoint[];
  explanation?: RouteExplanation;
}

export interface RouteCompareResponse {
  vessel: string;
  start: GeoPoint;
  destination: GeoPoint;
  routes: RouteOption[];
  recommended_route_id: string;
}

export interface HazardAlert {
  hazard_type: string;
  iceberg_id: string;
  iceberg_name: string;
  distance_km: number;
  estimated_intercept_hours: number;
  corridor_risk_score: number;
  message: string;
}

export interface SimulationState {
  simulation_time: string;
  elapsed_hours: number;
  is_running: boolean;
  vessel_position: GeoPoint;
  vessel_heading_deg: number;
  vessel_speed_knots: number;
  vessel_progress_pct: number;
  current_route_id: string;
  icebergs: Iceberg[];
  current_risk_score: number;
  active_hazard_alert?: HazardAlert | null;
  replan_required: boolean;
}

export interface LayerVisibility {
  seaIce: boolean;
  icebergs: boolean;
  trajectories: boolean;
  riskSurface: boolean;
  routes: boolean;
  vessel: boolean;
  stations: boolean;
  oceanCurrents: boolean;
}
