import React from 'react';
import { AlertCircle, Sparkles } from 'lucide-react';
import { Tooltip } from './Tooltip';

interface DemoRibbonProps {
  isDemo?: boolean;
}

export const DemoRibbon: React.FC<DemoRibbonProps> = ({ isDemo = true }) => {
  if (!isDemo) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/25 to-amber-500/15 dark:from-amber-950/40 dark:via-amber-900/40 dark:to-amber-950/40 text-amber-900 dark:text-amber-200 px-4 py-1.5 text-xs font-semibold flex items-center justify-center gap-2 border-b border-amber-300/50 dark:border-amber-800/40 shadow-subtle">
      <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" />
      <span className="tracking-wide uppercase font-bold text-[11px] text-amber-800 dark:text-amber-300">
        Demo Mode Active:
      </span>
      <span className="text-[12px] font-medium hidden sm:inline text-amber-900/90 dark:text-amber-200">
        Satellite telemetry, confidence scores (e.g. 92%), and polygons are illustrative synthetic test values.
      </span>
      <span className="text-[12px] font-medium sm:hidden text-amber-900/90 dark:text-amber-200">
        Illustrative test values only.
      </span>
      <Tooltip
        term="Demo Data Notice"
        text="Per project code of conduct, all data displayed in mock or demo mode is synthetic telemetry. Confidence scores and area measurements are illustrative examples and not real certified satellite observations."
      >
        <span className="inline-flex items-center gap-1 bg-amber-200/60 dark:bg-amber-800/50 hover:bg-amber-200 text-amber-900 dark:text-amber-100 px-2 py-0.5 rounded-md text-[10px] ml-1 font-bold cursor-help transition-colors">
          <AlertCircle className="w-3 h-3" />
          Honesty Policy
        </span>
      </Tooltip>
    </div>
  );
};
