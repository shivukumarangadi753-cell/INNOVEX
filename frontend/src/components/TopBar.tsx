import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Radio,
  Moon,
  Sun,
  Globe,
  Bell,
  ChevronDown,
  Sparkles,
  MapPin,
  FlaskConical,
} from 'lucide-react';
import { USE_MOCK } from '../lib/api';
import { Tooltip } from './Tooltip';

export const TopBar: React.FC = () => {
  const { t, i18n } = useTranslation('common');
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('pn_theme');
    if (savedTheme === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('pn_theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('pn_theme', 'dark');
      setIsDark(true);
    }
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <header className="bg-white/95 dark:bg-navy-dark/95 backdrop-blur-md sticky top-0 z-20 border-b border-slate-200/80 dark:border-emerald-950/60 shadow-subtle">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Kudremukh Reserve Forest Eco-Zone Pill + Live Dot (Exact Reference Match) */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#eaf5ee] dark:bg-emerald-950/40 border border-[#cbe5d5] dark:border-emerald-800/40 text-xs font-semibold text-slate-800 dark:text-emerald-100 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#16a34a] animate-pulse shrink-0" />
            <span className="font-bold text-slate-900 dark:text-white">Kudremukh Reserve Forest</span>
            <span className="text-slate-400 dark:text-slate-500">•</span>
            <span className="text-slate-600 dark:text-emerald-200/80">Karnataka</span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span className="inline-flex items-center gap-1 text-[#16a34a] dark:text-[#22c55e] font-bold">
              • Live
            </span>
          </div>
        </div>

        {/* Right Controls: Demo Data Pill, Notifications, User Avatar, Language Switcher, Theme Toggle */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
          {/* Demo Data Mode Pill (Exact Reference Match) */}
          <Tooltip
            term={USE_MOCK ? 'Demo Mode Active' : 'Live Satellite Feed'}
            text={
              USE_MOCK
                ? 'Operating with synthetic mock telemetry per Innovex honesty policy.'
                : 'Connected to live Copernicus backend.'
            }
          >
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-navy-surface hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-200/90 dark:border-emerald-950/70 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer shadow-subtle transition-all">
              <FlaskConical className="w-3.5 h-3.5 text-[#16a34a]" />
              <span className="hidden sm:inline">Demo Data</span>
              <span className="sm:hidden">Demo</span>
            </div>
          </Tooltip>

          {/* Notification Bell with Red Badge "3" (Exact Reference Match) */}
          <div className="relative">
            <button
              type="button"
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-200/80 dark:border-emerald-950/60 transition-colors"
              aria-label="Alert Notifications"
            >
              <Bell className="w-4 h-4" />
            </button>
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#ef4444] text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
              3
            </span>
          </div>

          {/* User Profile Avatar "KK" with Dropdown Chevron (Exact Reference Match) */}
          <div className="flex items-center gap-1.5 pl-1 cursor-pointer group">
            <div className="w-8 h-8 rounded-full bg-[#0b241e] text-white text-xs font-bold flex items-center justify-center shadow-sm border border-emerald-500/30">
              KK
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white transition-colors" />
          </div>

          <div className="h-5 w-[1px] bg-slate-200 dark:bg-emerald-950/60 hidden sm:block mx-0.5" />

          {/* Language Switcher (Preserving 100% Functionality) */}
          <div className="hidden sm:flex items-center bg-slate-100 dark:bg-navy-surface rounded-xl p-0.5 border border-slate-200/80 dark:border-emerald-950/60 text-xs font-medium">
            <Globe className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 ml-2 mr-1" />
            <button
              type="button"
              onClick={() => changeLanguage('en')}
              className={`px-2 py-1 rounded-lg transition-colors ${
                i18n.language === 'en'
                  ? 'bg-[#16a34a] text-white font-bold shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
              title="English"
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => changeLanguage('hi')}
              className={`px-2 py-1 rounded-lg transition-colors ${
                i18n.language === 'hi'
                  ? 'bg-[#16a34a] text-white font-bold shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
              title="हिन्दी"
            >
              हिन्दी
            </button>
            <button
              type="button"
              onClick={() => changeLanguage('kn')}
              className={`px-2 py-1 rounded-lg transition-colors ${
                i18n.language === 'kn'
                  ? 'bg-[#16a34a] text-white font-bold shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
              title="ಕನ್ನಡ"
            >
              ಕನ್ನಡ
            </button>
          </div>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-200/80 dark:border-emerald-950/60 transition-colors"
            aria-label="Toggle light and dark color theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </div>
    </header>
  );
};
