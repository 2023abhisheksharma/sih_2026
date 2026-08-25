"""
Physics-Based Lagrangian Iceberg Drift Solver for Southern Ocean & Antarctica.
Computes deterministic metocean baseline drift using coupled hydrodynamic and atmospheric drag equations.
Adheres to Sections 10, 11, 12, 76, 78 of the specification.
"""

import math
from typing import Tuple, Dict, Any

EARTH_RADIUS_M = 6371008.8


def calculate_physics_drift_velocity(
    u_curr: float,
    v_curr: float,
    u_wind: float,
    v_wind: float,
    sic: float,
    length_km: float = 2.0,
    width_km: float = 1.5,
    draft_m: float = 200.0,
) -> Tuple[float, float]:
    """
    Computes theoretical iceberg velocity (u_ice, v_ice) in m/s from metocean inputs.

    Governing physics:
    1. Ocean current drag: Submerged keel experiences primary drag (90-95% transfer ratio).
    2. Wind drag: Above-water sail experiences ~2.0% transfer ratio, deflected ~25° to the left
       due to Southern Hemisphere Coriolis acceleration.
    3. Sea-ice pack resistance: High sea ice concentration (>80-85%) locks iceberg into the ice pack,
       reducing wind influence and aligning velocity with sea-ice matrix drift.
    """
    # 1. Ocean current baseline
    alpha_w = 0.94

    # 2. Wind drag calculation with Southern Hemisphere Coriolis deflection
    alpha_a = 0.021  # 2.1% of 10m wind speed
    theta_coriolis_rad = math.radians(-25.0)  # Deflected to the left in Southern Hemisphere

    # Rotate wind vector by Coriolis deflection angle
    u_wind_deflected = u_wind * math.cos(theta_coriolis_rad) - v_wind * math.sin(theta_coriolis_rad)
    v_wind_deflected = u_wind * math.sin(theta_coriolis_rad) + v_wind * math.cos(theta_coriolis_rad)

    # 3. Sea ice dampening factor (sigmoid transition at 80% SIC)
    # High SIC reduces independent wind sail effect
    sea_ice_lock = 1.0 / (1.0 + math.exp(-15.0 * (sic - 0.80)))
    wind_weight = (1.0 - 0.75 * sea_ice_lock)

    # 4. Draft & mass scaling (larger icebergs feel deeper ocean currents and less wind)
    aspect_ratio = min(1.0, 150.0 / max(50.0, draft_m))
    effective_wind_coeff = alpha_a * aspect_ratio * wind_weight

    u_ice = alpha_w * u_curr + effective_wind_coeff * u_wind_deflected
    v_ice = alpha_w * v_curr + effective_wind_coeff * v_wind_deflected

    return u_ice, v_ice


def velocity_to_delta_deg(lat: float, u_mps: float, v_mps: float, dt_seconds: float) -> Tuple[float, float]:
    """
    Converts velocity in m/s over time interval dt_seconds into delta latitude and delta longitude degrees.
    Accurately accounts for convergence of meridians in high polar latitudes.
    """
    # North-South distance -> Delta Latitude
    delta_lat_rad = (v_mps * dt_seconds) / EARTH_RADIUS_M
    delta_lat_deg = math.degrees(delta_lat_rad)

    # East-West distance -> Delta Longitude (divided by cos(lat))
    lat_rad = math.radians(lat)
    cos_lat = max(0.01, abs(math.cos(lat_rad)))  # Prevent division by zero near South Pole
    delta_lon_rad = (u_mps * dt_seconds) / (EARTH_RADIUS_M * cos_lat)
    delta_lon_deg = math.degrees(delta_lon_rad)

    return delta_lat_deg, delta_lon_deg
