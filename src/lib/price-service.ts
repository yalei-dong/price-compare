import { PriceEntry, Product, Country } from "./types";
import { getLocaleConfig, GeoIPResult } from "./locale";
import { webSearch, hasAnyFreeProvider, WebSearchResult } from "./free-search-providers";
import { fetchScrapedPrices, hasScrapers } from "./scrapers";

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
  // US regional / metro stores
  "wegmans": { logo: "🏪", type: "both" },
  "publix": { logo: "🟢", type: "both" },
  "h-e-b": { logo: "🏪", type: "both" },
  "heb": { logo: "🏪", type: "both" },
  "meijer": { logo: "🏪", type: "both" },
  "aldi": { logo: "🟡", type: "both" },
  "lidl": { logo: "🔵", type: "both" },
  "trader joe": { logo: "🌻", type: "local" },
  "whole foods": { logo: "🥬", type: "both" },
  "sprouts": { logo: "🌱", type: "both" },
  "food lion": { logo: "🦁", type: "both" },
  "stop & shop": { logo: "🏪", type: "both" },
  "stop and shop": { logo: "🏪", type: "both" },
  "giant": { logo: "🏪", type: "both" },
  "shoprite": { logo: "🏪", type: "both" },
  "key food": { logo: "🏪", type: "local" },
  "foodtown": { logo: "🏪", type: "local" },
  "cttown": { logo: "🏪", type: "local" },
  "jewel-osco": { logo: "🏪", type: "both" },
  "mariano": { logo: "🏪", type: "both" },
  "vons": { logo: "🏪", type: "both" },
  "ralph": { logo: "🏪", type: "both" },
  "winco": { logo: "🏪", type: "both" },
  "fred meyer": { logo: "🏪", type: "both" },
  "harris teeter": { logo: "🏪", type: "both" },
  "piggly wiggly": { logo: "🐷", type: "local" },
  "stater bros": { logo: "🏪", type: "both" },
  "smart & final": { logo: "🏪", type: "both" },
  "food 4 less": { logo: "🏪", type: "both" },
  "bi-lo": { logo: "🏪", type: "both" },
  "winn-dixie": { logo: "🏪", type: "both" },
  "acme": { logo: "🏪", type: "both" },
  "price chopper": { logo: "🏪", type: "both" },
  "market basket": { logo: "🏪", type: "both" },
  "hannaford": { logo: "🏪", type: "both" },
  "schnucks": { logo: "🏪", type: "both" },
  "hy-vee": { logo: "🏪", type: "both" },
  // Canadian metro stores
  "t&t": { logo: "�", type: "both" },
  "farm boy": { logo: "🌾", type: "local" },
  "longos": { logo: "🏪", type: "both" },
  "food depot": { logo: "🏪", type: "both" },
  "iga": { logo: "🏪", type: "both" },
  "provigo": { logo: "🏪", type: "both" },
  // Chinese / Asian supermarkets (North America)
  "99 ranch": { logo: "🏮", type: "both" },
  "ranch 99": { logo: "🏮", type: "both" },
  "h mart": { logo: "🇰🇷", type: "both" },
  "hmart": { logo: "🇰🇷", type: "both" },
  "foody mart": { logo: "🏮", type: "both" },
  "oceans": { logo: "🌊", type: "both" },
  "nations fresh": { logo: "🏮", type: "both" },
  "btrust": { logo: "🏮", type: "both" },
  "lucky moose": { logo: "🏮", type: "local" },
  "galleria supermarket": { logo: "🇰🇷", type: "both" },
  "pat central": { logo: "🇰🇷", type: "both" },
  "great wall": { logo: "🏮", type: "both" },
  "hong kong supermarket": { logo: "🏮", type: "both" },
  "new york mart": { logo: "🏮", type: "both" },
  "jmart": { logo: "🏮", type: "both" },
  "kam man": { logo: "🏮", type: "both" },
  "uwajimaya": { logo: "🇯🇵", type: "both" },
  "mitsuwa": { logo: "🇯🇵", type: "both" },
  "168 market": { logo: "🏮", type: "both" },
  "pacific ocean": { logo: "🏮", type: "both" },
  "china fair": { logo: "🏮", type: "both" },
  "golden dragon": { logo: "🏮", type: "local" },
  "default": { logo: "🏷️", type: "online" },
};

// ---------------------------------------------------------------------------
// Metro-area store mapping
// Maps city/region to SerpAPI `location` param + popular local stores
// ---------------------------------------------------------------------------

interface MetroConfig {
  serpLocation: string;   // SerpAPI location string for better local results
  stores: string[];       // Popular store chains in this metro
}

const US_METRO_MAP: Record<string, MetroConfig> = {
  // Northeast
  "new york":       { serpLocation: "New York,New York,United States", stores: ["ShopRite", "Key Food", "Stop & Shop", "Wegmans", "Foodtown", "ALDI", "Trader Joe's", "Whole Foods", "H Mart", "Hong Kong Supermarket", "New York Mart", "Jmart", "Kam Man"] },
  "brooklyn":       { serpLocation: "New York,New York,United States", stores: ["ShopRite", "Key Food", "Stop & Shop", "Foodtown", "ALDI", "Trader Joe's", "Hong Kong Supermarket", "Jmart"] },
  "manhattan":      { serpLocation: "New York,New York,United States", stores: ["Trader Joe's", "Whole Foods", "Fairway", "Key Food", "Gristedes", "Hong Kong Supermarket", "Kam Man"] },
  "queens":         { serpLocation: "New York,New York,United States", stores: ["ShopRite", "Stop & Shop", "Key Food", "H Mart", "ALDI", "New York Mart", "Jmart", "Hong Kong Supermarket"] },
  "flushing":       { serpLocation: "New York,New York,United States", stores: ["New York Mart", "Jmart", "Hong Kong Supermarket", "H Mart", "Key Food", "ShopRite"] },
  "jersey city":    { serpLocation: "New York,New York,United States", stores: ["ShopRite", "Stop & Shop", "Key Food", "ALDI", "Trader Joe's"] },
  "newark":         { serpLocation: "New York,New York,United States", stores: ["ShopRite", "Stop & Shop", "ALDI", "Foodtown"] },
  "boston":          { serpLocation: "Boston,Massachusetts,United States", stores: ["Stop & Shop", "Market Basket", "Trader Joe's", "Whole Foods", "Wegmans", "Hannaford", "ALDI"] },
  "philadelphia":   { serpLocation: "Philadelphia,Pennsylvania,United States", stores: ["Acme", "ShopRite", "Giant", "Wegmans", "ALDI", "Trader Joe's", "Whole Foods"] },
  "pittsburgh":     { serpLocation: "Pittsburgh,Pennsylvania,United States", stores: ["Giant Eagle", "ALDI", "Trader Joe's", "Whole Foods", "Walmart"] },

  // Southeast
  "miami":          { serpLocation: "Miami-Fort Lauderdale,Florida,United States", stores: ["Publix", "Winn-Dixie", "ALDI", "Trader Joe's", "Whole Foods", "Sedano's"] },
  "fort lauderdale":{ serpLocation: "Miami-Fort Lauderdale,Florida,United States", stores: ["Publix", "Winn-Dixie", "ALDI", "Whole Foods"] },
  "orlando":        { serpLocation: "Orlando,Florida,United States", stores: ["Publix", "Winn-Dixie", "ALDI", "Walmart", "Trader Joe's"] },
  "tampa":          { serpLocation: "Tampa,Florida,United States", stores: ["Publix", "Winn-Dixie", "ALDI", "Walmart"] },
  "atlanta":        { serpLocation: "Atlanta,Georgia,United States", stores: ["Publix", "Kroger", "ALDI", "Trader Joe's", "Whole Foods", "Walmart"] },
  "charlotte":      { serpLocation: "Charlotte,North Carolina,United States", stores: ["Harris Teeter", "Food Lion", "Publix", "ALDI", "Trader Joe's", "Walmart"] },
  "raleigh":        { serpLocation: "Raleigh,North Carolina,United States", stores: ["Harris Teeter", "Food Lion", "Publix", "ALDI", "Trader Joe's", "Wegmans"] },
  "washington":     { serpLocation: "Washington,District of Columbia,United States", stores: ["Giant", "Harris Teeter", "Safeway", "Wegmans", "ALDI", "Trader Joe's", "Whole Foods"] },

  // Midwest
  "chicago":        { serpLocation: "Chicago,Illinois,United States", stores: ["Jewel-Osco", "Mariano's", "ALDI", "Trader Joe's", "Whole Foods", "Meijer", "Walmart"] },
  "detroit":        { serpLocation: "Detroit,Michigan,United States", stores: ["Kroger", "Meijer", "ALDI", "Trader Joe's", "Walmart", "Whole Foods"] },
  "minneapolis":    { serpLocation: "Minneapolis,Minnesota,United States", stores: ["Cub Foods", "ALDI", "Trader Joe's", "Hy-Vee", "Whole Foods", "Walmart"] },
  "st. louis":      { serpLocation: "St. Louis,Missouri,United States", stores: ["Schnucks", "ALDI", "Trader Joe's", "Dierbergs", "Walmart"] },
  "saint louis":    { serpLocation: "St. Louis,Missouri,United States", stores: ["Schnucks", "ALDI", "Trader Joe's", "Walmart"] },
  "indianapolis":   { serpLocation: "Indianapolis,Indiana,United States", stores: ["Kroger", "Meijer", "ALDI", "Trader Joe's", "Walmart"] },
  "columbus":       { serpLocation: "Columbus,Ohio,United States", stores: ["Kroger", "Meijer", "ALDI", "Trader Joe's", "Giant Eagle", "Walmart"] },
  "milwaukee":      { serpLocation: "Milwaukee,Wisconsin,United States", stores: ["Pick 'n Save", "ALDI", "Trader Joe's", "Meijer", "Walmart"] },
  "kansas city":    { serpLocation: "Kansas City,Missouri,United States", stores: ["Hy-Vee", "ALDI", "Trader Joe's", "Price Chopper", "Walmart"] },

  // West Coast
  "los angeles":    { serpLocation: "Los Angeles,California,United States", stores: ["Ralphs", "Vons", "Trader Joe's", "Whole Foods", "Sprouts", "ALDI", "Smart & Final", "Food 4 Less", "H Mart", "99 Ranch", "168 Market", "Great Wall"] },
  "san francisco":  { serpLocation: "San Francisco,California,United States", stores: ["Safeway", "Trader Joe's", "Whole Foods", "Sprouts", "Smart & Final", "99 Ranch", "Pacific Ocean"] },
  "san jose":       { serpLocation: "San Jose,California,United States", stores: ["Safeway", "Trader Joe's", "Sprouts", "99 Ranch", "H Mart", "Smart & Final", "168 Market", "Great Wall"] },
  "san diego":      { serpLocation: "San Diego,California,United States", stores: ["Vons", "Ralphs", "Trader Joe's", "Sprouts", "Stater Bros", "ALDI", "Food 4 Less"] },
  "seattle":        { serpLocation: "Seattle,Washington,United States", stores: ["Fred Meyer", "Safeway", "Trader Joe's", "Whole Foods", "WinCo", "QFC", "Uwajimaya", "H Mart", "99 Ranch"] },
  "portland":       { serpLocation: "Portland,Oregon,United States", stores: ["Fred Meyer", "Safeway", "Trader Joe's", "WinCo", "New Seasons", "Grocery Outlet"] },
  "phoenix":        { serpLocation: "Phoenix,Arizona,United States", stores: ["Fry's", "Safeway", "Sprouts", "Trader Joe's", "WinCo", "ALDI", "Walmart"] },
  "las vegas":      { serpLocation: "Las Vegas,Nevada,United States", stores: ["Smith's", "WinCo", "Trader Joe's", "Sprouts", "ALDI", "Walmart"] },
  "denver":         { serpLocation: "Denver,Colorado,United States", stores: ["King Soopers", "Safeway", "Trader Joe's", "Sprouts", "Whole Foods", "ALDI", "Walmart"] },

  // South / Texas
  "houston":        { serpLocation: "Houston,Texas,United States", stores: ["H-E-B", "Kroger", "ALDI", "Trader Joe's", "Whole Foods", "Fiesta Mart", "Walmart"] },
  "dallas":         { serpLocation: "Dallas-Fort Worth,Texas,United States", stores: ["H-E-B", "Kroger", "ALDI", "Trader Joe's", "Whole Foods", "Tom Thumb", "Walmart"] },
  "san antonio":    { serpLocation: "San Antonio,Texas,United States", stores: ["H-E-B", "Walmart", "ALDI", "Trader Joe's"] },
  "austin":         { serpLocation: "Austin,Texas,United States", stores: ["H-E-B", "Trader Joe's", "Whole Foods", "Sprouts", "ALDI", "Walmart"] },
};

const CA_METRO_MAP: Record<string, MetroConfig> = {
  "toronto":        { serpLocation: "Toronto,Ontario,Canada", stores: ["Loblaws", "No Frills", "Metro", "FreshCo", "T&T", "Foody Mart", "Oceans", "Nations Fresh Foods", "BTrust", "Walmart", "Costco", "Food Basics", "Longos", "Farm Boy", "H Mart", "Galleria Supermarket", "PAT Central"] },
  "mississauga":    { serpLocation: "Toronto,Ontario,Canada", stores: ["Loblaws", "No Frills", "FreshCo", "Walmart", "Food Basics", "T&T", "Oceans", "Nations Fresh Foods", "BTrust"] },
  "brampton":       { serpLocation: "Toronto,Ontario,Canada", stores: ["No Frills", "FreshCo", "Walmart", "Food Basics", "Oceans", "BTrust"] },
  "markham":        { serpLocation: "Toronto,Ontario,Canada", stores: ["T&T", "Foody Mart", "Metro", "FreshCo", "No Frills", "Walmart", "H Mart", "Galleria Supermarket"] },
  "scarborough":    { serpLocation: "Toronto,Ontario,Canada", stores: ["T&T", "Foody Mart", "Oceans", "Nations Fresh Foods", "No Frills", "FreshCo", "Food Basics"] },
  "richmond hill":  { serpLocation: "Toronto,Ontario,Canada", stores: ["T&T", "Foody Mart", "H Mart", "No Frills", "Metro", "Loblaws"] },
  "north york":     { serpLocation: "Toronto,Ontario,Canada", stores: ["T&T", "Galleria Supermarket", "PAT Central", "H Mart", "No Frills", "Metro"] },
  "ottawa":         { serpLocation: "Ottawa,Ontario,Canada", stores: ["Loblaws", "Metro", "Farm Boy", "FreshCo", "Walmart", "Costco", "Food Basics"] },
  "montreal":       { serpLocation: "Montreal,Quebec,Canada", stores: ["Metro", "IGA", "Super C", "Provigo", "Maxi", "Costco", "Walmart"] },
  "vancouver":      { serpLocation: "Vancouver,British Columbia,Canada", stores: ["Save-On-Foods", "No Frills", "T&T", "Foody Mart", "H Mart", "Superstore", "Walmart", "Costco", "Safeway"] },
  "richmond":       { serpLocation: "Vancouver,British Columbia,Canada", stores: ["T&T", "Foody Mart", "Save-On-Foods", "No Frills", "Superstore", "H Mart"] },
  "burnaby":        { serpLocation: "Vancouver,British Columbia,Canada", stores: ["T&T", "Save-On-Foods", "No Frills", "Superstore", "H Mart", "Crystal Mall"] },
  "calgary":        { serpLocation: "Calgary,Alberta,Canada", stores: ["Superstore", "Safeway", "Co-op", "No Frills", "Walmart", "Costco", "Save-On-Foods"] },
  "edmonton":       { serpLocation: "Edmonton,Alberta,Canada", stores: ["Superstore", "Safeway", "Save-On-Foods", "No Frills", "Walmart", "Costco"] },
  "winnipeg":       { serpLocation: "Winnipeg,Manitoba,Canada", stores: ["Superstore", "Safeway", "No Frills", "Walmart", "Costco", "FreshCo"] },
};

/**
 * Look up metro config for a given city. Returns undefined if not a known metro.
 */
export function getMetroConfig(geo: GeoIPResult): MetroConfig | undefined {
  if (!geo.city) return undefined;
  const cityLower = geo.city.toLowerCase();

  if (geo.country === "US") {
    return US_METRO_MAP[cityLower];
  }
  if (geo.country === "CA") {
    return CA_METRO_MAP[cityLower];
  }
  return undefined;
}

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
  "whole foods":    (q) => `https://www.wholefoodsmarket.com/search?text=${encodeURIComponent(q)}`,
  // US regional stores
  "wegmans":        (q) => `https://shop.wegmans.com/search?search_term=${encodeURIComponent(q)}`,
  "publix":         (q) => `https://www.publix.com/shop/search?query=${encodeURIComponent(q)}`,
  "h-e-b":          (q) => `https://www.heb.com/search/?q=${encodeURIComponent(q)}`,
  "heb":            (q) => `https://www.heb.com/search/?q=${encodeURIComponent(q)}`,
  "meijer":         (q) => `https://www.meijer.com/shopping/search.html?text=${encodeURIComponent(q)}`,
  "aldi":           (q) => `https://www.aldi.us/products/?search=${encodeURIComponent(q)}`,
  "sprouts":        (q) => `https://shop.sprouts.com/search?search_term=${encodeURIComponent(q)}`,
  "food lion":      (q) => `https://shop.foodlion.com/search?search_term=${encodeURIComponent(q)}`,
  "stop & shop":    (q) => `https://stopandshop.com/search?query=${encodeURIComponent(q)}`,
  "shoprite":       (q) => `https://www.shoprite.com/sm/planning/rsid/393/results?q=${encodeURIComponent(q)}`,
  "giant":          (q) => `https://giantfood.com/search?q=${encodeURIComponent(q)}`,
  "jewel-osco":     (q) => `https://www.jewelosco.com/shop/search-results.html?q=${encodeURIComponent(q)}`,
  "harris teeter":  (q) => `https://www.harristeeter.com/search?query=${encodeURIComponent(q)}`,
  "fred meyer":     (q) => `https://www.fredmeyer.com/search?query=${encodeURIComponent(q)}`,
  "vons":           (q) => `https://www.vons.com/shop/search-results.html?q=${encodeURIComponent(q)}`,
  "ralphs":         (q) => `https://www.ralphs.com/search?query=${encodeURIComponent(q)}`,
  "winco":          (q) => `https://www.wincofoods.com/search?q=${encodeURIComponent(q)}`,
  "hy-vee":         (q) => `https://www.hy-vee.com/aisles-online/search?search=${encodeURIComponent(q)}`,
  "price chopper":  (q) => `https://www.pricechopper.com/search/?q=${encodeURIComponent(q)}`,
  "schnucks":       (q) => `https://nourish.schnucks.com/search?q=${encodeURIComponent(q)}`,
  "smart & final":  (q) => `https://www.smartandfinal.com/search?q=${encodeURIComponent(q)}`,
  "stater bros":    (q) => `https://www.staterbros.com/search/?q=${encodeURIComponent(q)}`,
  "winn-dixie":     (q) => `https://www.winndixie.com/search?q=${encodeURIComponent(q)}`,
  "acme":           (q) => `https://www.acmemarkets.com/shop/search-results.html?q=${encodeURIComponent(q)}`,
  "hannaford":      (q) => `https://www.hannaford.com/search?query=${encodeURIComponent(q)}`,
  "market basket":  (q) => `https://www.shopmarketbasket.com/search?q=${encodeURIComponent(q)}`,
  // Canada stores
  "amazon.ca":      (q) => `https://www.amazon.ca/s?k=${encodeURIComponent(q)}`,
  "walmart.ca":     (q) => `https://www.walmart.ca/search?q=${encodeURIComponent(q)}`,
  "costco.ca":      (q) => `https://www.costco.ca/CatalogSearch?dept=All&keyword=${encodeURIComponent(q)}`,
  "loblaws":        (q) => `https://www.loblaws.ca/search?search-bar=${encodeURIComponent(q)}`,
  "no frills":      (q) => `https://www.nofrills.ca/search?search-bar=${encodeURIComponent(q)}`,
  "nofrills":       (q) => `https://www.nofrills.ca/search?search-bar=${encodeURIComponent(q)}`,
  "metro":          (q) => `https://www.metro.ca/en/search?filter=${encodeURIComponent(q)}`,
  "sobeys":         (q) => `https://voila.ca/search?q=${encodeURIComponent(q)}`,
  "freshco":        (q) => `https://www.freshco.com/search/?search-term=${encodeURIComponent(q)}`,
  "superc":         (q) => `https://www.superc.ca/en/search?filter=${encodeURIComponent(q)}`,
  "food basics":    (q) => `https://www.foodbasics.ca/search?filter=${encodeURIComponent(q)}`,
  "voilà":          (q) => `https://www.voila.ca/search?q=${encodeURIComponent(q)}`,
  "voila":          (q) => `https://www.voila.ca/search?q=${encodeURIComponent(q)}`,
  "real canadian superstore": (q) => `https://www.realcanadiansuperstore.ca/search?search-bar=${encodeURIComponent(q)}`,
  "save-on-foods":  (q) => `https://www.saveonfoods.com/search?search-term=${encodeURIComponent(q)}`,
  "t&t":            (q) => `https://www.tntsupermarket.com/catalogsearch/result/?q=${encodeURIComponent(q)}`,
  "foody mart":     (q) => `https://www.foodymart.com/?s=${encodeURIComponent(q)}`,
  "oceans":         (q) => `https://www.oceansfreshfood.com/search?q=${encodeURIComponent(q)}`,
  "nations fresh":  (q) => `https://www.nationsfreshfoods.ca/search?q=${encodeURIComponent(q)}`,
  "btrust":         (q) => `https://www.btrustsupermarket.com/search?q=${encodeURIComponent(q)}`,
  "99 ranch":       (q) => `https://www.99ranch.com/search?q=${encodeURIComponent(q)}`,
  "h mart":         (q) => `https://www.hmart.com/search?q=${encodeURIComponent(q)}`,
  "hmart":          (q) => `https://www.hmart.com/search?q=${encodeURIComponent(q)}`,
  "great wall":     (q) => `https://www.greatwallsupermarket.com/search?q=${encodeURIComponent(q)}`,
  "uwajimaya":      (q) => `https://www.uwajimaya.com/search/?q=${encodeURIComponent(q)}`,
  "mitsuwa":        (q) => `https://mitsuwa.com/search?q=${encodeURIComponent(q)}`,
  "168 market":     (q) => `https://www.168markets.com/search?q=${encodeURIComponent(q)}`,
  "farm boy":       (q) => `https://www.farmboy.ca/search/?s=${encodeURIComponent(q)}`,
  "longos":         (q) => `https://shop.longos.com/search?search_term=${encodeURIComponent(q)}`,
  "iga":            (q) => `https://www.iga.net/en/search?k=${encodeURIComponent(q)}`,
  "provigo":        (q) => `https://www.provigo.ca/search?search-bar=${encodeURIComponent(q)}`,
  // China stores
  "jd.com":         (q) => `https://search.jd.com/Search?keyword=${encodeURIComponent(q)}`,
  "taobao":         (q) => `https://s.taobao.com/search?q=${encodeURIComponent(q)}`,
  "pinduoduo":      (q) => `https://mobile.yangkeduo.com/search_result.html?search_key=${encodeURIComponent(q)}`,
  "hema":           (q) => `https://www.freshhema.com/search?keyword=${encodeURIComponent(q)}`,
  // UK / EU
  "tesco":          (q) => `https://www.tesco.com/groceries/en-GB/search?query=${encodeURIComponent(q)}`,
  "asda":           (q) => `https://groceries.asda.com/search/${encodeURIComponent(q)}`,
  "sainsbury":      (q) => `https://www.sainsburys.co.uk/gol-ui/SearchResults/${encodeURIComponent(q)}`,
  "lidl":           (q) => `https://www.lidl.com/search?query=${encodeURIComponent(q)}`,
  "carrefour":      (q) => `https://www.carrefour.com/search?query=${encodeURIComponent(q)}`,
};

/** Given a store name from SerpAPI, build a direct search URL on the store's website. */
export function buildStoreDirectUrl(storeName: string, query: string): string {
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

// ---------------------------------------------------------------------------
// In-memory SerpAPI cache — avoids redundant searches for common queries.
// TTL: 12 hours. Cache key = normalised query + country + location.
// On Vercel serverless, each cold start gets a fresh cache, so memory usage
// stays bounded. For persistent caching, swap for Redis/KV in the future.
// ---------------------------------------------------------------------------

interface CacheEntry {
  data: PriceEntry[];
  ts: number;
}

const SERP_CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_SIZE = 500;               // evict oldest when exceeded

function serpCacheKey(query: string, country: string, location?: string): string {
  return `${query.toLowerCase().trim()}|${country}|${location || ""}`;
}

function getCachedPrices(key: string): PriceEntry[] | null {
  const entry = SERP_CACHE.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    SERP_CACHE.delete(key);
    return null;
  }
  return entry.data;
}

function setCachedPrices(key: string, data: PriceEntry[]): void {
  // Simple size-based eviction: drop oldest entries when full
  if (SERP_CACHE.size >= MAX_CACHE_SIZE) {
    const oldest = SERP_CACHE.keys().next().value;
    if (oldest !== undefined) SERP_CACHE.delete(oldest);
  }
  SERP_CACHE.set(key, { data, ts: Date.now() });
}

// ---------------------------------------------------------------------------
// Free-provider price extraction (regex + optional Gemini)
// ---------------------------------------------------------------------------

const GENERIC_PRICE_RE = /\$\s?(\d{1,4}\.\d{2})/g;

function extractStoreFromUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace("www.", "");
    const name = hostname.split(".")[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  } catch {
    return "Store";
  }
}

function regexExtractPrices(
  results: WebSearchResult[],
  countryCode: string
): { storeName: string; price: number; url: string }[] {
  const out: { storeName: string; price: number; url: string }[] = [];
  for (const r of results) {
    const text = `${r.title} ${r.snippet}`;
    const matches = [...text.matchAll(new RegExp(GENERIC_PRICE_RE.source, "g"))];
    if (matches.length > 0) {
      const price = parseFloat(matches[0][1]);
      if (price > 0 && price < 10000) {
        out.push({ storeName: extractStoreFromUrl(r.url), price, url: r.url });
      }
    }
  }
  return out;
}

// Simple Gemini rate limiter — max 12 calls per minute to stay under free tier
const geminiCallTimestamps: number[] = [];
const GEMINI_RPM_LIMIT = 12;
function canCallGemini(): boolean {
  const now = Date.now();
  // Remove timestamps older than 60s
  while (geminiCallTimestamps.length > 0 && now - geminiCallTimestamps[0] > 60_000) {
    geminiCallTimestamps.shift();
  }
  if (geminiCallTimestamps.length >= GEMINI_RPM_LIMIT) return false;
  geminiCallTimestamps.push(now);
  return true;
}

async function geminiExtractPrices(
  results: WebSearchResult[],
  query: string,
  currency: string
): Promise<{ storeName: string; price: number; url: string }[]> {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey || results.length === 0) return [];
  if (!canCallGemini()) return []; // Skip if rate limited

  const snippets = results
    .slice(0, 8)
    .map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet}\nURL: ${r.url}`)
    .join("\n\n");

  const prompt = `Extract product prices from these search results for "${query}".\nReturn ONLY a JSON array. Each item: {"storeName": "...", "price": number, "url": "..."}\nOnly include results with clear prices in ${currency}. Do not make up prices. If unsure, omit.\n\n${snippets}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 1024, responseMimeType: "application/json" },
        }),
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (p: { storeName?: string; price?: number }) =>
          p.storeName && typeof p.price === "number" && p.price > 0
      );
    }
    return [];
  } catch {
    return [];
  }
}

async function fetchPricesFromFreeProviders(
  query: string,
  countryCode: string
): Promise<PriceEntry[]> {
  const result = await webSearch(query, countryCode);
  if (!result || result.results.length === 0) return [];

  const glConfig = COUNTRY_GL[countryCode] || { gl: "us", currency: "USD", country: "US" as Country };
  const currency = glConfig.currency;

  // Use regex extraction only — saves Gemini quota for AI Deals chat
  const extracted = regexExtractPrices(result.results, countryCode);

  const today = new Date().toISOString().slice(0, 10);
  return extracted.map((item, idx) => {
    const meta = detectStoreMeta(item.storeName);
    return {
      storeId: `free-${result.provider}-${idx}`,
      storeName: item.storeName,
      storeLogo: meta.logo,
      country: glConfig.country,
      type: meta.type,
      price: item.price,
      currency,
      unit: "each",
      url: item.url,
      thumbnail: undefined,
      lastUpdated: today,
      inStock: true,
    };
  });
}

// ---------------------------------------------------------------------------
// Main price fetcher: Always scrape (free) + supplement with APIs if thin
// ---------------------------------------------------------------------------

const MIN_SCRAPE_RESULTS = 5; // Below this, also query paid/free search APIs

/** Merge price entries and keep cheapest per store */
function mergeAndDedup(entries: PriceEntry[]): PriceEntry[] {
  const byStore = new Map<string, PriceEntry>();
  for (const e of entries) {
    const key = e.storeName.toLowerCase().trim();
    const existing = byStore.get(key);
    if (!existing || e.price < existing.price) {
      byStore.set(key, e);
    }
  }
  return [...byStore.values()].sort((a, b) => a.price - b.price);
}

export async function fetchGoogleShoppingPrices(
  query: string,
  countryCode: string = "US",
  serpLocation?: string
): Promise<PriceEntry[]> {
  // Check cache first (shared across all providers)
  const cKey = serpCacheKey(query, countryCode, serpLocation);
  const cached = getCachedPrices(cKey);
  if (cached) return cached;

  // Always run scrapers first (free, unlimited)
  let results: PriceEntry[] = [];
  if (hasScrapers(countryCode)) {
    results = await fetchScrapedPrices(query, countryCode);
  }

  // If scrapers returned thin results, supplement with free/paid APIs
  if (results.length < MIN_SCRAPE_RESULTS) {
    // Try free providers first (Bing / Brave — no cost)
    if (hasAnyFreeProvider()) {
      const freeResults = await fetchPricesFromFreeProviders(query, countryCode);
      results = mergeAndDedup([...results, ...freeResults]);
    }

    // Still thin? Fall back to SerpAPI (paid, last resort)
    if (results.length < MIN_SCRAPE_RESULTS) {
      const apiKey = process.env.SERPAPI_KEY;
      if (apiKey) {
        const serpResults = await fetchFromSerpAPI(query, countryCode, serpLocation, apiKey);
        results = mergeAndDedup([...results, ...serpResults]);
      }
    }
  }

  if (results.length > 0) {
    setCachedPrices(cKey, results);
  }

  return results;
}

/** SerpAPI Google Shopping fetch (extracted from old fetchGoogleShoppingPrices) */
async function fetchFromSerpAPI(
  query: string,
  countryCode: string,
  serpLocation: string | undefined,
  apiKey: string
): Promise<PriceEntry[]> {

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

  // Use metro-specific location for more local results
  if (serpLocation) {
    params.set("location", serpLocation);
  }

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

    const results = data.shopping_results
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

    return results;
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
  localeCode: string = "US",
  geo?: GeoIPResult
): Promise<{ products: Product[]; categories: string[]; source: "live" | "mock" | "mixed" }> {
  const categories = getCategories();
  const hasAnySource = !!process.env.SERPAPI_KEY || hasAnyFreeProvider() || hasScrapers(localeCode);

  // If no data source at all, fall back to mock data filtered by locale
  if (!hasAnySource) {
    const mockProducts = searchMockProducts(query, category, localeCode, storeType);
    return { products: mockProducts, categories, source: "mock" };
  }

  // Try live prices
  if (!query || query.trim().length === 0) {
    // Homepage: fetch real prices for popular items from Flipp
    if (hasScrapers(localeCode)) {
      const popularItems = ["milk", "eggs", "bananas", "chicken breast", "rice", "olive oil", "bread", "cola", "avocado", "toothpaste"];
      const liveProducts: Product[] = [];

      // Fetch in parallel for speed
      const results = await Promise.all(
        popularItems.map(async (item) => {
          const metro = geo ? getMetroConfig(geo) : undefined;
          const prices = await fetchGoogleShoppingPrices(item, localeCode, metro?.serpLocation);
          if (prices.length === 0) return null;
          const thumb = prices.find((p) => p.thumbnail)?.thumbnail || "";
          return {
            id: `live-${encodeURIComponent(item)}`,
            name: item,
            category: "Search Result",
            image: thumb || "🔍",
            description: `Live prices for "${item}"`,
            prices,
          } as Product;
        })
      );

      for (const p of results) {
        if (p) liveProducts.push(p);
      }

      if (liveProducts.length > 0) {
        return { products: liveProducts, categories, source: "live" };
      }
    }

    // Fallback to mock data if no scrapers available
    const mockProducts = searchMockProducts(query, category, localeCode, storeType);
    return { products: mockProducts, categories, source: "mock" };
  }

  // Resolve metro config for location-specific results
  const metro = geo ? getMetroConfig(geo) : undefined;
  const livePrices = await fetchGoogleShoppingPrices(query, localeCode, metro?.serpLocation);

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

  return {
    products: [liveProduct],
    categories,
    source: "live",
  };
}

export async function getProductByIdReal(id: string, localeCode: string = "US"): Promise<Product | null> {
  const hasAnySource = !!process.env.SERPAPI_KEY || hasAnyFreeProvider() || hasScrapers(localeCode);

  // If it's a live product ID, re-fetch prices
  if (id.startsWith("live-") && hasAnySource) {
    const query = decodeURIComponent(id.replace("live-", ""));
    const prices = await fetchGoogleShoppingPrices(query, localeCode);
    if (prices.length > 0) {
      const thumb = prices.find((p) => p.thumbnail)?.thumbnail || "";
      return {
        id,
        name: query,
        category: "Search Result",
        image: thumb || "🔍",
        description: `Live prices for "${query}"`,
        prices,
      };
    }
  }

  // Check mock data
  const mock = getMockProduct(id);
  if (!mock) return null;

  // Filter mock prices to locale country only
  const localePrices = mock.prices.filter((p) => p.country === localeCode);

  // If we have any search provider, enrich with live prices
  if (hasAnySource) {
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
