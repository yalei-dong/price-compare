"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      // Force clear all old caches and unregister stale service workers first
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const reg of registrations) {
          reg.unregister();
        }
      });
      caches.keys().then((names) => {
        for (const name of names) {
          caches.delete(name);
        }
      });

      // Re-register the fresh service worker after a short delay
      setTimeout(() => {
        navigator.serviceWorker
          .register("/sw.js")
          .catch((err) => console.warn("SW registration failed:", err));
      }, 1000);
    }
  }, []);

  return null;
}
