import {
  EnvironmentResponse,
  Iceberg,
  TrajectoryResponse,
  RouteCompareResponse,
  SimulationState,
  GeoPoint,
} from '../types/navigation';

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? '' : 'http://127.0.0.1:8000');

export async function fetchHealth(): Promise<{ status: string; mode: string }> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
  return res.json();
}

export async function fetchEnvironment(): Promise<EnvironmentResponse> {
  const res = await fetch(`${API_BASE}/environment`);
  if (!res.ok) throw new Error(`Failed to load environment: ${res.statusText}`);
  return res.json();
}

export async function fetchIcebergs(): Promise<{ count: number; icebergs: Iceberg[] }> {
  const res = await fetch(`${API_BASE}/icebergs`);
  if (!res.ok) throw new Error(`Failed to load icebergs: ${res.statusText}`);
  return res.json();
}

export async function fetchIcebergById(id: string): Promise<Iceberg> {
  const res = await fetch(`${API_BASE}/icebergs/${id}`);
  if (!res.ok) throw new Error(`Failed to load iceberg ${id}: ${res.statusText}`);
  return res.json();
}

export async function predictTrajectory(
  icebergId: string,
  horizonHours: number = 24,
  stepHours: number = 2
): Promise<TrajectoryResponse> {
  const res = await fetch(`${API_BASE}/predict/trajectory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      iceberg_id: icebergId,
      horizon_hours: horizonHours,
      step_hours: stepHours,
    }),
  });
  if (!res.ok) throw new Error(`Trajectory prediction failed: ${res.statusText}`);
  return res.json();
}

export async function generateRoutes(params: {
  vessel_name?: string;
  vessel_speed_knots?: number;
  start: GeoPoint;
  destination: GeoPoint;
  safety_priority?: number;
  fuel_priority?: number;
}): Promise<RouteCompareResponse> {
  const res = await fetch(`${API_BASE}/route/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      vessel_name: params.vessel_name || 'R/V POLARIS',
      vessel_speed_knots: params.vessel_speed_knots || 12.0,
      start: params.start,
      destination: params.destination,
      safety_priority: params.safety_priority ?? 0.7,
      fuel_priority: params.fuel_priority ?? 0.3,
    }),
  });
  if (!res.ok) throw new Error(`Route generation failed: ${res.statusText}`);
  return res.json();
}

export async function startSimulation(
  speedKnots: number = 12.0,
  routeId: string = 'ai_recommended',
  waypoints?: any[]
): Promise<SimulationState> {
  const res = await fetch(`${API_BASE}/simulation/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      vessel_speed_knots: speedKnots,
      active_route_id: routeId,
      waypoints: waypoints,
    }),
  });
  if (!res.ok) throw new Error(`Failed to start simulation: ${res.statusText}`);
  return res.json();
}

export async function stepSimulation(
  stepMinutes: number = 30.0,
  injectHazard: boolean = false,
  hazardIcebergId: string = 'A27'
): Promise<SimulationState> {
  const res = await fetch(`${API_BASE}/simulation/step`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      step_minutes: stepMinutes,
      inject_hazard_event: injectHazard,
      hazard_iceberg_id: hazardIcebergId,
    }),
  });
  if (!res.ok) throw new Error(`Simulation step failed: ${res.statusText}`);
  return res.json();
}

export async function resetSimulation(): Promise<SimulationState> {
  const res = await fetch(`${API_BASE}/simulation/reset`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(`Failed to reset simulation: ${res.statusText}`);
  return res.json();
}

export async function triggerReplan(params: {
  vessel_name?: string;
  current_position: GeoPoint;
  destination: GeoPoint;
  current_time_hours?: number;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/route/replan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      vessel_name: params.vessel_name || 'R/V POLARIS',
      current_position: params.current_position,
      destination: params.destination,
      current_time_hours: params.current_time_hours ?? 1.0,
    }),
  });
  if (!res.ok) throw new Error(`Route replanning failed: ${res.statusText}`);
  return res.json();
}

export async function fetchSeaIceGrid(): Promise<{ lats: number[]; lons: number[]; sic: number[][]; bounds: any }> {
  const res = await fetch(`${API_BASE}/environment/sea_ice/grid`);
  if (!res.ok) throw new Error(`Failed to load sea-ice grid: ${res.statusText}`);
  return res.json();
}
