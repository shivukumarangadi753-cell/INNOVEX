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
  accentColor?: 'rust' | 'forest' | 'amber' | 'teal' | 'navy';
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
  accentColor = 'navy',
  className = '',
}) => {
  const accentBorder = {
    rust: 'border-l-4 border-l-rust bg-gradient-to-br from-rust-bg/20 to-white dark:to-navy-dark',
    forest: 'border-l-4 border-l-forest bg-gradient-to-br from-forest-bg/20 to-white dark:to-navy-dark',
    amber: 'border-l-4 border-l-amber bg-gradient-to-br from-amber-bg/20 to-white dark:to-navy-dark',
    teal: 'border-l-4 border-l-teal bg-gradient-to-br from-teal-bg/20 to-white dark:to-navy-dark',
    navy: 'border-l-4 border-l-navy bg-gradient-to-br from-slate-50/50 to-white dark:to-navy-dark',
  };

  const iconBg = {
    rust: 'bg-rust-bg text-rust border border-rust/30 shadow-xs',
    forest: 'bg-forest-bg text-forest border border-forest/30 shadow-xs',
    amber: 'bg-amber-bg text-amber-dark border border-amber/30 shadow-xs',
    teal: 'bg-teal-bg text-teal border border-teal/30 shadow-xs',
    navy: 'bg-slate-100 text-navy border border-slate-200 shadow-xs',
  };

  return (
    <Card className={`p-5 ${accentBorder[accentColor]} hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</span>
            {tooltipText && <Tooltip text={tooltipText} />}
          </div>
          <div className="flex items-baseline gap-1.5 pt-1">
            <span className="text-3xl font-extrabold tracking-tight text-slate-900">{value}</span>
            {unit && <span className="text-sm font-semibold text-slate-500">{unit}</span>}
          </div>
        </div>

        <div className={`p-3 rounded-xl shrink-0 ${iconBg[accentColor]}`}>
          {icon}
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-3.5 pt-3 border-t border-slate-100/90 dark:border-slate-800 flex items-center justify-between text-xs">
          {subtitle && <span className="text-slate-500 font-medium">{subtitle}</span>}
          {trend && (
            <span
              className={`font-semibold ml-auto px-2 py-0.5 rounded-full border ${
                trend.isPositive
                  ? 'bg-forest-bg text-forest-dark border-forest/30'
                  : 'bg-rust-bg text-rust-dark border-rust/30'
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
