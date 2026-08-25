import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  EnvironmentResponse,
  Iceberg,
  TrajectoryResponse,
  RouteOption,
  SimulationState,
  GeoPoint,
  LayerVisibility,
  HazardAlert,
} from '../types/navigation';
import * as api from '../services/api';

export type AppPage = 'planner' | 'operations' | 'simulation' | 'analytics';

interface NavigationContextType {
  // Page Navigation
  activeTab: AppPage;
  setActiveTab: (tab: AppPage) => void;

  // Environment
  environment: EnvironmentResponse | null;
  isLoadingEnv: boolean;
  loadEnvironment: () => Promise<void>;

  // Icebergs & Trajectory
  icebergs: Iceberg[];
  selectedIceberg: Iceberg | null;
  setSelectedIceberg: (ib: Iceberg | null) => void;
  trajectory: TrajectoryResponse | null;
  isLoadingTrajectory: boolean;
  predictIcebergTrajectory: (icebergId: string) => Promise<void>;

  // Mission Planning & Routing
  vesselName: string;
  vesselSpeed: number;
  setVesselSpeed: (speed: number) => void;
  startPoint: GeoPoint;
  setStartPoint: (pt: GeoPoint) => void;
  destinationPoint: GeoPoint;
  setDestinationPoint: (pt: GeoPoint) => void;
  safetyPriority: number;
  setSafetyPriority: (val: number) => void;
  fuelPriority: number;
  setFuelPriority: (val: number) => void;

  routes: RouteOption[];
  selectedRoute: RouteOption | null;
  setSelectedRoute: (route: RouteOption | null) => void;
  isGeneratingRoutes: boolean;
  calculateRoutes: () => Promise<void>;

  // Simulation
  simulation: SimulationState | null;
  isSimulating: boolean;
  simSpeedMultiplier: number;
  setSimSpeedMultiplier: (mult: number) => void;
  startSim: () => Promise<void>;
  pauseSim: () => void;
  stepSim: (stepMinutes?: number, injectHazard?: boolean) => Promise<void>;
  resetSim: () => Promise<void>;
  replanActiveRoute: () => Promise<void>;

  // Layer Toggles
  layers: LayerVisibility;
  toggleLayer: (layerName: keyof LayerVisibility) => void;

  // Modals & UI States
  hazardModalOpen: boolean;
  setHazardModalOpen: (open: boolean) => void;
  activeHazardAlert: HazardAlert | null;
  replanDiff: {
    oldRisk: number;
    newRisk: number;
    deltaDistKm: number;
    deltaFuelLiters: number;
    reason: string;
  } | null;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Page tab
  const [activeTab, setActiveTab] = useState<AppPage>('planner');

  // Environmental state
  const [environment, setEnvironment] = useState<EnvironmentResponse | null>(null);
  const [isLoadingEnv, setIsLoadingEnv] = useState<boolean>(false);
  const [icebergs, setIcebergs] = useState<Iceberg[]>([]);
  const [selectedIceberg, setSelectedIceberg] = useState<Iceberg | null>(null);
  const [trajectory, setTrajectory] = useState<TrajectoryResponse | null>(null);
  const [isLoadingTrajectory, setIsLoadingTrajectory] = useState<boolean>(false);

  // Mission Planning
  const [vesselName] = useState<string>('R/V POLARIS');
  const [vesselSpeed, setVesselSpeed] = useState<number>(12.0);
  const [startPoint, setStartPoint] = useState<GeoPoint>({ lat: -62.30, lon: -59.20 }); // King George Island
  const [destinationPoint, setDestinationPoint] = useState<GeoPoint>({ lat: -64.77, lon: -64.05 }); // Palmer Station
  const [safetyPriority, setSafetyPriority] = useState<number>(0.75);
  const [fuelPriority, setFuelPriority] = useState<number>(0.25);

  // Routes
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteOption | null>(null);
  const [isGeneratingRoutes, setIsGeneratingRoutes] = useState<boolean>(false);

  // Simulation
  const [simulation, setSimulation] = useState<SimulationState | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simSpeedMultiplier, setSimSpeedMultiplier] = useState<number>(1);
  const [hazardModalOpen, setHazardModalOpen] = useState<boolean>(false);
  const [activeHazardAlert, setActiveHazardAlert] = useState<HazardAlert | null>(null);
  const [replanDiff, setReplanDiff] = useState<{
    oldRisk: number;
    newRisk: number;
    deltaDistKm: number;
    deltaFuelLiters: number;
    reason: string;
  } | null>(null);

  // Layer Visibility
  const [layers, setLayers] = useState<LayerVisibility>({
    seaIce: true,
    icebergs: true,
    trajectories: true,
    riskSurface: true,
    routes: true,
    vessel: true,
    stations: true,
    oceanCurrents: false,
  });

  const toggleLayer = (layerName: keyof LayerVisibility) => {
    setLayers((prev) => ({ ...prev, [layerName]: !prev[layerName] }));
  };

  // Load Environment
  const loadEnvironment = useCallback(async () => {
    setIsLoadingEnv(true);
    try {
      const data = await api.fetchEnvironment();
      setEnvironment(data);
      setIcebergs(data.icebergs);
      if (data.icebergs.length > 0 && !selectedIceberg) {
        setSelectedIceberg(data.icebergs[0]);
      }
    } catch (e) {
      console.error('Failed to load environment:', e);
    } finally {
      setIsLoadingEnv(false);
    }
  }, [selectedIceberg]);

  // Initial Load
  useEffect(() => {
    loadEnvironment();
  }, [loadEnvironment]);

  // Trajectory Prediction
  const predictIcebergTrajectory = async (icebergId: string) => {
    setIsLoadingTrajectory(true);
    try {
      const res = await api.predictTrajectory(icebergId, 24, 2);
      setTrajectory(res);
    } catch (e) {
      console.error('Trajectory prediction failed:', e);
    } finally {
      setIsLoadingTrajectory(false);
    }
  };

  // Calculate Routes
  const calculateRoutes = async () => {
    setIsGeneratingRoutes(true);
    try {
      const res = await api.generateRoutes({
        vessel_name: vesselName,
        vessel_speed_knots: vesselSpeed,
        start: startPoint,
        destination: destinationPoint,
        safety_priority: safetyPriority,
        fuel_priority: fuelPriority,
      });
      setRoutes(res.routes);
      const rec = res.routes.find((r) => r.is_recommended) || res.routes[0];
      setSelectedRoute(rec);
    } catch (e) {
      console.error('Route calculation failed:', e);
    } finally {
      setIsGeneratingRoutes(false);
    }
  };

  // Simulation Controls
  const startSim = async () => {
    try {
      const state = await api.startSimulation(
        vesselSpeed,
        selectedRoute?.route_id || 'ai_recommended',
        selectedRoute?.waypoints
      );
      setSimulation(state);
      setIsSimulating(true);
    } catch (e) {
      console.error('Start sim error:', e);
    }
  };

  const pauseSim = () => {
    setIsSimulating(false);
  };

  const stepSim = async (stepMinutes: number = 30.0, injectHazard: boolean = false) => {
    try {
      const state = await api.stepSimulation(stepMinutes, injectHazard, 'A27');
      setSimulation(state);
      setIcebergs(state.icebergs);

      if (state.active_hazard_alert) {
        setActiveHazardAlert(state.active_hazard_alert as HazardAlert);
        setHazardModalOpen(true);
        setIsSimulating(false); // Pause on conflict
      }
    } catch (e) {
      console.error('Step sim error:', e);
    }
  };

  const resetSim = async () => {
    try {
      const state = await api.resetSimulation();
      setSimulation(state);
      setIcebergs(state.icebergs);
      setIsSimulating(false);
      setHazardModalOpen(false);
      setActiveHazardAlert(null);
      setReplanDiff(null);
      await calculateRoutes();
    } catch (e) {
      console.error('Reset sim error:', e);
    }
  };

  const replanActiveRoute = async () => {
    if (!simulation) return;
    try {
      const res = await api.triggerReplan({
        vessel_name: vesselName,
        current_position: simulation.vessel_position,
        destination: destinationPoint,
        current_time_hours: simulation.elapsed_hours,
      });

      setSelectedRoute(res.replanned_route);
      setRoutes((prev) => [res.replanned_route, ...prev.filter((r) => r.route_id !== res.replanned_route.route_id)]);

      setReplanDiff({
        oldRisk: res.previous_risk_score,
        newRisk: res.new_risk_score,
        deltaDistKm: res.additional_distance_km,
        deltaFuelLiters: res.estimated_fuel_delta_liters,
        reason: res.explanation.primary_reason,
      });

      setHazardModalOpen(false);
      setActiveHazardAlert(null);
    } catch (e) {
      console.error('Replanning error:', e);
    }
  };

  // Sim animation tick loop
  useEffect(() => {
    let interval: any;
    if (isSimulating) {
      interval = setInterval(() => {
        stepSim(15.0 * simSpeedMultiplier, false);
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [isSimulating, simSpeedMultiplier]);

  return (
    <NavigationContext.Provider
      value={{
        activeTab,
        setActiveTab,
        environment,
        isLoadingEnv,
        loadEnvironment,
        icebergs,
        selectedIceberg,
        setSelectedIceberg,
        trajectory,
        isLoadingTrajectory,
        predictIcebergTrajectory,
        vesselName,
        vesselSpeed,
        setVesselSpeed,
        startPoint,
        setStartPoint,
        destinationPoint,
        setDestinationPoint,
        safetyPriority,
        setSafetyPriority,
        fuelPriority,
        setFuelPriority,
        routes,
        selectedRoute,
        setSelectedRoute,
        isGeneratingRoutes,
        calculateRoutes,
        simulation,
        isSimulating,
        simSpeedMultiplier,
        setSimSpeedMultiplier,
        startSim,
        pauseSim,
        stepSim,
        resetSim,
        replanActiveRoute,
        layers,
        toggleLayer,
        hazardModalOpen,
        setHazardModalOpen,
        activeHazardAlert,
        replanDiff,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
