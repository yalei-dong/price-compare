// ---------------------------------------------------------------------------
// Flipp scraper — Free flyer/deal data from most CA & US grocery stores.
// Flipp aggregates weekly flyer items from Loblaw, Metro, Sobeys, Walmart,
// No Frills, FreshCo, Food Basics, and hundreds more.
// No API key needed.
// ---------------------------------------------------------------------------

import { Scraper, ScrapedPrice } from "./types";

interface FlippItem {
  name?: string;
  description?: string;
  // Flipp uses current_price (not price)
  current_price?: number;
  original_price?: number;
  price?: number;
  pre_price_text?: string;
  post_price_text?: string;
  price_text?: string;
  sale_story?: string;
  cutout_image_url?: string;
  clean_image_url?: string;
  clipping_image_url?: string;
  image_url?: string;
  valid_from?: string;
  valid_to?: string;
  // Flipp uses merchant_name (not merchant)
  merchant_name?: string;
  merchant?: string;
  flyer_id?: number;
}

interface FlippResponse {
  items?: FlippItem[];
}

// Default postal codes per country (used when no user postal code is known)
const DEFAULT_POSTAL: Record<string, string> = {
  CA: "M5V 3L9",  // Toronto
  US: "10001",     // New York
};

function parseFlippPrice(item: FlippItem): number | null {
  // Flipp uses current_price as the main price field
  if (item.current_price && item.current_price > 0) return item.current_price;
  if (item.price && item.price > 0) return item.price;

  // Try parsing price_text like "$3.99" or "2/$5.00" or "$1.99/lb"
  const text = item.price_text || item.pre_price_text || item.sale_story || "";
  // Match patterns: $3.99, 3.99, 2/$5.00
  const simple = text.match(/\$\s?(\d{1,4}\.\d{2})/);
  if (simple) return parseFloat(simple[1]);

  const multi = text.match(/(\d+)\s*\/\s*\$\s?(\d{1,4}\.\d{2})/);
  if (multi) return parseFloat(multi[2]) / parseInt(multi[1]);

  return null;
}

function parseUnit(item: FlippItem): string {
  const text = (item.price_text || item.post_price_text || "").toLowerCase();
  if (text.includes("/lb")) return "per lb";
  if (text.includes("/kg")) return "per kg";
  if (text.includes("/100g") || text.includes("/100 g")) return "per 100g";
  if (text.includes("/l") || text.includes("/litre") || text.includes("/liter")) return "per L";
  if (text.includes("each")) return "each";
  return "each";
}

// Build a search URL on the store's own website so "Visit store" is useful
const STORE_SEARCH_URLS: Record<string, string> = {
  // Loblaw banner stores (all use search-bar param)
  "no frills":                "https://www.nofrills.ca/search?search-bar=",
  "loblaws":                  "https://www.loblaws.ca/search?search-bar=",
  "real canadian superstore":  "https://www.realcanadiansuperstore.ca/search?search-bar=",
  "superstore":               "https://www.realcanadiansuperstore.ca/search?search-bar=",
  "provigo":                  "https://www.provigo.ca/search?search-bar=",
  "maxi":                     "https://www.maxi.ca/search?search-bar=",
  "fortinos":                 "https://www.fortinos.ca/search?search-bar=",
  "shoppers drug mart":       "https://www.shoppersdrugmart.ca/search?search-bar=",
  // Other CA stores with working search
  "walmart":                  "https://www.walmart.ca/search?q=",
  "metro":                    "https://www.metro.ca/en/search?filter=",
  "food basics":              "https://www.foodbasics.ca/search?filter=",
  "giant tiger":              "https://www.gianttiger.com/search?q=",
  "t&t":                      "https://www.tntsupermarket.com/catalogsearch/result/?q=",
  "costco":                   "https://www.costco.ca/CatalogSearch?keyword=",
  // Sobeys-platform stores (no product search URL, link to flyer instead)
  "freshco":                  "https://www.freshco.com/flyer?view=list&search=",
  "sobeys":                   "https://www.sobeys.com/flyer/?search=",
  "safeway":                  "https://www.safeway.ca/flyer/?search=",
  "farm boy":                 "https://www.farmboy.ca/flyer/",
  "save-on-foods":            "https://www.saveonfoods.com/flyer/",
  // US stores
  "target":                   "https://www.target.com/s?searchTerm=",
  "kroger":                   "https://www.kroger.com/search?query=",
  "aldi":                     "https://www.aldi.us/search/?text=",
  "whole foods":              "https://www.wholefoodsmarket.com/search?text=",
  // NOTE: FreshCo, Sobeys, Safeway, Save-On-Foods, Farm Boy have no working
  // public search URL — omitted to avoid 404 errors.
};

function buildStoreSearchUrl(storeName: string, productName: string): string | undefined {
  const lower = storeName.toLowerCase();
  for (const [key, base] of Object.entries(STORE_SEARCH_URLS)) {
    if (lower.includes(key)) {
      return base + encodeURIComponent(productName);
    }
  }
  return undefined;
}

export const flippScraper: Scraper = {
  name: "flipp",
  countries: ["CA", "US"],

  async scrape(query, countryCode, postalCode) {
    const postal = postalCode || DEFAULT_POSTAL[countryCode] || DEFAULT_POSTAL.US;
    const locale = countryCode === "CA" ? "en-ca" : "en-us";

    const params = new URLSearchParams({
      locale,
      postal_code: postal,
      q: query,
    });

    try {
      const res = await fetch(
        `https://backflipp.wishabi.com/flipp/items/search?${params}`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            Accept: "application/json",
          },
        }
      );

      if (!res.ok) {
        console.error(`Flipp scraper error: ${res.status}`);
        return [];
      }

      const data: FlippResponse = await res.json();
      if (!data.items || data.items.length === 0) return [];

      const currency = countryCode === "CA" ? "CAD" : "USD";
      const results: ScrapedPrice[] = [];

      for (const item of data.items) {
        const price = parseFlippPrice(item);
        if (!price || price <= 0 || price > 9999) continue;

        // Skip items without a product name
        const productName = item.name || item.description;
        if (!productName) continue;

        const store = item.merchant_name || item.merchant || "Unknown Store";
        results.push({
          storeName: store,
          price,
          currency,
          productName,
          imageUrl: item.clean_image_url || item.clipping_image_url || item.cutout_image_url || item.image_url || undefined,
          unit: parseUnit(item),
          validUntil: item.valid_to || undefined,
          productUrl: buildStoreSearchUrl(store, productName),
        });
      }

      return results;
    } catch (err) {
      console.error("Flipp scraper failed:", err);
      return [];
    }
  },
};
