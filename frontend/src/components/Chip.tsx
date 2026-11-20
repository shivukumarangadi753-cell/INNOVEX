import React from 'react';
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  Flame,
  TreePine,
  CloudRain,
  CloudOff,
  ShieldCheck,
  AlertTriangle,
  Radio,
  Sparkles,
} from 'lucide-react';

export type ChipVariant =
  | 'open'
  | 'confirmed'
  | 'false_alarm'
  | 'clearing'
  | 'fire_scar'
  | 'seasonal'
  | 'cloud_error'
  | 'risk_low'
  | 'risk_medium'
  | 'risk_high'
  | 'demo'
  | 'live'
  | 'custom';

interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: ChipVariant;
  label?: string;
  icon?: React.ReactNode;
  size?: 'sm' | 'md';
}

export const Chip: React.FC<ChipProps> = ({
  variant = 'custom',
  label,
  icon,
  size = 'md',
  className = '',
  ...props
}) => {
  let defaultIcon: React.ReactNode = icon;
  let defaultLabel = label;
  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';

  switch (variant) {
    case 'open':
      defaultIcon = <AlertCircle className="w-3.5 h-3.5 text-rust shrink-0" aria-hidden="true" />;
      defaultLabel = label || 'Open Alert';
      colorClasses = 'bg-rust-bg text-rust-dark border-rust/40 font-semibold';
      break;

    case 'confirmed':
      defaultIcon = <CheckCircle2 className="w-3.5 h-3.5 text-forest shrink-0" aria-hidden="true" />;
      defaultLabel = label || 'Confirmed';
      colorClasses = 'bg-forest-bg text-forest-dark border-forest/40 font-medium';
      break;

    case 'false_alarm':
      defaultIcon = <XCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />;
      defaultLabel = label || 'False Alarm';
      colorClasses = 'bg-slate-100 text-slate-600 border-slate-300';
      break;

    case 'clearing':
      defaultIcon = <TreePine className="w-3.5 h-3.5 text-rust shrink-0" aria-hidden="true" />;
      defaultLabel = label || 'Canopy Clearing';
      colorClasses = 'bg-rust-bg text-rust-dark border-rust/30';
      break;

    case 'fire_scar':
      defaultIcon = <Flame className="w-3.5 h-3.5 text-amber-dark shrink-0" aria-hidden="true" />;
      defaultLabel = label || 'Fire Scar';
      colorClasses = 'bg-amber-bg text-amber-dark border-amber/40';
      break;

    case 'seasonal':
      defaultIcon = <CloudRain className="w-3.5 h-3.5 text-teal shrink-0" aria-hidden="true" />;
      defaultLabel = label || 'Seasonal Shift';
      colorClasses = 'bg-teal-bg text-teal-dark border-teal/30';
      break;

    case 'cloud_error':
      defaultIcon = <CloudOff className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />;
      defaultLabel = label || 'Cloud Shadow';
      colorClasses = 'bg-slate-100 text-slate-500 border-slate-200';
      break;

    case 'risk_low':
      defaultIcon = <ShieldCheck className="w-3.5 h-3.5 text-forest shrink-0" aria-hidden="true" />;
      defaultLabel = label || 'Low Risk';
      colorClasses = 'bg-forest-bg text-forest-dark border-forest/30';
      break;

    case 'risk_medium':
      defaultIcon = <AlertTriangle className="w-3.5 h-3.5 text-amber-dark shrink-0" aria-hidden="true" />;
      defaultLabel = label || 'Medium Risk';
      colorClasses = 'bg-amber-bg text-amber-dark border-amber/40';
      break;

    case 'risk_high':
      defaultIcon = <AlertCircle className="w-3.5 h-3.5 text-rust shrink-0" aria-hidden="true" />;
      defaultLabel = label || 'High Risk';
      colorClasses = 'bg-rust-bg text-rust-dark border-rust/40 font-semibold';
      break;

    case 'demo':
      defaultIcon = <Sparkles className="w-3.5 h-3.5 text-amber-dark shrink-0" aria-hidden="true" />;
      defaultLabel = label || 'DEMO DATA';
      colorClasses = 'bg-amber-bg text-amber-dark border-amber/50 font-bold tracking-wide uppercase';
      break;

    case 'live':
      defaultIcon = <Radio className="w-3.5 h-3.5 text-forest shrink-0 animate-pulse" aria-hidden="true" />;
      defaultLabel = label || 'LIVE SATELLITE';
      colorClasses = 'bg-forest-bg text-forest-dark border-forest/40 font-bold tracking-wide uppercase';
      break;

    default:
      defaultIcon = icon || <AlertCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />;
      defaultLabel = label || 'Tag';
      break;
  }

  const sizeClasses =
    size === 'sm'
      ? 'text-[11px] px-2 py-0.5 gap-1'
      : 'text-xs px-2.5 py-1 gap-1.5';

  return (
    <span
      className={`inline-flex items-center rounded-md border select-none transition-colors ${sizeClasses} ${colorClasses} ${className}`}
      {...props}
    >
      {defaultIcon}
      <span>{defaultLabel}</span>
    </span>
  );
};
