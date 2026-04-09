// ---------------------------------------------------------------------------
// Rabba Fine Foods scraper — Parses deals from rabba.com/flyers/ static HTML.
// Rabba is a 24/7 GTA convenience/grocery chain. They publish weekly deals
// on their WordPress site with structured product-grid markup.
// No API key needed.
// ---------------------------------------------------------------------------

import { Scraper, ScrapedPrice } from "./types";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

interface RabbaItem {
  name: string;
  size: string;
  price: number;
  saleInfo: string;
  image: string;
  validDates: string;
}

// In-memory cache: Rabba flyers page only changes weekly
let cachedItems: RabbaItem[] = [];
let cacheExpiresAt = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function parsePrice(priceText: string): number {
  // Handle "$3.99"
  const simple = priceText.match(/\$(\d+\.?\d*)/);
  if (simple) return parseFloat(simple[1]);

  // Handle "2/$5" → $2.50 each
  const multi = priceText.match(/(\d+)\/\$(\d+\.?\d*)/);
  if (multi) return parseFloat(multi[2]) / parseInt(multi[1]);

  return 0;
}

function parseItems(html: string): RabbaItem[] {
  const items: RabbaItem[] = [];
  // Split by product-grid__item to get each product block
  const blocks = html.split('product-grid__item');

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];

    // Product name from h6.product-grid__caption
    const nameMatch = block.match(/product-grid__caption[^>]*>([^<]+)/);
    if (!nameMatch) continue;
    const name = nameMatch[1].trim();
    if (!name) continue;

    // Size from p.product-grid__size
    const sizeMatch = block.match(/product-grid__size[^>]*>([^<]+)/);
    const size = sizeMatch ? sizeMatch[1].trim() : "";

    // Price from p.product-grid__price
    const priceMatch = block.match(/product-grid__price[^>]*>([^<]+)/);
    if (!priceMatch) continue;
    const priceText = priceMatch[1].trim();
    const price = parsePrice(priceText);
    if (price <= 0) continue;

    // Sale info from p.product-grid__sale
    const saleMatch = block.match(/product-grid__sale[^>]*>([\s\S]*?)<\/p>/);
    const saleInfo = saleMatch
      ? saleMatch[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
      : "";

    // Image from alt and data-lazy-src or src
    const imgMatch = block.match(/alt="([^"]*)"[\s\S]*?data-lazy-src="([^"]+)"/);
    const image = imgMatch ? imgMatch[2] : "";

    // Valid dates from p.product-grid__dates
    const datesMatch = block.match(/product-grid__dates[^>]*>([^<]+)/);
    const validDates = datesMatch ? datesMatch[1].trim() : "";

    items.push({ name, size, price, saleInfo, image, validDates });
  }

  // Deduplicate by name+price
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.name}-${item.price}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function parseValidTo(validDates: string): string | undefined {
  // "Valid: April 6, 2026 - April 30, 2026" → extract end date
  const match = validDates.match(/-\s*(\w+ \d+,\s*\d{4})/);
  if (!match) return undefined;
  try {
    return new Date(match[1]).toISOString();
  } catch {
    return undefined;
  }
}

async function fetchRabbaItems(): Promise<RabbaItem[]> {
  if (cachedItems.length > 0 && Date.now() < cacheExpiresAt) {
    return cachedItems;
  }

  try {
    const res = await fetch("https://rabba.com/flyers/", {
      headers: { "User-Agent": UA, Accept: "text/html" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return cachedItems;

    const html = await res.text();
    const items = parseItems(html);

    if (items.length > 0) {
      cachedItems = items;
      cacheExpiresAt = Date.now() + CACHE_TTL;
    }

    return items;
  } catch {
    return cachedItems; // stale cache is better than nothing
  }
}

export const rabbaScraper: Scraper = {
  name: "rabba",
  countries: ["CA"],

  async scrape(query) {
    const allItems = await fetchRabbaItems();
    if (allItems.length === 0) return [];

    const queryWords = query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length >= 2);

    const results: ScrapedPrice[] = [];

    // Two-pass matching: strong matches (query in first 2 words) are preferred;
    // weak matches (query as trailing modifier e.g. "Schaaf Loaf Banana") are
    // only included when no strong match exists.
    type MatchedItem = { item: RabbaItem; strong: boolean };
    const matched: MatchedItem[] = [];

    for (const item of allItems) {
      const nameLower = `${item.name} ${item.size}`.toLowerCase();

      // For multi-word queries, require all words
      if (queryWords.length > 1) {
        if (!queryWords.every((w) => nameLower.includes(w))) continue;
        matched.push({ item, strong: true });
        continue;
      } else if (queryWords.length === 1) {
        // Single word: whole-word boundary match
        const w = queryWords[0];
        const wSingular =
          w.endsWith("s") && w.length > 3 ? w.slice(0, -1) : w;
        const re = new RegExp(`\\b(${w}|${wSingular})`, "i");
        if (!re.test(nameLower)) continue;

        // Strong: query word appears in the first 2 words of the product name
        const nameWords = item.name.toLowerCase().split(/\s+/).slice(0, 2);
        const isStrong = nameWords.some((nw) => re.test(nw));
        matched.push({ item, strong: isStrong });
        continue;
      }
    }

    const hasStrong = matched.some((m) => m.strong);
    const filtered = hasStrong ? matched.filter((m) => m.strong) : matched;

    for (const { item } of filtered) {

      const fullName = item.size
        ? `${item.name}, ${item.size}`
        : item.name;

      const validTo = parseValidTo(item.validDates);

      // Build in-app flyer-item URL (same pattern as Flipp / Whole Foods)
      const flyerParams = new URLSearchParams();
      flyerParams.set("store", "Rabba");
      flyerParams.set("product", fullName);
      flyerParams.set("price", String(item.price));
      flyerParams.set("currency", "CAD");
      if (item.image) flyerParams.set("image", item.image);
      if (validTo) flyerParams.set("to", validTo);
      if (item.saleInfo) flyerParams.set("sale", item.saleInfo);
      flyerParams.set("q", query);

      results.push({
        storeName: "Rabba",
        price: item.price,
        currency: "CAD",
        productName: fullName,
        imageUrl: item.image || undefined,
        productUrl: `/flyer-item?${flyerParams.toString()}`,
        validUntil: validTo,
      });
    }

    return results;
  },
};
