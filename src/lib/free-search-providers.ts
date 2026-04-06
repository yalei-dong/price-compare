// ---------------------------------------------------------------------------
// Free Web Search Providers: Google CSE, Bing, Brave
// Combined ~200 searches/day free with round-robin rotation.
// ---------------------------------------------------------------------------

export interface WebSearchResult {
  title: string;
  snippet: string;
  url: string;
  displayUrl?: string;
}

interface SearchProvider {
  name: string;
  dailyLimit: number;
  search(query: string, countryCode: string): Promise<WebSearchResult[]>;
}

// ---------------------------------------------------------------------------
// Daily quota tracking (in-memory, resets on cold start / new day)
// ---------------------------------------------------------------------------

interface QuotaEntry {
  count: number;
  date: string;
}

const quotaMap = new Map<string, QuotaEntry>();

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function getUsage(name: string): number {
  const entry = quotaMap.get(name);
  if (!entry || entry.date !== todayStr()) return 0;
  return entry.count;
}

function incrementUsage(name: string): void {
  const d = todayStr();
  const entry = quotaMap.get(name);
  if (!entry || entry.date !== d) {
    quotaMap.set(name, { count: 1, date: d });
  } else {
    entry.count++;
  }
}

function hasQuota(p: SearchProvider): boolean {
  return getUsage(p.name) < p.dailyLimit;
}

// ---------------------------------------------------------------------------
// Bing Web Search (1 000 calls/month free ≈ 33/day)
// Get key: https://portal.azure.com → Bing Search v7
// ---------------------------------------------------------------------------

const bing: SearchProvider = {
  name: "bing",
  dailyLimit: 33,
  async search(query, countryCode) {
    const apiKey = process.env.BING_SEARCH_KEY;
    if (!apiKey) return [];

    const mkt =
      countryCode === "CA"
        ? "en-CA"
        : countryCode === "CN"
          ? "zh-CN"
          : "en-US";
    const params = new URLSearchParams({
      q: `${query} price grocery`,
      count: "10",
      mkt,
    });

    const res = await fetch(
      `https://api.bing.microsoft.com/v7.0/search?${params}`,
      { headers: { "Ocp-Apim-Subscription-Key": apiKey } }
    );
    if (!res.ok) {
      console.error(`Bing error: ${res.status}`);
      return [];
    }
    const data = await res.json();
    return (data.webPages?.value || []).map(
      (item: Record<string, string>) => ({
        title: item.name || "",
        snippet: item.snippet || "",
        url: item.url || "",
        displayUrl: item.displayUrl || "",
      })
    );
  },
};

// ---------------------------------------------------------------------------
// Brave Search (2 000 queries/month free ≈ 66/day)
// Get key: https://brave.com/search/api/
// ---------------------------------------------------------------------------

const brave: SearchProvider = {
  name: "brave",
  dailyLimit: 66,
  async search(query, countryCode) {
    const apiKey = process.env.BRAVE_SEARCH_KEY;
    if (!apiKey) return [];

    const params = new URLSearchParams({
      q: `${query} price`,
      count: "10",
      country: countryCode.toLowerCase(),
    });

    const res = await fetch(
      `https://api.search.brave.com/res/v1/web/search?${params}`,
      {
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip",
          "X-Subscription-Token": apiKey,
        },
      }
    );
    if (!res.ok) {
      console.error(`Brave error: ${res.status}`);
      return [];
    }
    const data = await res.json();
    return (data.web?.results || []).map(
      (item: Record<string, string>) => ({
        title: item.title || "",
        snippet: item.description || "",
        url: item.url || "",
      })
    );
  },
};

// ---------------------------------------------------------------------------
// Provider rotation: pick the one with the most remaining quota
// ---------------------------------------------------------------------------

const ALL_PROVIDERS = [bing, brave];

function isConfigured(p: SearchProvider): boolean {
  switch (p.name) {
    case "bing":
      return !!process.env.BING_SEARCH_KEY;
    case "brave":
      return !!process.env.BRAVE_SEARCH_KEY;
    default:
      return false;
  }
}

function pickProvider(): SearchProvider | null {
  const available = ALL_PROVIDERS.filter(
    (p) => isConfigured(p) && hasQuota(p)
  ).sort((a, b) => {
    const aRem = a.dailyLimit - getUsage(a.name);
    const bRem = b.dailyLimit - getUsage(b.name);
    return bRem - aRem;
  });
  return available[0] || null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function webSearch(
  query: string,
  countryCode: string
): Promise<{ results: WebSearchResult[]; provider: string } | null> {
  const provider = pickProvider();
  if (!provider) return null;

  try {
    const results = await provider.search(query, countryCode);
    incrementUsage(provider.name);
    return { results, provider: provider.name };
  } catch (err) {
    console.error(`[${provider.name}] search failed:`, err);
    incrementUsage(provider.name); // still count it
    return null;
  }
}

export function hasAnyFreeProvider(): boolean {
  return ALL_PROVIDERS.some((p) => isConfigured(p) && hasQuota(p));
}

export function getProviderStatus() {
  return ALL_PROVIDERS.map((p) => ({
    name: p.name,
    used: getUsage(p.name),
    limit: p.dailyLimit,
    configured: isConfigured(p),
  }));
}
