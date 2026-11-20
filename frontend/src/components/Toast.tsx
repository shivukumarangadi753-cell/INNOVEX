import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  title: string;
  message?: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastItem, 'id'>) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ title, message, type }: Omit<ToastItem, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, title, message, type }]);

      setTimeout(() => {
        removeToast(id);
      }, 4500);
    },
    [removeToast]
  );

  const success = useCallback((title: string, message?: string) => showToast({ title, message, type: 'success' }), [showToast]);
  const error = useCallback((title: string, message?: string) => showToast({ title, message, type: 'error' }), [showToast]);
  const info = useCallback((title: string, message?: string) => showToast({ title, message, type: 'info' }), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, info }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-float border transition-all duration-200 animate-in slide-in-from-bottom-3 ${
              toast.type === 'success'
                ? 'bg-forest text-white border-forest-light'
                : toast.type === 'error'
                ? 'bg-rust text-white border-rust-light'
                : 'bg-navy text-white border-navy-light'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-white mt-0.5" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 shrink-0 text-white mt-0.5" />
            ) : (
              <Info className="w-5 h-5 shrink-0 text-white mt-0.5" />
            )}

            <div className="flex-1 min-w-0">
              <h5 className="font-semibold text-sm leading-tight text-white">{toast.title}</h5>
              {toast.message && (
                <p className="text-xs text-white/90 mt-1 leading-snug">{toast.message}</p>
              )}
            </div>

            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
