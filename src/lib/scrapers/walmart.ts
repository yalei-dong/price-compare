// ---------------------------------------------------------------------------
// Walmart scraper — Scrapes search results from Walmart.ca and Walmart.com
// No API key needed. Uses their public search endpoint.
// ---------------------------------------------------------------------------

import { Scraper, ScrapedPrice } from "./types";

interface WalmartSearchItem {
  name?: string;
  description?: string;
  imageInfo?: { thumbnailUrl?: string };
  priceInfo?: {
    currentPrice?: { price?: number; priceString?: string };
    linePrice?: { price?: number; priceString?: string };
  };
  canonicalUrl?: string;
  usItemId?: string;
}

// Walmart.ca uses a different structure
interface WalmartCAItem {
  title?: string;
  price?: { value?: number; displayValue?: string };
  image?: { url?: string };
  link?: { url?: string };
  skuId?: string;
}

export const walmartScraper: Scraper = {
  name: "walmart",
  countries: ["CA", "US"],

  async scrape(query, countryCode) {
    if (countryCode === "CA") {
      return scrapeWalmartCA(query);
    }
    return scrapeWalmartUS(query);
  },
};

async function scrapeWalmartCA(query: string): Promise<ScrapedPrice[]> {
  // Walmart.ca search page returns data in a script tag
  const url = `https://www.walmart.ca/search?q=${encodeURIComponent(query)}&c=10019`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-CA,en;q=0.9",
      },
    });

    if (!res.ok) return [];

    const html = await res.text();

    // Extract product data from __NEXT_DATA__ or inline JSON
    const results: ScrapedPrice[] = [];

    // Try to find prices in the HTML with regex
    // Walmart.ca embeds product data in JSON-LD or __NEXT_DATA__
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (nextDataMatch) {
      try {
        const nextData = JSON.parse(nextDataMatch[1]);
        const searchResult =
          nextData?.props?.pageProps?.initialData?.searchResult?.itemStacks?.[0]?.items ||
          nextData?.props?.pageProps?.searchResult?.itemStacks?.[0]?.items ||
          [];

        for (const item of searchResult) {
          const price =
            item.price?.value ??
            item.priceInfo?.currentPrice?.price ??
            null;
          if (!price || price <= 0) continue;

          results.push({
            storeName: "Walmart.ca",
            price,
            currency: "CAD",
            productName: item.title || item.name || query,
            productUrl: item.canonicalUrl
              ? `https://www.walmart.ca${item.canonicalUrl}`
              : item.link?.url
                ? `https://www.walmart.ca${item.link.url}`
                : undefined,
            imageUrl: item.imageInfo?.thumbnailUrl || item.image?.url || undefined,
            unit: "each",
          });
        }
      } catch {
        // JSON parse failed, try regex fallback
      }
    }

    // Regex fallback — find prices in HTML
    if (results.length === 0) {
      const priceMatches = [...html.matchAll(/data-automation="current-price"[^>]*>\s*\$\s*([\d,]+\.\d{2})/g)];
      const nameMatches = [...html.matchAll(/data-automation="name"[^>]*>([^<]+)</g)];

      const count = Math.min(priceMatches.length, nameMatches.length, 10);
      for (let i = 0; i < count; i++) {
        const price = parseFloat(priceMatches[i][1].replace(",", ""));
        if (price > 0 && price < 9999) {
          results.push({
            storeName: "Walmart.ca",
            price,
            currency: "CAD",
            productName: nameMatches[i]?.[1]?.trim() || query,
            unit: "each",
          });
        }
      }
    }

    return results.slice(0, 10);
  } catch (err) {
    console.error("Walmart.ca scraper failed:", err);
    return [];
  }
}

async function scrapeWalmartUS(query: string): Promise<ScrapedPrice[]> {
  const url = `https://www.walmart.com/search?q=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!res.ok) return [];

    const html = await res.text();
    const results: ScrapedPrice[] = [];

    // Extract from __NEXT_DATA__
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (nextDataMatch) {
      try {
        const nextData = JSON.parse(nextDataMatch[1]);
        const items =
          nextData?.props?.pageProps?.initialData?.searchResult?.itemStacks?.[0]?.items || [];

        for (const item of items as WalmartSearchItem[]) {
          const price =
            item.priceInfo?.currentPrice?.price ??
            item.priceInfo?.linePrice?.price ??
            null;
          if (!price || price <= 0) continue;

          results.push({
            storeName: "Walmart",
            price,
            currency: "USD",
            productName: item.name || query,
            productUrl: item.canonicalUrl
              ? `https://www.walmart.com${item.canonicalUrl}`
              : undefined,
            imageUrl: item.imageInfo?.thumbnailUrl || undefined,
            unit: "each",
          });
        }
      } catch {
        // parse failed
      }
    }

    // Regex fallback
    if (results.length === 0) {
      const priceRegex = /\$\s*([\d,]+\.\d{2})/g;
      const matches = [...html.matchAll(priceRegex)].slice(0, 15);
      for (const m of matches) {
        const price = parseFloat(m[1].replace(",", ""));
        if (price > 0.5 && price < 999) {
          results.push({
            storeName: "Walmart",
            price,
            currency: "USD",
            productName: query,
            unit: "each",
          });
        }
      }
      // Deduplicate by price
      const seen = new Set<number>();
      return results.filter((r) => {
        if (seen.has(r.price)) return false;
        seen.add(r.price);
        return true;
      }).slice(0, 5);
    }

    return results.slice(0, 10);
  } catch (err) {
    console.error("Walmart.com scraper failed:", err);
    return [];
  }
}
