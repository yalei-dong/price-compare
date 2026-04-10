"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ShoppingListItem } from "@/lib/types";

interface ShoppingListContextType {
  items: ShoppingListItem[];
  addItem: (productId: string, productName: string) => void;
  removeItem: (productId: string) => void;
  toggleChecked: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearList: () => void;
  clearChecked: () => void;
}

const ShoppingListContext = createContext<ShoppingListContextType | undefined>(undefined);

export function ShoppingListProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ShoppingListItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("price-compare-shopping-list");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("price-compare-shopping-list", JSON.stringify(items));
  }, [items]);

  const addItem = (productId: string, productName: string) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { productId, productName, quantity: 1, checked: false }];
    });
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const toggleChecked = (productId: string) => {
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId ? { ...i, checked: !i.checked } : i
      )
    );
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId ? { ...i, quantity } : i
      )
    );
  };

  const clearList = () => setItems([]);
  const clearChecked = () => setItems((prev) => prev.filter((i) => !i.checked));

  return (
    <ShoppingListContext.Provider
      value={{ items, addItem, removeItem, toggleChecked, updateQuantity, clearList, clearChecked }}
    >
      {children}
    </ShoppingListContext.Provider>
  );
}

export function useShoppingList() {
  const ctx = useContext(ShoppingListContext);
  if (!ctx) throw new Error("useShoppingList must be used within ShoppingListProvider");
  return ctx;
}
