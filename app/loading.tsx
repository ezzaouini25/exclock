"use client";

import React from "react";

// ===== CLOCK-THEMED LOADER =====
// Uses root CSS variables (primary, muted, foreground, background, etc.)
// Fully responsive: w-20 on mobile, w-24 on sm, w-28 on md+
export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background">
      {/* Clock container - responsive sizing */}
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28">
        {/* Outer clock face ring */}
        <div className="absolute inset-0 rounded-full border-2 border-muted" />
        
        {/* Ticks around the clock */}
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((tick) => (
          <div
            key={tick}
            className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-1.5 sm:h-2 bg-muted-foreground/30 rounded-full origin-bottom"
            style={{
              height: tick % 3 === 0 ? '8px' : '4px',
              transform: `translateX(-50%) rotate(${tick * 30}deg)`,
              transformOrigin: '50% 40px',
            }}
          />
        ))}
        
        {/* Animated hour hand */}
        <div
          className="absolute top-1/2 left-1/2 w-0.5 sm:w-0.5 bg-foreground rounded-full origin-bottom"
          style={{
            height: '28%',
            transform: 'translate(-50%, -100%)',
            animation: 'clockHour 4s linear infinite',
          }}
        />
        
        {/* Animated minute hand */}
        <div
          className="absolute top-1/2 left-1/2 w-0.5 sm:w-0.5 bg-primary rounded-full origin-bottom"
          style={{
            height: '38%',
            transform: 'translate(-50%, -100%)',
            animation: 'clockMinute 2s linear infinite',
          }}
        />
        
        {/* Animated second hand */}
        <div
          className="absolute top-1/2 left-1/2 w-[1.5px] bg-destructive rounded-full origin-bottom"
          style={{
            height: '42%',
            transform: 'translate(-50%, -100%)',
            animation: 'clockSecond 1s linear infinite',
          }}
        />
        
        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-primary rounded-full shadow-md" />
        
        {/* Sweeping arc trail */}
        <div
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary"
          style={{ animation: 'clockSpin 1.5s linear infinite' }}
        />
      </div>

      {/* Loading text - responsive */}
      <p className="mt-6 sm:mt-8 text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase text-muted-foreground animate-pulse">
        Loading
      </p>

      {/* Inline keyframes */}
      <style jsx>{`
        @keyframes clockHour {
          from { transform: translate(-50%, -100%) rotate(0deg); }
          to { transform: translate(-50%, -100%) rotate(360deg); }
        }
        @keyframes clockMinute {
          from { transform: translate(-50%, -100%) rotate(0deg); }
          to { transform: translate(-50%, -100%) rotate(360deg); }
        }
        @keyframes clockSecond {
          from { transform: translate(-50%, -100%) rotate(0deg); }
          to { transform: translate(-50%, -100%) rotate(360deg); }
        }
        @keyframes clockSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}