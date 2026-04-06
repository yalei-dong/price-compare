// Locale configuration — drives which country's stores and currency are shown.
// Detected automatically from user's IP via /api/locale.

export type Locale = "US" | "CA" | "CN" | "UK" | "AU" | "IN" | "JP" | "KR" | "DE" | "FR" | "MX" | "BR";

export interface LocaleConfig {
  code: string;        // ISO country code (uppercase)
  gl: string;          // SerpAPI gl parameter (lowercase)
  currency: string;    // e.g. "CAD"
  symbol: string;      // e.g. "C$"
  label: string;       // e.g. "Canada"
  lang: string;        // SerpAPI hl parameter
}

const LOCALE_MAP: Record<string, LocaleConfig> = {
  CA: { code: "CA", gl: "ca", currency: "CAD", symbol: "C$", label: "Canada", lang: "en" },
  US: { code: "US", gl: "us", currency: "USD", symbol: "$", label: "United States", lang: "en" },
  CN: { code: "CN", gl: "cn", currency: "CNY", symbol: "¥", label: "China", lang: "zh-CN" },
  UK: { code: "UK", gl: "uk", currency: "GBP", symbol: "£", label: "United Kingdom", lang: "en" },
  GB: { code: "GB", gl: "uk", currency: "GBP", symbol: "£", label: "United Kingdom", lang: "en" },
  AU: { code: "AU", gl: "au", currency: "AUD", symbol: "A$", label: "Australia", lang: "en" },
  IN: { code: "IN", gl: "in", currency: "INR", symbol: "₹", label: "India", lang: "en" },
  JP: { code: "JP", gl: "jp", currency: "JPY", symbol: "¥", label: "Japan", lang: "ja" },
  KR: { code: "KR", gl: "kr", currency: "KRW", symbol: "₩", label: "South Korea", lang: "ko" },
  DE: { code: "DE", gl: "de", currency: "EUR", symbol: "€", label: "Germany", lang: "de" },
  FR: { code: "FR", gl: "fr", currency: "EUR", symbol: "€", label: "France", lang: "fr" },
  MX: { code: "MX", gl: "mx", currency: "MXN", symbol: "$", label: "Mexico", lang: "es" },
  BR: { code: "BR", gl: "br", currency: "BRL", symbol: "R$", label: "Brazil", lang: "pt" },
};

const DEFAULT_LOCALE = LOCALE_MAP["US"];

/** Get locale config for a given country code (case-insensitive). */
export function getLocaleConfig(countryCode?: string): LocaleConfig {
  if (!countryCode) return DEFAULT_LOCALE;
  return LOCALE_MAP[countryCode.toUpperCase()] || DEFAULT_LOCALE;
}

/** All supported locales for UI display. */
export function getAllLocales(): { value: string; label: string }[] {
  const seen = new Set<string>();
  return Object.entries(LOCALE_MAP)
    .filter(([key]) => {
      if (seen.has(LOCALE_MAP[key].gl)) return false;
      seen.add(LOCALE_MAP[key].gl);
      return true;
    })
    .map(([key, cfg]) => ({ value: key, label: cfg.label }));
}

/**
 * Geo-IP result including city/region for metro-area store matching.
 */
export interface GeoIPResult {
  country: string;       // 2-letter country code
  region?: string;       // State/province code (e.g. "NY", "CA", "ON")
  city?: string;         // City name (e.g. "New York", "Los Angeles")
}

/**
 * Detect country, region, and city from IP using free geo-IP APIs.
 * Tries multiple providers for reliability.
 */
export async function detectGeoFromIP(
  clientIP?: string | null
): Promise<GeoIPResult> {
  // 1. Try ipapi.co (free, 1000/day, no key) — returns JSON with city/region
  try {
    const url = clientIP
      ? `https://ipapi.co/${encodeURIComponent(clientIP)}/json/`
      : "https://ipapi.co/json/";
    const res = await fetch(url, {
      headers: { "User-Agent": "curl/8.0", "Accept": "application/json" },
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const data = await res.json();
      const country = (data.country_code || "").toUpperCase();
      if (country.length === 2 && /^[A-Z]{2}$/.test(country)) {
        return {
          country,
          region: data.region_code || undefined,
          city: data.city || undefined,
        };
      }
    }
  } catch { /* fall through */ }

  // 2. Fallback: ip-api.com (free, 45/min, HTTP only) — returns city/regionName
  try {
    const url = clientIP
      ? `http://ip-api.com/json/${encodeURIComponent(clientIP)}?fields=countryCode,regionName,city`
      : "http://ip-api.com/json/?fields=countryCode,regionName,city";
    const res = await fetch(url, {
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.countryCode) {
        return {
          country: data.countryCode.toUpperCase(),
          region: data.regionName || undefined,
          city: data.city || undefined,
        };
      }
    }
  } catch { /* fall through */ }

  // 3. Fallback: ipinfo.io (country only)
  try {
    const url = clientIP
      ? `https://ipinfo.io/${encodeURIComponent(clientIP)}/json`
      : "https://ipinfo.io/json";
    const res = await fetch(url, {
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const data = await res.json();
      const country = (data.country || "").toUpperCase();
      if (country.length === 2 && /^[A-Z]{2}$/.test(country)) {
        return {
          country,
          region: data.region || undefined,
          city: data.city || undefined,
        };
      }
    }
  } catch { /* fall through */ }

  return { country: "US" }; // Ultimate fallback
}

/**
 * Backward-compatible wrapper — returns just country code.
 */
export async function detectCountryFromIP(
  clientIP?: string | null
): Promise<string> {
  const geo = await detectGeoFromIP(clientIP);
  return geo.country;
}
