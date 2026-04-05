import { PriceEntry, Product, Country } from "./types";
import { getLocaleConfig } from "./locale";

// ---------------------------------------------------------------------------
// SerpAPI – Google Shopping
// Sign up free at https://serpapi.com (100 searches/month free)
// Set SERPAPI_KEY in .env.local
// ---------------------------------------------------------------------------

interface SerpShoppingResult {
  title: string;
  link: string;            // direct URL to the store's product page
  product_link: string;    // Google Shopping product page (google.com)
  source: string;
  source_info?: { link?: string };
  price: string;
  extracted_price: number;
  thumbnail: string;
  delivery?: string;
}

interface SerpAPIResponse {
  shopping_results?: SerpShoppingResult[];
  error?: string;
}

const STORE_META: Record<string, { logo: string; type: "online" | "local" | "both" }> = {
  "amazon": { logo: "🅰️", type: "online" },
  "walmart": { logo: "🟦", type: "both" },
  "costco": { logo: "🔴", type: "both" },
  "target": { logo: "🎯", type: "both" },
  "kroger": { logo: "🏪", type: "both" },
  "safeway": { logo: "🏪", type: "both" },
  "save-on-foods": { logo: "🏪", type: "both" },
  "ebay": { logo: "🛍️", type: "online" },
  "instacart": { logo: "🥕", type: "online" },
  "loblaws": { logo: "🍁", type: "both" },
  "no frills": { logo: "🟡", type: "both" },
  "nofrills": { logo: "🟡", type: "both" },
  "freshco": { logo: "🥬", type: "both" },
  "metro": { logo: "🏬", type: "both" },
  "sobeys": { logo: "🟢", type: "both" },
  "voilà": { logo: "🟢", type: "online" },
  "voila": { logo: "🟢", type: "online" },
  "real canadian superstore": { logo: "🏪", type: "both" },
  "superc": { logo: "🏪", type: "both" },
  "food basics": { logo: "🏪", type: "both" },
  "foodbasics": { logo: "🏪", type: "both" },
  "jd.com": { logo: "🟥", type: "online" },
  "taobao": { logo: "🟧", type: "online" },
  "pinduoduo": { logo: "🟠", type: "online" },
  "default": { logo: "🏷️", type: "online" },
};

function detectStoreMeta(source: string): { logo: string; type: "online" | "local" | "both" } {
  const lower = source.toLowerCase();
  for (const [key, val] of Object.entries(STORE_META)) {
    if (key !== "default" && lower.includes(key)) return val;
  }
  return STORE_META["default"];
}

/** Strip Google redirect wrappers (e.g. google.com/url?q=...) and return the actual store URL. */
function extractDirectUrl(rawUrl: string): string {
  if (!rawUrl) return "";
  try {
    const parsed = new URL(rawUrl);
    // Google redirect: google.com/url?q=<actual>&...  or  google.com/aclk?...&adurl=<actual>
    if (parsed.hostname.includes("google.") && parsed.pathname === "/url") {
      const q = parsed.searchParams.get("q") || parsed.searchParams.get("url");
      if (q) return q;
    }
    if (parsed.hostname.includes("google.") && parsed.searchParams.has("adurl")) {
      return parsed.searchParams.get("adurl")!;
    }
  } catch {
    // not a valid URL, return as-is
  }
  return rawUrl;
}

/** Check whether a URL ends up on google.com (Shopping page, redirect, etc.) */
function isGoogleUrl(url: string): boolean {
  if (!url) return true;
  try {
    return new URL(url).hostname.includes("google.");
  } catch {
    return false;
  }
}

/**
 * Map a store name (from SerpAPI `source`) to a direct search URL on that store's website.
 * This is the fallback when SerpAPI only gives us Google Shopping links.
 */
const STORE_DIRECT_URLS: Record<string, (q: string) => string> = {
  // US stores
  "amazon.com":     (q) => `https://www.amazon.com/s?k=${encodeURIComponent(q)}`,
  "walmart.com":    (q) => `https://www.walmart.com/search?q=${encodeURIComponent(q)}`,
  "costco":         (q) => `https://www.costco.com/CatalogSearch?dept=All&keyword=${encodeURIComponent(q)}`,
  "target":         (q) => `https://www.target.com/s?searchTerm=${encodeURIComponent(q)}`,
  "kroger":         (q) => `https://www.kroger.com/search?query=${encodeURIComponent(q)}`,
  "safeway":        (q) => `https://www.safeway.com/shop/search-results.html?q=${encodeURIComponent(q)}`,
  "ebay":           (q) => `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(q)}`,
  "instacart":      (q) => `https://www.instacart.com/store/search/${encodeURIComponent(q)}`,
  "trader joe":     (q) => `https://www.traderjoes.com/home/search?q=${encodeURIComponent(q)}`,
  // Canada stores
  "amazon.ca":      (q) => `https://www.amazon.ca/s?k=${encodeURIComponent(q)}`,
  "walmart.ca":     (q) => `https://www.walmart.ca/search?q=${encodeURIComponent(q)}`,
  "costco.ca":      (q) => `https://www.costco.ca/CatalogSearch?dept=All&keyword=${encodeURIComponent(q)}`,
  "loblaws":        (q) => `https://www.loblaws.ca/search?search-bar=${encodeURIComponent(q)}`,
  "no frills":      (q) => `https://www.nofrills.ca/search?search-bar=${encodeURIComponent(q)}`,
  "nofrills":       (q) => `https://www.nofrills.ca/search?search-bar=${encodeURIComponent(q)}`,
  "metro":          (q) => `https://www.metro.ca/en/search?filter=${encodeURIComponent(q)}`,
  "sobeys":         (q) => `https://www.sobeys.com/search/?search_term=${encodeURIComponent(q)}`,
  "freshco":        (q) => `https://www.freshco.com/search/?search-term=${encodeURIComponent(q)}`,
  "superc":         (q) => `https://www.superc.ca/en/search?filter=${encodeURIComponent(q)}`,
  "food basics":    (q) => `https://www.foodbasics.ca/search?filter=${encodeURIComponent(q)}`,
  "voilà":          (q) => `https://www.voila.ca/search?q=${encodeURIComponent(q)}`,
  "voila":          (q) => `https://www.voila.ca/search?q=${encodeURIComponent(q)}`,
  "real canadian superstore": (q) => `https://www.realcanadiansuperstore.ca/search?search-bar=${encodeURIComponent(q)}`,
  "save-on-foods":  (q) => `https://www.saveonfoods.com/search?search-term=${encodeURIComponent(q)}`,
  // China stores
  "jd.com":         (q) => `https://search.jd.com/Search?keyword=${encodeURIComponent(q)}`,
  "taobao":         (q) => `https://s.taobao.com/search?q=${encodeURIComponent(q)}`,
  "pinduoduo":      (q) => `https://mobile.yangkeduo.com/search_result.html?search_key=${encodeURIComponent(q)}`,
  "hema":           (q) => `https://www.freshhema.com/search?keyword=${encodeURIComponent(q)}`,
  // UK / EU
  "tesco":          (q) => `https://www.tesco.com/groceries/en-GB/search?query=${encodeURIComponent(q)}`,
  "asda":           (q) => `https://groceries.asda.com/search/${encodeURIComponent(q)}`,
  "sainsbury":      (q) => `https://www.sainsburys.co.uk/gol-ui/SearchResults/${encodeURIComponent(q)}`,
  "aldi":           (q) => `https://www.aldi.com/search?q=${encodeURIComponent(q)}`,
  "lidl":           (q) => `https://www.lidl.com/search?query=${encodeURIComponent(q)}`,
  "carrefour":      (q) => `https://www.carrefour.com/search?query=${encodeURIComponent(q)}`,
};

/** Given a store name from SerpAPI, build a direct search URL on the store's website. */
function buildStoreDirectUrl(storeName: string, query: string): string {
  const lower = storeName.toLowerCase();
  for (const [key, buildUrl] of Object.entries(STORE_DIRECT_URLS)) {
    if (lower.includes(key)) return buildUrl(query);
  }
  // Last resort: Google search scoped to the store's domain-like name
  // e.g. "SuperC.ca" → site:superc.ca
  const domainMatch = lower.match(/([a-z0-9-]+\.(com|ca|co\.uk|cn|com\.au|com\.br|co\.jp|co\.kr|de|fr|es|pt))/);
  if (domainMatch) {
    return `https://${domainMatch[1]}/search?q=${encodeURIComponent(query)}`;
  }
  return "";
}

const COUNTRY_GL: Record<string, { gl: string; currency: string; country: Country }> = {
  US: { gl: "us", currency: "USD", country: "US" },
  CA: { gl: "ca", currency: "CAD", country: "CA" },
  CN: { gl: "cn", currency: "CNY", country: "CN" },
  UK: { gl: "uk", currency: "GBP", country: "US" },
  AU: { gl: "au", currency: "AUD", country: "US" },
  IN: { gl: "in", currency: "INR", country: "US" },
  JP: { gl: "jp", currency: "JPY", country: "US" },
  KR: { gl: "kr", currency: "KRW", country: "US" },
  DE: { gl: "de", currency: "EUR", country: "US" },
  FR: { gl: "fr", currency: "EUR", country: "US" },
  MX: { gl: "mx", currency: "MXN", country: "US" },
  BR: { gl: "br", currency: "BRL", country: "US" },
};

export async function fetchGoogleShoppingPrices(
  query: string,
  countryCode: string = "US"
): Promise<PriceEntry[]> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) return [];

  const locale = getLocaleConfig(countryCode);
  const glConfig = COUNTRY_GL[countryCode] || { gl: locale.gl, currency: locale.currency, country: "US" as Country };
  const params = new URLSearchParams({
    engine: "google_shopping",
    q: query,
    gl: glConfig.gl,
    hl: locale.lang,
    api_key: apiKey,
    num: "20",
  });

  try {
    const res = await fetch(`https://serpapi.com/search.json?${params.toString()}`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!res.ok) {
      console.error(`SerpAPI error: ${res.status} ${res.statusText}`);
      return [];
    }

    const data: SerpAPIResponse = await res.json();

    if (!data.shopping_results || data.shopping_results.length === 0) {
      return [];
    }

    const today = new Date().toISOString().slice(0, 10);

    return data.shopping_results
      .filter((r) => r.extracted_price > 0)
      .map((result, idx) => {
        const meta = detectStoreMeta(result.source);

        // Try to get a non-Google URL from SerpAPI fields
        const rawCandidates = [
          result.link,
          result.source_info?.link,
          result.product_link,
        ].filter(Boolean) as string[];

        const extracted = rawCandidates.map((u) => extractDirectUrl(u));

        // 1st choice: a direct (non-Google) URL extracted from SerpAPI
        let url = extracted.find((u) => !isGoogleUrl(u)) || "";

        // 2nd choice: the original SerpAPI link (even if it's a Google redirect)
        // — Google Shopping redirect URLs (google.com/url?q=...) still land on the
        //   correct product page, which is better than a generic store search.
        if (!url) {
          url = rawCandidates[0] || "";
        }

        // 3rd choice: build a direct store search URL as last resort
        if (!url || isGoogleUrl(url)) {
          const storeSearch = buildStoreDirectUrl(result.source, query);
          if (storeSearch) url = storeSearch;
        }

        return {
          storeId: `serp-${glConfig.gl}-${idx}`,
          storeName: result.source,
          storeLogo: meta.logo,
          country: glConfig.country,
          type: meta.type,
          price: result.extracted_price,
          currency: glConfig.currency,
          unit: "each",
          url,
          thumbnail: result.thumbnail || undefined,
          lastUpdated: today,
          inStock: true,
        };
      });
  } catch (err) {
    console.error("SerpAPI fetch failed:", err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Open Food Facts – free product database (barcode lookup)
// No API key needed
// Docs: https://wiki.openfoodfacts.org/API
// ---------------------------------------------------------------------------

interface OFFProduct {
  product_name?: string;
  brands?: string;
  categories?: string;
  image_url?: string;
  code?: string;
  quantity?: string;
}

export async function fetchOpenFoodFactsProduct(barcode: string): Promise<{
  name: string;
  category: string;
  image: string;
  description: string;
  barcode: string;
} | null> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`,
      { next: { revalidate: 86400 } } // Cache for 24 hours
    );

    if (!res.ok) return null;

    const data = await res.json();
    if (data.status !== 1 || !data.product) return null;

    const p: OFFProduct = data.product;
    return {
      name: [p.product_name, p.brands].filter(Boolean).join(" – ") || `Product ${barcode}`,
      category: p.categories?.split(",")[0]?.trim() || "Grocery",
      image: p.image_url || "",
      description: [p.product_name, p.brands, p.quantity].filter(Boolean).join(", "),
      barcode,
    };
  } catch (err) {
    console.error("Open Food Facts fetch failed:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Multi-country price aggregator
// Fetches prices from Google Shopping for US, CA, CN in parallel
// ---------------------------------------------------------------------------

export async function fetchPricesForLocale(
  query: string,
  localeCode: string = "US"
): Promise<PriceEntry[]> {
  return fetchGoogleShoppingPrices(query, localeCode);
}

// ---------------------------------------------------------------------------
// Combined search: merge real API results with optional mock fallback
// ---------------------------------------------------------------------------

import { searchProducts as searchMockProducts, getProductById as getMockProduct, getCategories } from "./mock-data";

export async function searchProductsReal(
  query: string,
  category?: string,
  storeType?: string,
  localeCode: string = "US"
): Promise<{ products: Product[]; categories: string[]; source: "live" | "mock" | "mixed" }> {
  const categories = getCategories();
  const hasSerpKey = !!process.env.SERPAPI_KEY;

  // If no API key, fall back to mock data filtered by locale
  if (!hasSerpKey) {
    const mockProducts = searchMockProducts(query, category, localeCode, storeType);
    return { products: mockProducts, categories, source: "mock" };
  }

  // Try live prices
  if (!query || query.trim().length === 0) {
    const mockProducts = searchMockProducts(query, category, localeCode, storeType);
    return { products: mockProducts, categories, source: "mock" };
  }

  const livePrices = await fetchGoogleShoppingPrices(query, localeCode);

  if (livePrices.length === 0) {
    // API returned nothing — fall back to mock
    const mockProducts = searchMockProducts(query, category, localeCode, storeType);
    return { products: mockProducts, categories, source: "mock" };
  }

  // Filter by store type if requested
  let filtered = livePrices;
  if (storeType && storeType !== "all") {
    filtered = filtered.filter((p) => p.type === storeType);
  }

  // Build a single product from the live results
  const firstThumbnail = filtered.find((p) => p.thumbnail)?.thumbnail || "";
  const liveProduct: Product = {
    id: `live-${encodeURIComponent(query)}`,
    name: query,
    category: category && category !== "all" ? category : "Search Result",
    image: firstThumbnail || "🔍",
    description: `Live prices for "${query}" from Google Shopping`,
    prices: filtered,
  };

  // Also include mock matches if any
  const mockProducts = searchMockProducts(query, category, localeCode, storeType);

  return {
    products: [liveProduct, ...mockProducts],
    categories,
    source: mockProducts.length > 0 ? "mixed" : "live",
  };
}

export async function getProductByIdReal(id: string, localeCode: string = "US"): Promise<Product | null> {
  const hasSerpKey = !!process.env.SERPAPI_KEY;

  // If it's a live product ID, re-fetch prices
  if (id.startsWith("live-") && hasSerpKey) {
    const query = decodeURIComponent(id.replace("live-", ""));
    const prices = await fetchGoogleShoppingPrices(query, localeCode);
    if (prices.length > 0) {
      const thumb = prices.find((p) => p.thumbnail)?.thumbnail || "";
      return {
        id,
        name: query,
        category: "Search Result",
        image: thumb || "🔍",
        description: `Live prices for "${query}" from Google Shopping`,
        prices,
      };
    }
  }

  // Check mock data
  const mock = getMockProduct(id);
  if (!mock) return null;

  // Filter mock prices to locale country only
  const localePrices = mock.prices.filter((p) => p.country === localeCode);

  // If we have SerpAPI key, enrich with live prices
  if (hasSerpKey) {
    const livePrices = await fetchGoogleShoppingPrices(mock.name, localeCode);
    if (livePrices.length > 0) {
      return {
        ...mock,
        prices: [...livePrices, ...localePrices],
        description: mock.description + " (includes live prices)",
      };
    }
  }

  return { ...mock, prices: localePrices };
}
