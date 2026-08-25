"""
Automated Test Suite for Antarctic Navigation Decision Support System.
Tests Geospatial calculations, ML inference, Risk engine, A* routing, Simulation, and API endpoints.
Conforms to Section 42 of the specification.
"""

import pytest
import math
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.data.geo_utils import (
    haversine_distance_km,
    calculate_bearing_deg,
    destination_point,
    is_land,
)
from backend.app.data.demo_data import ENV_DATA, INITIAL_ICEBERGS
from backend.app.prediction.physics_drift import calculate_physics_drift_velocity
from backend.app.prediction.hybrid_predictor import PREDICTOR
from backend.app.prediction.uncertainty import compute_trajectory_uncertainty
from backend.app.models.schemas import TrajectoryRequest, GeoPoint, RouteGenerateRequest, RiskGridRequest, RouteReplanRequest
from backend.app.risk.risk_engine import RISK_ENGINE
from backend.app.routing.astar_router import ROUTER
from backend.app.routing.comparator import generate_candidate_routes
from backend.app.simulation.engine import SIM_ENGINE

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["mode"] == "DEMO_AND_LIVE"


def test_haversine_distance():
    # Distance between King George Island (-62.19, -58.98) and Esperanza Base (-63.39, -56.99)
    d = haversine_distance_km(-62.19, -58.98, -63.39, -56.99)
    assert 160.0 < d < 200.0


def test_bearing_calculation():
    # Due South bearing should be 180 deg
    bearing = calculate_bearing_deg(-62.0, -58.0, -64.0, -58.0)
    assert abs(bearing - 180.0) < 1.0


def test_destination_point():
    lat1, lon1 = -64.0, -60.0
    dist_km = 50.0
    bearing = 90.0  # East
    lat2, lon2 = destination_point(lat1, lon1, dist_km, bearing)
    assert abs(lat2 - lat1) < 0.2
    assert lon2 > lon1


def test_landmask():
    # Interior spine should be marked land
    assert is_land(-65.5, -61.0) is True
    # Drake passage open ocean should NOT be land
    assert is_land(-62.0, -60.0) is False


def test_physics_drift():
    u_ice, v_ice = calculate_physics_drift_velocity(
        u_curr=0.20,
        v_curr=0.15,
        u_wind=10.0,
        v_wind=5.0,
        sic=0.30,
    )
    # Drift velocity must be positive and physically bounded (< 1.5 m/s)
    speed = math.sqrt(u_ice**2 + v_ice**2)
    assert 0.1 < speed < 1.0


def test_ml_hybrid_trajectory_prediction():
    req = TrajectoryRequest(iceberg_id="A27", horizon_hours=24, step_hours=6)
    res = PREDICTOR.predict_trajectory(req)
    assert res.iceberg_id == "A27"
    assert len(res.trajectory) == 5  # t=0, 6, 12, 18, 24
    assert len(res.uncertainty) == 4  # t=6, 12, 18, 24
    # Check uncertainty grows with time
    assert res.uncertainty[-1].radius_km > res.uncertainty[0].radius_km


def test_risk_grid_computation():
    # At target iceberg A27 coordinate, iceberg risk is 100.0 and total risk is elevated (>50.0)
    tot_risk, sic_r, ib_r, wth_r, is_nav = RISK_ENGINE.calculate_cell_risk(-64.21, -57.82, INITIAL_ICEBERGS)
    assert tot_risk > 50.0
    assert ib_r == 100.0
    assert is_nav is True

    # Open water channel near King George Island has 0 iceberg risk and low total risk (<20.0)
    tot_risk_open, _, ib_r_open, _, is_nav_open = RISK_ENGINE.calculate_cell_risk(-62.20, -59.50, INITIAL_ICEBERGS)
    assert tot_risk_open < 20.0
    assert ib_r_open == 0.0
    assert is_nav_open is True


def test_astar_route_generation():
    req = RouteGenerateRequest(
        vessel_name="R/V POLARIS",
        start=GeoPoint(lat=-62.30, lon=-59.20),
        destination=GeoPoint(lat=-64.50, lon=-62.50),
        vessel_speed_knots=12.0,
        safety_priority=0.7,
        fuel_priority=0.3,
    )
    comp = generate_candidate_routes(req, INITIAL_ICEBERGS)
    assert len(comp.routes) == 3
    route_ids = [r.route_id for r in comp.routes]
    assert "shortest" in route_ids
    assert "fuel_optimal" in route_ids
    assert "ai_recommended" in route_ids

    # AI Recommended should have lower risk than shortest
    ai_route = next(r for r in comp.routes if r.route_id == "ai_recommended")
    shortest_route = next(r for r in comp.routes if r.route_id == "shortest")
    assert ai_route.average_risk_score <= shortest_route.average_risk_score + 1.0


def test_simulation_stepping_and_replanning():
    SIM_ENGINE.reset()
    state = SIM_ENGINE.step(step_minutes=60.0, inject_hazard=True, hazard_iceberg_id="A27")
    assert state.elapsed_hours == 1.0
    assert state.replan_required is True
    assert state.active_hazard_alert is not None

    # Test Replan
    replan_req = RouteReplanRequest(
        vessel_name="R/V POLARIS",
        current_position=state.vessel_position,
        destination=GeoPoint(lat=-64.77, lon=-64.05),
        current_time_hours=1.0,
    )
    replan_res = SIM_ENGINE.replan_route(replan_req)
    assert replan_res.hazard_detected is True
    assert replan_res.new_risk_score < replan_res.previous_risk_score
    assert len(replan_res.replanned_route.waypoints) > 2


def test_api_integration():
    # 1. Environment
    res_env = client.get("/environment")
    assert res_env.status_code == 200
    assert len(res_env.json()["stations"]) > 0

    # 2. Icebergs
    res_ib = client.get("/icebergs")
    assert res_ib.status_code == 200
    assert res_ib.json()["count"] > 0

    # 3. Predict Trajectory
    res_pred = client.post("/predict/trajectory", json={"iceberg_id": "A27", "horizon_hours": 12, "step_hours": 6})
    assert res_pred.status_code == 200
    assert len(res_pred.json()["trajectory"]) == 3

    # 4. Route Compare
    res_route = client.post(
        "/route/compare",
        json={
            "vessel_name": "R/V POLARIS",
            "start": {"lat": -62.30, "lon": -59.20},
            "destination": {"lat": -64.50, "lon": -62.50},
            "vessel_speed_knots": 12.0,
        },
    )
    assert res_route.status_code == 200
    assert len(res_route.json()["routes"]) == 3
