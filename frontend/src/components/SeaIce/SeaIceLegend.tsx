import React from 'react';
import { Layers } from 'lucide-react';
import { useNavigation } from '../../state/NavigationContext';

export const SeaIceLegend: React.FC = () => {
  const { layers } = useNavigation();

  if (!layers.seaIce) return null;

  return (
    <div className="absolute bottom-20 left-6 z-10 bg-polar-900/90 backdrop-blur-md border border-polar-700/70 rounded-lg p-3 font-mono text-[11px] text-slate-200 shadow-xl space-y-2 select-none">
      <div className="flex items-center gap-1.5 text-cyan-400 font-bold border-b border-polar-750 pb-1 text-[10px] tracking-wider">
        <Layers className="w-3 h-3" /> SEA-ICE CONCENTRATION (SIC)
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3 rounded bg-blue-500/30 border border-blue-400/50"></div>
          <span className="text-slate-300">0 – 20%</span>
          <span className="text-[10px] text-slate-500">Open Water / Leads</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3 rounded bg-cyan-400/40 border border-cyan-300/60"></div>
          <span className="text-slate-300">20 – 50%</span>
          <span className="text-[10px] text-slate-500">Very Open Drift Ice</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3 rounded bg-cyan-200/60 border border-cyan-100/80"></div>
          <span className="text-slate-300">50 – 80%</span>
          <span className="text-[10px] text-slate-500">Close Pack Ice</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3 rounded bg-white/90 border border-white"></div>
          <span className="text-slate-300">80 – 100%</span>
          <span className="text-[10px] text-rose-400 font-bold">Consolidated / Fast Ice</span>
        </div>
      </div>
    </div>
  );
};
