import React, { useEffect } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  AlertOctagon,
  RefreshCw,
  Clock,
  Ship,
  CheckCircle,
} from 'lucide-react';
import { useNavigation } from '../state/NavigationContext';

export const SimulationPage: React.FC = () => {
  const {
    simulation,
    isSimulating,
    simSpeedMultiplier,
    setSimSpeedMultiplier,
    startSim,
    pauseSim,
    stepSim,
    resetSim,
    vesselName,
    selectedRoute,
    hazardModalOpen,
    setHazardModalOpen,
    activeHazardAlert,
    replanActiveRoute,
    replanDiff,
  } = useNavigation();

  // Ensure simulation state is initialized when page opens
  useEffect(() => {
    if (!simulation) {
      stepSim(0, false);
    }
  }, [simulation, stepSim]);

  const elapsedHours = simulation?.elapsed_hours || 0.0;
  const progressPct = Math.min(100.0, (elapsedHours / 24.0) * 100.0);
  const currentRisk = simulation?.current_risk_score ?? selectedRoute?.average_risk_score ?? 27.0;

  const formatSimTime = (isoString?: string) => {
    if (!isoString) return '2026-08-25 14:00 UTC';
    const d = new Date(isoString);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')} UTC`;
  };

  return (
    <div className="flex-1 w-full h-full relative overflow-hidden flex select-none pointer-events-none">
      {/* Floating Top Telemetry HUD */}
      <div className="absolute top-6 left-6 z-10 p-4 ice-glass rounded-2xl shadow-2xl flex items-center gap-6 font-mono text-xs pointer-events-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-glacial-950/80 border border-sky-400/30 flex items-center justify-center text-sky-400">
            <Ship className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">Vessel Telemetry</span>
            <span className="font-bold text-white text-sm">{vesselName}</span>
          </div>
        </div>

        <div className="h-8 w-px bg-sky-400/15" />

        <div className="grid grid-cols-3 gap-4 text-[11px]">
          <div>
            <span className="text-slate-400 block text-[10px]">Speed & Heading</span>
            <span className="font-bold text-slate-200">
              {simulation?.vessel_speed_knots || 12.0} kn @ {simulation?.vessel_heading_deg.toFixed(0) || 125}°
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px]">Voyage Progress</span>
            <span className="font-bold text-sky-300">
              {simulation?.vessel_progress_pct.toFixed(0) || 0}% Complete
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px]">Current Risk Meter</span>
            <span
              className={`font-bold ${
                currentRisk < 35 ? 'text-emerald-400' : currentRisk < 65 ? 'text-amber-400' : 'text-rose-400'
              }`}
            >
              {currentRisk.toFixed(0)} / 100
            </span>
          </div>
        </div>
      </div>

      {/* Floating Top-Right Hazard Trigger Pill */}
      <div className="absolute top-6 right-6 z-10 pointer-events-auto">
        <button
          onClick={() => stepSim(60.0, true)}
          className="py-2.5 px-4 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-300 font-mono font-bold text-xs flex items-center gap-2 transition-all shadow-ice-card shadow-rose-950/40 active:scale-95"
          title="Inject Iceberg A-27 course change intersecting current route"
        >
          <AlertOctagon className="w-4 h-4 text-rose-400 animate-pulse" />
          <span>SIMULATE HAZARD CONFLICT</span>
        </button>
      </div>

      {/* Floating Bottom Timeline Controller */}
      <div className="absolute bottom-6 inset-x-6 z-10 max-w-4xl mx-auto ice-glass rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-6 font-mono text-xs pointer-events-auto">
        {/* Play/Pause & Step */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={isSimulating ? pauseSim : startSim}
            className={`p-3 rounded-xl flex items-center justify-center font-bold transition-all shadow-lg ${
              isSimulating
                ? 'bg-amber-400 hover:bg-amber-300 text-glacial-950 shadow-amber-500/20'
                : 'bg-gradient-to-r from-sky-400 to-teal-300 hover:from-sky-300 hover:to-teal-200 text-glacial-950 shadow-sky-500/20'
            }`}
          >
            {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          <button
            onClick={() => stepSim(30.0, false)}
            className="p-2.5 rounded-xl bg-glacial-950/60 hover:bg-glacial-850 text-slate-200 border border-sky-400/20 transition-colors"
            title="Step Forward (+30m)"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Multiplier Pills */}
          <div className="flex items-center bg-glacial-950/80 rounded-xl p-1 border border-sky-400/15 gap-1 text-[11px]">
            {[1, 10, 50].map((mult) => (
              <button
                key={mult}
                onClick={() => setSimSpeedMultiplier(mult)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                  simSpeedMultiplier === mult
                    ? 'bg-sky-400 text-glacial-950'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {mult}×
              </button>
            ))}
          </div>
        </div>

        {/* Center Progress Bar */}
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5 text-sky-300 font-bold">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              {formatSimTime(simulation?.simulation_time)}
            </span>
            <span className="text-slate-300 font-semibold">
              T + {elapsedHours.toFixed(1)}h <span className="text-slate-500 font-normal">/ 24.0h</span>
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-glacial-950 border border-sky-400/20 overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-sky-400 to-teal-300 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Reset Demo Button */}
        <button
          onClick={resetSim}
          className="p-2.5 px-3.5 rounded-xl bg-glacial-950/60 hover:bg-glacial-850 border border-sky-400/20 text-slate-300 font-semibold flex items-center gap-2 transition-colors text-[11px]"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>RESET</span>
        </button>
      </div>

      {/* Hazard Alert & Replanning Modal */}
      {(hazardModalOpen || replanDiff) && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="ice-glass border border-rose-500/50 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 font-mono text-xs animate-in zoom-in-95 duration-200">
            {!replanDiff && activeHazardAlert ? (
              <>
                <div className="flex items-center gap-3 text-rose-400 border-b border-rose-500/20 pb-3">
                  <AlertOctagon className="w-6 h-6 animate-bounce" />
                  <div>
                    <h3 className="font-bold text-sm text-white">ROUTE HAZARD DETECTED</h3>
                    <span className="text-[10px] text-rose-300">COLLISION INTERCEPT TRAJECTORY</span>
                  </div>
                </div>

                <p className="text-slate-200 font-sans text-xs leading-relaxed">
                  {activeHazardAlert.message}
                </p>

                <div className="p-3.5 rounded-xl bg-glacial-950 border border-rose-500/20 space-y-2 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Hazard Name:</span>
                    <span className="font-bold text-amber-400">{activeHazardAlert.iceberg_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Clearance Distance:</span>
                    <span className="font-bold text-rose-400">{activeHazardAlert.distance_km} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Corridor Risk:</span>
                    <span className="font-bold text-rose-400">{activeHazardAlert.corridor_risk_score} / 100</span>
                  </div>
                </div>

                <button
                  onClick={replanActiveRoute}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-glacial-950 font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 active:scale-98 transition-all text-xs"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>REPLAN SAFE ROUTE NOW</span>
                </button>
              </>
            ) : replanDiff ? (
              <>
                <div className="flex items-center gap-3 text-emerald-400 border-b border-emerald-500/20 pb-3">
                  <CheckCircle className="w-6 h-6" />
                  <div>
                    <h3 className="font-bold text-sm text-white">ROUTE RECALCULATED</h3>
                    <span className="text-[10px] text-emerald-300">HAZARD BYPASSED WITH SAFE CORRIDOR</span>
                  </div>
                </div>

                <p className="text-slate-200 font-sans text-xs leading-relaxed">
                  {replanDiff.reason}
                </p>

                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300">
                    <span className="text-[10px] block opacity-80">Old Threat Risk</span>
                    <span className="text-base font-bold">{replanDiff.oldRisk.toFixed(0)} / 100</span>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300">
                    <span className="text-[10px] block opacity-80">New Safe Risk</span>
                    <span className="text-base font-bold">{replanDiff.newRisk.toFixed(0)} / 100</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-glacial-950 border border-sky-400/10 flex justify-between text-[11px] text-slate-300">
                  <span>Delta Distance: <strong className="text-white">+{replanDiff.deltaDistKm} km</strong></span>
                  <span>Delta Fuel: <strong className="text-white">+{replanDiff.deltaFuelLiters} L</strong></span>
                </div>

                <button
                  onClick={() => setHazardModalOpen(false)}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-400 to-teal-300 text-glacial-950 font-bold transition-all"
                >
                  RESUME SIMULATION WITH SAFE ROUTE
                </button>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
