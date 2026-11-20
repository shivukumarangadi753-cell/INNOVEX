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
  Database,
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
      icon: <LayoutDashboard className="w-5 h-5 shrink-0" />,
    },
    {
      to: '/forest',
      label: t('nav.forestWatch', 'Forest Watch'),
      icon: <TreePine className="w-5 h-5 shrink-0" />,
    },
    {
      to: '/fire-wildlife',
      label: t('nav.fireWildlife', 'Fire & Wildlife'),
      icon: <Flame className="w-5 h-5 shrink-0" />,
    },
    {
      to: '/water',
      label: t('nav.waterWatch', 'Water Watch'),
      icon: <Droplets className="w-5 h-5 shrink-0" />,
    },
    {
      to: '/smart-water',
      label: t('nav.smartWaterUse', 'Smart Water Use'),
      icon: <Gauge className="w-5 h-5 shrink-0" />,
    },
    {
      to: '/alerts',
      label: t('nav.alerts', 'Alerts'),
      icon: <Bell className="w-5 h-5 shrink-0" />,
      badge: 3,
    },
    {
      to: '/data-sources',
      label: t('nav.dataSources', 'Data Sources'),
      icon: <Database className="w-5 h-5 shrink-0" />,
    },
    {
      to: '/about',
      label: t('nav.about', 'About'),
      icon: <Info className="w-5 h-5 shrink-0" />,
    },
  ];

  return (
    <>
      {/* Desktop & Tablet Sidebar */}
      <aside className="hidden md:flex md:w-64 flex-col bg-white border-r border-slate-200/80 min-h-[calc(100vh-4rem)] p-4 shrink-0 shadow-subtle">
        <div className="mb-4 p-3 bg-gradient-to-br from-cream-50 to-white rounded-xl border border-slate-200/70 shadow-xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Target Eco-Zone</span>
            <span className="w-1.5 h-1.5 rounded-full bg-forest animate-ping" />
          </div>
          <div className="text-xs font-extrabold text-navy mt-1">
            Kudremukh Reserve Forest
          </div>
          <div className="text-[11px] text-forest font-semibold flex items-center gap-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-forest" />
            Western Ghats, Karnataka
          </div>
        </div>

        <nav className="space-y-1.5 flex-1" aria-label="Main Navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 min-h-[44px] ${
                  isActive
                    ? 'bg-gradient-to-r from-forest to-forest-dark text-white shadow-md font-semibold'
                    : 'text-slate-700 hover:bg-slate-100/80 hover:text-navy hover:translate-x-0.5'
                }`
              }
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="transition-transform group-hover:scale-110 duration-150">
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-rust text-white shadow-xs">
                  {item.badge}
                </span>
              )}

              {item.tag && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200 font-mono">
                  {item.tag}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="pt-4 border-t border-slate-200/80 text-[11px] text-slate-500 space-y-1 px-2">
          <div className="font-semibold text-slate-700">Code for Innovex '26</div>
          <div>Track: Protecting Natural Wealth</div>
          <div className="text-[10px] text-slate-400">Principle: Alerts, not just maps.</div>
        </div>
      </aside>

      {/* Mobile Bottom Tab Bar */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 glass-nav border-t border-slate-200 px-2 py-1 flex items-center justify-around shadow-float"
      >
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center p-1.5 rounded-lg text-[10px] font-medium min-w-[48px] min-h-[48px] transition-all relative ${
                isActive
                  ? 'text-forest font-bold scale-105'
                  : 'text-slate-500 hover:text-slate-900'
              }`
            }
          >
            {item.icon}
            <span className="mt-0.5 leading-tight truncate max-w-[56px] text-center">{item.label}</span>
            {item.badge && (
              <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-rust shadow-xs" />
            )}
          </NavLink>
        ))}
      </nav>
    </>
  );
};
