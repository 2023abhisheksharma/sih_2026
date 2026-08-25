import React from 'react';
import { NavigationProvider, useNavigation } from './state/NavigationContext';
import { Navbar } from './components/Navigation/Navbar';
import { CesiumGlobe } from './components/Globe/CesiumGlobe';
import { MissionPlannerPage } from './pages/MissionPlannerPage';
import { OperationsPage } from './pages/OperationsPage';
import { SimulationPage } from './pages/SimulationPage';
import { AnalyticsPage } from './pages/AnalyticsPage';

const MainLayout: React.FC = () => {
  const { activeTab } = useNavigation();

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-glacial-950 text-slate-100 font-sans">
      {/* 1. Frosted Crystalline Iceberg Navigation Bar */}
      <Navbar />

      {/* 2. Main Work Area: Persistent 3D Globe with Dynamic Overlays */}
      <div className="flex-1 w-full h-[calc(100vh-4rem)] relative overflow-hidden">
        {/* Permanent 3D Cesium Engine (Map interaction active on Operations & Simulation) */}
        <div className="absolute inset-0 z-0 w-full h-full">
          <CesiumGlobe />
        </div>

        {/* Page Overlay Layers with dedicated scroll containers */}
        {activeTab === 'planner' && (
          <div className="relative z-10 w-full h-full overflow-y-auto">
            <MissionPlannerPage />
          </div>
        )}
        {activeTab === 'operations' && (
          <div className="relative z-10 w-full h-full pointer-events-none">
            <OperationsPage />
          </div>
        )}
        {activeTab === 'simulation' && (
          <div className="relative z-10 w-full h-full pointer-events-none">
            <SimulationPage />
          </div>
        )}
        {activeTab === 'analytics' && (
          <div className="relative z-10 w-full h-full overflow-y-auto">
            <AnalyticsPage />
          </div>
        )}
      </div>
    </div>
  );
};

export function App() {
  return (
    <NavigationProvider>
      <MainLayout />
    </NavigationProvider>
  );
}

export default App;
