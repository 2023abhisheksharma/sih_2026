"""
Navigation Risk Calculation Engine for Antarctic Decision Support.
Computes multi-hazard spatial risk grids combining POLARIS Sea-Ice, Iceberg proximity/trajectories,
Weather severity, and landmasks.
Adheres to Sections 17, 18, 40 of the specification.
"""

import math
from typing import List, Dict, Any, Tuple
import numpy as np

from backend.app.models.schemas import (
    RiskGridRequest,
    RiskGridResponse,
    RiskCell,
    Iceberg,
)
from backend.app.data.demo_data import ENV_DATA, BOUNDS, INITIAL_ICEBERGS
from backend.app.data.geo_utils import haversine_distance_km, is_land


class NavigationRiskEngine:
    """
    Evaluates spatial risk index (0 to 100) across polar navigation domain.
    """

    def __init__(
        self,
        w_sea_ice: float = 0.40,
        w_iceberg: float = 0.35,
        w_weather: float = 0.15,
        w_fuel: float = 0.10,
    ):
        self.w_sea_ice = w_sea_ice
        self.w_iceberg = w_iceberg
        self.w_weather = w_weather
        self.w_fuel = w_fuel

    def calculate_cell_risk(
        self,
        lat: float,
        lon: float,
        icebergs: List[Iceberg],
        safety_weight: float = 0.7,
        fuel_weight: float = 0.3,
    ) -> Tuple[float, float, float, float, bool]:
        """
        Calculates normalized risk breakdown for a single coordinate point (lat, lon).
        Returns (total_risk, sea_ice_risk, iceberg_risk, weather_risk, is_navigable).
        """
        # 1. Land constraint
        if is_land(lat, lon):
            return 100.0, 100.0, 0.0, 0.0, False

        env = ENV_DATA.get_environment_at(lat, lon)
        sic = env["sic"]
        wind_speed_mps = env["wind_speed_mps"]
        curr_speed_mps = env["current_speed_mps"]

        # 2. Sea-Ice Risk (POLARIS non-linear risk model)
        # Open water (<15%): Low risk (0-15)
        # Medium ice (15-60%): Moderate risk (15-50)
        # Pack ice (>80%): Severe structural hazard (70-100)
        if sic <= 0.15:
            sea_ice_risk = (sic / 0.15) * 15.0
        elif sic <= 0.60:
            sea_ice_risk = 15.0 + ((sic - 0.15) / 0.45) * 35.0
        else:
            # Quadratic growth in heavy pack ice
            sea_ice_risk = 50.0 + (((sic - 0.60) / 0.40) ** 1.8) * 50.0

        # Impassable condition if consolidated ice exceeds 92% for standard polar vessels
        if sic > 0.92:
            return 100.0, 100.0, 0.0, 0.0, False

        # 3. Iceberg Collision Hazard (Dynamic Potential Field)
        # Sum of Gaussian potential functions over all nearby icebergs
        iceberg_hazard_raw = 0.0
        for ib in icebergs:
            dist_km = haversine_distance_km(lat, lon, ib.lat, ib.lon)
            # Influence radius depends on iceberg size and drift speed
            sigma_km = max(3.0, (ib.length_km + ib.width_km) * 1.8 + (ib.drift_speed_mps * 5.0))
            if dist_km < 35.0:
                decay = math.exp(- (dist_km ** 2) / (2.0 * (sigma_km ** 2)))
                weight = 100.0 if ib.risk_level in ["HIGH", "CRITICAL"] else 55.0
                iceberg_hazard_raw += weight * decay

        iceberg_risk = min(100.0, iceberg_hazard_raw)

        # 4. Weather Risk (Wind + Adverse Currents)
        # Strong gale wind (>20 m/s ~ 40 knots) increases ship rolling and ice drift pressure
        wind_knots = wind_speed_mps * 1.94384
        wind_risk = min(100.0, (wind_knots / 35.0) ** 1.5 * 100.0)
        current_risk = min(100.0, (curr_speed_mps / 0.8) * 100.0)
        weather_risk = 0.7 * wind_risk + 0.3 * current_risk

        # 5. Composite Weighted Risk Index (0 to 100)
        # Dynamic blending with user safety/fuel priorities
        adj_w_ice = self.w_iceberg * (safety_weight / 0.5)
        adj_w_sic = self.w_sea_ice * (safety_weight / 0.5)
        adj_w_wth = self.w_weather * (fuel_weight / 0.5)

        total_weight = adj_w_ice + adj_w_sic + adj_w_wth
        norm_total = (
            adj_w_sic * sea_ice_risk +
            adj_w_ice * iceberg_risk +
            adj_w_wth * weather_risk
        ) / max(0.01, total_weight)

        total_risk = round(min(100.0, max(0.0, norm_total)), 1)
        is_navigable = total_risk < 95.0

        return total_risk, round(sea_ice_risk, 1), round(iceberg_risk, 1), round(weather_risk, 1), is_navigable

    def compute_risk_grid(
        self,
        req: RiskGridRequest,
        icebergs: List[Iceberg] = None,
    ) -> RiskGridResponse:
        """Computes a sampled spatial risk grid for API and 3D overlay rendering."""
        if icebergs is None:
            icebergs = INITIAL_ICEBERGS

        res = max(0.05, req.resolution_deg)
        lats = np.arange(req.min_lat, req.max_lat + res * 0.5, res)
        lons = np.arange(req.min_lon, req.max_lon + res * 0.5, res)

        cells: List[RiskCell] = []
        all_risks: List[float] = []

        for lat in lats:
            for lon in lons:
                tot, sic_r, ib_r, wth_r, nav = self.calculate_cell_risk(
                    float(lat),
                    float(lon),
                    icebergs,
                    safety_weight=req.safety_weight,
                    fuel_weight=req.fuel_weight,
                )
                cells.append(
                    RiskCell(
                        lat=round(float(lat), 4),
                        lon=round(float(lon), 4),
                        total_risk=tot,
                        sea_ice_risk=sic_r,
                        iceberg_risk=ib_r,
                        weather_risk=wth_r,
                        is_navigable=nav,
                    )
                )
                if nav:
                    all_risks.append(tot)

        return RiskGridResponse(
            grid_shape=[len(lats), len(lons)],
            bounds={
                "min_lat": req.min_lat,
                "max_lat": req.max_lat,
                "min_lon": req.min_lon,
                "max_lon": req.max_lon,
            },
            resolution_deg=res,
            cells_sample=cells,
            max_risk=float(max(all_risks)) if all_risks else 100.0,
            mean_risk=round(float(np.mean(all_risks)), 1) if all_risks else 50.0,
        )


RISK_ENGINE = NavigationRiskEngine()
