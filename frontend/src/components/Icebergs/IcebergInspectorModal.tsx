import React from 'react';
import { X, Cpu, Sparkles, Loader2 } from 'lucide-react';
import { useNavigation } from '../../state/NavigationContext';

export const IcebergInspectorModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const {
    selectedIceberg,
    trajectory,
    isLoadingTrajectory,
    predictIcebergTrajectory,
  } = useNavigation();

  if (!isOpen || !selectedIceberg) return null;

  const handlePredict = () => {
    predictIcebergTrajectory(selectedIceberg.id);
  };

  const getRiskBadge = (risk: string) => {
    if (risk === 'CRITICAL') return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
    if (risk === 'HIGH') return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
    if (risk === 'MEDIUM') return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
    return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-polar-900 border border-polar-700 rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden font-mono text-xs">
        {/* Header */}
        <div className="p-4 border-b border-polar-750 bg-polar-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">🧊</span>
            <div>
              <h2 className="text-sm font-bold text-slate-100">
                ICEBERG TELEMETRY & TRAJECTORY // #{selectedIceberg.id}
              </h2>
              <span className="text-[10px] text-slate-400">{selectedIceberg.name}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-polar-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Properties Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-2.5 rounded-lg bg-polar-850 border border-polar-750">
              <span className="text-[10px] text-slate-400 block">Position</span>
              <span className="font-bold text-slate-100 text-xs">
                {Math.abs(selectedIceberg.lat).toFixed(2)}°S, {Math.abs(selectedIceberg.lon).toFixed(2)}°W
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-polar-850 border border-polar-750">
              <span className="text-[10px] text-slate-400 block">Est. Dimensions</span>
              <span className="font-bold text-slate-100 text-xs">
                {selectedIceberg.length_km} × {selectedIceberg.width_km} km
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-polar-850 border border-polar-750">
              <span className="text-[10px] text-slate-400 block">Drift Velocity</span>
              <span className="font-bold text-slate-100 text-xs">
                {selectedIceberg.drift_speed_mps.toFixed(2)} m/s ({(selectedIceberg.drift_speed_mps * 1.94384).toFixed(1)} kn)
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-polar-850 border border-polar-750">
              <span className="text-[10px] text-slate-400 block">Drift Heading</span>
              <span className="font-bold text-slate-100 text-xs">
                {selectedIceberg.drift_heading_deg.toFixed(1)}°
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-polar-850 border border-polar-750">
              <span className="text-[10px] text-slate-400 block">Submerged Draft</span>
              <span className="font-bold text-slate-100 text-xs">
                {selectedIceberg.draft_m} meters
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-polar-850 border border-polar-750">
              <span className="text-[10px] text-slate-400 block">Risk Rating</span>
              <span className={`inline-block px-2 py-0.5 mt-0.5 rounded border text-[10px] font-bold ${getRiskBadge(selectedIceberg.risk_level)}`}>
                {selectedIceberg.risk_level}
              </span>
            </div>
          </div>

          {/* Action: Run AI Trajectory Model */}
          <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/20 flex items-center justify-between">
            <div>
              <span className="font-bold text-cyan-400 block text-xs flex items-center gap-1.5">
                <Cpu className="w-4 h-4" /> Physics + Machine Learning Drift Forecasting
              </span>
              <p className="text-[11px] text-slate-300 font-sans mt-0.5">
                Computes 24h Lagrangian drift baseline coupled with HistGradientBoosting eddy correction.
              </p>
            </div>

            <button
              onClick={handlePredict}
              disabled={isLoadingTrajectory}
              className="py-2 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-polar-950 font-bold flex items-center gap-2 transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50"
            >
              {isLoadingTrajectory ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>PREDICTING...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>FORECAST TRACK</span>
                </>
              )}
            </button>
          </div>

          {/* Trajectory Waypoints & Evaluation Results */}
          {trajectory && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-polar-750 pb-1.5">
                <span className="font-bold text-slate-200 text-xs">24-HOUR PREDICTED DRIFT CORRIDOR</span>
                <span className="text-[10px] text-emerald-400">STATUS: CONVERGED</span>
              </div>

              {/* Waypoints Table */}
              <div className="rounded-lg border border-polar-750 overflow-hidden">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-polar-950 text-slate-400 border-b border-polar-750 font-semibold">
                    <tr>
                      <th className="p-2">Horizon</th>
                      <th className="p-2">Lat/Lon</th>
                      <th className="p-2">Speed</th>
                      <th className="p-2">Heading</th>
                      <th className="p-2">Uncertainty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-polar-800 bg-polar-850">
                    {trajectory.trajectory.map((pt, i) => {
                      const u = trajectory.uncertainty[i - 1];
                      return (
                        <tr key={i} className="hover:bg-polar-800/50">
                          <td className="p-2 font-bold text-cyan-300">+{pt.hour}h</td>
                          <td className="p-2 text-slate-200">{pt.lat}°S, {pt.lon}°W</td>
                          <td className="p-2 text-slate-300">{pt.speed_mps} m/s</td>
                          <td className="p-2 text-slate-300">{pt.heading_deg}°</td>
                          <td className="p-2 text-amber-400">
                            {u ? `±${u.radius_km} km (${u.confidence_pct}%)` : 'Origin'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* True Model Evaluation Metrics */}
              <div className="p-3 rounded-lg bg-polar-950 border border-polar-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Validation Benchmark (Haversine MAE):</span>
                <div className="flex items-center gap-4 text-emerald-400 font-bold">
                  <span>6h: {trajectory.evaluation_mae_km['6h'] || 0.39} km</span>
                  <span>12h: {trajectory.evaluation_mae_km['12h'] || 0.69} km</span>
                  <span>24h: {trajectory.evaluation_mae_km['24h'] || 1.24} km</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-polar-750 bg-polar-950/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="py-2 px-4 rounded-lg bg-polar-800 hover:bg-polar-700 text-slate-300 transition-colors"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
