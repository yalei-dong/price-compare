"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface ClippedDeal {
  id: string;
  storeName: string;
  storeLogo: string;
  productName: string;
  price: number;
  currency: string;
  unit: string;
  validUntil?: string;
  flyerUrl?: string;
  thumbnail?: string;
  clippedAt: string;
}

interface ClippedDealsContextType {
  deals: ClippedDeal[];
  clipDeal: (deal: Omit<ClippedDeal, "id" | "clippedAt">) => void;
  unclipDeal: (id: string) => void;
  isClipped: (storeName: string, productName: string) => boolean;
  clearExpired: () => void;
  clearAll: () => void;
}

const ClippedDealsContext = createContext<ClippedDealsContextType | undefined>(undefined);

export function ClippedDealsProvider({ children }: { children: ReactNode }) {
  const [deals, setDeals] = useState<ClippedDeal[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("price-compare-clipped-deals");
    if (saved) {
      try { setDeals(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("price-compare-clipped-deals", JSON.stringify(deals));
  }, [deals]);

  const clipDeal = (deal: Omit<ClippedDeal, "id" | "clippedAt">) => {
    setDeals((prev) => {
      if (prev.some((d) => d.storeName === deal.storeName && d.productName === deal.productName)) {
        return prev;
      }
      return [...prev, { ...deal, id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, clippedAt: new Date().toISOString() }];
    });
  };

  const unclipDeal = (id: string) => {
    setDeals((prev) => prev.filter((d) => d.id !== id));
  };

  const isClipped = (storeName: string, productName: string) => {
    return deals.some((d) => d.storeName === storeName && d.productName === productName);
  };

  const clearExpired = () => {
    const now = new Date().toISOString();
    setDeals((prev) => prev.filter((d) => !d.validUntil || d.validUntil >= now));
  };

  const clearAll = () => setDeals([]);

  return (
    <ClippedDealsContext.Provider value={{ deals, clipDeal, unclipDeal, isClipped, clearExpired, clearAll }}>
      {children}
    </ClippedDealsContext.Provider>
  );
}

export function useClippedDeals() {
  const ctx = useContext(ClippedDealsContext);
  if (!ctx) throw new Error("useClippedDeals must be used within ClippedDealsProvider");
  return ctx;
}
