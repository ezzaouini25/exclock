import { notFound } from "next/navigation";
import { Metadata } from "next";
import { en } from "@/lib/i18n/en";
import { formatInTimeZone } from "date-fns-tz";
import ct from "countries-and-timezones";
import { Country, State, City } from "country-state-city";
import CityDetailClient from "./CityDetailClient";

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

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function getCitySlug(city: CityData): string {
  return `${slugify(city.name)}-${city.countryCode.toLowerCase()}`;
}

let DB_CACHE: CityData[] | null = null;

function buildDb(): CityData[] {
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
  DB_CACHE = allCities;
  return allCities;
}

// ═══════════════════════════════════════════════════════════════════════════
// NEW YORK SPECIAL HANDLING
// country-state-city might not have "New York" as a city name.
// It could be: "New York City", "NewYork", "New York", or not exist at all.
// We handle ALL cases by creating a synthetic entry if needed.
// ═══════════════════════════════════════════════════════════════════════════

function getNewYorkCity(cities: CityData[]): CityData | null {
  // Try exact name matches first
  const exactNames = ["New York", "New York City", "NewYork", "NYC"];
  for (const name of exactNames) {
    const match = cities.find(c => c.name === name && c.countryCode === "US");
    if (match) return match;
  }

  // Try partial match: any US city with "New York" in the name
  const partial = cities.find(c => c.countryCode === "US" && c.name.toLowerCase().includes("new york"));
  if (partial) return partial;

  // If no New York city exists at all, create a synthetic one
  // using New York state's timezone and approximate coordinates
  const nyState = cities.find(c => c.countryCode === "US" && c.stateCode === "NY");
  if (nyState) {
    return {
      name: "New York",
      countryCode: "US",
      countryName: "United States",
      stateCode: "NY",
      stateName: "New York",
      timeZone: nyState.timeZone, // Use NY state's timezone
      utcOffset: nyState.utcOffset,
      utcOffsetStr: nyState.utcOffsetStr,
      latitude: "40.7128",
      longitude: "-74.0060",
    };
  }

  return null;
}

function findCityBySlug(slug: string, cities: CityData[]): CityData | null {
  const slugLower = slug.toLowerCase();

  console.log(`[findCityBySlug] Searching for slug: "${slugLower}"`);
  console.log(`[findCityBySlug] Total cities in DB: ${cities.length}`);

  // ═══════════════════════════════════════════════════════════════════════
  // SPECIAL CASE: New York (handles all variations)
  // ═══════════════════════════════════════════════════════════════════════
  if (slugLower === "new-york-us" || slugLower === "new-york" || slugLower === "nyc" || slugLower === "new-york-city-us") {
    console.log(`[findCityBySlug] Detected New York request, using special handler`);
    const ny = getNewYorkCity(cities);
    if (ny) {
      console.log(`[findCityBySlug] ✓ New York resolved: ${ny.name} (lat: ${ny.latitude}, lng: ${ny.longitude})`);
      return ny;
    }
  }

  // 1. Exact match: city-country format
  const exact = cities.find((c) => getCitySlug(c) === slugLower);
  if (exact) {
    console.log(`[findCityBySlug] ✓ Exact match found: ${exact.name}, ${exact.countryCode}`);
    return exact;
  }

  // 2. Parse slug: "city-name-cc" → extract country code and city name
  const lastHyphen = slugLower.lastIndexOf("-");
  if (lastHyphen > 0) {
    const possibleCountry = slugLower.slice(lastHyphen + 1).toUpperCase();
    const possibleCitySlug = slugLower.slice(0, lastHyphen);

    console.log(`[findCityBySlug] Trying parsed match: citySlug="${possibleCitySlug}", country="${possibleCountry}"`);

    const parsedMatch = cities.find((c) => 
      c.countryCode.toUpperCase() === possibleCountry &&
      slugify(c.name) === possibleCitySlug
    );
    if (parsedMatch) {
      console.log(`[findCityBySlug] ✓ Parsed match found: ${parsedMatch.name}, ${parsedMatch.countryCode}`);
      return parsedMatch;
    }
  }

  // 3. Name-only match (old format)
  const nameMatches = cities.filter((c) => slugify(c.name) === slugLower);
  if (nameMatches.length === 1) return nameMatches[0];
  if (nameMatches.length > 1) {
    const priority = ["US", "GB", "CA", "AU", "DE", "FR", "JP", "CN", "IN", "BR"];
    for (const code of priority) {
      const match = nameMatches.find((c) => c.countryCode === code);
      if (match) return match;
    }
    return nameMatches[0];
  }

  // 4. Prefix match
  const prefixMatches = cities.filter((c) => {
    const citySlug = slugify(c.name);
    return slugLower.startsWith(citySlug + "-") && citySlug.length >= 3;
  });
  if (prefixMatches.length === 1) return prefixMatches[0];
  if (prefixMatches.length > 1) {
    const priority = ["US", "GB", "CA", "AU", "DE", "FR", "JP", "CN", "IN", "BR"];
    for (const code of priority) {
      const match = prefixMatches.find((c) => c.countryCode === code);
      if (match) return match;
    }
    return prefixMatches[0];
  }

  // 5. Fuzzy match (whole word, min 5 chars)
  const fuzzyMatches = cities.filter((c) => {
    const citySlug = slugify(c.name);
    if (citySlug.length < 5) return false;
    const pattern = new RegExp(`(^|-)${citySlug}(-|$)`);
    return pattern.test(slugLower);
  });
  if (fuzzyMatches.length === 1) return fuzzyMatches[0];
  if (fuzzyMatches.length > 1) {
    const priority = ["US", "GB", "CA", "AU", "DE", "FR", "JP", "CN", "IN", "BR"];
    for (const code of priority) {
      const match = fuzzyMatches.find((c) => c.countryCode === code);
      if (match) return match;
    }
    return fuzzyMatches[0];
  }

  console.log(`[findCityBySlug] ✗ No match found for "${slugLower}"`);
  return null;
}

function getSameZoneCities(cityData: CityData, allCities: CityData[], limit: number = 5): string[] {
  const seen = new Set<string>();
  const results: string[] = [];
  for (const c of allCities) {
    if (c.timeZone === cityData.timeZone && c.countryCode !== cityData.countryCode && c.name !== cityData.name) {
      const key = `${c.countryCode}-${c.name}`;
      if (seen.has(key)) continue;
      seen.add(key);
      results.push(c.name);
      if (results.length >= limit) break;
    }
  }
  return results;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const allCities = buildDb();
  const cityData = findCityBySlug(slug, allCities);

  if (!cityData) {
    return {
      title: "City Not Found | ExClock",
      description: "The city you're looking for doesn't exist or has been removed.",
    };
  }

  const t = en.worldClockCity?.metadata;

  if (!t) {
    return {
      title: `${cityData.name} Time | ExClock`,
      description: `Current local time in ${cityData.name}, ${cityData.countryName}.`,
    };
  }

  const now = new Date();
  const time = formatInTimeZone(now, cityData.timeZone, "HH:mm");
  const date = formatInTimeZone(now, cityData.timeZone, "MMMM d, yyyy");
  const timezoneFull = cityData.timeZone.replace(/_/g, " ");
  const sameZoneCities = getSameZoneCities(cityData, allCities, 5);

  const title = t.titleTemplate(cityData.name, cityData.countryName);
  const description = t.descriptionTemplate(
    cityData.name, cityData.countryName, time, timezoneFull,
    cityData.utcOffsetStr, date, cityData.stateName || undefined, sameZoneCities
  );
  const keywords = t.keywordsTemplate(cityData.name, cityData.countryName, timezoneFull, cityData.utcOffsetStr);
  const ogTitle = t.ogTitleTemplate(cityData.name, cityData.countryName);
  const ogDescription = t.ogDescriptionTemplate(
    cityData.name, cityData.countryName, time, date, timezoneFull, cityData.utcOffsetStr
  );
  const twitterTitle = t.twitterTitleTemplate(cityData.name, time);
  const twitterDescription = t.twitterDescriptionTemplate(
    cityData.name, cityData.countryName, time, timezoneFull, cityData.utcOffsetStr
  );

  const canonical = `https://exclock.com/world-clock/${slug}`;

  return {
    title,
    description,
    keywords,
    alternates: { canonical },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: canonical,
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: twitterTitle,
      description: twitterDescription,
    },
    other: {
      "geo.region": cityData.countryCode,
      "geo.placename": cityData.name,
      ...(cityData.latitude && cityData.longitude ? {
        "geo.position": `${cityData.latitude};${cityData.longitude}`,
        ICBM: `${cityData.latitude}, ${cityData.longitude}`,
      } : {}),
    },
  };
}

export default async function CityDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const allCities = buildDb();
  const cityData = findCityBySlug(slug, allCities);

  if (!cityData) {
    notFound();
  }

  return <CityDetailClient cityData={cityData} slug={slug} />;
}