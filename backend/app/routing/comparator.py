"""
Route Comparison & Candidate Generation Engine.
Calculates three distinct candidate routes (Shortest, Fuel Optimal, AI Recommended)
and evaluates trade-offs across distance, fuel, time, and safety.
Conforms to Sections 19, 20, 22, 23 of the specification.
"""

from typing import List, Dict, Any, Tuple
import math

from backend.app.models.schemas import (
    RouteGenerateRequest,
    RouteCompareResponse,
    RouteOption,
    RouteWaypoint,
    Iceberg,
)
from backend.app.routing.astar_router import ROUTER
from backend.app.routing.fuel_model import (
    estimate_segment_fuel_liters,
    calculate_speed_in_ice,
)
from backend.app.routing.explainer import generate_route_explanation
from backend.app.data.demo_data import ENV_DATA, INITIAL_ICEBERGS
from backend.app.data.geo_utils import haversine_distance_km
from backend.app.risk.risk_engine import RISK_ENGINE


def _build_route_option(
    route_id: str,
    name: str,
    description: str,
    raw_points: List[Tuple[float, float, float, float, float]],
    base_speed_knots: float,
    icebergs: List[Iceberg],
    is_recommended: bool = False,
) -> RouteOption:
    """Builds typed RouteOption with full waypoint telemetry."""
    waypoints: List[RouteWaypoint] = []
    cumulative_dist_km = 0.0
    total_fuel_liters = 0.0
    cumulative_time_hours = 0.0
    risks: List[float] = []

    for i, pt in enumerate(raw_points):
        lat, lon = pt[0], pt[1]
        env = ENV_DATA.get_environment_at(lat, lon)
        sic = env["sic"]
        tot_risk, _, _, _, _ = RISK_ENGINE.calculate_cell_risk(lat, lon, icebergs)
        risks.append(tot_risk)

        if i == 0:
            segment_dist = 0.0
            segment_speed = base_speed_knots
        else:
            prev_lat, prev_lon = raw_points[i - 1][0], raw_points[i - 1][1]
            segment_dist = haversine_distance_km(prev_lat, prev_lon, lat, lon)
            cumulative_dist_km += segment_dist
            segment_speed = calculate_speed_in_ice(base_speed_knots, sic)
            segment_time = segment_dist / max(1.0, segment_speed * 1.852)
            cumulative_time_hours += segment_time
            segment_fuel = estimate_segment_fuel_liters(segment_dist, segment_speed, sic)
            total_fuel_liters += segment_fuel

        waypoints.append(
            RouteWaypoint(
                lat=round(lat, 5),
                lon=round(lon, 5),
                cumulative_distance_km=round(cumulative_dist_km, 2),
                segment_speed_knots=round(segment_speed, 1),
                eta_hours=round(cumulative_time_hours, 2),
                local_risk=round(tot_risk, 1),
                sea_ice_conc=round(sic, 3),
            )
        )

    avg_risk = float(sum(risks) / max(1, len(risks)))
    max_risk = float(max(risks)) if risks else 50.0

    hours_int = int(cumulative_time_hours)
    minutes_int = int((cumulative_time_hours - hours_int) * 60)
    formatted_time = f"{hours_int}h {minutes_int:02d}m"

    explanation = generate_route_explanation(
        route_id=route_id,
        waypoints=waypoints,
        icebergs=icebergs,
        avg_risk=avg_risk,
        fuel_liters=total_fuel_liters,
        distance_km=cumulative_dist_km,
    )

    return RouteOption(
        route_id=route_id,
        name=name,
        description=description,
        distance_km=round(cumulative_dist_km, 1),
        estimated_fuel_liters=round(total_fuel_liters, 0),
        travel_time_hours=round(cumulative_time_hours, 2),
        travel_time_formatted=formatted_time,
        average_risk_score=round(avg_risk, 1),
        max_risk_score=round(max_risk, 1),
        is_recommended=is_recommended,
        waypoints=waypoints,
        explanation=explanation,
    )


def generate_candidate_routes(
    req: RouteGenerateRequest,
    icebergs: List[Iceberg] = None,
) -> RouteCompareResponse:
    if icebergs is None:
        icebergs = INITIAL_ICEBERGS

    # 1. Route A: Shortest (Heavy weight on distance, low on risk & fuel)
    raw_shortest = ROUTER.find_path(
        start=req.start,
        goal=req.destination,
        icebergs=icebergs,
        w_dist=0.85,
        w_fuel=0.05,
        w_risk=0.05,
        w_time=0.05,
        base_speed_knots=req.vessel_speed_knots,
    )
    route_shortest = _build_route_option(
        route_id="shortest",
        name="Route A — Shortest",
        description="Direct geodesic path. Minimizes distance but incurs higher sea-ice resistance and hazard exposure.",
        raw_points=raw_shortest,
        base_speed_knots=req.vessel_speed_knots,
        icebergs=icebergs,
        is_recommended=False,
    )

    # 2. Route B: Fuel Optimized (High weight on fuel & current, low on risk)
    raw_fuel = ROUTER.find_path(
        start=req.start,
        goal=req.destination,
        icebergs=icebergs,
        w_dist=0.20,
        w_fuel=0.70,
        w_risk=0.05,
        w_time=0.05,
        base_speed_knots=req.vessel_speed_knots,
    )
    route_fuel = _build_route_option(
        route_id="fuel_optimal",
        name="Route B — Fuel Optimized",
        description="Seeks open water leads and favorable currents to minimize engine load and fuel consumption.",
        raw_points=raw_fuel,
        base_speed_knots=req.vessel_speed_knots,
        icebergs=icebergs,
        is_recommended=False,
    )

    # 3. Route C: AI Recommended (Multi-objective Pareto optimal with safety priority)
    # Blend user priorities
    w_safe = max(0.3, req.safety_priority)
    w_fl = max(0.2, req.fuel_priority)
    raw_ai = ROUTER.find_path(
        start=req.start,
        goal=req.destination,
        icebergs=icebergs,
        w_dist=0.20,
        w_fuel=w_fl * 0.35,
        w_risk=w_safe * 0.55,
        w_time=0.10,
        base_speed_knots=req.vessel_speed_knots,
    )
    route_ai = _build_route_option(
        route_id="ai_recommended",
        name="Route C — AI Recommended",
        description="Pareto-optimal safety route. Actively steers clear of predicted iceberg uncertainty cones while maintaining efficiency.",
        raw_points=raw_ai,
        base_speed_knots=req.vessel_speed_knots,
        icebergs=icebergs,
        is_recommended=True,
    )

    return RouteCompareResponse(
        vessel=req.vessel_name,
        start=req.start,
        destination=req.destination,
        routes=[route_shortest, route_fuel, route_ai],
        recommended_route_id="ai_recommended",
    )
