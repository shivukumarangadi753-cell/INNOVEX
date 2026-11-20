import React, { useState, useRef, useCallback } from 'react';
import { ChevronsLeftRight } from 'lucide-react';

interface ImageSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}

export const ImageSlider: React.FC<ImageSliderProps> = ({
  beforeImage,
  afterImage,
  beforeLabel = 'Pass T1 (Before)',
  afterLabel = 'Pass T2 (After)',
  className = '',
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  return (
    <div
      ref={containerRef}
      className={`relative select-none overflow-hidden rounded-xl bg-slate-950 aspect-video shadow-md ${className}`}
      onMouseMove={handleMouseMove}
      onMouseDown={() => setIsDragging(true)}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
      onTouchMove={handleTouchMove}
    >
      {/* After Image (Background) */}
      <img
        src={afterImage}
        alt={afterLabel}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />
      <div className="absolute top-3 right-3 bg-rust/90 backdrop-blur-sm text-white text-[11px] font-semibold px-2.5 py-1 rounded-md shadow-sm">
        {afterLabel}
      </div>

      {/* Before Image (Clipped Overlay) */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img
          src={beforeImage}
          alt={beforeLabel}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute top-3 left-3 bg-forest/90 backdrop-blur-sm text-white text-[11px] font-semibold px-2.5 py-1 rounded-md shadow-sm">
          {beforeLabel}
        </div>
      </div>

      {/* Slider Divider Bar */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white shadow-2xl cursor-ew-resize flex items-center justify-center -translate-x-1/2"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="w-8 h-8 rounded-full bg-navy text-white flex items-center justify-center shadow-lg border-2 border-white">
          <ChevronsLeftRight className="w-4 h-4" />
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
