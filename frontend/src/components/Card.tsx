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
    default: 'bg-white border border-slate-200/90 shadow-card hover:shadow-card-hover',
    flat: 'bg-cream-50/70 border border-slate-200/70',
    outline: 'bg-transparent border-2 border-slate-300 dark:border-slate-700',
    alert: 'bg-rust-bg/80 border border-rust/40 shadow-card',
    highlight: 'bg-forest-bg/80 border border-forest/40 shadow-card',
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
  <div className={`px-5 py-4 border-b border-slate-100 flex items-center justify-between ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <h3 className={`font-semibold text-navy text-base leading-snug ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <p className={`text-xs text-slate-500 mt-0.5 ${className}`} {...props}>
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
  <div className={`px-5 py-3.5 bg-slate-50/60 border-t border-slate-100 rounded-b-xl flex items-center ${className}`} {...props}>
    {children}
  </div>
);
