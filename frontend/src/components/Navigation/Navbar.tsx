import React from 'react';
import { Compass, Globe, PlayCircle, BarChart3, Radio } from 'lucide-react';
import { useNavigation, AppPage } from '../../state/NavigationContext';

export const Navbar: React.FC = () => {
  const { activeTab, setActiveTab, vesselName } = useNavigation();

  const navItems: { id: AppPage; label: string; step: string; icon: React.ReactNode }[] = [
    {
      id: 'planner',
      step: '01',
      label: 'Mission Planner',
      icon: <Compass className="w-4 h-4" />,
    },
    {
      id: 'operations',
      step: '02',
      label: '3D Operations & Routes',
      icon: <Globe className="w-4 h-4" />,
    },
    {
      id: 'simulation',
      step: '03',
      label: 'Live Simulation',
      icon: <PlayCircle className="w-4 h-4" />,
    },
    {
      id: 'analytics',
      step: '04',
      label: 'AI & Metocean Intel',
      icon: <BarChart3 className="w-4 h-4" />,
    },
  ];

  return (
    <header className="h-16 px-6 bg-glacial-900/80 backdrop-blur-xl border-b border-sky-400/15 flex items-center justify-between z-30 select-none shadow-ice-card">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-glacial-800/90 border border-sky-400/30 flex items-center justify-center text-ice-cyan text-lg shadow-ice-glow-sm">
          🧊
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-white text-sm tracking-wider font-mono">
              POLARIS // ANTARCTIC DSS
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-400/20 text-sky-300 text-[10px] font-mono font-medium">
              MVP 2026
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-sans">
            AI-Enabled Sea-Ice & Iceberg Trajectory Decision Support
          </p>
        </div>
      </div>

      {/* Center 4-Step Navigation Tabs */}
      <nav className="flex items-center gap-1.5 p-1 rounded-xl bg-glacial-950/60 border border-sky-400/10 backdrop-blur-md">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2.5 px-4 py-2 rounded-lg font-mono text-xs transition-all duration-200 ${
                isActive
                  ? 'bg-glacial-800/90 text-white border border-sky-400/40 shadow-ice-glow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-glacial-850/50'
              }`}
            >
              <span className={`text-[10px] font-bold ${isActive ? 'text-ice-cyan' : 'text-slate-500'}`}>
                {item.step}
              </span>
              <span className={isActive ? 'text-ice-cyan' : 'text-slate-400'}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Right Telemetry Pill */}
      <div className="hidden xl:flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-glacial-950/70 border border-sky-400/15 font-mono text-xs">
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="text-slate-300 font-medium">{vesselName}</span>
          <span className="text-slate-500 text-[10px]">| PC6 ICE CLASS</span>
        </div>
      </div>
    </header>
  );
};
