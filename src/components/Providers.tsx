"use client";

import { ShoppingListProvider } from "@/context/ShoppingListContext";
import { WatchListProvider } from "@/context/WatchListContext";
import { ClippedDealsProvider } from "@/context/ClippedDealsContext";
import { LocaleProvider } from "@/context/LocaleContext";
import ServiceWorkerRegistrar from "./ServiceWorkerRegistrar";
import { ReactNode } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider>
      <WatchListProvider>
        <ShoppingListProvider>
          <ClippedDealsProvider>
            <ServiceWorkerRegistrar />
            {children}
          </ClippedDealsProvider>
        </ShoppingListProvider>
      </WatchListProvider>
    </LocaleProvider>
  );
}
