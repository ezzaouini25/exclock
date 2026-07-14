"use client";

import { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactCountryFlag from "react-country-flag";
import ct from "countries-and-timezones";
import Holidays from "date-holidays";
import { Clock, ChevronDown, Loader2, Search, X, ArrowUpAZ, ArrowDownZA, Shuffle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { SeoContent } from "@/components/SeoContent";
import Loading from "@/app/loading";

// ===== TYPES =====
interface Holiday {
  date: string;
  name: string;
  type: string;
  substitute?: boolean;
  note?: string;
}

interface Country {
  code: string;
  name: string;
}

type SortMode = "az" | "za" | "random";

// ===== GET ALL COUNTRIES FROM LIBRARY =====
function getAllCountries(): Country[] {
  const allCountries = ct.getAllCountries();
  return Object.entries(allCountries)
    .map(([code, data]: [string, any]) => ({
      code,
      name: data.name,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// ===== DATE HELPERS =====
function getMonthAbbr(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
}

function getDayNum(dateStr: string): number {
  return new Date(dateStr + "T00:00:00").getDate();
}

function getDayName(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
}

function getFullDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
}

function formatCountdown(targetDateStr: string, t: any): string {
  const now = new Date();
  const target = new Date(targetDateStr + "T00:00:00");
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return t.holidays?.today || "Today!";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  if (days > 0) return days === 1 ? (t.holidays?.in1Day || "In 1 Day") : `${t.holidays?.in || "In"} ${days} ${t.holidays?.days || "Days"}`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function formatDetailedCountdown(targetDateStr: string, t: any): string {
  const now = new Date();
  const target = new Date(targetDateStr + "T00:00:00");
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return t.holidays?.today || "Today!";

  const totalDays = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  if (totalDays >= 30) {
    const months = Math.floor(totalDays / 30);
    const remainingDays = totalDays % 30;
    if (remainingDays > 0) {
      return `${months}${t.holidays?.mo || "mo"} ${remainingDays}${t.holidays?.d || "d"} ${hours}${t.holidays?.h || "h"}`;
    }
    return `${months}${t.holidays?.mo || "mo"} ${hours}${t.holidays?.h || "h"}`;
  }

  if (totalDays > 0) {
    return `${totalDays}${t.holidays?.d || "d"} ${hours}${t.holidays?.h || "h"} ${minutes}${t.holidays?.m || "m"}`;
  }

  if (hours > 0) {
    return `${hours}${t.holidays?.h || "h"} ${minutes}${t.holidays?.m || "m"} ${seconds}${t.holidays?.s || "s"}`;
  }
  if (minutes > 0) {
    return `${minutes}${t.holidays?.m || "m"} ${seconds}${t.holidays?.s || "s"}`;
  }
  return `${seconds}${t.holidays?.s || "s"}`;
}

function getProgressToHoliday(targetDateStr: string): number {
  const now = new Date();
  const target = new Date(targetDateStr + "T00:00:00");
  const startOfYear = new Date(target.getFullYear(), 0, 1);
  const total = target.getTime() - startOfYear.getTime();
  const elapsed = now.getTime() - startOfYear.getTime();
  if (elapsed <= 0) return 0;
  if (elapsed >= total) return 100;
  return Math.round((elapsed / total) * 100);
}

// ===== HOLIDAY CARD =====
function HolidayCard({
  holiday,
  index,
  isHighlighted = false,
  isPast = false,
  currentTime,
  t,
  isRTL,
}: {
  holiday: Holiday;
  index: number;
  isHighlighted?: boolean;
  isPast?: boolean;
  currentTime: Date;
  t: any;
  isRTL: boolean;
}) {
  const progress = isHighlighted ? getProgressToHoliday(holiday.date) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: isPast ? 0.4 : 1, y: 0 }}
      transition={{ delay: index * 0.035, duration: 0.4 }}
      className={cn(
        "relative overflow-hidden rounded-3xl border px-5 py-4 transition-all duration-300",
        isHighlighted
          ? "bg-card border-primary/40 bg-primary/[0.03] shadow-md hover:shadow-xl hover:-translate-y-1"
          : "bg-card border-border hover:border-primary/30 hover:bg-muted/50 hover:shadow-lg hover:-translate-y-0.5",
        isPast && "hover:opacity-70"
      )}
    >
      {/* Progress bar at top for highlighted card */}
      {isHighlighted && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-primary/20 rounded-t-3xl overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-primary rounded-full"
          />
        </div>
      )}

      <div className={cn(
        "flex items-center gap-4",
        isRTL && "flex-row-reverse"
      )}>
        {/* Date Block */}
        <div className="flex flex-col items-center justify-center min-w-[52px]">
          <span className={cn(
            "text-[10px] font-bold tracking-[0.1em] uppercase",
            isPast ? "text-muted-foreground/50" : "text-muted-foreground"
          )}>
            {getMonthAbbr(holiday.date)}
          </span>
          <span className={cn(
            "text-[22px] font-black leading-none mt-0.5",
            isPast ? "text-muted-foreground/50" : "text-primary"
          )}>
            {getDayNum(holiday.date)}
          </span>
        </div>

        {/* Info */}
        <div className={cn(
          "flex-1 min-w-0",
          isRTL ? "text-right" : "text-left"
        )}>
          <div className="font-bold text-[14px] text-foreground truncate leading-tight">
            {holiday.name}
          </div>
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">
            {getDayName(holiday.date)}
          </div>
          {holiday.note && (
            <div className="text-[9px] text-muted-foreground/50 italic mt-0.5">
              {holiday.note}
            </div>
          )}

          {/* Countdown Badge */}
          <div className={cn(
            "mt-1.5",
            isRTL && "flex justify-end"
          )}>
            {isPast ? (
              <span className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/50 border border-border/50",
                isRTL && "flex-row-reverse"
              )}>
                <svg className="w-3 h-3 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-[10px] font-bold text-muted-foreground/50">
                  {t.holidays?.passed || "Passed"}
                </span>
              </span>
            ) : (
              <span className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20",
                isRTL && "flex-row-reverse"
              )}>
                <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-[10px] font-bold text-primary tabular-nums">
                  {formatDetailedCountdown(holiday.date, t)}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Type Badge */}
        <div className="shrink-0">
          <span className={cn(
            "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
            isHighlighted
              ? "bg-primary/15 text-primary border-primary/20"
              : isPast
              ? "bg-muted text-muted-foreground/50 border-border/50"
              : "bg-muted text-muted-foreground border-border"
          )}>
            {holiday.type}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ===== MAIN PAGE CONTENT (wrapped in Suspense) =====
function HolidaysPageContent() {
  const { t, language } = useTranslation();
  const isRTL = language === "ar";
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const [currentTime, setCurrentTime] = useState(currentDate);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedCountry, setSelectedCountry] = useState<string>("US");
  const [countries, setCountries] = useState<Country[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loadingHolidays, setLoadingHolidays] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("az");
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const yearDropdownRef = useRef<HTMLDivElement>(null);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Apply RTL/LTR to document root
  useEffect(() => {
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    if (isRTL) {
      document.documentElement.classList.add("rtl");
    } else {
      document.documentElement.classList.remove("rtl");
    }
  }, [isRTL]);

  // Load countries
  useEffect(() => {
    try {
      const list = getAllCountries();
      setCountries(list);
    } catch (e) {
      console.error("Error loading countries:", e);
      setCountries([]);
    } finally {
      setLoadingCountries(false);
    }
  }, []);

  // Load ALL holidays
  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        setLoadingHolidays(true);
        const hd = new Holidays();
        hd.init(selectedCountry);
        const holidayData = hd.getHolidays(selectedYear);
        const formatted: Holiday[] = holidayData.map((h: any) => ({
          date: h.date.split(" ")[0],
          name: h.name,
          type: h.type || "public",
          substitute: h.substitute || false,
          note: h.note || "",
        }));
        setHolidays(formatted);
      } catch (error) {
        console.error("Error fetching holidays:", error);
        setHolidays([]);
      } finally {
        setLoadingHolidays(false);
      }
    };
    fetchHolidays();
  }, [selectedCountry, selectedYear]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(e.target as Node)) {
        setYearDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Sort countries inside dropdown
  const sortedCountries = useMemo(() => {
    let list = [...countries];
    if (countrySearch.trim()) {
      const q = countrySearch.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q)
      );
    }
    if (sortMode === "az") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortMode === "za") {
      list.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortMode === "random") {
      list = [...list].sort(() => Math.random() - 0.5);
    }
    return list;
  }, [countries, countrySearch, sortMode]);

  // Cycle sort mode
  const cycleSortMode = () => {
    setSortMode(prev => {
      if (prev === "az") return "za";
      if (prev === "za") return "random";
      return "az";
    });
  };

  const sortConfig = {
    az: { icon: ArrowUpAZ, label: t.holidays?.sortAZ || "A → Z" },
    za: { icon: ArrowDownZA, label: t.holidays?.sortZA || "Z → A" },
    random: { icon: Shuffle, label: t.holidays?.sortRandom || "Random" },
  };

  const SortIcon = sortConfig[sortMode].icon;

  // Split holidays
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, [currentTime]);

  const { upcoming, past } = useMemo(() => {
    const up: Holiday[] = [];
    const pa: Holiday[] = [];
    for (const h of holidays) {
      const hDate = new Date(h.date + "T00:00:00");
      if (hDate >= today) {
        up.push(h);
      } else {
        pa.push(h);
      }
    }
    up.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    pa.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return { upcoming: up, past: pa };
  }, [holidays, today]);

  const nextHoliday = upcoming[0] || null;

  // Live countdown
  const countdownText = useMemo(() => {
    if (!nextHoliday) return t.holidays?.noUpcoming || "No upcoming holidays";
    return formatCountdown(nextHoliday.date, t);
  }, [nextHoliday, currentTime, t]);

  // Clock formatting
  const timeStr = useMemo(() => {
    let h = currentTime.getHours();
    const m = String(currentTime.getMinutes()).padStart(2, "0");
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return { hours: String(h).padStart(2, "0"), minutes: m, ampm };
  }, [currentTime]);

  const selectedCountryName = useMemo(() => {
    const c = countries.find(c => c.code === selectedCountry);
    return c?.name || selectedCountry;
  }, [selectedCountry, countries]);

  // Year options
  const yearOptions = useMemo(() =>
    Array.from({ length: 11 }, (_, i) => currentYear - 5 + i),
  [currentYear]);

  if (loadingCountries) {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
    );
  }

  return (
      <div
        dir={isRTL ? "rtl" : "ltr"}
        className="max-w-[1200px] mx-auto px-6 py-5 pb-20"
      >

        {/* ===== TOP ROW: Clock + Next Holiday ===== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          {/* Clock Card */}
          <div className="relative overflow-hidden rounded-[24px] bg-card border border-border p-6 text-center group hover:border-primary/30 transition-all duration-300">
            <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-primary/[0.05] blur-3xl pointer-events-none group-hover:bg-primary/[0.08] transition-all" />
            <div className="relative z-10">
              <div className={cn(
                "flex items-center justify-center gap-2 mb-2",
                isRTL && "flex-row-reverse"
              )}>
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
                  {t.holidays?.currentTime || "Current Time"}
                </span>
              </div>
              <div className="text-[48px] font-black tracking-tight leading-none text-foreground tabular-nums">
                {timeStr.hours}:{timeStr.minutes}
              </div>
              <div className="text-xs font-bold text-primary mt-2">
                {getFullDate(currentTime.toISOString().split("T")[0])}
              </div>
            </div>
          </div>

          {/* Next Holiday Card */}
          <div className="relative overflow-hidden rounded-[24px] bg-primary p-6 text-center flex flex-col justify-center items-center group">
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-primary-foreground/[0.06] blur-3xl pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-primary-foreground/[0.04] blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <div className={cn(
                "text-[10px] font-bold tracking-[0.2em] text-primary-foreground/60 uppercase mb-2",
                isRTL ? "text-right" : "text-left"
              )}>
                {t.holidays?.nextHoliday || "Next Holiday"}
              </div>
              {loadingHolidays ? (
                <Loader2 className="w-6 h-6 text-primary-foreground/70 animate-spin mx-auto" />
              ) : nextHoliday ? (
                <>
                  <div className="text-[24px] font-black text-primary-foreground leading-tight mb-3">
                    {nextHoliday.name}
                  </div>
                  <div className="inline-flex items-center px-5 py-1.5 rounded-full bg-primary-foreground/15 backdrop-blur-sm border border-primary-foreground/10">
                    <span className="text-xs font-bold text-primary-foreground tabular-nums">
                      {countdownText}
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-primary-foreground/70 text-sm font-semibold">
                  {t.holidays?.noUpcoming || "No upcoming holidays"}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ===== COUNTRY + YEAR SELECTORS ROW ===== */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-5">

          {/* Country Dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={cn(
                "flex items-center gap-3 px-5 py-3 rounded-xl border transition-all min-w-[260px] justify-between",
                dropdownOpen
                  ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "bg-card border-border hover:border-primary/40 text-foreground",
                isRTL && "flex-row-reverse"
              )}
            >
              <div className={cn(
                "flex items-center gap-3",
                isRTL && "flex-row-reverse"
              )}>
                <ReactCountryFlag
                  countryCode={selectedCountry}
                  svg
                  style={{ width: "1.5em", height: "1.5em" }}
                  title={selectedCountryName}
                />
                <span className={cn(
                  "text-sm font-bold",
                  dropdownOpen ? "text-primary-foreground" : "text-foreground"
                )}>
                  {selectedCountryName}
                </span>
              </div>
              <ChevronDown
                className={cn(
                  "w-4 h-4 transition-transform duration-200",
                  dropdownOpen ? "text-primary-foreground rotate-180" : "text-muted-foreground"
                )}
              />
            </button>

            {/* Country Dropdown Menu */}
            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "absolute top-full mt-3 rounded-3xl bg-background border border-border shadow-2xl z-50 overflow-hidden",
                    isRTL ? "right-0 left-auto" : "left-0 right-auto"
                  )}
                >
                  {/* Search + Sort Row */}
                  <div className="p-4 border-b border-border">
                    <div className={cn(
                      "flex items-center gap-2",
                      isRTL && "flex-row-reverse"
                    )}>
                      <div className="relative flex-1">
                        <Search className={cn(
                          "absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground",
                          isRTL ? "right-3.5" : "left-3.5"
                        )} />
                        <input
                          type="text"
                          value={countrySearch}
                          onChange={(e) => setCountrySearch(e.target.value)}
                          placeholder={t.holidays?.searchCountry || "Search country..."}
                          className={cn(
                            "w-full py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all",
                            isRTL ? "pr-10 pl-9" : "pl-10 pr-9"
                          )}
                          autoFocus
                        />
                        {countrySearch && (
                          <button
                            onClick={() => setCountrySearch("")}
                            className={cn(
                              "absolute top-1/2 -translate-y-1/2",
                              isRTL ? "left-3" : "right-3"
                            )}
                          >
                            <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                          </button>
                        )}
                      </div>
                      {/* Sort Toggle Button */}
                      <button
                        onClick={cycleSortMode}
                        className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-muted border border-border hover:border-primary/40 transition-all shrink-0"
                        title={`Sort: ${sortConfig[sortMode].label}`}
                      >
                        <SortIcon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">
                          {sortConfig[sortMode].label}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Country list */}
                  <div className="max-h-[340px] overflow-y-auto">
                    {sortedCountries.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                        {t.holidays?.noCountriesFound || "No countries found"}
                      </div>
                    ) : (
                      sortedCountries.map((country) => (
                        <button
                          key={country.code}
                          onClick={() => {
                            setSelectedCountry(country.code);
                            setDropdownOpen(false);
                            setCountrySearch("");
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 px-5 py-3 transition-colors hover:bg-primary/[0.06]",
                            selectedCountry === country.code && "bg-primary/[0.08]",
                            isRTL ? "text-right flex-row-reverse" : "text-left"
                          )}
                        >
                          <ReactCountryFlag
                            countryCode={country.code}
                            svg
                            style={{ width: "1.4em", height: "1.4em" }}
                            title={country.name}
                          />
                          <span className={cn(
                            "text-sm flex-1",
                            selectedCountry === country.code
                              ? "font-bold text-foreground"
                              : "text-muted-foreground"
                          )}>
                            {country.name}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground/40">
                            {country.code}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Year Small Toggle Dropdown */}
          <div ref={yearDropdownRef} className="relative">
            <button
              onClick={() => setYearDropdownOpen(!yearDropdownOpen)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 rounded-xl border transition-all",
                yearDropdownOpen
                  ? "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "bg-card border-border hover:border-primary/40 text-foreground",
                isRTL && "flex-row-reverse"
              )}
            >
              <span className={cn(
                "text-sm font-bold",
                yearDropdownOpen ? "text-primary-foreground" : "text-foreground"
              )}>
                {selectedYear}
              </span>
              <ChevronDown
                className={cn(
                  "w-4 h-4 transition-transform duration-200",
                  yearDropdownOpen ? "text-primary-foreground rotate-180" : "text-muted-foreground"
                )}
              />
            </button>

            {/* Year Dropdown Menu */}
            <AnimatePresence>
              {yearDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className={cn(
                    "absolute top-full mt-2 rounded-2xl bg-background border border-border shadow-xl z-50 overflow-hidden py-1",
                    isRTL ? "right-0 left-auto" : "left-0 right-auto"
                  )}
                >
                  {yearOptions.map((year) => (
                    <button
                      key={year}
                      onClick={() => {
                        setSelectedYear(year);
                        setYearDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full px-4 py-2 text-sm font-bold transition-colors hover:bg-primary/[0.06]",
                        selectedYear === year
                          ? "bg-primary/[0.08] text-foreground"
                          : "text-muted-foreground",
                        isRTL ? "text-right" : "text-left"
                      )}
                    >
                      {year}
                      {year === currentYear && (
                        <span className={cn(
                          "text-[10px] font-normal text-primary",
                          isRTL ? "mr-2" : "ml-2"
                        )}>
                          {t.holidays?.now || "now"}
                        </span>
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

        {/* ===== LOADING STATE ===== */}
        {loadingHolidays && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
        )}

        {/* ===== UPCOMING HOLIDAYS ===== */}
        {!loadingHolidays && upcoming.length > 0 && (
          <>
            <div className={cn(
              "flex items-center gap-3 mb-4 px-1",
              isRTL && "flex-row-reverse justify-end"
            )}>
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase">
                {t.holidays?.upcoming || "Upcoming Holidays"}
              </span>
              <span className="text-[10px] font-bold text-muted-foreground/50 bg-muted px-2 py-0.5 rounded-full">
                {upcoming.length}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mb-10">
              {upcoming.map((holiday, index) => (
                <HolidayCard
                  key={`${holiday.date}-${holiday.name}`}
                  holiday={holiday}
                  index={index}
                  isHighlighted={index === 0}
                  currentTime={currentTime}
                  t={t}
                  isRTL={isRTL}
                />
              ))}
            </div>
          </>
        )}

        {/* ===== PAST HOLIDAYS ===== */}
        {!loadingHolidays && past.length > 0 && (
          <>
            <div className={cn(
              "flex items-center gap-3 mb-4 px-1",
              isRTL && "flex-row-reverse justify-end"
            )}>
              <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
              <span className="text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase">
                {t.holidays?.past || "Past Holidays"}
              </span>
              <span className="text-[10px] font-bold text-muted-foreground/50 bg-muted px-2 py-0.5 rounded-full">
                {past.length}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {past.slice(0, 12).map((holiday, index) => (
                <HolidayCard
                  key={`${holiday.date}-${holiday.name}`}
                  holiday={holiday}
                  index={index}
                  isPast
                  currentTime={currentTime}
                  t={t}
                  isRTL={isRTL}
                />
              ))}
            </div>
          </>
        )}

        {/* ===== EMPTY STATE ===== */}
        {!loadingHolidays && holidays.length === 0 && (
          <div className={cn(
            "text-center py-16",
            isRTL ? "text-right" : "text-left"
          )}>
            <div className="text-muted-foreground text-lg font-semibold mb-2">
              {t.holidays?.noHolidaysFound || "No holidays found"}
            </div>
            <div className="text-muted-foreground/50 text-sm">
              {selectedCountryName} {t.holidays?.in || "in"} {selectedYear}
            </div>
          </div>
        )}

        {/* SEO Content Section */}
        <div className={cn(
          "w-full pt-8",
          isRTL ? "text-right" : "text-left"
        )}>
          <SeoContent pageKey="holidays" />
        </div>
      </div>
  );
}

// ===== MAIN EXPORT WITH SUSPENSE =====
export default function HolidaysPage() {
  return (
    <Suspense fallback={<Loading />}>
      <HolidaysPageContent />
    </Suspense>
  );
}