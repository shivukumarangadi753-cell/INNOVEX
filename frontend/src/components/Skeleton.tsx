import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', ...props }) => {
  return (
    <div
      className={`animate-pulse bg-slate-200/80 rounded-lg ${className}`}
      aria-hidden="true"
      {...props}
    />
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-1/2" />
      <div className="pt-2 border-t border-slate-100 flex justify-between">
        <Skeleton className="h-3 w-1/4" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
  );
};

export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20 rounded-md" />
              <Skeleton className="h-5 w-24 rounded-md" />
            </div>
            <Skeleton className="h-4 w-3/4" />
          </div>
          <Skeleton className="h-8 w-24 rounded-xl" />
        </div>
      ))}
    </div>
  );
};
