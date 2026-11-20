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
    rust: 'border-l-4 border-l-rust',
    forest: 'border-l-4 border-l-forest',
    amber: 'border-l-4 border-l-amber',
    teal: 'border-l-4 border-l-teal',
    navy: 'border-l-4 border-l-navy',
  };

  const iconBg = {
    rust: 'bg-rust-bg text-rust',
    forest: 'bg-forest-bg text-forest',
    amber: 'bg-amber-bg text-amber-dark',
    teal: 'bg-teal-bg text-teal',
    navy: 'bg-slate-100 text-navy',
  };

  return (
    <Card className={`p-5 ${accentBorder[accentColor]} hover:shadow-card transition-shadow ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
            {tooltipText && <Tooltip text={tooltipText} />}
          </div>
          <div className="flex items-baseline gap-1.5 pt-1">
            <span className="text-3xl font-bold tracking-tight text-slate-900">{value}</span>
            {unit && <span className="text-sm font-medium text-slate-500">{unit}</span>}
          </div>
        </div>

        <div className={`p-3 rounded-xl shrink-0 ${iconBg[accentColor]}`}>
          {icon}
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          {subtitle && <span className="text-slate-500">{subtitle}</span>}
          {trend && (
            <span
              className={`font-medium ml-auto px-2 py-0.5 rounded-full ${
                trend.isPositive
                  ? 'bg-forest-bg text-forest-dark'
                  : 'bg-rust-bg text-rust-dark'
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
