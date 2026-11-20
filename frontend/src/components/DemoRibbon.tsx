import React from 'react';
import { AlertCircle, Sparkles } from 'lucide-react';
import { Tooltip } from './Tooltip';

interface DemoRibbonProps {
  isDemo?: boolean;
}

export const DemoRibbon: React.FC<DemoRibbonProps> = ({ isDemo = true }) => {
  if (!isDemo) return null;

  return (
    <div className="bg-gradient-to-r from-amber/90 via-amber to-amber/90 text-navy-dark px-4 py-1.5 text-xs font-semibold flex items-center justify-center gap-2 shadow-sm border-b border-amber-dark/20">
      <Sparkles className="w-4 h-4 text-navy shrink-0" aria-hidden="true" />
      <span className="tracking-wide uppercase font-bold text-[11px]">
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
        <span className="inline-flex items-center gap-1 bg-white/40 hover:bg-white/60 text-navy px-1.5 py-0.5 rounded text-[10px] ml-1 font-semibold cursor-help transition-colors">
          <AlertCircle className="w-3 h-3" />
          Honesty Policy
        </span>
      </Tooltip>
    </div>
  );
};
