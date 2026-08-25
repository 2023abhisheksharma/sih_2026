import React from 'react';
import {
  Ship,
  Compass,
  MapPin,
  Shield,
  Fuel,
  ArrowRight,
  Waves,
  Wind,
  Layers,
  Thermometer,
  Sparkles,
  Loader2,
  Anchor,
} from 'lucide-react';
import { useNavigation } from '../state/NavigationContext';

export const MissionPlannerPage: React.FC = () => {
  const {
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
    calculateRoutes,
    isGeneratingRoutes,
    environment,
    setActiveTab,
  } = useNavigation();

  const handleGenerateAndProceed = async () => {
    await calculateRoutes();
    setActiveTab('operations');
  };

  const stations = environment?.stations || [
    { id: 'escudero', name: 'King George Island (Frei / Escudero)', lat: -62.19, lon: -58.98 },
    { id: 'esperanza', name: 'Esperanza Base (Hope Bay)', lat: -63.39, lon: -56.99 },
    { id: 'palmer', name: 'Palmer Station (Anvers Island)', lat: -64.77, lon: -64.05 },
    { id: 'rothera', name: 'Rothera Research Station', lat: -67.57, lon: -68.13 },
  ];

  return (
    <div className="w-full min-h-full p-8 pb-16 bg-glacial-950/95 backdrop-blur-md flex justify-center items-start">
      <div className="max-w-6xl w-full space-y-8 animate-in fade-in duration-300">
        {/* Page Title & Breadcrumb */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-mono text-xs text-sky-400">
            <span>STEP 01</span>
            <span>/</span>
            <span>VOYAGE CONFIGURATION</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-wide">
            Antarctic Mission & Vessel Planning
          </h2>
          <p className="text-sm text-slate-400 font-sans max-w-2xl">
            Configure vessel parameters, departure coordinates, and multi-objective optimization priorities
            to generate safe, fuel-efficient polar navigation routes.
          </p>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Mission Setup (7 Cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Card 1: Vessel Parameters */}
            <div className="ice-glass rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-sky-400/10 pb-3">
                <div className="flex items-center gap-2.5 text-white font-mono font-semibold text-sm">
                  <Ship className="w-4 h-4 text-sky-400" />
                  <span>Research Vessel Specifications</span>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-sky-500/10 border border-sky-400/20 text-sky-300 font-mono text-xs">
                  POLAR CLASS PC6
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3 rounded-xl bg-glacial-950/60 border border-sky-400/10">
                  <span className="text-slate-400 block text-[11px]">Vessel Name</span>
                  <span className="font-bold text-slate-100 text-sm mt-0.5 block">{vesselName}</span>
                </div>
                <div className="p-3 rounded-xl bg-glacial-950/60 border border-sky-400/10">
                  <span className="text-slate-400 block text-[11px]">Hull Ice Reinforcement</span>
                  <span className="font-bold text-emerald-400 text-sm mt-0.5 block">1A Super (PC6)</span>
                </div>
              </div>

              {/* Cruising Speed Slider */}
              <div className="p-4 rounded-xl bg-glacial-950/60 border border-sky-400/10 space-y-2">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-sky-400" /> Nominal Cruising Speed
                  </span>
                  <span className="text-sky-300 font-bold text-sm">{vesselSpeed} knots</span>
                </div>
                <input
                  type="range"
                  min="6"
                  max="18"
                  step="0.5"
                  value={vesselSpeed}
                  onChange={(e) => setVesselSpeed(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-glacial-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>6 kn (Ice breaking mode)</span>
                  <span>12 kn (Optimal cruise)</span>
                  <span>18 kn (Open water max)</span>
                </div>
              </div>
            </div>

            {/* Card 2: Waypoints & Stations */}
            <div className="ice-glass rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2.5 text-white font-mono font-semibold text-sm border-b border-sky-400/10 pb-3">
                <MapPin className="w-4 h-4 text-sky-400" />
                <span>Voyage Departure & Destination</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                {/* Start Point */}
                <div className="p-4 rounded-xl bg-glacial-950/60 border border-sky-400/10 space-y-2">
                  <span className="text-sky-400 font-bold text-[11px] block flex items-center gap-1.5">
                    <Anchor className="w-3.5 h-3.5" /> DEPARTURE POINT
                  </span>
                  <select
                    value={`${startPoint.lat},${startPoint.lon}`}
                    onChange={(e) => {
                      const [lat, lon] = e.target.value.split(',').map(Number);
                      setStartPoint({ lat, lon });
                    }}
                    className="w-full p-2.5 rounded-lg bg-glacial-900 border border-sky-400/20 text-slate-200 focus:outline-none focus:border-sky-400 text-xs font-mono"
                  >
                    {stations.map((st) => (
                      <option key={st.id} value={`${st.lat},${st.lon}`}>
                        {st.name} ({Math.abs(st.lat).toFixed(1)}°S, {Math.abs(st.lon).toFixed(1)}°W)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Destination Point */}
                <div className="p-4 rounded-xl bg-glacial-950/60 border border-sky-400/10 space-y-2">
                  <span className="text-emerald-400 font-bold text-[11px] block flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> DESTINATION POINT
                  </span>
                  <select
                    value={`${destinationPoint.lat},${destinationPoint.lon}`}
                    onChange={(e) => {
                      const [lat, lon] = e.target.value.split(',').map(Number);
                      setDestinationPoint({ lat, lon });
                    }}
                    className="w-full p-2.5 rounded-lg bg-glacial-900 border border-sky-400/20 text-slate-200 focus:outline-none focus:border-sky-400 text-xs font-mono"
                  >
                    {stations.map((st) => (
                      <option key={st.id} value={`${st.lat},${st.lon}`}>
                        {st.name} ({Math.abs(st.lat).toFixed(1)}°S, {Math.abs(st.lon).toFixed(1)}°W)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Card 3: Optimization Weights */}
            <div className="ice-glass rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2.5 text-white font-mono font-semibold text-sm border-b border-sky-400/10 pb-3">
                <Shield className="w-4 h-4 text-sky-400" />
                <span>Multi-Objective Decision Priorities</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Safety Priority Slider */}
                <div className="p-4 rounded-xl bg-glacial-950/60 border border-sky-400/10 space-y-2">
                  <div className="flex justify-between font-mono text-xs">
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5" /> Safety Priority
                    </span>
                    <span className="text-emerald-300 font-bold">{(safetyPriority * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={safetyPriority}
                    onChange={(e) => setSafetyPriority(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-glacial-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                  />
                  <p className="text-[10px] text-slate-400">
                    Weights avoidance of high-ice concentration & predicted iceberg drift corridors.
                  </p>
                </div>

                {/* Fuel Priority Slider */}
                <div className="p-4 rounded-xl bg-glacial-950/60 border border-sky-400/10 space-y-2">
                  <div className="flex justify-between font-mono text-xs">
                    <span className="text-sky-400 font-semibold flex items-center gap-1">
                      <Fuel className="w-3.5 h-3.5" /> Fuel Priority
                    </span>
                    <span className="text-sky-300 font-bold">{(fuelPriority * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={fuelPriority}
                    onChange={(e) => setFuelPriority(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-glacial-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                  />
                  <p className="text-[10px] text-slate-400">
                    Prioritizes open water leads and favorable tidal/gyre currents to minimize burn.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Metocean Snapshot & Action CTA (5 Cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Environmental Summary Card */}
            <div className="ice-glass rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-sky-400/10 pb-3">
                <span className="text-white font-mono font-semibold text-sm flex items-center gap-2">
                  <Waves className="w-4 h-4 text-sky-400" />
                  Metocean Intelligence
                </span>
                <span className="text-[10px] font-mono text-slate-400">COPERNICUS / ERA5</span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-glacial-950/60 border border-sky-400/10">
                  <span className="text-slate-300 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-sky-300" /> Sea Ice Concentration
                  </span>
                  <span className="font-bold text-white text-sm">
                    {environment ? (environment.summary.mean_sea_ice_concentration * 100).toFixed(0) : 42}%
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-glacial-950/60 border border-sky-400/10">
                  <span className="text-slate-300 flex items-center gap-2">
                    <Wind className="w-4 h-4 text-slate-300" /> Mean Surface Wind
                  </span>
                  <span className="font-bold text-white text-sm">
                    {environment?.summary.mean_wind_speed_knots || 18.2} kn
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-glacial-950/60 border border-sky-400/10">
                  <span className="text-slate-300 flex items-center gap-2">
                    <Waves className="w-4 h-4 text-sky-400" /> Ocean Current Drift
                  </span>
                  <span className="font-bold text-white text-sm">
                    {environment?.summary.mean_ocean_current_mps || 0.31} m/s
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-glacial-950/60 border border-sky-400/10">
                  <span className="text-slate-300 flex items-center gap-2">
                    <Thermometer className="w-4 h-4 text-rose-400" /> Air Temperature
                  </span>
                  <span className="font-bold text-white text-sm">
                    {environment?.summary.surface_temp_celsius || -4.5}°C
                  </span>
                </div>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="ice-glass rounded-2xl p-6 space-y-4 shadow-ice-glow">
              <div className="space-y-1.5">
                <h3 className="font-bold text-white font-mono text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-ice-cyan" /> Ready for Route Optimization
                </h3>
                <p className="text-xs text-slate-300 font-sans">
                  The router will compute 3 Pareto candidate routes (Shortest, Fuel Optimal, AI Recommended)
                  over the dynamic Polar Stereographic risk grid.
                </p>
              </div>

              <button
                onClick={handleGenerateAndProceed}
                disabled={isGeneratingRoutes}
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-sky-400 via-cyan-400 to-teal-300 hover:from-sky-300 hover:to-teal-200 text-glacial-950 font-mono font-bold text-sm flex items-center justify-center gap-3 transition-all duration-200 shadow-xl shadow-cyan-500/20 active:scale-98 disabled:opacity-50"
              >
                {isGeneratingRoutes ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>CALCULATING OPTIMAL PATHS...</span>
                  </>
                ) : (
                  <>
                    <span>CALCULATE & OPTIMIZE ROUTES</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
