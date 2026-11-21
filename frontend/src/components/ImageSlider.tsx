import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ChevronsLeftRight, Layers } from 'lucide-react';

interface ImageSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
  fallbackMessage?: React.ReactNode;
  fallbackBefore?: string;
  fallbackAfter?: string;
}

export const ImageSlider: React.FC<ImageSliderProps> = ({
  beforeImage,
  afterImage,
  beforeLabel = 'Before (Nov 08, 2025)',
  afterLabel = 'After (Nov 18, 2025)',
  className = '',
  fallbackMessage,
  fallbackBefore,
  fallbackAfter,
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [currentBefore, setCurrentBefore] = useState(beforeImage);
  const [currentAfter, setCurrentAfter] = useState(afterImage);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentBefore(beforeImage);
    setCurrentAfter(afterImage);
    setHasError(false);
  }, [beforeImage, afterImage]);

  const handleBeforeError = () => {
    if (fallbackBefore && currentBefore !== fallbackBefore) {
      setCurrentBefore(fallbackBefore);
      return;
    }
    if (currentBefore.includes('?')) {
      setCurrentBefore(currentBefore.split('?')[0]);
    } else if (currentBefore.includes('alert-mng-001')) {
      setCurrentBefore('/static/alerts/alt-mng-001_before.png');
    } else if (currentBefore.includes('alt-mng-001')) {
      setCurrentBefore('/static/alerts/alert-001_before.png');
    } else {
      setHasError(true);
    }
  };

  const handleAfterError = () => {
    if (fallbackAfter && currentAfter !== fallbackAfter) {
      setCurrentAfter(fallbackAfter);
      return;
    }
    if (currentAfter.includes('?')) {
      setCurrentAfter(currentAfter.split('?')[0]);
    } else if (currentAfter.includes('alert-mng-001')) {
      setCurrentAfter('/static/alerts/alt-mng-001_after.png');
    } else if (currentAfter.includes('alt-mng-001')) {
      setCurrentAfter('/static/alerts/alert-001_after.png');
    } else {
      setHasError(true);
    }
  };

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min((x / rect.width) * 100, 100));
    setSliderPosition(percent);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  }, [handleMove]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  }, [isDragging, handleMove]);

  if (hasError) {
    return (
      <div
        className={`relative flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden rounded-2xl bg-slate-900/90 text-slate-200 aspect-[4/3] sm:aspect-video shadow-card border border-amber-500/30 ${className}`}
      >
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
          <Layers className="w-6 h-6" />
        </div>
        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
          Bi-Temporal Satellite Observation
        </h4>
        <p className="text-xs text-amber-300 font-medium max-w-sm leading-relaxed px-4">
          {fallbackMessage || 'Demo image not generated on this computer. Run the demo generator.'}
        </p>
        <div className="mt-3 flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider font-semibold uppercase bg-slate-800 text-slate-400 border border-slate-700">
            DEMO DATA
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative select-none overflow-hidden rounded-2xl bg-slate-950 aspect-[4/3] sm:aspect-video shadow-card border border-slate-200/60 dark:border-emerald-950/60 ${className}`}
      onMouseMove={handleMouseMove}
      onMouseDown={() => setIsDragging(true)}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
      onTouchMove={handleTouchMove}
    >
      {/* After Image (Background) */}
      <img
        src={currentAfter}
        alt={afterLabel}
        onError={handleAfterError}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />
      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-white/20 shadow-sm pointer-events-none">
        {afterLabel}
      </div>

      {/* Before Image (Clipped Overlay) */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img
          src={currentBefore}
          alt={beforeLabel}
          onError={handleBeforeError}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-white/20 shadow-sm pointer-events-none">
          {beforeLabel}
        </div>
      </div>

      {/* Slider Divider Bar with Circular Drag Handle (Exact Reference Match) */}
      <div
        className="absolute top-0 bottom-0 w-[2px] bg-white/90 shadow-[0_0_10px_rgba(0,0,0,0.5)] cursor-ew-resize flex items-center justify-center -translate-x-1/2 z-10"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="w-8 h-8 rounded-full bg-[#0b241e] text-white flex items-center justify-center shadow-xl border-2 border-white hover:scale-110 active:scale-95 transition-transform">
          <ChevronsLeftRight className="w-4 h-4 text-emerald-400" />
        </div>
      </div>

      {/* Accessible range input for screen readers and keyboard users */}
      <input
        type="range"
        min="0"
        max="100"
        value={sliderPosition}
        onChange={(e) => setSliderPosition(Number(e.target.value))}
        aria-label="Image comparison slider"
        className="sr-only"
      />
    </div>
  );
};
