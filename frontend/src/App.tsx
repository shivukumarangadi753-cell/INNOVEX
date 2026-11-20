import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { USE_MOCK } from './lib/api';
import { ToastProvider } from './components/Toast';
import { DemoRibbon } from './components/DemoRibbon';
import { TopBar } from './components/TopBar';
import { Navigation } from './components/Navigation';

// Main Pages (Payal's Lane)
import Overview from './pages/Overview';
import ForestWatch from './pages/ForestWatch';
import Alerts from './pages/Alerts';
import About from './pages/About';

// Specialized Partner Pages (Sidharthan's Lane)
import FireWildlife from './pages/FireWildlife';
import WaterWatch from './pages/WaterWatch';
import SmartWaterUse from './pages/SmartWaterUse';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <div className="min-h-screen flex flex-col bg-cream-100 text-slate-900 selection:bg-forest/20 selection:text-forest-dark">
          {/* Prominent Demo Mode Ribbon */}
          <DemoRibbon isDemo={USE_MOCK} />

          {/* Fixed Government-Grade Top Bar */}
          <TopBar />

          {/* App Shell Body with Responsive Navigation */}
          <div className="flex-1 flex max-w-7xl w-full mx-auto">
            {/* Desktop / Tablet Sidebar & Mobile Tab Bar */}
            <Navigation />

            {/* Main Page Workspace Container */}
            <main
              id="main-content"
              tabIndex={-1}
              className="flex-1 p-4 sm:p-6 lg:p-8 pb-20 md:pb-8 overflow-y-auto max-w-full"
            >
              <Routes>
                {/* Milestone 3: Overview Page */}
                <Route path="/" element={<Overview />} />
                <Route path="/overview" element={<Navigate to="/" replace />} />

                {/* Milestone 4: Forest Watch Page */}
                <Route path="/forest" element={<ForestWatch />} />

                {/* Partner Placeholder Routes: Sidharthan's Lane */}
                <Route path="/fire-wildlife" element={<FireWildlife />} />
                <Route path="/water" element={<WaterWatch />} />
                <Route path="/smart-water" element={<SmartWaterUse />} />

                {/* Milestone 5: Alerts Page */}
                <Route path="/alerts" element={<Alerts />} />

                {/* Milestone 6: About Page */}
                <Route path="/about" element={<About />} />

                {/* Fallback to Overview */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </div>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
