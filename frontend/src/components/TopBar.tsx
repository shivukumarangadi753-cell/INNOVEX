import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Radio, Sparkles, Moon, Sun, Globe } from 'lucide-react';
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
    <header className="bg-navy/95 glass-nav text-white sticky top-0 z-40 border-b border-white/10 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-forest-light to-forest flex items-center justify-center shrink-0 shadow-md border border-forest-light/60 transition-transform hover:scale-105 duration-150">
            <svg
              className="w-6 h-6 text-cream drop-shadow-sm"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="9" />
              <circle cx="12" cy="12" r="3" fill="#F7F3EA" />
              <path d="M3 12h3M18 12h3M12 3v3M12 18v3" />
            </svg>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg tracking-wider text-white">
                {t('appName', 'PRAKRITI-NETRA')}
              </span>
              <span className="text-[11px] font-medium text-cream-300/90 hidden md:inline tracking-tight">
                ({t('appSubtitle', 'प्रकृति-नेत्र | ಪ್ರಕೃತಿ-ನೇತ್ರ')})
              </span>
            </div>
            <p className="text-[11px] text-cream-200/80 truncate hidden sm:block tracking-wide">
              {t('tagline', "The Satellite Eye for India's Forests, Water & Wildlife")}
            </p>
          </div>
        </div>

        {/* Right Controls: Data Mode Badge, Language Switcher, Dark/Light Mode */}
        <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
          {/* Demo / Live Badge */}
          {USE_MOCK ? (
            <Tooltip
              term="Demo Mode Active"
              text="Operating with mock telemetry fixtures. VITE_USE_MOCK=true. Zero external backend required."
            >
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber/15 border border-amber/40 text-amber-200 text-xs font-semibold select-none cursor-help shadow-xs backdrop-blur-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber animate-pulse" />
                <span className="hidden sm:inline">DEMO DATA</span>
                <span className="sm:hidden">DEMO</span>
              </div>
            </Tooltip>
          ) : (
            <Tooltip
              term="Live Mode Active"
              text="Connected to live FastAPI backend at VITE_API_URL."
            >
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest/25 border border-forest-light/60 text-forest-light text-xs font-semibold select-none cursor-help shadow-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-forest-light opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-forest-light"></span>
                </span>
                <Radio className="w-3.5 h-3.5 text-forest-light" />
                <span className="hidden sm:inline">LIVE FEED</span>
                <span className="sm:hidden">LIVE</span>
              </div>
            </Tooltip>
          )}

          {/* Language Switcher */}
          <div className="flex items-center bg-navy-surface/80 rounded-xl p-0.5 border border-white/10 text-xs font-medium shadow-inner">
            <Globe className="w-3.5 h-3.5 text-cream-200 ml-2 mr-1 hidden sm:inline" />
            <button
              type="button"
              onClick={() => changeLanguage('en')}
              className={`px-2.5 py-1 rounded-lg transition-all duration-150 ${
                i18n.language === 'en'
                  ? 'bg-forest text-white font-bold shadow-sm'
                  : 'text-cream-200/70 hover:text-white hover:bg-white/5'
              }`}
              title="Switch to English"
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => changeLanguage('hi')}
              className={`px-2.5 py-1 rounded-lg transition-all duration-150 ${
                i18n.language === 'hi'
                  ? 'bg-forest text-white font-bold shadow-sm'
                  : 'text-cream-200/70 hover:text-white hover:bg-white/5'
              }`}
              title="हिन्दी में बदलें"
            >
              हिन्दी
            </button>
            <button
              type="button"
              onClick={() => changeLanguage('kn')}
              className={`px-2.5 py-1 rounded-lg transition-all duration-150 ${
                i18n.language === 'kn'
                  ? 'bg-forest text-white font-bold shadow-sm'
                  : 'text-cream-200/70 hover:text-white hover:bg-white/5'
              }`}
              title="ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಿ"
            >
              ಕನ್ನಡ
            </button>
          </div>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl text-cream-200 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10 transition-all duration-150 active:scale-95"
            aria-label="Toggle light and dark color theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber" /> : <Moon className="w-4 h-4 text-cream-200" />}
          </button>
        </div>
      </div>
    </header>
  );
};
