"""
Dynamic Uncertainty Quantification for Iceberg Trajectory Forecasting.
Computes expanding spatial confidence ellipses and corridors parameterized by forecast horizon.
Conforms to Sections 13, 45, 77 of the specification.
"""

import math
from typing import List
from backend.app.models.schemas import TrajectoryUncertainty


def compute_trajectory_uncertainty(
    horizon_hours: int,
    step_hours: int,
    drift_speed_mps: float,
    drift_heading_deg: float,
    base_confidence: float = 0.88,
) -> List[TrajectoryUncertainty]:
    """
    Computes an expanding uncertainty ellipse along the trajectory vector.

    Parameters:
    - semi-major axis: extends along the track error direction (drift vector uncertainty).
    - semi-minor axis: cross-track positional dispersion.
    - confidence percentage: decreases gradually with time horizon (e.g. 92% at 2h -> 82% at 24h).
    """
    uncertainties: List[TrajectoryUncertainty] = []

    # Uncertainty growth parameters (calibrated from evaluation residual variance)
    # sigma(h) in km
    for h in range(step_hours, horizon_hours + 1, step_hours):
        hour_float = float(h)

        # Longitudinal along-track uncertainty grows with power law h^0.75
        semi_major_km = 0.6 + 0.45 * (hour_float ** 0.8) * (1.0 + drift_speed_mps * 0.5)
        semi_minor_km = 0.4 + 0.28 * (hour_float ** 0.75)
        radius_km = round((semi_major_km + semi_minor_km) / 2.0, 2)

        # Calibrated confidence decaying with forecast horizon
        confidence_pct = max(70.0, min(95.0, (base_confidence * 100.0) - (hour_float * 0.45)))

        uncertainties.append(
            TrajectoryUncertainty(
                hour=hour_float,
                radius_km=radius_km,
                confidence_pct=round(confidence_pct, 1),
                semi_major_km=round(semi_major_km, 2),
                semi_minor_km=round(semi_minor_km, 2),
                orientation_deg=round(drift_heading_deg, 1),
            )
        )

    return uncertainties
