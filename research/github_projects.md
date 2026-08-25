# GitHub Projects & Open-Source Prior Art Analysis (2026)

## 1. Overview of Inspected Repositories

| Repository | Focus Area | Tech Stack | License | Strengths | Limitations for this MVP |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`OpenDrift/opendrift`** (`OpenBerg`) | Lagrangian particle & iceberg trajectory simulation | Python, SciPy, NetCDF4, Xarray | GPL v2 | Validated hydrodynamic drift equations, wind/ocean coupling, sea-ice drag | Heavy standalone runner; requires custom integration for fast interactive REST API |
| **`mercator-ocean/copernicusmarine`** | Copernicus Marine Service data retrieval API | Python, Pydantic, Xarray, Zarr | MIT | Official client for downloading Antarctic sea-ice, ocean currents, and SST | Requires user Copernicus credentials for live API calls; needs cached offline fallback |
| **`CesiumGS/cesium`** + Vite integration | 3D Geospatial Globe Rendering | WebGL/WebGPU, TypeScript | Apache-2.0 | Best-in-class 3D terrain, WGS84 globe, glTF 3D models, time-dynamic CZML/Entity API | Requires explicit asset bundling (`CESIUM_BASE_URL`) in Vite 8 / Rolldown setups |
| **`networkx` / `scipy.sparse.csgraph`** | Graph pathfinding & Dijkstra / A* | Python, C extensions | BSD-3-Clause | Optimized shortest path routines on spatial grid graphs | Needs custom heuristic and multi-objective dynamic cost surfaces for Polar navigation |
| **`scikit-learn`** | Machine Learning Regression & Trees | Python, Cython, NumPy | BSD-3-Clause | `HistGradientBoostingRegressor` provides rapid, lightweight, highly accurate residual prediction | Needs clear train/eval pipeline with real metocean features |

---

## 2. Reusable Architectural Patterns

1. **Decoupled Geospatial Service:** Use FastAPI with asynchronous endpoints delivering GeoJSON, CZML, and structured JSON payloads for CesiumJS ingestion.
2. **Offline Data Pipeline:** NetCDF/Parquet caching pattern allows the system to operate deterministically offline while retaining the exact schema for live Copernicus/ERA5 ingestion.
3. **Multi-Objective Cost Grid:** Discretized polar stereographic / geographic cost raster where A* navigates 8-neighborhood or 16-neighborhood cells based on weighted objective values.
