"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Settings2,
  Bell,
  BellOff,
  AlertTriangle,
  X,
  Vibrate,
  Timer,
  Clock,
  Volume2,
  Eye,
  EyeOff,
  Moon,
  Sun,
  Maximize,
  Minimize,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { useTheme } from "next-themes";
import { SeoContent } from "@/components/SeoContent";
import Loading from "@/app/loading";

// Sound System using Web Audio API
const useSoundEffects = (enabled: boolean, volume: number) => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const playSound = useCallback(
    (frequency: number, duration: number, type: OscillatorType = "sine") => {
      if (!enabled) return;
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext ||
            (window as any).webkitAudioContext)();
        }
        const ctx = audioContextRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = type;
        osc.frequency.setValueAtTime(frequency, ctx.currentTime);
        gain.gain.setValueAtTime(volume * 0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
      } catch (e) {
        // Silent fail
      }
    },
    [enabled, volume]
  );

  const playTick = useCallback(() => {
    playSound(600, 0.08);
  }, [playSound]);

  const playStart = useCallback(() => {
    if (!enabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      [600, 800, 1000].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
        gain.gain.setValueAtTime(volume * 0.15, ctx.currentTime + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.1);
        osc.start(ctx.currentTime + i * 0.1);
        osc.stop(ctx.currentTime + i * 0.1 + 0.1);
      });
    } catch (e) {
      // Silent fail
    }
  }, [enabled, volume]);

  const playLap = useCallback(() => {
    if (!enabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      [800, 1000].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
        gain.gain.setValueAtTime(volume * 0.15, ctx.currentTime + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.1);
        osc.start(ctx.currentTime + i * 0.15);
        osc.stop(ctx.currentTime + i * 0.15 + 0.1);
      });
    } catch (e) {
      // Silent fail
    }
  }, [enabled, volume]);

  const playFinish = useCallback(() => {
    if (!enabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(1000, ctx.currentTime);
      gain.gain.setValueAtTime(volume * 0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      // Silent fail
    }
  }, [enabled, volume]);

  return { playTick, playStart, playLap, playFinish };
};

// ===== MAIN PAGE CONTENT (wrapped in Suspense) =====
function StopwatchPageContent() {
  const { t, language } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Detect RTL
  const isRTL = language === "ar";

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Apply RTL/LTR to document root
  useEffect(() => {
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    if (isRTL) {
      document.documentElement.classList.add("rtl");
    } else {
      document.documentElement.classList.remove("rtl");
    }
  }, [isRTL]);

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

  // ===== STATE =====
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [laps, setLaps] = useState<{ id: number; time: number; diff: number }[]>(
    []
  );

  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(false);
  const [soundVolume, setSoundVolume] = useState(0.5);
  const [showMilliseconds, setShowMilliseconds] = useState(true);

  // Countdown
  const [countdownMode, setCountdownMode] = useState(false);
  const [countdownDuration, setCountdownDuration] = useState(5);
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [isCountdownActive, setIsCountdownActive] = useState(false);

  // Reset Confirm
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // ===== REFS =====
  const startTimeRef = useRef<number | null>(null);
  const requestRef = useRef<number | null>(null);
  const lastLapTimeRef = useRef<number>(0);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ===== SOUNDS =====
  const { playTick, playStart, playLap, playFinish } = useSoundEffects(
    soundEnabled,
    soundVolume
  );

  // ===== VIBRATION =====
  const vibrate = useCallback(
    (pattern: number | number[]) => {
      if (vibrationEnabled && navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    },
    [vibrationEnabled]
  );

  // ===== MOUNTED =====
  useEffect(() => {
    setMounted(true);
  }, []);

  // ===== COUNTDOWN LOGIC =====
  useEffect(() => {
    if (countdownMode && isCountdownActive && countdownValue !== null) {
      if (countdownValue > 0) {
        countdownIntervalRef.current = setTimeout(() => {
          setCountdownValue((prev) => (prev !== null ? prev - 1 : null));
          playTick();
          vibrate(50);
        }, 1000);
      } else if (countdownValue === 0) {
        playStart();
        vibrate([100, 100, 100]);
        setIsCountdownActive(false);
        setIsRunning(true);
        startTimeRef.current = performance.now() - time;
        setCountdownValue(null);
      }
    }
    return () => {
      if (countdownIntervalRef.current) {
        clearTimeout(countdownIntervalRef.current);
      }
    };
  }, [countdownMode, isCountdownActive, countdownValue, time, playTick, playStart, vibrate]);

  // ===== STOPWATCH LOGIC =====
  useEffect(() => {
    if (isRunning) {
      if (startTimeRef.current === null) {
        startTimeRef.current = performance.now() - time;
      }
      const animate = (now: number) => {
        setTime(now - startTimeRef.current!);
        requestRef.current = requestAnimationFrame(animate);
      };
      requestRef.current = requestAnimationFrame(animate);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      startTimeRef.current = null;
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isRunning, time]);

  // ===== HANDLERS =====
  const handleStartPause = useCallback(() => {
    if (countdownMode && !isRunning && countdownValue === null) {
      setCountdownValue(countdownDuration);
      setIsCountdownActive(true);
      playTick();
      vibrate(50);
      return;
    }

    if (countdownMode && isCountdownActive) {
      setIsCountdownActive(false);
      if (countdownIntervalRef.current) {
        clearTimeout(countdownIntervalRef.current);
      }
      playTick();
      vibrate(50);
      return;
    }

    if (countdownMode && !isRunning && countdownValue !== null && !isCountdownActive) {
      setIsCountdownActive(true);
      playTick();
      vibrate(50);
      return;
    }

    if (isRunning) {
      setIsRunning(false);
      if (countdownIntervalRef.current) {
        clearTimeout(countdownIntervalRef.current);
      }
      playTick();
      vibrate(50);
    } else {
      playStart();
      vibrate(50);
      setIsRunning(true);
    }
  }, [countdownMode, isRunning, countdownValue, isCountdownActive, countdownDuration, playTick, playStart, vibrate]);

  const requestReset = useCallback(() => {
    if (time === 0 && countdownValue === null) return;
    setIsRunning(false);
    setIsCountdownActive(false);
    if (countdownIntervalRef.current) {
      clearTimeout(countdownIntervalRef.current);
    }
    setShowResetConfirm(true);
  }, [time, countdownValue]);

  const confirmReset = useCallback(() => {
    playTick();
    vibrate(50);
    setTime(0);
    setLaps([]);
    startTimeRef.current = null;
    lastLapTimeRef.current = 0;
    if (countdownMode) {
      setCountdownValue(countdownDuration);
      setIsCountdownActive(false);
    } else {
      setCountdownValue(null);
      setIsCountdownActive(false);
    }
    if (countdownIntervalRef.current) {
      clearTimeout(countdownIntervalRef.current);
    }
    setShowResetConfirm(false);
  }, [playTick, vibrate, countdownMode, countdownDuration]);

  const handleLap = useCallback(() => {
    if (!isRunning) return;
    const diff = time - lastLapTimeRef.current;
    lastLapTimeRef.current = time;
    setLaps((prev) => [{ id: Date.now(), time, diff }, ...prev]);
    playLap();
    vibrate(100);
  }, [isRunning, time, playLap, vibrate]);

  const formatTime = useCallback((ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    const ms10 = Math.floor((ms % 1000) / 10);
    return {
      m: m.toString().padStart(2, "0"),
      s: s.toString().padStart(2, "0"),
      ms: ms10.toString().padStart(2, "0"),
    };
  }, []);

  const formatCountdown = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return {
      m: m.toString().padStart(2, "0"),
      s: s.toString().padStart(2, "0"),
    };
  }, []);

  // ===== DISPLAY VALUES =====
  const displayTime = useMemo(() => {
    if (countdownMode && countdownValue !== null) {
      return formatCountdown(countdownValue);
    }
    return formatTime(time);
  }, [countdownMode, countdownValue, time, formatCountdown, formatTime]);

  const { m, s, ms } = useMemo(() => {
    if (countdownMode && countdownValue !== null) {
      return { m: displayTime.m, s: displayTime.s, ms: "00" };
    }
    return formatTime(time);
  }, [countdownMode, countdownValue, displayTime, time, formatTime]);

  // ===== STATS =====
  const stats = useMemo(() => {
    if (laps.length === 0) return null;
    const diffs = laps.map((l) => l.diff);
    const best = Math.min(...diffs);
    const worst = Math.max(...diffs);
    const avg = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    return { best, worst, avg };
  }, [laps]);

  // ===== SETTINGS INTERVALS =====
  const countdownOptions = [3, 5, 10, 30, 60];

  const isDark = mounted && theme === "dark";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <div 
      dir={isRTL ? "rtl" : "ltr"}
      className={cn(
        "min-h-screen flex flex-col w-full max-w-6xl mx-auto px-4 sm:px-6 bg-background",
        isFullscreen && "h-screen items-center justify-center max-w-full px-8"
      )}
    >
      <div className={cn(
        "flex-1 flex flex-col w-full",
        isFullscreen ? "items-center justify-center py-8" : "items-center text-center space-y-8 sm:space-y-12 pb-12"
      )}>
        {/* ===== HEADER - Hide in fullscreen ===== */}
        {!isFullscreen && (
          <div className="flex justify-between items-start w-full max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "space-y-3 sm:space-y-4 flex-1",
                isRTL ? "text-right" : "text-left"
              )}
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold tracking-tight text-foreground">
                {t.stopwatch?.title || "Stopwatch"}
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-xl leading-relaxed">
                {t.stopwatch?.subtitle || "Precision timing for productivity and focus."}
              </p>
            </motion.div>

            <div className={cn(
              "flex items-center gap-2 shrink-0",
              isRTL ? "mr-4" : "ml-4"
            )}>
              <button
                onClick={toggleFullscreen}
                className="p-2.5 sm:p-3 rounded-xl transition-all duration-300 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                aria-label={"Fullscreen"}
              >
                <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="p-2.5 sm:p-3 rounded-xl transition-all duration-300 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                aria-label={t.stopwatch?.settings || "Settings"}
              >
                <Settings2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        )}

        {/* ===== FULLSCREEN CONTROLS ===== */}
        {isFullscreen && (
          <div className={cn(
            "absolute top-4 flex items-center gap-2",
            isRTL ? "left-4" : "right-4"
          )}>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2.5 rounded-xl transition-all duration-300 bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground backdrop-blur-sm"
              aria-label={t.stopwatch?.settings || "Settings"}
            >
              <Settings2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2.5 rounded-xl transition-all duration-300 bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground backdrop-blur-sm"
              aria-label={"Exit Fullscreen"}
            >
              <Minimize className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        )}

        {/* ===== TIMER DISPLAY ===== */}
        <div className="flex flex-col items-center justify-center w-full max-w-2xl">
          <div className="relative w-full">
            <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full" />
            <div
              className={cn(
                "relative flex items-baseline justify-center space-x-1 sm:space-x-2 bg-card border border-border px-4 sm:px-8 py-6 sm:py-8 rounded-[2rem] sm:rounded-[3rem] shadow-2xl backdrop-blur-sm w-full max-w-[320px] sm:max-w-[400px] md:max-w-[500px] mx-auto",
                countdownMode &&
                  countdownValue !== null &&
                  countdownValue <= 3 &&
                  "border-destructive/50 bg-destructive/5 animate-pulse",
                isFullscreen && "max-w-[500px] sm:max-w-[600px] md:max-w-[700px] py-8 sm:py-12"
              )}
              dir="ltr"
            >
              <span className={cn(
                "font-mono tabular-nums font-light tracking-tighter text-foreground",
                isFullscreen ? "text-6xl sm:text-8xl md:text-9xl" : "text-5xl sm:text-7xl md:text-8xl"
              )}>
                {m}
              </span>
              <span className={cn(
                "font-mono text-muted-foreground/40",
                isFullscreen ? "text-4xl sm:text-6xl md:text-7xl" : "text-3xl sm:text-5xl md:text-6xl"
              )}>
                :
              </span>
              <span className={cn(
                "font-mono tabular-nums font-light tracking-tighter text-foreground",
                isFullscreen ? "text-6xl sm:text-8xl md:text-9xl" : "text-5xl sm:text-7xl md:text-8xl"
              )}>
                {s}
              </span>
              {!countdownMode && showMilliseconds && (
                <>
                  <span className={cn(
                    "font-mono text-muted-foreground/40",
                    isFullscreen ? "text-4xl sm:text-6xl md:text-7xl" : "text-3xl sm:text-5xl md:text-6xl"
                  )}>
                    .
                  </span>
                  <span className={cn(
                    "font-mono tabular-nums font-light tracking-tighter text-muted-foreground",
                    isFullscreen ? "text-4xl sm:text-6xl md:text-7xl" : "text-3xl sm:text-5xl md:text-6xl"
                  )}>
                    {ms}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* ===== CONTROLS ===== */}
          <div className={cn(
            "flex items-center gap-4 sm:gap-6 mt-8 sm:mt-12",
            isFullscreen && "mt-12 sm:mt-16"
          )}>
            <button
              onClick={requestReset}
              disabled={
                time === 0 &&
                (countdownValue === null || countdownValue === countdownDuration)
              }
              className={cn(
                "rounded-full bg-muted border border-border flex items-center justify-center text-foreground hover:bg-muted/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                isFullscreen ? "w-16 h-16 sm:w-20 sm:h-20" : "w-14 h-14 sm:w-16 sm:h-16"
              )}
              aria-label={t.stopwatch?.reset || "Reset"}
            >
              <RotateCcw className={cn(
                "w-5 h-5 sm:w-6 sm:h-6",
                isFullscreen && "w-6 h-6 sm:w-8 sm:h-8"
              )} />
            </button>

            <button
              onClick={handleStartPause}
              className={cn(
                "rounded-full flex items-center justify-center text-primary-foreground transition-all shadow-lg",
                isRunning || isCountdownActive
                  ? "bg-muted border border-border hover:bg-muted/80 text-primary"
                  : "bg-primary hover:bg-primary/90",
                isFullscreen ? "w-20 h-20 sm:w-24 sm:h-24" : "w-16 h-16 sm:w-20 sm:h-20"
              )}
            >
              {isRunning || isCountdownActive ? (
                <Pause className={cn(
                  "fill-current",
                  isFullscreen ? "w-8 h-8 sm:w-10 sm:h-10" : "w-6 h-6 sm:w-8 sm:h-8"
                )} />
              ) : (
                <Play className={cn(
                  "fill-current ms-0.5 sm:ms-1",
                  isFullscreen ? "w-8 h-8 sm:w-10 sm:h-10" : "w-6 h-6 sm:w-8 sm:h-8"
                )} />
              )}
            </button>

            <button
              onClick={handleLap}
              disabled={!isRunning}
              className={cn(
                "rounded-full bg-muted border border-border flex items-center justify-center text-foreground hover:bg-muted/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                isFullscreen ? "w-16 h-16 sm:w-20 sm:h-20" : "w-14 h-14 sm:w-16 sm:h-16"
              )}
              aria-label={t.stopwatch?.lap || "Lap"}
            >
              <Square className={cn(
                "w-5 h-5 sm:w-6 sm:h-6",
                isFullscreen && "w-6 h-6 sm:w-8 sm:h-8"
              )} />
            </button>
          </div>
        </div>

        {/* ===== RESET CONFIRMATION ===== */}
        <AnimatePresence>
          {showResetConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.95, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 10 }}
                className="bg-background border border-border rounded-[2rem] p-6 sm:p-8 max-w-sm w-full shadow-2xl flex flex-col items-center max-h-[90dvh] overflow-y-auto"
              >
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
                <h3 className="text-xl font-display font-bold text-foreground mb-2">
                  {t.stopwatch?.reset || "Reset"}
                </h3>
                <p className="text-muted-foreground mb-8 text-center">
                  {t.stopwatch?.resetConfirm || "Are you sure you want to reset the stopwatch?"}
                </p>

                <div className="flex gap-4 w-full">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1 py-3 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-medium transition-colors"
                  >
                    {t.common?.cancel || "Cancel"}
                  </button>
                  <button
                    onClick={confirmReset}
                    className="flex-1 py-3 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground font-medium transition-colors"
                  >
                    {t.stopwatch?.reset || "Reset"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ===== LAPS DISPLAY - Hide in fullscreen ===== */}
        {!isFullscreen && laps.length > 0 && (
          <div className="w-full max-w-2xl mt-8 sm:mt-12 space-y-6">
            {stats && laps.length > 1 && (
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-muted border border-border rounded-2xl p-3 sm:p-4 flex flex-col items-center">
                  <span className="text-muted-foreground text-[10px] sm:text-xs font-medium uppercase tracking-widest mb-1">
                    {t.stopwatch?.bestLap || "Best Lap"}
                  </span>
                  <span className="text-primary font-mono text-base sm:text-xl">
                    {formatTime(stats.best).m}:{formatTime(stats.best).s}.
                    {formatTime(stats.best).ms}
                  </span>
                </div>
                <div className="bg-muted border border-border rounded-2xl p-3 sm:p-4 flex flex-col items-center">
                  <span className="text-muted-foreground text-[10px] sm:text-xs font-medium uppercase tracking-widest mb-1">
                    {t.stopwatch?.averageLap || "Average Lap"}
                  </span>
                  <span className="text-foreground/80 font-mono text-base sm:text-xl">
                    {formatTime(stats.avg).m}:{formatTime(stats.avg).s}.
                    {formatTime(stats.avg).ms}
                  </span>
                </div>
              </div>
            )}

            <div>
              <h3 className={cn(
                "font-display font-medium text-muted-foreground mb-3 sm:mb-4 uppercase tracking-widest text-xs sm:text-sm",
                isRTL ? "text-right" : "text-left"
              )}>
                {t.stopwatch?.laps || "Laps"}
              </h3>
              <div className="flex flex-col space-y-2">
                <AnimatePresence>
                  {laps.map((lap, idx) => {
                    const isBest =
                      stats && lap.diff === stats.best && laps.length > 1;
                    const isWorst =
                      stats && lap.diff === stats.worst && laps.length > 1;

                    const lapTime = formatTime(lap.time);
                    const diffTime = formatTime(lap.diff);

                    return (
                      <motion.div
                        key={lap.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={cn(
                          "flex justify-between items-center py-3 sm:py-4 px-4 sm:px-5 rounded-2xl border transition-colors",
                          isBest
                            ? "bg-primary/10 border-primary/20"
                            : isWorst
                              ? "bg-destructive/10 border-destructive/20"
                              : "bg-card border-border"
                        )}
                      >
                        <div className={cn(
                          "flex flex-col gap-0.5 sm:gap-1",
                          isRTL ? "text-right" : "text-left"
                        )}>
                          <span
                            className={cn(
                              "font-medium text-xs sm:text-sm",
                              isBest
                                ? "text-primary"
                                : isWorst
                                  ? "text-destructive"
                                  : "text-muted-foreground"
                            )}
                          >
                            {t.stopwatch?.lap || "Lap"} {laps.length - idx}
                          </span>
                          <span className="text-foreground font-mono text-base sm:text-xl">
                            {diffTime.m}:{diffTime.s}.
                            <span className="text-muted-foreground">
                              {diffTime.ms}
                            </span>
                          </span>
                        </div>
                        <span className="text-muted-foreground font-mono text-xs sm:text-sm">
                          {lapTime.m}:{lapTime.s}.{lapTime.ms}
                        </span>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}

        {/* ===== SEO CONTENT - Hide in fullscreen ===== */}
        {!isFullscreen && (
          <div className="w-full pb-8 sm:pb-12 mt-8 sm:mt-12">
            <SeoContent pageKey="stopwatch" />
          </div>
        )}
      </div>

      {/* ===== SETTINGS MODAL ===== */}
      <AnimatePresence>
        {showSettings && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-xl"
            />

            <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh] pointer-events-auto"
                dir={isRTL ? "rtl" : "ltr"}
              >
                {/* Settings Header */}
                <div className={cn(
                  "flex items-center justify-between p-4 sm:p-5 border-b border-border shrink-0",
                  isRTL ? "flex-row-reverse" : "flex-row"
                )}>
                  <div className={cn(
                    "flex items-center gap-3",
                    isRTL ? "flex-row-reverse" : "flex-row"
                  )}>
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Settings2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    </div>
                    <h2 className="text-base sm:text-lg font-semibold text-foreground">
                      {t.stopwatch?.settings || "Settings"}
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="p-1.5 sm:p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>

                {/* Settings Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
                  {/* ===== SOUND ===== */}
                  <div className="space-y-3">
                    <h3 className={cn(
                      "text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2",
                      isRTL ? "flex-row-reverse" : "flex-row"
                    )}>
                      <Volume2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      {t.stopwatch?.soundOptions || "Sound Options"}
                    </h3>

                    <label className={cn(
                      "flex items-center justify-between cursor-pointer p-3 rounded-xl bg-muted hover:bg-muted/80 transition-colors",
                      isRTL ? "flex-row-reverse" : "flex-row"
                    )}>
                      <div className={cn(
                        "flex items-center gap-3",
                        isRTL ? "flex-row-reverse" : "flex-row"
                      )}>
                        {soundEnabled ? (
                          <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                        ) : (
                          <BellOff className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                        )}
                        <span className="text-sm font-medium text-foreground/80">
                          {soundEnabled ? (t.stopwatch?.enableSound || "Sound On") : (t.stopwatch?.disableSound || "Sound Off")}
                        </span>
                      </div>
                      <div
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className={cn(
                          "w-11 h-6 rounded-full transition-colors relative cursor-pointer",
                          soundEnabled ? "bg-primary" : "bg-muted-foreground/50"
                        )}
                      >
                        <div
                          className={cn(
                            "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                            soundEnabled 
                              ? (isRTL ? "left-1" : "left-6") 
                              : "left-1"
                          )}
                        />
                      </div>
                    </label>

                    <div className="space-y-1.5 px-1">
                      <div className={cn(
                        "flex items-center justify-between",
                        isRTL ? "flex-row-reverse" : "flex-row"
                      )}>
                        <span className="text-xs text-muted-foreground">
                          {t.stopwatch?.volume || "Volume"}
                        </span>
                        <span className="text-xs font-mono text-foreground">
                          {Math.round(soundVolume * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={soundVolume}
                        onChange={(e) =>
                          setSoundVolume(parseFloat(e.target.value))
                        }
                        disabled={!soundEnabled}
                        className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* ===== VIBRATION ===== */}
                  <div className="space-y-3 pt-2 border-t border-border/50">
                    <h3 className={cn(
                      "text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2",
                      isRTL ? "flex-row-reverse" : "flex-row"
                    )}>
                      <Vibrate className="w-3 h-3 sm:w-4 sm:h-4" />
                      {t.stopwatch?.vibration || "Vibration"}
                    </h3>
                    <label className={cn(
                      "flex items-center justify-between cursor-pointer p-3 rounded-xl bg-muted hover:bg-muted/80 transition-colors",
                      isRTL ? "flex-row-reverse" : "flex-row"
                    )}>
                      <div className={cn(
                        "flex items-center gap-3",
                        isRTL ? "flex-row-reverse" : "flex-row"
                      )}>
                        <Vibrate
                          className={cn(
                            "w-4 h-4 sm:w-5 sm:h-5",
                            vibrationEnabled
                              ? "text-primary"
                              : "text-muted-foreground"
                          )}
                        />
                        <span className="text-sm font-medium text-foreground/80">
                          {vibrationEnabled ? (t.common?.on || "On") : (t.common?.off || "Off")}
                        </span>
                      </div>
                      <div
                        onClick={() => {
                          setVibrationEnabled(!vibrationEnabled);
                          if (!vibrationEnabled && navigator.vibrate) {
                            navigator.vibrate(100);
                          }
                        }}
                        className={cn(
                          "w-11 h-6 rounded-full transition-colors relative cursor-pointer",
                          vibrationEnabled ? "bg-primary" : "bg-muted-foreground/50"
                        )}
                      >
                        <div
                          className={cn(
                            "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                            vibrationEnabled 
                              ? (isRTL ? "left-1" : "left-6") 
                              : "left-1"
                          )}
                        />
                      </div>
                    </label>
                  </div>

                  {/* ===== COUNTDOWN ===== */}
                  <div className="space-y-3 pt-2 border-t border-border/50">
                    <h3 className={cn(
                      "text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2",
                      isRTL ? "flex-row-reverse" : "flex-row"
                    )}>
                      <Timer className="w-3 h-3 sm:w-4 sm:h-4" />
                      {t.stopwatch?.countdown || "Countdown"}
                    </h3>
                    <label className={cn(
                      "flex items-center justify-between cursor-pointer p-3 rounded-xl bg-muted hover:bg-muted/80 transition-colors",
                      isRTL ? "flex-row-reverse" : "flex-row"
                    )}>
                      <div className={cn(
                        "flex items-center gap-3",
                        isRTL ? "flex-row-reverse" : "flex-row"
                      )}>
                        <Timer
                          className={cn(
                            "w-4 h-4 sm:w-5 sm:h-5",
                            countdownMode ? "text-primary" : "text-muted-foreground"
                          )}
                        />
                        <span className="text-sm font-medium text-foreground/80">
                          {countdownMode ? (t.common?.on || "On") : (t.common?.off || "Off")}
                        </span>
                      </div>
                      <div
                        onClick={() => {
                          setCountdownMode(!countdownMode);
                          if (!countdownMode) {
                            setCountdownValue(countdownDuration);
                          } else {
                            setCountdownValue(null);
                            setIsCountdownActive(false);
                            setTime(0);
                            setIsRunning(false);
                          }
                        }}
                        className={cn(
                          "w-11 h-6 rounded-full transition-colors relative cursor-pointer",
                          countdownMode ? "bg-primary" : "bg-muted-foreground/50"
                        )}
                      >
                        <div
                          className={cn(
                            "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                            countdownMode 
                              ? (isRTL ? "left-1" : "left-6") 
                              : "left-1"
                          )}
                        />
                      </div>
                    </label>

                    {countdownMode && (
                      <div className="space-y-2">
                        <p className={cn(
                          "text-xs text-muted-foreground",
                          isRTL ? "text-right" : "text-left"
                        )}>
                          {t.stopwatch?.countdownDescription || "Counts down then auto-starts stopwatch"}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {countdownOptions.map((option) => (
                            <button
                              key={option}
                              onClick={() => {
                                setCountdownDuration(option);
                                setCountdownValue(option);
                              }}
                              className={cn(
                                "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                                countdownDuration === option
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-foreground hover:bg-muted/80"
                              )}
                            >
                              {option}s
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ===== DISPLAY ===== */}
                  <div className="space-y-3 pt-2 border-t border-border/50">
                    <h3 className={cn(
                      "text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2",
                      isRTL ? "flex-row-reverse" : "flex-row"
                    )}>
                      <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                      {t.stopwatch?.display || "Display"}
                    </h3>

                    <label className={cn(
                      "flex items-center justify-between cursor-pointer p-3 rounded-xl bg-muted hover:bg-muted/80 transition-colors",
                      isRTL ? "flex-row-reverse" : "flex-row"
                    )}>
                      <div className={cn(
                        "flex items-center gap-3",
                        isRTL ? "flex-row-reverse" : "flex-row"
                      )}>
                        <Clock
                          className={cn(
                            "w-4 h-4 sm:w-5 sm:h-5",
                            showMilliseconds ? "text-primary" : "text-muted-foreground"
                          )}
                        />
                        <span className="text-sm font-medium text-foreground/80">
                          {t.stopwatch?.showMilliseconds || "Show Milliseconds"}
                        </span>
                      </div>
                      <div
                        onClick={() => setShowMilliseconds(!showMilliseconds)}
                        className={cn(
                          "w-11 h-6 rounded-full transition-colors relative cursor-pointer",
                          showMilliseconds ? "bg-primary" : "bg-muted-foreground/50"
                        )}
                      >
                        <div
                          className={cn(
                            "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                            showMilliseconds 
                              ? (isRTL ? "left-1" : "left-6") 
                              : "left-1"
                          )}
                        />
                      </div>
                    </label>

                    {/* Theme Toggle */}
                    <label className={cn(
                      "flex items-center justify-between cursor-pointer p-3 rounded-xl bg-muted hover:bg-muted/80 transition-colors",
                      isRTL ? "flex-row-reverse" : "flex-row"
                    )}>
                      <div className={cn(
                        "flex items-center gap-3",
                        isRTL ? "flex-row-reverse" : "flex-row"
                      )}>
                        {isDark ? (
                          <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                        ) : (
                          <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                        )}
                        <span className="text-sm font-medium text-foreground/80">
                          {isDark ? (t.settings?.dark || "Dark Mode") : (t.settings?.light || "Light Mode")}
                        </span>
                      </div>
                      <div
                        onClick={toggleTheme}
                        className={cn(
                          "w-11 h-6 rounded-full transition-colors relative cursor-pointer",
                          isDark ? "bg-primary" : "bg-muted-foreground/50"
                        )}
                      >
                        <div
                          className={cn(
                            "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                            isDark 
                              ? (isRTL ? "left-1" : "left-6") 
                              : "left-1"
                          )}
                        />
                      </div>
                    </label>
                  </div>
                </div>

                {/* Settings Footer */}
                <div className={cn(
                  "flex items-center justify-end gap-3 p-4 sm:p-5 border-t border-border bg-card",
                  isRTL ? "flex-row-reverse" : "flex-row"
                )}>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="px-4 sm:px-6 py-2 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all text-sm sm:text-base"
                  >
                    {t.common?.save || "Done"}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ===== MAIN EXPORT WITH SUSPENSE =====
export default function StopwatchPage() {
  return (
    <Suspense fallback={<Loading />}>
      <StopwatchPageContent />
    </Suspense>
  );
}