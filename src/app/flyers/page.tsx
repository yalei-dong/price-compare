"use client";

import { useState, useMemo } from "react";
import { useLocale } from "@/context/LocaleContext";
import { useTranslation } from "@/hooks/useTranslation";
import {
  getStoresForLocale,
  StoreFlyer,
  TYPE_LABELS,
} from "@/lib/flyer-data";

export default function FlyersPage() {
  const t = useTranslation();
  const locale = useLocale();

  const data = useMemo(
    () => getStoresForLocale(locale.countryCode),
    [locale.countryCode]
  );

  const [filterType, setFilterType] = useState<string>("all");
  const [previewStore, setPreviewStore] = useState<StoreFlyer | null>(null);

  const currentStores = useMemo(() => {
    if (filterType === "all") return data.stores;
    return data.stores.filter((s) => s.type === filterType);
  }, [data.stores, filterType]);

  const storeTypes = useMemo(() => {
    const types = new Set(data.stores.map((s) => s.type));
    return ["all", ...Array.from(types)] as string[];
  }, [data.stores]);

  const typeColor: Record<string, string> = {
    grocery: "bg-green-100 text-green-700",
    warehouse: "bg-blue-100 text-blue-700",
    pharmacy: "bg-purple-100 text-purple-700",
    discount: "bg-yellow-100 text-yellow-700",
    general: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          📰 {t("flyers.title")}
        </h1>
        <p className="text-gray-600">{t("flyers.subtitle")}</p>
        {!locale.loading && locale.label && (
          <p className="mt-2 text-sm text-blue-600 font-medium">
            📍 {locale.label}
          </p>
        )}
      </div>

      {/* Type filter */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {storeTypes.map((tp) => (
          <button
            key={tp}
            onClick={() => setFilterType(tp)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterType === tp
                ? "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300"
                : "bg-gray-50 text-gray-500 hover:bg-gray-100"
            }`}
          >
            {tp === "all" ? t("flyers.allTypes") : t(TYPE_LABELS[tp as StoreFlyer["type"]])}
          </button>
        ))}
      </div>

      {/* Store grid */}
      {currentStores.length === 0 ? (
        <div className="text-center text-gray-400 py-16">
          <div className="text-4xl mb-3">📭</div>
          <p>{t("flyers.noStores")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentStores.map((store) => (
            <div
              key={store.name}
              className="group bg-white rounded-2xl border shadow-sm hover:shadow-lg hover:border-indigo-300 transition-all overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{store.logo}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                      {store.name}
                    </h3>
                    <span
                      className={`inline-block text-xs px-2 py-0.5 rounded-full mt-1 ${
                        typeColor[store.type] || "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {t(TYPE_LABELS[store.type])}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewStore(store)}
                    className="flex-1 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
                  >
                    👁️ Preview Flyer
                  </button>
                  <a
                    href={store.flyerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-3 py-2 bg-gray-50 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors text-center"
                  >
                    ↗ Open Full
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info banner */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <span className="text-xl">ℹ️</span>
        <div>
          <span className="text-blue-800 text-sm">{t("flyers.info")}</span>
        </div>
      </div>

      {/* Flyer Preview Modal — opens flyer in new tab since most stores block iframes */}
      {previewStore && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setPreviewStore(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 text-center">
              <span className="text-5xl mb-3 block">{previewStore.logo}</span>
              <h2 className="font-bold text-xl text-gray-900 mb-1">{previewStore.name}</h2>
              <p className="text-gray-500 text-sm mb-6">Weekly Flyer & Deals</p>

              <div className="space-y-3">
                <a
                  href={previewStore.flyerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full px-4 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                >
                  📰 View Weekly Flyer
                </a>
                <a
                  href={previewStore.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  🌐 Visit Store Website
                </a>
                <a
                  href={`https://www.google.com/maps/search/${encodeURIComponent(previewStore.name + " near me")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  📍 Find Nearby Locations
                </a>
              </div>

              <button
                onClick={() => setPreviewStore(null)}
                className="mt-4 text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
