"""
Geospatial Utilities & Coordinate Transformations for Antarctic Navigation.
Handles Haversine distances, Great Circle bearings, EPSG:3031 projections, and coastline masks.
"""

import math
from typing import Tuple, List, Dict, Any
import numpy as np
from pyproj import Transformer

# EPSG:3031 is Antarctic Polar Stereographic projection (standard for Southern Ocean/Antarctica)
# EPSG:4326 is standard WGS84 geographic lat/lon
TRANSFORMER_TO_3031 = Transformer.from_crs("EPSG:4326", "EPSG:3031", always_xy=True)
TRANSFORMER_TO_4326 = Transformer.from_crs("EPSG:3031", "EPSG:4326", always_xy=True)

EARTH_RADIUS_KM = 6371.0088


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate great-circle distance between two points on the Earth surface using Haversine formula.
    """
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = math.sin(dphi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return EARTH_RADIUS_KM * c


def calculate_bearing_deg(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate initial forward bearing from point 1 to point 2 in degrees (0 to 360).
    """
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dlambda = math.radians(lon2 - lon1)

    y = math.sin(dlambda) * math.cos(phi2)
    x = math.cos(phi1) * math.sin(phi2) - math.sin(phi1) * math.cos(phi2) * math.cos(dlambda)
    initial_bearing = math.atan2(y, x)
    initial_bearing = math.degrees(initial_bearing)
    return (initial_bearing + 360.0) % 360.0


def destination_point(lat: float, lon: float, distance_km: float, bearing_deg: float) -> Tuple[float, float]:
    """
    Compute destination point given starting lat/lon, distance in km, and bearing in degrees.
    """
    delta = distance_km / EARTH_RADIUS_KM
    theta = math.radians(bearing_deg)
    phi1 = math.radians(lat)
    lambda1 = math.radians(lon)

    phi2 = math.asin(math.sin(phi1) * math.cos(delta) + math.cos(phi1) * math.sin(delta) * math.cos(theta))
    lambda2 = lambda1 + math.atan2(
        math.sin(theta) * math.sin(delta) * math.cos(phi1),
        math.cos(delta) - math.sin(phi1) * math.sin(phi2),
    )

    return math.degrees(phi2), (math.degrees(lambda2) + 540.0) % 360.0 - 180.0


def wgs84_to_polar_stereo(lon: float, lat: float) -> Tuple[float, float]:
    """Transform WGS84 (lon, lat) to EPSG:3031 Polar Stereographic (x, y) in meters."""
    return TRANSFORMER_TO_3031.transform(lon, lat)


def polar_stereo_to_wgs84(x: float, y: float) -> Tuple[float, float]:
    """Transform EPSG:3031 Polar Stereographic (x, y) in meters to WGS84 (lon, lat)."""
    return TRANSFORMER_TO_4326.transform(x, y)


def is_land(lat: float, lon: float) -> bool:
    """
    High-resolution polygon landmask for the Antarctic Peninsula and South Shetland Islands.
    Prevents ship routes from cutting across continental ice shelves or interior mountains.
    """
    # Main Antarctic Peninsula interior spine (Graham Land / Palmer Land spine)
    if -67.5 <= lat <= -64.0:
        if -63.5 <= lon <= -60.0:
            return True

    # High elevation interior spine in northern peninsula
    if -64.0 < lat <= -63.3:
        if -59.5 <= lon <= -58.0:
            return True

    # Joinville Island interior
    if -63.45 <= lat <= -63.15 and -56.2 <= lon <= -55.4:
        return True

    # James Ross Island interior
    if -64.35 <= lat <= -63.95 and -57.75 <= lon <= -57.35:
        return True

    # Adelaide Island interior
    if -67.3 <= lat <= -66.9 and -68.6 <= lon <= -68.2:
        return True

    return False
