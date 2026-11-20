import React from 'react';
import { Card } from './Card';
import { Tooltip } from './Tooltip';

interface KpiCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  tooltipText?: string;
  accentColor?: 'rust' | 'forest' | 'amber' | 'teal' | 'navy' | 'purple' | 'blue';
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  unit,
  subtitle,
  icon,
  trend,
  tooltipText,
  accentColor = 'forest',
  className = '',
}) => {
  const iconConfig = {
    rust: {
      bg: 'bg-red-50 text-red-500 border border-red-100 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/40',
      sparkline: '#f87171',
    },
    forest: {
      bg: 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/40',
      sparkline: '#34d399',
    },
    amber: {
      bg: 'bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/40',
      sparkline: '#fbbf24',
    },
    teal: {
      bg: 'bg-teal-50 text-teal-600 border border-teal-100 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-900/40',
      sparkline: '#2dd4bf',
    },
    navy: {
      bg: 'bg-sky-50 text-sky-600 border border-sky-100 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-900/40',
      sparkline: '#60a5fa',
    },
    purple: {
      bg: 'bg-purple-50 text-purple-600 border border-purple-100 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900/40',
      sparkline: '#c084fc',
    },
    blue: {
      bg: 'bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/40',
      sparkline: '#60a5fa',
    },
  };

  const currentTheme = iconConfig[accentColor] || iconConfig.forest;

  return (
    <Card className={`p-4 sm:p-5 relative overflow-hidden bg-white dark:bg-navy-dark border border-slate-200/70 dark:border-emerald-950/50 rounded-2xl shadow-subtle hover:shadow-card transition-all ${className}`}>
      <div className="flex items-center justify-between gap-3">
        {/* Left: Icon Badge + Value & Title */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className={`w-11 h-11 rounded-2xl shrink-0 flex items-center justify-center ${currentTheme.bg}`}>
            {icon}
          </div>

          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {value}
              </span>
              {unit && <span className="text-xs font-semibold text-slate-500">{unit}</span>}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate">
                {title}
              </span>
              {tooltipText && <Tooltip text={tooltipText} />}
            </div>
          </div>
        </div>

        {/* Right: Smooth Sparkline Curve SVG (Exact Reference Match) */}
        <div className="w-20 sm:w-24 h-10 shrink-0 flex items-center justify-end opacity-90">
          <svg className="w-full h-full" viewBox="0 0 100 40" fill="none" preserveAspectRatio="none">
            <path
              d="M 0 26 C 25 28, 40 18, 65 24 C 80 28, 90 12, 100 14"
              stroke={currentTheme.sparkline}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-emerald-950/40 flex items-center justify-between text-xs">
          {subtitle && <span className="text-slate-500 dark:text-slate-400 truncate">{subtitle}</span>}
          {trend && (
            <span
              className={`font-semibold ml-auto px-2 py-0.5 rounded-full ${
                trend.isPositive
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                  : 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300'
              }`}
            >
              {trend.value} {trend.label}
            </span>
          )}
        </div>
      )}
    </Card>
  );
};
