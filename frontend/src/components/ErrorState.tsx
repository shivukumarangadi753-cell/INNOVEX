import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  className = '',
}) => {
  return (
    <div
      role="alert"
      className={`p-6 bg-rust-bg border border-rust/30 rounded-xl text-center flex flex-col items-center justify-center ${className}`}
    >
      <div className="p-3 bg-rust/10 text-rust rounded-full mb-3">
        <AlertTriangle className="w-6 h-6" aria-hidden="true" />
      </div>
      <h4 className="text-base font-semibold text-rust-dark">{title}</h4>
      <p className="text-xs text-slate-700 max-w-md mt-1 mb-4 leading-relaxed">{message}</p>
      {onRetry && (
        <Button
          size="sm"
          variant="outline"
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          onClick={onRetry}
        >
          Try Again
        </Button>
      )}
    </div>
  );
};
