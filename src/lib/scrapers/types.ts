// ---------------------------------------------------------------------------
// Scraper framework types
// ---------------------------------------------------------------------------

export interface ScrapedPrice {
  storeName: string;
  price: number;
  currency: string;
  productName: string;
  productUrl?: string;
  imageUrl?: string;
  unit?: string;       // "each", "per lb", "per kg", etc.
  validUntil?: string; // ISO date — when the flyer/deal expires
}

export interface Scraper {
  name: string;
  /** Which country codes this scraper covers */
  countries: string[];
  /** Scrape prices for a query in a given locale + optional postal code */
  scrape(query: string, countryCode: string, postalCode?: string): Promise<ScrapedPrice[]>;
}
