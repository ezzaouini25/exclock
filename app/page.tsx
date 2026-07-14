"use client";

import React, { useState, useEffect, Suspense, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Sun, Moon, Settings, Watch, Orbit, Grid3x3, Binary, Sparkles, Check, X, Maximize, Minimize } from "lucide-react";
import { SeoContent } from "@/components/SeoContent";
import Loading from "@/app/loading";

// ===== CLOCK DESIGN TYPES =====
type ClockDesign = "digital" | "analog" | "orbital" | "segment" | "binary" | "neon";

const designs: { id: ClockDesign; label: string; icon: React.ReactNode }[] = [
  { id: "digital", label: "Digital", icon: <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> },
  { id: "analog", label: "Analog", icon: <Watch className="w-4 h-4 sm:w-5 sm:h-5" /> },
  { id: "orbital", label: "Orbital", icon: <Orbit className="w-4 h-4 sm:w-5 sm:h-5" /> },
  { id: "segment", label: "LED", icon: <Grid3x3 className="w-4 h-4 sm:w-5 sm:h-5" /> },
  { id: "binary", label: "Binary", icon: <Binary className="w-4 h-4 sm:w-5 sm:h-5" /> },
  { id: "neon", label: "Neon", icon: <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" /> },
];

// ===== 1. DIGITAL CLOCK (DEFAULT) =====
function DigitalClock({ time, isFullscreen, is12Hour }: { time: Date; isFullscreen: boolean; is12Hour: boolean }) {
  let hours: number;
  let displayHours: string;

  if (is12Hour) {
    hours = time.getHours() % 12;
    if (hours === 0) hours = 12;
    displayHours = hours.toString().padStart(2, "0");
  } else {
    displayHours = format(time, "HH");
  }

  const minutes = format(time, "mm");
  const seconds = format(time, "ss");
  const isAm = time.getHours() < 12;

  return (
    <>
      <div className="relative w-full flex justify-center">
        <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full scale-150 pointer-events-none" />

        <div className={cn(
          "relative flex items-baseline justify-center",
          isFullscreen ? "space-x-1 sm:space-x-2 md:space-x-3" : "space-x-0.5 sm:space-x-1 md:space-x-3"
        )} dir="ltr">
          <TimeBlock value={displayHours} isFullscreen={isFullscreen} />
          <span className={cn(
            "font-mono text-primary/30 animate-pulse leading-none self-center select-none",
            isFullscreen ? "text-5xl sm:text-7xl md:text-[10rem]" : "text-[5vw] sm:text-5xl md:text-7xl lg:text-8xl"
          )}>:</span>
          <TimeBlock value={minutes} isFullscreen={isFullscreen} />
          <span className={cn(
            "font-mono text-primary/30 animate-pulse leading-none self-center select-none",
            isFullscreen ? "text-5xl sm:text-7xl md:text-[10rem]" : "text-[5vw] sm:text-5xl md:text-7xl lg:text-8xl"
          )}>:</span>
          <TimeBlock value={seconds} textClassName="text-muted-foreground" isFullscreen={isFullscreen} />

          {is12Hour && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "flex flex-col items-center justify-center self-center",
                isFullscreen ? "text-xl sm:text-3xl md:text-4xl" : "text-[2.5vw] sm:text-xl md:text-2xl"
              )}
            >
              <span className={cn(
                "font-bold transition-colors duration-300",
                !isAm ? "text-primary" : "text-muted-foreground/30"
              )}>AM</span>
              <span className={cn(
                "font-bold transition-colors duration-300",
                isAm ? "text-primary" : "text-muted-foreground/30"
              )}>PM</span>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
}

function TimeBlock({ value, textClassName = "text-foreground", isFullscreen }: { value: string; textClassName?: string; isFullscreen?: boolean }) {
  return (
      <div className={cn(
        "flex items-center justify-center",
        isFullscreen ? "h-[3.5rem] sm:h-[6rem] md:h-[9rem] lg:h-[11rem]" : "h-[14vw] sm:h-[5rem] md:h-[7rem] lg:h-[9rem]"
      )}>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          initial={{ y: "50%", opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: "-50%", opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={cn(
            "font-mono tabular-nums font-light tracking-tighter leading-none",
            textClassName,
            isFullscreen ? "text-[2.5rem] sm:text-[5rem] md:text-[8rem] lg:text-[10rem]" : "text-[14vw] sm:text-[4rem] md:text-[6rem] lg:text-[8rem]"
          )}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

// ===== 2. ANALOG CLOCK =====
function AnalogClock({ time, isFullscreen }: { time: Date; isFullscreen: boolean }) {
  const seconds = time.getSeconds();
  const minutes = time.getMinutes();
  const hours = time.getHours() % 12;

  const secondDeg = seconds * 6;
  const minuteDeg = minutes * 6 + seconds * 0.1;
  const hourDeg = hours * 30 + minutes * 0.5;

  const size = isFullscreen
    ? "w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 lg:w-[28rem] lg:h-[28rem]"
    : "w-[80vw] max-w-[20rem] h-[80vw] max-h-[20rem] sm:w-64 sm:h-64 md:w-72 md:h-72 lg:w-80 lg:h-80";

  return (
    <div className={cn("relative rounded-full", size)}>
      <div className="absolute -inset-3 bg-primary/10 rounded-full blur-xl" />
      <div className="relative w-full h-full rounded-full border-2 border-border/50 bg-card shadow-2xl">
        <div className="absolute inset-1.5 rounded-full bg-gradient-to-br from-background to-muted/50" />

        {Array.from({ length: 12 }).map((_, i) => {
          const angle = i * 30;
          const isCardinal = i % 3 === 0;
          return (
            <div key={i} className="absolute inset-0" style={{ transform: `rotate(${angle}deg)` }}>
              <div className={cn(
                "absolute top-1.5 left-1/2 -translate-x-1/2 rounded-full bg-foreground/70",
                isCardinal ? "w-1 h-3.5" : "w-0.5 h-2"
              )} />
            </div>
          );
        })}

        {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((num, i) => {
          const angle = (i * 30 - 90) * (Math.PI / 180);
          return (
            <span
              key={num}
              className="absolute text-xs sm:text-sm font-semibold text-foreground/70"
              style={{
                left: `calc(50% + ${Math.cos(angle) * 33}%)`,
                top: `calc(50% + ${Math.sin(angle) * 33}%)`,
                transform: "translate(-50%, -50%)",
              }}
            >
              {num}
            </span>
          );
        })}

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 md:w-4 md:h-4 rounded-full bg-primary z-20 shadow-lg" />

        <div
          className="absolute top-1/2 left-1/2 w-1 md:w-1.5 bg-foreground rounded-full origin-bottom z-10"
          style={{
            height: "24%",
            transform: `translate(-50%, -100%) rotate(${hourDeg}deg)`,
            transition: "transform 0.5s cubic-bezier(0.4, 2.08, 0.55, 0.44)",
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-0.5 md:w-1 bg-foreground/80 rounded-full origin-bottom z-10"
          style={{
            height: "34%",
            transform: `translate(-50%, -100%) rotate(${minuteDeg}deg)`,
            transition: "transform 0.5s cubic-bezier(0.4, 2.08, 0.55, 0.44)",
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-0.5 bg-primary rounded-full origin-bottom z-10"
          style={{
            height: "38%",
            transform: `translate(-50%, -100%) rotate(${secondDeg}deg)`,
            transition: seconds === 0 ? "none" : "transform 0.1s linear",
          }}
        />
        <div className="absolute top-1/2 left-1/2 w-2.5 h-2.5 md:w-3 md:h-3 bg-primary rounded-full -translate-x-1/2 -translate-y-1/2 z-10" />
      </div>
    </div>
  );
}

// ===== 3. ORBITAL CLOCK =====
function OrbitalClock({ time, isFullscreen }: { time: Date; isFullscreen: boolean }) {
  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();
  const ms = time.getMilliseconds();

  const smoothSeconds = seconds + ms / 1000;
  const smoothMinutes = minutes + smoothSeconds / 60;
  const smoothHours = (hours % 12) + smoothMinutes / 60;

  const size = isFullscreen
    ? "w-72 h-72 sm:w-96 sm:h-96 md:w-[28rem] md:h-[28rem]"
    : "w-[80vw] max-w-[20rem] h-[80vw] max-h-[20rem] sm:w-72 sm:h-72 md:w-80 md:h-80";

  return (
    <div className={cn("relative flex items-center justify-center", size)}>
      <div className="absolute inset-0 rounded-full border-2 border-dashed border-primary/10 animate-[spin_60s_linear_infinite]" />
      <div className="absolute inset-8 sm:inset-10 rounded-full border-2 border-dashed border-primary/20 animate-[spin_40s_linear_infinite_reverse]" />
      <div className="absolute inset-16 sm:inset-20 rounded-full border-2 border-dashed border-primary/30 animate-[spin_20s_linear_infinite]" />

      <div className="relative z-10 flex flex-col items-center gap-1 backdrop-blur-sm bg-background/20 rounded-2xl px-4 py-2">
        <span className="text-2xl sm:text-3xl md:text-4xl font-mono font-bold text-foreground tabular-nums">
          {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}
        </span>
        <span className="text-sm text-muted-foreground font-medium tabular-nums">
          {String(seconds).padStart(2, "0")}
        </span>
      </div>

      {[
        { speed: smoothHours * 30, color: "bg-primary", size: "w-4 h-4 sm:w-5 sm:h-5", label: "H", radius: "100%" },
        { speed: smoothMinutes * 6, color: "bg-orange-500", size: "w-3.5 h-3.5 sm:w-4 sm:h-4", label: "M", radius: "72%" },
        { speed: smoothSeconds * 6, color: "bg-emerald-500", size: "w-3 h-3 sm:w-3.5 sm:h-3.5", label: "S", radius: "48%" },
      ].map((ring, i) => (
        <div key={i} className="absolute inset-0" style={{ transform: `rotate(${ring.speed}deg)` }}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className={cn("rounded-full shadow-lg flex items-center justify-center", ring.size, ring.color)}>
              <span className="text-[8px] font-bold text-white">{ring.label}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ===== 4. SEGMENT CLOCK =====
function SegmentClock({ time, isFullscreen }: { time: Date; isFullscreen: boolean }) {
  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();

  const digits = [
    Math.floor(hours / 10), hours % 10,
    Math.floor(minutes / 10), minutes % 10,
    Math.floor(seconds / 10), seconds % 10,
  ];

  const digitSize = isFullscreen
    ? "w-10 h-16 sm:w-14 sm:h-20 md:w-18 md:h-28 lg:w-20 lg:h-32"
    : "w-[13vw] max-w-[3rem] h-[20vw] max-h-[4.5rem] sm:w-12 sm:h-16 md:w-14 md:h-20 lg:w-16 lg:h-24";

  return (
    <div className="flex items-center gap-0.5 sm:gap-1">
      {digits.map((digit, i) => (
        <React.Fragment key={i}>
          {i === 2 || i === 4 ? (
            <div className="flex flex-col gap-2 sm:gap-3 mx-0.5 sm:mx-1">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary animate-pulse" />
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary animate-pulse delay-75" />
            </div>
          ) : null}
          <SevenSegmentDigit value={digit} className={digitSize} isSeconds={i >= 4} />
        </React.Fragment>
      ))}
    </div>
  );
}

function SevenSegmentDigit({ value, className, isSeconds }: { value: number; className?: string; isSeconds?: boolean }) {
  const segments = [
    { on: [0,2,3,5,6,7,8,9], style: "top-1 left-1.5 right-1.5 h-1 sm:h-1.5 rounded-full" },
    { on: [0,4,5,6,8,9], style: "top-1.5 bottom-1/2 left-0.5 w-1 sm:w-1.5 rounded-full" },
    { on: [0,1,2,3,4,7,8,9], style: "top-1.5 bottom-1/2 right-0.5 w-1 sm:w-1.5 rounded-full" },
    { on: [2,3,4,5,6,8,9], style: "top-1/2 left-1.5 right-1.5 h-1 sm:h-1.5 -translate-y-1/2 rounded-full" },
    { on: [0,2,6,8], style: "top-1/2 bottom-1.5 left-0.5 w-1 sm:w-1.5 rounded-full" },
    { on: [0,1,3,4,5,6,7,8,9], style: "top-1/2 bottom-1.5 right-0.5 w-1 sm:w-1.5 rounded-full" },
    { on: [0,2,3,5,6,8,9], style: "bottom-1 left-1.5 right-1.5 h-1 sm:h-1.5 rounded-full" },
  ];

  const activeColor = isSeconds ? "bg-orange-500" : "bg-primary";

  return (
    <div className={cn("relative bg-muted/30 rounded-lg sm:rounded-xl border border-border/30", className)}>
      {segments.map((seg, i) => (
        <div
          key={i}
          className={cn(
            "absolute transition-all duration-200",
            seg.style,
            seg.on.includes(value) ? activeColor : "bg-muted-foreground/10"
          )}
        />
      ))}
    </div>
  );
}

// ===== 5. BINARY CLOCK =====
function BinaryClock({ time, isFullscreen }: { time: Date; isFullscreen: boolean }) {
  const toBinary = (num: number, bits: number) => num.toString(2).padStart(bits, "0").split("").map(Number);

  const hBits = toBinary(time.getHours(), 6);
  const mBits = toBinary(time.getMinutes(), 6);
  const sBits = toBinary(time.getSeconds(), 6);

  const dotSize = isFullscreen
    ? "w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6"
    : "w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5";

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-6">
      <div className="flex items-start gap-4 sm:gap-6 md:gap-8">
        {[
          { bits: hBits, label: "HRS", value: time.getHours(), color: "bg-primary", glow: "shadow-primary/40" },
          { bits: mBits, label: "MIN", value: time.getMinutes(), color: "bg-orange-500", glow: "shadow-orange-500/40" },
          { bits: sBits, label: "SEC", value: time.getSeconds(), color: "bg-emerald-500", glow: "shadow-emerald-500/40" },
        ].map((col, ci) => (
          <div key={ci} className="flex flex-col items-center gap-2 sm:gap-3">
            <span className="text-[10px] sm:text-xs text-muted-foreground font-mono font-bold tracking-wider">{col.label}</span>
            <div className="flex flex-col-reverse gap-1.5 sm:gap-2">
              {col.bits.map((bit, i) => (
                <motion.div
                  key={i}
                  animate={{
                    backgroundColor: bit ? undefined : "rgba(var(--muted-foreground), 0.08)",
                    boxShadow: bit ? `0 0 12px currentColor` : "none",
                  }}
                  className={cn(
                    "rounded-full transition-colors duration-300",
                    dotSize,
                    bit ? col.color : "bg-muted-foreground/10"
                  )}
                />
              ))}
            </div>
            <span className="text-[10px] sm:text-xs text-muted-foreground font-mono">{String(col.value).padStart(2, "0")}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-3 sm:gap-4 md:gap-5">
        {[32, 16, 8, 4, 2, 1].map((val) => (
          <span key={val} className="text-[9px] sm:text-[10px] text-muted-foreground/40 font-mono w-3 sm:w-4 md:w-5 text-center">{val}</span>
        ))}
      </div>
    </div>
  );
}

// ===== 6. NEON CLOCK =====
function NeonClock({ time, isFullscreen, is12Hour }: { time: Date; isFullscreen: boolean; is12Hour: boolean }) {
  let hours: number;
  let displayHours: string;

  if (is12Hour) {
    hours = time.getHours() % 12;
    if (hours === 0) hours = 12;
    displayHours = hours.toString().padStart(2, "0");
  } else {
    displayHours = format(time, "HH");
  }

  const minutes = format(time, "mm");
  const seconds = format(time, "ss");
  const isAm = time.getHours() < 12;

  const textSize = isFullscreen
    ? "text-5xl sm:text-7xl md:text-8xl lg:text-9xl"
    : "text-[12vw] sm:text-5xl md:text-7xl lg:text-8xl";

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-6">
      <div className="relative">
        <div className="absolute inset-0 blur-2xl opacity-40">
          <span className={cn("font-mono tabular-nums font-black tracking-tighter text-primary", textSize)}>
            {displayHours}:{minutes}:{seconds}
          </span>
        </div>
        <div className="relative">
          <span className={cn("font-mono tabular-nums font-black tracking-tighter text-foreground", textSize)}>
            {displayHours}:{minutes}:<span className="text-muted-foreground">{seconds}</span>
          </span>
        </div>
      </div>

      <div className="w-full max-w-xs sm:max-w-sm md:max-w-md space-y-2 px-4">
        {[
          { label: "SEC", value: time.getSeconds() / 60, color: "bg-primary" },
          { label: "MIN", value: time.getMinutes() / 60, color: "bg-orange-500" },
          { label: "HRS", value: time.getHours() / 24, color: "bg-emerald-500" },
        ].map((bar) => (
          <div key={bar.label} className="flex items-center gap-2">
            <span className="text-[10px] sm:text-xs text-muted-foreground font-mono w-6">{bar.label}</span>
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div className={cn("h-full rounded-full", bar.color)} style={{ width: `${bar.value * 100}%` }} />
            </div>
          </div>
        ))}
      </div>

      {is12Hour && (
        <div className="flex items-center gap-2">
          <span className={cn("px-3 py-1 rounded-full text-xs font-bold transition-all", !isAm ? "text-primary bg-primary/10" : "text-muted-foreground/30")}>AM</span>
          <span className={cn("px-3 py-1 rounded-full text-xs font-bold transition-all", isAm ? "text-primary bg-primary/10" : "text-muted-foreground/30")}>PM</span>
        </div>
      )}
    </div>
  );
}

// ===== COOL 12H/24H TOGGLE =====
function TimeFormatToggle({ is12Hour, onToggle }: { is12Hour: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="relative flex items-center p-1 rounded-2xl bg-muted/80 backdrop-blur-sm border border-border/40 shadow-lg overflow-hidden group hover:border-primary/20 transition-colors"
    >
      <motion.div
        className="absolute top-1 bottom-1 rounded-xl bg-primary shadow-md"
        animate={{
          left: is12Hour ? "4px" : "calc(50% + 2px)",
          width: "calc(50% - 6px)",
        }}
        transition={{ type: "spring", stiffness: 500, damping: 35 }}
      />
      <div className={cn(
        "relative z-10 flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-colors duration-300",
        is12Hour ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
      )}>
        <Sun className="w-4 h-4" />
        <span className="text-sm font-bold">12H</span>
      </div>
      <div className={cn(
        "relative z-10 flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-colors duration-300",
        !is12Hour ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
      )}>
        <Moon className="w-4 h-4" />
        <span className="text-sm font-bold">24H</span>
      </div>
    </button>
  );
}

// ===== DESIGN POPUP =====
function DesignPopup({ isOpen, onClose, currentDesign, onSelect }: {
  isOpen: boolean;
  onClose: () => void;
  currentDesign: ClockDesign;
  onSelect: (d: ClockDesign) => void;
}) {
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            ref={popupRef}
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md max-h-[70vh] sm:max-h-[80vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-card border border-border shadow-2xl p-4 sm:p-6"
          >
            <div className="w-12 h-1 rounded-full bg-muted-foreground/20 mx-auto mb-4 sm:hidden" />
            <div className="flex items-center justify-between mb-4 sm:mb-5">
              <h3 className="text-base sm:text-lg font-bold">Clock Design</h3>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {designs.map((d) => {
                const isActive = currentDesign === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => {
                      onSelect(d.id);
                      onClose();
                    }}
                    className={cn(
                      "relative flex flex-col items-center gap-1.5 sm:gap-3 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all duration-300",
                      isActive
                        ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                        : "border-border/50 bg-muted/30 hover:border-primary/30 hover:bg-muted/50"
                    )}
                  >
                    <div className={cn(
                      "flex items-center justify-center w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl transition-all",
                      isActive ? "bg-primary text-primary-foreground shadow-md" : "bg-muted text-muted-foreground"
                    )}>
                      {d.icon}
                    </div>
                    <span className={cn("text-xs sm:text-sm font-semibold", isActive ? "text-primary" : "text-foreground")}>
                      {d.label}
                    </span>
                    {isActive && (
                      <div className="absolute top-2 right-2 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ===== MAIN PAGE CONTENT =====
function HomePageContent() {
  const [time, setTime] = useState<Date | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [is12Hour, setIs12Hour] = useState(false);
  const [design, setDesign] = useState<ClockDesign>("digital");
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  // Fullscreen handlers
  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } catch (err) {
        console.error('Fullscreen error:', err);
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  }, []);

  // Listen for fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("exclock-design") as ClockDesign | null;
    if (saved && designs.some(d => d.id === saved)) {
      setDesign(saved);
    }
  }, []);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleDesignChange = (newDesign: ClockDesign) => {
    setDesign(newDesign);
    localStorage.setItem("exclock-design", newDesign);
  };

  if (!time) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const dateStr = format(time, "EEEE, MMMM do, yyyy");

  const renderClock = () => {
    const props = { time, isFullscreen };
    switch (design) {
      case "analog": return <AnalogClock {...props} />;
      case "orbital": return <OrbitalClock {...props} />;
      case "segment": return <SegmentClock {...props} />;
      case "binary": return <BinaryClock {...props} />;
      case "neon": return <NeonClock time={time} isFullscreen={isFullscreen} is12Hour={is12Hour} />;
      case "digital":
      default: return <DigitalClock time={time} isFullscreen={isFullscreen} is12Hour={is12Hour} />;
    }
  };

  const showFormatToggle = design === "digital" || design === "neon";

  return (
    <>
      <div className={cn(
        "flex-1 flex flex-col items-center justify-center relative w-full overflow-x-hidden",
        !isFullscreen && "min-h-[60vh] sm:min-h-[65vh] md:min-h-[70vh]"
      )}>
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] md:w-[600px] md:h-[600px] bg-primary/5 rounded-full blur-[80px] sm:blur-[100px] md:blur-[120px]" />
        </div>

        {/* Fullscreen Controls - Show when fullscreen is active */}
        {isFullscreen && (
          <div className="absolute top-4 flex items-center gap-2 z-50">
            <button
              onClick={() => setIsPopupOpen(true)}
              className="p-2.5 rounded-xl transition-all duration-300 bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground backdrop-blur-sm"
              aria-label="Change Design"
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2.5 rounded-xl transition-all duration-300 bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground backdrop-blur-sm"
              aria-label="Exit Fullscreen"
            >
              <Minimize className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn(
            "flex flex-col items-center space-y-10 sm:space-y-12 w-full px-4 relative z-10",
            isFullscreen && "items-center justify-center py-8"
          )}
        >
          {/* Date display - Hide in fullscreen */}
          {!isFullscreen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-muted-foreground text-xs sm:text-sm md:text-base font-medium tracking-wide uppercase"
            >
              {dateStr}
            </motion.div>
          )}

          {/* Main Clock */}
          <div className={cn(
            "relative w-full flex justify-center items-center py-4",
            isFullscreen ? "min-h-[60vh]" : "min-h-[220px] sm:min-h-[280px] md:min-h-[340px]"
          )}>
            <AnimatePresence mode="wait">
              <motion.div
                key={design}
                initial={{ opacity: 0, scale: 0.9, filter: "blur(15px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 1.05, filter: "blur(15px)" }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="w-full flex justify-center"
              >
                {renderClock()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Controls Row: 12H/24H + Fullscreen + Design */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex items-center gap-2 sm:gap-3"
          >
            {showFormatToggle && (
              <TimeFormatToggle is12Hour={is12Hour} onToggle={() => setIs12Hour(!is12Hour)} />
            )}

            {/* Fullscreen button - Hide when in fullscreen */}
            {!isFullscreen && (
              <button
                onClick={toggleFullscreen}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-300 border shadow-lg bg-background/80 backdrop-blur-sm border-border/40 text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-muted"
                aria-label="Fullscreen"
              >
                <Maximize className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            )}

            {/* Settings button - opens design popup */}
            {!isFullscreen && (
              <button
                onClick={() => setIsPopupOpen(true)}
                className={cn(
                  "flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-300 border shadow-lg",
                  "bg-background/80 backdrop-blur-sm border-border/40 text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-muted"
                )}
              >
                <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Design</span>
              </button>
            )}
          </motion.div>

          {/* Decorative dots - Hide in fullscreen */}
          {!isFullscreen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 1 }}
              className="flex items-center gap-2"
            >
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary/40 animate-pulse" />
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary/60 animate-pulse delay-75" />
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary/40 animate-pulse delay-150" />
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Design Popup */}
      <DesignPopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        currentDesign={design}
        onSelect={handleDesignChange}
      />

      {!isFullscreen && (
        <div className="w-full px-4 pb-8 sm:pb-12">
          <SeoContent pageKey="home" />
        </div>
      )}
    </>
  );
}

// ===== MAIN EXPORT =====
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <HomePageContent />
    </Suspense>
  );
}