"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface WatchItem {
  productId: string;
  productName: string;
  addedAt: string;           // ISO date string
  targetPrice?: number;      // optional price alert threshold
  lastSeenPrice?: number;
  lastSeenStore?: string;
  lastChecked?: string;      // ISO date string
}

interface WatchListContextType {
  items: WatchItem[];
  addItem: (productId: string, productName: string) => void;
  removeItem: (productId: string) => void;
  isWatching: (productId: string) => boolean;
  setTargetPrice: (productId: string, price: number | undefined) => void;
  updatePrice: (productId: string, price: number, storeName: string) => void;
  clearList: () => void;
}

const WatchListContext = createContext<WatchListContextType | undefined>(undefined);

const STORAGE_KEY = "price-compare-watch-list";

export function WatchListProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WatchItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch {
        // ignore corrupt data
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (productId: string, productName: string) => {
    setItems((prev) => {
      if (prev.some((i) => i.productId === productId)) return prev;
      return [...prev, { productId, productName, addedAt: new Date().toISOString() }];
    });
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const isWatching = (productId: string) => {
    return items.some((i) => i.productId === productId);
  };

  const setTargetPrice = (productId: string, price: number | undefined) => {
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId ? { ...i, targetPrice: price } : i
      )
    );
  };

  const updatePrice = (productId: string, price: number, storeName: string) => {
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId
          ? { ...i, lastSeenPrice: price, lastSeenStore: storeName, lastChecked: new Date().toISOString() }
          : i
      )
    );
  };

  const clearList = () => setItems([]);

  return (
    <WatchListContext.Provider
      value={{ items, addItem, removeItem, isWatching, setTargetPrice, updatePrice, clearList }}
    >
      {children}
    </WatchListContext.Provider>
  );
}

export function useWatchList() {
  const ctx = useContext(WatchListContext);
  if (!ctx) throw new Error("useWatchList must be used within WatchListProvider");
  return ctx;
}
