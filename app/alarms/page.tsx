"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, Plus, Trash2, Edit2, Volume2, VolumeX, X, Music, Radio, 
  Speaker, AlertCircle, CheckCircle2, Minus, Clock,
  BellRing, AlarmClock, Info, Smartphone, Maximize, Minimize
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { SeoContent } from "@/components/SeoContent";
import Loading from "@/app/loading";

// ===== SOUND PRESETS =====
const SOUND_PRESETS = [
  { 
    id: 'radar', 
    name: 'Radar', 
    icon: Radio,
    color: 'from-blue-400 to-blue-600',
    play: (ctx: AudioContext, vol: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(vol * 0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    }
  },
  { 
    id: 'gentle', 
    name: 'Gentle Bell', 
    icon: Bell,
    color: 'from-green-400 to-green-600',
    play: (ctx: AudioContext, vol: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523, ctx.currentTime);
      osc.frequency.setValueAtTime(659, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(vol * 0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1);
    }
  },
  { 
    id: 'alarm', 
    name: 'Classic Alarm', 
    icon: AlertCircle,
    color: 'from-red-400 to-red-600',
    play: (ctx: AudioContext, vol: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.setValueAtTime(600, ctx.currentTime + 0.15);
      osc.frequency.setValueAtTime(800, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(vol * 0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    }
  },
  { 
    id: 'digital', 
    name: 'Digital', 
    icon: Speaker,
    color: 'from-cyan-400 to-cyan-600',
    play: (ctx: AudioContext, vol: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(vol * 0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    }
  },
  { 
    id: 'melody', 
    name: 'Melody', 
    icon: Music,
    color: 'from-purple-400 to-purple-600',
    play: (ctx: AudioContext, vol: number) => {
      [523, 659, 784, 1047].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.2);
        gain.gain.setValueAtTime(vol * 0.2, ctx.currentTime + i * 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.2 + 0.3);
        osc.start(ctx.currentTime + i * 0.2);
        osc.stop(ctx.currentTime + i * 0.2 + 0.3);
      });
    }
  },
  { 
    id: 'chime', 
    name: 'Chime', 
    icon: BellRing,
    color: 'from-amber-400 to-amber-600',
    play: (ctx: AudioContext, vol: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(vol * 0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 2);
    }
  },
];

// ===== ALARM TYPE =====
interface AlarmItem {
  id: string;
  time: string;
  label: string;
  enabled: boolean;
  repeat: 'none' | 'daily' | 'weekdays' | 'weekends';
  sound: string;
  volume: number;
  snooze: number;
  lastTriggered?: string;
}

// ===== TRIGGERED ALARM STATE =====
interface TriggeredAlarm {
  alarm: AlarmItem;
  isSnoozing: boolean;
}

// ===== STORE =====
class AlarmStore {
  private static instance: AlarmStore;
  private listeners: (() => void)[] = [];
  private alarms: AlarmItem[] = [];
  private initialized = false;

  private constructor() {}

  static getInstance(): AlarmStore {
    if (!AlarmStore.instance) {
      AlarmStore.instance = new AlarmStore();
    }
    return AlarmStore.instance;
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;
    const stored = localStorage.getItem('alarms-storage');
    if (stored) {
      try {
        this.alarms = JSON.parse(stored);
      } catch (e) {
        this.alarms = [];
      }
    }
    this.notifyListeners();
  }

  private saveToStorage() {
    localStorage.setItem('alarms-storage', JSON.stringify(this.alarms));
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  getAlarms(): AlarmItem[] {
    return this.alarms;
  }

  addAlarm(alarm: AlarmItem) {
    this.alarms.push({ ...alarm, id: alarm.id || Date.now().toString() });
    this.saveToStorage();
  }

  updateAlarm(id: string, updatedAlarm: AlarmItem) {
    this.alarms = this.alarms.map(alarm => 
      alarm.id === id ? updatedAlarm : alarm
    );
    this.saveToStorage();
  }

  removeAlarm(id: string) {
    this.alarms = this.alarms.filter(alarm => alarm.id !== id);
    this.saveToStorage();
  }

  toggleAlarm(id: string) {
    this.alarms = this.alarms.map(alarm =>
      alarm.id === id ? { ...alarm, enabled: !alarm.enabled } : alarm
    );
    this.saveToStorage();
  }

  markTriggered(id: string, date: string) {
    this.alarms = this.alarms.map(alarm =>
      alarm.id === id ? { ...alarm, lastTriggered: date } : alarm
    );
    this.saveToStorage();
  }
}

// ===== HOOK =====
function useAppStore() {
  const store = AlarmStore.getInstance();
  const [, forceUpdate] = useState({});

  useEffect(() => {
    store.init();
    const unsubscribe = store.subscribe(() => {
      forceUpdate({});
    });
    return unsubscribe;
  }, [store]);

  return {
    alarms: store.getAlarms(),
    addAlarm: store.addAlarm.bind(store),
    updateAlarm: store.updateAlarm.bind(store),
    removeAlarm: store.removeAlarm.bind(store),
    toggleAlarm: store.toggleAlarm.bind(store),
    markTriggered: store.markTriggered.bind(store),
  };
}

// ===== TIMESELECTOR COMPONENT =====
interface TimeSelectorProps {
  value: number;
  onChange: (val: number) => void;
  min: number;
  max: number;
  label: string;
}

function TimeSelector({
  value,
  onChange,
  min,
  max,
  label,
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
          onChange(value >= max ? min : value + 1);
        } else {
          onChange(value <= min ? max : value - 1);
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

  const displayValue = String(value).padStart(2, "0");

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.button
        type="button"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onMouseDown={() => startPress("inc")}
        onMouseUp={stopPress}
        onMouseLeave={stopPress}
        onTouchStart={(e) => { e.preventDefault(); startPress("inc"); }}
        onTouchEnd={(e) => { e.preventDefault(); stopPress(); }}
        className="p-3 bg-gradient-to-b from-muted to-muted/80 hover:from-primary/20 hover:to-primary/10 text-muted-foreground hover:text-primary rounded-xl transition-colors select-none touch-manipulation shadow-sm border border-border/50"
        aria-label="Increase"
      >
        <Plus className="w-4 h-4" />
      </motion.button>

      <div className="flex flex-col items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-card border-2 border-border rounded-2xl shadow-inner select-none relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-muted/30" />
        <span className="text-2xl sm:text-3xl font-mono tabular-nums text-foreground relative z-10 font-bold">
          {displayValue}
        </span>
        <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest mt-0.5 relative z-10">
          {label}
        </span>
      </div>

      <motion.button
        type="button"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onMouseDown={() => startPress("dec")}
        onMouseUp={stopPress}
        onMouseLeave={stopPress}
        onTouchStart={(e) => { e.preventDefault(); startPress("dec"); }}
        onTouchEnd={(e) => { e.preventDefault(); stopPress(); }}
        className="p-3 bg-gradient-to-b from-muted/80 to-muted hover:from-primary/20 hover:to-primary/10 text-muted-foreground hover:text-primary rounded-xl transition-colors select-none touch-manipulation shadow-sm border border-border/50"
        aria-label="Decrease"
      >
        <Minus className="w-4 h-4" />
      </motion.button>
    </div>
  );
}

// ===== ALARM CARD COMPONENT =====
function AlarmCard({ alarm, onToggle, onEdit, onDelete }: any) {
  const { t, language } = useTranslation();
  const isRTL = language === 'ar';
  const preset = SOUND_PRESETS.find(s => s.id === alarm.sound);
  const SoundIcon = preset?.icon || Bell;

  const repeatLabels: Record<string, string> = {
    none: t.alarms?.repeatLabels?.none || "Once",
    daily: t.alarms?.repeatLabels?.daily || "Daily",
    weekdays: t.alarms?.repeatLabels?.weekdays || "Mon-Fri",
    weekends: t.alarms?.repeatLabels?.weekends || "Sat-Sun",
  };

  const formatTimeDisplay = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;
    return `${displayHour}:${String(minutes).padStart(2, '0')} ${period}`;
  };

  const getTimeUntil = (time: string) => {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    const alarmDate = new Date();
    alarmDate.setHours(hours, minutes, 0, 0);

    if (alarmDate <= now) {
      alarmDate.setDate(alarmDate.getDate() + 1);
    }

    const diff = alarmDate.getTime() - now.getTime();
    const diffHours = Math.floor(diff / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    }
    return `${diffMinutes}m`;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      className={cn(
        "group p-5 sm:p-6 rounded-3xl border transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden",
        alarm.enabled
          ? "bg-card border-border hover:shadow-lg hover:shadow-primary/5"
          : "bg-muted/30 border-border/50 opacity-60",
        isRTL && "text-right"
      )}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {alarm.enabled && (
        <div className={cn(
          "absolute top-4 bottom-4 w-1 bg-primary rounded-full",
          isRTL ? "right-0 rounded-l-full" : "left-0 rounded-r-full"
        )} />
      )}

      <div className={cn("flex items-center gap-4 w-full sm:w-auto", isRTL ? "pr-2 flex-row-reverse" : "pl-2")}>
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
          alarm.enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
        )}>
          <SoundIcon className="w-6 h-6" />
        </div>

        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <div className={cn("flex items-baseline gap-2 flex-wrap", isRTL && "flex-row-reverse")}>
            <span className={cn(
              "text-3xl sm:text-4xl font-mono tabular-nums tracking-tight font-bold",
              alarm.enabled ? "text-foreground" : "text-muted-foreground"
            )}>
              {formatTimeDisplay(alarm.time)}
            </span>
            {alarm.label && (
              <span className="text-sm font-medium text-muted-foreground truncate">
                {alarm.label}
              </span>
            )}
          </div>
          <div className={cn("flex items-center gap-2 flex-wrap", isRTL && "flex-row-reverse")}>
            <span className={cn(
              "text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
              alarm.enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
            )}>
              {repeatLabels[alarm.repeat] || alarm.repeat}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Volume2 className="w-3 h-3" />
              {Math.round((alarm.volume || 1) * 100)}%
            </span>
            {alarm.enabled && (
              <span className="text-xs text-muted-foreground flex items-center gap-1 bg-muted/50 px-2 py-0.5 rounded-full">
                <Clock className="w-3 h-3" />
                {getTimeUntil(alarm.time)}
              </span>
            )}
            {!alarm.enabled && (
              <span className="text-xs text-muted-foreground flex items-center gap-1 bg-destructive/10 px-2 py-0.5 rounded-full text-destructive">
                <X className="w-3 h-3" />
                {t.alarms?.disabled || "Disabled"}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className={cn("flex items-center gap-2 w-full sm:w-auto", isRTL ? "justify-start" : "justify-end sm:justify-start")}>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onEdit}
          className="p-2.5 rounded-xl bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
        >
          <Edit2 className="w-4 h-4" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onDelete}
          className="p-2.5 rounded-xl bg-muted text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </motion.button>

        <label className={cn("flex items-center cursor-pointer", isRTL ? "mr-1" : "ml-1")}>
          <div
            className={cn(
              "w-12 h-7 rounded-full transition-colors relative shadow-inner cursor-pointer",
              alarm.enabled ? "bg-primary" : "bg-muted-foreground/30"
            )}
            onClick={(e) => {
              e.preventDefault();
              onToggle();
            }}
          >
            <motion.div
              animate={{ x: alarm.enabled ? (isRTL ? 2 : 22) : (isRTL ? 22 : 2) }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-md"
            />
          </div>
        </label>
      </div>
    </motion.div>
  );
}

// ===== MAIN PAGE CONTENT (wrapped in Suspense) =====
function AlarmsPageContent() {
  const { t, language } = useTranslation();
  const { alarms, addAlarm, updateAlarm, removeAlarm, toggleAlarm, markTriggered } = useAppStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [triggeredAlarm, setTriggeredAlarm] = useState<TriggeredAlarm | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const alarmIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Detect RTL
  const isRTL = language === 'ar';

  // Apply RTL/LTR to document root
  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    if (isRTL) {
      document.documentElement.classList.add('rtl');
    } else {
      document.documentElement.classList.remove('rtl');
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

  // Prevent hydration mismatch - only run client-side logic after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize audio context after mount
  useEffect(() => {
    if (!mounted) return;
    if (typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return () => {
      stopAlarmSound();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [mounted]);

  // Check notification permission after mount
  useEffect(() => {
    if (!mounted) return;
    if (typeof window !== 'undefined' && "Notification" in window) {
      const currentPermission = Notification.permission;
      setNotificationPermission(currentPermission);

      if (currentPermission === "default") {
        setShowPermissionPrompt(true);
      }
    }
  }, [mounted]);

  // Check alarms every second
  useEffect(() => {
    if (!mounted) return;
    const timer = setInterval(() => {
      checkAlarms();
    }, 1000);
    return () => clearInterval(timer);
  }, [alarms, mounted]);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert(t.alarms?.notificationsBlockedSubtext || "Your browser doesn't support notifications");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      setShowPermissionPrompt(false);
    } catch (e) {
      console.error("Notification request failed:", e);
    }
  };

  const checkAlarms = useCallback(() => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${hours}:${minutes}`;
    const day = now.getDay();
    const todayDate = now.toISOString().split('T')[0];

    alarms.forEach((alarm) => {
      if (!alarm.enabled) return;
      if (alarm.time !== currentTimeStr) return;
      if (alarm.lastTriggered === todayDate) return;

      let shouldRing = false;
      switch (alarm.repeat) {
        case 'none':
          shouldRing = true;
          break;
        case 'daily':
          shouldRing = true;
          break;
        case 'weekdays':
          shouldRing = day >= 1 && day <= 5;
          break;
        case 'weekends':
          shouldRing = day === 0 || day === 6;
          break;
        default:
          shouldRing = false;
      }

      if (shouldRing) {
        markTriggered(alarm.id, todayDate);
        triggerAlarm(alarm);
      }
    });
  }, [alarms, markTriggered]);

  const triggerAlarm = useCallback((alarm: AlarmItem) => {
    playAlarmSound(alarm);
    setTriggeredAlarm({ alarm, isSnoozing: false });
    sendNotification(alarm);

    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 200, 100, 200]);
    }
  }, []);

  const playAlarmSound = useCallback((alarm: AlarmItem) => {
    try {
      const ctx = audioContextRef.current;
      if (!ctx) return;

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const preset = SOUND_PRESETS.find(s => s.id === alarm.sound) || SOUND_PRESETS[0];

      const playOnce = () => {
        preset.play(ctx, alarm.volume);
      };

      playOnce();
      alarmIntervalRef.current = setInterval(playOnce, 800);
    } catch (e) {
      console.log('Audio play error:', e);
    }
  }, []);

  const stopAlarmSound = useCallback(() => {
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
  }, []);

  const sendNotification = useCallback((alarm: AlarmItem) => {
    if (notificationPermission !== 'granted') return;

    try {
      const preset = SOUND_PRESETS.find(s => s.id === alarm.sound);
      new Notification(`⏰ ${alarm.label || t.alarms?.reminder || "Reminder"}`, {
        body: `It's ${alarm.time}! ${preset?.name || ''} alarm ringing.`,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        tag: `alarm-${alarm.id}`,
        requireInteraction: true,
        silent: false,
      });
    } catch (e) {
      console.log('Notification error:', e);
    }
  }, [notificationPermission, t]);

  // Lock body scroll when alarm is ringing
  useEffect(() => {
    if (triggeredAlarm) {
      const originalOverflow = document.body.style.overflow;
      const originalTouchAction = document.body.style.touchAction;
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.touchAction = originalTouchAction;
      };
    }
  }, [triggeredAlarm]);

  const handleCloseAlarm = () => {
    stopAlarmSound();
    setTriggeredAlarm(null);
  };

  const handleSnoozeAlarm = () => {
    stopAlarmSound();
    if (triggeredAlarm) {
      const snoozeMinutes = triggeredAlarm.alarm.snooze || 5;
      const snoozeTime = new Date();
      snoozeTime.setMinutes(snoozeTime.getMinutes() + snoozeMinutes);

      const snoozeAlarm: AlarmItem = {
        ...triggeredAlarm.alarm,
        id: `snooze-${Date.now()}`,
        time: `${String(snoozeTime.getHours()).padStart(2, '0')}:${String(snoozeTime.getMinutes()).padStart(2, '0')}`,
        repeat: 'none',
        lastTriggered: undefined,
      };

      addAlarm(snoozeAlarm);
    }
    setTriggeredAlarm(null);
  };

  const openAddModal = () => {
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (id: string) => {
    setEditingId(id);
    setIsModalOpen(true);
  };

  // Prevent hydration mismatch by not rendering client-dependent UI until mounted
  if (!mounted) {
    return (
      <div className="flex flex-col space-y-8 pb-12 w-full max-w-6xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pt-8 sm:pt-12">
          <div className="space-y-4 flex-1">
            <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-foreground">
              {t.alarms?.title || "Alarms"}
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl leading-relaxed">
              {t.alarms?.subtitle || "Set and manage your alarms. Never miss an important moment."}
            </p>
          </div>
          <div className="flex items-center gap-2 px-6 py-3.5 bg-primary text-primary-foreground rounded-2xl font-semibold shrink-0 opacity-50">
            <Plus className="w-5 h-5" />
            {t.alarms?.addAlarm || "Add Alarm"}
          </div>
        </div>
        <div className="py-16 text-center border-2 border-dashed border-border bg-card/50 rounded-3xl">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Bell className="w-10 h-10 text-muted-foreground/40" />
          </div>
          <p className="text-muted-foreground text-lg font-medium">{t.alarms?.noAlarms || "No alarms set yet"}</p>
          <p className="text-muted-foreground/60 text-sm mt-1">{t.alarms?.noAlarmsSubtext || 'Tap "Add Alarm" to create your first alarm'}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      dir={isRTL ? "rtl" : "ltr"}
      className={cn(
        "flex flex-col space-y-8 pb-12 w-full max-w-6xl mx-auto px-4",
        isFullscreen && "h-screen items-center justify-center max-w-full px-8 space-y-4"
      )}
    >
      {/* ===== NOTIFICATION PERMISSION PROMPT ===== */}
      <AnimatePresence>
        {showPermissionPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center"
            style={{ width: '100vw', height: '100vh', margin: 0, padding: 0 }}
          >
            <div 
              className="absolute inset-0 bg-black/80 backdrop-blur-md" 
              style={{ width: '100%', height: '100%' }}
              onClick={() => setShowPermissionPrompt(false)}
            />
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ delay: 0.1 }}
              className="relative bg-background dark:bg-card rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl text-center overflow-hidden border border-border"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/50 to-primary" />

              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <BellRing className="w-10 h-10 text-primary animate-pulse" />
              </div>

              <h2 className="text-2xl font-bold text-foreground mb-3">
                {t.alarms?.enableNotifications || "Enable Alarm Notifications"}
              </h2>
              <p className="text-muted-foreground mb-2">
                {t.alarms?.enableNotificationsDesc || "To receive alarm alerts even when your browser is closed, please allow notifications."}
              </p>
              <p className="text-sm text-muted-foreground/70 mb-8">
                {t.alarms?.enableNotificationsSubtext || "We'll only send notifications for your scheduled alarms."}
              </p>

              <div className={cn("flex gap-3", isRTL && "flex-row-reverse")}>
                <button
                  onClick={() => setShowPermissionPrompt(false)}
                  className="flex-1 py-3.5 rounded-2xl bg-muted hover:bg-muted/80 text-foreground font-semibold transition-colors"
                >
                  {t.alarms?.notNow || "Not Now"}
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={requestNotificationPermission}
                  className="flex-1 py-3.5 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                >
                  <Bell className="w-5 h-5" />
                  {t.alarms?.allowNotifications || "Allow Notifications"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== HEADER ===== */}
      {!isFullscreen && (
        <div className={cn(
          "flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pt-8 sm:pt-12 w-full",
          isRTL && "flex-row-reverse"
        )}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "space-y-3 sm:space-y-4 flex-1",
              isRTL ? "text-right" : "text-left"
            )}
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold tracking-tight text-foreground">
              {t.alarms?.title || "Alarms"}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-xl leading-relaxed">
              {t.alarms?.subtitle || "Set and manage your alarms. Never miss an important moment."}
            </p>

            {notificationPermission === 'granted' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "inline-flex items-center gap-3 text-sm bg-emerald-500/10 border border-emerald-500/25 px-5 py-3 rounded-2xl",
                  isRTL && "flex-row-reverse"
                )}
              >
                <div className="relative flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                  <div className="absolute inset-0 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping opacity-40" />
                </div>
                <div>
                  <p className="font-semibold text-emerald-600 dark:text-emerald-400">{t.alarms?.notificationsActive || "Notifications Active"}</p>
                  <p className="text-emerald-500/80 dark:text-emerald-400/70 text-xs">{t.alarms?.notificationsActiveSubtext || "Alarms work even when browser is closed"}</p>
                </div>
              </motion.div>
            )}

            {notificationPermission === 'denied' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "inline-flex items-start gap-3 text-sm bg-amber-500/10 border border-amber-500/25 px-5 py-3 rounded-2xl",
                  isRTL && "flex-row-reverse"
                )}
              >
                <div className="w-2.5 h-2.5 bg-amber-500 rounded-full mt-1.5 shadow-[0_0_8px_rgba(245,158,11,0.5)] shrink-0" />
                <div>
                  <p className="font-semibold text-amber-700 dark:text-amber-400">{t.alarms?.notificationsBlocked || "Notifications Blocked"}</p>
                  <p className="text-amber-600/80 dark:text-amber-400/70 text-xs mt-0.5">
                    {t.alarms?.notificationsBlockedSubtext || "Alarms won't work in background. Enable notifications in browser settings."}
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>

          <div className={cn(
            "flex items-center gap-2 shrink-0",
            isRTL ? "mr-0" : "ml-0"
          )}>
            <button
              onClick={toggleFullscreen}
              className="p-2.5 sm:p-3 rounded-xl transition-all duration-300 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
              aria-label={"Fullscreen"}
            >
              <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">{t.alarms?.addAlarm || "Add Alarm"}</span>
              <span className="sm:hidden">{t.alarms?.addAlarm || "Add"}</span>
            </button>
          </div>
        </div>
      )}

      {/* ===== FULLSCREEN CONTROLS ===== */}
      {isFullscreen && (
        <div className={cn(
          "absolute top-4 flex items-center gap-2 z-10",
          isRTL ? "left-4" : "right-4"
        )}>
          <button
            onClick={openAddModal}
            className="p-2.5 rounded-xl transition-all duration-300 bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground backdrop-blur-sm"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl transition-all duration-300 bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground backdrop-blur-sm"
          >
            <Minimize className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      )}

      {/* ===== ALARMS LIST ===== */}
      <div className={cn("flex flex-col gap-4 w-full", isFullscreen && "max-w-2xl")}>
        <AnimatePresence mode="popLayout">
          {alarms.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="py-16 text-center border-2 border-dashed border-border bg-card/50 rounded-3xl"
            >
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Bell className="w-10 h-10 text-muted-foreground/40" />
              </div>
              <p className="text-muted-foreground text-lg font-medium">{t.alarms?.noAlarms || "No alarms set yet"}</p>
              <p className="text-muted-foreground/60 text-sm mt-1">{t.alarms?.noAlarmsSubtext || 'Tap "Add Alarm" to create your first alarm'}</p>
            </motion.div>
          ) : (
            alarms.map((alarm) => (
              <AlarmCard
                key={alarm.id}
                alarm={alarm}
                onToggle={() => toggleAlarm(alarm.id)}
                onEdit={() => openEditModal(alarm.id)}
                onDelete={() => removeAlarm(alarm.id)}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      {!isFullscreen && (
        <SeoContent pageKey="alarms" />
      )}

      <AlarmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingId={editingId}
        alarms={alarms}
        addAlarm={addAlarm}
        updateAlarm={updateAlarm}
      />

      {/* ===== ALARM TRIGGER POPUP ===== */}
      <AnimatePresence>
        {triggeredAlarm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] flex items-center justify-center overflow-hidden"
            style={{ 
              width: '100vw', 
              height: '100vh', 
              margin: 0, 
              padding: 0,
              overscrollBehavior: 'none',
              touchAction: 'none'
            }}
          >
            <div 
              className="absolute inset-0 bg-black/85 backdrop-blur-md" 
              style={{ width: '100%', height: '100%' }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: 30 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="relative w-full max-w-sm mx-4"
            >
              <div className="bg-card rounded-[2.5rem] p-8 shadow-2xl text-center relative overflow-hidden border border-border">
                <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-primary/10 to-transparent rounded-t-[2.5rem]" />

                <div className="relative z-10">
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                    className="mb-6 flex justify-center"
                  >
                    <div className="relative">
                      <motion.div
                        animate={{ 
                          rotate: [-12, 12, -12],
                          scale: [1, 1.1, 1]
                        }}
                        transition={{ 
                          duration: 0.5,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/90 to-primary flex items-center justify-center shadow-2xl border-4 border-primary/20"
                      >
                        <BellRing className="w-10 h-10 text-primary-foreground" />
                      </motion.div>
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ scale: [1, 1.6 + i * 0.3], opacity: [0.35 - i * 0.1, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                          className="absolute inset-0 rounded-full border-4 border-primary/20"
                        />
                      ))}
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mb-3"
                  >
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider border border-primary/20">
                      <BellRing className="w-3 h-3" />
                      {t.alarms?.alarmRinging || "Alarm Ringing"}
                    </span>
                  </motion.div>

                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-xl font-bold text-foreground mb-1"
                  >
                    {triggeredAlarm.alarm.label || t.alarms?.reminder || "Reminder"}
                  </motion.h2>

                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-4xl font-mono font-bold text-primary mb-2"
                  >
                    {triggeredAlarm.alarm.time}
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55 }}
                    className="flex items-center justify-center gap-2 mb-8"
                  >
                    {(() => {
                      const preset = SOUND_PRESETS.find(s => s.id === triggeredAlarm.alarm.sound);
                      const Icon = preset?.icon || Bell;
                      return (
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                          <Icon className="w-3 h-3" />
                          {preset?.name || "Default"}
                        </span>
                      );
                    })()}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className={cn("flex gap-3", isRTL && "flex-row-reverse")}
                  >
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCloseAlarm}
                      className="flex-1 py-4 rounded-2xl bg-destructive text-destructive-foreground font-bold text-base shadow-lg shadow-destructive/30 hover:shadow-xl transition-all"
                    >
                      {t.alarms?.stop || "STOP"}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSnoozeAlarm}
                      className="flex-1 py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base shadow-lg shadow-primary/30 hover:shadow-xl transition-all flex items-center justify-center gap-2"
                    >
                      <AlarmClock className="w-4 h-4" />
                      {t.alarms?.snooze || "SNOOZE"}
                    </motion.button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ===== ALARM MODAL COMPONENT =====
function AlarmModal({
  isOpen,
  onClose,
  editingId,
  alarms,
  addAlarm,
  updateAlarm,
}: {
  isOpen: boolean;
  onClose: () => void;
  editingId: string | null;
  alarms: AlarmItem[];
  addAlarm: (alarm: AlarmItem) => void;
  updateAlarm: (id: string, alarm: AlarmItem) => void;
}) {
  const { t, language } = useTranslation();
  const isRTL = language === 'ar';
  const [previewSoundId, setPreviewSoundId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [mounted]);

  const defaultAlarm: AlarmItem = {
    id: "",
    time: "07:00",
    label: "",
    enabled: true,
    repeat: "none",
    sound: "radar",
    volume: 0.8,
    snooze: 5,
  };

  const [formData, setFormData] = useState<AlarmItem>(defaultAlarm);
  const [hours, setHours] = useState(7);
  const [minutes, setMinutes] = useState(0);
  const [isAM, setIsAM] = useState(true);

  useEffect(() => {
    if (isOpen) {
      if (editingId) {
        const found = alarms.find((a) => a.id === editingId);
        if (found) {
          setFormData(found);
          const [h, m] = found.time.split(':').map(Number);
          const hour12 = h % 12 || 12;
          setHours(hour12);
          setMinutes(m);
          setIsAM(h < 12);
        }
      } else {
        setFormData({ ...defaultAlarm, id: Date.now().toString() });
        const defaultHour = 7;
        setHours(defaultHour);
        setMinutes(0);
        setIsAM(true);
      }
    }
  }, [isOpen, editingId, alarms]);

  useEffect(() => {
    let hour24 = hours;
    if (!isAM && hours !== 12) {
      hour24 = hours + 12;
    } else if (isAM && hours === 12) {
      hour24 = 0;
    }
    const timeStr = `${String(hour24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    setFormData(prev => ({
      ...prev,
      time: timeStr
    }));
  }, [hours, minutes, isAM]);

  const handleSave = () => {
    if (editingId) {
      updateAlarm(editingId, formData);
    } else {
      addAlarm(formData);
    }
    onClose();
  };

  const previewSound = (soundId: string) => {
    const preset = SOUND_PRESETS.find(s => s.id === soundId);
    if (!preset) return;

    setPreviewSoundId(soundId);
    try {
      const ctx = audioContextRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      preset.play(ctx, formData.volume);
    } catch (e) {
      console.log('Preview error:', e);
    }
    setTimeout(() => setPreviewSoundId(null), 600);
  };

  if (!isOpen || !mounted) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ width: '100vw', height: '100vh', margin: 0, padding: 0 }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        style={{ width: '100%', height: '100%' }}
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-lg bg-background border border-border rounded-[2rem] shadow-2xl flex flex-col max-h-[90dvh] overflow-hidden mx-4"
      >
        {/* Header */}
        <div className={cn(
          "flex justify-between items-center p-6 border-b border-border shrink-0",
          isRTL && "flex-row-reverse"
        )}>
          <div className={isRTL ? "text-right order-2" : "text-left order-1"}>
            <h2 className="text-2xl font-bold text-foreground">
              {editingId ? (t.alarms?.editAlarm || "Edit Alarm") : (t.alarms?.newAlarm || "New Alarm")}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {editingId ? (t.alarms?.editAlarmSubtitle || "Update your alarm settings") : (t.alarms?.newAlarmSubtitle || "Create a new alarm")}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className={cn(
              "p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors",
              isRTL ? "order-1" : "order-2"
            )}
          >
            <X className="w-6 h-6" />
          </motion.button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Time Picker */}
          <div className="space-y-3">
            <label className={cn(
              "text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2",
              isRTL && "flex-row-reverse justify-end"
            )}>
              <Clock className="w-4 h-4" />
              {t.alarms?.time || "Time"}
            </label>
            <div className="flex items-center justify-center gap-3 sm:gap-5 py-5 bg-muted/50 rounded-3xl border border-border/50">
              {/* Hours */}
              <div className="flex flex-col items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setHours(h => h >= 12 ? 1 : h + 1)}
                  className="p-3 bg-gradient-to-b from-muted to-muted/80 hover:from-primary/20 hover:to-primary/10 text-muted-foreground hover:text-primary rounded-xl transition-colors border border-border/50"
                >
                  <Plus className="w-4 h-4" />
                </motion.button>
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-card border-2 border-border rounded-2xl flex items-center justify-center shadow-inner">
                  <span className="text-3xl sm:text-4xl font-mono font-bold text-foreground">
                    {String(hours).padStart(2, '0')}
                  </span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setHours(h => h <= 1 ? 12 : h - 1)}
                  className="p-3 bg-gradient-to-b from-muted/80 to-muted hover:from-primary/20 hover:to-primary/10 text-muted-foreground hover:text-primary rounded-xl transition-colors border border-border/50"
                >
                  <Minus className="w-4 h-4" />
                </motion.button>
              </div>

              <span className="text-4xl sm:text-5xl text-muted-foreground/30 font-bold pb-2">:</span>

              {/* Minutes */}
              <div className="flex flex-col items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setMinutes(m => m >= 59 ? 0 : m + 1)}
                  className="p-3 bg-gradient-to-b from-muted to-muted/80 hover:from-primary/20 hover:to-primary/10 text-muted-foreground hover:text-primary rounded-xl transition-colors border border-border/50"
                >
                  <Plus className="w-4 h-4" />
                </motion.button>
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-card border-2 border-border rounded-2xl flex items-center justify-center shadow-inner">
                  <span className="text-3xl sm:text-4xl font-mono font-bold text-foreground">
                    {String(minutes).padStart(2, '0')}
                  </span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setMinutes(m => m <= 0 ? 59 : m - 1)}
                  className="p-3 bg-gradient-to-b from-muted/80 to-muted hover:from-primary/20 hover:to-primary/10 text-muted-foreground hover:text-primary rounded-xl transition-colors border border-border/50"
                >
                  <Minus className="w-4 h-4" />
                </motion.button>
              </div>

              {/* AM/PM */}
              <div className="flex flex-col gap-2 ml-1 sm:ml-2">
                <button
                  onClick={() => setIsAM(true)}
                  className={cn(
                    "px-3 py-2.5 rounded-xl font-bold text-xs transition-all border-2 min-w-[48px]",
                    isAM
                      ? "border-primary bg-primary/10 text-primary shadow-md shadow-primary/10"
                      : "border-border bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  AM
                </button>
                <button
                  onClick={() => setIsAM(false)}
                  className={cn(
                    "px-3 py-2.5 rounded-xl font-bold text-xs transition-all border-2 min-w-[48px]",
                    !isAM
                      ? "border-primary bg-primary/10 text-primary shadow-md shadow-primary/10"
                      : "border-border bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  PM
                </button>
              </div>
            </div>
          </div>

          {/* Label */}
          <div className="space-y-3">
            <label className={cn(
              "text-sm font-semibold text-muted-foreground uppercase tracking-wider block",
              isRTL && "text-right"
            )}>
              {t.alarms?.label || "Label"}
            </label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder={t.alarms?.labelPlaceholder || "e.g. Morning Workout, Meeting..."}
              className={cn(
                "w-full bg-card border-2 border-border rounded-2xl py-4 px-5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all text-lg",
                isRTL && "text-right"
              )}
            />
          </div>

          {/* Repeat */}
          <div className="space-y-3">
            <label className={cn(
              "text-sm font-semibold text-muted-foreground uppercase tracking-wider block",
              isRTL && "text-right"
            )}>
              {t.alarms?.repeat || "Repeat"}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'none', label: t.alarms?.once || "Once", icon: X },
                { value: 'daily', label: t.alarms?.daily || "Daily", icon: Bell },
                { value: 'weekdays', label: t.alarms?.weekdays || "Weekdays", icon: Smartphone },
                { value: 'weekends', label: t.alarms?.weekends || "Weekends", icon: BellRing },
              ].map((option) => {
                const Icon = option.icon;
                const isSelected = formData.repeat === option.value;
                return (
                  <motion.button
                    key={option.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setFormData({ ...formData, repeat: option.value as any })}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-2xl border-2 transition-all",
                      isSelected
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border bg-card hover:bg-muted/50 text-foreground"
                    )}
                  >
                    <Icon className={cn("w-5 h-5", isSelected ? "text-primary" : "text-muted-foreground")} />
                    <span className="font-semibold">{option.label}</span>
                    {isSelected && <CheckCircle2 className={cn("w-4 h-4 text-primary", isRTL ? "mr-auto" : "ml-auto")} />}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Sound Selection */}
          <div className="space-y-3">
            <label className={cn(
              "text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2",
              isRTL && "flex-row-reverse justify-end"
            )}>
              <Music className="w-4 h-4" />
              {t.alarms?.alarmSound || "Alarm Sound"}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {SOUND_PRESETS.map((sound) => {
                const Icon = sound.icon;
                const isSelected = formData.sound === sound.id;
                const isPlaying = previewSoundId === sound.id;
                return (
                  <motion.button
                    key={sound.id}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      setFormData({ ...formData, sound: sound.id });
                      previewSound(sound.id);
                    }}
                    className={cn(
                      "relative flex items-center gap-3 p-4 rounded-2xl border-2 transition-all overflow-hidden",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:bg-muted/50"
                    )}
                  >
                    <div className={cn(
                      "absolute top-0 bottom-0 w-1 bg-gradient-to-b",
                      sound.color,
                      isRTL ? "right-0" : "left-0"
                    )} />

                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br",
                      sound.color,
                      "text-white shadow-md"
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className={cn("flex-1", isRTL ? "text-right" : "text-left")}>
                      <span className={cn(
                        "font-semibold block",
                        isSelected ? "text-primary" : "text-foreground"
                      )}>
                        {sound.name}
                      </span>
                    </div>

                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                      >
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      </motion.div>
                    )}

                    {isPlaying && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="flex gap-0.5 items-end h-4">
                          {[1, 2, 3].map((i) => (
                            <motion.div
                              key={i}
                              animate={{ height: [4, 16, 4] }}
                              transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                              className="w-1 bg-primary rounded-full"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Volume */}
          <div className="space-y-3">
            <div className={cn(
              "flex justify-between items-center",
              isRTL && "flex-row-reverse"
            )}>
              <label className={cn(
                "text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2",
                isRTL && "flex-row-reverse"
              )}>
                <Volume2 className="w-4 h-4" />
                {t.alarms?.volume || "Volume"}
              </label>
              <span className="text-sm font-mono font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                {Math.round(formData.volume * 100)}%
              </span>
            </div>
            <div className={cn(
              "flex items-center gap-4",
              isRTL && "flex-row-reverse"
            )}>
              <VolumeX className="w-5 h-5 text-muted-foreground" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={formData.volume}
                onChange={(e) => setFormData({ ...formData, volume: parseFloat(e.target.value) })}
                className="flex-1 h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
              />
              <Volume2 className="w-5 h-5 text-primary" />
            </div>
          </div>

          {/* Snooze */}
          <div className="space-y-3">
            <label className={cn(
              "text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2",
              isRTL && "flex-row-reverse justify-end"
            )}>
              <AlarmClock className="w-4 h-4" />
              {t.alarms?.snoozeDuration || "Snooze Duration"}
            </label>
            <div className="flex gap-2">
              {[5, 10, 15, 30].map((mins) => (
                <motion.button
                  key={mins}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFormData({ ...formData, snooze: mins })}
                  className={cn(
                    "flex-1 py-3 rounded-xl font-semibold text-sm transition-all border-2",
                    formData.snooze === mins
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-card text-muted-foreground hover:bg-muted"
                  )}
                >
                  {mins}m
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={cn("flex gap-3 p-6 border-t border-border bg-card shrink-0", isRTL && "flex-row-reverse")}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="flex-1 py-3.5 rounded-2xl bg-muted hover:bg-muted/80 text-foreground font-semibold transition-colors"
          >
            {t.common?.cancel || "Cancel"}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            className="flex-1 py-3.5 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            {editingId ? (t.alarms?.saveChanges || "Save Changes") : (t.alarms?.createAlarm || "Create Alarm")}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

// ===== MAIN EXPORT WITH SUSPENSE =====
export default function AlarmsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <AlarmsPageContent />
    </Suspense>
  );
}