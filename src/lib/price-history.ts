/**
 * Price history tracker — stores daily price snapshots in localStorage.
 * Each snapshot captures the lowest price per store for a product on a given date.
 */

import { PriceEntry } from "./types";

export interface PriceSnapshot {
  date: string;          // YYYY-MM-DD
  prices: {
    storeName: string;
    price: number;
    currency: string;
  }[];
  lowestPrice: number;
  highestPrice: number;
  avgPrice: number;
}

export interface ProductHistory {
  productId: string;
  productName: string;
  snapshots: PriceSnapshot[];
}

const STORAGE_KEY = "price-compare-history";
const MAX_DAYS = 90; // Keep up to 90 days of history

/**
 * Filter outlier prices using median-based detection.
 * Prices > 3× the median are excluded to keep charts readable.
 */
export function filterOutlierPrices<T extends { price: number }>(prices: T[]): T[] {
  if (prices.length < 3) return prices;
  const sorted = [...prices].sort((a, b) => a.price - b.price);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0
    ? (sorted[mid - 1].price + sorted[mid].price) / 2
    : sorted[mid].price;
  const cap = median * 3;
  const filtered = prices.filter((p) => p.price <= cap);
  // Always return at least the original if filtering removes everything
  return filtered.length > 0 ? filtered : prices;
}

function loadAllHistory(): Record<string, ProductHistory> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAllHistory(data: Record<string, ProductHistory>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Record a price snapshot for a product. Called whenever we fetch live prices.
 * Only stores one snapshot per day (latest wins).
 */
export function recordPriceSnapshot(
  productId: string,
  productName: string,
  prices: PriceEntry[]
): void {
  const inStock = prices.filter((p) => p.inStock && p.price > 0);
  if (inStock.length === 0) return;

  // Use outlier-filtered prices for stats so charts stay readable
  const filtered = filterOutlierPrices(inStock);
  const date = todayStr();
  const snapshot: PriceSnapshot = {
    date,
    prices: filtered.map((p) => ({
      storeName: p.storeName,
      price: p.price,
      currency: p.currency,
    })),
    lowestPrice: Math.min(...filtered.map((p) => p.price)),
    highestPrice: Math.max(...filtered.map((p) => p.price)),
    avgPrice: filtered.reduce((s, p) => s + p.price, 0) / filtered.length,
  };

  const all = loadAllHistory();
  if (!all[productId]) {
    all[productId] = { productId, productName, snapshots: [] };
  }

  const history = all[productId];
  history.productName = productName;

  // Replace today's snapshot if exists, otherwise append
  const existingIdx = history.snapshots.findIndex((s) => s.date === date);
  if (existingIdx >= 0) {
    history.snapshots[existingIdx] = snapshot;
  } else {
    history.snapshots.push(snapshot);
  }

  // Trim to MAX_DAYS
  if (history.snapshots.length > MAX_DAYS) {
    history.snapshots = history.snapshots.slice(-MAX_DAYS);
  }

  // Sort by date
  history.snapshots.sort((a, b) => a.date.localeCompare(b.date));

  saveAllHistory(all);
}

/**
 * Get all recorded price history for a product.
 */
export function getProductHistory(productId: string): ProductHistory | null {
  const all = loadAllHistory();
  return all[productId] || null;
}

/**
 * Generate demo history for products that only have 1 day.
 * Creates 14 days of simulated price fluctuations for a better chart experience.
 */
export function generateDemoHistory(
  productId: string,
  productName: string,
  currentPrices: PriceEntry[]
): PriceSnapshot[] {
  const inStock = currentPrices.filter((p) => p.inStock && p.price > 0);
  if (inStock.length === 0) return [];

  // Filter outliers so demo chart shows realistic range
  const realistic = filterOutlierPrices(inStock);
  const snapshots: PriceSnapshot[] = [];
  const today = new Date();

  for (let daysAgo = 13; daysAgo >= 0; daysAgo--) {
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    const dateStr = date.toISOString().split("T")[0];

    // Simulate ±5-15% price fluctuation per store
    const simPrices = realistic.map((p) => {
      const variance = 0.85 + Math.random() * 0.30; // 0.85 to 1.15
      const simPrice = Math.round(p.price * variance * 100) / 100;
      return {
        storeName: p.storeName,
        price: simPrice,
        currency: p.currency,
      };
    });

    snapshots.push({
      date: dateStr,
      prices: simPrices,
      lowestPrice: Math.min(...simPrices.map((p) => p.price)),
      highestPrice: Math.max(...simPrices.map((p) => p.price)),
      avgPrice: simPrices.reduce((s, p) => s + p.price, 0) / simPrices.length,
    });
  }

  // Make the last entry match actual current prices (filtered)
  const lastSnapshot = snapshots[snapshots.length - 1];
  lastSnapshot.prices = realistic.map((p) => ({
    storeName: p.storeName,
    price: p.price,
    currency: p.currency,
  }));
  lastSnapshot.lowestPrice = Math.min(...realistic.map((p) => p.price));
  lastSnapshot.highestPrice = Math.max(...realistic.map((p) => p.price));
  lastSnapshot.avgPrice = realistic.reduce((s, p) => s + p.price, 0) / realistic.length;

  return snapshots;
}
