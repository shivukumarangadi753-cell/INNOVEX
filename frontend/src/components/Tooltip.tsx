import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
  text: string;
  term?: string;
  children?: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ text, term, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsVisible(false);
    };
    if (isVisible) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);

  return (
    <span
      ref={containerRef}
      className="relative inline-flex items-center align-middle"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      <button
        type="button"
        aria-label={`Explainer: ${term || text}`}
        className="text-slate-400 hover:text-navy focus:text-navy focus:outline-none transition-colors p-0.5"
      >
        {children || <HelpCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
      </button>

      {isVisible && (
        <span
          role="tooltip"
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2.5 bg-navy-dark text-white text-xs rounded-lg shadow-float leading-relaxed pointer-events-none animate-in fade-in zoom-in-95 duration-150"
        >
          {term && <strong className="block text-cream-200 mb-1 border-b border-white/10 pb-0.5">{term}</strong>}
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-navy-dark" />
        </span>
      )}
    </span>
  );
};
