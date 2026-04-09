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
  merchant_logo?: string;
  flyer_id?: number;
  flyer_item_id?: number;
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

// Link to each store's own flyer page (since prices come from flyers)
const STORE_FLYER_URLS: Record<string, string> = {
  // Loblaw banner stores
  "no frills":                "https://www.nofrills.ca/flyer",
  "loblaws":                  "https://www.loblaws.ca/flyer",
  "real canadian superstore":  "https://www.realcanadiansuperstore.ca/flyer",
  "superstore":               "https://www.realcanadiansuperstore.ca/flyer",
  "provigo":                  "https://www.provigo.ca/flyer",
  "maxi":                     "https://www.maxi.ca/flyer",
  "fortinos":                 "https://www.fortinos.ca/flyer",
  "valu-mart":                "https://www.valumart.ca/flyer",
  "foodland":                 "https://www.foodland.ca/flyer",
  "independent":              "https://www.yourindependentgrocer.ca/flyer",
  "shoppers drug mart":       "https://www.shoppersdrugmart.ca/flyer",
  // Sobeys banner stores
  "sobeys":                   "https://www.sobeys.com/flyer/",
  "freshco":                  "https://www.freshco.com/flyer/",
  "safeway":                  "https://www.safeway.ca/flyer/",
  "farm boy":                 "https://www.farmboy.ca/flyer/",
  "iga":                      "https://www.iga.net/en/flyer",
  // Other CA stores
  "walmart":                  "https://www.walmart.ca/flyer",
  "metro":                    "https://www.metro.ca/en/flyer",
  "food basics":              "https://www.foodbasics.ca/flyer",
  "giant tiger":              "https://www.gianttiger.com/flyer",
  "t&t":                      "https://www.tntsupermarket.com/eng/store-flyer",
  "costco":                   "https://www.costco.ca/warehouse-savings.html",
  "save-on-foods":            "https://www.saveonfoods.com/flyer/",
  "london drugs":             "https://www.londondrugs.com/flyer/",
  "rexall":                   "https://www.rexall.ca/flyer",
  "starsky":                  "https://starskys.com/flyer/",
  "longos":                   "https://www.longos.com/flyers",
  "longo's":                  "https://www.longos.com/flyers",
  "adonis":                   "https://www.marchesadonis.com/flyer",
  "foody mart":               "https://flipp.com/en-ca/markham-on/flyer/foody-mart",
  "foody world":              "https://flipp.com/en-ca/markham-on/flyer/foody-world",
  "rabba":                    "https://rabba.com/flyers/",
  // US stores
  "target":                   "https://www.target.com/weekly-ad",
  "kroger":                   "https://www.kroger.com/weeklyad",
  "aldi":                     "https://www.aldi.us/weekly-specials/",
  "whole foods":              "https://www.wholefoodsmarket.com/sales-flyer",
};

function buildStoreSearchUrl(storeName: string, query: string): string {
  const lower = storeName.toLowerCase();
  for (const [key, url] of Object.entries(STORE_FLYER_URLS)) {
    if (lower.includes(key)) {
      return url;
    }
  }
  // Fallback: Google search for the store's flyer
  return `https://www.google.com/search?q=${encodeURIComponent(storeName + " flyer")}`;
}

// Common adjectives/qualifiers that can be stripped to broaden a search
const BROADENING_ADJECTIVES = [
  "organic", "free range", "free run", "cage free", "cage-free",
  "grass fed", "grass-fed", "natural", "gluten free", "gluten-free",
  "sugar free", "sugar-free", "low fat", "low-fat", "non-gmo",
  "whole grain", "whole wheat", "extra virgin", "unsalted", "salted",
  "fresh", "frozen", "smoked", "roasted", "raw", "dried",
  "large", "small", "mini", "jumbo",
];

/**
 * Try to produce a shorter / broader version of the query to find more results.
 * e.g. "organic eggs" → "eggs", "grass fed ground beef" → "ground beef"
 */
function broadenQuery(query: string): string | null {
  const lower = query.toLowerCase().trim();
  for (const adj of BROADENING_ADJECTIVES) {
    if (lower.includes(adj)) {
      const broader = lower.replace(new RegExp(`\\b${adj}\\b`, "gi"), "").replace(/\s+/g, " ").trim();
      if (broader.length >= 2 && broader !== lower) return broader;
    }
  }
  // If multi-word but no known adjective, try dropping the first word
  const words = lower.split(/\s+/);
  if (words.length >= 3) {
    return words.slice(1).join(" ");
  }
  return null;
}

// Non-food stores to exclude from grocery search results
const NON_FOOD_STORES = new Set([
  "home hardware", "home depot", "lowes", "lowe's", "rona",
  "canadian tire", "princess auto", "peavey mart",
  "long & mcquade", "long and mcquade", "best buy", "the source",
  "the brick", "leon's", "sleep country", "ikea", "structube",
  "winners", "homesense", "marshalls", "dollarama",
  "staples", "bureau en gros", "michaels", "indigo",
  "petsmart", "pet valu", "ren's pets",
  "sportchek", "sport chek", "atmosphere", "sail",
  "marks", "mark's", "old navy", "gap", "h&m",
  "toys r us", "mastermind toys", "party city", "party packagers",
  "bath & body works", "sephora", "shoppers beauty",
  "henry's", "the camera store",
  "home furniture", "ashley", "bad boy", "surplus furniture",
  "tsc stores", "peavey industries",
  "the shopping channel", "tsc", "the source", "best buy",
  "apple", "samsung", "dell", "hp store", "lenovo",
  "eb games", "gamestop", "game stop",
  "pandora", "peoples jewellers", "swarovski",
  "bell", "telus", "rogers", "fido", "koodo", "virgin",
]);

// Non-food product keywords — items containing these are clearly not groceries.
// Used to filter out electronics, appliances, clothing, etc. from grocery results.
const NON_FOOD_KEYWORDS = [
  "watch", "smartwatch", "iwatch", "fitbit", "garmin",
  "iphone", "ipad", "macbook", "airpod", "laptop", "tablet", "chromebook",
  "tv", "television", "monitor", "soundbar", "speaker", "headphone", "earbud",
  "camera", "drone", "gopro", "printer", "scanner", "router", "modem",
  "playstation", "xbox", "nintendo", "switch", "ps5", "ps4", "gaming",
  "vacuum", "dyson", "roomba", "air purifier", "humidifier", "dehumidifier",
  "mattress", "pillow", "duvet", "bedding", "comforter",
  "jacket", "hoodie", "sneaker", "boot", "sandal", "parka", "coat",
  "jewelry", "jewellery", "necklace", "bracelet", "earring", "ring",
  "furniture", "sofa", "couch", "desk", "shelf", "bookcase",
  "tire", "motor oil", "wiper", "car seat",
  "power tool", "drill", "saw", "wrench", "socket set",
  "lawnmower", "lawn mower", "snow blower", "leaf blower",
  "bicycle", "bike", "treadmill", "elliptical", "dumbbell",
  "kayak", "tent", "sleeping bag",
  "titanium case", "trail loop", "ultra 2",
];

function isNonFoodProduct(productName: string): boolean {
  const lower = productName.toLowerCase();
  return NON_FOOD_KEYWORDS.some((kw) => lower.includes(kw));
}

async function flippSearch(
  query: string,
  countryCode: string,
  postalCode: string
): Promise<ScrapedPrice[]> {
  const locale = countryCode === "CA" ? "en-ca" : "en-us";
  const params = new URLSearchParams({
    locale,
    postal_code: postalCode,
    q: query,
  });

  const res = await fetch(
    `https://backflipp.wishabi.com/flipp/items/search?${params}`,
    {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
      },
    }
  );

  if (!res.ok) return [];

  const data: FlippResponse = await res.json();
  if (!data.items || data.items.length === 0) return [];

  const currency = countryCode === "CA" ? "CAD" : "USD";
  const results: ScrapedPrice[] = [];

  for (const item of data.items) {
    const price = parseFlippPrice(item);
    if (!price || price <= 0 || price > 9999) continue;

    const productName = item.name || item.description;
    if (!productName) continue;

    const store = item.merchant_name || item.merchant || "Unknown Store";

    // Skip non-food stores
    if (NON_FOOD_STORES.has(store.toLowerCase().trim())) continue;

    // Skip non-food products (electronics, appliances, clothing, etc.)
    if (isNonFoodProduct(productName)) continue;

    const imageUrl = item.clean_image_url || item.clipping_image_url || item.cutout_image_url || item.image_url || undefined;
    const unit = parseUnit(item);

    // Build in-app flyer detail page URL
    const flyerParams = new URLSearchParams();
    flyerParams.set("store", store);
    flyerParams.set("product", productName);
    flyerParams.set("price", price.toString());
    flyerParams.set("currency", currency);
    if (imageUrl) flyerParams.set("image", imageUrl);
    if (item.valid_from) flyerParams.set("from", item.valid_from);
    if (item.valid_to) flyerParams.set("to", item.valid_to);
    if (unit) flyerParams.set("unit", unit);
    if (item.sale_story) flyerParams.set("sale", item.sale_story);
    if (item.merchant_logo) flyerParams.set("logo", item.merchant_logo);
    if (item.flyer_id) flyerParams.set("fid", item.flyer_id.toString());
    if (item.flyer_item_id) flyerParams.set("iid", item.flyer_item_id.toString());
    flyerParams.set("q", query);

    results.push({
      storeName: store,
      price,
      currency,
      productName,
      imageUrl,
      unit,
      validUntil: item.valid_to || undefined,
      productUrl: `/flyer-item?${flyerParams.toString()}`,
    });
  }

  return results;
}

const MIN_UNIQUE_STORES = 3;

/**
 * Filter results to only include items relevant to the query.
 * For multi-word queries, all query words must appear in the product name
 * (prevents "organic milk" matching "coconut milk" or "organic chocolate").
 */
// Common food category words — used to detect misleading compound nouns.
// e.g. "milk chocolate" is chocolate (not milk), "cream cheese" is cheese (not cream).
const FOOD_CATEGORY_WORDS = new Set([
  "chocolate", "cheese", "cake", "bread", "juice", "sauce", "butter",
  "cream", "wine", "beer", "coffee", "tea", "jam", "candy", "cookie",
  "cracker", "chip", "bar", "powder", "cereal", "soup", "steak",
  "sausage", "burger", "pie", "pudding", "yogurt", "vinegar", "oil",
  "milk", "water", "flour", "sugar", "salt", "pepper", "rice", "pasta",
]);

function filterRelevant(results: ScrapedPrice[], query: string): ScrapedPrice[] {
  const queryWords = query.toLowerCase().split(/\s+/).filter((w) => w.length >= 2);

  // Always filter out non-food products regardless of query length
  results = results.filter((r) => !isNonFoodProduct(r.productName || ""));

  // For ALL queries (including single-word), the product name must contain
  // every query word. Flipp often returns unrelated items (e.g. crackers for "pear").
  results = results.filter((r) => {
    const name = (r.productName || "").toLowerCase();
    return queryWords.every((word) => name.includes(word));
  });

  if (queryWords.length <= 1) return results;

  const querySet = new Set(queryWords);

  return results.filter((r) => {
    const name = (r.productName || "").toLowerCase();
    // Every query word must appear in the product name
    if (!queryWords.every((word) => name.includes(word))) return false;

    // Detect misleading compounds: if the last query word (the head noun,
    // e.g. "milk") is followed by another food-category word NOT in the query
    // (e.g. "chocolate"), the product is something else (milk chocolate ≠ milk).
    const headNoun = queryWords[queryWords.length - 1];
    const nameWords = name.split(/[\s,/]+/);
    for (let i = 0; i < nameWords.length - 1; i++) {
      if (nameWords[i] === headNoun || nameWords[i].includes(headNoun)) {
        const nextWord = nameWords[i + 1];
        if (FOOD_CATEGORY_WORDS.has(nextWord) && !querySet.has(nextWord)) {
          return false; // "milk chocolate", "cream cheese" etc.
        }
      }
    }

    return true;
  });
}

export const flippScraper: Scraper = {
  name: "flipp",
  countries: ["CA", "US"],

  async scrape(query, countryCode, postalCode) {
    const postal = postalCode || DEFAULT_POSTAL[countryCode] || DEFAULT_POSTAL.US;

    try {
      const rawResults = await flippSearch(query, countryCode, postal);
      // Filter to items that match all query words
      let results = filterRelevant(rawResults, query);

      // If results are thin, broaden the query and merge
      const uniqueStores = new Set(results.map((r) => r.storeName.toLowerCase()));
      if (uniqueStores.size < MIN_UNIQUE_STORES) {
        const broader = broadenQuery(query);
        if (broader) {
          const extraRaw = await flippSearch(broader, countryCode, postal);
          const extraResults = filterRelevant(extraRaw, broader);
          // Merge: add stores we don't already have (keep original exact-match results)
          const existingStores = new Set(results.map((r) => r.storeName.toLowerCase()));
          for (const r of extraResults) {
            if (!existingStores.has(r.storeName.toLowerCase())) {
              existingStores.add(r.storeName.toLowerCase());
              results.push(r);
            }
          }
        }
      }

      return results;
    } catch (err) {
      console.error("Flipp scraper failed:", err);
      return [];
    }
  },
};
