import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// /api/flyers — returns live flyer listings + deal items from Flipp
// ---------------------------------------------------------------------------

interface FlippFlyer {
  id: number;
  merchant: string;
  merchant_logo: string;
  name: string;
  thumbnail_url: string;
  valid_from: string;
  valid_to: string;
  categories_csv: string;
}

interface FlippItem {
  name?: string;
  merchant_name?: string;
  current_price?: number;
  original_price?: number;
  price_text?: string;
  pre_price_text?: string;
  sale_story?: string;
  clean_image_url?: string;
  clipping_image_url?: string;
  cutout_image_url?: string;
  valid_from?: string;
  valid_to?: string;
  flyer_id?: number;
  flyer_item_id?: number;
  _L1?: string;
  _L2?: string;
}

// In-memory cache
let flyersCache: { data: unknown; ts: number } | null = null;
let itemsCache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 min

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  Accept: "application/json",
};

const DEFAULT_POSTAL: Record<string, string> = {
  CA: "M5V 3L9",
  US: "10001",
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") || "CA";
  const postalCode =
    searchParams.get("postal") || DEFAULT_POSTAL[locale] || "M5V 3L9";
  const category = searchParams.get("category") || ""; // "" = popular items
  const mode = searchParams.get("mode") || "flyers"; // "flyers" or "deals"

  const localeCode = locale === "CA" ? "en-ca" : "en-us";

  try {
    if (mode === "flyers") {
      // Return list of active flyers
      const cacheKey = `flyers-${localeCode}-${postalCode}`;
      if (flyersCache && Date.now() - flyersCache.ts < CACHE_TTL) {
        return NextResponse.json(flyersCache.data);
      }

      const params = new URLSearchParams({
        locale: localeCode,
        postal_code: postalCode,
      });

      const res = await fetch(
        `https://backflipp.wishabi.com/flipp/flyers?${params}`,
        { headers: HEADERS }
      );

      if (!res.ok) {
        return NextResponse.json({ flyers: [] }, { status: 200 });
      }

      const data = await res.json();
      const flyers = (data.flyers || [])
        .filter((f: FlippFlyer) => {
          // Only show flyers that are currently valid
          const now = new Date();
          const validTo = new Date(f.valid_to);
          return validTo > now;
        })
        .map((f: FlippFlyer) => ({
          id: f.id,
          merchant: f.merchant,
          merchantLogo: f.merchant_logo?.replace("http://", "https://"),
          name: f.name,
          thumbnail: f.thumbnail_url?.replace("http://", "https://"),
          validFrom: f.valid_from,
          validTo: f.valid_to,
          categories: f.categories_csv,
        }));

      // Deduplicate: keep only the latest flyer per merchant
      const byMerchant = new Map<string, (typeof flyers)[0]>();
      for (const f of flyers) {
        const key = f.merchant.toLowerCase();
        if (
          !byMerchant.has(key) ||
          new Date(f.validFrom) > new Date(byMerchant.get(key)!.validFrom)
        ) {
          byMerchant.set(key, f);
        }
      }

      const result = {
        flyers: [...byMerchant.values()].sort((a, b) =>
          a.merchant.localeCompare(b.merchant)
        ),
      };

      flyersCache = { data: result, ts: Date.now() };
      return NextResponse.json(result);
    }

    // mode === "deals" — return deal items
    const query = category || "weekly deals";
    const itemCacheKey = `${localeCode}-${postalCode}-${query}`;
    const cached = itemsCache.get(itemCacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // Fetch popular grocery categories in parallel
    const queries =
      category
        ? [category]
        : [
            "chicken",
            "eggs",
            "milk",
            "bread",
            "rice",
            "fruits",
            "vegetables",
            "cheese",
            "snacks",
            "cereal",
          ];

    const allItems: FlippItem[] = [];
    const results = await Promise.allSettled(
      queries.map(async (q) => {
        const params = new URLSearchParams({
          locale: localeCode,
          postal_code: postalCode,
          q,
        });
        const res = await fetch(
          `https://backflipp.wishabi.com/flipp/items/search?${params}`,
          { headers: HEADERS }
        );
        if (!res.ok) return [];
        const data = await res.json();
        return (data.items || []) as FlippItem[];
      })
    );

    for (const r of results) {
      if (r.status === "fulfilled") {
        allItems.push(...r.value);
      }
    }

    // Parse and deduplicate
    const deals = allItems
      .filter(
        (item) =>
          item.name &&
          item.merchant_name &&
          item.current_price &&
          item.current_price > 0
      )
      .map((item) => ({
        name: item.name!,
        store: item.merchant_name!,
        price: item.current_price!,
        originalPrice: item.original_price || null,
        image:
          item.clean_image_url ||
          item.clipping_image_url ||
          item.cutout_image_url ||
          null,
        saleStory: item.sale_story || null,
        validFrom: item.valid_from || null,
        validTo: item.valid_to || null,
        category: item._L1 || "Other",
      }));

    // Deduplicate by name+store, keep cheapest
    const seen = new Map<string, (typeof deals)[0]>();
    for (const d of deals) {
      const key = `${d.name.toLowerCase()}|${d.store.toLowerCase()}`;
      if (!seen.has(key) || d.price < seen.get(key)!.price) {
        seen.set(key, d);
      }
    }

    const deduped = [...seen.values()].sort((a, b) => a.price - b.price);

    const result = { deals: deduped, count: deduped.length };

    // Manage cache size
    if (itemsCache.size > 50) {
      const oldest = itemsCache.keys().next().value;
      if (oldest !== undefined) itemsCache.delete(oldest);
    }
    itemsCache.set(itemCacheKey, { data: result, ts: Date.now() });

    return NextResponse.json(result);
  } catch (err) {
    console.error("Flyers API error:", err);
    return NextResponse.json({ flyers: [], deals: [] }, { status: 200 });
  }
}
