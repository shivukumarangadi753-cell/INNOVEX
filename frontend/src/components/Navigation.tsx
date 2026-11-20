import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  TreePine,
  Flame,
  Droplets,
  Gauge,
  Bell,
  Info,
} from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  tag?: string;
}

export const Navigation: React.FC = () => {
  const { t } = useTranslation('common');

  const navItems: NavItem[] = [
    {
      to: '/',
      label: t('nav.overview', 'Overview'),
      icon: <LayoutDashboard className="w-[18px] h-[18px] shrink-0" />,
    },
    {
      to: '/forest',
      label: t('nav.forestWatch', 'Forest Watch'),
      icon: <TreePine className="w-[18px] h-[18px] shrink-0" />,
    },
    {
      to: '/fire-wildlife',
      label: t('nav.fireWildlife', 'Fire & Wildlife'),
      icon: <Flame className="w-[18px] h-[18px] shrink-0" />,
    },
    {
      to: '/water',
      label: t('nav.waterWatch', 'Water Watch'),
      icon: <Droplets className="w-[18px] h-[18px] shrink-0" />,
    },
    {
      to: '/smart-water',
      label: t('nav.smartWaterUse', 'Smart Water Use'),
      icon: <Gauge className="w-[18px] h-[18px] shrink-0" />,
    },
    {
      to: '/alerts',
      label: t('nav.alerts', 'Alerts'),
      icon: <Bell className="w-[18px] h-[18px] shrink-0" />,
      badge: 3,
    },
    {
      to: '/about',
      label: t('nav.about', 'About'),
      icon: <Info className="w-[18px] h-[18px] shrink-0" />,
    },
  ];

  return (
    <>
      {/* Desktop & Tablet Premium Dark Forest-Green Sidebar */}
      <aside className="hidden md:flex md:w-64 flex-col bg-[#0b241e] text-white min-h-screen shrink-0 border-r border-[#143d34]/60 sticky top-0 h-screen select-none z-30">
        {/* Brand Header with Glowing Mountain/Forest Emblem (Exact Reference Match) */}
        <div className="pt-6 pb-5 px-5 flex flex-col items-center text-center border-b border-white/5">
          <div className="relative mb-3 group cursor-pointer">
            {/* Glowing Emerald Hexagonal/Shield Emblem */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-b from-[#16a34a] to-[#0d5428] p-0.5 shadow-[0_0_20px_rgba(34,197,94,0.35)] flex items-center justify-center">
              <div className="w-full h-full bg-[#081d18] rounded-[14px] flex items-center justify-center p-2">
                <svg
                  className="w-8 h-8 text-[#22c55e]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {/* Mountain & Pine Trees geometry */}
                  <path d="M3 18 L8 9 L13 18 Z" fill="rgba(34, 197, 94, 0.2)" stroke="#22c55e" />
                  <path d="M11 18 L16 11 L21 18 Z" fill="rgba(34, 197, 94, 0.3)" stroke="#4ade80" />
                  <path d="M7 18 L12 10 L17 18" stroke="#86efac" strokeWidth="1.5" />
                  <circle cx="12" cy="7" r="1.5" fill="#22c55e" />
                </svg>
              </div>
            </div>
          </div>

          <h1 className="text-base font-extrabold tracking-wider text-white uppercase font-sans">
            PRAKRITI-NETRA
          </h1>
          <p className="text-[11px] font-medium text-emerald-200/70 mt-0.5 tracking-tight">
            The Satellite Eye for India's Forests
          </p>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3.5 py-4 space-y-1 overflow-y-auto" aria-label="Main Navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 min-h-[42px] ${
                  isActive
                    ? 'bg-[#16a34a] text-white shadow-md font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <div className="flex items-center gap-3 min-w-0">
                {item.icon}
                <span className="truncate text-[13px]">{item.label}</span>
              </div>

              {item.badge && (
                <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-[#ef4444] text-white shadow-sm">
                  {item.badge}
                </span>
              )}

              {item.tag && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-emerald-200 font-mono">
                  {item.tag}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Silhouette Art: Pine Trees & Deer Stag (Exact Reference Match) */}
        <div className="relative pt-6 pb-4 px-4 overflow-hidden border-t border-white/5 mt-auto">
          {/* Decorative Pine Forest & Deer Stag Graphic */}
          <div className="w-full h-16 relative flex items-end justify-center opacity-75 pointer-events-none">
            <svg
              className="w-full h-full text-[#143d34]"
              viewBox="0 0 240 60"
              fill="currentColor"
              preserveAspectRatio="none"
            >
              {/* Back Layer Trees */}
              <path
                d="M 10 60 L 25 35 L 40 60 Z M 35 60 L 50 30 L 65 60 Z M 170 60 L 185 32 L 200 60 Z M 195 60 L 210 25 L 225 60 Z"
                fill="#0f342c"
              />
              {/* Front Layer Trees */}
              <path
                d="M 0 60 L 15 25 L 30 60 Z M 20 60 L 35 20 L 50 60 Z M 180 60 L 195 20 L 210 60 Z M 205 60 L 220 18 L 235 60 Z M 225 60 L 238 28 L 245 60 Z"
                fill="#16463b"
              />
              {/* Ground Slope */}
              <path d="M 0 52 Q 120 45 240 52 L 240 60 L 0 60 Z" fill="#143d34" />
              {/* Standing Deer Stag Silhouette */}
              <g transform="translate(100, 32) scale(0.65)" fill="#1c5548">
                {/* Body */}
                <ellipse cx="20" cy="22" rx="10" ry="6" />
                {/* Neck & Head */}
                <path d="M 26 20 L 32 10 L 35 11 L 28 23 Z" />
                <ellipse cx="34" cy="9" rx="3.5" ry="2.5" />
                {/* Antlers */}
                <path d="M 34 8 L 32 2 M 34 8 L 36 2 M 35 5 L 38 4" stroke="#1c5548" strokeWidth="1.2" fill="none" />
                {/* Legs */}
                <line x1="13" y1="26" x2="11" y2="40" stroke="#1c5548" strokeWidth="2" />
                <line x1="17" y1="26" x2="16" y2="40" stroke="#1c5548" strokeWidth="2" />
                <line x1="24" y1="26" x2="25" y2="40" stroke="#1c5548" strokeWidth="2" />
                <line x1="28" y1="26" x2="29" y2="40" stroke="#1c5548" strokeWidth="2" />
              </g>
            </svg>
          </div>

          <div className="text-center mt-1 text-[11px] text-emerald-200/50">
            Kudremukh Pilot • 2026
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Tab Bar with Dark Forest Styling */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0b241e] border-t border-[#143d34] px-2 py-1 flex items-center justify-around shadow-float"
      >
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center p-1.5 rounded-lg text-[10px] font-medium min-w-[48px] min-h-[48px] transition-colors relative ${
                isActive
                  ? 'text-[#22c55e] font-bold'
                  : 'text-slate-400 hover:text-white'
              }`
            }
          >
            {item.icon}
            <span className="mt-0.5 leading-tight truncate max-w-[56px] text-center">{item.label}</span>
            {item.badge && (
              <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-[#ef4444]" />
            )}
          </NavLink>
        ))}
      </nav>
    </>
  );
};
