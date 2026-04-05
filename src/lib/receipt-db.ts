/**
 * Personal price database — stores prices scanned from receipts.
 * Persisted in localStorage. Builds up the "best deal database" over time.
 */

import { normalizeItemName } from "./receipt-parser";

export interface PriceRecord {
  itemName: string;         // original name from receipt
  normalizedName: string;   // for matching
  storeName: string;
  price: number;
  quantity: number;
  unitPrice: number;        // price / quantity
  date: string;             // YYYY-MM-DD
  receiptId: string;        // links back to receipt
}

export interface Receipt {
  id: string;
  storeName: string;
  date: string;
  itemCount: number;
  total: number | null;
  scannedAt: string;        // ISO timestamp
}

export interface PriceDatabase {
  receipts: Receipt[];
  records: PriceRecord[];
}

const STORAGE_KEY = "price-compare-receipt-db";

function load(): PriceDatabase {
  if (typeof window === "undefined") return { receipts: [], records: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { receipts: [], records: [] };
  } catch {
    return { receipts: [], records: [] };
  }
}

function save(db: PriceDatabase) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/**
 * Save a scanned receipt and its items into the price database.
 */
export function saveReceipt(
  storeName: string,
  date: string,
  items: { name: string; price: number; quantity: number }[],
  total: number | null
): string {
  const db = load();
  const receiptId = generateId();

  db.receipts.push({
    id: receiptId,
    storeName,
    date,
    itemCount: items.length,
    total,
    scannedAt: new Date().toISOString(),
  });

  for (const item of items) {
    db.records.push({
      itemName: item.name,
      normalizedName: normalizeItemName(item.name),
      storeName,
      price: item.price,
      quantity: item.quantity,
      unitPrice: item.quantity > 0 ? item.price / item.quantity : item.price,
      date,
      receiptId,
    });
  }

  // Sort receipts newest first
  db.receipts.sort((a, b) => b.scannedAt.localeCompare(a.scannedAt));

  save(db);
  return receiptId;
}

/**
 * Get all receipts.
 */
export function getReceipts(): Receipt[] {
  return load().receipts;
}

/**
 * Get all price records.
 */
export function getAllRecords(): PriceRecord[] {
  return load().records;
}

/**
 * Delete a receipt and its records.
 */
export function deleteReceipt(receiptId: string) {
  const db = load();
  db.receipts = db.receipts.filter((r) => r.id !== receiptId);
  db.records = db.records.filter((r) => r.receiptId !== receiptId);
  save(db);
}

/**
 * Search items across all receipts by name.
 * Returns matches sorted by unit price (cheapest first).
 */
export function searchMyPrices(query: string): PriceRecord[] {
  const db = load();
  const normalized = normalizeItemName(query);
  if (!normalized) return [];

  const words = normalized.split(/\s+/);

  return db.records
    .filter((r) => {
      // All query words must appear in normalized name
      return words.every((w) => r.normalizedName.includes(w));
    })
    .sort((a, b) => a.unitPrice - b.unitPrice);
}

/**
 * Get unique items with their best (cheapest) price across all stores.
 * Groups by normalized name.
 */
export function getBestPrices(): {
  normalizedName: string;
  bestRecord: PriceRecord;
  allRecords: PriceRecord[];
  storeCount: number;
}[] {
  const db = load();
  const groups = new Map<string, PriceRecord[]>();

  for (const record of db.records) {
    const key = record.normalizedName;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(record);
  }

  const results = Array.from(groups.entries()).map(([normalizedName, records]) => {
    const sorted = [...records].sort((a, b) => a.unitPrice - b.unitPrice);
    const stores = new Set(records.map((r) => r.storeName));
    return {
      normalizedName,
      bestRecord: sorted[0],
      allRecords: sorted,
      storeCount: stores.size,
    };
  });

  return results.sort((a, b) => a.bestRecord.itemName.localeCompare(b.bestRecord.itemName));
}

/**
 * Get price comparison for a specific item across stores.
 */
export function getItemComparison(query: string): {
  storeName: string;
  latestPrice: number;
  latestDate: string;
  allPrices: { price: number; date: string }[];
}[] {
  const records = searchMyPrices(query);
  const byStore = new Map<string, PriceRecord[]>();

  for (const r of records) {
    if (!byStore.has(r.storeName)) byStore.set(r.storeName, []);
    byStore.get(r.storeName)!.push(r);
  }

  return Array.from(byStore.entries())
    .map(([storeName, storeRecords]) => {
      const sorted = [...storeRecords].sort((a, b) => b.date.localeCompare(a.date));
      return {
        storeName,
        latestPrice: sorted[0].unitPrice,
        latestDate: sorted[0].date,
        allPrices: sorted.map((r) => ({ price: r.unitPrice, date: r.date })),
      };
    })
    .sort((a, b) => a.latestPrice - b.latestPrice);
}
