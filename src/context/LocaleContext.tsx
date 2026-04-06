"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";

interface LocaleInfo {
  countryCode: string;
  currency: string;
  symbol: string;
  label: string;
  lang: string;
  loading: boolean;
  city: string;
  postalCode: string;
  setPostalCode: (code: string) => void;
  clearPostalCode: () => void;
}

const LocaleContext = createContext<LocaleInfo>({
  countryCode: "",
  currency: "USD",
  symbol: "$",
  label: "",
  lang: "en",
  loading: true,
  city: "",
  postalCode: "",
  setPostalCode: () => {},
  clearPostalCode: () => {},
});

export function useLocale() {
  return useContext(LocaleContext);
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Omit<LocaleInfo, "setPostalCode" | "clearPostalCode">>({
    countryCode: "",
    currency: "USD",
    symbol: "$",
    label: "",
    lang: "en",
    loading: true,
    city: "",
    postalCode: "",
  });

  // Keep <html lang> in sync with detected language
  useEffect(() => {
    if (!locale.loading && locale.lang) {
      document.documentElement.lang = locale.lang;
    }
  }, [locale.loading, locale.lang]);

  // Initial load — check localStorage for saved postal code
  useEffect(() => {
    const saved = localStorage.getItem("pc_postal");
    if (saved) {
      // Lookup from saved postal code
      lookupPostal(saved);
    } else {
      // Normal IP-based detection
      detectFromIP();
    }
  }, []);

  function detectFromIP() {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    const browserHint = detectCountryFromTimezone(tz);
    const params = new URLSearchParams();
    if (browserHint) params.set("tzHint", browserHint);

    fetch(`/api/locale?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setLocale((prev) => ({
          ...prev,
          countryCode: data.countryCode || browserHint || "US",
          currency: data.currency || "USD",
          symbol: data.symbol || "$",
          label: data.label || "United States",
          lang: data.lang || "en",
          city: data.city || "",
          loading: false,
        }));
      })
      .catch(() => {
        if (browserHint) {
          fetch(`/api/locale?locale=${browserHint}`)
            .then((res) => res.json())
            .then((data) => {
              setLocale((prev) => ({
                ...prev,
                countryCode: data.countryCode || browserHint,
                currency: data.currency || "USD",
                symbol: data.symbol || "$",
                label: data.label || "",
                lang: data.lang || "en",
                city: "",
                loading: false,
              }));
            })
            .catch(() => {
              setLocale((prev) => ({ ...prev, loading: false }));
            });
        } else {
          setLocale((prev) => ({ ...prev, loading: false }));
        }
      });
  }

  async function lookupPostal(code: string) {
    try {
      const res = await fetch(`/api/postal-lookup?code=${encodeURIComponent(code)}`);
      const data = await res.json();
      if (data.error) {
        // Bad postal code — fall back to IP
        localStorage.removeItem("pc_postal");
        detectFromIP();
        return;
      }
      setLocale((prev) => ({
        ...prev,
        countryCode: data.countryCode || prev.countryCode,
        currency: data.currency || prev.currency,
        symbol: data.symbol || prev.symbol,
        label: data.label || prev.label,
        lang: data.lang || prev.lang,
        city: data.city || "",
        postalCode: code,
        loading: false,
      }));
    } catch {
      localStorage.removeItem("pc_postal");
      detectFromIP();
    }
  }

  const handleSetPostalCode = useCallback((code: string) => {
    localStorage.setItem("pc_postal", code);
    setLocale((prev) => ({ ...prev, loading: true, postalCode: code }));
    lookupPostal(code);
  }, []);

  const handleClearPostalCode = useCallback(() => {
    localStorage.removeItem("pc_postal");
    setLocale((prev) => ({ ...prev, loading: true, postalCode: "", city: "" }));
    detectFromIP();
  }, []);

  return (
    <LocaleContext.Provider value={{ ...locale, setPostalCode: handleSetPostalCode, clearPostalCode: handleClearPostalCode }}>
      {children}
    </LocaleContext.Provider>
  );
}

/** Map common IANA timezones to country codes */
function detectCountryFromTimezone(tz: string): string {
  const TZ_MAP: Record<string, string> = {
    // Canada
    "America/Toronto": "CA", "America/Montreal": "CA", "America/Vancouver": "CA",
    "America/Edmonton": "CA", "America/Winnipeg": "CA", "America/Halifax": "CA",
    "America/St_Johns": "CA", "America/Regina": "CA", "America/Yellowknife": "CA",
    "America/Whitehorse": "CA", "America/Iqaluit": "CA",
    // US
    "America/New_York": "US", "America/Chicago": "US", "America/Denver": "US",
    "America/Los_Angeles": "US", "America/Phoenix": "US", "America/Anchorage": "US",
    "Pacific/Honolulu": "US", "America/Detroit": "US", "America/Indiana/Indianapolis": "US",
    // UK
    "Europe/London": "GB",
    // Germany
    "Europe/Berlin": "DE",
    // France
    "Europe/Paris": "FR",
    // Japan
    "Asia/Tokyo": "JP",
    // Korea
    "Asia/Seoul": "KR",
    // China
    "Asia/Shanghai": "CN", "Asia/Hong_Kong": "CN",
    // Australia
    "Australia/Sydney": "AU", "Australia/Melbourne": "AU", "Australia/Brisbane": "AU",
    "Australia/Perth": "AU", "Australia/Adelaide": "AU",
    // India
    "Asia/Kolkata": "IN", "Asia/Calcutta": "IN",
    // Mexico
    "America/Mexico_City": "MX",
    // Brazil
    "America/Sao_Paulo": "BR",
  };
  return TZ_MAP[tz] || "";
}
