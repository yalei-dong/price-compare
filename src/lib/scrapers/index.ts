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
import { rabbaScraper } from "./rabba";

// Register all scrapers
const ALL_SCRAPERS: Scraper[] = [flippScraper, walmartScraper, loblawScraper, costcoScraper, wholeFoodsScraper, rabbaScraper];

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
// AI-based grocery relevance filter
// Uses Gemini to classify whether each product is a grocery/food item that
// actually matches the search query. Falls back to no filtering on failure.
// ---------------------------------------------------------------------------

async function aiFilterRelevant(
  entries: PriceEntry[],
  query: string
): Promise<PriceEntry[]> {
  if (entries.length === 0) return entries;

  const allKeys = (process.env.GEMINI_API_KEY || "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  if (allKeys.length === 0) return entries; // no API key — skip filter

  // Build a compact list for the AI: index + product name + store
  const items = entries.map((e, i) => ({
    i,
    name: e.productName || e.storeName,
    store: e.storeName,
    price: e.price,
  }));

  const prompt = `You are a grocery shopping assistant. The user searched for "${query}".
Below is a list of products returned by various stores. For each, decide if it is a grocery/food/household item that genuinely matches what someone searching "${query}" would want to buy.

Reject items that are:
- Non-grocery products (electronics, clothing, party supplies, etc.)
- Products where the search term is only a brand name, flavor, or modifier — not the actual product (e.g. searching "apple" should keep apples/apple juice but reject Apple Watch)

Return ONLY a JSON array of the index numbers (the "i" values) to KEEP. No explanation.

Products:
${JSON.stringify(items)}`;

  try {
    const key = allKeys[Math.floor(Math.random() * allKeys.length)];
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 256, temperature: 0 },
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return entries;

    const data = await res.json();
    const text: string =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Extract JSON array from response (may be wrapped in markdown code fences)
    const match = text.match(/\[[\d,\s]*\]/);
    if (!match) return entries;

    const keepIndices: number[] = JSON.parse(match[0]);
    const keepSet = new Set(keepIndices);
    const filtered = entries.filter((_, i) => keepSet.has(i));

    // Safety: if AI removed everything, return originals
    return filtered.length > 0 ? filtered : entries;
  } catch (err) {
    console.warn("AI filter failed, returning unfiltered results:", err);
    return entries;
  }
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

  const deduped = dedup(toPriceEntries(allScraped, countryCode));
  const entries = await aiFilterRelevant(deduped, query);
  setCache(key, entries);
  return entries;
}

export function hasScrapers(countryCode: string): boolean {
  return ALL_SCRAPERS.some((s) => s.countries.includes(countryCode));
}
