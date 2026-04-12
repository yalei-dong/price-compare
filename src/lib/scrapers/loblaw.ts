// ---------------------------------------------------------------------------
// Loblaw Digital scraper — Covers Loblaws, No Frills, Real Canadian Superstore,
// Shoppers Drug Mart, Provigo, Maxi, Fortinos, Valu-mart, Zehrs, etc.
// Uses the public PC Express / Loblaw API. No API key needed.
// ---------------------------------------------------------------------------

import { Scraper, ScrapedPrice } from "./types";

interface LoblawProduct {
  name?: string;
  brand?: string;
  prices?: {
    price?: { value?: number; quantity?: number; unit?: string };
    wasPrice?: { value?: number };
    comparisonPrices?: { value?: number; unit?: string }[];
  };
  imageAssets?: { smallUrl?: string; mediumUrl?: string }[];
  link?: string;
  articleNumber?: string;
  packageSize?: string;
}

interface LoblawSearchResponse {
  results?: LoblawProduct[];
  pagination?: { totalResults?: number };
}

// Banner IDs for different Loblaw stores
const BANNERS: Record<string, { id: string; name: string; baseUrl: string }> = {
  loblaws:    { id: "1", name: "Loblaws",     baseUrl: "https://www.loblaws.ca" },
  nofrills:   { id: "2", name: "No Frills",   baseUrl: "https://www.nofrills.ca" },
  superstore: { id: "3", name: "Real Canadian Superstore", baseUrl: "https://www.realcanadiansuperstore.ca" },
  provigo:    { id: "5", name: "Provigo",      baseUrl: "https://www.provigo.ca" },
  maxi:       { id: "6", name: "Maxi",         baseUrl: "https://www.maxi.ca" },
  fortinos:   { id: "10", name: "Fortinos",    baseUrl: "https://www.fortinos.ca" },
};

// Which banners to scrape (main ones)
const DEFAULT_BANNERS = ["loblaws", "nofrills", "superstore"];

async function scrapeBanner(
  bannerKey: string,
  query: string,
  postalCode: string
): Promise<ScrapedPrice[]> {
  const banner = BANNERS[bannerKey];
  if (!banner) return [];

  // Primary: scrape the rendered search page HTML (works even when API
  // is under maintenance). Falls back to JSON API if HTML has 0 results.
  const htmlResults = await scrapeBannerHTML(banner, query);
  if (htmlResults.length > 0) return htmlResults;

  // Fallback: try the JSON product search API
  const searchUrl = `${banner.baseUrl}/api/product-page/find-products?searchTerm=${encodeURIComponent(query)}&page=1&itemsPerPage=10&sort=relevance&type=product`;

  try {
    const res = await fetch(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "en-CA,en;q=0.9",
        "Site-Banner": banner.id,
      },
    });

    const contentType = res.headers.get("content-type") || "";
    if (!res.ok || !contentType.includes("application/json")) return [];

    const data: LoblawSearchResponse = await res.json();
    if (!data.results || data.results.length === 0) return [];

    const results: ScrapedPrice[] = [];
    for (const product of data.results) {
      const price = product.prices?.price?.value;
      if (!price || price <= 0) continue;

      const name = [product.brand, product.name].filter(Boolean).join(" ");
      const imageUrl = product.imageAssets?.[0]?.mediumUrl || product.imageAssets?.[0]?.smallUrl || undefined;
      const unit = product.prices?.price?.unit || "each";
      const flyerParams = new URLSearchParams();
      flyerParams.set("store", banner.name);
      flyerParams.set("product", name || query);
      flyerParams.set("price", price.toString());
      flyerParams.set("currency", "CAD");
      if (imageUrl) flyerParams.set("image", imageUrl);
      if (unit) flyerParams.set("unit", unit);
      if (product.packageSize) flyerParams.set("size", product.packageSize);
      flyerParams.set("q", query);
      results.push({
        storeName: banner.name,
        price,
        currency: "CAD",
        productName: name || query,
        productUrl: `/flyer-item?${flyerParams.toString()}`,
        imageUrl,
        unit,
      });
    }

    return results;
  } catch (err) {
    console.error(`Loblaw ${banner.name} API scraper failed:`, err);
    return [];
  }
}

async function scrapeBannerHTML(
  banner: { name: string; baseUrl: string },
  query: string
): Promise<ScrapedPrice[]> {
  try {
    const url = `${banner.baseUrl}/search?search-bar=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-CA,en;q=0.9",
      },
    });

    if (!res.ok) return [];
    const html = await res.text();

    // The Loblaws search page renders product tiles with data-testid attributes.
    // Split by "product-image" testid to isolate each product block.
    const blocks = html.split(/data-testid="product-image"/);

    const results: ScrapedPrice[] = [];
    for (let i = 1; i < blocks.length && results.length < 10; i++) {
      const block = blocks[i];

      // Product name from data-testid attributes
      const brandMatch = block.match(/data-testid="product-brand"[^>]*>([^<]+)/);
      const titleMatch = block.match(/data-testid="product-title"[^>]*>([^<]+)/);
      const brand = brandMatch?.[1]?.trim() || "";
      const title = titleMatch?.[1]?.trim() || "";

      // Fallback: extract from img alt text
      const altMatch = block.match(/alt="([^"]+)"/);
      const altText = altMatch?.[1] || "";

      const name = title
        ? `${brand ? brand + " " : ""}${title}`
        : altText;
      if (!name || name.length < 3) continue;

      // Decode HTML entities
      const decoded = name
        .replace(/&#x27;/g, "'")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"');

      // Price: prefer sale-price > regular-price > price-product-tile > any $x.xx
      const salePriceMatch = block.match(/data-testid="sale-price"[\s\S]*?\$\s*(\d+\.\d{2})/);
      const regPriceMatch = block.match(/data-testid="regular-price"[\s\S]*?\$\s*(\d+\.\d{2})/);
      const tilePriceMatch = block.match(/data-testid="price-product-tile"[\s\S]*?\$\s*(\d+\.\d{2})/);
      const anyPriceMatch = block.match(/\$\s*(\d+\.\d{2})/);
      const priceStr =
        salePriceMatch?.[1] || regPriceMatch?.[1] || tilePriceMatch?.[1] || anyPriceMatch?.[1];
      const price = priceStr ? parseFloat(priceStr) : 0;
      if (price <= 0 || price > 9999) continue;

      // Package size
      const sizeMatch = block.match(/data-testid="product-package-size"[^>]*>([^<]+)/);
      const size = sizeMatch?.[1]?.trim() || "";

      // Image URL
      const imgMatch = block.match(/src="(https:\/\/[^"]+)"/);
      const imageUrl = imgMatch?.[1] || undefined;

      const fp = new URLSearchParams();
      fp.set("store", banner.name);
      fp.set("product", decoded);
      fp.set("price", price.toString());
      fp.set("currency", "CAD");
      if (imageUrl) fp.set("image", imageUrl);
      fp.set("unit", "each");
      if (size) fp.set("size", size);
      fp.set("q", query);

      results.push({
        storeName: banner.name,
        price,
        currency: "CAD",
        productName: decoded,
        productUrl: `/flyer-item?${fp.toString()}`,
        imageUrl,
        unit: "each",
      });
    }

    return results;
  } catch (err) {
    console.error(`Loblaw ${banner.name} HTML scraper failed:`, err);
    return [];
  }
}

export const loblawScraper: Scraper = {
  name: "loblaw",
  countries: ["CA"],

  async scrape(query, countryCode, postalCode) {
    if (countryCode !== "CA") return [];

    const postal = postalCode || "M5V 3L9";
    const bannerResults = await Promise.all(
      DEFAULT_BANNERS.map((b) => scrapeBanner(b, query, postal))
    );

    return bannerResults.flat();
  },
};
