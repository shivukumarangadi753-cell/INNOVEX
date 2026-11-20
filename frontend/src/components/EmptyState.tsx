import React from 'react';
import { Inbox, CheckCircle2 } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  variant?: 'normal' | 'healthy';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  className = '',
  variant = 'normal',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center bg-white rounded-xl border border-dashed border-slate-300 ${className}`}
    >
      <div
        className={`p-3.5 rounded-full mb-3 ${
          variant === 'healthy' ? 'bg-forest-bg text-forest' : 'bg-slate-100 text-slate-400'
        }`}
      >
        {icon ||
          (variant === 'healthy' ? (
            <CheckCircle2 className="w-8 h-8 shrink-0" />
          ) : (
            <Inbox className="w-8 h-8 shrink-0" />
          ))}
      </div>
      <h4 className="text-base font-semibold text-slate-800">{title}</h4>
      <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button size="sm" variant="outline" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
