"use client";

import React, { useState, useEffect, useRef, use, useCallback, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Settings2, Volume2, X, Bell, BellOff, Repeat, Maximize, Minimize } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import { TimeSelector } from "@/components/TimeSelector";
import { SeoContent } from "@/components/SeoContent";
import Loading from "@/app/loading";

// Sound System using Web Audio API
const useSoundEffects = (enabled: boolean, volume: number) => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const playAlarm = useCallback(() => {
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
      osc.type = "triangle";
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(volume * 0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {}
  }, [enabled, volume]);

  return { playAlarm };
};

// ===== MAIN PAGE CONTENT =====
function TimerPageContent({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug?.[0] || "";
  const router = useRouter();
  const { t, language } = useTranslation();

  // Detect RTL
  const isRTL = language === "ar";

  // Apply RTL/LTR to document root
  useEffect(() => {
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    
    if (isRTL) {
      document.documentElement.classList.add("rtl");
    } else {
      document.documentElement.classList.remove("rtl");
    }
    
    // Force re-render
    document.documentElement.style.display = 'none';
    document.documentElement.offsetHeight;
    document.documentElement.style.display = '';
  }, [isRTL]);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detect dark mode
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const check = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

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

  const match = slug.match(/^(\d+)-(minute|hour|second)-timer$/);
  let seoKey = 'timer';
  if (match && match[2] === 'minute' && [5, 10, 15, 20, 25, 30, 45, 60].includes(parseInt(match[1]))) {
    seoKey = `timer_${match[1]}`;
  }

  const parseSlug = (s: string) => {
    if (!s) return 25 * 60;
    const match = s.match(/^(\d+)-(minute|hour|second)-timer$/);
    if (match) {
      const val = parseInt(match[1]);
      if (match[2] === "minute") return val * 60;
      if (match[2] === "hour") return val * 3600;
      if (match[2] === "second") return val;
    }
    return 25 * 60;
  };

  const initialTime = parseSlug(slug);

  // ===== STATE =====
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [inputTime, setInputTime] = useState(initialTime);
  const [isStarting, setIsStarting] = useState(false);

  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [volume, setVolume] = useState(1);
  const [repeat, setRepeat] = useState(false);
  const [timerName, setTimerName] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [editHours, setEditHours] = useState('0');
  const [editMinutes, setEditMinutes] = useState('25');
  const [editSeconds, setEditSeconds] = useState('0');

  // ===== REFS =====
  const endTimeRef = useRef<number | null>(null);
  const requestRef = useRef<number | null>(null);
  const alarmIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ===== SOUNDS =====
  const { playAlarm } = useSoundEffects(soundEnabled, volume);

  useEffect(() => {
    const t = parseSlug(slug);
    setInputTime(t);
    setTimeLeft(t);
    setIsRunning(false);
    endTimeRef.current = null;
    stopAlarm();
  }, [slug]);

  useEffect(() => {
    if (!isRunning && timeLeft === inputTime) {
      const h = Math.floor(inputTime / 3600);
      const m = Math.floor((inputTime % 3600) / 60);
      const s = inputTime % 60;
      setEditHours(h.toString());
      setEditMinutes(m.toString());
      setEditSeconds(s.toString());
    }
  }, [inputTime, isRunning, timeLeft]);

  const handleApplyEdit = () => {
    const h = parseInt(editHours) || 0;
    const m = parseInt(editMinutes) || 0;
    const s = parseInt(editSeconds) || 0;
    const total = h * 3600 + m * 60 + s;
    const finalTotal = total > 0 ? total : 60;
    setInputTime(finalTotal);
    setTimeLeft(finalTotal);
    setIsEditing(false);
  };

  const startAlarm = () => {
    playAlarm();
    if (repeat) {
      alarmIntervalRef.current = setInterval(playAlarm, 1000);
    }
  };

  const stopAlarm = () => {
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
  };

  useEffect(() => {
    if (isRunning) {
      if (endTimeRef.current === null) {
        endTimeRef.current = performance.now() + timeLeft * 1000;
      }
      const animate = (now: number) => {
        const remaining = Math.max(
          0,
          Math.ceil((endTimeRef.current! - now) / 1000),
        );
        setTimeLeft(remaining);

        if (remaining > 0) {
          requestRef.current = requestAnimationFrame(animate);
        } else {
          setIsRunning(false);
          endTimeRef.current = null;
          startAlarm();
        }
      };
      requestRef.current = requestAnimationFrame(animate);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      endTimeRef.current = null;
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isRunning, timeLeft]);

  const handleStartPause = () => {
    if (isEditing) {
      handleApplyEdit();
      setIsStarting(true);
      setTimeout(() => {
        setIsRunning(true);
        setIsStarting(false);
      }, 1500);
      return;
    }
    if (timeLeft === 0) {
      stopAlarm();
      setTimeLeft(inputTime);
      setIsStarting(true);
      setTimeout(() => {
        setIsRunning(true);
        setIsStarting(false);
      }, 1500);
      return;
    }
    if (!isRunning) {
      setIsStarting(true);
      setTimeout(() => {
        setIsRunning(true);
        setIsStarting(false);
      }, 1500);
    } else {
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    stopAlarm();
    setIsRunning(false);
    setIsStarting(false);
    setTimeLeft(inputTime);
    setIsEditing(false);
    endTimeRef.current = null;
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {
      return {
        h: h.toString(),
        m: m.toString().padStart(2, "0"),
        s: s.toString().padStart(2, "0"),
      };
    }
    return {
      m: m.toString().padStart(2, "0"),
      s: s.toString().padStart(2, "0"),
    };
  };

  const timeFormatted = formatTime(timeLeft);
  const progress = 1 - timeLeft / inputTime;
  const isFinished = timeLeft === 0 && !isRunning;

  const closeSettings = () => {
    setShowSettings(false);
  };

  // ===== INTERNAL LINKS =====
  const internalLinks = [
    { label: t.timer?.preset5Min || "5 Minute Timer", href: "/timer/5-minute-timer" },
    { label: t.timer?.preset10Min || "10 Minute Timer", href: "/timer/10-minute-timer" },
    { label: t.timer?.preset15Min || "15 Minute Timer", href: "/timer/15-minute-timer" },
    { label: t.timer?.preset25Min || "25 Minute Timer", href: "/timer/25-minute-timer" },
    { label: t.timer?.preset30Min || "30 Minute Timer", href: "/timer/30-minute-timer" },
    { label: t.timer?.preset60Min || "60 Minute Timer", href: "/timer/60-minute-timer" },
  ];

  // ===== CIRCLE CONSTANTS =====
  const CIRCUMFERENCE = 2 * Math.PI * 80;
  const circleOffset = CIRCUMFERENCE * (1 - progress);

  // ===== THEME COLORS =====
  const ringColor = "hsl(var(--primary))";
  const dotGlow = "hsla(var(--primary), 0.4)";

  // ===== DOT POSITION =====
  const angleRad = (progress * 360 - 90) * (Math.PI / 180);
  const dotLeft = ((90 + 80 * Math.cos(angleRad)) / 180) * 100;
  const dotTop = ((90 + 80 * Math.sin(angleRad)) / 180) * 100;

  return (
    <div 
      ref={containerRef}
      className={cn(
        "min-h-screen flex flex-col w-full max-w-6xl mx-auto px-4 sm:px-6 bg-background",
        isFullscreen && "h-screen items-center justify-center max-w-full px-8"
      )}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className={cn(
        "flex-1 flex flex-col w-full",
        isFullscreen ? "items-center justify-center py-8" : "items-center text-center space-y-8 sm:space-y-12 pb-12"
      )}>
        {/* ===== HEADER - Hide in fullscreen ===== */}
        {!isFullscreen && (
          <div className="flex justify-between items-start w-full max-w-2xl pt-8 sm:pt-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "space-y-3 sm:space-y-4 flex-1",
                isRTL ? "text-right" : "text-left"
              )}
            >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold tracking-tight text-foreground">
              {seoKey === 'timer' 
                ? t.timer?.title || "Online Timer"
                : (t as any)[`metadata_${seoKey}`]?.title || t.timer?.title || "Online Timer"}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-xl leading-relaxed">
              {seoKey === 'timer' 
                ? t.timer?.subtitle || "Countdown tool for pomodoro sessions and timeboxing."
                : (t as any)[`metadata_${seoKey}`]?.description || t.timer?.subtitle || "Countdown tool for pomodoro sessions and timeboxing."}
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
                aria-label={t.common?.settings || "Settings"}
              >
                <Settings2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        )}

        {/* ===== FULLSCREEN CONTROLS - Only in fullscreen ===== */}
        {isFullscreen && (
          <div className={cn(
            "absolute top-4 flex items-center gap-2",
            isRTL ? "left-4" : "right-4"
          )}>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2.5 rounded-xl transition-all duration-300 bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground backdrop-blur-sm"
              aria-label={t.common?.settings || "Settings"}
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

        {/* ===== TIMER NAME ===== */}
        {timerName && !isFullscreen && (
          <h2 className={cn(
            "text-xl sm:text-2xl font-display font-medium text-foreground/90 truncate max-w-[80%] w-full",
            isRTL ? "text-right" : "text-left"
          )}>
            {timerName}
          </h2>
        )}

        {/* ===== TIMER DISPLAY - CIRCLE ===== */}
        <div
          className={cn(
            "relative group cursor-pointer w-56 h-56 sm:w-72 sm:h-72 md:w-80 md:h-80 flex items-center justify-center",
            isFullscreen && "w-72 h-72 sm:w-96 sm:h-96 md:w-[32rem] md:h-[32rem]"
          )}
          onClick={handleStartPause}
        >
          <AnimatePresence>
            {isStarting && (
              <>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: [0, 0.4, 0], scale: [0.8, 1.2, 1.4] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="absolute inset-0 rounded-full border-4"
                  style={{ borderColor: ringColor }}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: [0, 0.3, 0], scale: [0.8, 1.3, 1.5] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
                  className="absolute inset-0 rounded-full border-4"
                  style={{ borderColor: ringColor }}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: [0, 0.2, 0], scale: [0.8, 1.4, 1.6] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.5, delay: 0.4, ease: "easeOut" }}
                  className="absolute inset-0 rounded-full border-4"
                  style={{ borderColor: ringColor }}
                />
              </>
            )}
          </AnimatePresence>

          <svg
            className="absolute inset-0 w-full h-full -rotate-90"
            viewBox="0 0 180 180"
            style={{ overflow: "visible" }}
          >
            <circle
              cx="90"
              cy="90"
              r="80"
              fill="none"
              strokeWidth="3"
              className="stroke-muted"
            />
            <circle
              cx="90"
              cy="90"
              r="80"
              fill="none"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={circleOffset}
              className="stroke-primary transition-all duration-300"
              style={{
                filter: `drop-shadow(0 0 4px ${dotGlow})`,
              }}
            />
          </svg>

          <div
            className="absolute w-4 h-4 rounded-full pointer-events-none bg-primary"
            style={{
              left: `${dotLeft}%`,
              top: `${dotTop}%`,
              marginLeft: "-8px",
              marginTop: "-8px",
              boxShadow: `0 0 12px ${dotGlow}, 0 0 20px ${dotGlow}`,
              transition: "left 0.3s ease-out, top 0.3s ease-out",
            }}
          >
            <div
              className="absolute inset-0.5 rounded-full"
              style={{
                background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), transparent 70%)`,
              }}
            />
          </div>

          <div
            className={cn(
              "relative flex flex-col items-center justify-center z-10",
              isFinished && "animate-pulse",
              isStarting && "scale-90 transition-transform duration-500"
            )}
            dir="ltr"
          >
            <span
              className={cn(
                "text-5xl sm:text-6xl md:text-7xl font-mono tabular-nums font-semibold tracking-[3px] transition-colors duration-300",
                isFullscreen && "text-6xl sm:text-7xl md:text-8xl",
                isFinished ? "text-destructive" : "text-foreground"
              )}
            >
              {"h" in timeFormatted && (
                <>
                  <span>{timeFormatted.h}</span>
                  <span className="text-3xl sm:text-4xl text-muted-foreground/40 mx-0.5 sm:mx-1">:</span>
                </>
              )}
              <span>{timeFormatted.m}</span>
              <span className="text-3xl sm:text-4xl text-muted-foreground/40 mx-0.5 sm:mx-1">:</span>
              <span>{timeFormatted.s}</span>
            </span>

            {isStarting && (
              <motion.span
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-2 text-xs font-semibold tracking-widest uppercase text-primary"
              >
                {t.timer?.starting || "Starting..."}
              </motion.span>
            )}
          </div>
        </div>

        {/* ===== CONTROLS ===== */}
        <div className="flex items-center gap-4 sm:gap-6">
          <button
            onClick={handleReset}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-muted border border-border flex items-center justify-center text-foreground hover:bg-muted/80 hover:scale-105 active:scale-95 transition-all duration-300"
            aria-label={t.timer?.reset || "Reset"}
          >
            <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <button
            onClick={handleStartPause}
            className={cn(
              "w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:scale-105 active:scale-95",
              isRunning
                ? "bg-muted border border-border hover:bg-muted/80 text-foreground"
                : isFinished
                  ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-destructive/20"
                  : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/30",
              isFullscreen && "w-20 h-20 sm:w-24 sm:h-24"
            )}
          >
            {isRunning ? (
              <Pause className={cn(
                "w-6 h-6 sm:w-8 sm:h-8 fill-current",
                isFullscreen && "w-8 h-8 sm:w-10 sm:h-10"
              )} />
            ) : (
              <Play className={cn(
                "w-6 h-6 sm:w-8 sm:h-8 fill-current ms-0.5 sm:ms-1",
                isFullscreen && "w-8 h-8 sm:w-10 sm:h-10"
              )} />
            )}
          </button>

          {!isRunning && !isFinished && !isFullscreen && (
            <button
              onClick={() => setIsEditing(true)}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-muted border border-border flex items-center justify-center text-foreground hover:bg-muted/80 hover:scale-105 active:scale-95 transition-all duration-300"
              aria-label={t.common?.edit || "Edit"}
            >
              <Settings2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}
        </div>

        {/* ===== INTERNAL LINKS - Hide in fullscreen ===== */}
        {!isFullscreen && (
          <div className="w-full max-w-2xl pt-4">
            <div className="flex flex-wrap justify-center gap-2">
              {internalLinks.map((link) => (
                <a
                  key={link.href}
                  href={language === 'en' ? link.href : `/${language}${link.href}`}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all duration-300"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ===== SEO CONTENT - Hide in fullscreen ===== */}
        {!isFullscreen && (
          <div className="w-full max-w-3xl mt-8">
            <SeoContent pageKey={seoKey} />
          </div>
        )}
      </div>

      {/* ===== EDIT TIME MODAL ===== */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditing(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-background border border-border rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col max-h-[90dvh] overflow-y-auto"
              dir={isRTL ? "rtl" : "ltr"}
            >
              <h2 className={cn(
                "text-2xl font-display font-bold text-foreground mb-6",
                isRTL ? "text-right" : "text-center"
              )}>
                {t.common?.edit || "Edit"}
              </h2>
              <div className={cn(
                "flex flex-nowrap items-center justify-center gap-1 sm:gap-4 w-full pb-4",
                isRTL && "flex-row-reverse"
              )}>
                <TimeSelector
                  value={parseInt(editHours) || 0}
                  onChange={(v) => {
                    const val = typeof v === 'function' ? v(parseInt(editHours) || 0) : v;
                    setEditHours(String(val));
                  }}
                  min={0}
                  max={99}
                  label={t.timer?.hours || "Hours"}
                />
                <span className="text-2xl sm:text-4xl font-mono text-muted-foreground/40 pb-6 shrink-0">:</span>
                <TimeSelector
                  value={parseInt(editMinutes) || 0}
                  onChange={(v) => {
                    const val = typeof v === 'function' ? v(parseInt(editMinutes) || 0) : v;
                    setEditMinutes(String(val));
                  }}
                  min={0}
                  max={59}
                  label={t.timer?.minutes || "Minutes"}
                />
                <span className="text-2xl sm:text-4xl font-mono text-muted-foreground/40 pb-6 shrink-0">:</span>
                <TimeSelector
                  value={parseInt(editSeconds) || 0}
                  onChange={(v) => {
                    const val = typeof v === 'function' ? v(parseInt(editSeconds) || 0) : v;
                    setEditSeconds(String(val));
                  }}
                  min={0}
                  max={59}
                  label={t.timer?.seconds || "Seconds"}
                />
              </div>
              <div className={cn(
                "w-full flex justify-center mt-6 gap-4",
                isRTL && "flex-row-reverse"
              )}>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-3 bg-muted text-muted-foreground rounded-full font-medium hover:bg-muted/80 transition-colors"
                >
                  {t.common?.cancel || "Cancel"}
                </button>
                <button
                  onClick={handleApplyEdit}
                  className="flex-1 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-colors shadow-lg"
                >
                  {t.common?.save || "Save"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ===== SETTINGS MODAL ===== */}
      <AnimatePresence>
        {showSettings && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeSettings}
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
                      {t.timer?.settings || "Settings"}
                    </h2>
                  </div>
                  <button
                    onClick={closeSettings}
                    className="p-1.5 sm:p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
                  <div className="space-y-2">
                    <h3 className={cn(
                      "text-xs font-medium text-muted-foreground uppercase tracking-wider",
                      isRTL ? "text-right" : "text-left"
                    )}>
                      {t.timer?.timerName || "Timer Name"}
                    </h3>
                    <input
                      type="text"
                      value={timerName}
                      onChange={(e) => setTimerName(e.target.value)}
                      placeholder={t.timer?.customTimer || "Custom Timer"}
                      className={cn(
                        "w-full bg-muted border border-border rounded-xl py-2.5 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all",
                        isRTL ? "text-right" : "text-left"
                      )}
                      dir={isRTL ? "rtl" : "ltr"}
                    />
                  </div>

                  <div className="space-y-3 pt-2 border-t border-border/50">
                    <h3 className={cn(
                      "text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2",
                      isRTL ? "flex-row-reverse" : "flex-row"
                    )}>
                      <Volume2 className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                      {t.timer?.alarmSound || "Alarm Sound"}
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
                          {soundEnabled ? (t.timer?.soundOn || "Sound On") : (t.timer?.soundOff || "Sound Off")}
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
                        <span className="text-xs text-muted-foreground">{t.timer?.volume || "Volume"}</span>
                        <span className="text-xs font-mono text-foreground">
                          {Math.round(volume * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        disabled={!soundEnabled}
                        className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-border/50">
                    <h3 className={cn(
                      "text-xs font-medium text-muted-foreground uppercase tracking-wider",
                      isRTL ? "text-right" : "text-left"
                    )}>
                      {t.timer?.repeat || "Repeat"}
                    </h3>
                    <label className={cn(
                      "flex items-center justify-between cursor-pointer p-3 rounded-xl bg-muted hover:bg-muted/80 transition-colors",
                      isRTL ? "flex-row-reverse" : "flex-row"
                    )}>
                      <div className={cn(
                        "flex items-center gap-3",
                        isRTL ? "flex-row-reverse" : "flex-row"
                      )}>
                        <Repeat className={cn(
                          "w-4 h-4 sm:w-5 sm:h-5",
                          repeat ? "text-primary" : "text-muted-foreground"
                        )} />
                        <span className="text-sm font-medium text-foreground/80">
                          {repeat ? (t.timer?.repeatOn || "Repeat On") : (t.timer?.repeatOff || "Repeat Off")}
                        </span>
                      </div>
                      <div
                        onClick={() => setRepeat(!repeat)}
                        className={cn(
                          "w-11 h-6 rounded-full transition-colors relative cursor-pointer",
                          repeat ? "bg-primary" : "bg-muted-foreground/50"
                        )}
                      >
                        <div
                          className={cn(
                            "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                            repeat 
                              ? (isRTL ? "left-1" : "left-6") 
                              : "left-1"
                          )}
                        />
                      </div>
                    </label>
                  </div>
                </div>

                <div className={cn(
                  "flex items-center justify-end gap-3 p-4 sm:p-5 border-t border-border bg-card",
                  isRTL ? "flex-row-reverse" : "flex-row"
                )}>
                  <button
                    onClick={closeSettings}
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
export default function TimerPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  return (
    <Suspense fallback={<Loading />}>
      <TimerPageContent params={params} />
    </Suspense>
  );
}