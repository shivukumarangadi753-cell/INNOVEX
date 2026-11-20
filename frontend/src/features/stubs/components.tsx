import React from 'react';

/**
 * Temporary Component Stubs for Payal's Shared UI Library
 * (Card, Chip, Toast, Skeleton)
 * Used until Payal's shell and shared components are merged.
 */

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'bordered';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
  ...props
}) => {
  const baseStyles = 'rounded-xl bg-white p-5 transition-shadow duration-200';
  const variantStyles = {
    default: 'border border-slate-200/80 shadow-sm',
    elevated: 'shadow-md border border-slate-100',
    bordered: 'border-2 border-slate-200',
  }[variant];

  return (
    <div className={`${baseStyles} ${variantStyles} ${className}`} {...props}>
      {children}
    </div>
  );
};

interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'demo';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  className?: string;
}

export const Chip: React.FC<ChipProps> = ({
  children,
  variant = 'default',
  size = 'md',
  icon,
  className = '',
  ...props
}) => {
  const sizeStyles = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs font-semibold';
  
  const variantStyles = {
    default: 'bg-slate-100 text-slate-700 border border-slate-200',
    success: 'bg-[#2E7D4F]/10 text-[#2E7D4F] border border-[#2E7D4F]/30',
    warning: 'bg-[#B8860B]/10 text-[#B8860B] border border-[#B8860B]/30',
    danger: 'bg-[#C8441B]/10 text-[#C8441B] border border-[#C8441B]/30',
    info: 'bg-[#1F6F8B]/10 text-[#1F6F8B] border border-[#1F6F8B]/30',
    demo: 'bg-amber-100 text-amber-900 border border-amber-300 tracking-wider font-mono uppercase',
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ${sizeStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = 'h-4 w-full' }) => {
  return (
    <div className={`animate-pulse rounded-lg bg-slate-200/80 ${className}`} />
  );
};

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose }) => {
  const borderStyles = {
    success: 'border-l-4 border-[#2E7D4F] bg-white text-slate-800',
    error: 'border-l-4 border-[#C8441B] bg-white text-slate-800',
    warning: 'border-l-4 border-[#B8860B] bg-white text-slate-800',
    info: 'border-l-4 border-[#1F6F8B] bg-white text-slate-800',
  }[type];

  return (
    <div className={`fixed bottom-5 right-5 z-50 flex items-center justify-between gap-4 rounded-lg p-4 shadow-xl border ${borderStyles} min-w-[280px]`}>
      <span className="text-sm font-medium">{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 text-xs font-bold"
        >
          ✕
        </button>
      )}
    </div>
  );
};
