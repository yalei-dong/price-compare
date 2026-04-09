// ---------------------------------------------------------------------------
// Costco scraper — Uses Instacart's GraphQL API (sameday.costco.ca) to fetch
// real Costco product prices via collection browsing, supplemented by Flipp
// flyer data. No API key or headless browser needed.
// ---------------------------------------------------------------------------

import { Scraper, ScrapedPrice } from "./types";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

// Persisted-query hashes from sameday.costco.ca SSR performance entries.
// These are stable across page loads but may change on Instacart deploys.
const HASHES = {
  ShopCollectionScoped:
    "c6a0fcb3d1a4a14e5800cc6c38e736e85177f80f0c01a5535646f83238e65bcb",
  DepartmentNavCollections:
    "e5231eab24795280ff3e556c24ddfedaed6d9d553a856fa20670428087a21ecb",
  CollectionProductsWithFeaturedProducts:
    "5573f6ef85bfad81463b431985396705328c5ac3283c4e183aa36c6aad1afafe",
};

// Toronto defaults
const DEFAULT_COORDS = { latitude: 43.6532, longitude: -79.3832 };
const DEFAULT_POSTAL = "M5V 3L9";
const DEFAULT_ZONE_ID = "758";
const DEFAULT_SHOP_ID = "1643";

// ---- Caches ----
let guestToken: string | null = null;
let tokenExpiresAt = 0;
let inventoryToken: string | null = null;
let inventoryTokenExpiresAt = 0;

interface CollectionInfo {
  name: string;
  slug: string;
}
let collectionCache: CollectionInfo[] = [];
let collectionCacheExpiresAt = 0;

// ---- Helper: Instacart GraphQL call ----
async function gql(
  token: string,
  operationName: string,
  variables: Record<string, unknown>,
  hash: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  const res = await fetch("https://sameday.costco.ca/graphql", {
    method: "POST",
    headers: {
      "User-Agent": UA,
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      Origin: "https://sameday.costco.ca",
    },
    body: JSON.stringify({
      operationName,
      variables,
      extensions: { persistedQuery: { version: 1, sha256Hash: hash } },
    }),
  });
  if (!res.ok) return null;
  return res.json();
}

// ---- Step 1: Guest auth token ----
async function getGuestToken(): Promise<string | null> {
  if (guestToken && Date.now() < tokenExpiresAt) return guestToken;
  try {
    const res = await fetch(
      "https://sameday.costco.ca/store/costco-canada/storefront",
      { headers: { "User-Agent": UA, Accept: "text/html" } }
    );
    if (!res.ok) return null;
    const html = await res.text();
    const m = html.match(/token%22%3A%22([^%"]+)/);
    if (!m) return null;
    guestToken = m[1];
    tokenExpiresAt = Date.now() + 12 * 60 * 60 * 1000;
    return guestToken;
  } catch {
    return null;
  }
}

// ---- Step 2: Inventory session token (location-scoped) ----
async function getInventoryToken(
  token: string,
  postalCode: string
): Promise<string | null> {
  if (inventoryToken && Date.now() < inventoryTokenExpiresAt)
    return inventoryToken;
  try {
    const data = await gql(
      token,
      "ShopCollectionScoped",
      {
        retailerSlug: "costco-canada",
        slug: "search",
        postalCode,
        coordinates: DEFAULT_COORDS,
      },
      HASHES.ShopCollectionScoped
    );
    const tok =
      data?.data?.shopCollection?.shops?.[0]?.retailerInventorySessionToken;
    if (!tok) return null;
    inventoryToken = tok;
    inventoryTokenExpiresAt = Date.now() + 30 * 60 * 1000; // 30 min
    return inventoryToken;
  } catch {
    return null;
  }
}

// ---- Step 3: Collection tree (cached 1h) ----
async function getCollections(
  token: string,
  invToken: string
): Promise<CollectionInfo[]> {
  if (collectionCache.length > 0 && Date.now() < collectionCacheExpiresAt)
    return collectionCache;
  try {
    const data = await gql(
      token,
      "DepartmentNavCollections",
      {
        retailerInventorySessionToken: invToken,
        slug: "",
        productLimit: 20,
        pageViewId: crypto.randomUUID(),
        filters: [],
      },
      HASHES.DepartmentNavCollections
    );
    const depts = data?.data?.deptCollections || [];
    const result: CollectionInfo[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function walk(nodes: any[]) {
      for (const n of nodes) {
        if (n.name && n.slug) {
          result.push({ name: n.name.trim(), slug: n.slug });
        }
        if (n.childCollections?.length) walk(n.childCollections);
      }
    }
    walk(depts);
    collectionCache = result;
    collectionCacheExpiresAt = Date.now() + 60 * 60 * 1000;
    return collectionCache;
  } catch {
    return collectionCache; // stale is better than nothing
  }
}

// ---- Step 4: Match search query to best collection(s) ----
// Common food search terms → collection category mappings
const CATEGORY_SYNONYMS: Record<string, string[]> = {
  shrimp: ["shellfish", "seafood", "fish"],
  prawn: ["shellfish", "seafood", "fish"],
  lobster: ["shellfish", "seafood", "fish"],
  crab: ["shellfish", "seafood", "fish"],
  salmon: ["fish", "seafood"],
  tuna: ["fish", "seafood"],
  cod: ["fish", "seafood"],
  tilapia: ["fish", "seafood"],
  beef: ["meat", "frozen meat"],
  steak: ["meat", "beef"],
  pork: ["meat", "frozen meat"],
  bacon: ["meat", "deli", "breakfast"],
  sausage: ["meat", "deli", "breakfast"],
  turkey: ["meat", "poultry"],
  lamb: ["meat"],
  yogurt: ["yogurt", "dairy"],
  cheese: ["cheese", "dairy"],
  cream: ["dairy", "cream"],
  juice: ["juice", "beverages"],
  coffee: ["coffee", "beverages"],
  tea: ["tea", "beverages"],
  water: ["water", "beverages"],
  wine: ["wine", "alcohol"],
  beer: ["beer", "alcohol"],
  chips: ["chips", "snacks"],
  cereal: ["cereal", "breakfast"],
  pasta: ["pasta", "pantry"],
  rice: ["rice", "grains", "pantry"],
  oil: ["pantry", "cooking", "condiments"],
  vinegar: ["pantry", "condiments"],
  flour: ["baking", "pantry"],
  sugar: ["baking", "pantry"],
  honey: ["pantry", "condiments"],
  soap: ["soap", "cleaning", "household"],
  detergent: ["cleaning", "laundry", "household"],
  toilet: ["paper", "bathroom", "household"],
  diaper: ["baby", "diapers"],
  vitamin: ["vitamins", "supplements", "health"],
};

function expandQuery(query: string): string[] {
  const q = query.toLowerCase().trim();
  const extras: string[] = [];
  for (const [term, synonyms] of Object.entries(CATEGORY_SYNONYMS)) {
    if (q.includes(term)) {
      extras.push(...synonyms);
    }
  }
  return extras;
}

function matchCollections(
  query: string,
  collections: CollectionInfo[]
): CollectionInfo[] {
  const q = query.toLowerCase().trim();
  // Try singular and plural forms
  const qSingular = q.endsWith("s") && q.length > 3 ? q.slice(0, -1) : q;
  const qPlural = !q.endsWith("s") ? q + "s" : q;
  const variants = new Set([q, qSingular, qPlural]);
  const matches: CollectionInfo[] = [];

  // Exact name match
  for (const c of collections) {
    const cn = c.name.toLowerCase();
    if (variants.has(cn)) return [c];
  }
  // Name contains query or query contains name
  for (const c of collections) {
    const cn = c.name.toLowerCase();
    for (const v of variants) {
      if (cn.includes(v) || v.includes(cn)) {
        matches.push(c);
        break;
      }
    }
  }
  if (matches.length > 0) return matches.slice(0, 3);

  // Word-level match (including singular + plural forms)
  const words = q.split(/\s+/);
  const allWords = new Set(words);
  for (const w of words) {
    if (w.endsWith("s") && w.length > 3) allWords.add(w.slice(0, -1));
    if (!w.endsWith("s")) allWords.add(w + "s");
  }
  for (const w of allWords) {
    if (w.length < 3) continue;
    const wRe = new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i");
    for (const c of collections) {
      if (wRe.test(c.name) && !matches.includes(c)) {
        matches.push(c);
      }
    }
  }
  if (matches.length > 0) return matches.slice(0, 3);

  // Synonym/category expansion (shrimp → shellfish, seafood)
  const expanded = expandQuery(q);
  for (const syn of expanded) {
    const synRe = new RegExp(`\\b${syn.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i");
    for (const c of collections) {
      if (synRe.test(c.name) && !matches.includes(c)) {
        matches.push(c);
      }
    }
  }
  if (matches.length > 0) return matches.slice(0, 3);

  // Slug match (slugs contain hyphenated words like rc-eggs-56903)
  for (const c of collections) {
    const slugWords = c.slug.replace(/[-_]/g, " ").toLowerCase();
    const allVariants = [...variants, ...Array.from(allWords)];
    if (allVariants.some((v) => {
      const re = new RegExp(`\\b${v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i");
      return re.test(slugWords);
    })) {
      matches.push(c);
    }
  }
  return matches.slice(0, 3);
}

// ---- Step 5: Fetch products from a collection ----
interface InstacartItem {
  name?: string;
  size?: string;
  brandName?: string;
  productId?: string;
  viewSection?: {
    itemImage?: { url?: string };
  };
  price?: {
    priceValueString?: string;
    viewSection?: {
      itemCard?: {
        priceString?: string;
        pricingUnitString?: string;
      };
    };
  };
}

async function fetchCollectionProducts(
  token: string,
  invToken: string,
  slug: string
): Promise<InstacartItem[]> {
  try {
    const data = await gql(
      token,
      "CollectionProductsWithFeaturedProducts",
      {
        shopId: DEFAULT_SHOP_ID,
        pageViewId: crypto.randomUUID(),
        first: 20,
        slug,
        retailerInventorySessionToken: invToken,
        zoneId: DEFAULT_ZONE_ID,
        postalCode: DEFAULT_POSTAL,
      },
      HASHES.CollectionProductsWithFeaturedProducts
    );
    return data?.data?.collectionProducts?.items || [];
  } catch {
    return [];
  }
}

// ---- Convert Instacart items to ScrapedPrice ----
function toScrapedPrice(item: InstacartItem): ScrapedPrice | null {
  const name = item.name;
  if (!name) return null;

  const priceStr =
    item.price?.priceValueString ||
    item.price?.viewSection?.itemCard?.priceString?.replace(/[^0-9.]/g, "");
  const price = priceStr ? parseFloat(priceStr) : NaN;
  if (!price || price <= 0) return null;

  const unit = item.price?.viewSection?.itemCard?.pricingUnitString || item.size || "each";
  const imageUrl = item.viewSection?.itemImage?.url || undefined;

  return {
    storeName: "Costco",
    price,
    currency: "CAD",
    productName: name,
    unit,
    imageUrl,
    productUrl: `https://sameday.costco.ca/store/costco-canada/search/${encodeURIComponent(name)}`,
  };
}

// ---- Instacart search via collection browsing ----
async function searchCostcoViaInstacart(
  query: string,
  postalCode: string
): Promise<ScrapedPrice[]> {
  const token = await getGuestToken();
  if (!token) return [];

  const invToken = await getInventoryToken(token, postalCode);
  if (!invToken) return [];

  const collections = await getCollections(token, invToken);
  const matched = matchCollections(query, collections);
  if (matched.length === 0) return [];

  // Fetch products from matched collection(s) in parallel
  const allItems = await Promise.all(
    matched.map((c) => fetchCollectionProducts(token, invToken, c.slug))
  );

  const results: ScrapedPrice[] = [];
  const seen = new Set<string>();
  const q = query.toLowerCase();
  // Build search words: original query words + singular forms
  const qWords = q.split(/\s+/).filter((w) => w.length >= 2);
  const wordVariants: string[][] = qWords.map((w) => {
    const variants = [w];
    if (w.endsWith("s") && w.length > 3) variants.push(w.slice(0, -1));
    return variants;
  });

  for (const items of allItems) {
    for (const item of items) {
      const itemName = (item.name || "").toLowerCase();

      // Relevance filter: for multi-word queries, require at least half the
      // query words to appear as whole words (not substrings like "oil" in "foil")
      if (qWords.length >= 2) {
        let wordHits = 0;
        for (const variants of wordVariants) {
          // Check whole-word match to avoid "oil" matching "foil"
          const hasMatch = variants.some((v) => {
            const re = new RegExp(`\\b${v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i");
            return re.test(itemName);
          });
          if (hasMatch) wordHits++;
        }
        // Require at least half of query words to match
        if (wordHits < Math.ceil(qWords.length / 2)) continue;
      } else if (qWords.length === 1) {
        // Single word: whole-word match
        const w = qWords[0];
        const wSingular = w.endsWith("s") && w.length > 3 ? w.slice(0, -1) : w;
        const re = new RegExp(`\\b(${w}|${wSingular})`, "i");
        if (!re.test(itemName)) continue;
      }

      const sp = toScrapedPrice(item);
      if (!sp) continue;

      const key = `${sp.productName}-${sp.price}`;
      if (seen.has(key)) continue;
      seen.add(key);

      results.push(sp);
    }
  }

  return results;
}

// ---- Flipp fallback for flyer/sale items ----
async function searchCostcoViaFlipp(
  query: string,
  postalCode: string
): Promise<ScrapedPrice[]> {
  const queries = [query, `kirkland ${query}`];
  const results: ScrapedPrice[] = [];
  const seen = new Set<string>();

  for (const q of queries) {
    try {
      const params = new URLSearchParams({
        locale: "en-ca",
        postal_code: postalCode,
        q,
      });
      const res = await fetch(
        `https://backflipp.wishabi.com/flipp/items/search?${params}`,
        { headers: { "User-Agent": UA, Accept: "application/json" } }
      );
      if (!res.ok) continue;
      const data = await res.json();

      for (const item of data?.items || []) {
        const store = (
          item.merchant_name || item.merchant || ""
        ).toLowerCase();
        if (!store.includes("costco")) continue;

        const price = item.current_price || item.price;
        if (!price || price <= 0) continue;

        const name = item.name || item.description;
        if (!name) continue;

        const key = `${name}-${price}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const text = (
          item.price_text ||
          item.post_price_text ||
          ""
        ).toLowerCase();
        let unit = "each";
        if (text.includes("/lb")) unit = "per lb";
        else if (text.includes("/kg")) unit = "per kg";
        else if (text.includes("/100g")) unit = "per 100g";
        else if (text.includes("/l")) unit = "per L";

        results.push({
          storeName: "Costco",
          price,
          currency: "CAD",
          productName: name,
          imageUrl:
            item.clean_image_url ||
            item.clipping_image_url ||
            item.cutout_image_url ||
            item.image_url ||
            undefined,
          unit,
          validUntil: item.valid_to || undefined,
          productUrl: `https://www.costco.ca/CatalogSearch?keyword=${encodeURIComponent(name)}`,
        });
      }
    } catch {
      // continue
    }
  }

  return results;
}

export const costcoScraper: Scraper = {
  name: "costco",
  countries: ["CA"],

  async scrape(query, countryCode, postalCode) {
    if (countryCode !== "CA") return [];
    const postal = postalCode || DEFAULT_POSTAL;

    // Run Instacart collection browsing + Flipp flyer search in parallel
    const [instacartResults, flippResults] = await Promise.all([
      searchCostcoViaInstacart(query, postal),
      searchCostcoViaFlipp(query, postal),
    ]);

    // Merge: Instacart results take priority (real-time prices), Flipp adds sale items
    const combined = [...instacartResults];
    const seen = new Set(
      instacartResults.map((r) =>
        `${r.productName.toLowerCase()}-${r.price}`
      )
    );
    for (const r of flippResults) {
      const key = `${r.productName.toLowerCase()}-${r.price}`;
      if (!seen.has(key)) {
        seen.add(key);
        combined.push(r);
      }
    }

    return combined;
  },
};
