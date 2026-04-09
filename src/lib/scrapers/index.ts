// ---------------------------------------------------------------------------
// Scraper orchestrator — runs all configured scrapers, caches results,
// and converts them into PriceEntry format for the rest of the app.
// No API keys needed. Completely free.
// ---------------------------------------------------------------------------

import { PriceEntry, Country } from "../types";
import { ScrapedPrice, Scraper } from "./types";
import { flippScraper } from "./flipp";
import { walmartScraper } from "./walmart";
import { loblawScraper } from "./loblaw";
import { costcoScraper } from "./costco";
import { wholeFoodsScraper } from "./wholefoods";

// Register all scrapers
const ALL_SCRAPERS: Scraper[] = [flippScraper, walmartScraper, loblawScraper, costcoScraper, wholeFoodsScraper];

// ---------------------------------------------------------------------------
// In-memory cache for scraped results (24h TTL, same as SerpAPI cache)
// ---------------------------------------------------------------------------

interface CacheEntry {
  data: PriceEntry[];
  ts: number;
}

const SCRAPE_CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const MAX_CACHE_SIZE = 500;

function cacheKey(query: string, country: string): string {
  return `scrape|${query.toLowerCase().trim()}|${country}`;
}

function getCached(key: string): PriceEntry[] | null {
  const entry = SCRAPE_CACHE.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    SCRAPE_CACHE.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: PriceEntry[]): void {
  if (SCRAPE_CACHE.size >= MAX_CACHE_SIZE) {
    const oldest = SCRAPE_CACHE.keys().next().value;
    if (oldest !== undefined) SCRAPE_CACHE.delete(oldest);
  }
  SCRAPE_CACHE.set(key, { data, ts: Date.now() });
}

// ---------------------------------------------------------------------------
// Store metadata for known store names from scrapers
// ---------------------------------------------------------------------------

const STORE_META: Record<string, { logo: string; type: "online" | "local" | "both" }> = {
  "walmart":        { logo: "🟦", type: "both" },
  "walmart.ca":     { logo: "🟦", type: "both" },
  "loblaws":        { logo: "🍁", type: "both" },
  "no frills":      { logo: "🟡", type: "both" },
  "nofrills":       { logo: "🟡", type: "both" },
  "real canadian superstore": { logo: "🏪", type: "both" },
  "superstore":     { logo: "🏪", type: "both" },
  "metro":          { logo: "🏬", type: "both" },
  "food basics":    { logo: "🏪", type: "both" },
  "freshco":        { logo: "🥬", type: "both" },
  "sobeys":         { logo: "🟢", type: "both" },
  "safeway":        { logo: "🏪", type: "both" },
  "costco":         { logo: "🔴", type: "both" },
  "amazon":         { logo: "🅰️", type: "online" },
  "t&t":            { logo: "🏮", type: "both" },
  "farm boy":       { logo: "🌾", type: "local" },
  "starsky":         { logo: "🇪🇺", type: "local" },
  "shoppers drug mart": { logo: "💊", type: "both" },
  "provigo":        { logo: "🏪", type: "both" },
  "maxi":           { logo: "🏪", type: "both" },
  "fortinos":       { logo: "🏪", type: "both" },
  "iga":            { logo: "🏪", type: "both" },
  "super c":        { logo: "🏪", type: "both" },
  "giant tiger":    { logo: "🐯", type: "both" },
  "dollarama":      { logo: "💰", type: "both" },
  "target":         { logo: "🎯", type: "both" },
  "kroger":         { logo: "🏪", type: "both" },
  "publix":         { logo: "🟢", type: "both" },
  "aldi":           { logo: "🟡", type: "both" },
  "h-e-b":          { logo: "🏪", type: "both" },
  "trader joe":     { logo: "🌻", type: "local" },
  "whole foods":    { logo: "🥬", type: "both" },
  "save-on-foods":  { logo: "🏪", type: "both" },
  "rabba":          { logo: "🟤", type: "local" },
};

function getStoreMeta(name: string): { logo: string; type: "online" | "local" | "both" } {
  const lower = name.toLowerCase();
  for (const [key, val] of Object.entries(STORE_META)) {
    if (lower.includes(key)) return val;
  }
  return { logo: "🏷️", type: "both" };
}

// ---------------------------------------------------------------------------
// Convert scraped results → PriceEntry[]
// ---------------------------------------------------------------------------

function toPriceEntries(
  scraped: ScrapedPrice[],
  country: string
): PriceEntry[] {
  const countryCode = (country === "CA" || country === "US" || country === "CN" ? country : "US") as Country;
  const today = new Date().toISOString().slice(0, 10);

  return scraped.map((item, idx) => {
    const meta = getStoreMeta(item.storeName);
    return {
      storeId: `scrape-${idx}`,
      storeName: item.storeName,
      storeLogo: meta.logo,
      country: countryCode,
      type: meta.type,
      price: item.price,
      currency: item.currency,
      unit: item.unit || "each",
      url: item.productUrl || "",
      thumbnail: item.imageUrl || undefined,
      lastUpdated: today,
      inStock: true,
      isFlyer: true,
      validUntil: item.validUntil || undefined,
      productName: item.productName || undefined,
    };
  });
}

// ---------------------------------------------------------------------------
// Deduplicate: keep cheapest per store
// ---------------------------------------------------------------------------

function dedup(entries: PriceEntry[]): PriceEntry[] {
  const byStore = new Map<string, PriceEntry>();
  for (const e of entries) {
    const key = e.storeName.toLowerCase().trim();
    const existing = byStore.get(key);
    if (!existing || e.price < existing.price) {
      byStore.set(key, e);
    }
  }
  return [...byStore.values()].sort((a, b) => a.price - b.price);
}

// ---------------------------------------------------------------------------
// Public API: fetch scraped prices
// ---------------------------------------------------------------------------

export async function fetchScrapedPrices(
  query: string,
  countryCode: string,
  postalCode?: string
): Promise<PriceEntry[]> {
  if (!query || query.trim().length === 0) return [];

  const key = cacheKey(query, countryCode);
  const cached = getCached(key);
  if (cached) return cached;

  // Run all scrapers that support this country in parallel
  const applicable = ALL_SCRAPERS.filter((s) =>
    s.countries.includes(countryCode)
  );

  if (applicable.length === 0) return [];

  const scraperResults = await Promise.allSettled(
    applicable.map((s) => s.scrape(query, countryCode, postalCode))
  );

  const allScraped: ScrapedPrice[] = [];
  for (const result of scraperResults) {
    if (result.status === "fulfilled") {
      allScraped.push(...result.value);
    }
  }

  if (allScraped.length === 0) return [];

  const entries = dedup(toPriceEntries(allScraped, countryCode));
  setCache(key, entries);
  return entries;
}

export function hasScrapers(countryCode: string): boolean {
  return ALL_SCRAPERS.some((s) => s.countries.includes(countryCode));
}
