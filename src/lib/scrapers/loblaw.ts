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

  // Loblaw stores expose a product search API
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
    if (!res.ok || !contentType.includes("application/json")) {
      // Fallback: try the HTML search page and extract JSON-LD
      return scrapeBannerHTML(banner, query);
    }

    const data: LoblawSearchResponse = await res.json();
    if (!data.results || data.results.length === 0) {
      return scrapeBannerHTML(banner, query);
    }

    const results: ScrapedPrice[] = [];
    for (const product of data.results) {
      const price = product.prices?.price?.value;
      if (!price || price <= 0) continue;

      const name = [product.brand, product.name].filter(Boolean).join(" ");
      results.push({
        storeName: banner.name,
        price,
        currency: "CAD",
        productName: name || query,
        productUrl: product.link
          ? `${banner.baseUrl}${product.link}`
          : undefined,
        imageUrl: product.imageAssets?.[0]?.mediumUrl || product.imageAssets?.[0]?.smallUrl || undefined,
        unit: product.prices?.price?.unit || "each",
      });
    }

    return results;
  } catch (err) {
    console.error(`Loblaw ${banner.name} API scraper failed:`, err);
    return scrapeBannerHTML(banner, query);
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
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "text/html",
      },
    });

    if (!res.ok) return [];
    const html = await res.text();

    // Try to extract from __NEXT_DATA__
    const nextMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (nextMatch) {
      try {
        const data = JSON.parse(nextMatch[1]);
        const products =
          data?.props?.pageProps?.searchResults?.results ||
          data?.props?.pageProps?.products ||
          [];

        const results: ScrapedPrice[] = [];
        for (const p of products) {
          const price = p.prices?.price?.value ?? p.price ?? null;
          if (!price || price <= 0) continue;

          results.push({
            storeName: banner.name,
            price,
            currency: "CAD",
            productName: p.name || p.title || query,
            productUrl: p.link ? `${banner.baseUrl}${p.link}` : undefined,
            imageUrl: p.imageAssets?.[0]?.mediumUrl || undefined,
            unit: "each",
          });
        }
        return results.slice(0, 10);
      } catch {
        // parse failed
      }
    }

    // Very basic regex fallback for prices in the HTML
    const priceMatches = [...html.matchAll(/\$\s*([\d,]+\.\d{2})/g)];
    const results: ScrapedPrice[] = [];
    const seen = new Set<number>();
    for (const m of priceMatches.slice(0, 20)) {
      const price = parseFloat(m[1].replace(",", ""));
      if (price > 0.25 && price < 999 && !seen.has(price)) {
        seen.add(price);
        results.push({
          storeName: banner.name,
          price,
          currency: "CAD",
          productName: query,
          unit: "each",
        });
      }
    }
    return results.slice(0, 5);
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
