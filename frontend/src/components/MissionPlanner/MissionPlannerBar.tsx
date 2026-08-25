import React from 'react';
import { Ship, Compass, Shield, Fuel, PlayCircle, Loader2 } from 'lucide-react';
import { useNavigation } from '../../state/NavigationContext';

export const MissionPlannerBar: React.FC = () => {
  const {
    vesselName,
    vesselSpeed,
    setVesselSpeed,
    safetyPriority,
    setSafetyPriority,
    fuelPriority,
    setFuelPriority,
    calculateRoutes,
    isGeneratingRoutes,
  } = useNavigation();

  return (
    <header className="h-14 bg-polar-900/90 backdrop-blur-md border-b border-polar-700/60 px-4 flex items-center justify-between z-20 text-xs font-mono select-none">
      {/* Title & Brand */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400 font-bold text-base shadow-sm">
          🧊
        </div>
        <div>
          <h1 className="font-bold text-slate-100 text-sm tracking-wide flex items-center gap-2">
            POLARIS // ANTARCTIC NAVIGATION DECISION SUPPORT
          </h1>
          <p className="text-[10px] text-slate-400 font-sans">
            AI-Enabled Sea-Ice & Iceberg Trajectory Optimization System
          </p>
        </div>
      </div>

      {/* Mission Config Parameters */}
      <div className="hidden lg:flex items-center gap-6 bg-polar-950/60 py-1.5 px-4 rounded-lg border border-polar-800">
        {/* Vessel */}
        <div className="flex items-center gap-2">
          <Ship className="w-4 h-4 text-cyan-400" />
          <div>
            <span className="text-[9px] text-slate-400 block uppercase">Vessel</span>
            <span className="font-bold text-slate-200 text-[11px]">{vesselName} (PC6)</span>
          </div>
        </div>

        {/* Speed Slider */}
        <div className="flex items-center gap-2 border-l border-polar-800 pl-4">
          <Compass className="w-4 h-4 text-cyan-400" />
          <div>
            <div className="flex justify-between text-[9px] text-slate-400">
              <span>SPEED</span>
              <span className="text-cyan-300 font-bold">{vesselSpeed} kn</span>
            </div>
            <input
              type="range"
              min="6"
              max="18"
              step="0.5"
              value={vesselSpeed}
              onChange={(e) => setVesselSpeed(parseFloat(e.target.value))}
              className="w-20 h-1 bg-polar-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        </div>

        {/* Safety Priority Slider */}
        <div className="flex items-center gap-2 border-l border-polar-800 pl-4">
          <Shield className="w-4 h-4 text-emerald-400" />
          <div>
            <div className="flex justify-between text-[9px] text-slate-400">
              <span>SAFETY</span>
              <span className="text-emerald-400 font-bold">{(safetyPriority * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={safetyPriority}
              onChange={(e) => setSafetyPriority(parseFloat(e.target.value))}
              className="w-20 h-1 bg-polar-700 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
          </div>
        </div>

        {/* Fuel Priority Slider */}
        <div className="flex items-center gap-2 border-l border-polar-800 pl-4">
          <Fuel className="w-4 h-4 text-ice-blue" />
          <div>
            <div className="flex justify-between text-[9px] text-slate-400">
              <span>FUEL</span>
              <span className="text-ice-blue font-bold">{(fuelPriority * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={fuelPriority}
              onChange={(e) => setFuelPriority(parseFloat(e.target.value))}
              className="w-20 h-1 bg-polar-700 rounded-lg appearance-none cursor-pointer accent-ice-blue"
            />
          </div>
        </div>
      </div>

      {/* Action Button: Analyze Mission */}
      <div>
        <button
          onClick={calculateRoutes}
          disabled={isGeneratingRoutes}
          className="py-2 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-polar-950 font-bold flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/20 active:scale-95 disabled:opacity-50"
        >
          {isGeneratingRoutes ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>OPTIMIZING...</span>
            </>
          ) : (
            <>
              <PlayCircle className="w-4 h-4" />
              <span>ANALYZE MISSION</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
