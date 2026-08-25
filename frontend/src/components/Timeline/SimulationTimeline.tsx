import React from 'react';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { useNavigation } from '../../state/NavigationContext';

export const SimulationTimeline: React.FC = () => {
  const {
    simulation,
    isSimulating,
    simSpeedMultiplier,
    setSimSpeedMultiplier,
    startSim,
    pauseSim,
    stepSim,
    resetSim,
  } = useNavigation();

  const elapsedHours = simulation?.elapsed_hours || 0.0;
  const progressPct = Math.min(100.0, (elapsedHours / 24.0) * 100.0);

  const formatSimTime = (isoString?: string) => {
    if (!isoString) return '2026-08-25 14:00 UTC';
    const d = new Date(isoString);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')} UTC`;
  };

  return (
    <div className="h-16 bg-polar-900/95 backdrop-blur-md border-t border-polar-700/60 px-6 flex items-center justify-between z-20 text-xs font-mono select-none">
      {/* Left: Play/Pause/Step Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={isSimulating ? pauseSim : startSim}
          className={`p-2.5 rounded-lg flex items-center justify-center font-bold transition-all shadow-md ${
            isSimulating
              ? 'bg-amber-500 hover:bg-amber-400 text-polar-950 shadow-amber-500/20'
              : 'bg-cyan-500 hover:bg-cyan-400 text-polar-950 shadow-cyan-500/20'
          }`}
          title={isSimulating ? 'Pause Simulation' : 'Run Simulation'}
        >
          {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>

        <button
          onClick={() => stepSim(30.0, false)}
          className="p-2 rounded-lg bg-polar-800 hover:bg-polar-750 text-slate-200 border border-polar-700 transition-colors"
          title="Step Forward (+30m)"
        >
          <SkipForward className="w-4 h-4" />
        </button>

        {/* Speed Multipliers */}
        <div className="flex items-center bg-polar-950 rounded-lg p-1 border border-polar-800 gap-1 text-[11px]">
          {[1, 10, 50].map((mult) => (
            <button
              key={mult}
              onClick={() => setSimSpeedMultiplier(mult)}
              className={`px-2 py-0.5 rounded font-bold transition-colors ${
                simSpeedMultiplier === mult
                  ? 'bg-cyan-500 text-polar-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {mult}×
            </button>
          ))}
        </div>
      </div>

      {/* Center: Timeline Progress Bar */}
      <div className="flex-1 max-w-2xl px-6 flex flex-col justify-center">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
          <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
            <Clock className="w-3.5 h-3.5" />
            {formatSimTime(simulation?.simulation_time)}
          </span>
          <span className="text-slate-300">
            T + {elapsedHours.toFixed(1)}h <span className="text-slate-500">/ 24.0h</span>
          </span>
        </div>

        {/* Bar */}
        <div className="w-full h-2 rounded-full bg-polar-950 border border-polar-800 overflow-hidden relative">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-ice-blue rounded-full transition-all duration-300 relative"
            style={{ width: `${progressPct}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-cyan-300 border-2 border-polar-900 shadow-md"></div>
          </div>
        </div>
      </div>

      {/* Right: Hazard Injection & Reset Demo Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => stepSim(60.0, true)}
          className="py-2 px-3 rounded-lg bg-rose-950/80 hover:bg-rose-900/80 border border-rose-500/50 text-rose-300 font-bold flex items-center gap-1.5 transition-all shadow-md shadow-rose-950/40 text-[11px]"
          title="Simulate sudden iceberg course change directly intersecting vessel path"
        >
          <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
          <span>INJECT HAZARD EVENT</span>
        </button>

        <button
          onClick={resetSim}
          className="py-2 px-3 rounded-lg bg-polar-800 hover:bg-polar-750 border border-polar-700 text-slate-300 font-bold flex items-center gap-1.5 transition-colors text-[11px]"
          title="Reset vessel, icebergs, clock, and demo scenario"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>RESET DEMO</span>
        </button>
      </div>
    </div>
  );
};
