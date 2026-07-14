'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from '@/lib/i18n';
import Link from 'next/link';
import {
  Calendar,
  Plus,
  Share2,
  X,
  Clock,
  Sparkles,
  Star,
  Heart,
  PartyPopper,
  Gift,
  Moon,
  Sun,
  Leaf,
  Snowflake,
  Flame,
  Rocket,
  ChevronDown,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trophy,
  Apple,
  Flower,
  Cross,
  ShoppingCart,
  Laugh,
  Hammer,
  Flag,
  Beer,
  Skull,
  Waves,
  Lightbulb,
  Maximize,
  Minimize,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { SeoContent } from '@/components/SeoContent';
import { cn } from '@/lib/utils';
import Loading from '@/app/loading';

// ============================================================
// ICON MAP - Maps icon strings to components
// ============================================================
const getIconComponent = (iconName: string, className = "w-6 h-6") => {
const iconMap: Record<string, React.ReactNode> = {
  Trophy: <Trophy className={className} />,
  Snowflake: <Snowflake className={className} />,
  Flame: <Flame className={className} />,
  Rocket: <Rocket className={className} />,
  Leaf: <Leaf className={className} />,
  Sun: <Sun className={className} />,
  Moon: <Moon className={className} />,
  Star: <Star className={className} />,
  Heart: <Heart className={className} />,
  Gift: <Gift className={className} />,
  Sparkles: <Sparkles className={className} />,
  PartyPopper: <PartyPopper className={className} />,
  Apple: <Apple className={className} />,
  Flower: <Flower className={className} />,
  Cross: <Cross className={className} />,
  ShoppingCart: <ShoppingCart className={className} />,
  Laugh: <Laugh className={className} />,
  Hammer: <Hammer className={className} />,
  Flag: <Flag className={className} />,
  Beer: <Beer className={className} />,
  Skull: <Skull className={className} />,
  Waves: <Waves className={className} />,
  Lightbulb: <Lightbulb className={className} />,
  Calendar: <Calendar className={className} />,
};
  return iconMap[iconName] || <Calendar className={className} />;
};

// ============================================================
// CATEGORIES - Static list of category keys
// ============================================================
const CATEGORIES = ['All', 'Sports', 'Religious', 'Holiday', 'Season', 'Special'];
const INITIAL_DISPLAY = 12;

// ============================================================
// YEAR/MONTH SELECTOR
// ============================================================
function YearMonthSelector({ 
  currentMonth, 
  currentYear, 
  onChange 
}: { 
  currentMonth: number; 
  currentYear: number; 
  onChange: (month: number, year: number) => void 
}) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const currentYearNow = new Date().getFullYear();
  const years = Array.from({ length: 51 }, (_, i) => currentYearNow + i);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary transition-colors"
      >
        {t.countdown?.months?.[currentMonth] || 'January'} {currentYear}
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 mt-1 bg-card border border-border rounded-xl shadow-xl p-3 z-20 w-64 max-h-72 overflow-y-auto"
              style={{ scrollbarWidth: 'thin' }}
            >
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">
                Select Year
              </div>
              <div className="space-y-0.5">
                {years.map((year) => (
                  <button
                    key={year}
                    onClick={() => {
                      onChange(currentMonth, year);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all",
                      year === currentYear
                        ? "bg-primary text-primary-foreground font-medium"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// ANALOG CLOCK
// ============================================================
function AnalogClock({
  mode,
  selectedValue,
  onSelect,
}: {
  mode: 'hour' | 'minute';
  selectedValue: number | null;
  onSelect: (value: number) => void;
}) {
  const rotationAngle = selectedValue !== null
    ? mode === 'hour'
      ? (selectedValue / 12) * 360
      : (selectedValue / 60) * 360
    : 0;

  const numbers = mode === 'hour'
    ? [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
    : [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  const total = mode === 'hour' ? 12 : 60;

  return (
    <div className="relative w-[256px] h-[256px] sm:w-[280px] sm:h-[280px]">
      <div className="absolute inset-0 rounded-full bg-background" />

      <motion.div
        className="absolute bottom-1/2 left-1/2 z-10"
        initial={false}
        animate={{ rotate: rotationAngle }}
        transition={{ type: "spring", stiffness: 200, damping: 18, mass: 0.7 }}
        style={{
          transformOrigin: 'bottom center',
          transform: 'translateX(-50%)',
        }}
      >
        <div 
          className="bg-primary rounded-full"
          style={{
            width: '2px',
            height: mode === 'hour' ? '80px' : '80px',
          }}
        />
      </motion.div>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary z-20" />

      {numbers.map((num) => {
        const value = num;
        const angleDeg = (value / total) * 360 - 90;
        const angleRad = (angleDeg * Math.PI) / 180;
        const radius = 34;
        const x = 50 + radius * Math.cos(angleRad);
        const y = 50 + radius * Math.sin(angleRad);
        const isSelected = selectedValue === value;

        return (
          <button
            key={num}
            onClick={() => onSelect(value)}
            className={cn(
              "absolute rounded-full flex items-center justify-center font-medium transition-all duration-150 select-none",
              mode === 'hour' 
                ? "w-10 h-10 sm:w-11 sm:h-11 text-sm" 
                : "w-9 h-9 sm:w-10 sm:h-10 text-xs",
              isSelected
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-foreground hover:bg-muted/40"
            )}
            style={{
              left: `${x}%`,
              top: `${y}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            {num}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================
// MAIN PAGE CONTENT
// ============================================================
function CountdownPageContent() {
  const { t, language } = useTranslation();
  const router = useRouter();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState<Date | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [now, setNow] = useState<Date | null>(null);
  const [displayCount, setDisplayCount] = useState(INITIAL_DISPLAY);
  const [isFullscreen, setIsFullscreen] = useState(false);

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
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [pickerStep, setPickerStep] = useState<'date' | 'time'>('date');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [selectedMinute, setSelectedMinute] = useState<number | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');
  const [timePickerMode, setTimePickerMode] = useState<'hour' | 'minute'>('hour');
  const pickerRef = useRef<HTMLDivElement>(null);
  const autoAdvanceRef = useRef<NodeJS.Timeout | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // ============================================================
  // BUILD EVENTS FROM TRANSLATION DATA
  // ============================================================
  const buildEvents = useCallback(() => {
    const eventsData = t.countdown?.events || {};
    return Object.entries(eventsData).map(([id, data]) => ({
      id,
      name: data.name,
      date: data.date,
      category: data.category,
      color: data.color,
      icon: getIconComponent(data.icon || 'Calendar'),
      popularity: data.popularity || 0,
    }));
  }, [t]);

  // ============================================================
  // GET CATEGORY LABEL
  // ============================================================
  const getCategoryLabel = useCallback((category: string) => {
    const categoryMap: Record<string, string> = {
      'All': t.countdown?.categories?.all || 'All',
      'Sports': t.countdown?.categories?.sports || 'Sports',
      'Religious': t.countdown?.categories?.religious || 'Religious',
      'Holiday': t.countdown?.categories?.holiday || 'Holiday',
      'Season': t.countdown?.categories?.season || 'Season',
      'Special': t.countdown?.categories?.special || 'Special',
    };
    return categoryMap[category] || category;
  }, [t]);

  // ============================================================
  // GET TRANSLATED CATEGORIES
  // ============================================================
  const getTranslatedCategories = useCallback(() => {
    return CATEGORIES.map(cat => ({
      key: cat,
      label: getCategoryLabel(cat)
    }));
  }, [getCategoryLabel]);

  // ============================================================
  // EFFECTS
  // ============================================================
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsDatePickerOpen(false);
        setPickerStep('date');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    return () => {
      if (autoAdvanceRef.current) {
        clearTimeout(autoAdvanceRef.current);
      }
    };
  }, []);

  // ============================================================
  // HELPERS
  // ============================================================
  const getHref = (path: string) => language === 'en' ? path : `/${language}${path}`;

  const handleCreate = () => {
    if (!eventName || !eventDate) return;
    const slug = `${eventName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}_${eventDate.getTime()}`;
    router.push(getHref(`/countdown/${slug}`));
  };

  const getTimeRemaining = (targetDate: string) => {
    if (!now) return null;
    const target = new Date(targetDate);
    const diff = target.getTime() - now.getTime();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, expired: false };
  };

  const getSortedEvents = useCallback(() => {
    const events = buildEvents();
    
    const filtered = activeCategory === 'All' 
      ? events 
      : events.filter(p => p.category === activeCategory);

    return filtered
      .map(event => {
        const remaining = getTimeRemaining(event.date);
        const daysRemaining = remaining && !remaining.expired ? remaining.days : Infinity;
        return { ...event, daysRemaining, remaining };
      })
      .sort((a, b) => {
        const popularityDiff = (b.popularity || 0) - (a.popularity || 0);
        if (popularityDiff !== 0) return popularityDiff;
        return a.daysRemaining - b.daysRemaining;
      });
  }, [buildEvents, activeCategory, now]);

  const sortedEvents = getSortedEvents();
  const displayedEvents = sortedEvents.slice(0, displayCount);
  const hasMore = displayCount < sortedEvents.length;

  const handleLoadMore = () => {
    setDisplayCount(prev => Math.min(prev + 12, sortedEvents.length));
  };

  const formatDisplayDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDateSelect = (day: number, month: number, year: number) => {
    const selected = new Date(year, month, day);
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    if (selected < todayMidnight) {
      return;
    }

    setSelectedDate(selected);
    setPickerStep('time');
    setSelectedHour(12);
    setSelectedMinute(0);
    setTimePickerMode('hour');
  };

  const isDateDisabled = (day: number, month: number, year: number) => {
    const date = new Date(year, month, day);
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    return date < todayMidnight;
  };

  const handleClockSelect = useCallback((value: number) => {
    if (timePickerMode === 'hour') {
      setSelectedHour(value);

      if (autoAdvanceRef.current) {
        clearTimeout(autoAdvanceRef.current);
      }

      autoAdvanceRef.current = setTimeout(() => {
        setTimePickerMode('minute');
        setSelectedMinute(0);
      }, 1000);

    } else {
      setSelectedMinute(value);
    }
  }, [timePickerMode]);

  const handleTimeConfirm = () => {
    if (selectedDate !== null && selectedHour !== null && selectedMinute !== null) {
      let finalHour = selectedHour;
      if (period === 'PM' && selectedHour !== 12) finalHour = selectedHour + 12;
      if (period === 'AM' && selectedHour === 12) finalHour = 0;

      const finalDate = new Date(selectedDate);
      finalDate.setHours(finalHour, selectedMinute);

      if (finalDate <= new Date()) {
        return;
      }

      setEventDate(finalDate);
      setIsDatePickerOpen(false);
      setPickerStep('date');
      setSelectedDate(null);
      setSelectedHour(null);
      setSelectedMinute(null);

      if (autoAdvanceRef.current) {
        clearTimeout(autoAdvanceRef.current);
        autoAdvanceRef.current = null;
      }
    }
  };

  const handleCancel = () => {
    setIsDatePickerOpen(false);
    setPickerStep('date');
    setSelectedDate(null);
    setSelectedHour(null);
    setSelectedMinute(null);

    if (autoAdvanceRef.current) {
      clearTimeout(autoAdvanceRef.current);
      autoAdvanceRef.current = null;
    }
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const isToday = (day: number, month: number, year: number) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
  };

  const isSelectedDate = (day: number, month: number, year: number) => {
    if (!selectedDate) return false;
    return selectedDate.getDate() === day && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;
  };

  const closeCreateModal = () => {
    setIsCreateOpen(false);
    setEventName('');
    setEventDate(null);
  };

  const translatedCategories = getTranslatedCategories();

  // ============================================================
  // LOADING STATE
  // ============================================================
  if (!now) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="min-h-screen flex flex-col w-full max-w-6xl mx-auto px-4">
      <div className="flex-1 flex flex-col space-y-10 pb-12">
        {/* Header */}
        {!isFullscreen && (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("space-y-3 flex-1", isRTL ? "text-right" : "text-left")}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold tracking-tight text-foreground">
                  {t.countdown?.title || "Countdown"}
                </h1>
              </div>
              <p className="text-muted-foreground text-base sm:text-lg max-w-xl leading-relaxed">
                {t.countdown?.subtitle || "Track important events and never miss a moment. Create custom countdowns or choose from popular events."}
              </p>
            </motion.div>

            <div className={cn("flex items-center gap-2 shrink-0", isRTL ? "mr-4" : "ml-4")}>
              <button
                onClick={toggleFullscreen}
                className="p-2.5 sm:p-3 rounded-xl transition-all duration-300 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                aria-label={"Fullscreen"}
              >
                <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                onClick={() => setIsCreateOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">{t.countdown?.createEvent || "Create Event"}</span>
                <span className="sm:hidden">{t.countdown?.create || "Create"}</span>
              </motion.button>
            </div>
          </div>
        )}

        {/* Fullscreen Controls */}
        {isFullscreen && (
          <div className={cn(
            "absolute top-4 flex items-center gap-2 z-50",
            isRTL ? "left-4" : "right-4"
          )}>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="p-2.5 rounded-xl transition-all duration-300 bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground backdrop-blur-sm"
              aria-label={t.countdown?.createEvent || "Create Event"}
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
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

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap gap-2"
        >
          {translatedCategories.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => {
                setActiveCategory(key);
                setDisplayCount(INITIAL_DISPLAY);
              }}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border",
                activeCategory === key
                  ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                  : "bg-card text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </motion.div>

        {/* Events Grid */}
        <div className={cn(
          "grid gap-x-6 gap-y-8 pt-6",
          isFullscreen 
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5" 
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        )}>
          <AnimatePresence mode="popLayout">
            {displayedEvents.map((preset, i) => {
              const isExpired = preset.remaining?.expired;

              return (
                <motion.div
                  layout
                  key={preset.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.05, type: "spring", stiffness: 300, damping: 25 }}
                  className="relative flex flex-col"
                >
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-20">
                    <div className={cn(
                      "px-4 py-1.5 rounded-full text-xs font-semibold shadow-lg backdrop-blur-xl whitespace-nowrap",
                      "bg-primary text-primary-foreground",
                      "border border-white/20 dark:border-white/20",
                      "flex items-center gap-1.5"
                    )}>
                      <span className="w-1.5 h-2.5 rounded-full bg-white/70 animate-pulse" />
                      {getCategoryLabel(preset.category)}
                    </div>
                  </div>

                  <Link 
                    href={getHref(`/countdown/${preset.id}`)}
                    className="block p-5 sm:p-6 bg-card border border-border rounded-[1.5rem] hover:border-primary/30 transition-all duration-300 group relative overflow-hidden h-full flex-1 mt-3"
                  >
                    <div className={cn(
                      "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                      preset.color
                    )} />

                    <div className="relative z-10 mt-2">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                          {preset.icon}
                        </div>
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            if (navigator.share) {
                              navigator.share({
                                title: preset.name,
                                url: window.location.href,
                              });
                            }
                          }}
                          className="p-2 rounded-full bg-muted/50 hover:bg-primary/10 transition-all duration-300 opacity-70 hover:opacity-100"
                        >
                          <Share2 className="w-4 h-4 text-primary" />
                        </button>
                      </div>

                      <h3 className="font-display font-semibold text-lg text-foreground mb-1 group-hover:text-primary transition-colors">
                        {preset.name}
                      </h3>

                      <p className="text-muted-foreground text-sm font-mono mb-4">
                        {new Date(preset.date).toLocaleDateString(undefined, { 
                          weekday: 'short', 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>

                      {preset.remaining && !isExpired ? (
                        <div className="grid grid-cols-4 gap-2">
                          <div className="text-center p-2 rounded-xl bg-muted/50">
                            <div className="text-lg font-bold text-foreground font-mono">{preset.remaining.days}</div>
                            <div className="text-[10px] text-muted-foreground uppercase">{t.countdown?.days || "Days"}</div>
                          </div>
                          <div className="text-center p-2 rounded-xl bg-muted/50">
                            <div className="text-lg font-bold text-foreground font-mono">{preset.remaining.hours}</div>
                            <div className="text-[10px] text-muted-foreground uppercase">{t.countdown?.hrs || "Hrs"}</div>
                          </div>
                          <div className="text-center p-2 rounded-xl bg-muted/50">
                            <div className="text-lg font-bold text-foreground font-mono">{preset.remaining.minutes}</div>
                            <div className="text-[10px] text-muted-foreground uppercase">{t.countdown?.min || "Min"}</div>
                          </div>
                          <div className="text-center p-2 rounded-xl bg-muted/50">
                            <div className="text-lg font-bold text-primary font-mono">{preset.remaining.seconds}</div>
                            <div className="text-[10px] text-muted-foreground uppercase">{t.countdown?.sec || "Sec"}</div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center p-3 rounded-xl bg-primary/10 text-primary font-medium text-sm">
                          {isExpired ? (t.countdown?.eventPassed || "Event has passed!") : (t.countdown?.loading || "Loading...")}
                        </div>
                      )}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Load More Button */}
        {hasMore && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center pt-4"
          >
            <button
              onClick={handleLoadMore}
              className="px-8 py-3 bg-card border border-border rounded-xl font-medium text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 flex items-center gap-2 group"
            >
              <span>{t.countdown?.loadMore || "Load More"}</span>
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                ({displayCount} / {sortedEvents.length})
              </span>
            </button>
          </motion.div>
        )}

        {/* Empty state */}
        {displayedEvents.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <Calendar className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground">{t.countdown?.noEvents || "No events found"}</h3>
            <p className="text-sm text-muted-foreground/70 mt-1">{t.countdown?.noEventsSubtext || "Try selecting a different category"}</p>
          </motion.div>
        )}

        {!isFullscreen && (
          <div className="w-full pb-12 mt-8">
            <SeoContent pageKey="countdown" />
          </div>
        )}
      </div>

      {/* Create Event Modal */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeCreateModal}
              className="fixed inset-0 bg-black/60 backdrop-blur-xl"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Plus className="w-4 h-4 text-primary" />
                  </div>
                  <h2 className="text-base font-semibold text-foreground">
                    {t.countdown?.createEvent || "Create Event"}
                  </h2>
                </div>
                <button
                  onClick={closeCreateModal}
                  className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <div 
                className="flex-1 overflow-y-auto p-4 space-y-4"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                <style>{`div::-webkit-scrollbar { display: none; }`}</style>

                {/* Event Name Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    {t.countdown?.eventName || "Event Name"}
                  </label>
                  <input
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder={t.countdown?.eventPlaceholder || "Enter event name..."}
                    className="w-full bg-muted border border-border rounded-xl py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                  />
                </div>

                {/* Date & Time Picker */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <CalendarIcon className="w-3 h-3" />
                    {t.countdown?.targetDate || "Target Date & Time"}
                  </label>

                  <button
                    onClick={() => {
                      setIsDatePickerOpen(true);
                      setPickerStep('date');
                      setSelectedDate(eventDate || new Date());
                      setCurrentMonth(eventDate ? eventDate.getMonth() : new Date().getMonth());
                      setCurrentYear(eventDate ? eventDate.getFullYear() : new Date().getFullYear());
                      setSelectedHour(eventDate ? (eventDate.getHours() % 12 || 12) : null);
                      setSelectedMinute(eventDate ? eventDate.getMinutes() : null);
                      setPeriod(eventDate ? (eventDate.getHours() >= 12 ? 'PM' : 'AM') : 'AM');
                      setTimePickerMode('hour');
                    }}
                    className={cn(
                      "w-full relative overflow-hidden group transition-all duration-300",
                      "bg-muted hover:bg-muted/80",
                      "border-2 rounded-xl py-2.5 px-3 text-sm",
                      eventDate 
                        ? "border-primary shadow-lg shadow-primary/20" 
                        : "border-border hover:border-primary/40"
                    )}
                  >
                    <div className="flex items-center justify-between relative z-10">
                      <span className="flex items-center gap-2 min-w-0">
                        <div className={cn(
                          "p-1 rounded-lg transition-all duration-300 shrink-0",
                          eventDate ? "bg-primary text-primary-foreground" : "bg-muted-foreground/10 text-muted-foreground"
                        )}>
                          <ClockIcon className="w-3 h-3" />
                        </div>
                        <span className={cn(
                          "truncate text-left text-sm",
                          eventDate ? 'text-foreground font-medium' : 'text-muted-foreground'
                        )}>
                          {eventDate ? formatDisplayDate(eventDate) : (t.countdown?.selectDate || "Select date and time...")}
                        </span>
                      </span>
                      <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
                    </div>
                  </button>

                  {/* Date/Time Picker Popup */}
                  <AnimatePresence>
                    {isDatePickerOpen && (
                      <>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={handleCancel}
                          className="fixed inset-0 bg-black/50 backdrop-blur-xl z-[200]"
                        />
                        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 pointer-events-none">
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative w-full max-w-[400px] sm:max-w-[440px] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden pointer-events-auto"
                          >
                            {/* Date Header */}
                            {pickerStep === 'date' && (
                              <div className="bg-card px-6 py-6 sm:px-8 sm:py-8">
                                <div className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-widest mb-2">
                                  {t.countdown?.selectDateHeader || "Select Date"}
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="text-3xl sm:text-4xl font-normal text-primary tracking-tight">
                                    {(selectedDate || new Date()).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                  </div>
                                  <button 
                                    onClick={() => {
                                      const today = new Date();
                                      setSelectedDate(today);
                                      setCurrentMonth(today.getMonth());
                                      setCurrentYear(today.getFullYear());
                                    }}
                                    className="p-2 rounded-full hover:bg-white/15 transition-colors"
                                  >
                                    <Pencil className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground/90" />
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Time Header */}
                            {pickerStep === 'time' && (
                              <div className="px-6 py-6 sm:px-8 sm:py-8 bg-card">
                                <div className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">
                                  {t.countdown?.selectTimeHeader || "Select Time"}
                                </div>
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => {
                                      setTimePickerMode('hour');
                                      if (autoAdvanceRef.current) {
                                        clearTimeout(autoAdvanceRef.current);
                                        autoAdvanceRef.current = null;
                                      }
                                    }}
                                    className={cn(
                                      "text-5xl sm:text-6xl font-light tabular-nums w-[90px] sm:w-[100px] py-2 rounded-xl transition-all text-center",
                                      timePickerMode === 'hour' 
                                        ? "bg-primary/15 text-primary" 
                                        : "text-foreground hover:bg-muted"
                                    )}
                                  >
                                    {selectedHour !== null ? String(selectedHour).padStart(2, '0') : '00'}
                                  </button>

                                  <span className="text-4xl sm:text-5xl text-muted-foreground font-light px-1">:</span>

                                  <button
                                    onClick={() => {
                                      setTimePickerMode('minute');
                                      if (autoAdvanceRef.current) {
                                        clearTimeout(autoAdvanceRef.current);
                                        autoAdvanceRef.current = null;
                                      }
                                    }}
                                    className={cn(
                                      "text-5xl sm:text-6xl font-light tabular-nums w-[90px] sm:w-[100px] py-2 rounded-xl transition-all text-center",
                                      timePickerMode === 'minute' 
                                        ? "bg-primary/15 text-primary" 
                                        : "text-foreground hover:bg-muted"
                                    )}
                                  >
                                    {selectedMinute !== null ? String(selectedMinute).padStart(2, '0') : '00'}
                                  </button>

                                  <div className="flex flex-col gap-1 ml-3 sm:ml-4">
                                    {(['AM', 'PM'] as const).map((p) => (
                                      <button
                                        key={p}
                                        onClick={() => setPeriod(p)}
                                        className={cn(
                                          "px-3 py-1 text-[11px] sm:text-xs font-medium rounded-lg transition-all border",
                                          period === p
                                            ? "bg-primary text-primary-foreground border-primary"
                                            : "text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"
                                        )}
                                      >
                                        {p}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Date Body */}
                            {pickerStep === 'date' && (
                              <div className="p-5 sm:p-6 bg-card">
                                <div className="flex items-center justify-between mb-5">
                                  <YearMonthSelector 
                                    currentMonth={currentMonth} 
                                    currentYear={currentYear}
                                    onChange={(month, year) => {
                                      setCurrentMonth(month);
                                      setCurrentYear(year);
                                    }}
                                  />
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => {
                                        if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
                                        else { setCurrentMonth(currentMonth - 1); }
                                      }}
                                      className="p-2 rounded-full hover:bg-muted transition-colors text-foreground"
                                    >
                                      <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
                                        else { setCurrentMonth(currentMonth + 1); }
                                      }}
                                      className="p-2 rounded-full hover:bg-muted transition-colors text-foreground"
                                    >
                                      <ChevronRight className="w-5 h-5" />
                                    </button>
                                  </div>
                                </div>

                                <div className="grid grid-cols-7 gap-0 mb-2">
                                  {(t.countdown?.weekdays || ["S", "M", "T", "W", "T", "F", "S"]).map((day, idx) => (
                                    <div key={`weekday-${idx}`} className="text-center text-xs sm:text-sm font-medium text-muted-foreground py-2">
                                      {day}
                                    </div>
                                  ))}
                                </div>

                                <div className="grid grid-cols-7 gap-1">
                                  {Array.from({ length: getFirstDayOfMonth(currentMonth, currentYear) }, (_, i) => (
                                    <div key={`empty-${i}`} className="aspect-square" />
                                  ))}
                                  {Array.from({ length: getDaysInMonth(currentMonth, currentYear) }, (_, i) => {
                                    const day = i + 1;
                                    const isTodayDate = isToday(day, currentMonth, currentYear);
                                    const isSelected = isSelectedDate(day, currentMonth, currentYear);
                                    const isDisabled = isDateDisabled(day, currentMonth, currentYear);

                                    return (
                                      <button
                                        key={day}
                                        onClick={() => !isDisabled && handleDateSelect(day, currentMonth, currentYear)}
                                        disabled={isDisabled}
                                        className={cn(
                                          "aspect-square flex items-center justify-center text-sm sm:text-base font-medium rounded-full transition-all mx-auto w-9 h-9 sm:w-10 sm:h-10",
                                          isSelected
                                            ? "bg-primary text-primary-foreground shadow-md"
                                            : isTodayDate
                                            ? "border-2 border-primary text-primary"
                                            : isDisabled
                                            ? "text-muted-foreground/30 cursor-not-allowed"
                                            : "hover:bg-muted text-foreground"
                                        )}
                                      >
                                        {day}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Time Body */}
                            {pickerStep === 'time' && (
                              <div className="flex flex-col items-center p-6 sm:p-8 bg-card">
                                <AnalogClock
                                  mode={timePickerMode}
                                  selectedValue={timePickerMode === 'hour' ? selectedHour : selectedMinute}
                                  onSelect={handleClockSelect}
                                />
                              </div>
                            )}

                            {/* Footer */}
                            <div className="flex items-center justify-end gap-2 px-5 sm:px-6 py-4 sm:py-5 border-t border-border bg-card">
                              {pickerStep === 'time' && (
                                <button
                                  onClick={() => {
                                    setPickerStep('date');
                                    setTimePickerMode('hour');
                                    if (autoAdvanceRef.current) {
                                      clearTimeout(autoAdvanceRef.current);
                                      autoAdvanceRef.current = null;
                                    }
                                  }}
                                  className="px-4 py-2 rounded-lg text-sm font-medium text-primary hover:bg-primary/5 transition-colors uppercase tracking-wide"
                                >
                                  {t.countdown?.back || "Back"}
                                </button>
                              )}
                              <button
                                onClick={handleCancel}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-primary hover:bg-primary/5 transition-colors uppercase tracking-wide"
                              >
                                {t.countdown?.cancel || "Cancel"}
                              </button>
                              {pickerStep === 'date' ? (
                                <button
                                  onClick={() => {
                                    if (selectedDate) {
                                      setPickerStep('time');
                                      setSelectedHour(12);
                                      setSelectedMinute(0);
                                      setTimePickerMode('hour');
                                    }
                                  }}
                                  disabled={!selectedDate}
                                  className="px-4 py-2 rounded-lg text-sm font-medium text-primary disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/5 transition-colors uppercase tracking-wide"
                                >
                                  {t.countdown?.ok || "OK"}
                                </button>
                              ) : (
                                <button
                                  onClick={handleTimeConfirm}
                                  disabled={selectedHour === null || selectedMinute === null}
                                  className="px-4 py-2 rounded-lg text-sm font-medium text-primary disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/5 transition-colors uppercase tracking-wide"
                                >
                                  {t.countdown?.ok || "OK"}
                                </button>
                              )}
                            </div>
                          </motion.div>
                        </div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* Selected Date Preview */}
                {eventDate && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-primary/5 border border-primary/20 rounded-xl p-2.5 flex items-center gap-2"
                  >
                    <div className="p-1.5 bg-primary/10 rounded-lg shrink-0">
                      <CalendarIcon className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-foreground truncate">
                      {formatDisplayDate(eventDate)}
                    </span>
                  </motion.div>
                )}

                {/* Create Button */}
                <button
                  onClick={handleCreate}
                  disabled={!eventName || !eventDate}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-[0.98] text-sm"
                >
                  {t.countdown?.generateLink || "Generate Countdown"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// MAIN EXPORT WITH SUSPENSE
// ============================================================
export default function CountdownPage() {
  return (
    <Suspense fallback={<Loading />}>
      <CountdownPageContent />
    </Suspense>
  );
}