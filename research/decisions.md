# Architectural Decisions Record (ADR)

## Decision 1: Operating Region
- **Decision:** Primary region set to **Antarctic Peninsula & Northwest Weddell Sea** ($62^\circ\text{S} - 68^\circ\text{S}, 52^\circ\text{W} - 66^\circ\text{W}$).
- **Rationale:** Highest density of operational research vessels, complex channels (Gerlache Strait, Antarctic Sound), prominent iceberg drift corridor ("Iceberg Alley"), and rich historical satellite observation records.

## Decision 2: Physics-Integrated ML Architecture for Trajectory Prediction
- **Decision:** Hybrid model with Lagrangian hydrodynamic drag baseline + `HistGradientBoostingRegressor` residual correction + calibrated uncertainty cones.
- **Rationale:** Guaranteed physical plausibility (icebergs never exceed hydrodynamic bounds or move against severe combined forces) while learning nonlinear mesoscale eddy corrections from data.

## Decision 3: Multi-Objective Polar Navigation Risk & A* Routing Engine
- **Decision:** Discretized spatial cost grid incorporating:
  1. POLARIS-based Sea-Ice Risk ($w_1 \cdot \text{SIC}^2$).
  2. Dynamic Iceberg Collision Hazard ($w_2 \cdot \text{exp}(-d^2/2\sigma^2)$).
  3. Metocean Drag / Weather Risk ($w_3 \cdot \|\mathbf{v}_{wind}\| + w_4 \cdot \text{AdverseCurrent}$).
  4. Fuel Consumption & Speed Penalty Model.
- **Routes:** 
  - Route A (Shortest Distance)
  - Route B (Fuel Optimized)
  - Route C (AI Recommended - Multi-objective Pareto optimal with minimum risk exposure)

## Decision 4: Frontend Visualization Stack
- **Decision:** React 19 + TypeScript + Vite + CesiumJS (with native asset configuration) + Tailwind CSS + Lucide Icons.
- **Rationale:** Delivers high-performance 3D WGS84 globe rendering, 3D glTF vessel models, spatial risk contours, time-dynamic Czml/entity paths, and dark mission-operations UI console.

## Decision 5: Data Ingestion & Dual Mode Execution
- **Decision:** FastAPI backend serving both live Copernicus/ERA5 API connectors and a bundled deterministic high-fidelity offline dataset cache in `data/`.
- **Rationale:** Enables fully reproducible local demonstrations without network flakiness while offering full production connectors for live data.
