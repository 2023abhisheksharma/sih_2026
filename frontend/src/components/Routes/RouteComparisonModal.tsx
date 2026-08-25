import React from 'react';
import { X, Check, ShieldCheck } from 'lucide-react';
import { useNavigation } from '../../state/NavigationContext';
import { RouteOption } from '../../types/navigation';

export const RouteComparisonModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { routes, selectedRoute, setSelectedRoute } = useNavigation();

  if (!isOpen) return null;

  const handleSelectRoute = (route: RouteOption) => {
    setSelectedRoute(route);
    onClose();
  };

  const aiRoute = routes.find((r) => r.is_recommended) || routes[2] || routes[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-polar-900 border border-polar-700 rounded-xl max-w-4xl w-full shadow-2xl overflow-hidden font-sans text-xs">
        {/* Modal Header */}
        <div className="p-4 border-b border-polar-750 bg-polar-950/80 flex items-center justify-between font-mono">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold text-slate-100 tracking-wide">
              MULTI-OBJECTIVE ROUTE OPTIMIZATION & COMPARISON
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-polar-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Candidate Route Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {routes.map((route) => {
              const isSelected = selectedRoute?.route_id === route.route_id;
              const isAi = route.is_recommended;

              return (
                <div
                  key={route.route_id}
                  onClick={() => setSelectedRoute(route)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isAi
                      ? 'border-emerald-500/60 bg-emerald-950/20 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/40'
                      : isSelected
                      ? 'border-cyan-500/60 bg-cyan-950/20'
                      : 'border-polar-750 bg-polar-850/60 hover:border-polar-600'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-slate-200">{route.name}</span>
                      {isAi && (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[9px] font-bold border border-emerald-500/30">
                          RECOMMENDED
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">{route.description}</p>

                    <div className="grid grid-cols-2 gap-2 font-mono text-xs pt-2">
                      <div className="p-2 rounded bg-polar-900/80 border border-polar-750">
                        <span className="text-[10px] text-slate-400 block">Distance</span>
                        <span className="font-bold text-slate-100">{route.distance_km} km</span>
                      </div>

                      <div className="p-2 rounded bg-polar-900/80 border border-polar-750">
                        <span className="text-[10px] text-slate-400 block">Estimated Fuel</span>
                        <span className="font-bold text-slate-100">
                          {route.estimated_fuel_liters.toLocaleString()} L
                        </span>
                      </div>

                      <div className="p-2 rounded bg-polar-900/80 border border-polar-750">
                        <span className="text-[10px] text-slate-400 block">Travel Time</span>
                        <span className="font-bold text-slate-100">{route.travel_time_formatted}</span>
                      </div>

                      <div
                        className={`p-2 rounded border ${
                          route.average_risk_score < 35
                            ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                            : route.average_risk_score < 65
                            ? 'bg-amber-950/40 border-amber-500/30 text-amber-400'
                            : 'bg-rose-950/40 border-rose-500/30 text-rose-400'
                        }`}
                      >
                        <span className="text-[10px] opacity-80 block">Risk Score</span>
                        <span className="font-bold">{route.average_risk_score} / 100</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectRoute(route);
                    }}
                    className={`mt-4 w-full py-2 px-3 rounded-lg font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      isSelected
                        ? 'bg-emerald-500 text-polar-950 shadow-md shadow-emerald-500/20'
                        : 'bg-polar-750 hover:bg-polar-700 text-slate-200 border border-polar-600'
                    }`}
                  >
                    {isSelected ? <Check className="w-4 h-4" /> : null}
                    {isSelected ? 'ACTIVE ROUTE' : 'SELECT THIS ROUTE'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* AI Operational Explanation Card */}
          {aiRoute?.explanation && (
            <div className="p-4 rounded-xl border border-polar-700 bg-polar-850/80 space-y-3 font-mono">
              <div className="flex items-center justify-between border-b border-polar-750 pb-2">
                <span className="font-bold text-cyan-400 text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> WHY WAS THIS ROUTE RECOMMENDED?
                </span>
                <span className="text-[10px] text-slate-400">IMO POLAR CODE POLARIS COMPLIANT</span>
              </div>

              <p className="text-slate-300 font-sans text-xs leading-relaxed">
                {aiRoute.explanation.primary_reason}
              </p>

              {/* Percentage breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                <div className="p-2.5 rounded bg-polar-900 border border-polar-750">
                  <span className="text-[10px] text-slate-400 block">Iceberg Hazard Weight</span>
                  <span className="font-bold text-amber-400 text-sm">
                    {aiRoute.explanation.predicted_iceberg_risk_pct}%
                  </span>
                </div>
                <div className="p-2.5 rounded bg-polar-900 border border-polar-750">
                  <span className="text-[10px] text-slate-400 block">Sea-Ice Exposure</span>
                  <span className="font-bold text-cyan-400 text-sm">
                    {aiRoute.explanation.sea_ice_exposure_pct}%
                  </span>
                </div>
                <div className="p-2.5 rounded bg-polar-900 border border-polar-750">
                  <span className="text-[10px] text-slate-400 block">Fuel Penalty</span>
                  <span className="font-bold text-ice-blue text-sm">
                    {aiRoute.explanation.fuel_cost_pct}%
                  </span>
                </div>
                <div className="p-2.5 rounded bg-polar-900 border border-polar-750">
                  <span className="text-[10px] text-slate-400 block">Weather Drag</span>
                  <span className="font-bold text-slate-300 text-sm">
                    {aiRoute.explanation.weather_exposure_pct}%
                  </span>
                </div>
              </div>

              {/* Bullet Key Factors */}
              <ul className="space-y-1.5 pt-1 text-[11px] text-slate-300 font-sans list-disc list-inside">
                {aiRoute.explanation.key_factors.map((factor, idx) => (
                  <li key={idx}>{factor}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-polar-750 bg-polar-950/80 flex items-center justify-end gap-3 font-mono">
          <button
            onClick={onClose}
            className="py-2 px-4 rounded-lg bg-polar-800 hover:bg-polar-700 text-slate-300 transition-colors"
          >
            CLOSE
          </button>
          <button
            onClick={() => handleSelectRoute(aiRoute)}
            className="py-2 px-5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-polar-950 font-bold transition-all shadow-md shadow-cyan-500/20 flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            CONFIRM AI RECOMMENDED ROUTE
          </button>
        </div>
      </div>
    </div>
  );
};
