import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'flat' | 'outline' | 'alert' | 'highlight';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
  ...props
}) => {
  const variantStyles = {
    default: 'bg-white dark:bg-navy-dark border border-slate-200/70 dark:border-emerald-950/50 shadow-subtle hover:shadow-card',
    flat: 'bg-slate-50/80 dark:bg-navy-surface border border-slate-200/60 dark:border-emerald-950/60',
    outline: 'bg-transparent border-2 border-slate-200 dark:border-emerald-950/60',
    alert: 'bg-rust-bg dark:bg-rust-dark/20 border border-rust/30 shadow-subtle',
    highlight: 'bg-forest-bg dark:bg-forest-dark/30 border border-forest/30 shadow-subtle',
  };

  return (
    <div
      className={`rounded-2xl transition-all duration-200 ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`px-5 py-4 border-b border-slate-100 dark:border-emerald-950/40 flex items-center justify-between ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <h3 className={`font-bold text-slate-900 dark:text-white text-base leading-snug tracking-tight ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <p className={`text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`p-5 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`px-5 py-3.5 bg-slate-50/70 dark:bg-navy-surface/80 border-t border-slate-100 dark:border-emerald-950/40 rounded-b-2xl flex items-center ${className}`} {...props}>
    {children}
  </div>
);
