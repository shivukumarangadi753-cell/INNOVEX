import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { USE_MOCK } from './lib/api';
import { ToastProvider } from './components/Toast';
import { DemoRibbon } from './components/DemoRibbon';
import { TopBar } from './components/TopBar';
import { Navigation } from './components/Navigation';
import { CopilotWidget } from './components/CopilotWidget';

// Main Pages
import Overview from './pages/Overview';
import ForestWatch from './pages/ForestWatch';
import ExplorePlace from './pages/ExplorePlace';
import Alerts from './pages/Alerts';
import About from './pages/About';

// Specialized Partner Pages
import FireWildlife from './pages/FireWildlife';
import WaterWatch from './pages/WaterWatch';
import SmartWaterUse from './pages/SmartWaterUse';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <div className="min-h-screen flex bg-[#f0f5f2] dark:bg-navy-surface text-slate-900 dark:text-slate-100 font-sans selection:bg-[#16a34a]/20 selection:text-emerald-900">
          {/* Desktop Left Dark Forest-Green Sidebar (Exact Reference Match) */}
          <Navigation />

          {/* Main App Container to the Right of the Sidebar */}
          <div className="flex-1 flex flex-col min-w-0 min-h-screen">
            {/* Prominent Demo Mode Ribbon */}
            <DemoRibbon isDemo={USE_MOCK} />

            {/* Clean White Top Bar */}
            <TopBar />

            {/* Main Page Content Workspace */}
            <main
              id="main-content"
              tabIndex={-1}
              className="flex-1 p-4 sm:p-6 lg:p-7 pb-24 md:pb-8 overflow-y-auto max-w-[1600px] w-full mx-auto"
            >
              <Routes>
                {/* Overview Page */}
                <Route path="/" element={<Overview />} />
                <Route path="/overview" element={<Navigate to="/" replace />} />

                {/* Forest Watch Page */}
                <Route path="/forest" element={<ForestWatch />} />

                {/* Explore a Place Page */}
                <Route path="/explore" element={<ExplorePlace />} />

                {/* Partner Routes */}
                <Route path="/fire-wildlife" element={<FireWildlife />} />
                <Route path="/water" element={<WaterWatch />} />
                <Route path="/smart-water" element={<SmartWaterUse />} />

                {/* Alerts Page */}
                <Route path="/alerts" element={<Alerts />} />

                {/* About Page */}
                <Route path="/about" element={<About />} />

                {/* Fallback to Overview */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>

          {/* Prakriti-Copilot Autonomous Ecological AI Agent Floating Widget */}
          <CopilotWidget />
        </div>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
