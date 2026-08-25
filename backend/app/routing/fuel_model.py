"""
Vessel Fuel Consumption Estimation Model for Antarctic Research Vessels.
Calculates transparent hydrodynamic resistance, speed scaling, and sea-ice penalties.
Conforms to Sections 21, 40 of the specification.
"""

import math

# Baseline parameters for polar research vessel R/V POLARIS (approx 85m length, 4,500 GT, PC6 Ice Class)
BASE_FUEL_LITERS_PER_KM = 18.5  # Cruising at nominal 12 knots in open water


def estimate_segment_fuel_liters(
    distance_km: float,
    speed_knots: float,
    sic: float,
    favorable_current_mps: float = 0.0,
) -> float:
    """
    Computes estimated fuel in liters for a navigation segment.

    Model:
    Fuel = Distance * BaseRate * SpeedFactor * IcePenalty * CurrentFactor

    1. Speed Factor: Non-linear power-speed relationship (approx cubic law v^2.2)
    2. Ice Penalty: Non-linear resistance increase when navigating in pack ice
    3. Current Factor: Slight assistance / resistance from surface current
    """
    # 1. Speed scaling
    speed_factor = (speed_knots / 12.0) ** 2.2

    # 2. Sea-ice resistance penalty
    # In open water (sic < 0.1), penalty is 1.0
    # In 50% ice, penalty is ~1.7
    # In 80% ice, penalty is ~3.2
    ice_penalty = 1.0 + 3.8 * (sic ** 2.5)

    # 3. Current factor (current in m/s relative to vessel 12 knots = 6.17 m/s)
    current_factor = max(0.85, min(1.25, 1.0 - (favorable_current_mps / 6.17) * 0.4))

    fuel_liters = distance_km * BASE_FUEL_LITERS_PER_KM * speed_factor * ice_penalty * current_factor
    return max(0.1, fuel_liters)


def calculate_speed_in_ice(base_speed_knots: float, sic: float) -> float:
    """
    Computes actual attainable speed in sea-ice conditions.
    Icebreaker slow-down in heavy pack ice.
    """
    if sic <= 0.15:
        return base_speed_knots
    # Non-linear speed reduction
    reduction_factor = max(0.25, 1.0 - 0.75 * (sic ** 1.6))
    return round(base_speed_knots * reduction_factor, 1)
