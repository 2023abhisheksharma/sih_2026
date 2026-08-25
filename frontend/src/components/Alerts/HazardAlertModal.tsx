import React from 'react';
import { AlertOctagon, RefreshCw, CheckCircle, X } from 'lucide-react';
import { useNavigation } from '../../state/NavigationContext';

export const HazardAlertModal: React.FC = () => {
  const {
    hazardModalOpen,
    setHazardModalOpen,
    activeHazardAlert,
    replanActiveRoute,
    replanDiff,
  } = useNavigation();

  if (!hazardModalOpen && !replanDiff) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-polar-900 border border-rose-500/60 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden font-mono text-xs animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-rose-500/30 bg-rose-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-400">
            <AlertOctagon className="w-5 h-5 animate-bounce" />
            <h2 className="text-sm font-bold tracking-wide">
              {replanDiff ? 'ROUTE DYNAMICALLY UPDATED' : '⚠ CRITICAL ROUTE HAZARD DETECTED'}
            </h2>
          </div>
          <button
            onClick={() => setHazardModalOpen(false)}
            className="p-1 rounded-lg hover:bg-rose-900/50 text-rose-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {!replanDiff && activeHazardAlert ? (
            <>
              <p className="text-slate-200 font-sans text-xs leading-relaxed">
                {activeHazardAlert.message}
              </p>

              <div className="p-3.5 rounded-lg bg-polar-950 border border-polar-800 space-y-2 text-[11px]">
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Hazard Object:</span>
                  <span className="font-bold text-amber-400">{activeHazardAlert.iceberg_name}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Clearance Distance:</span>
                  <span className="font-bold text-rose-400">{activeHazardAlert.distance_km} km (UNSAFE)</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Est. Time to Intercept:</span>
                  <span className="font-bold text-slate-100">{activeHazardAlert.estimated_intercept_hours} hours</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Current Corridor Risk:</span>
                  <span className="font-bold text-rose-400">{activeHazardAlert.corridor_risk_score} / 100</span>
                </div>
              </div>

              <button
                onClick={replanActiveRoute}
                className="w-full py-3 px-4 rounded-lg bg-rose-500 hover:bg-rose-400 text-polar-950 font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-500/20 active:scale-98"
              >
                <RefreshCw className="w-4 h-4" />
                <span>REPLAN OPTIMAL SAFE ROUTE NOW</span>
              </button>
            </>
          ) : replanDiff ? (
            <>
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <CheckCircle className="w-5 h-5" />
                <span>SUCCESSFULLY RECALCULATED SECURE CORRIDOR</span>
              </div>

              <p className="text-slate-300 font-sans text-xs leading-relaxed">
                {replanDiff.reason}
              </p>

              {/* Old vs New Risk Card */}
              <div className="grid grid-cols-2 gap-3 font-mono text-[11px]">
                <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300">
                  <span className="text-[10px] block opacity-80">Previous Hazardous Risk</span>
                  <span className="text-base font-bold">{replanDiff.oldRisk.toFixed(0)} / 100</span>
                </div>

                <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300">
                  <span className="text-[10px] block opacity-80">New Replanned Risk</span>
                  <span className="text-base font-bold">{replanDiff.newRisk.toFixed(0)} / 100</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-polar-950 border border-polar-800 flex justify-between text-[11px] text-slate-300">
                <span>Distance Adjustment: <strong className="text-slate-100">+{replanDiff.deltaDistKm} km</strong></span>
                <span>Fuel Adjustment: <strong className="text-slate-100">+{replanDiff.deltaFuelLiters} L</strong></span>
              </div>

              <button
                onClick={() => setHazardModalOpen(false)}
                className="w-full py-2.5 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-polar-950 font-bold transition-all"
              >
                RESUME SIMULATION WITH NEW ROUTE
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
