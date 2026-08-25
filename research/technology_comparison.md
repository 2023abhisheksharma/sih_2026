# Technology Comparison & 2026 Stack Evaluation

## 1. 3D Geospatial Visualization Engine

| Option | Pros | Cons | Decision |
| :--- | :--- | :--- | :--- |
| **CesiumJS (v1.120+ / 2026)** | Native WGS84 globe, accurate polar orbital camera, glTF 3D model support, time-dynamic Czml/Entity animations, spatial polygons/polyline volumes | Large bundle size (~4MB), requires base asset serving | **SELECTED**: Authoritative choice for 3D Earth digital twin & polar visualization |
| **Three.js (raw)** | Lightweight, flexible custom shaders | Lacks geospatial projections, GIS coordinate systems, tile map layers, and polar ellipsoids | Rejected |
| **MapLibre GL / Leaflet** | 2D fast map tiles | Prohibited by specification (2D only, poor polar stereographic distortion on Web Mercator) | Rejected |

---

## 2. Machine Learning Trajectory Model

| Option | Pros | Cons | Decision |
| :--- | :--- | :--- | :--- |
| **Physics-Informed Hybrid (Physical Drift + Gradient Boosted Residuals)** | Highly interpretable, defensible, fast inference (<5ms), robust with sparse observations, accurate metocean coupling | Requires careful drift physics baseline formulation | **SELECTED**: Strictly conforms to Sections 10, 11, 12, 76 |
| **Pure Deep LSTM / Transformer** | Learns complex sequence patterns | Data-hungry, black-box behavior, high compute, risk of hallucinating unrealistic physics in sparse polar regions | Secondary evaluation candidate |
| **Pure Kinematic Baseline** | Trivial implementation | Cannot adapt to wind/ocean drag or sea-ice locking; poor 12h–24h accuracy | Baseline reference only |

---

## 3. Path Planning Algorithm

| Option | Pros | Cons | Decision |
| :--- | :--- | :--- | :--- |
| **Risk-Aware Multi-Objective A\*** | Deterministic, guarantees optimal path with respect to weighted cost heuristic, fast execution (<500ms on 200x200 polar grid) | Recomputes full graph on state update | **SELECTED**: Primary routing engine with configurable $\alpha, \beta, \gamma, \delta$ weights |
| **D\* Lite (Incremental Replanning)** | Rapidly updates previous search tree when small edge cost changes occur | Higher implementation complexity for initial candidate comparison | Integrated for dynamic simulation replanning ticks |
| **Genetic Algorithm / RRT\*** | Explores continuous space | Non-deterministic, slow convergence, jagged routes in narrow channels | Rejected |
