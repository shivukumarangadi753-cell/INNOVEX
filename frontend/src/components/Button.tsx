import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'forest' | 'danger' | 'teal' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = '',
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none active:scale-[0.98] cursor-pointer';

    const sizeStyles = {
      sm: 'text-xs px-3 py-2 min-h-[36px] gap-1.5',
      md: 'text-sm px-4 py-2.5 min-h-[42px] gap-2',
      lg: 'text-base px-5 py-3 min-h-[48px] gap-2.5',
    };

    const variantStyles = {
      primary:
        'bg-[#0b241e] hover:bg-[#13382f] text-white focus-visible:ring-emerald-500 shadow-sm hover:shadow',
      forest:
        'bg-[#16a34a] hover:bg-[#15803d] text-white focus-visible:ring-emerald-500 shadow-sm hover:shadow-glow-emerald',
      danger:
        'bg-rust text-white hover:bg-rust-light focus-visible:ring-rust shadow-sm hover:shadow',
      teal:
        'bg-teal text-white hover:bg-teal-light focus-visible:ring-teal shadow-sm hover:shadow',
      outline:
        'border border-slate-200/90 dark:border-emerald-950/60 text-slate-700 dark:text-slate-200 bg-white dark:bg-navy-dark hover:bg-slate-50 dark:hover:bg-navy-surface hover:border-slate-300 focus-visible:ring-emerald-500 shadow-subtle',
      ghost:
        'text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-400 focus-visible:ring-emerald-500',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
