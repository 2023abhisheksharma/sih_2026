import React, { useState } from 'react';
import {
  ShieldCheck,
  Layers,
  ArrowRight,
  Sparkles,
  Info,
  Loader2,
} from 'lucide-react';
import { SeaIceLegend } from '../components/SeaIce/SeaIceLegend';
import { useNavigation } from '../state/NavigationContext';
import { Iceberg } from '../types/navigation';

export const OperationsPage: React.FC = () => {
  const {
    routes,
    selectedRoute,
    setSelectedRoute,
    icebergs,
    selectedIceberg,
    setSelectedIceberg,
    isLoadingTrajectory,
    predictIcebergTrajectory,
    layers,
    toggleLayer,
    setActiveTab,
  } = useNavigation();

  const [leftTab, setLeftTab] = useState<'routes' | 'icebergs'>('routes');

  const handleForecast = (ib: Iceberg) => {
    setSelectedIceberg(ib);
    predictIcebergTrajectory(ib.id);
  };

  return (
    <div className="flex-1 w-full h-full relative overflow-hidden flex select-none pointer-events-none">
      {/* Floating Sea Ice Legend */}
      <div className="pointer-events-auto">
        <SeaIceLegend />
      </div>

      {/* Floating Left Operations Card (Routes & Iceberg Intel) */}
      <div className="absolute top-6 left-6 z-10 w-96 max-h-[calc(100vh-8rem)] flex flex-col ice-glass rounded-2xl overflow-hidden shadow-2xl pointer-events-auto">
        {/* Header Tabs */}
        <div className="p-1.5 bg-glacial-950/70 border-b border-sky-400/10 flex items-center gap-1 font-mono text-xs">
          <button
            onClick={() => setLeftTab('routes')}
            className={`flex-1 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
              leftTab === 'routes'
                ? 'bg-glacial-850 text-white border border-sky-400/30 shadow-ice-glow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            <span>Route Options ({routes.length})</span>
          </button>

          <button
            onClick={() => setLeftTab('icebergs')}
            className={`flex-1 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
              leftTab === 'icebergs'
                ? 'bg-glacial-850 text-white border border-sky-400/30 shadow-ice-glow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="text-sm">🧊</span>
            <span>Icebergs ({icebergs.length})</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs">
          {leftTab === 'routes' ? (
            <>
              {/* Route Candidate Cards */}
              <div className="space-y-3">
                {routes.map((route) => {
                  const isSelected = selectedRoute?.route_id === route.route_id;
                  const isAi = route.is_recommended;

                  return (
                    <div
                      key={route.route_id}
                      onClick={() => setSelectedRoute(route)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2.5 ${
                        isSelected
                          ? 'bg-glacial-800/90 border-sky-400/50 shadow-ice-glow-sm ring-1 ring-sky-400/30'
                          : 'bg-glacial-950/60 border-sky-400/10 hover:border-sky-400/30'
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono">
                        <span className="font-bold text-white text-xs">{route.name}</span>
                        {isAi && (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[9px] font-bold border border-emerald-500/30">
                            AI RECOMMENDED
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
                        <div className="p-1.5 rounded bg-glacial-900/80 text-slate-300">
                          Dist: <strong className="text-white">{route.distance_km} km</strong>
                        </div>
                        <div className="p-1.5 rounded bg-glacial-900/80 text-slate-300">
                          Fuel: <strong className="text-white">{route.estimated_fuel_liters.toLocaleString()} L</strong>
                        </div>
                        <div className="p-1.5 rounded bg-glacial-900/80 text-slate-300">
                          Time: <strong className="text-white">{route.travel_time_formatted}</strong>
                        </div>
                        <div
                          className={`p-1.5 rounded font-bold ${
                            route.average_risk_score < 35
                              ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-500/30'
                              : route.average_risk_score < 65
                              ? 'bg-amber-950/50 text-amber-300 border border-amber-500/30'
                              : 'bg-rose-950/50 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          Risk: {route.average_risk_score} / 100
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* AI Route Explanation Rationale */}
              {selectedRoute?.explanation && (
                <div className="p-3.5 rounded-xl bg-glacial-950/80 border border-sky-400/15 space-y-2 font-mono text-[11px]">
                  <div className="flex items-center gap-1.5 text-sky-400 font-bold border-b border-sky-400/10 pb-1.5 text-xs">
                    <Info className="w-3.5 h-3.5" />
                    <span>OPERATIONAL RATIONALE</span>
                  </div>
                  <p className="text-slate-300 font-sans text-xs leading-relaxed">
                    {selectedRoute.explanation.primary_reason}
                  </p>

                  <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px] text-slate-400">
                    <div>Iceberg Hazard: <strong className="text-amber-400">{selectedRoute.explanation.predicted_iceberg_risk_pct}%</strong></div>
                    <div>Sea Ice Exposure: <strong className="text-sky-300">{selectedRoute.explanation.sea_ice_exposure_pct}%</strong></div>
                  </div>
                </div>
              )}

              {/* Proceed to Simulation CTA */}
              <button
                onClick={() => setActiveTab('simulation')}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-400 to-teal-300 hover:from-sky-300 hover:to-teal-200 text-glacial-950 font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 active:scale-98 transition-all"
              >
                <span>PROCEED TO SIMULATION</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            /* Iceberg Intelligence Tab */
            <div className="space-y-3">
              <p className="text-slate-400 font-sans text-xs">
                Select an iceberg to inspect dimensions and compute its 24h physics-informed ML drift trajectory.
              </p>

              <div className="space-y-2.5">
                {icebergs.map((ib) => {
                  const isSelected = selectedIceberg?.id === ib.id;
                  return (
                    <div
                      key={ib.id}
                      onClick={() => setSelectedIceberg(ib)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer space-y-2 ${
                        isSelected
                          ? 'bg-glacial-800/90 border-sky-400/50 shadow-ice-glow-sm'
                          : 'bg-glacial-950/60 border-sky-400/10 hover:border-sky-400/30'
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono">
                        <span className="font-bold text-white text-xs">{ib.name}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            ib.risk_level === 'CRITICAL'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : ib.risk_level === 'HIGH'
                              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {ib.risk_level}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-1 text-[10px] font-mono text-slate-400">
                        <div>Size: <strong className="text-slate-200">{ib.length_km} × {ib.width_km} km</strong></div>
                        <div>Drift: <strong className="text-slate-200">{ib.drift_speed_mps.toFixed(2)} m/s</strong></div>
                        <div>Heading: <strong className="text-slate-200">{ib.drift_heading_deg.toFixed(0)}°</strong></div>
                        <div>Draft: <strong className="text-slate-200">{ib.draft_m} m</strong></div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleForecast(ib);
                        }}
                        disabled={isLoadingTrajectory && selectedIceberg?.id === ib.id}
                        className="w-full py-1.5 px-3 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/30 text-sky-300 font-mono font-semibold flex items-center justify-center gap-1.5 transition-all text-[11px]"
                      >
                        {isLoadingTrajectory && selectedIceberg?.id === ib.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                        <span>FORECAST 24H TRACK</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Top-Right Layer Toggle Pills */}
      <div className="absolute top-6 right-6 z-10 flex items-center gap-2 p-1.5 ice-glass rounded-xl font-mono text-xs shadow-xl">
        <span className="text-slate-400 px-2 flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-sky-400" /> Layers:
        </span>
        <button
          onClick={() => toggleLayer('seaIce')}
          className={`px-3 py-1 rounded-lg transition-colors font-medium ${
            layers.seaIce ? 'bg-sky-500/30 text-sky-200 border border-sky-400/40' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          Sea Ice
        </button>
        <button
          onClick={() => toggleLayer('icebergs')}
          className={`px-3 py-1 rounded-lg transition-colors font-medium ${
            layers.icebergs ? 'bg-sky-500/30 text-sky-200 border border-sky-400/40' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          Icebergs
        </button>
        <button
          onClick={() => toggleLayer('routes')}
          className={`px-3 py-1 rounded-lg transition-colors font-medium ${
            layers.routes ? 'bg-sky-500/30 text-sky-200 border border-sky-400/40' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          A* Routes
        </button>
        <button
          onClick={() => toggleLayer('trajectories')}
          className={`px-3 py-1 rounded-lg transition-colors font-medium ${
            layers.trajectories ? 'bg-sky-500/30 text-sky-200 border border-sky-400/40' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          AI Tracks
        </button>
      </div>
    </div>
  );
};
