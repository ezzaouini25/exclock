"use client";

import React, { useRef, useEffect } from "react";
import { Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimeSelectorProps {
  value: number;
  onChange: (val: number | ((prev: number) => number)) => void;
  min: number;
  max: number;
  label: string;
  padTo?: number;
}

export function TimeSelector({
  value,
  onChange,
  min,
  max,
  label,
  padTo = 2,
}: TimeSelectorProps) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const increment = () => {
    onChange(value >= max ? min : value + 1);
  };

  const decrement = () => {
    onChange(value <= min ? max : value - 1);
  };

  const startPress = (action: "inc" | "dec") => {
    if (action === "inc") increment();
    else decrement();

    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        if (action === "inc") {
          onChange((prev: number) => (prev >= max ? min : prev + 1));
        } else {
          onChange((prev: number) => (prev <= min ? max : prev - 1));
        }
      }, 100);
    }, 500);
  };

  const stopPress = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  useEffect(() => {
    return () => stopPress();
  }, []);

  const displayValue = padTo > 0 ? String(value).padStart(padTo, "0") : String(value);

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onMouseDown={() => startPress("inc")}
        onMouseUp={stopPress}
        onMouseLeave={stopPress}
        onTouchStart={(e) => { e.preventDefault(); startPress("inc"); }}
        onTouchEnd={(e) => { e.preventDefault(); stopPress(); }}
        className="p-3 bg-muted hover:bg-muted/80 active:bg-muted/60 text-muted-foreground hover:text-foreground rounded-2xl transition-colors select-none touch-manipulation"
        aria-label="Increase"
      >
        <Plus className="w-6 h-6" />
      </button>
      
      <div className="flex flex-col items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-card border border-border rounded-2xl shadow-inner select-none">
        <span className="text-3xl sm:text-4xl font-mono tabular-nums text-foreground">
          {displayValue}
        </span>
        <span className="text-[9px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-1">
          {label}
        </span>
      </div>

      <button
        type="button"
        onMouseDown={() => startPress("dec")}
        onMouseUp={stopPress}
        onMouseLeave={stopPress}
        onTouchStart={(e) => { e.preventDefault(); startPress("dec"); }}
        onTouchEnd={(e) => { e.preventDefault(); stopPress(); }}
        className="p-3 bg-muted hover:bg-muted/80 active:bg-muted/60 text-muted-foreground hover:text-foreground rounded-2xl transition-colors select-none touch-manipulation"
        aria-label="Decrease"
      >
        <Minus className="w-6 h-6" />
      </button>
    </div>
  );
}