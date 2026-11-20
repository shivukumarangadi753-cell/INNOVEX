import React from 'react';
import { AlertCircle, Sparkles } from 'lucide-react';
import { Tooltip } from './Tooltip';

interface DemoRibbonProps {
  isDemo?: boolean;
}

export const DemoRibbon: React.FC<DemoRibbonProps> = ({ isDemo = true }) => {
  if (!isDemo) return null;

  return (
    <div className="bg-gradient-to-r from-amber/95 via-amber to-amber/95 text-navy-dark px-4 py-1.5 text-xs font-semibold flex items-center justify-center gap-2 shadow-xs border-b border-amber-dark/25">
      <Sparkles className="w-3.5 h-3.5 text-navy-dark animate-pulse shrink-0" aria-hidden="true" />
      <span className="tracking-wider uppercase font-extrabold text-[11px]">
        DEMO MODE ACTIVE:
      </span>
      <span className="text-[12px] font-medium hidden sm:inline">
        Satellite telemetry, confidence scores (e.g. 92%), and polygons are illustrative synthetic test values.
      </span>
      <span className="text-[12px] font-medium sm:hidden">
        Illustrative test values only.
      </span>
      <Tooltip
        term="Demo Data Notice"
        text="Per project code of conduct, all data displayed in mock or demo mode is synthetic telemetry. Confidence scores and area measurements are illustrative examples and not real certified satellite observations."
      >
        <span className="inline-flex items-center gap-1 bg-white/50 hover:bg-white/80 text-navy-dark px-2 py-0.5 rounded-full text-[10px] ml-1 font-bold shadow-2xs cursor-help transition-all duration-150">
          <AlertCircle className="w-3 h-3 text-navy-dark" />
          Honesty Policy
        </span>
      </Tooltip>
    </div>
  );
};
