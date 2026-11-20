import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Flame, Droplets, Sprout, Globe, Satellite } from 'lucide-react';

import FireWildlife from './pages/FireWildlife';
import WaterWatch from './pages/WaterWatch';
import SmartWaterUse from './pages/SmartWaterUse';

export const App: React.FC = () => {
  const { i18n } = useTranslation();
  const [currentPage, setCurrentPage] = useState<'fire' | 'water' | 'advisor'>('fire');

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="min-h-screen bg-[#F7F3EA] text-slate-800 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="bg-[#12296B] text-white border-b border-navy/20 shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#2E7D4F] rounded-lg">
              <Satellite className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-black tracking-wider uppercase">
                PRAKRITI-NETRA
              </div>
              <div className="text-[10px] text-slate-300 font-medium">
                The Satellite Eye for India's Forests & Water (Western Ghats MVP)
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage('fire')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentPage === 'fire'
                  ? 'bg-white/20 text-white shadow-inner'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Flame className="w-4 h-4 text-[#C8441B]" />
              <span className="hidden sm:inline">Fire & Wildlife</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentPage('water')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentPage === 'water'
                  ? 'bg-white/20 text-white shadow-inner'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Droplets className="w-4 h-4 text-[#1F6F8B]" />
              <span className="hidden sm:inline">Water Watch</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentPage('advisor')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentPage === 'advisor'
                  ? 'bg-white/20 text-white shadow-inner'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Sprout className="w-4 h-4 text-[#2E7D4F]" />
              <span className="hidden sm:inline">Smart Water Use</span>
            </button>
          </nav>

          {/* Language Selector */}
          <div className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded-lg text-xs">
            <Globe className="w-3.5 h-3.5 text-slate-300" />
            <select
              value={i18n.language.split('-')[0]}
              onChange={(e) => changeLanguage(e.target.value)}
              className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="en" className="text-slate-900">EN (English)</option>
              <option value="hi" className="text-slate-900">HI (हिन्दी)</option>
              <option value="kn" className="text-slate-900">KN (ಕನ್ನಡ)</option>
            </select>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {currentPage === 'fire' && <FireWildlife />}
        {currentPage === 'water' && <WaterWatch />}
        {currentPage === 'advisor' && <SmartWaterUse />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Code for Innovex '26 &bull; Track: Protecting Natural Wealth &bull; Kudremukh Western Ghats MVP
          </span>
          <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            Lane: Fire, Wildlife, Water & Telegram
          </span>
        </div>
      </footer>
    </div>
  );
};

export default App;
