// Store flyer data — links to real weekly flyer pages by country.

export type FlyerCountry = "CA" | "US" | "CN" | "GB" | "AU";

export interface StoreFlyer {
  name: string;
  logo: string;          // emoji
  flyerUrl: string;      // direct link to flyer/deals page
  website: string;       // store homepage
  type: "grocery" | "warehouse" | "pharmacy" | "discount" | "general";
  country: FlyerCountry;
}

export const FLYER_STORES: StoreFlyer[] = [
  // ── Canada ────────────────────────────────────────────────
  { name: "Walmart Canada", logo: "🟦", flyerUrl: "https://www.walmart.ca/flyer", website: "https://www.walmart.ca", type: "general", country: "CA" },
  { name: "Loblaws", logo: "🔴", flyerUrl: "https://www.loblaws.ca/print-flyer", website: "https://www.loblaws.ca", type: "grocery", country: "CA" },
  { name: "No Frills", logo: "🟡", flyerUrl: "https://www.nofrills.ca/print-flyer", website: "https://www.nofrills.ca", type: "discount", country: "CA" },
  { name: "Real Canadian Superstore", logo: "🟠", flyerUrl: "https://www.realcanadiansuperstore.ca/print-flyer", website: "https://www.realcanadiansuperstore.ca", type: "grocery", country: "CA" },
  { name: "Sobeys", logo: "🟢", flyerUrl: "https://www.sobeys.com/en/flyer/", website: "https://www.sobeys.com", type: "grocery", country: "CA" },
  { name: "Metro", logo: "🔵", flyerUrl: "https://www.metro.ca/en/flyer", website: "https://www.metro.ca", type: "grocery", country: "CA" },
  { name: "FreshCo", logo: "🟩", flyerUrl: "https://www.freshco.com/flyer/", website: "https://www.freshco.com", type: "discount", country: "CA" },
  { name: "Food Basics", logo: "🟧", flyerUrl: "https://www.foodbasics.ca/flyer", website: "https://www.foodbasics.ca", type: "discount", country: "CA" },
  { name: "Costco Canada", logo: "🏪", flyerUrl: "https://www.costco.ca/in-the-warehouse.html", website: "https://www.costco.ca", type: "warehouse", country: "CA" },
  { name: "Shoppers Drug Mart", logo: "💊", flyerUrl: "https://www1.shoppersdrugmart.ca/en/flyer", website: "https://www.shoppersdrugmart.ca", type: "pharmacy", country: "CA" },
  { name: "T&T Supermarket", logo: "🏮", flyerUrl: "https://www.tntsupermarket.com/flyer.html", website: "https://www.tntsupermarket.com", type: "grocery", country: "CA" },
  { name: "Oceans Fresh Food", logo: "🌊", flyerUrl: "https://www.oceansfreshfood.com/flyer/", website: "https://www.oceansfreshfood.com", type: "grocery", country: "CA" },
  { name: "Foody Mart", logo: "🏮", flyerUrl: "https://www.foodymart.com/flyer/", website: "https://www.foodymart.com", type: "grocery", country: "CA" },
  { name: "Nations Fresh Foods", logo: "🏮", flyerUrl: "https://www.nationsfreshfoods.ca/flyer/", website: "https://www.nationsfreshfoods.ca", type: "grocery", country: "CA" },
  { name: "BTrust Supermarket", logo: "🏮", flyerUrl: "https://www.btrustsupermarket.com/flyer/", website: "https://www.btrustsupermarket.com", type: "grocery", country: "CA" },
  { name: "Lucky Moose", logo: "🏮", flyerUrl: "https://www.luckymoose.ca/", website: "https://www.luckymoose.ca", type: "grocery", country: "CA" },
  { name: "Farm Boy", logo: "🌾", flyerUrl: "https://www.farmboy.ca/flyer/", website: "https://www.farmboy.ca", type: "grocery", country: "CA" },
  { name: "Giant Tiger", logo: "🐯", flyerUrl: "https://www.gianttiger.com/flyer", website: "https://www.gianttiger.com", type: "discount", country: "CA" },
  { name: "Canadian Tire", logo: "🔺", flyerUrl: "https://www.canadiantire.ca/en/flyer.html", website: "https://www.canadiantire.ca", type: "general", country: "CA" },

  // ── United States ─────────────────────────────────────────
  { name: "Walmart", logo: "🟦", flyerUrl: "https://www.walmart.com/shop/deals", website: "https://www.walmart.com", type: "general", country: "US" },
  { name: "Kroger", logo: "🔴", flyerUrl: "https://www.kroger.com/savings/cl/weeklyad/", website: "https://www.kroger.com", type: "grocery", country: "US" },
  { name: "Target", logo: "🎯", flyerUrl: "https://www.target.com/weekly-ad", website: "https://www.target.com", type: "general", country: "US" },
  { name: "Costco", logo: "🏪", flyerUrl: "https://www.costco.com/deals/in-warehouse-deals.html", website: "https://www.costco.com", type: "warehouse", country: "US" },
  { name: "Aldi", logo: "🟡", flyerUrl: "https://www.aldi.us/weekly-specials/this-weeks-aldi-finds/", website: "https://www.aldi.us", type: "discount", country: "US" },
  { name: "Trader Joe's", logo: "🌴", flyerUrl: "https://www.traderjoes.com/home/products/category/new-at-tjs-702", website: "https://www.traderjoes.com", type: "grocery", country: "US" },
  { name: "Whole Foods", logo: "🥦", flyerUrl: "https://www.wholefoodsmarket.com/sales-flyer", website: "https://www.wholefoodsmarket.com", type: "grocery", country: "US" },
  { name: "Safeway", logo: "🔵", flyerUrl: "https://www.safeway.com/foru/weeklyad.html", website: "https://www.safeway.com", type: "grocery", country: "US" },
  { name: "Publix", logo: "🟢", flyerUrl: "https://www.publix.com/savings/weekly-ad", website: "https://www.publix.com", type: "grocery", country: "US" },
  { name: "H-E-B", logo: "🔴", flyerUrl: "https://www.heb.com/weekly-ad", website: "https://www.heb.com", type: "grocery", country: "US" },
  { name: "Meijer", logo: "🟠", flyerUrl: "https://www.meijer.com/shopping/weeklyad.html", website: "https://www.meijer.com", type: "grocery", country: "US" },
  { name: "CVS", logo: "💊", flyerUrl: "https://www.cvs.com/weeklyad/pageview", website: "https://www.cvs.com", type: "pharmacy", country: "US" },
  { name: "Walgreens", logo: "💊", flyerUrl: "https://www.walgreens.com/offers/offers.jsp", website: "https://www.walgreens.com", type: "pharmacy", country: "US" },
  { name: "Sprouts", logo: "🌱", flyerUrl: "https://www.sprouts.com/weekly-ad/", website: "https://www.sprouts.com", type: "grocery", country: "US" },
  { name: "99 Ranch Market", logo: "🏮", flyerUrl: "https://www.99ranch.com/weekly-ad", website: "https://www.99ranch.com", type: "grocery", country: "US" },
  { name: "H Mart", logo: "🇰🇷", flyerUrl: "https://www.hmart.com/weekly-sales", website: "https://www.hmart.com", type: "grocery", country: "US" },
  { name: "Great Wall Supermarket", logo: "🏮", flyerUrl: "https://www.greatwallsupermarket.com/weekly-ad", website: "https://www.greatwallsupermarket.com", type: "grocery", country: "US" },
  { name: "168 Market", logo: "🏮", flyerUrl: "https://www.168markets.com/weekly-ad/", website: "https://www.168markets.com", type: "grocery", country: "US" },
  { name: "Uwajimaya", logo: "🇯🇵", flyerUrl: "https://www.uwajimaya.com/sales", website: "https://www.uwajimaya.com", type: "grocery", country: "US" },
  { name: "Mitsuwa Marketplace", logo: "🇯🇵", flyerUrl: "https://mitsuwa.com/flyer/", website: "https://mitsuwa.com", type: "grocery", country: "US" },

  // ── United Kingdom ────────────────────────────────────────
  { name: "Tesco", logo: "🔵", flyerUrl: "https://www.tesco.com/groceries/en-GB/promotions", website: "https://www.tesco.com", type: "grocery", country: "GB" },
  { name: "Sainsbury's", logo: "🟠", flyerUrl: "https://www.sainsburys.co.uk/gol-ui/groceries/great-offers", website: "https://www.sainsburys.co.uk", type: "grocery", country: "GB" },
  { name: "Asda", logo: "🟢", flyerUrl: "https://www.asda.com/special-offers", website: "https://www.asda.com", type: "grocery", country: "GB" },
  { name: "Aldi UK", logo: "🟡", flyerUrl: "https://www.aldi.co.uk/specialbuys", website: "https://www.aldi.co.uk", type: "discount", country: "GB" },
  { name: "Lidl UK", logo: "🔵", flyerUrl: "https://www.lidl.co.uk/offers", website: "https://www.lidl.co.uk", type: "discount", country: "GB" },
  { name: "Wing Yip", logo: "🏮", flyerUrl: "https://www.wingyip.com/offers", website: "https://www.wingyip.com", type: "grocery", country: "GB" },
  { name: "Loon Fung", logo: "🏮", flyerUrl: "https://www.loonfung.com/", website: "https://www.loonfung.com", type: "grocery", country: "GB" },

  // ── Australia ─────────────────────────────────────────────
  { name: "Woolworths", logo: "🟢", flyerUrl: "https://www.woolworths.com.au/shop/browse/specials", website: "https://www.woolworths.com.au", type: "grocery", country: "AU" },
  { name: "Coles", logo: "🔴", flyerUrl: "https://www.coles.com.au/on-special", website: "https://www.coles.com.au", type: "grocery", country: "AU" },
  { name: "Aldi Australia", logo: "🟡", flyerUrl: "https://www.aldi.com.au/en/special-buys/", website: "https://www.aldi.com.au", type: "discount", country: "AU" },
  { name: "Asian Grocery Online", logo: "🏮", flyerUrl: "https://www.asiangroceryonline.com.au/specials", website: "https://www.asiangroceryonline.com.au", type: "grocery", country: "AU" },

  // ── China ─────────────────────────────────────────────────
  { name: "Sam's Club China", logo: "🏪", flyerUrl: "https://www.samsclub.cn/", website: "https://www.samsclub.cn", type: "warehouse", country: "CN" },
  { name: "Hema (盒马)", logo: "🐴", flyerUrl: "https://www.freshhema.com/", website: "https://www.freshhema.com", type: "grocery", country: "CN" },
  { name: "JD Fresh (京东生鲜)", logo: "🐶", flyerUrl: "https://fresh.jd.com/", website: "https://www.jd.com", type: "grocery", country: "CN" },
];

const COUNTRY_FOR_LOCALE: Record<string, FlyerCountry> = {
  CA: "CA", US: "US", CN: "CN", GB: "GB", AU: "AU",
  UK: "GB", // alias
};

/** Get stores for a given locale code, falling back to US. */
export function getStoresForLocale(localeCode?: string): {
  country: FlyerCountry;
  stores: StoreFlyer[];
  otherCountries: { country: FlyerCountry; stores: StoreFlyer[] }[];
} {
  const country = COUNTRY_FOR_LOCALE[localeCode?.toUpperCase() || "US"] || "US";
  const stores = FLYER_STORES.filter((s) => s.country === country);

  const otherCountries: { country: FlyerCountry; stores: StoreFlyer[] }[] = [];
  const seen = new Set<FlyerCountry>([country]);
  for (const s of FLYER_STORES) {
    if (!seen.has(s.country)) {
      seen.add(s.country);
      otherCountries.push({
        country: s.country,
        stores: FLYER_STORES.filter((x) => x.country === s.country),
      });
    }
  }

  return { country, stores, otherCountries };
}

export const COUNTRY_NAMES: Record<FlyerCountry, string> = {
  CA: "flyers.country.CA",
  US: "flyers.country.US",
  CN: "flyers.country.CN",
  GB: "flyers.country.GB",
  AU: "flyers.country.AU",
};

export const TYPE_LABELS: Record<StoreFlyer["type"], string> = {
  grocery: "flyers.type.grocery",
  warehouse: "flyers.type.warehouse",
  pharmacy: "flyers.type.pharmacy",
  discount: "flyers.type.discount",
  general: "flyers.type.general",
};
