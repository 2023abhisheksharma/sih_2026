"""
Feature Engineering Pipeline for Hybrid Iceberg Trajectory ML Model.
Extracts metocean, temporal, and geometric features for residual error correction.
"""

from typing import List, Dict, Any, Tuple
import numpy as np
import pandas as pd

FEATURE_COLUMNS = [
    "u_curr",
    "v_curr",
    "curr_speed",
    "u_wind",
    "v_wind",
    "wind_speed",
    "sic",
    "temp_celsius",
    "length_km",
    "width_km",
    "draft_m",
    "prev_speed_mps",
    "prev_heading_deg",
    "sin_heading",
    "cos_heading",
    "lat_sin",
    "lon_cos",
]


def extract_features(
    u_curr: float,
    v_curr: float,
    u_wind: float,
    v_wind: float,
    sic: float,
    temp_c: float,
    length_km: float,
    width_km: float,
    draft_m: float,
    prev_speed: float,
    prev_heading: float,
    lat: float,
    lon: float,
) -> np.ndarray:
    """Extract a 1D feature vector for a single iceberg inference step."""
    curr_speed = np.sqrt(u_curr**2 + v_curr**2)
    wind_speed = np.sqrt(u_wind**2 + v_wind**2)
    heading_rad = np.radians(prev_heading)
    lat_rad = np.radians(lat)
    lon_rad = np.radians(lon)

    vec = [
        u_curr,
        v_curr,
        curr_speed,
        u_wind,
        v_wind,
        wind_speed,
        sic,
        temp_c,
        length_km,
        width_km,
        draft_m,
        prev_speed,
        prev_heading,
        np.sin(heading_rad),
        np.cos(heading_rad),
        np.sin(lat_rad),
        np.cos(lon_rad),
    ]
    return np.array(vec, dtype=np.float32).reshape(1, -1)
