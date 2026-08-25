# AI-Enabled Antarctic Sea-Ice, Iceberg Trajectory, and Navigation Decision Support System
## MVP Implementation Specification and Demo Directive

> **Author's intent:** This document defines exactly what I am building for the MVP, what the system must contain, what technologies should be used, how the demo should work, and what constitutes a completed implementation. The implementation must be a **working, integrated product**, not a static mockup or hollow HTML demonstration.

---

# 0. Graph Architecture Overview

> **Note on this section:** This section is an added architectural framing layer. It does not replace, override, remove, or take precedence over any requirement stated elsewhere in this document. Every rule, threshold, prohibition, and acceptance criterion in Sections 1–86 remains fully in force exactly as written. This section exists to make the system's existing node/edge structure — which is already implied throughout the document — explicit, so that an implementing agent operating in a graph-oriented execution environment (nodes, edges, shared state, typed handoffs) can map the specification onto that execution model directly.

## 0.1 Why This System Is a Graph, Not a Single Loop

This specification does not describe one agent iterating on one task. It describes **multiple specialized components, each with its own responsibility, its own internal correctness rules, and its own inputs/outputs**, connected by explicit data handoffs. That is a graph: nodes that do work, edges that carry state between them.

Evidence already present in the document:

- **Section 29 (Technical Architecture)** separates Frontend, Backend, Data Processing, Machine Learning, and Routing into distinct responsibility blocks.
- **Section 33 (API Design)** defines the literal edge contracts between those blocks — `/environment`, `/icebergs`, `/predict/trajectory`, `/risk/grid`, `/route/generate`, `/route/replan`, `/simulation/*` — each endpoint is a typed handoff from one node to another.
- **Section 25 (Dynamic Replanning)** describes an event propagating across nodes: a hazard event changes iceberg state → risk engine recomputes → router regenerates a route → UI explains the change. This is a multi-node reaction chain, not a single loop body.
- **Section 76 (Model Training Is Part of the Project)** and **Section 35 (Simulation Engine)** each describe their *own* internal iterative loop (train/evaluate cycle; simulation tick cycle). Individual nodes may loop internally — the system as a whole is the graph connecting those loops.
- **Section 86 (Final Principle)** already draws the canonical pipeline as a directed chain of named stages. That diagram is the graph's node list in the order data flows through it.

## 0.2 Node Definitions

Each node below corresponds to a responsibility area already defined elsewhere in this document. The node list does not add new requirements — it names and groups requirements that already exist under their originating sections.

```text
NODE: ENVIRONMENT_ENGINE
  Defined in: Sections 7, 8, 30, 31
  Responsibility: Ingest/preprocess sea-ice, ocean, weather, iceberg-track data.
                   Serve current environmental state.
  Outputs → ICEBERG_INTELLIGENCE, RISK_ENGINE, TRAJECTORY_MODEL

NODE: ICEBERG_INTELLIGENCE
  Defined in: Sections 9, 14, 15
  Responsibility: Maintain iceberg registry (ID, position, size, drift,
                   confidence, risk level). Distinguish real vs. demo data.
  Outputs → TRAJECTORY_MODEL, RISK_ENGINE, 3D_FRONTEND

NODE: TRAJECTORY_MODEL
  Defined in: Sections 10, 11, 12, 13, 76, 77, 78, 79
  Responsibility: Predict future iceberg movement (hybrid physical baseline
                   + ML correction). Produce trajectory + uncertainty.
                   Owns its own train → evaluate → infer loop (Section 76).
  Outputs → RISK_ENGINE, 3D_FRONTEND

NODE: RISK_ENGINE
  Defined in: Sections 17, 18
  Responsibility: Convert environmental + iceberg + trajectory state into
                   a navigation cost/risk grid.
  Outputs → ROUTE_OPTIMIZER, 3D_FRONTEND

NODE: ROUTE_OPTIMIZER
  Defined in: Sections 19, 20, 21, 22, 23, 40
  Responsibility: Compute candidate routes (A*, later D* Lite) over the
                   risk grid. Multi-objective cost function. Fuel estimate.
                   Route explanation.
  Outputs → 3D_FRONTEND, DASHBOARD

NODE: SIMULATION_ENGINE
  Defined in: Sections 24, 35, 36, 41
  Responsibility: Own the simulation clock. Step vessel/iceberg/environment
                   state forward. Detect route-invalidating conditions and
                   trigger replanning. Owns its own tick loop.
  Outputs → all nodes (state broadcast), triggers ROUTE_OPTIMIZER on conflict

NODE: 3D_FRONTEND
  Defined in: Sections 4, 5, 6, 26, 27, 28
  Responsibility: CesiumJS/React rendering of globe, vessel, icebergs,
                   layers, dashboard, timeline. Consumes all upstream node
                   outputs. Issues mission-planning input back to
                   SIMULATION_ENGINE / ROUTE_OPTIMIZER.
  Inputs ← all nodes
```

## 0.3 Edge / State Contract

The edges below are already specified as the API surface in **Section 33**. This subsection only labels them as graph edges; the request/response shapes defined in Section 33 are unchanged and remain authoritative.

```text
ENVIRONMENT_ENGINE      --/environment-->              RISK_ENGINE, 3D_FRONTEND
ICEBERG_INTELLIGENCE    --/icebergs, /icebergs/{id}-->  TRAJECTORY_MODEL, 3D_FRONTEND
TRAJECTORY_MODEL        --/predict/trajectory-->        RISK_ENGINE, 3D_FRONTEND
RISK_ENGINE             --/risk/grid-->                 ROUTE_OPTIMIZER, 3D_FRONTEND
ROUTE_OPTIMIZER         --/route/generate,
                           /route/compare,
                           /route/replan-->              3D_FRONTEND, DASHBOARD
SIMULATION_ENGINE       --/simulation/start,
                           /simulation/step,
                           /simulation/reset-->          all nodes (state tick)
```

## 0.4 Reading This Document as a Graph

An implementing agent working in a node/graph-oriented sandbox should:

1. Treat each `NODE:` block in 0.2 as a unit of work, and open the section(s) listed under "Defined in" for that node's full, unabridged requirements — the detailed rules live in those original sections, not in this summary.
2. Treat the arrows in 0.3 as the required data contracts between nodes — matching the exact endpoints and payloads already defined in Section 33.
3. Implement each node's internal logic in full per its originating sections — this graph framing groups requirements, it does not substitute for reading them.
4. Preserve Section 35 and Section 76's internal loops as loops running *inside* their respective nodes — do not flatten the whole system into a single external loop, and do not flatten each node's internal loop away either.
5. Continue to follow Sections 84–86 (Core Instruction, Working Procedure, Final Principle) as the binding process and completion rules for the whole graph. This section does not change what "complete" means anywhere else in this document.

---

# 1. Project Objective

I am building an **AI-enabled Antarctic navigation decision-support system** for research vessels.

The system will combine Antarctic environmental information, sea-ice concentration, iceberg locations and trajectories, meteorological/oceanographic conditions, and route optimization to recommend a **safe and fuel-efficient navigation route**.

The MVP must demonstrate the complete decision loop:

```text
Environmental Data
        ↓
Sea-Ice / Iceberg Intelligence
        ↓
Iceberg Trajectory Prediction
        ↓
Navigation Risk Map
        ↓
Route Optimization
        ↓
Recommended Route
        ↓
Time-Based Simulation
        ↓
Changing Conditions
        ↓
Dynamic Route Replanning
```

The system is a **decision-support prototype**. It is not an autonomous vessel-control system and must not present itself as one.

---

# 2. Core MVP Demonstration

The finished MVP must let me perform this complete workflow without manually modifying source code during the demo:

1. Open the application.
2. View an interactive **3D Antarctic environment**.
3. Select a research vessel.
4. Select a departure point.
5. Select a destination.
6. Load the environmental conditions.
7. Display sea-ice concentration.
8. Display detected/historical iceberg objects.
9. Select an iceberg and inspect its properties.
10. Generate an iceberg trajectory prediction.
11. Display the predicted trajectory and uncertainty region.
12. Generate a navigation risk field.
13. Calculate multiple candidate routes.
14. Compare route distance, estimated fuel, travel time, and risk.
15. Select an AI-recommended route.
16. Start a time-based simulation.
17. Animate the research vessel and environmental objects.
18. Introduce or detect a changing hazard.
19. Detect that the current route is becoming unsafe.
20. Recalculate the route.
21. Display the new recommended route.
22. Explain why the route changed.

The demo is incomplete if any of these core stages are only represented by buttons, placeholder text, fake loading screens, or disconnected static graphics.

---

# 3. Definition of a Completed MVP

The MVP is considered complete only when the following are true:

- The 3D globe is interactive.
- The vessel is a real rendered object, not only an icon.
- Icebergs are rendered as identifiable 3D objects or convincing 3D representations.
- Iceberg trajectories are generated from actual model/data inputs.
- Sea-ice data is represented as a spatial layer.
- Route optimization is performed computationally.
- Fuel estimation is calculated from an explicit model.
- Risk scores are calculated from environmental inputs.
- The recommended route is different when environmental conditions make the previous route suboptimal.
- The simulation changes state over time.
- Replanning actually recalculates the route.
- The frontend receives data from a backend or computational service.
- Data and model outputs are integrated into the visualization.
- There are no major placeholder components in the primary demo path.
- The application can be run locally with documented commands.
- The demo can be reset and replayed.

A static HTML page containing a map screenshot, fake charts, or hard-coded route lines does **not** satisfy this specification.

---

# 4. Main Product Concept

The product should look and behave like a **marine navigation intelligence/operations console**.

The visual hierarchy should be:

```text
                 3D Antarctic Environment
                         │
         ┌───────────────┼────────────────┐
         │               │                │
    Environmental    Vessel & Route    Hazard/AI
      Conditions       State          Information
         │               │                │
         └───────────────┼────────────────┘
                         │
                  Decision Support
```

The 3D map is the visual centerpiece.

The dashboards and controls should support the 3D scene rather than replace it.

---

# 5. User Experience and Application Flow

## 5.1 Application Start

The application opens in an operations-center style interface.

The default view should be a dark UI with:

- Antarctic 3D globe
- vessel
- destination
- environmental layers
- side information panels
- route controls
- timeline/simulation controls

The UI should look like a real prototype product, not a student HTML page.

---

## 5.2 Mission Planning

The first functional interaction should allow me to configure a mission.

### Mission fields

- Vessel
- Departure location
- Destination location
- Departure time
- Vessel speed
- Safety priority
- Fuel priority

Example:

```text
VESSEL
R/V POLARIS

DEPARTURE
[Map selection]

DESTINATION
[Map selection]

SPEED
12 knots

SAFETY PRIORITY
High

FUEL PRIORITY
Medium
```

I should be able to select start and destination directly from the 3D map.

---

# 6. 3D Visualization Requirements

## 6.1 Technology

Use:

**CesiumJS**

Preferably with:

**React + TypeScript**

Cesium should be used for the actual 3D geographic environment, not just decorative 3D effects.

The system should support:

- globe interaction
- zoom
- rotate
- tilt
- camera movement
- entity selection
- time-based animation
- 3D models
- geospatial lines/polygons
- route visualization

---

## 6.2 Antarctic View

On startup, the camera should focus on Antarctica rather than the entire Earth.

The user must be able to:

- rotate the globe
- zoom into the operating region
- tilt the camera
- follow the vessel
- focus on an iceberg
- switch between overview and detailed navigation views

---

## 6.3 Research Vessel

Render the research vessel as a 3D `.glb`/glTF model.

It must:

- have a geographic position
- have heading/orientation
- move during simulation
- follow the selected route
- display current speed
- display status when selected

Example information:

```text
R/V POLARIS
Speed: 12.0 kn
Heading: 117°
Mission: Active
ETA: 12h 54m
```

The vessel must physically move during the demo.

---

## 6.4 Icebergs

Icebergs should be represented as spatial 3D objects.

Every iceberg should have:

- unique ID
- latitude
- longitude
- estimated dimensions
- drift speed
- drift direction
- confidence
- trajectory
- current risk level

Example:

```text
ICEBERG #27

Position:
64.21° S, 57.82° W

Size:
1.8 × 1.1 km

Drift:
0.31 m/s

Heading:
117°

Prediction Confidence:
87%

Risk:
HIGH
```

The visual size may be exaggerated for display clarity, but it must be clearly treated as a visualization rather than a precise surveyed geometry.

---

# 7. Sea-Ice Concentration Layer

The MVP must include a real or properly sourced Antarctic sea-ice dataset.

A preferred source is:

**Copernicus Marine Antarctic high-resolution sea-ice data**

The system should ingest or preprocess sea-ice concentration and display it spatially.

The visualization should support a continuous or categorized concentration field.

For example:

```text
0–20%      Open / low concentration
20–50%     Moderate
50–80%     High
80–100%    Very high
```

These ranges are configurable visualization categories, not universal operational navigation rules.

The UI should include a legend.

The user should be able to turn the sea-ice layer on and off.

---

# 8. Meteorological and Oceanographic Data

The MVP should use a limited but meaningful set of environmental variables.

Required/important variables:

- wind speed
- wind direction
- ocean current U/V
- sea-ice concentration
- sea-ice drift where available
- temperature

Additional wave/weather variables can be included when available.

Do not import hundreds of variables simply because they exist.

Use only variables that contribute directly to:

- iceberg prediction
- navigation risk
- fuel estimation
- route optimization

---

# 9. Iceberg Detection / Dataset Strategy

For the MVP, I should not make live satellite detection a hard dependency.

The first version should use:

```text
Historical iceberg trajectory data
+
prepared demonstration data
```

The system architecture must nevertheless be designed so that a future version can replace the prepared iceberg layer with satellite-derived detection.

The MVP must clearly distinguish:

```text
REAL DATA
vs.
DEMO / SIMULATION DATA
```

I must not claim that synthetic iceberg locations are live satellite detections.

---

# 10. Iceberg Trajectory Prediction

This is the main AI component.

The system should predict future iceberg movement from historical positions plus environmental information.

Possible input features:

```text
Previous latitude
Previous longitude
Previous velocity
Previous heading
Ocean current U
Ocean current V
Wind U
Wind V
Sea-ice drift U
Sea-ice drift V
Sea-ice concentration
Time / temporal features
```

The model predicts:

```text
Δlatitude
Δlongitude
```

or equivalent future position/velocity.

---

# 11. AI Model Strategy

The MVP should start with an interpretable and testable model rather than immediately implementing a complex Transformer.

Recommended initial approach:

```text
Physical/environmental baseline
            +
Machine-learning correction
```

A practical first model can be:

- Gradient Boosting
- Random Forest
- XGBoost if available

A later experiment can compare:

- baseline
- ML model
- LSTM
- hybrid model

The MVP should include a model evaluation result.

At minimum, I should calculate:

- trajectory error
- prediction error at multiple forecast horizons
- basic validation/test metrics

Example:

```text
6-hour MAE: 1.9 km
12-hour MAE: 2.8 km
24-hour MAE: 5.4 km
```

These values must be generated from the actual evaluation process. They must not be fabricated for presentation.

---

# 12. Hybrid Prediction Model

Where practical, use environmental drift as a physical baseline.

Conceptually:

```text
Predicted Movement
=
Ocean Drift
+
Sea-Ice Drift
+
Wind Influence
+
ML Correction
```

The ML model should learn residual error that is not represented by the simplified baseline.

This architecture makes the MVP more defensible than using a completely unexplained black-box prediction.

---

# 13. Uncertainty Visualization

The system must not display a single trajectory as absolute truth.

The prediction should have an uncertainty representation.

For the MVP this can be:

- an expanding confidence ellipse
- an uncertainty corridor
- multiple sampled trajectories

Example:

```text
Current
  ●
   \       6h uncertainty
    ╲   ╭──────────╮
     ●──│----------│
         ╰──────────╯
              \
               ╲ 12h uncertainty
                ╭────────────╮
                │            │
                ╰────────────╯
```

The uncertainty should increase with forecast horizon unless there is evidence supporting a different behavior.

The UI should communicate:

```text
Prediction confidence: 87%
```

only when that value is actually derived from the model/calibration methodology.

---

# 14. Iceberg Selection Interaction

Clicking an iceberg should open a panel containing:

```text
ICEBERG #27
──────────────────────

Current Position
64.21° S
57.82° W

Estimated Size
1.8 × 1.1 km

Drift Speed
0.31 m/s

Drift Direction
117°

Prediction Horizon
24 h

Confidence
87%

Route Interaction
Possible

[VIEW TRAJECTORY]
```

The camera should optionally fly toward the selected iceberg.

---

# 15. Animated Iceberg Trajectory

The trajectory must be visually animated or time-aware.

Show:

```text
t = 0
t = +6h
t = +12h
t = +24h
```

The current iceberg location should be distinct from future predicted locations.

The predicted path should be visually different from the historical/current path.

---

# 16. Ocean Current Visualization

A useful optional but recommended feature is an animated current layer.

Use vector/particle-style movement to visually indicate ocean-current direction.

The animation should make it possible for the user to intuitively see why an iceberg is drifting.

The current field should be based on actual environmental data where available.

---

# 17. Navigation Risk Map

The risk map is the bridge between environmental intelligence and navigation.

The operating area should be converted into a navigation cost surface/grid.

Each cell receives a risk/cost value.

Conceptually:

```text
Risk(x,y)
=
w1 × Sea-Ice Risk
+
w2 × Iceberg Risk
+
w3 × Weather Risk
+
w4 × Fuel Cost
```

The weights should be configurable in code and documented.

The system should support a visualization such as:

```text
LOW RISK  ─────────────── HIGH RISK
```

The risk field must respond to iceberg prediction changes.

---

# 18. Risk Calculation

The risk engine must include at least:

### Sea-Ice risk

Higher sea-ice concentration → higher navigation cost.

### Iceberg risk

Higher predicted probability of entering the area → higher cost.

### Weather risk

Poor environmental conditions → increased cost.

### Fuel cost

Route segments with higher resistance/penalty → increased cost.

The risk model should return a normalized value such as:

```text
0 = low risk
100 = high risk
```

The exact interpretation must be documented as a project-specific index and not presented as an official maritime safety scale.

---

# 19. Navigation Routing

The MVP must compute routes algorithmically.

Start with:

**A\***

A route should be generated through the risk grid rather than drawn manually.

Candidate route examples:

### Route A — Shortest

```text
Distance: 186 km
Estimated Fuel: 4,820 L
Time: 12h 25m
Risk: 78/100
```

### Route B — Fuel Optimized

```text
Distance: 194 km
Estimated Fuel: 4,510 L
Time: 12h 41m
Risk: 44/100
```

### Route C — AI Recommended

```text
Distance: 201 km
Estimated Fuel: 4,610 L
Time: 12h 54m
Risk: 27/100
```

These are examples of UI structure only. The final displayed values must come from the actual implementation.

---

# 20. Multi-Objective Route Optimization

The route objective should be based on a documented cost function.

Example:

```text
J =
α × distance
+
β × fuel
+
γ × risk
+
δ × travel time
```

The UI should expose the concept of safety/fuel weighting.

For example:

```text
Safety Priority  ───────●────
Fuel Priority    ─────●──────
```

Changing weights should change route selection when the underlying costs make that meaningful.

---

# 21. Fuel Model

The MVP does not need an accurate naval propulsion simulator.

It does need a transparent estimate.

Use a simplified model such as:

```text
Fuel =
Distance
× Base Fuel Rate
× Speed Factor
× Ice Penalty
```

The implementation must document that this is an **estimated demo fuel model**.

Do not claim that the value represents actual fuel consumption of a specific research vessel unless real vessel performance data is used.

---

# 22. Route Comparison UI

The UI must compare at least three routes.

Example:

```text
┌─────────────────────────────────────────────────────┐
│ ROUTE OPTIONS                                       │
│                                                     │
│ SHORTEST                                            │
│ 186 km   4,820 L   12h25m   Risk 78               │
│                                                     │
│ FUEL OPTIMAL                                        │
│ 194 km   4,510 L   12h41m   Risk 44               │
│                                                     │
│ AI RECOMMENDED                                      │
│ 201 km   4,610 L   12h54m   Risk 27               │
│                                                     │
│                 [SELECT AI ROUTE]                  │
└─────────────────────────────────────────────────────┘
```

The route lines must be visibly different in the 3D environment.

---

# 23. Route Explanation

The system must explain why the recommended route was selected.

Example:

```text
WHY THIS ROUTE?

Predicted iceberg risk      38%
Sea-ice exposure            31%
Fuel cost                   19%
Weather exposure            12%

Primary reason:
The shortest route enters the
predicted trajectory corridor
of Iceberg #27 within 4h 20m.
```

The exact percentages must be derived from the implemented scoring system rather than hard-coded presentation values.

---

# 24. Time-Based Simulation

The application must include a timeline.

Example:

```text
NOW ─────────────────────────────── +24 HOURS
            ●
          14:00

[◀] [▶] [1×] [10×] [50×]
```

Simulation state should control:

- vessel position
- iceberg positions
- predicted trajectories
- risk
- route status
- environmental timestamps

The user should be able to pause and resume the simulation.

---

# 25. Dynamic Replanning

This is a mandatory MVP feature.

During simulation:

1. The vessel moves.
2. Iceberg moves.
3. Environmental conditions change.
4. A previously acceptable route becomes higher risk.
5. The system detects the conflict.
6. The system generates a new route.
7. The UI displays why the route changed.

Example alert:

```text
⚠ ROUTE HAZARD DETECTED

Iceberg #27 is predicted to
approach the current route
within 4h 20m.

Current route risk: 71/100

[REPLAN ROUTE]
```

After replanning:

```text
ROUTE UPDATED

Old risk: 71
New risk: 19

Additional distance: +7 km
Estimated fuel change: +70 L

Reason:
Predicted iceberg corridor
intersects previous route.
```

This must be a real recalculation.

---

# 26. Dashboard

The right-hand operations panel should show the current mission state.

Suggested sections:

```text
MISSION STATUS

Vessel
R/V POLARIS

Speed
12.4 kn

Destination
Research Station

ETA
12h 54m

Fuel
4,610 L

Current Risk
27/100
```

Environmental section:

```text
ENVIRONMENT

Sea Ice
42%

Icebergs
31

High-Risk Icebergs
4

Wind
18 kn

Current
0.31 m/s
```

Prediction section:

```text
AI FORECAST

Horizon
24 h

Confidence
87%

Route Conflict
No / Possible / Yes
```

---

# 27. Layer Controls

The map must allow layers to be independently enabled/disabled.

Minimum:

```text
☑ Sea Ice
☑ Icebergs
☑ Predicted Tracks
☑ Risk
☑ Recommended Route
☑ Vessel
```

Recommended:

```text
☐ Ocean Current
☐ Wind
☐ Satellite Background
```

---

# 28. Visual Style

The application should have an engineering/operations aesthetic.

Preferred characteristics:

- dark background
- high-contrast text
- restrained accent colors
- clear status indicators
- dense but readable information
- subtle borders
- minimal decorative elements
- strong hierarchy

Recommended semantic colors:

```text
Green   = recommended / low risk
Cyan    = environmental data
Amber   = warning
Red     = high risk / conflict
White   = primary information
Gray    = secondary information
```

The UI should not resemble a generic corporate dashboard.

---

# 29. Technical Architecture

## Frontend

```text
React
TypeScript
CesiumJS
Tailwind CSS
```

Responsibilities:

- 3D globe
- visual layers
- controls
- dashboard
- route visualization
- simulation timeline
- interaction

---

## Backend

```text
Python
FastAPI
```

Responsibilities:

- environment data
- prediction inference
- risk computation
- route calculation
- simulation state
- replanning

---

## Data Processing

```text
NumPy
Pandas
Xarray
GeoPandas
Shapely
pyproj
Rasterio
```

Responsibilities:

- geospatial preprocessing
- raster/vector handling
- NetCDF processing
- coordinate transformations
- environmental feature creation

---

## Machine Learning

Initial:

```text
Scikit-learn
```

Later/optional:

```text
PyTorch
```

The first model should prioritize:

- reproducibility
- evaluation
- speed
- interpretability
- ability to train locally

---

## Routing

Initial:

```text
A*
```

Future:

```text
D* Lite
```

D* Lite can be considered later because the environment is dynamic and routes may need to change as new conditions arrive.

---

# 30. Data Sources

Preferred sources:

## Sea Ice

Copernicus Marine Antarctic sea-ice products.

Use data such as:

- sea-ice concentration
- sea-ice edge
- sea-ice drift where appropriate

## Ocean

Copernicus Marine ocean/current products.

## Weather

ERA5 or another documented meteorological reanalysis/source.

## Icebergs

Use a documented historical iceberg trajectory dataset for MVP development.

Satellite-derived iceberg detection can be added later.

The implementation must record:

- source
- dataset name
- date/time
- spatial resolution
- temporal resolution
- license/access conditions
- preprocessing steps

---

# 31. Data Handling Strategy

Do not make the entire demo dependent on external network availability.

The application should have a local demo dataset/cache containing the exact data required for the demonstration.

Recommended structure:

```text
data/
├── sea_ice/
├── ocean/
├── weather/
├── iceberg_tracks/
├── demo_region/
└── metadata/
```

The application should work in two modes:

```text
DEMO MODE
Local cached data

LIVE/DATA MODE
External data source
```

Demo Mode must be reliable and deterministic.

---

# 32. Demo Region

Do not build the first MVP for the entire Antarctic Ocean.

Select one well-defined operating region.

The selected region should contain:

- meaningful sea-ice variation
- available environmental data
- iceberg trajectories
- a visually interesting route
- sufficient room for route alternatives

The region should be documented in configuration rather than hard-coded throughout the project.

---

# 33. API Design

Suggested API:

```text
GET  /health

GET  /environment
GET  /icebergs
GET  /icebergs/{id}

POST /predict/trajectory

POST /risk/grid

POST /route/generate

POST /route/compare

POST /route/replan

POST /simulation/start

POST /simulation/step

POST /simulation/reset
```

Example trajectory request:

```json
{
  "iceberg_id": "A27",
  "horizon_hours": 24
}
```

Example response:

```json
{
  "iceberg_id": "A27",
  "trajectory": [
    {
      "hour": 0,
      "lat": -64.21,
      "lon": -57.82
    },
    {
      "hour": 6,
      "lat": -64.23,
      "lon": -57.75
    }
  ],
  "uncertainty": [
    {
      "hour": 6,
      "radius_km": 2.1
    }
  ]
}
```

---

# 34. Database / Storage

For the first MVP, I should avoid unnecessary infrastructure.

Use:

- NetCDF
- Parquet
- JSON
- local model files

If a database becomes useful:

```text
PostgreSQL + PostGIS
```

can be added later.

The MVP should not require a complex distributed database stack.

---

# 35. Simulation Engine

The simulation should have a single consistent clock.

Example:

```text
simulation_time = 2026-08-25T14:00:00Z
```

Every simulation step should update:

```text
vessel position
iceberg positions
environmental state
risk grid
route validity
```

When a condition changes enough to invalidate the current route, the backend should trigger a replanning condition.

---

# 36. Reset and Reproducibility

The demo must have:

```text
[RESET DEMO]
```

Reset must return:

- vessel
- icebergs
- time
- route
- environment
- alerts

to the initial demo state.

The same demo scenario should be reproducible.

---

# 37. Error Handling

The system must not silently fail.

If a dataset cannot be loaded:

```text
DATA SOURCE ERROR

Unable to load live environmental data.

Using cached demonstration dataset.
```

The application should remain usable.

If the prediction model fails:

```text
PREDICTION ERROR

Trajectory model unavailable.
Using configured baseline prediction.
```

This fallback behavior must be explicit.

---

# 38. No Hollow Components

The following are prohibited in the main demo path:

```text
TODO
Coming Soon
Lorem ipsum
Fake AI score
Static route line labelled "AI Route"
Fake loading animation
Button that does nothing
Dashboard values disconnected from map
Hard-coded risk that never changes
Hard-coded trajectory unrelated to model/data
Screenshot pretending to be a live map
Static HTML presented as the completed system
```

A visual component can exist without being fully operational only when it is clearly marked as a future feature and is outside the core demo.

---

# 39. No Fake AI

The project must not claim:

```text
AI predicted iceberg trajectory
```

if the line is manually coded.

The actual pipeline must be:

```text
input data
   ↓
feature generation
   ↓
trained/defined model
   ↓
prediction
   ↓
API
   ↓
3D visualization
```

For demo reliability, the trained model can be packaged with the project.

---

# 40. No Fake Route Optimization

The route must come from:

```text
risk/cost grid
       ↓
routing algorithm
       ↓
candidate route
```

The application can precompute data for performance, but the route must remain generated from the route engine.

---

# 41. No Fake Dynamic Replanning

The simulation must actually alter the environmental state.

The route must be re-evaluated.

The new route must be calculated again.

The UI must display a measurable difference.

Example:

```text
Before:
Risk = 27

After environmental change:
Risk = 72

Replanned:
Risk = 19
```

---

# 42. Testing Requirements

At minimum, create tests for:

### Data

- coordinate conversion
- data loading
- missing-value handling

### ML

- model input shape
- prediction output
- trajectory error calculation

### Risk

- risk normalization
- iceberg proximity
- sea-ice contribution

### Routing

- start/goal handling
- obstacle avoidance
- route cost calculation

### Simulation

- time stepping
- vessel movement
- iceberg movement
- replanning trigger

### API

- `/health`
- `/predict/trajectory`
- `/route/generate`
- `/route/replan`

---

# 43. Performance Target

For the demo:

- 3D scene should remain interactive.
- Route generation should take seconds, not minutes.
- Prediction inference should be near-instant for a single iceberg.
- Simulation should update smoothly.
- The initial demo dataset should load quickly.

Heavy computation can be preprocessed or cached when necessary, but it must remain logically connected to the actual application.

---

# 44. Recommended Demo Sequence

The live demo should follow this exact sequence.

## Scene 1 — Opening

Show:

```text
ANTARCTIC NAVIGATION INTELLIGENCE
```

Camera is centered over Antarctica.

---

## Scene 2 — Mission Selection

Select:

```text
R/V POLARIS
Start
Destination
12 knots
```

Press:

```text
ANALYZE MISSION
```

---

## Scene 3 — Environmental Analysis

System loads:

- sea ice
- iceberg positions
- ocean currents
- weather
- vessel

---

## Scene 4 — Iceberg Analysis

Select a high-risk iceberg.

Show:

- current position
- size
- velocity
- predicted trajectory
- uncertainty

---

## Scene 5 — Route Calculation

Generate:

```text
Shortest
Fuel Optimized
AI Recommended
```

Compare:

- distance
- fuel
- ETA
- risk

---

## Scene 6 — Select AI Route

The recommended route becomes highlighted in the 3D view.

---

## Scene 7 — Run Simulation

Press:

```text
PLAY
```

Vessel moves.

Iceberg moves.

Timeline advances.

---

## Scene 8 — Hazard Event

A trajectory changes.

The system detects route conflict.

Show:

```text
ROUTE CONFLICT DETECTED
```

---

## Scene 9 — Replanning

Press:

```text
REPLAN
```

The route changes.

The system explains why.

---

## Scene 10 — Final Decision

Show:

```text
CURRENT ROUTE
Risk: 19
Fuel: XXXX L
ETA: XXh XXm

Status:
SAFE ROUTE RECOMMENDED
```

This is the final output of the demo.

---

# 45. What the Demo Must Prove

The demo should prove five things:

## 1. It can observe

It uses environmental data to understand Antarctic conditions.

## 2. It can detect/represent hazards

It can identify and display iceberg and sea-ice hazards.

## 3. It can predict

It estimates future iceberg movement.

## 4. It can reason

It converts environmental information into navigation risk.

## 5. It can decide and adapt

It generates a route and replans when conditions change.

The strongest conceptual chain is:

```text
OBSERVE
   ↓
PREDICT
   ↓
ASSESS
   ↓
OPTIMIZE
   ↓
SIMULATE
   ↓
REPLAN
```

---

# 46. Recommended Project Structure

```text
antarctic-navigation/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Globe/
│   │   │   ├── Vessel/
│   │   │   ├── Icebergs/
│   │   │   ├── SeaIce/
│   │   │   ├── Routes/
│   │   │   ├── Risk/
│   │   │   ├── Timeline/
│   │   │   └── Dashboard/
│   │   │
│   │   ├── pages/
│   │   │   ├── MissionPlanner/
│   │   │   ├── OperationsCenter/
│   │   │   └── Simulation/
│   │   │
│   │   ├── services/
│   │   ├── state/
│   │   └── types/
│   │
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── data/
│   │   ├── prediction/
│   │   ├── risk/
│   │   ├── routing/
│   │   ├── simulation/
│   │   └── models/
│   │
│   └── requirements.txt
│
├── ml/
│   ├── datasets/
│   ├── preprocessing/
│   ├── training/
│   ├── evaluation/
│   └── saved_models/
│
├── data/
│   ├── sea_ice/
│   ├── ocean/
│   ├── weather/
│   ├── iceberg_tracks/
│   ├── demo_region/
│   └── metadata/
│
├── notebooks/
│
├── tests/
│
├── scripts/
│
├── docker/
│
└── README.md
```

---

# 47. Development Order

I should implement in this order.

### Phase 1
3D globe + Antarctic region + UI shell.

### Phase 2
Research vessel + destination + route rendering.

### Phase 3
Sea-ice dataset + visualization.

### Phase 4
Iceberg dataset + 3D objects.

### Phase 5
Trajectory prediction model.

### Phase 6
Trajectory uncertainty.

### Phase 7
Risk grid.

### Phase 8
A* route generation.

### Phase 9
Fuel estimation.

### Phase 10
Route comparison.

### Phase 11
Simulation timeline.

### Phase 12
Dynamic replanning.

### Phase 13
Data caching / robustness.

### Phase 14
Testing and cleanup.

### Phase 15
Final demo scenario.

---

# 48. The MVP Should Be Demonstrable Offline

The final project should have a deterministic demo mode.

At minimum, package:

```text
demo sea-ice data
demo iceberg trajectories
demo weather/current data
trained prediction model
demo scenario configuration
```

The main demo must not fail simply because an external API is temporarily unavailable.

Live data integration can be an additional mode.

---

# 49. Documentation Requirements

The project README must explain:

- problem statement
- system architecture
- data sources
- data preprocessing
- ML model
- model evaluation
- risk model
- routing algorithm
- fuel model
- simulation
- API
- frontend
- installation
- running the project
- running the demo
- limitations
- future work

Also document clearly which components use:

```text
real data
historical data
simulated data
simplified models
```

---

# 50. Research/Engineering Integrity

I must make no unsupported claims.

Do not claim:

- operational maritime certification
- guaranteed collision avoidance
- exact fuel savings
- perfect iceberg prediction
- real-time global Antarctic coverage
- autonomous navigation

unless these are actually demonstrated and validated.

The MVP should be described as:

> **An AI-enabled research prototype for Antarctic navigation decision support.**

---

# 51. Final Technology Decision

Use this stack unless a concrete implementation issue requires a change:

```text
Frontend
React + TypeScript
CesiumJS
Tailwind CSS

Backend
Python
FastAPI

Data
Xarray
Pandas
NumPy
GeoPandas
Shapely
pyproj
Rasterio

Machine Learning
Scikit-learn
PyTorch later if required

Routing
A*

Storage
NetCDF
Parquet
JSON
local cached datasets

Optional later
PostgreSQL + PostGIS
D* Lite
live satellite ingestion
deep trajectory model
```

---

# 52. Final Non-Negotiable Requirements

The finished MVP **must** contain:

- [ ] Interactive 3D Antarctica
- [ ] Interactive camera controls
- [ ] Real 3D vessel object
- [ ] Vessel movement
- [ ] Destination selection
- [ ] Sea-ice concentration layer
- [ ] Iceberg dataset
- [ ] 3D iceberg objects
- [ ] Clickable iceberg information
- [ ] Iceberg trajectory prediction
- [ ] Trajectory visualization
- [ ] Prediction uncertainty
- [ ] Environmental/current information
- [ ] Navigation risk map
- [ ] Computational route optimization
- [ ] At least three route strategies
- [ ] Fuel estimation
- [ ] ETA estimation
- [ ] Route comparison
- [ ] AI recommendation
- [ ] Explanation of route selection
- [ ] Simulation timeline
- [ ] Moving vessel during simulation
- [ ] Moving icebergs during simulation
- [ ] Environmental state change
- [ ] Automatic/manual replanning
- [ ] Updated route after hazard change
- [ ] Resettable demo scenario
- [ ] Backend/API integration
- [ ] Real data or documented datasets
- [ ] Actual ML inference
- [ ] Actual route calculation
- [ ] Tests for critical functionality
- [ ] Installation/run documentation

---

# 53. Final Acceptance Test

I should be able to start from a clean installation and perform this:

```text
START APPLICATION
        ↓
SEE ANTARCTICA IN 3D
        ↓
SELECT VESSEL
        ↓
SELECT START
        ↓
SELECT DESTINATION
        ↓
LOAD ENVIRONMENT
        ↓
SEE SEA ICE + ICEBERGS
        ↓
SELECT ICEBERG
        ↓
RUN TRAJECTORY PREDICTION
        ↓
SEE FUTURE PATH + UNCERTAINTY
        ↓
GENERATE ROUTES
        ↓
COMPARE FUEL / ETA / RISK
        ↓
SELECT AI ROUTE
        ↓
RUN SIMULATION
        ↓
ICEBERG MOVES
        ↓
ROUTE RISK CHANGES
        ↓
SYSTEM DETECTS CONFLICT
        ↓
REPLAN
        ↓
NEW ROUTE APPEARS
        ↓
SYSTEM EXPLAINS CHANGE
```

If I cannot perform that sequence in the actual running application, the MVP is not finished.

---

# 54. Primary Goal

The final demo must make the following statement visually and technically obvious:

> **The system observes the Antarctic environment, predicts iceberg movement, converts future hazards into a navigation-risk field, chooses a safer/fuel-efficient route, and adapts that route when the environment changes.**

That is the MVP.

Everything else should support this core loop rather than distract from it.


---

# 55. STRICT AI IMPLEMENTATION DIRECTIVE

## This section is addressed directly to the AI/agent building this project.

I am providing this specification as the implementation contract for the project.

You must treat the complete specification as authoritative.

You are **not permitted to simplify, weaken, omit, replace, mock, fake, or downgrade any requirement merely because a simpler implementation would be easier**.

The objective is to build the project described in this document, not an approximation of it.

---

## 55.1 Do Not Degrade the Specification

You must not make decisions such as:

```text
"The user probably only needs a simple HTML page."

"This feature is too complicated, so I will make a placeholder."

"I can demonstrate this with a static image."

"I can hard-code the route."

"I can generate fake iceberg coordinates."

"I can use random numbers for AI output."

"I can make the button appear functional."

"I will implement the frontend first and leave the backend as a TODO."

"I will simulate the prediction instead of implementing it."

"I will use a simplified solution even though the specification explicitly requires the complete feature."

"I will remove features to make the project easier to finish."
```

These are not acceptable implementation strategies.

If the specification says a component must work, the component must actually work.

---

## 55.2 Do Not Use Hollow Implementations

The application must not contain fake functionality disguised as completed functionality.

The following are explicitly prohibited:

- hard-coded AI predictions presented as model predictions
- hard-coded routes presented as optimized routes
- hard-coded risk scores
- hard-coded fuel values
- hard-coded ETAs
- static iceberg trajectories
- fake model confidence values
- fake environmental values presented as live data
- buttons that only trigger animations
- UI controls that do not affect application state
- a static HTML/CSS mockup
- screenshots embedded as the primary visualization
- prerecorded animation pretending to be a simulation
- random data presented as scientific output
- placeholder APIs that return predetermined results
- empty API endpoints
- TODO implementations for required features
- fake loading screens
- fake AI labels
- decorative charts disconnected from the actual system
- route lines manually drawn to look optimized
- a "3D" page where the underlying functionality is only a 2D image
- a frontend-only application pretending to have a complete backend
- a backend-only implementation without the required working interface

If synthetic or simulated data is required for a specific controlled experiment, it must be explicitly identified as **simulation data**, and the computational system must actually consume and process that data.

---

# 56. No Arbitrary Simplification

Do not replace a specified requirement with an easier alternative without explicit authorization.

For example:

If the specification requires:

```text
3D interactive Antarctic environment
```

do not replace it with:

```text
2D Leaflet map
```

If the specification requires:

```text
trajectory prediction
```

do not replace it with:

```text
drawing a future line from the current position
```

If the specification requires:

```text
dynamic replanning
```

do not replace it with:

```text
two pre-created routes and a button that switches between them
```

If the specification requires:

```text
risk-aware routing
```

do not replace it with:

```text
shortest-path routing with a decorative risk score
```

If the specification requires:

```text
AI prediction
```

do not replace it with:

```text
random or manually selected coordinates
```

If a requirement is technically difficult, solve the engineering problem rather than silently reducing the requirement.

---

# 57. Do Not Skip Requirements

Every requirement in this document must be tracked.

Before implementation, create an internal requirement checklist containing every required feature.

For every requirement, track:

```text
Requirement
Implementation location
Dependencies
Status
Validation method
Evidence that it works
```

No requirement may silently disappear during development.

The final implementation must be checked against the entire specification.

---

# 58. Do Not Assume That "Demo" Means "Fake"

The word **MVP** or **demo** does not authorize a mockup.

The demo is a working prototype.

It must contain real computational flows.

For example:

```text
User input
    ↓
Frontend
    ↓
API
    ↓
Backend
    ↓
Data processing
    ↓
Model / algorithm
    ↓
Result
    ↓
API response
    ↓
Frontend state
    ↓
3D visualization
```

The user must be able to observe the output of the actual implementation.

---

# 59. User Already Understands Obvious Engineering Requirements

Do not waste implementation effort by repeatedly explaining obvious tasks to me as if they are missing from the project definition.

I already understand that the final system may require things such as:

- training a model
- obtaining datasets
- installing dependencies
- configuring environment variables
- providing API credentials
- configuring external services
- running preprocessing
- running training
- deploying services
- configuring domain/network access
- obtaining appropriate API keys
- downloading large datasets
- configuring credentials
- supplying real vessel parameters where required

These are normal project dependencies.

Your responsibility is to:

1. Identify them.
2. Document them.
3. Implement the system around them.
4. Provide exact setup instructions.
5. Clearly state what input/credential/configuration is required from me.
6. Continue implementing everything that can be implemented without that external input.

Do not use an obvious external dependency as an excuse to remove an entire feature.

---

# 60. AI Must Research Before Implementation

Before making significant architectural or technology decisions, the AI must research the current state of the technology.

The research must not be based only on general model knowledge.

The AI should use current external sources.

The target knowledge period is **2026**.

Do not blindly use outdated tutorials, obsolete libraries, deprecated APIs, or architectures that were standard several years ago.

---

# 61. Required Research Sources

The AI should research multiple categories of sources.

## 61.1 Academic literature

Search relevant:

- Google Scholar-indexed literature
- peer-reviewed journals
- conference papers
- arXiv where appropriate
- scientific repositories
- Antarctic research publications

Research areas should include:

- Antarctic sea-ice concentration
- sea-ice drift
- iceberg detection
- iceberg tracking
- iceberg trajectory prediction
- SAR iceberg detection
- multimodal environmental prediction
- machine learning for iceberg movement
- physics-informed ML
- vessel routing in sea ice
- polar navigation
- risk-aware path planning
- dynamic path planning
- fuel-aware marine routing
- uncertainty quantification
- probabilistic trajectory prediction

The AI must identify existing methods before designing a supposedly novel method.

---

# 62. GitHub Research Is Mandatory

The AI must search GitHub for existing implementations.

This is mandatory.

Search for relevant projects involving:

- CesiumJS Antarctic visualization
- 3D vessel tracking
- iceberg detection
- iceberg tracking
- sea-ice mapping
- Sentinel-1 processing
- Copernicus Marine access
- ERA5 processing
- sea-ice drift
- trajectory prediction
- marine route optimization
- A*
- D* Lite
- dynamic routing
- geospatial ML
- NetCDF/Xarray workflows
- PostGIS
- FastAPI + geospatial systems
- Cesium + React
- Cesium time-dynamic entities
- scientific visualization

For each useful repository, inspect:

- architecture
- implementation approach
- dependencies
- license
- maintenance status
- recent commits/releases
- known limitations
- whether it is production/research/demo quality
- whether components can legitimately be reused

Do not merely search GitHub and mention repository names.

Actually inspect relevant implementations.

---

# 63. Existing Projects Must Be Studied

Search for existing or previous systems that perform similar functions.

Examples of areas to investigate:

- Antarctic vessel navigation systems
- Antarctic sea-ice advisory systems
- iceberg detection systems
- iceberg tracking systems
- satellite-based navigation decision-support systems
- marine route optimization platforms
- polar research vessel navigation tools
- maritime digital twins
- ocean forecasting systems
- operational ice services
- AI-for-Earth-observation systems

The purpose is to determine:

```text
What already exists?
What works?
What does not work?
What data do they use?
What models do they use?
What limitations exist?
What can be reused?
What should be improved?
```

Do not claim novelty before checking prior art.

---

# 64. Research Must Influence Engineering Decisions

Research must not be performed as decoration.

For each major technology decision, the AI should determine:

```text
Candidate
    ↓
Current evidence
    ↓
Advantages
    ↓
Limitations
    ↓
Project compatibility
    ↓
Decision
```

For example, before selecting a trajectory model:

```text
Random Forest
Gradient Boosting
LSTM
Transformer
Physics-informed model
Hybrid model
```

the AI should compare them using evidence relevant to this project.

The selected model must have a documented reason.

---

# 65. Research Current Technology, Not Outdated Technology

Before choosing libraries/frameworks, verify:

- current stable version
- maintenance status
- compatibility
- licensing
- security concerns
- API status
- documentation quality
- community activity
- whether the project is still actively maintained

Do not select a library merely because an old tutorial uses it.

The target implementation environment is 2026.

---

# 66. Technology Gap Analysis

The AI must investigate what current technology still lacks.

The analysis should cover at least:

### Data limitations

- spatial resolution
- temporal resolution
- missing observations
- cloud/visibility limitations
- SAR limitations
- iceberg identification uncertainty
- sea-ice uncertainty

### Prediction limitations

- short-term vs long-term trajectory error
- environmental forcing uncertainty
- sparse iceberg observations
- model generalization
- uncertainty calibration

### Routing limitations

- static vs dynamic routing
- vessel-specific constraints
- fuel models
- sea-ice resistance
- iceberg uncertainty
- weather uncertainty

### System limitations

- data latency
- API availability
- compute requirements
- offline operation
- interoperability
- visualization
- explainability

These limitations should influence the design.

---

# 67. Ask Questions Before Implementation

Before beginning the irreversible/large-scale implementation, the AI must research the problem and identify genuine ambiguities or external dependencies.

If an answer is necessary to make a correct implementation decision, ask the question.

Examples of legitimate questions:

```text
Which Antarctic operating region should be the primary MVP region?

Which research-vessel parameters are available?

Which external API credentials are available?

Should the initial dataset be downloaded locally?

What GPU/CPU environment is available for model training?

What deployment target is required?
```

However, do not ask questions merely to avoid doing work.

If a sensible default can be implemented without affecting correctness, implement the default and document it.

Questions must be based on actual technical requirements discovered through research.

---

# 68. Do Not Stop Because Some Information Is Missing

If an external credential, dataset, or user-provided parameter is unavailable:

1. Identify exactly what is missing.
2. Implement everything else.
3. Create the integration point.
4. Document the required input.
5. Provide the exact setup procedure.
6. Do not replace the missing component with fake output.
7. Do not delete the feature.

For example:

If a live Copernicus credential is unavailable:

```text
Implement:
data ingestion interface
dataset parser
preprocessing
caching
environment API
visualization
```

and clearly require the credential for live-data execution.

The final system can still use a properly sourced local dataset for reproducible development/testing if that is technically appropriate.

---

# 69. AI Must Verify Its Own Work

After implementation, the AI must not assume the project works merely because files were created.

It must verify:

### Frontend

- application starts
- 3D globe renders
- entities render
- controls work
- state updates
- timeline works
- route appears
- iceberg selection works

### Backend

- server starts
- endpoints respond
- validation works
- model inference works
- routing works
- simulation works
- replanning works

### Data

- datasets load
- coordinates are correct
- timestamps are correct
- projections are handled correctly
- missing data is handled

### ML

- training pipeline works
- saved model can be loaded
- inference works
- evaluation works
- output is physically/geographically sensible

### Integration

- frontend → API works
- API → model works
- API → routing works
- backend → frontend visualization works
- simulation state propagates correctly

---

# 70. Verify Instead of Assuming

Every major claim should be verified where possible.

Examples:

Do not assume:

```text
Cesium supports this feature.
```

Check the current documentation/source.

Do not assume:

```text
This Copernicus dataset contains this variable.
```

Check the current dataset documentation.

Do not assume:

```text
This GitHub project still works.
```

Inspect its current state.

Do not assume:

```text
This model is appropriate for iceberg trajectories.
```

Check relevant research.

Do not assume:

```text
This API is still available.
```

Check the current API documentation.

---

# 71. Research Evidence Record

Maintain a research record in the project.

Recommended:

```text
research/
├── literature.md
├── github_projects.md
├── datasets.md
├── technology_comparison.md
├── prior_art.md
└── decisions.md
```

For each important external source record:

```text
Title
URL
Date accessed
Source type
Relevant finding
How it affects this project
```

For GitHub:

```text
Repository
URL
License
Last activity
Relevant implementation
Reusable component
Limitations
```

For research papers:

```text
Paper
Authors
Year
DOI/URL
Method
Dataset
Results
Limitations
Relevance
```

---

# 72. Citation and Attribution

Any external technology, dataset, algorithm, paper, repository, or significant factual claim used in the project should be properly attributed where appropriate.

Do not copy code from repositories without checking their licenses.

Do not incorporate GPL/AGPL or other restrictive code into the project without explicitly checking compatibility with the intended project license/distribution model.

Do not copy academic text.

Use research to inform implementation.

---

# 73. Current-Technology Audit

Before finalizing the stack, perform a technology audit covering:

```text
3D visualization
Frontend framework
Backend framework
ML framework
Geospatial libraries
Routing libraries
Data APIs
Satellite APIs
Weather APIs
Ocean APIs
Storage
Deployment
Testing
Monitoring
```

For each, compare realistic current alternatives.

The goal is not to use the newest technology merely because it is new.

The goal is to use the **best currently suitable technology for this system**.

---

# 74. No "Easy Way Out" Architecture

Do not intentionally choose a weaker architecture simply because it reduces implementation work.

Examples of unacceptable reasoning:

```text
"Use plain HTML because React is harder."

"Use a screenshot because Cesium is complicated."

"Use fake JSON because connecting the backend takes time."

"Hard-code the route because A* is easy to add later."

"Use random coordinates because the dataset is difficult."

"Skip model training because the evaluator won't know."

"Remove simulation because the demo already looks good."
```

The project is specifically being built to demonstrate the complete system.

Engineering effort is expected.

---

# 75. But Avoid Unjustified Complexity

The requirement to implement everything does not mean adding unrelated technologies.

Do not introduce:

- Kubernetes without a need
- microservices without a need
- distributed databases without a need
- unnecessary message queues
- unnecessary cloud infrastructure
- unnecessary AI agents
- unnecessary blockchain
- unnecessary LLM components

Use the simplest architecture that genuinely satisfies every requirement.

The rule is:

> **Do not simplify required functionality; do simplify unnecessary infrastructure.**

---

# 76. Model Training Is Part of the Project

The trajectory prediction component must have an actual training workflow.

Required components:

```text
Raw data
   ↓
Cleaning
   ↓
Feature generation
   ↓
Train/validation/test split
   ↓
Training
   ↓
Evaluation
   ↓
Model selection
   ↓
Saved model
   ↓
Inference API
```

Do not manually create a saved model containing arbitrary outputs.

The model must be reproducible from documented training data/code where licensing and dataset size permit.

---

# 77. Model Evaluation Must Be Honest

The evaluation must report actual metrics.

Potential metrics:

- MAE
- RMSE
- haversine trajectory error
- endpoint error
- horizon-specific error
- uncertainty coverage
- calibration metrics where applicable

Evaluate separately for:

```text
6 hours
12 hours
24 hours
```

or the forecast horizons actually supported.

Do not choose only a favorable metric.

---

# 78. Geospatial Correctness

The AI must pay particular attention to coordinate systems.

Antarctic datasets may use polar stereographic projections.

The system must correctly handle:

```text
latitude/longitude
WGS84
polar stereographic
raster coordinates
grid coordinates
```

Do not treat latitude/longitude degrees as Euclidean kilometers without appropriate transformation.

For distance, nearest-neighbor, grid and routing calculations, use appropriate geographic/projected calculations.

---

# 79. Physical Plausibility Checks

The system must include sanity checks.

Examples:

```text
Iceberg cannot teleport hundreds of kilometers
between adjacent timestamps.

Vessel cannot move beyond its configured speed.

Route cannot pass through prohibited/high-cost cells
when those cells are configured as impassable.

Coordinates must remain within valid geographic ranges.

Prediction timestamps must be ordered.

Negative distances must never occur.

Invalid environmental values must be detected.
```

These checks are essential because visually plausible output can still be mathematically wrong.

---

# 80. Demo Scenario Must Be Data-Driven

The final demo scenario should be defined in a configuration file.

Example:

```yaml
mission:
  vessel: R/V POLARIS
  start:
    lat: ...
    lon: ...
  destination:
    lat: ...
    lon: ...
  speed_knots: 12

simulation:
  start_time: ...
  duration_hours: 24

hazard_event:
  iceberg_id: ...
  trigger_time: ...
```

The event should drive the actual simulation.

It must not simply tell the frontend:

```text
show danger now
```

---

# 81. AI Must Not Randomly Invent Missing Details

When a technical value is unknown:

Do not silently invent a realistic-looking value and present it as fact.

Instead classify it as one of:

```text
Known from source
Derived
Estimated
Assumed
Simulated
User-provided
To be configured
```

This distinction should be maintained throughout the project.

---

# 82. Final Self-Audit Before Delivery

Before declaring the project complete, perform a complete audit against this document.

Create a table:

```text
Requirement | Implemented | Tested | Evidence
```

Every mandatory requirement must have:

```text
Implemented = YES
Tested = YES
Evidence = specific file/test/demo action
```

If something is not implemented, do not claim completion.

If something is blocked by an external dependency, explicitly identify it.

---

# 83. Final Demo Audit

Perform the entire demonstration from a clean start:

```text
1. Start application
2. Open 3D environment
3. Select mission
4. Load environment
5. Inspect iceberg
6. Run prediction
7. Inspect uncertainty
8. Generate routes
9. Compare routes
10. Select recommended route
11. Start simulation
12. Observe vessel movement
13. Observe iceberg movement
14. Trigger/receive environmental change
15. Detect route conflict
16. Replan
17. Verify new route
18. Verify changed risk/fuel/ETA
19. Reset
20. Repeat
```

The demonstration must be repeatable.

---

# 84. Core Instruction

The central instruction to the implementing AI is:

> **Build what is specified. Do not build a simplified interpretation of what is specified.**

You are allowed to make engineering decisions where the specification leaves room for them.

You are not allowed to remove requirements because they are inconvenient.

You are not allowed to replace working functionality with a mockup.

You are not allowed to hide missing functionality behind polished UI.

You are not allowed to claim that something works without testing it.

You are expected to research the problem, inspect existing technology and implementations, identify limitations, make evidence-based engineering decisions, implement the complete system, test it, and verify the final demo.

---

# 85. Expected AI Working Procedure

The implementing AI should follow this order:

```text
PHASE 0
Read the complete specification.

        ↓

PHASE 1
Identify requirements and dependencies.

        ↓

PHASE 2
Research current 2026 technology.

        ↓

PHASE 3
Research academic literature.

        ↓

PHASE 4
Research GitHub implementations.

        ↓

PHASE 5
Research existing Antarctic/marine systems.

        ↓

PHASE 6
Identify technology gaps and limitations.

        ↓

PHASE 7
Ask only genuinely necessary clarification questions.

        ↓

PHASE 8
Produce architecture and implementation plan.

        ↓

PHASE 9
Implement the actual system.

        ↓

PHASE 10
Train/evaluate the required ML components.

        ↓

PHASE 11
Integrate data + ML + routing + simulation.

        ↓

PHASE 12
Test every critical component.

        ↓

PHASE 13
Run the complete end-to-end demo.

        ↓

PHASE 14
Perform the requirement audit.

        ↓

PHASE 15
Fix every discovered failure.

        ↓

PHASE 16
Only then declare the MVP complete.
```

---

# 86. Final Principle

The purpose of this document is to prevent **implementation drift**.

The project must not start as:

```text
3D navigation system
```

and gradually become:

```text
HTML page with a map
```

It must not start as:

```text
AI iceberg prediction + route optimization
```

and become:

```text
static lines labelled AI
```

It must remain the system defined here:

```text
             REAL / DOCUMENTED DATA
                       ↓
              ENVIRONMENT ENGINE
                       ↓
              ICEBERG INTELLIGENCE
                       ↓
              TRAJECTORY PREDICTION
                       ↓
              UNCERTAINTY ESTIMATION
                       ↓
               RISK COMPUTATION
                       ↓
              ROUTE OPTIMIZATION
                       ↓
              3D DECISION SUPPORT
                       ↓
                 SIMULATION
                       ↓
              DYNAMIC REPLANNING
                       ↓
             HUMAN DECISION SUPPORT
```

**Do not remove a stage. Do not fake a stage. Do not silently downgrade a stage. Implement and verify the complete chain.**
