"""
Multi-Objective A* Polar Navigation Router.
Computes optimal Pareto navigation routes through dynamic risk and ice resistance grids.
Adheres to Sections 19, 20, 22, 40 of the specification.
"""

import heapq
import math
from typing import List, Dict, Any, Tuple, Optional, Set
import numpy as np

from backend.app.models.schemas import (
    GeoPoint,
    RouteOption,
    RouteWaypoint,
    Iceberg,
)
from backend.app.data.geo_utils import (
    haversine_distance_km,
    calculate_bearing_deg,
    is_land,
)
from backend.app.data.demo_data import ENV_DATA, BOUNDS, INITIAL_ICEBERGS
from backend.app.risk.risk_engine import RISK_ENGINE
from backend.app.routing.fuel_model import (
    estimate_segment_fuel_liters,
    calculate_speed_in_ice,
)


class AStarPolarRouter:
    def __init__(self, grid_resolution_deg: float = 0.08):
        self.res = grid_resolution_deg
        self.lats = np.arange(BOUNDS["min_lat"], BOUNDS["max_lat"] + self.res * 0.5, self.res)
        self.lons = np.arange(BOUNDS["min_lon"], BOUNDS["max_lon"] + self.res * 0.5, self.res)

    def _coord_to_idx(self, lat: float, lon: float) -> Tuple[int, int]:
        lat_idx = int(round((lat - BOUNDS["min_lat"]) / self.res))
        lon_idx = int(round((lon - BOUNDS["min_lon"]) / self.res))
        lat_idx = max(0, min(len(self.lats) - 1, lat_idx))
        lon_idx = max(0, min(len(self.lons) - 1, lon_idx))
        return lat_idx, lon_idx

    def _idx_to_coord(self, lat_idx: int, lon_idx: int) -> Tuple[float, float]:
        return float(self.lats[lat_idx]), float(self.lons[lon_idx])

    def find_path(
        self,
        start: GeoPoint,
        goal: GeoPoint,
        icebergs: List[Iceberg],
        w_dist: float,
        w_fuel: float,
        w_risk: float,
        w_time: float,
        base_speed_knots: float = 12.0,
    ) -> List[Tuple[float, float, float, float, float]]:
        """
        Executes Multi-Objective A* search.
        Returns list of (lat, lon, segment_dist_km, segment_fuel_l, local_risk).
        """
        start_idx = self._coord_to_idx(start.lat, start.lon)
        goal_idx = self._coord_to_idx(goal.lat, goal.lon)

        # 8-connectivity grid neighbor offsets
        neighbors_offsets = [
            (-1, 0), (1, 0), (0, -1), (0, 1),
            (-1, -1), (-1, 1), (1, -1), (1, 1),
            (-2, -1), (-2, 1), (2, -1), (2, 1), (-1, -2), (1, -2), (-1, 2), (1, 2)
        ]

        # Priority queue: (f_score, g_score, current_node_idx)
        open_set = []
        heapq.heappush(open_set, (0.0, 0.0, start_idx))

        came_from: Dict[Tuple[int, int], Tuple[int, int]] = {}
        g_score: Dict[Tuple[int, int], float] = {start_idx: 0.0}
        visited: Set[Tuple[int, int]] = set()

        goal_lat, goal_lon = goal.lat, goal.lon

        while open_set:
            _, current_g, current = heapq.heappop(open_set)

            if current in visited:
                continue
            visited.add(current)

            curr_lat, curr_lon = self._idx_to_coord(current[0], current[1])

            # Check termination
            if current == goal_idx or haversine_distance_km(curr_lat, curr_lon, goal_lat, goal_lon) < 15.0:
                # Reconstruct path
                path_indices = [current]
                while current in came_from:
                    current = came_from[current]
                    path_indices.append(current)
                path_indices.reverse()

                # Build full waypoints
                result = []
                # Include exact start point
                result.append((start.lat, start.lon, 0.0, 0.0, 10.0))

                for idx in path_indices:
                    plat, plon = self._idx_to_coord(idx[0], idx[1])
                    if haversine_distance_km(plat, plon, start.lat, start.lon) > 5.0 and haversine_distance_km(plat, plon, goal.lat, goal.lon) > 5.0:
                        tot_r, _, _, _, _ = RISK_ENGINE.calculate_cell_risk(plat, plon, icebergs)
                        result.append((plat, plon, 0.0, 0.0, tot_r))

                # Include exact goal point
                tot_r_goal, _, _, _, _ = RISK_ENGINE.calculate_cell_risk(goal.lat, goal.lon, icebergs)
                result.append((goal.lat, goal.lon, 0.0, 0.0, tot_r_goal))

                return result

            # Explore neighbors
            for d_lat, d_lon in neighbors_offsets:
                n_lat_idx = current[0] + d_lat
                n_lon_idx = current[1] + d_lon

                if 0 <= n_lat_idx < len(self.lats) and 0 <= n_lon_idx < len(self.lons):
                    neighbor = (n_lat_idx, n_lon_idx)
                    if neighbor in visited:
                        continue

                    n_lat, n_lon = self._idx_to_coord(n_lat_idx, n_lon_idx)

                    # Check land and cell navigability
                    tot_risk, sic_r, ib_r, wth_r, is_nav = RISK_ENGINE.calculate_cell_risk(
                        n_lat, n_lon, icebergs, safety_weight=w_risk, fuel_weight=w_fuel
                    )
                    if not is_nav:
                        continue

                    step_dist_km = haversine_distance_km(curr_lat, curr_lon, n_lat, n_lon)
                    env = ENV_DATA.get_environment_at(n_lat, n_lon)
                    step_fuel = estimate_segment_fuel_liters(step_dist_km, base_speed_knots, env["sic"])
                    actual_speed = calculate_speed_in_ice(base_speed_knots, env["sic"])
                    step_time_hours = step_dist_km / max(1.0, actual_speed * 1.852)

                    # Multi-Objective Edge Cost
                    # J = w_dist*dist + w_fuel*fuel_cost + w_risk*risk_factor + w_time*time
                    edge_cost = (
                        w_dist * step_dist_km +
                        w_fuel * (step_fuel * 0.08) +
                        w_risk * (tot_risk * step_dist_km * 0.45) +
                        w_time * (step_time_hours * 25.0)
                    )

                    tentative_g = current_g + edge_cost

                    if neighbor not in g_score or tentative_g < g_score[neighbor]:
                        came_from[neighbor] = current
                        g_score[neighbor] = tentative_g

                        # Heuristic: Haversine distance to goal
                        h_dist = haversine_distance_km(n_lat, n_lon, goal_lat, goal_lon)
                        h_cost = w_dist * h_dist
                        f_score = tentative_g + h_cost

                        heapq.heappush(open_set, (f_score, tentative_g, neighbor))

        # Fallback if graph search fails to find connected path: generate direct interpolated corridor
        return self._generate_fallback_corridor(start, goal, icebergs)

    def _generate_fallback_corridor(
        self, start: GeoPoint, goal: GeoPoint, icebergs: List[Iceberg], steps: int = 15
    ) -> List[Tuple[float, float, float, float, float]]:
        points = []
        for i in range(steps + 1):
            fraction = i / float(steps)
            lat = start.lat + fraction * (goal.lat - start.lat)
            lon = start.lon + fraction * (goal.lon - start.lon)
            tot_r, _, _, _, _ = RISK_ENGINE.calculate_cell_risk(lat, lon, icebergs)
            points.append((lat, lon, 0.0, 0.0, tot_r))
        return points


ROUTER = AStarPolarRouter()
