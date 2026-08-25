import React from 'react';
import {
  Compass,
  Ship,
  Wind,
  Waves,
  Thermometer,
  ShieldAlert,
  Layers,
  Cpu,
  Navigation,
  Fuel,
  Clock,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { useNavigation } from '../../state/NavigationContext';

export const OperationsDashboard: React.FC<{
  onOpenRouteComparison: () => void;
  onOpenIcebergInspector: () => void;
}> = ({ onOpenRouteComparison, onOpenIcebergInspector }) => {
  const {
    environment,
    simulation,
    selectedRoute,
    selectedIceberg,
    vesselName,
    vesselSpeed,
    destinationPoint,
    layers,
    toggleLayer,
  } = useNavigation();

  const currentRisk = simulation?.current_risk_score ?? selectedRoute?.average_risk_score ?? 27.0;

  const getRiskColor = (risk: number) => {
    if (risk < 35) return 'text-emerald-400 border-emerald-500/30 bg-emerald-950/40';
    if (risk < 65) return 'text-amber-400 border-amber-500/30 bg-amber-950/40';
    return 'text-rose-400 border-rose-500/30 bg-rose-950/40';
  };

  return (
    <aside className="w-96 h-full bg-polar-900/90 backdrop-blur-md border-l border-polar-700/60 flex flex-col z-10 text-xs shadow-2xl overflow-y-auto">
      {/* 1. Header & Live Telemetry Clock */}
      <div className="p-4 border-b border-polar-700/60 bg-polar-950/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="font-mono font-semibold tracking-wider text-slate-200 text-[11px]">
            OPS-CONSOLE // ANTARCTICA
          </span>
        </div>
        <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 font-mono text-[10px]">
          SYS: READY
        </span>
      </div>

      <div className="p-4 space-y-4 flex-1">
        {/* 2. Mission Status Card */}
        <div className="rounded-lg border border-polar-700/70 bg-polar-850/70 p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <Ship className="w-3.5 h-3.5 text-cyan-400" /> Mission Telemetry
            </span>
            <span className="text-cyan-400 font-mono font-bold text-xs">{vesselName}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 font-mono">
            <div className="p-2 rounded bg-polar-900/80 border border-polar-750">
              <div className="text-slate-400 text-[10px] flex items-center gap-1">
                <Compass className="w-3 h-3 text-cyan-400" /> Speed
              </div>
              <div className="text-sm font-bold text-slate-100 mt-0.5">
                {simulation?.vessel_speed_knots || vesselSpeed} <span className="text-[10px] text-slate-400 font-normal">kn</span>
              </div>
            </div>

            <div className="p-2 rounded bg-polar-900/80 border border-polar-750">
              <div className="text-slate-400 text-[10px] flex items-center gap-1">
                <Clock className="w-3 h-3 text-cyan-400" /> ETA
              </div>
              <div className="text-sm font-bold text-slate-100 mt-0.5">
                {selectedRoute?.travel_time_formatted || '12h 54m'}
              </div>
            </div>

            <div className="p-2 rounded bg-polar-900/80 border border-polar-750">
              <div className="text-slate-400 text-[10px] flex items-center gap-1">
                <Fuel className="w-3 h-3 text-cyan-400" /> Est. Fuel
              </div>
              <div className="text-sm font-bold text-slate-100 mt-0.5">
                {selectedRoute?.estimated_fuel_liters.toLocaleString() || '4,610'}{' '}
                <span className="text-[10px] text-slate-400 font-normal">L</span>
              </div>
            </div>

            <div className={`p-2 rounded border ${getRiskColor(currentRisk)}`}>
              <div className="text-[10px] flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" /> Risk Index
              </div>
              <div className="text-sm font-bold mt-0.5">
                {currentRisk.toFixed(0)} <span className="text-[10px] font-normal opacity-80">/ 100</span>
              </div>
            </div>
          </div>

          <div className="pt-1 text-[11px] text-slate-400 font-mono">
            Dest: <span className="text-slate-200">Palmer Station ({destinationPoint.lat.toFixed(2)}°S, {destinationPoint.lon.toFixed(2)}°W)</span>
          </div>
        </div>

        {/* 3. Environmental Intelligence Card */}
        <div className="rounded-lg border border-polar-700/70 bg-polar-850/70 p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <Waves className="w-3.5 h-3.5 text-cyan-400" /> Metocean Context
            </span>
            <span className="text-slate-400 font-mono text-[10px]">CMEMS / ERA5</span>
          </div>

          <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
            <div className="flex justify-between items-center p-1.5 rounded bg-polar-900/60">
              <span className="text-slate-400 flex items-center gap-1">
                <Layers className="w-3 h-3 text-ice-blue" /> Sea Ice (SIC)
              </span>
              <span className="font-bold text-slate-200">
                {environment ? (environment.summary.mean_sea_ice_concentration * 100).toFixed(0) : 42}%
              </span>
            </div>

            <div className="flex justify-between items-center p-1.5 rounded bg-polar-900/60">
              <span className="text-slate-400 flex items-center gap-1">
                <Wind className="w-3 h-3 text-slate-300" /> Wind
              </span>
              <span className="font-bold text-slate-200">
                {environment?.summary.mean_wind_speed_knots || 18.2} kn
              </span>
            </div>

            <div className="flex justify-between items-center p-1.5 rounded bg-polar-900/60">
              <span className="text-slate-400 flex items-center gap-1">
                <Waves className="w-3 h-3 text-cyan-400" /> Ocean Current
              </span>
              <span className="font-bold text-slate-200">
                {environment?.summary.mean_ocean_current_mps || 0.31} m/s
              </span>
            </div>

            <div className="flex justify-between items-center p-1.5 rounded bg-polar-900/60">
              <span className="text-slate-400 flex items-center gap-1">
                <Thermometer className="w-3 h-3 text-rose-400" /> Air Temp
              </span>
              <span className="font-bold text-slate-200">
                {environment?.summary.surface_temp_celsius || -4.5}°C
              </span>
            </div>
          </div>
        </div>

        {/* 4. AI Forecast & Trajectory Intelligence */}
        <div className="rounded-lg border border-polar-700/70 bg-polar-850/70 p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" /> AI Trajectory Engine
            </span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 font-mono text-[9px]">
              HYBRID-ML
            </span>
          </div>

          <div className="p-2 rounded bg-polar-900/90 border border-polar-750 font-mono space-y-1.5 text-[11px]">
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Target Iceberg:</span>
              <span className="font-bold text-amber-400">
                {selectedIceberg ? `${selectedIceberg.id} (${selectedIceberg.risk_level})` : 'A27 (HIGH)'}
              </span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Forecast Horizon:</span>
              <span className="font-bold text-slate-200">24 Hours (Δt=2h)</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Model Confidence:</span>
              <span className="font-bold text-emerald-400">88.4% Calibrated</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Route Intercept:</span>
              <span className={`font-bold ${simulation?.replan_required ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                {simulation?.replan_required ? 'CRITICAL CONFLICT' : 'CLEAR (<18 km)'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onOpenIcebergInspector}
              className="py-2 px-3 rounded bg-polar-750 hover:bg-polar-700 border border-polar-600 font-mono text-cyan-300 flex items-center justify-center gap-1.5 transition-all text-[11px]"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Iceberg Intel
            </button>
            <button
              onClick={onOpenRouteComparison}
              className="py-2 px-3 rounded bg-cyan-950/80 hover:bg-cyan-900/80 border border-cyan-500/40 font-mono text-cyan-400 font-semibold flex items-center justify-center gap-1.5 transition-all text-[11px]"
            >
              <Navigation className="w-3.5 h-3.5" /> Compare Routes
            </button>
          </div>
        </div>

        {/* 5. Geospatial Layer Toggles */}
        <div className="rounded-lg border border-polar-700/70 bg-polar-850/70 p-3.5 space-y-2.5">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" /> Active Map Layers
          </span>

          <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
            <button
              onClick={() => toggleLayer('seaIce')}
              className={`p-1.5 rounded border text-left flex items-center justify-between ${
                layers.seaIce ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300' : 'bg-polar-900/40 border-polar-750 text-slate-500'
              }`}
            >
              <span>Sea Ice</span>
              <span className="text-[9px]">{layers.seaIce ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={() => toggleLayer('icebergs')}
              className={`p-1.5 rounded border text-left flex items-center justify-between ${
                layers.icebergs ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300' : 'bg-polar-900/40 border-polar-750 text-slate-500'
              }`}
            >
              <span>Icebergs</span>
              <span className="text-[9px]">{layers.icebergs ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={() => toggleLayer('trajectories')}
              className={`p-1.5 rounded border text-left flex items-center justify-between ${
                layers.trajectories ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300' : 'bg-polar-900/40 border-polar-750 text-slate-500'
              }`}
            >
              <span>AI Corridors</span>
              <span className="text-[9px]">{layers.trajectories ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={() => toggleLayer('routes')}
              className={`p-1.5 rounded border text-left flex items-center justify-between ${
                layers.routes ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300' : 'bg-polar-900/40 border-polar-750 text-slate-500'
              }`}
            >
              <span>A* Routes</span>
              <span className="text-[9px]">{layers.routes ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
