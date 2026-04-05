"use client";

import { ShoppingListProvider } from "@/context/ShoppingListContext";
import { WatchListProvider } from "@/context/WatchListContext";
import { LocaleProvider } from "@/context/LocaleContext";
import ServiceWorkerRegistrar from "./ServiceWorkerRegistrar";
import { ReactNode } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider>
      <WatchListProvider>
        <ShoppingListProvider>
          <ServiceWorkerRegistrar />
          {children}
        </ShoppingListProvider>
      </WatchListProvider>
    </LocaleProvider>
  );
}
