"use client";

import { useState, useCallback } from "react";
import { useLocale } from "@/context/LocaleContext";
import { useTranslation } from "@/hooks/useTranslation";

interface StoreItemPrice {
  itemName: string;
  price: number;
  url?: string;
}

interface StoreScore {
  storeName: string;
  storeLogo: string;
  storeType: "online" | "local" | "both";
  items: StoreItemPrice[];
  coverage: number;
  totalCost: number;
  avgPrice: number;
  score: number;
  reasons: string[];
}

interface Props {
  items: { name: string; quantity: number }[];
}

export default function StoreRecommendation({ items }: Props) {
  const t = useTranslation();
  const locale = useLocale();
  const [stores, setStores] = useState<StoreScore[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  const fetchRecommendations = useCallback(async () => {
    if (items.length === 0) return;
    setLoading(true);
    setStores(null);
    try {
      const res = await fetch("/api/store-recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      setStores(data.stores || []);
    } catch {
      setStores([]);
    } finally {
      setLoading(false);
    }
  }, [items]);

  const typeIcon = (type: string) => {
    if (type === "local") return "🏪";
    if (type === "both") return "🏬";
    return "🌐";
  };

  const medal = (i: number) => {
    if (i === 0) return "🥇";
    if (i === 1) return "🥈";
    if (i === 2) return "🥉";
    return `#${i + 1}`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
      <div className="px-5 py-4 border-b bg-gradient-to-r from-amber-50 to-orange-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              🏪 {t("storeRec.title")}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {t("storeRec.subtitle")}
            </p>
          </div>
          <button
            onClick={fetchRecommendations}
            disabled={loading || items.length === 0}
            className="px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-xl hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t("storeRec.analyzing")}
              </>
            ) : stores ? (
              <>{t("storeRec.refresh")}</>
            ) : (
              <>{t("storeRec.findBest")}</>
            )}
          </button>
        </div>
      </div>

      {loading && (
        <div className="p-8 text-center text-gray-500">
          <div className="text-3xl mb-3 animate-bounce">🔍</div>
          <p className="font-medium">{t("storeRec.searching")}</p>
          <p className="text-xs text-gray-400 mt-1">
            {t("storeRec.searchingDesc", { count: items.length })}
          </p>
        </div>
      )}

      {stores && stores.length === 0 && !loading && (
        <div className="p-8 text-center text-gray-400">
          <div className="text-3xl mb-2">🤷</div>
          <p>{t("storeRec.noResults")}</p>
        </div>
      )}

      {stores && stores.length > 0 && !loading && (
        <div className="divide-y divide-gray-100">
          {stores.map((store, i) => {
            const isTop = i === 0;
            const isOpen = expanded === i;
            const covPct = Math.round(store.coverage * 100);
            const missingCount =
              items.length - store.items.length;

            return (
              <div
                key={store.storeName}
                className={`${isTop ? "bg-amber-50/50" : ""}`}
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : i)}
                  className="w-full px-5 py-4 flex items-center gap-4 hover:bg-gray-50/80 transition-colors text-left"
                >
                  <span className="text-2xl">{medal(i)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {store.storeLogo}
                      </span>
                      <span className="font-bold text-gray-900 truncate">
                        {store.storeName}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {typeIcon(store.storeType)}{" "}
                        {t(`storeRec.type.${store.storeType}`)}
                      </span>
                      {isTop && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 font-semibold">
                          {t("storeRec.recommended")}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
                      <span className="font-semibold text-gray-900">
                        {locale.symbol}
                        {store.totalCost.toFixed(2)}
                      </span>
                      <span>
                        {covPct}% {t("storeRec.coverage")}
                      </span>
                      {missingCount > 0 && (
                        <span className="text-orange-500">
                          {t("storeRec.missing", {
                            count: missingCount,
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  >
                    ▼
                  </span>
                </button>

                {isOpen && (
                  <div className="px-5 pb-4 space-y-3">
                    {/* Reasons */}
                    <div className="flex flex-wrap gap-2">
                      {store.reasons.map((rKey) => (
                        <span
                          key={rKey}
                          className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700"
                        >
                          ✓ {t(rKey)}
                        </span>
                      ))}
                    </div>

                    {/* Price breakdown */}
                    <div className="bg-gray-50 rounded-xl p-3">
                      <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase">
                        {t("storeRec.priceBreakdown")}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                        {store.items.map((si) => {
                          const qty =
                            items.find((it) => it.name === si.itemName)
                              ?.quantity || 1;
                          return (
                            <div
                              key={si.itemName}
                              className="flex items-center justify-between text-sm py-1 px-2 rounded hover:bg-white"
                            >
                              <span className="text-gray-700 truncate flex-1">
                                {si.itemName}
                                {qty > 1 && (
                                  <span className="text-gray-400 ml-1">
                                    ×{qty}
                                  </span>
                                )}
                              </span>
                              <span className="font-medium text-gray-900 ml-2">
                                {locale.symbol}
                                {(si.price * qty).toFixed(2)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      {missingCount > 0 && (
                        <p className="text-xs text-orange-500 mt-2">
                          ⚠️{" "}
                          {t("storeRec.missingNote", {
                            count: missingCount,
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
