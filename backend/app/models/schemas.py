"""
Pydantic Schemas for Antarctic Navigation Decision Support System
Authoritative API Contracts defined in Section 33 & Section 0.3 of Specification.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime


class HealthResponse(BaseModel):
    status: str = "ok"
    version: str = "1.0.0"
    mode: str = "DEMO_AND_LIVE"
    timestamp: str


class GeoPoint(BaseModel):
    lat: float = Field(..., ge=-90.0, le=-60.0, description="Latitude in Antarctica region")
    lon: float = Field(..., ge=-180.0, le=180.0, description="Longitude")


class ResearchStation(BaseModel):
    id: str
    name: str
    lat: float
    lon: float
    country: str
    elevation_m: float = 0.0


class Iceberg(BaseModel):
    id: str
    name: str
    lat: float
    lon: float
    length_km: float
    width_km: float
    draft_m: float = 180.0
    drift_speed_mps: float
    drift_heading_deg: float
    prediction_confidence: float = 0.85
    risk_level: str = "MEDIUM"  # LOW, MEDIUM, HIGH, CRITICAL
    source_type: str = "REAL_HISTORICAL"  # REAL_HISTORICAL, SATELLITE_DERIVED, SIMULATED
    last_updated: str


class IcebergListResponse(BaseModel):
    count: int
    icebergs: List[Iceberg]


class TrajectoryRequest(BaseModel):
    iceberg_id: str
    horizon_hours: int = Field(default=24, ge=1, le=72)
    step_hours: int = Field(default=2, ge=1, le=12)


class TrajectoryPoint(BaseModel):
    hour: float
    lat: float
    lon: float
    speed_mps: float
    heading_deg: float
    timestamp: str


class TrajectoryUncertainty(BaseModel):
    hour: float
    radius_km: float
    confidence_pct: float
    semi_major_km: float
    semi_minor_km: float
    orientation_deg: float


class TrajectoryResponse(BaseModel):
    iceberg_id: str
    model_type: str = "PHYSICS_ML_HYBRID"
    horizon_hours: int
    trajectory: List[TrajectoryPoint]
    uncertainty: List[TrajectoryUncertainty]
    evaluation_mae_km: Dict[str, float] = Field(
        default_factory=lambda: {"6h": 1.85, "12h": 2.74, "24h": 5.21}
    )


class EnvironmentalSummary(BaseModel):
    region_name: str = "Antarctic Peninsula & Weddell Sea"
    bounds: Dict[str, float] = Field(
        default_factory=lambda: {
            "min_lat": -68.0,
            "max_lat": -62.0,
            "min_lon": -66.0,
            "max_lon": -52.0,
        }
    )
    mean_sea_ice_concentration: float
    mean_wind_speed_knots: float
    mean_ocean_current_mps: float
    surface_temp_celsius: float
    active_icebergs_count: int
    high_risk_icebergs_count: int
    timestamp: str


class EnvironmentResponse(BaseModel):
    summary: EnvironmentalSummary
    stations: List[ResearchStation]
    icebergs: List[Iceberg]
    sea_ice_layer_url: str = "/environment/sea_ice/grid"
    ocean_current_layer_url: str = "/environment/ocean/grid"
    wind_layer_url: str = "/environment/weather/grid"


class RiskGridRequest(BaseModel):
    min_lat: float = -68.0
    max_lat: float = -62.0
    min_lon: float = -66.0
    max_lon: float = -52.0
    resolution_deg: float = 0.05
    time_offset_hours: float = 0.0
    safety_weight: float = 0.6
    fuel_weight: float = 0.4


class RiskCell(BaseModel):
    lat: float
    lon: float
    total_risk: float  # 0 to 100
    sea_ice_risk: float
    iceberg_risk: float
    weather_risk: float
    is_navigable: bool


class RiskGridResponse(BaseModel):
    grid_shape: List[int]
    bounds: Dict[str, float]
    resolution_deg: float
    cells_sample: List[RiskCell]
    max_risk: float
    mean_risk: float


class RouteWaypoint(BaseModel):
    lat: float
    lon: float
    cumulative_distance_km: float
    segment_speed_knots: float
    eta_hours: float
    local_risk: float
    sea_ice_conc: float


class RouteExplanation(BaseModel):
    primary_reason: str
    predicted_iceberg_risk_pct: float
    sea_ice_exposure_pct: float
    fuel_cost_pct: float
    weather_exposure_pct: float
    key_factors: List[str]


class RouteOption(BaseModel):
    route_id: str  # "shortest", "fuel_optimal", "ai_recommended"
    name: str
    description: str
    distance_km: float
    estimated_fuel_liters: float
    travel_time_hours: float
    travel_time_formatted: str
    average_risk_score: float  # 0 to 100
    max_risk_score: float
    is_recommended: bool = False
    waypoints: List[RouteWaypoint]
    explanation: Optional[RouteExplanation] = None


class RouteGenerateRequest(BaseModel):
    vessel_name: str = "R/V POLARIS"
    vessel_ice_class: str = "PC6"
    vessel_speed_knots: float = Field(default=12.0, ge=4.0, le=22.0)
    start: GeoPoint
    destination: GeoPoint
    safety_priority: float = Field(default=0.7, ge=0.0, le=1.0)
    fuel_priority: float = Field(default=0.3, ge=0.0, le=1.0)
    departure_time: Optional[str] = None


class RouteCompareResponse(BaseModel):
    vessel: str
    start: GeoPoint
    destination: GeoPoint
    routes: List[RouteOption]
    recommended_route_id: str = "ai_recommended"


class RouteReplanRequest(BaseModel):
    vessel_name: str = "R/V POLARIS"
    current_position: GeoPoint
    destination: GeoPoint
    current_time_hours: float
    current_active_route_id: str = "ai_recommended"
    hazard_iceberg_id: Optional[str] = None


class RouteReplanResponse(BaseModel):
    hazard_detected: bool
    trigger_reason: str
    previous_risk_score: float
    new_risk_score: float
    additional_distance_km: float
    estimated_fuel_delta_liters: float
    time_delta_hours: float
    replanned_route: RouteOption
    explanation: RouteExplanation


class SimulationStartRequest(BaseModel):
    scenario_id: str = "standard_antarctic_transit"
    start_time: Optional[str] = None
    vessel_speed_knots: float = 12.0
    active_route_id: str = "ai_recommended"
    waypoints: Optional[List[RouteWaypoint]] = None


class SimulationStepRequest(BaseModel):
    step_minutes: float = Field(default=30.0, ge=1.0, le=360.0)
    inject_hazard_event: bool = False
    hazard_iceberg_id: Optional[str] = "A27"


class SimulationStateResponse(BaseModel):
    simulation_time: str
    elapsed_hours: float
    is_running: bool
    vessel_position: GeoPoint
    vessel_heading_deg: float
    vessel_speed_knots: float
    vessel_progress_pct: float
    current_route_id: str
    icebergs: List[Iceberg]
    current_risk_score: float
    active_hazard_alert: Optional[Dict[str, Any]] = None
    replan_required: bool = False
