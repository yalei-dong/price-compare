// ---------------------------------------------------------------------------
// Whole Foods scraper — Uses Whole Foods Market public search API.
// Returns product prices with sale info, images, and brand names.
// No API key or headless browser needed.
// ---------------------------------------------------------------------------

import { Scraper, ScrapedPrice } from "./types";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

interface WFProduct {
  name?: string;
  brand?: string;
  slug?: string;
  regularPrice?: number;
  salePrice?: number;
  incrementalSalePrice?: number;
  saleStartDate?: string;
  saleEndDate?: string;
  imageThumbnail?: string;
  store?: number;
  isLocal?: boolean;
}

interface WFSearchResponse {
  results?: WFProduct[];
}

// Default store IDs by region (Whole Foods only operates in US & select CA cities)
// These are well-stocked US stores that reliably return results
const DEFAULT_STORES: Record<string, number> = {
  US: 10529,   // US default (large metro store)
  CA: 10161,   // CA — Whole Foods uses US pricing; closest equivalent
};

// Alternate stores to try if primary returns 0 results
const FALLBACK_STORES: Record<string, number[]> = {
  US: [10122, 10189],
  CA: [10122, 10529],
};

async function searchWholeFoods(
  query: string,
  storeId: number
): Promise<WFProduct[]> {
  try {
    const params = new URLSearchParams({
      text: query,
      store: String(storeId),
    });
    const res = await fetch(
      `https://www.wholefoodsmarket.com/api/search?${params}`,
      {
        headers: {
          "User-Agent": UA,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!res.ok) return [];
    const data: WFSearchResponse = await res.json();
    return data.results || [];
  } catch {
    return [];
  }
}

function toScrapedPrice(item: WFProduct, currency: string): ScrapedPrice | null {
  if (!item.name) return null;

  // Prefer sale price, fall back to regular price
  const price = item.salePrice || item.regularPrice;
  if (!price || price <= 0) return null;

  const fullName = item.brand
    ? `${item.brand} ${item.name}`
    : item.name;

  // Product slug URLs are broken (redirect to homepage/404).
  // Link to search results so users can find the product.
  const searchName = encodeURIComponent(item.name);
  const result: ScrapedPrice = {
    storeName: "Whole Foods",
    price,
    currency,
    productName: fullName,
    imageUrl: item.imageThumbnail || undefined,
    productUrl: `https://www.wholefoodsmarket.com/search?text=${searchName}`,
  };

  if (item.saleEndDate) {
    result.validUntil = item.saleEndDate;
  }

  return result;
}

export const wholeFoodsScraper: Scraper = {
  name: "wholefoods",
  countries: ["US", "CA"],

  async scrape(query, countryCode) {
    const currency = countryCode === "CA" ? "CAD" : "USD";
    const storeId = DEFAULT_STORES[countryCode] || DEFAULT_STORES.US;

    let products = await searchWholeFoods(query, storeId);

    // If no results, try fallback stores
    if (products.length === 0) {
      const fallbacks = FALLBACK_STORES[countryCode] || FALLBACK_STORES.US;
      for (const fb of fallbacks) {
        products = await searchWholeFoods(query, fb);
        if (products.length > 0) break;
      }
    }

    if (products.length === 0) return [];

    // Relevance filter: query words must appear in product name or brand
    const queryWords = query.toLowerCase().split(/\s+/).filter((w) => w.length >= 2);

    // Build plural/singular forms for matching
    const queryForms = queryWords.map((w) => {
      const forms = [w];
      if (!w.endsWith("s")) forms.push(w + "s");
      if (w.endsWith("s") && w.length > 3) forms.push(w.slice(0, -1));
      if (w.endsWith("ies")) forms.push(w.slice(0, -3) + "y");
      if (w.endsWith("y")) forms.push(w.slice(0, -1) + "ies");
      return forms;
    });

    const scored: { item: WFProduct; score: number }[] = [];

    for (const item of products) {
      const combined = `${item.brand || ""} ${item.name || ""}`.toLowerCase();

      // Basic filter: all query words must appear (with word-boundary)
      const allMatch = queryWords.every((w) =>
        new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i").test(combined)
      );
      if (!allMatch) continue;

      // Relevance score: higher = query word is the actual product, not a modifier
      let score = 0;
      const nameWords = (item.name || "").toLowerCase().split(/[\s,]+/).filter((nw) => nw.length > 1);

      for (const forms of queryForms) {
        // +3 if query word (or plural) is near the END of the product name
        // (meaning it's the main noun, e.g. "Navel Oranges" vs "Orange Sparkling Water")
        const lastThree = nameWords.slice(-3);
        if (forms.some((f) => lastThree.includes(f))) score += 3;

        // +2 if query word appears as a standalone word at all (not just substring)
        if (forms.some((f) => new RegExp(`\\b${f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(item.name || ""))) score += 2;
      }

      // Shorter product names are more likely to be the actual product
      if (nameWords.length <= 3) score += 2;
      else if (nameWords.length <= 5) score += 1;

      scored.push({ item, score });
    }

    // Sort by relevance score desc, then by price asc
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const priceA = a.item.salePrice || a.item.regularPrice || 999;
      const priceB = b.item.salePrice || b.item.regularPrice || 999;
      return priceA - priceB;
    });

    // Take only the top results (most relevant)
    const topItems = scored.slice(0, 10);

    const results: ScrapedPrice[] = [];
    const seen = new Set<string>();

    for (const { item } of topItems) {
      const sp = toScrapedPrice(item, currency);
      if (!sp) continue;

      const key = `${sp.productName}-${sp.price}`;
      if (seen.has(key)) continue;
      seen.add(key);

      results.push(sp);
    }

    return results;
  },
};
