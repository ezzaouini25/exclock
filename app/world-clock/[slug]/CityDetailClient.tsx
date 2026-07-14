"use client";

import React, { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { formatInTimeZone } from "date-fns-tz";
import dynamic from "next/dynamic";
import * as Icons from "lucide-react";
import ReactCountryFlag from "react-country-flag";
import ct from "countries-and-timezones";
import { Country, State, City } from "country-state-city";
import { cn } from "@/lib/utils";
import { SeoContent } from "@/components/SeoContent";
import Loading from "@/app/loading";
import { useTranslation } from "@/lib/i18n";

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
}

const AR_DIGITS: Record<string, string> = {
  "0": "٠", "1": "١", "2": "٢", "3": "٣", "4": "٤",
  "5": "٥", "6": "٦", "7": "٧", "8": "٨", "9": "٩",
};

function arNum(s: string): string {
  return s.replace(/[0-9]/g, (d) => AR_DIGITS[d] ?? d);
}

function loc(s: string, isAr: boolean): string {
  return isAr ? arNum(s) : s;
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function getCitySlug(city: CityData): string {
  return `${slugify(city.name)}-${city.countryCode.toLowerCase()}`;
}

const FAMOUS_CITY_NAMES = new Set([
  "New York", "Los Angeles", "Chicago", "Miami", "San Francisco", "Las Vegas",
  "Seattle", "Boston", "Washington", "Dallas", "Houston", "Philadelphia",
  "Atlanta", "Denver", "Phoenix", "Detroit", "Minneapolis", "Portland",
  "Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa", "Edmonton",
  "Mexico City", "Guadalajara", "Monterrey", "Cancun", "Tijuana",
  "Sao Paulo", "Rio de Janeiro", "Brasilia", "Buenos Aires", "Lima",
  "Bogota", "Santiago", "Caracas", "Quito", "La Paz", "Montevideo",
  "London", "Manchester", "Birmingham", "Glasgow", "Edinburgh", "Liverpool",
  "Paris", "Marseille", "Lyon", "Nice", "Toulouse",
  "Berlin", "Munich", "Hamburg", "Cologne", "Frankfurt", "Stuttgart", "Dusseldorf",
  "Rome", "Milan", "Naples", "Turin", "Florence", "Venice",
  "Madrid", "Barcelona", "Valencia", "Seville", "Bilbao",
  "Amsterdam", "Rotterdam",
  "Brussels", "Antwerp",
  "Vienna", "Salzburg",
  "Zurich", "Geneva", "Basel", "Bern",
  "Stockholm", "Gothenburg", "Malmo",
  "Oslo", "Bergen",
  "Copenhagen", "Aarhus",
  "Helsinki", "Espoo",
  "Warsaw", "Krakow", "Gdansk",
  "Prague", "Brno",
  "Budapest", "Debrecen",
  "Athens", "Thessaloniki",
  "Lisbon", "Porto",
  "Dublin", "Cork",
  "Zagreb", "Split",
  "Belgrade", "Novi Sad",
  "Bucharest", "Cluj-Napoca",
  "Sofia", "Plovdiv",
  "Bratislava", "Kosice",
  "Ljubljana",
  "Tallinn",
  "Riga",
  "Vilnius",
  "Moscow", "Saint Petersburg", "Novosibirsk", "Yekaterinburg", "Kazan",
  "Kiev", "Kharkiv", "Odessa",
  "Minsk",
  "Istanbul", "Ankara", "Izmir", "Antalya",
  "Tokyo", "Osaka", "Kyoto", "Yokohama", "Nagoya", "Sapporo", "Fukuoka", "Kobe",
  "Beijing", "Shanghai", "Guangzhou", "Shenzhen", "Chengdu", "Hangzhou", "Wuhan", "Xi'an",
  "Hong Kong",
  "Taipei", "Kaohsiung",
  "Seoul", "Busan", "Incheon", "Daegu",
  "Bangkok", "Chiang Mai", "Phuket",
  "Singapore",
  "Kuala Lumpur", "George Town",
  "Jakarta", "Surabaya", "Bandung",
  "Manila", "Cebu", "Davao",
  "Hanoi", "Ho Chi Minh City", "Da Nang",
  "Phnom Penh", "Siem Reap",
  "Vientiane",
  "Yangon", "Mandalay",
  "Colombo", "Kandy",
  "Dhaka", "Chittagong",
  "Karachi", "Lahore", "Islamabad", "Faisalabad",
  "Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata", "Hyderabad", "Pune", "Ahmedabad", "Jaipur",
  "Kathmandu", "Pokhara",
  "Thimphu",
  "Male",
  "Dubai", "Abu Dhabi", "Sharjah",
  "Riyadh", "Jeddah", "Mecca", "Medina", "Dammam",
  "Doha",
  "Kuwait City",
  "Manama",
  "Muscat",
  "Tehran", "Isfahan", "Shiraz",
  "Baghdad", "Basra",
  "Amman",
  "Beirut",
  "Damascus", "Aleppo",
  "Sanaa",
  "Jerusalem", "Tel Aviv", "Haifa",
  "Baku",
  "Tbilisi",
  "Yerevan",
  "Astana", "Almaty",
  "Tashkent", "Samarkand",
  "Ashgabat",
  "Dushanbe",
  "Bishkek",
  "Ulaanbaatar",
  "Cairo", "Alexandria", "Giza", "Sharm El Sheikh",
  "Lagos", "Abuja", "Kano",
  "Johannesburg", "Cape Town", "Durban", "Pretoria",
  "Nairobi", "Mombasa",
  "Addis Ababa",
  "Khartoum",
  "Tunis", "Sfax",
  "Algiers", "Oran",
  "Casablanca", "Rabat", "Marrakesh", "Fez",
  "Accra", "Kumasi",
  "Dakar",
  "Abidjan",
  "Dar es Salaam", "Zanzibar",
  "Kampala",
  "Kigali",
  "Lusaka",
  "Harare",
  "Maputo",
  "Antananarivo",
  "Port Louis",
  "Windhoek",
  "Gaborone",
  "Luanda",
  "Kinshasa",
  "Brazzaville",
  "Libreville",
  "Yaounde", "Douala",
  "Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Gold Coast", "Canberra",
  "Auckland", "Wellington", "Christchurch", "Hamilton",
  "Fiji", "Suva",
  "Honolulu",
  "Reykjavik",
  "Nuuk",
  "Anchorage",
]);

const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((m) => m.Popup), { ssr: false });

let DB_CACHE: { allCities: CityData[]; allCountries: any[] } | null = null;

function buildDb() {
  if (DB_CACHE) return DB_CACHE;
  const countries = Country.getAllCountries()
    .filter((c: any) => c.isoCode && c.name)
    .sort((a: any, b: any) => a.name.localeCompare(b.name));
  const allCities: CityData[] = [];
  for (const country of countries) {
    const cc = country.isoCode;
    const tzs = ct.getTimezonesForCountry(cc);
    if (!tzs?.length) continue;
    const tz = tzs[0];
    const states = State.getStatesOfCountry(cc);
    const stateMap = new Map(states.map((s: any) => [s.isoCode, s.name]));
    const cities = City.getCitiesOfCountry(cc);
    if (!cities?.length) continue;
    for (const city of cities) {
      allCities.push({
        name: city.name,
        countryCode: city.countryCode,
        countryName: country.name,
        stateCode: city.stateCode || "",
        stateName: stateMap.get(city.stateCode || "") || "",
        timeZone: tz.name,
        utcOffset: tz.utcOffset,
        utcOffsetStr: tz.utcOffsetStr,
        latitude: city.latitude || "",
        longitude: city.longitude || "",
      });
    }
  }
  DB_CACHE = { allCities, allCountries: countries };
  return DB_CACHE;
}

function dedupe(cities: CityData[], limit: number) {
  const seen = new Set<string>();
  return cities.filter((c) => { const k = `${c.countryCode}-${c.name}`; if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, limit);
}

const CARD = {
  base: "bg-card border border-border rounded-2xl transition-all duration-300",
  hover: "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
  pad: "p-5",
  header: "flex items-center justify-between px-5 py-4 border-b border-border",
};

function CityMap({ lat, lng, cityName, countryName, isDay, t }: {
  lat: string; lng: string; cityName: string; countryName: string; isDay: boolean; t: any;
}) {
  const [expanded, setExpanded] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const latitude = parseFloat(lat) || 0;
  const longitude = parseFloat(lng) || 0;

  useEffect(() => {
    let alive = true;
    (async () => {
        // Load Leaflet CSS from CDN
        const cssId = 'leaflet-css';
        if (typeof document !== 'undefined' && !document.getElementById(cssId)) {
          const link = document.createElement('link');
          link.id = cssId;
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }      
      const L = await import("leaflet");
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      });
      if (alive) setLoaded(true);
    })();
    return () => { alive = false; };
  }, []);

  if (!loaded) {
    return (
      <div className={cn(CARD.base, CARD.hover, "overflow-hidden")}>
        <div className={CARD.header}>
          <div className="flex items-center gap-2">
            <Icons.Map className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">{t.worldClockCity?.map || "Location Map"}</span>
          </div>
        </div>
        <div className="flex items-center justify-center h-[280px] bg-muted/30">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Icons.Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <p className="text-sm text-muted-foreground font-medium">{t.worldClockCity?.loadingMap || "Loading map..."}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div className={cn(CARD.base, "overflow-hidden transition-all duration-500", expanded ? "col-span-full" : "")} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className={CARD.header}>
        <div className="flex items-center gap-2">
          <Icons.Map className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">{t.worldClockCity?.map || "Location Map"}</span>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          {expanded ? <Icons.Minimize2 className="w-4 h-4 text-muted-foreground" /> : <Icons.Maximize2 className="w-4 h-4 text-muted-foreground" />}
        </button>
      </div>
      <div className={cn("relative overflow-hidden", expanded ? "h-[450px] sm:h-[550px]" : "h-[280px]")} style={{ minHeight: 200 }}>
        <MapContainer center={[latitude, longitude]} zoom={expanded ? 13 : 10} style={{ height: "100%", width: "100%", zIndex: 1 }} zoomControl={false} attributionControl={false}>
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[latitude, longitude]}>
            <Popup>
              <div className="text-center">
                <p className="font-semibold">{cityName}</p>
                <p className="text-sm text-muted-foreground">{countryName}</p>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>
      <div className="flex items-center justify-between px-5 py-3 text-xs text-muted-foreground border-t border-border">
        <span>{t.worldClockCity?.osm || "OpenStreetMap"}</span>
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", isDay ? "bg-amber-400" : "bg-indigo-400")} />
          <span>{isDay ? (t.worldClock?.day || "Day") : (t.worldClock?.night || "Night")}</span>
        </div>
      </div>
    </motion.div>
  );
}

function InfoCard({ icon, label, value, subValue }: { icon: React.ReactNode; label: string; value: string; subValue?: string }) {
  return (
    <div className={cn(CARD.base, CARD.hover, CARD.pad, "flex flex-col justify-between h-full")}>
      <div className="flex items-center gap-2 text-muted-foreground mb-3">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <div>
        <p className="text-xl font-semibold text-foreground">{value}</p>
        {subValue && <p className="text-xs text-muted-foreground mt-1">{subValue}</p>}
      </div>
    </div>
  );
}

function CityRow({ city, router }: { city: CityData; router: ReturnType<typeof useRouter> }) {
  return (
    <motion.button initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
      onClick={() => router.push(`/world-clock/${getCitySlug(city)}`)}
      className={cn(CARD.base, CARD.hover, CARD.pad, "flex items-center gap-3 text-left group w-full")}>
      <div className="w-9 h-9 rounded-full overflow-hidden border border-border flex-shrink-0">
        <ReactCountryFlag countryCode={city.countryCode} svg style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{city.name}</p>
        <p className="text-xs text-muted-foreground truncate">{city.countryName}</p>
      </div>
      <Icons.ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary/60 transition-colors flex-shrink-0" />
    </motion.button>
  );
}

function TimeCard({ city, currentTime, isAr, router }: {
  city: CityData; currentTime: Date; isAr: boolean; router: ReturnType<typeof useRouter>;
}) {
  const cityTime = formatInTimeZone(currentTime, city.timeZone, "HH:mm");
  const cityDate = formatInTimeZone(currentTime, city.timeZone, "MMM d");
  const hour = parseInt(formatInTimeZone(currentTime, city.timeZone, "H"));
  const isDay = hour >= 6 && hour < 18;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => router.push(`/world-clock/${getCitySlug(city)}`)}
      className={cn(CARD.base, CARD.hover, CARD.pad, "text-left w-full group")}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full overflow-hidden border border-border flex-shrink-0">
          <ReactCountryFlag countryCode={city.countryCode} svg style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{city.name}</p>
          <p className="text-xs text-muted-foreground truncate">{city.countryName}</p>
        </div>
        <div className={cn("w-2 h-2 rounded-full flex-shrink-0", isDay ? "bg-amber-400" : "bg-indigo-400")} />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-mono font-semibold text-foreground tabular-nums">{loc(cityTime, isAr)}</span>
        <span className="text-xs text-muted-foreground">{loc(cityDate, isAr)}</span>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full truncate max-w-[120px]">{city.timeZone.replace(/_/g, " ")}</span>
        <span className="text-xs text-muted-foreground">UTC{city.utcOffsetStr}</span>
      </div>
    </motion.button>
  );
}

interface CityDetailClientProps {
  cityData: CityData;
  slug: string;
}

export default function CityDetailClient({ cityData, slug }: CityDetailClientProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [locale, setLocale] = useState<"en" | "ar">("en");
  const [isClient, setIsClient] = useState(false);
  const [time, setTime] = useState<Date | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const htmlLang = document.documentElement.lang;
    setLocale(htmlLang?.startsWith("ar") ? "ar" : "en");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onChange = () => {
      const htmlLang = document.documentElement.lang;
      setLocale(htmlLang?.startsWith("ar") ? "ar" : "en");
    };
    window.addEventListener("storage", onChange);
    window.addEventListener("locale-change", onChange);
    const interval = setInterval(() => {
      const htmlLang = document.documentElement.lang;
      const current = htmlLang?.startsWith("ar") ? "ar" : "en";
      setLocale((prev) => (prev !== current ? current : prev));
    }, 500);
    return () => {
      window.removeEventListener("storage", onChange);
      window.removeEventListener("locale-change", onChange);
      clearInterval(interval);
    };
  }, []);

  const isAr = locale === "ar";
  const db = useMemo(() => buildDb(), []);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${cityData.name} Time - ExClock`,
          text: `${t.worldClockCity?.shareText || "Check the current time in"} ${cityData.name}, ${cityData.countryName}`,
          url
        });
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {}
    }
  }, [cityData, t]);

  const famousCities = useMemo(() => {
    return db.allCities.filter((c) => FAMOUS_CITY_NAMES.has(c.name));
  }, [db.allCities]);

  const sameZoneCities = useMemo(() => {
    return dedupe(
      famousCities.filter((c) => c.timeZone === cityData.timeZone && c.countryCode !== cityData.countryCode && c.name !== cityData.name),
      8
    );
  }, [famousCities, cityData]);

  const trendingZones = useMemo(() => {
    const candidates = famousCities.filter(
      (c) => c.timeZone !== cityData.timeZone && c.countryCode !== cityData.countryCode && c.name !== cityData.name
    );
    const byCountry = new Map<string, CityData[]>();
    for (const c of candidates) {
      if (!byCountry.has(c.countryCode)) byCountry.set(c.countryCode, []);
      byCountry.get(c.countryCode)!.push(c);
    }
    const result: CityData[] = [];
    for (const [, cities] of byCountry) {
      if (cities.length > 0) result.push(cities[0]);
      if (result.length >= 8) break;
    }
    return result;
  }, [famousCities, cityData]);

  const otherZones = useMemo(() => {
    const usedNames = new Set([cityData.name, ...trendingZones.map((c) => c.name)]);
    const candidates = famousCities.filter(
      (c) => !usedNames.has(c.name) && c.countryCode !== cityData.countryCode
    );
    const byCountry = new Map<string, CityData[]>();
    for (const c of candidates) {
      if (!byCountry.has(c.countryCode)) byCountry.set(c.countryCode, []);
      byCountry.get(c.countryCode)!.push(c);
    }
    const result: CityData[] = [];
    for (const [, cities] of byCountry) {
      if (cities.length > 0) result.push(cities[0]);
      if (result.length >= 8) break;
    }
    return result;
  }, [famousCities, cityData, trendingZones]);

  if (!isClient || !time) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <div className="w-14 h-14 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const tz = ct.getTimezone(cityData.timeZone);
  const hour = parseInt(formatInTimeZone(time, cityData.timeZone, "H"));
  const isDay = hour >= 6 && hour < 18;

  const currentTime = formatInTimeZone(time, cityData.timeZone, "HH:mm:ss");
  const currentDate = formatInTimeZone(time, cityData.timeZone, "EEEE, MMMM do, yyyy");
  const timezoneFull = cityData.timeZone.replace(/_/g, " ");
  const timezoneAbbr = formatInTimeZone(time, cityData.timeZone, "zzz");

  const dTime = loc(currentTime, isAr);
  const dDate = loc(currentDate, isAr);
  const dLocal = loc(formatInTimeZone(time, cityData.timeZone, "h:mm a"), isAr);
  const dShort = loc(formatInTimeZone(time, cityData.timeZone, "MMM d, yyyy"), isAr);

  const wc = t.worldClock || {};
  const wcCity = t.worldClockCity || {};

  return (
    <div className="flex flex-col pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-6">
          <button onClick={() => router.push("/world-clock")} className="group flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <Icons.ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            <span className="text-sm font-medium">{wcCity.back || "Back to World Clock"}</span>
          </button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
          className={cn(CARD.base, "shadow-xl shadow-primary/5 overflow-hidden p-8 md:p-12 mb-8 relative")}>
          <div className={cn("absolute top-0 w-96 h-96 rounded-full blur-3xl -translate-y-1/2 pointer-events-none opacity-20", isDay ? "right-0 bg-amber-500/30 translate-x-1/2" : "left-0 bg-indigo-500/30 -translate-x-1/2")} />
          <div className={cn("absolute bottom-0 w-64 h-64 rounded-full blur-3xl translate-y-1/2 pointer-events-none opacity-10", isDay ? "left-0 bg-sky-500/30 -translate-x-1/2" : "right-0 bg-purple-500/30 translate-x-1/2")} />

          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-10">
              <div className="flex items-center gap-5">
                <motion.div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg ring-2 ring-border" whileHover={{ scale: 1.05, rotate: 3 }} transition={{ type: "spring", stiffness: 300 }}>
                  <ReactCountryFlag countryCode={cityData.countryCode} svg style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </motion.div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">{cityData.name}</h1>
                  <div className="flex items-center gap-2 text-muted-foreground mt-1.5">
                    <Icons.MapPin className="w-4 h-4" />
                    <span className="text-sm font-medium">{cityData.countryName}</span>
                    {cityData.stateName && <><span className="text-muted-foreground/30">•</span><span className="text-sm">{cityData.stateName}</span></>}
                  </div>
                </div>
              </div>
              <motion.button onClick={handleShare} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-muted hover:bg-muted/80 transition-all text-sm font-medium text-foreground" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                {copied ? <><Icons.Check className="w-4 h-4 text-green-500" /><span>{wcCity.copied || "Copied!"}</span></> : <><Icons.Share2 className="w-4 h-4" /><span>{wcCity.share || "Share"}</span></>}
              </motion.button>
            </div>

            <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-8">
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-7xl sm:text-8xl md:text-9xl font-mono font-light text-foreground tracking-tighter tabular-nums">{dTime.split(":")[0]}:{dTime.split(":")[1]}</span>
                  <motion.span className="text-3xl sm:text-4xl font-mono text-muted-foreground font-light tabular-nums" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1, repeat: Infinity }}>:{dTime.split(":")[2]}</motion.span>
                </div>
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <motion.div className={cn("w-2.5 h-2.5 rounded-full shadow-lg", isDay ? "bg-amber-400 shadow-amber-400/50" : "bg-indigo-400 shadow-indigo-400/50")} animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity }} />
                    <span className="text-sm font-medium text-muted-foreground">{isDay ? (wc.day || "Day") : (wc.night || "Night")}</span>
                  </div>
                  <span className="text-muted-foreground/30">•</span>
                  <span className="text-sm text-muted-foreground font-medium">{dDate}</span>
                </div>
              </div>
              <div className="flex gap-6 lg:gap-8">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">{wcCity.tz || "Time Zone"}</p>
                  <p className="text-lg font-mono font-semibold text-foreground">{timezoneAbbr}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[140px]">{timezoneFull}</p>
                </div>
                <div className="w-px bg-border" />
                <div className="text-right">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">{wcCity.utc || "UTC Offset"}</p>
                  <p className="text-lg font-mono font-semibold text-foreground">UTC{tz?.utcOffsetStr}</p>
                  <p className="text-xs text-muted-foreground">
                    {tz?.utcOffset !== undefined 
                      ? tz.utcOffset > 0 
                        ? (wcCity?.ahead || "Ahead of UTC") 
                        : tz.utcOffset === 0 
                          ? (wcCity?.sameUTC || "Same as UTC") 
                          : (wcCity?.behind || "Behind UTC")
                      : (wcCity?.sameUTC || "Same as UTC")}
                  </p>                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: <Icons.Clock className="w-4 h-4" />, label: wcCity.localTime || "Local Time", value: dLocal },
            { icon: <Icons.Calendar className="w-4 h-4" />, label: wcCity.date || "Date", value: dShort },
            { icon: <Icons.Globe className="w-4 h-4" />, label: wcCity.tz || "Time Zone", value: timezoneAbbr, subValue: timezoneFull },
            { icon: <Icons.Sun className="w-4 h-4" />, label: wcCity.period || "Day Period", value: isDay ? `${wc.day || "Day"} ☀️` : `${wc.night || "Night"} 🌙`, subValue: isDay ? (wcCity.sunUp || "Sun is up") : (wcCity.sunDown || "Sun is down") },
          ].map((info, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.1 }} whileHover={{ y: -4, transition: { type: "spring", stiffness: 300 } }}>
              <InfoCard {...info} />
            </motion.div>
          ))}
        </motion.div>

        {cityData.latitude && cityData.longitude && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mb-8">
            <CityMap lat={cityData.latitude} lng={cityData.longitude} cityName={cityData.name} countryName={cityData.countryName} isDay={isDay} t={t} />
          </motion.div>
        )}

        {sameZoneCities.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mb-8">
            <h2 className="text-xl font-bold text-foreground mb-5">{wcCity.sameZone || "Same Time Zone"}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {sameZoneCities.map((city, i) => (
                <motion.div key={`sz-${city.countryCode}-${city.name}-${i}`} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.65 + i * 0.05 }}>
                  <CityRow city={city} router={router} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {trendingZones.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="mb-8">
            <h2 className="text-xl font-bold text-foreground mb-5">{wcCity.trendingZones || "Trending Time Zones"}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {trendingZones.map((city, i) => (
                <motion.div key={`tz-${city.countryCode}-${city.name}-${i}`} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.75 + i * 0.05 }}>
                  <TimeCard city={city} currentTime={time} isAr={isAr} router={router} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {otherZones.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="mb-8">
            <h2 className="text-xl font-bold text-foreground mb-5">{wcCity.otherZones || "Other Time Zones"}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {otherZones.map((city, i) => (
                <motion.div key={`oz-${city.countryCode}-${city.name}-${i}`} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.85 + i * 0.05 }}>
                  <TimeCard city={city} currentTime={time} isAr={isAr} router={router} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        <div className="w-full mt-12">
          <SeoContent pageKey="world_clock" />
        </div>
      </div>
    </div>
  );
}