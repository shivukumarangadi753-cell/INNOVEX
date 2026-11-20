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
      'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]';

    const sizeStyles = {
      sm: 'text-xs px-3 py-2 min-h-[36px] gap-1.5 font-semibold',
      md: 'text-sm px-4 py-2.5 min-h-[44px] gap-2 font-semibold', // Meets 44px touch target rule
      lg: 'text-base px-5 py-3 min-h-[48px] gap-2.5 font-bold',
    };

    const variantStyles = {
      primary:
        'bg-navy text-white hover:bg-navy-light focus-visible:ring-navy shadow-sm hover:shadow-md',
      forest:
        'bg-gradient-to-r from-forest to-forest-dark text-white hover:from-forest-light hover:to-forest focus-visible:ring-forest shadow-sm hover:shadow-md',
      danger:
        'bg-gradient-to-r from-rust to-rust-dark text-white hover:from-rust-light hover:to-rust focus-visible:ring-rust shadow-sm hover:shadow-md',
      teal:
        'bg-gradient-to-r from-teal to-teal-dark text-white hover:from-teal-light hover:to-teal focus-visible:ring-teal shadow-sm hover:shadow-md',
      outline:
        'border border-slate-300 dark:border-slate-700 text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-400 focus-visible:ring-slate-400 shadow-2xs',
      ghost:
        'text-slate-700 hover:bg-slate-100 hover:text-navy focus-visible:ring-slate-300',
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
