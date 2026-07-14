"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { formatInTimeZone } from "date-fns-tz";
import {
  Plus,
  X,
  Search,
  MapPin,
  Clock,
  Globe,
  Moon,
  Check,
  Sun,
  ChevronDown,
  ArrowUpDown,
  ArrowUpAZ,
  ArrowDownZA,
  Users,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";
import ReactCountryFlag from "react-country-flag";
import ct from "countries-and-timezones";
import { Country, State, City } from "country-state-city";
import { cn } from "@/lib/utils";
import { SeoContent } from "@/components/SeoContent";
import Loading from "@/app/loading";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface CityData {
  name: string;
  countryCode: string;
  countryName: string;
  stateCode: string;
  stateName: string;
  timeZone: string;
  utcOffset: number;
  utcOffsetStr: string;
  latitude: string;
  longitude: string;
  population?: number;
}

interface CountryData {
  isoCode: string;
  name: string;
  phonecode: string;
  flag: string;
  currency: string;
  latitude: string;
  longitude: string;
  timezones: Array<{
    zoneName: string;
    gmtOffset: number;
    gmtOffsetName: string;
    abbreviation: string;
    tzName: string;
  }>;
}

type SortOption =
  | "alphabet-asc"
  | "alphabet-desc"
  | "local-time"
  | "utc-offset"
  | "population";

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const MODAL_ANIMATION = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 20 },
  transition: { type: "spring" as const, damping: 25, stiffness: 300 },
};

const CARD_ANIMATION = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.9, y: 20 },
  transition: { type: "spring" as const, stiffness: 300, damping: 25 },
};

// ═══════════════════════════════════════════════════════════════════════════
// SLUG HELPERS — NEW: city-country format to avoid collisions
// ═══════════════════════════════════════════════════════════════════════════

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Generate slug from city name + country code: "new-york-us" */
function getCitySlug(cityName: string, countryCode: string): string {
  return `${slugify(cityName)}-${countryCode.toLowerCase()}`;
}

/** Generate slug from full CityData object */
function getCitySlugFromData(city: CityData): string {
  return getCitySlug(city.name, city.countryCode);
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function getPrimaryTimezone(countryCode: string): {
  name: string;
  utcOffset: number;
  utcOffsetStr: string;
} | null {
  const timezones = ct.getTimezonesForCountry(countryCode);
  if (!timezones || timezones.length === 0) return null;
  const tz = timezones[0];
  return {
    name: tz.name,
    utcOffset: tz.utcOffset,
    utcOffsetStr: tz.utcOffsetStr,
  };
}

function normalizeCityName(name: string): string {
  return name
    .replace(/\bCity\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ═══════════════════════════════════════════════════════════════════════════
// DATABASE BUILDER (memoized singleton)
// ═══════════════════════════════════════════════════════════════════════════

let cityDatabaseCache: ReturnType<typeof buildCityDatabase> | null = null;

function buildCityDatabase(): {
  allCities: CityData[];
  allCountries: CountryData[];
  countryMap: Map<string, CountryData>;
  cityByCountry: Map<string, CityData[]>;
  searchIndex: Map<string, Set<string>>;
} {
  if (cityDatabaseCache) return cityDatabaseCache;

  const countries = Country.getAllCountries() as CountryData[];
  const allCountries = countries
    .filter((c) => c.isoCode && c.name)
    .sort((a, b) => a.name.localeCompare(b.name));

  const countryMap = new Map<string, CountryData>();
  allCountries.forEach((c) => countryMap.set(c.isoCode, c));

  const allCities: CityData[] = [];
  const cityByCountry = new Map<string, CityData[]>();
  const searchIndex = new Map<string, Set<string>>();

  const addToIndex = (key: string, cityId: string) => {
    const k = key.toLowerCase().trim();
    if (!k) return;
    if (!searchIndex.has(k)) searchIndex.set(k, new Set());
    searchIndex.get(k)!.add(cityId);
  };

  for (const country of allCountries) {
    const countryCode = country.isoCode;
    const countryTz = getPrimaryTimezone(countryCode);
    if (!countryTz) continue;

    const states = State.getStatesOfCountry(countryCode);
    const stateMap = new Map<string, string>();
    states.forEach((s) => stateMap.set(s.isoCode, s.name));

    const cities = City.getCitiesOfCountry(countryCode);
    if (!cities || cities.length === 0) continue;

    const countryCities: CityData[] = [];

    for (const city of cities) {
      const cityData: CityData = {
        name: city.name,
        countryCode: city.countryCode,
        countryName: country.name,
        stateCode: city.stateCode || "",
        stateName: stateMap.get(city.stateCode || "") || "",
        timeZone: countryTz.name,
        utcOffset: countryTz.utcOffset,
        utcOffsetStr: countryTz.utcOffsetStr,
        latitude: city.latitude || "",
        longitude: city.longitude || "",
      };

      const cityId = `${city.countryCode}-${city.name}`;
      allCities.push(cityData);
      countryCities.push(cityData);

      // Index city name and normalized name
      addToIndex(city.name, cityId);
      addToIndex(normalizeCityName(city.name), cityId);

      // Index country info
      addToIndex(country.name, cityId);
      addToIndex(countryCode, cityId);
      addToIndex(countryCode.toLowerCase(), cityId);

      // Index timezone
      addToIndex(countryTz.name, cityId);
      addToIndex(countryTz.name.replace(/_/g, " "), cityId);
      addToIndex(countryTz.utcOffsetStr, cityId);

      // Index state info
      if (cityData.stateName) addToIndex(cityData.stateName, cityId);
      if (cityData.stateCode) addToIndex(cityData.stateCode, cityId);

      // Index partial matches for city name (first 3 chars, first 5 chars)
      const normalized = normalizeCityName(city.name).toLowerCase();
      for (let i = 3; i <= Math.min(normalized.length, 8); i++) {
        addToIndex(normalized.slice(0, i), cityId);
      }
    }

    if (countryCities.length > 0) {
      cityByCountry.set(countryCode, countryCities);
    }
  }

  cityDatabaseCache = { allCities, allCountries, countryMap, cityByCountry, searchIndex };
  return cityDatabaseCache;
}

// ═══════════════════════════════════════════════════════════════════════════
// DEBOUNCE HOOK
// ═══════════════════════════════════════════════════════════════════════════

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE CONTENT (wrapped in Suspense)
// ═══════════════════════════════════════════════════════════════════════════

function WorldClockPageContent() {
  const { t, language } = useTranslation();
  const isRTL = language === "ar";
  const router = useRouter();
  const { worldClocks, removeWorldClock } = useAppStore();
  const [time, setTime] = useState<Date | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
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

  if (!time) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh]" role="status" aria-label={t.worldClock?.loading || "Loading..."}>
        <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div 
      dir={isRTL ? "rtl" : "ltr"}
      className="flex flex-col space-y-12 pb-12"
    >
      {/* Header */}
      <div className={cn(
        "flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6",
        isRTL && "flex-row-reverse"
      )}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "space-y-4 flex-1",
            isRTL ? "text-right" : "text-left"
          )}
        >
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-foreground">
            {t.worldClock?.title || "World Clock"}
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl leading-relaxed">
            {t.worldClock?.subtitle || "Track time across major global hubs in real-time."}
          </p>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2"
          aria-label={t.worldClock?.addClock || "Add Clock"}
        >
          <Plus className="w-5 h-5" aria-hidden="true" />
          {t.worldClock?.addClock || "Add Clock"}
        </motion.button>
      </div>

      {/* Clock Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {worldClocks.map((clock) => {
            const tz = ct.getTimezone(clock.timeZone);
            const hour = parseInt(formatInTimeZone(time, clock.timeZone, "H"));
            const isDay = hour >= 6 && hour < 18;
            // FIX: Use new city-country slug format
            const slug = getCitySlug(clock.name, clock.countryCode);

            return (
              <motion.div
                layout
                key={clock.id}
                {...CARD_ANIMATION}
                onClick={() => router.push(`/world-clock/${slug}`)}
                className="group relative p-6 sm:p-8 rounded-[2rem] bg-card border border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-500 overflow-hidden cursor-pointer"
              >
                {/* Day/Night gradient background */}
                <div
                  className={cn(
                    "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700",
                    isDay
                      ? "bg-gradient-to-br from-amber-500/5 via-transparent to-sky-500/5"
                      : "bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5"
                  )}
                  aria-hidden="true"
                />

                {/* Delete button - stops propagation to prevent navigation */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeWorldClock(clock.id);
                  }}
                  className={cn(
                    "absolute top-5 p-2.5 rounded-full bg-muted/80 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all duration-300 z-20 focus:outline-none focus:ring-2 focus:ring-destructive/30",
                    isRTL ? "left-5" : "right-5"
                  )}
                  aria-label={t.worldClock?.removeClock || "Remove clock"}
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>

                <div className="relative z-10 flex flex-col h-full justify-between space-y-6">
                  {/* Top: Flag + Name + Region */}
                  <div className={cn(
                    "flex items-start gap-4",
                    isRTL && "flex-row-reverse"
                  )}>
                    {/* Circular Flag */}
                    <div className="relative flex-shrink-0">
                      <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-border shadow-md group-hover:border-primary/30 transition-colors duration-300">
                        <ReactCountryFlag
                          countryCode={clock.countryCode}
                          svg
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                          aria-hidden="true"
                        />
                      </div>
                      {/* Day/Night indicator dot */}
                      <div
                        className={cn(
                          "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-card",
                          isDay ? "bg-amber-400" : "bg-indigo-400"
                        )}
                        aria-hidden="true"
                      >
                        {isDay ? (
                          <Sun className="w-2.5 h-2.5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" aria-hidden="true" />
                        ) : (
                          <Moon className="w-2.5 h-2.5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" aria-hidden="true" />
                        )}
                      </div>
                    </div>

                    <div className={cn(
                      "flex-1 min-w-0 pt-1",
                      isRTL ? "text-right" : "text-left"
                    )}>
                      <h2 className="text-xl font-display font-semibold text-foreground truncate">
                        {clock.name}
                      </h2>
                      <div className={cn(
                        "flex items-center gap-1.5 text-sm text-muted-foreground mt-1",
                        isRTL && "flex-row-reverse justify-end"
                      )}>
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                        <span className="truncate">
                          {clock.timeZone.replace(/_/g, " ")}
                        </span>
                      </div>
                      <div className={cn(
                        "flex items-center gap-1.5 text-xs text-muted-foreground/70 mt-0.5",
                        isRTL && "flex-row-reverse justify-end"
                      )}>
                        <Clock className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
                        <span>UTC{tz?.utcOffsetStr}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom: Time Display */}
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-1" dir="ltr">
                      <span className="text-5xl sm:text-6xl font-mono tabular-nums tracking-tighter text-foreground font-light">
                        {formatInTimeZone(time, clock.timeZone, "HH:mm")}
                      </span>
                      <span className="text-xl sm:text-2xl font-mono text-muted-foreground/50 font-light">
                        {formatInTimeZone(time, clock.timeZone, ":ss")}
                      </span>
                    </div>
                    <div className={cn(
                      "flex items-center justify-between",
                      isRTL && "flex-row-reverse"
                    )}>
                      <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        {formatInTimeZone(time, clock.timeZone, "EEEE, MMM d")}
                      </span>
                      <span
                        className={cn(
                          "text-xs font-medium px-2 py-0.5 rounded-full",
                          isDay
                            ? "bg-amber-500/10 text-amber-600"
                            : "bg-indigo-500/10 text-indigo-400"
                        )}
                      >
                        {isDay ? (t.worldClock?.day || "Day") : (t.worldClock?.night || "Night")}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* SEO Content Section */}
      <div className={cn(
        "w-full px-4 pb-12",
        isRTL ? "text-right" : "text-left"
      )}>
        <SeoContent pageKey="worldclock" />
      </div>

      <AddClockModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ADD CLOCK MODAL - OPTIMIZED WITH FAST SEARCH
// ═══════════════════════════════════════════════════════════════════════════

function AddClockModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { t, language } = useTranslation();
  const isRTL = language === "ar";
  const router = useRouter();
  const { addWorldClock, worldClocks } = useAppStore();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("alphabet-asc");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const listRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  // Faster debounce - 50ms for instant feedback
  const debouncedSearch = useDebounce(search, 50);

  // Get translations with fallbacks
  const popup = t.worldClock?.popup || {};
  const sortOptions = popup.sortOptions || {};

  // Update current time every second for live city cards
  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  // Build database once
  const db = useMemo(() => buildCityDatabase(), []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setShowSortDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset filters when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setSortBy("alphabet-asc");
      setShowSortDropdown(false);
    }
  }, [isOpen]);

  // ─── OPTIMIZED SEARCH Logic ─────────────────────────────────────────────

  const searchResults = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    if (!query) return null;

    const matchingIds = new Set<string>();

    // Direct index lookup - O(1) per key, very fast
    for (const [key, ids] of db.searchIndex.entries()) {
      if (key.startsWith(query) || key.includes(query)) {
        ids.forEach((id) => matchingIds.add(id));
      }
    }

    // Also check country names for broader matching
    for (const country of db.allCountries) {
      if (
        country.name.toLowerCase().includes(query) ||
        country.isoCode.toLowerCase() === query
      ) {
        const countryCities = db.cityByCountry.get(country.isoCode);
        if (countryCities) {
          countryCities.forEach((c) => matchingIds.add(`${c.countryCode}-${c.name}`));
        }
      }
    }

    // Limit results for better performance
    const results: CityData[] = [];
    let count = 0;
    const MAX_RESULTS = 100;
    
    for (const id of matchingIds) {
      if (count >= MAX_RESULTS) break;
      const city = db.allCities.find((c) => `${c.countryCode}-${c.name}` === id);
      if (city) {
        results.push(city);
        count++;
      }
    }

    return results;
  }, [debouncedSearch, db]);

  // ─── Browse Logic (no search) ───────────────────────────────────────────

  const browseResults = useMemo(() => {
    if (debouncedSearch.trim()) return null;

    const cities: CityData[] = [];
    for (const [, countryCities] of db.cityByCountry) {
      cities.push(...countryCities);
    }
    return cities;
  }, [debouncedSearch, db]);

  // ─── Get base items ────────────────────────────────────────────────────

  const baseItems = useMemo(() => {
    return searchResults || browseResults || [];
  }, [searchResults, browseResults]);

  // ─── SORT THE ITEMS (Cities) ───────────────────────────────────────────

  const sortedCities = useMemo(() => {
    if (baseItems.length === 0) return [];

    const sorted = [...baseItems];

    switch (sortBy) {
      case "alphabet-asc":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "alphabet-desc":
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "local-time": {
        const timeMap = new Map<string, number>();
        sorted.forEach(city => {
          const timeStr = formatInTimeZone(currentTime, city.timeZone, "HHmm");
          timeMap.set(city.name, parseInt(timeStr));
        });
        sorted.sort((a, b) => {
          const timeA = timeMap.get(a.name) || 0;
          const timeB = timeMap.get(b.name) || 0;
          return timeA - timeB;
        });
        break;
      }
      case "utc-offset":
        sorted.sort((a, b) => a.utcOffset - b.utcOffset);
        break;
      case "population":
        sorted.sort((a, b) => (b.population || 0) - (a.population || 0));
        break;
      default:
        break;
    }

    return sorted;
  }, [baseItems, sortBy, currentTime]);

  // ─── SORT THE COUNTRIES (For browse mode) ─────────────────────────────

  const sortedCountries = useMemo(() => {
    if (debouncedSearch.trim()) return db.allCountries;

    const sorted = [...db.allCountries];

    switch (sortBy) {
      case "alphabet-asc":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "alphabet-desc":
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "local-time": {
        const timeMap = new Map<string, number>();
        sorted.forEach(country => {
          const cities = db.cityByCountry.get(country.isoCode);
          if (cities && cities.length > 0) {
            const timeStr = formatInTimeZone(currentTime, cities[0].timeZone, "HHmm");
            timeMap.set(country.isoCode, parseInt(timeStr));
          } else {
            timeMap.set(country.isoCode, 0);
          }
        });
        sorted.sort((a, b) => {
          const timeA = timeMap.get(a.isoCode) || 0;
          const timeB = timeMap.get(b.isoCode) || 0;
          return timeA - timeB;
        });
        break;
      }
      case "utc-offset": {
        const offsetMap = new Map<string, number>();
        sorted.forEach(country => {
          const cities = db.cityByCountry.get(country.isoCode);
          if (cities && cities.length > 0) {
            offsetMap.set(country.isoCode, cities[0].utcOffset);
          } else {
            offsetMap.set(country.isoCode, 0);
          }
        });
        sorted.sort((a, b) => {
          const offsetA = offsetMap.get(a.isoCode) || 0;
          const offsetB = offsetMap.get(b.isoCode) || 0;
          return offsetA - offsetB;
        });
        break;
      }
      case "population": {
        const popMap = new Map<string, number>();
        sorted.forEach(country => {
          const cities = db.cityByCountry.get(country.isoCode);
          if (cities && cities.length > 0) {
            const totalPop = cities.reduce((sum, city) => sum + (city.population || 0), 0);
            popMap.set(country.isoCode, totalPop);
          } else {
            popMap.set(country.isoCode, 0);
          }
        });
        sorted.sort((a, b) => {
          const popA = popMap.get(a.isoCode) || 0;
          const popB = popMap.get(b.isoCode) || 0;
          return popB - popA;
        });
        break;
      }
      default:
        break;
    }

    return sorted;
  }, [db.allCountries, db.cityByCountry, sortBy, currentTime, debouncedSearch]);

  // ─── Group by Country (for city results) ──────────────────────────────

  const groupedResults = useMemo(() => {
    const groups = new Map<string, CityData[]>();
    
    for (const city of sortedCities) {
      if (!groups.has(city.countryName)) {
        groups.set(city.countryName, []);
      }
      groups.get(city.countryName)!.push(city);
    }
    
    return new Map([...groups.entries()].sort((a, b) => a[0].localeCompare(b[0])));
  }, [sortedCities]);

  // ─── Handlers ───────────────────────────────────────────────────────────

  const handleAdd = useCallback(
    (city: CityData) => {
      const alreadyAdded = worldClocks.some(
        (c) => c.timeZone === city.timeZone && c.name === city.name
      );
      if (alreadyAdded) return;

      addWorldClock({
        id: Date.now().toString(),
        name: city.name,
        timeZone: city.timeZone,
        countryCode: city.countryCode,
      });
      onClose();
      setSearch("");
    },
    [addWorldClock, worldClocks, onClose]
  );

  const isAdded = useCallback(
    (city: CityData) => {
      return worldClocks.some(
        (c) => c.timeZone === city.timeZone && c.name === city.name
      );
    },
    [worldClocks]
  );

  // ─── Sort Options ─────────────────────────────────────────────────────

  const sortOptionsList = [
    { value: "alphabet-asc" as SortOption, label: sortOptions.alphabetAsc || "A-Z", icon: <ArrowUpAZ className="w-3.5 h-3.5" /> },
    { value: "alphabet-desc" as SortOption, label: sortOptions.alphabetDesc || "Z-A", icon: <ArrowDownZA className="w-3.5 h-3.5" /> },
    { value: "local-time" as SortOption, label: sortOptions.localTime || "Local Time", icon: <Clock className="w-3.5 h-3.5" /> },
    { value: "utc-offset" as SortOption, label: sortOptions.utcOffset || "UTC Offset", icon: <Globe className="w-3.5 h-3.5" /> },
    { value: "population" as SortOption, label: sortOptions.population || "Population", icon: <Users className="w-3.5 h-3.5" /> },
  ];

  const activeSortLabel = sortOptionsList.find((o) => o.value === sortBy)?.label || "Sort";

  // ─── Handle sort selection ────────────────────────────────────────────

  const handleSortSelect = (value: SortOption) => {
    setSortBy(value);
    setShowSortDropdown(false);
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
  };

  // ─── Handle search change with instant feedback ──────────────────────

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            aria-hidden="true"
          />

          {/* Modal Card */}
          <motion.div
            {...MODAL_ANIMATION}
            className="relative w-full max-w-2xl bg-background border border-border rounded-[2rem] shadow-2xl flex flex-col overflow-hidden max-h-[90dvh]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            dir={isRTL ? "rtl" : "ltr"}
          >
            {/* ─── Sticky Header ─────────────────────────────────────────── */}
            <div className={cn(
              "flex items-center justify-between p-5 sm:p-6 border-b border-border/50 shrink-0 bg-card/80 backdrop-blur-xl z-20",
              isRTL && "flex-row-reverse"
            )}>
              <div className={cn(
                "flex items-center gap-3",
                isRTL && "flex-row-reverse order-2"
              )}>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-primary" aria-hidden="true" />
                </div>
                <div className={isRTL ? "text-right" : "text-left"}>
                  <h2 id="modal-title" className="text-lg font-semibold text-foreground">
                    {popup.title || t.worldClock?.addClock || "Add Clock"}
                  </h2>
                  <p className="text-xs text-muted-foreground" aria-live="polite">
                    {debouncedSearch.trim() ? sortedCities.length : sortedCountries.length} {popup.citiesFound || "Results found"}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className={cn(
                  "p-2.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30",
                  isRTL ? "order-1" : "order-2"
                )}
                aria-label={popup.close || "Close"}
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* ─── Sticky Search & Controls ────────────────────────────── */}
            <div className="shrink-0 space-y-3 p-4 sm:p-5 pb-3 sm:pb-4 bg-card/80 backdrop-blur-xl z-20 border-b border-border/50">
              {/* Search Bar - with instant feedback */}
              <div className="relative">
                <Search className={cn(
                  "absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground",
                  isRTL ? "right-4" : "left-4"
                )} aria-hidden="true" />
                <input
                  type="text"
                  autoFocus
                  placeholder={popup.searchPlaceholder || t.worldClock?.searchPlaceholder || "Search city or country..."}
                  value={search}
                  onChange={handleSearchChange}
                  className={cn(
                    "w-full bg-muted/50 border border-border rounded-xl py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 focus:bg-muted transition-all",
                    isRTL ? "pr-11 pl-4" : "pl-11 pr-4"
                  )}
                  aria-label={popup.searchLabel || "Search cities"}
                />
                {/* Clear button - shows when search has text */}
                {search && (
                  <button
                    onClick={() => {
                      setSearch("");
                      if (listRef.current) listRef.current.scrollTop = 0;
                    }}
                    className={cn(
                      "absolute top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors",
                      isRTL ? "left-4" : "right-4"
                    )}
                    aria-label={popup.clearSearch || "Clear search"}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Controls Row */}
              <div className={cn(
                "flex items-center justify-between",
                isRTL && "flex-row-reverse"
              )}>
                <div className={cn(
                  "flex items-center gap-2",
                  isRTL && "flex-row-reverse"
                )}>
                  <span className="text-xs text-muted-foreground">
                    {popup.sortBy || "Sort by"}
                  </span>

                  {/* Sort Selector */}
                  <div className="relative" ref={sortRef}>
                    <button
                      onClick={() => setShowSortDropdown(!showSortDropdown)}
                      className="flex items-center gap-2 py-2 px-3 rounded-xl text-sm font-medium bg-muted/50 border border-border hover:border-primary/30 hover:bg-muted transition-all focus:outline-none focus:ring-2 focus:ring-primary/30"
                      aria-expanded={showSortDropdown}
                      aria-haspopup="listbox"
                      aria-label={popup.sortBy || "Sort by"}
                    >
                      <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                      <span className="hidden sm:inline">{activeSortLabel}</span>
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 text-muted-foreground transition-transform",
                          showSortDropdown && "rotate-180"
                        )}
                        aria-hidden="true"
                      />
                    </button>

                <AnimatePresence>
                  {showSortDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className={cn(
                        "absolute top-full mt-2 w-56 bg-background border border-border rounded-2xl shadow-2xl z-50 p-2",
                        isRTL ? "right-0" : "left-0"
                      )}
                      role="listbox"
                      aria-label={typeof popup.sortOptions === 'string' ? popup.sortOptions : "Sort options"}
                    >
                      {sortOptionsList.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleSortSelect(option.value)}
                          className={cn(
                            "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors",
                            sortBy === option.value
                              ? "bg-primary/10 text-primary font-medium"
                              : "hover:bg-muted text-foreground"
                          )}
                          role="option"
                          aria-selected={sortBy === option.value}
                        >
                          {option.icon}
                          {option.label}
                          {sortBy === option.value && (
                            <Check className={cn(
                              "w-3.5 h-3.5 text-primary",
                              isRTL ? "mr-auto" : "ml-auto"
                            )} />
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>                  
                </div>
                </div>

                {/* Results count */}
                <span className="text-xs text-muted-foreground/60" aria-live="polite">
                  {debouncedSearch.trim() ? sortedCities.length : sortedCountries.length} {popup.results || "results"}
                </span>
              </div>
            </div>

            {/* ─── Scrollable Results ───────────────────────────────────── */}
            <div
              ref={listRef}
              className="flex-1 overflow-y-auto px-4 sm:px-5 py-4"
              style={{ scrollbarWidth: "thin" }}
              role="region"
              aria-label={popup.resultsList || "Search results"}
            >
              {/* No search → Show countries grid */}
              {!debouncedSearch.trim() && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2">
                    <Globe className="w-4 h-4 text-primary/60" aria-hidden="true" />
                    <h3 className="text-sm font-semibold text-muted-foreground">
                      {popup.browseTitle || "Browse by country"}
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {sortedCountries.map((country, index) => {
                      const cityCount = db.cityByCountry.get(country.isoCode)?.length || 0;
                      if (cityCount === 0) return null;

                      return (
                        <motion.button
                          key={country.isoCode}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(index * 0.003, 0.2) }}
                          onClick={() => {
                            setSearch(country.name);
                            if (listRef.current) listRef.current.scrollTop = 0;
                          }}
                          className={cn(
                            "flex items-center gap-3 p-3.5 rounded-2xl border border-border bg-card hover:border-primary/40 hover:bg-muted/50 hover:shadow-lg transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-primary/30",
                            isRTL ? "text-right flex-row-reverse" : "text-left"
                          )}
                        >
                          <div className="w-10 h-10 rounded-full overflow-hidden border border-border flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
                            <ReactCountryFlag
                              countryCode={country.isoCode}
                              svg
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              aria-hidden="true"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-foreground truncate">
                              {country.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {cityCount} {popup.cities || "cities"}
                            </div>
                          </div>
                          <ChevronDown className={cn(
                            "w-4 h-4 text-muted-foreground/40 flex-shrink-0 group-hover:text-primary/60 transition-colors",
                            isRTL ? "rotate-90" : "rotate-[-90deg]"
                          )} aria-hidden="true" />
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Has search → Show cities */}
              {debouncedSearch.trim() && (
                <div className="space-y-6">
                  {sortedCities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                        <Search className="w-8 h-8 text-muted-foreground/30" aria-hidden="true" />
                      </div>
                      <p className="text-muted-foreground font-medium">
                        {popup.noResults || t.worldClock?.noResults || "No results found"}
                      </p>
                      <p className="text-muted-foreground/50 text-sm mt-1 max-w-xs">
                        {popup.noResultsHint || t.worldClock?.noResultsHint || "Try searching for a different city or country"}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {[...groupedResults.entries()].map(([countryName, cities]) => (
                        <div key={countryName} className="space-y-2">
                          <div className={cn(
                            "flex items-center gap-2.5 sticky top-15 bg-background py-2 z-10",
                            isRTL && "flex-row-reverse justify-end"
                          )}>
                            {cities[0] && (
                              <ReactCountryFlag
                                countryCode={cities[0].countryCode}
                                svg
                                className="rounded-sm"
                                style={{ width: "22px", height: "16px" }}
                                aria-hidden="true"
                              />
                            )}
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              {countryName}
                            </h3>
                            <span className="text-xs text-muted-foreground/40">
                              ({cities.length})
                            </span>
                          </div>
                          <div className="space-y-2">
                            {cities.map((city, idx) => (
                              <CityCard
                                key={`${city.countryCode}-${city.name}-${idx}`}
                                city={city}
                                currentTime={currentTime}
                                isAdded={isAdded(city)}
                                onAdd={() => handleAdd(city)}
                                onNavigate={() => router.push(`/world-clock/${getCitySlugFromData(city)}`)}
                                popup={popup}
                                t={t}
                                isRTL={isRTL}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CITY CARD COMPONENT — Updated with navigation support
// ═══════════════════════════════════════════════════════════════════════════

function CityCard({
  city,
  currentTime,
  isAdded,
  onAdd,
  onNavigate,
  popup,
  t,
  isRTL,
}: {
  city: CityData;
  currentTime: Date;
  isAdded: boolean;
  onAdd: () => void;
  onNavigate: () => void;
  popup: any;
  t: any;
  isRTL: boolean;
}) {
  const localTime = formatInTimeZone(currentTime, city.timeZone, "HH:mm");
  const localDate = formatInTimeZone(currentTime, city.timeZone, "EEE, MMM d");
  const hour = parseInt(formatInTimeZone(currentTime, city.timeZone, "H"));
  const isDay = hour >= 6 && hour < 18;

  return (
    <div
      className={cn(
        "w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl border transition-all duration-200 group",
        isAdded
          ? "bg-muted/30 border-transparent opacity-50"
          : "bg-card border-border hover:border-primary/40 hover:bg-muted/40 hover:shadow-lg hover:shadow-primary/5",
        isRTL ? "text-right flex-row-reverse" : "text-left"
      )}
    >
      {/* Flag — clickable to navigate */}
      <button
        onClick={onNavigate}
        className="flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden border border-border shadow-sm group-hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-primary/30"
        aria-label={`View ${city.name} details`}
      >
        <ReactCountryFlag
          countryCode={city.countryCode}
          svg
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
          aria-hidden="true"
        />
      </button>

      {/* Info — clickable to navigate */}
      <button
        onClick={onNavigate}
        className={cn(
          "flex-1 min-w-0 focus:outline-none",
          isRTL ? "text-right" : "text-left"
        )}
      >
        <div className={cn(
          "flex items-center gap-2",
          isRTL && "flex-row-reverse justify-end"
        )}>
          <span className="font-semibold text-foreground text-sm truncate group-hover:text-primary transition-colors">
            {city.name}
          </span>
          {city.stateName && (
            <span className="text-xs text-muted-foreground/50 truncate hidden sm:inline">
              {city.stateName}
            </span>
          )}
        </div>
        <div className={cn(
          "flex items-center gap-2 text-xs text-muted-foreground mt-0.5",
          isRTL && "flex-row-reverse justify-end"
        )}>
          <span className="truncate">{city.countryName}</span>
          <span className="text-muted-foreground/20" aria-hidden="true">•</span>
          <span className="font-mono text-muted-foreground/60">{city.timeZone.replace(/_/g, " ")}</span>
        </div>
      </button>

      {/* Live Time */}
      <div className={cn(
        "flex-shrink-0 hidden sm:block",
        isRTL ? "text-left" : "text-right"
      )}>
        <div className="text-base font-mono font-semibold text-foreground">
          {localTime}
        </div>
        <div className="text-[10px] text-muted-foreground/60">{localDate}</div>
      </div>

      {/* UTC Offset */}
      <div className="flex-shrink-0 text-xs font-mono text-muted-foreground bg-muted/70 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg border border-border/50">
        UTC{city.utcOffsetStr}
      </div>

      {/* Day/Night indicator */}
      <div
        className={cn(
          "flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center border border-border/50",
          isDay ? "bg-amber-500/10" : "bg-indigo-500/10"
        )}
        aria-hidden="true"
      >
        {isDay ? (
          <Sun className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500" aria-hidden="true" />
        ) : (
          <Moon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-400" aria-hidden="true" />
        )}
      </div>

      {/* Add button or Added checkmark */}
      {isAdded ? (
        <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary/10 flex items-center justify-center">
          <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" aria-hidden="true" />
        </div>
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAdd();
          }}
          className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
          aria-label={`Add ${city.name} to world clocks`}
        >
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

// ===== MAIN EXPORT WITH SUSPENSE =====
export default function WorldClockPage() {
  return (
    <Suspense fallback={<Loading />}>
      <WorldClockPageContent />
    </Suspense>
  );
}