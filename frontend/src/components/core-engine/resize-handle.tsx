"use client";

import { useCallback, useRef, useEffect, useState } from "react";
import { GripVertical } from "lucide-react";

interface ResizeHandleProps {
  /** Current split ratio (0 to 1, default 0.5 = 50/50) */
  ratio: number;
  /** Called with new ratio when user drags */
  onRatioChange: (ratio: number) => void;
  /** Min ratio for left panel (default 0.25) */
  minRatio?: number;
  /** Max ratio for left panel (default 0.75) */
  maxRatio?: number;
}

export function ResizeHandle({
  ratio,
  onRatioChange,
  minRatio = 0.25,
  maxRatio = 0.75,
}: ResizeHandleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
    },
    []
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const parent = containerRef.current?.parentElement;
      if (!parent) return;

      const rect = parent.getBoundingClientRect();
      const x = e.clientX - rect.left;
      let newRatio = x / rect.width;

      // Clamp
      newRatio = Math.max(minRatio, Math.min(maxRatio, newRatio));
      onRatioChange(newRatio);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    // Prevent text selection while dragging
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isDragging, minRatio, maxRatio, onRatioChange]);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      className={`relative flex items-center justify-center w-0 group cursor-col-resize z-10 ${
        isDragging ? "z-50" : ""
      }`}
    >
      {/* Invisible hit area */}
      <div className="absolute inset-y-0 -left-2 -right-2 w-4" />

      {/* Visible line */}
      <div
        className={`absolute inset-y-0 w-px transition-colors ${
          isDragging
            ? "bg-primary"
            : "bg-border group-hover:bg-primary/50"
        }`}
      />

      {/* Drag handle button */}
      <div
        className={`absolute flex items-center justify-center w-5 h-10 rounded-md border transition-all ${
          isDragging
            ? "bg-primary/20 border-primary shadow-lg shadow-primary/20"
            : "bg-card border-border group-hover:border-primary/50 group-hover:bg-accent"
        }`}
      >
        <GripVertical
          className={`w-3 h-3 transition-colors ${
            isDragging ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
          }`}
        />
      </div>
    </div>
  );
}
