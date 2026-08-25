"""
FastAPI Route Endpoints for Antarctic Navigation Decision Support System.
Directly implements the authoritative API surface from Section 33 & Section 0.3.
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, timezone

from backend.app.models.schemas import (
    HealthResponse,
    EnvironmentResponse,
    Iceberg,
    IcebergListResponse,
    TrajectoryRequest,
    TrajectoryResponse,
    RiskGridRequest,
    RiskGridResponse,
    RouteGenerateRequest,
    RouteCompareResponse,
    RouteReplanRequest,
    RouteReplanResponse,
    SimulationStartRequest,
    SimulationStepRequest,
    SimulationStateResponse,
)
from backend.app.data.demo_data import ENV_DATA, INITIAL_ICEBERGS, DEMO_STATIONS, BOUNDS
from backend.app.prediction.hybrid_predictor import PREDICTOR
from backend.app.risk.risk_engine import RISK_ENGINE
from backend.app.routing.comparator import generate_candidate_routes
from backend.app.simulation.engine import SIM_ENGINE

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def get_health():
    return HealthResponse(
        status="ok",
        version="1.0.0",
        mode="DEMO_AND_LIVE",
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@router.get("/environment", response_model=EnvironmentResponse)
def get_environment():
    """Serves current environmental state, summary, stations, and active icebergs."""
    return ENV_DATA.get_full_response(SIM_ENGINE.icebergs)


@router.get("/icebergs", response_model=IcebergListResponse)
def get_icebergs():
    """Returns active iceberg registry."""
    return IcebergListResponse(count=len(SIM_ENGINE.icebergs), icebergs=SIM_ENGINE.icebergs)


@router.get("/icebergs/{iceberg_id}", response_model=Iceberg)
def get_iceberg_by_id(iceberg_id: str):
    """Returns specific iceberg telemetry."""
    for ib in SIM_ENGINE.icebergs:
        if ib.id.lower() == iceberg_id.lower():
            return ib
    raise HTTPException(status_code=404, detail=f"Iceberg with ID '{iceberg_id}' not found.")


@router.post("/predict/trajectory", response_model=TrajectoryResponse)
def predict_trajectory(req: TrajectoryRequest):
    """
    Computes hybrid physics + machine learning trajectory prediction with expanding
    uncertainty corridor.
    """
    return PREDICTOR.predict_trajectory(req)


@router.post("/risk/grid", response_model=RiskGridResponse)
def compute_risk_grid(req: RiskGridRequest):
    """
    Computes spatial navigation risk cost surface combining sea ice, iceberg hazards, and weather.
    """
    return RISK_ENGINE.compute_risk_grid(req, SIM_ENGINE.icebergs)


@router.post("/route/generate", response_model=RouteCompareResponse)
@router.post("/route/compare", response_model=RouteCompareResponse)
def generate_routes(req: RouteGenerateRequest):
    """
    Generates and compares 3 candidate routes (Shortest, Fuel Optimal, AI Recommended)
    using Multi-Objective A*.
    """
    return generate_candidate_routes(req, SIM_ENGINE.icebergs)


@router.post("/route/replan", response_model=RouteReplanResponse)
def replan_route(req: RouteReplanRequest):
    """
    Recalculates dynamic route from current vessel position avoiding newly detected hazards.
    """
    return SIM_ENGINE.replan_route(req)


@router.post("/simulation/start", response_model=SimulationStateResponse)
def start_simulation(req: Optional[SimulationStartRequest] = None):
    """Starts or resumes the time-based simulation clock."""
    speed = req.vessel_speed_knots if req else 12.0
    route_id = req.active_route_id if req else "ai_recommended"
    waypoints = req.waypoints if req else None
    SIM_ENGINE.start(vessel_speed_knots=speed, active_route_id=route_id, waypoints=waypoints)
    return SIM_ENGINE.step(step_minutes=0.0)


@router.post("/simulation/step", response_model=SimulationStateResponse)
def step_simulation(req: SimulationStepRequest):
    """Steps the simulation forward by step_minutes and advances vessel and iceberg physics."""
    return SIM_ENGINE.step(
        step_minutes=req.step_minutes,
        inject_hazard=req.inject_hazard_event,
        hazard_iceberg_id=req.hazard_iceberg_id or "A27",
    )


@router.post("/simulation/reset", response_model=SimulationStateResponse)
def reset_simulation():
    """Resets simulation clock, vessel, icebergs, and route to initial demo baseline."""
    SIM_ENGINE.reset()
    return SIM_ENGINE.step(step_minutes=0.0)


@router.get("/environment/sea_ice/grid")
def get_sea_ice_grid():
    """Returns serialized 2D sea-ice concentration grid for Cesium texture or polygon rendering."""
    return {
        "lats": ENV_DATA.lats.tolist(),
        "lons": ENV_DATA.lons.tolist(),
        "sic": ENV_DATA.sic_grid.tolist(),
        "bounds": BOUNDS,
    }


@router.get("/environment/ocean/grid")
def get_ocean_current_grid():
    """Returns ocean current U/V vector field."""
    return {
        "lats": ENV_DATA.lats.tolist(),
        "lons": ENV_DATA.lons.tolist(),
        "u_current": ENV_DATA.u_current.tolist(),
        "v_current": ENV_DATA.v_current.tolist(),
        "bounds": BOUNDS,
    }
