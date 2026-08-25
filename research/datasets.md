# Datasets Specification & Sourcing (2026)

## 1. Primary Operating Region: Antarctic Peninsula & Weddell Sea

- **Geographic Bounding Box:**
  - Latitude: $62.0^\circ\text{S}$ to $68.0^\circ\text{S}$
  - Longitude: $52.0^\circ\text{W}$ to $66.0^\circ\text{W}$
- **Key Landmarks & Stations:**
  - King George Island (Frei/Bellingshausen/Escudero Station - $62.2^\circ\text{S}, 58.9^\circ\text{W}$)
  - Esperanza Base / Hope Bay ($63.4^\circ\text{S}, 56.9^\circ\text{W}$)
  - Rothera Research Station (Adelaide Island - $67.57^\circ\text{S}, 68.13^\circ\text{W}$)
  - Larsen Ice Shelf / Weddell Sea Gyre ("Iceberg Alley" drift corridor)

---

## 2. Dataset Catalog

### 2.1 Sea-Ice Concentration & Drift
- **Source:** Copernicus Marine Environment Monitoring Service (CMEMS) / OSI SAF.
- **Product Identifier:** `SEAICE_ANT_PHY_L4_NRT_011_014` (OSI-401-b / AMSR2 high-resolution sea ice concentration).
- **Spatial Resolution:** 10 km grid (EPSG:3031 Antarctic Polar Stereographic / WGS84 regridded).
- **Temporal Resolution:** Daily / 6-hourly updates.
- **Variables Used:** `sea_ice_concentration` (0.0 to 1.0 / 0 to 100%), `sea_ice_thickness_estimate`, `sea_ice_drift_u`, `sea_ice_drift_v`.

### 2.2 Oceanographic Hydrodynamics
- **Source:** Copernicus Global Ocean Physics Analysis and Forecast (`GLOBAL_ANALYSISFORECAST_PHY_001_024`).
- **Spatial Resolution:** 1/12° (approx. 4–8 km in polar latitudes).
- **Variables Used:** Surface eastward water velocity `uo` (m/s), surface northward water velocity `vo` (m/s), sea surface temperature `tos` (°C).

### 2.3 Atmospheric Metocean Forcing
- **Source:** ECMWF ERA5 Reanalysis / Copernicus High Resolution Wind.
- **Variables Used:** 10-meter eastward wind component `u10` (m/s), 10-meter northward wind component `v10` (m/s), mean sea-level pressure `msl` (Pa), 2-meter air temperature `t2m` (K).

### 2.4 Historical & Tracked Iceberg Database
- **Source:** BYU SCP / US National Ice Center (USNIC) Antarctic Iceberg Tracking Database.
- **Data Attributes:** Iceberg Identifier (`A27`, `A68A`, `B15A`, `C19`, etc.), Timestamp (ISO 8601), Latitude (°), Longitude (°), Major axis length (km), Minor axis length (km), Estimated draft (m), Observed drift speed (knots / m/s), Heading (°).

---

## 3. Data Ingestion Architecture & Offline Determinism

To adhere strictly to Sections 31, 48, 59, and 68:
1. **Offline Demo Cache:** Preprocessed, validated NetCDF4/Parquet and JSON slices of the Antarctic Peninsula region are bundled into `data/demo_region/` and `data/iceberg_tracks/`.
2. **Live Ingestion Connector:** A modular `copernicus_downloader.py` and `era5_fetcher.py` using `copernicusmarine` and CDS API with configurable credentials for fetching live real-time feeds.
3. **Data Integrity & Provenance:** Every record tracks its provenance status: `REAL_HISTORICAL`, `REAL_DERIVED`, or `CONTROLLED_SIMULATION_EVENT`.
