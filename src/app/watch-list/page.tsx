"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useWatchList } from "@/context/WatchListContext";
import { useShoppingList } from "@/context/ShoppingListContext";
import { useLocale } from "@/context/LocaleContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Product, CURRENCY_SYMBOLS } from "@/lib/types";

interface WatchItemWithProduct {
  productId: string;
  productName: string;
  addedAt: string;
  targetPrice?: number;
  lastSeenPrice?: number;
  lastSeenStore?: string;
  lastChecked?: string;
  product?: Product;
  loading: boolean;
}

export default function WatchListPage() {
  const { items, removeItem, setTargetPrice, updatePrice } = useWatchList();
  const { addItem: addToShoppingList } = useShoppingList();
  const locale = useLocale();
  const t = useTranslation();
  const [watchItems, setWatchItems] = useState<WatchItemWithProduct[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [editingTarget, setEditingTarget] = useState<string | null>(null);
  const [addedFlashId, setAddedFlashId] = useState<string | null>(null);
  const [targetInput, setTargetInput] = useState("");

  const fetchPrices = useCallback(async () => {
    if (items.length === 0) return;
    setRefreshing(true);

    const updated: WatchItemWithProduct[] = items.map((item) => ({
      ...item,
      loading: true,
    }));
    setWatchItems(updated);

    const results = await Promise.allSettled(
      items.map(async (item) => {
        const params = new URLSearchParams({ q: item.productName });
        if (locale.countryCode) params.set("locale", locale.countryCode);
        const res = await fetch(`/api/search?${params.toString()}`);
        const data = await res.json();
        const product: Product | undefined = data.products?.[0];
        return { productId: item.productId, product };
      })
    );

    setWatchItems(
      items.map((item, i) => {
        const result = results[i];
        const product =
          result.status === "fulfilled" ? result.value.product : undefined;
        const cheapest = product?.prices
          ?.filter((p) => p.inStock)
          ?.sort((a, b) => a.price - b.price)?.[0];

        if (cheapest) {
          updatePrice(item.productId, cheapest.price, cheapest.storeName);
        }

        return {
          ...item,
          product,
          lastSeenPrice: cheapest?.price ?? item.lastSeenPrice,
          lastSeenStore: cheapest?.storeName ?? item.lastSeenStore,
          lastChecked: cheapest ? new Date().toISOString() : item.lastChecked,
          loading: false,
        };
      })
    );

    setRefreshing(false);
  }, [items, locale.countryCode, updatePrice]);

  useEffect(() => {
    if (!locale.loading && items.length > 0) {
      fetchPrices();
    } else {
      setWatchItems(items.map((item) => ({ ...item, loading: false })));
    }
  }, [items.length, locale.loading]);

  const handleSetTarget = (productId: string) => {
    const val = parseFloat(targetInput);
    if (!isNaN(val) && val > 0) {
      setTargetPrice(productId, val);
    }
    setEditingTarget(null);
    setTargetInput("");
  };

  const alertItems = watchItems.filter(
    (w) =>
      w.targetPrice &&
      w.lastSeenPrice &&
      w.lastSeenPrice <= w.targetPrice
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            👁️ {t("watchList.title")}
          </h1>
          <p className="text-gray-600 mt-1">{t("watchList.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          {items.length > 0 && (
            <>
              <button
                onClick={fetchPrices}
                disabled={refreshing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-colors"
              >
                {refreshing ? t("watchList.refreshing") : t("watchList.refresh")}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Price Alert Banner */}
      {alertItems.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <h2 className="text-green-800 font-semibold text-lg mb-2">
            🔔 {t("watchList.alertTitle")}
          </h2>
          <div className="space-y-2">
            {alertItems.map((item) => (
              <div
                key={item.productId}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-green-700 font-medium">
                  {item.productName}
                </span>
                <span className="text-green-800">
                  {t("watchList.alertNow")}{" "}
                  <strong>
                    ${item.lastSeenPrice?.toFixed(2)}
                  </strong>{" "}
                  {t("watchList.alertAt")} {item.lastSeenStore}
                  {item.targetPrice && (
                    <span className="text-green-600 ml-1">
                      ({t("watchList.alertTarget")} ${item.targetPrice.toFixed(2)})
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">👁️</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            {t("watchList.empty")}
          </h2>
          <p className="text-gray-500 mb-6">{t("watchList.emptyHint")}</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            {t("watchList.browseProducts")}
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {watchItems.map((item) => {
            const cheapest = item.product?.prices
              ?.filter((p) => p.inStock)
              ?.sort((a, b) => a.price - b.price)?.[0];
            const currency = cheapest
              ? CURRENCY_SYMBOLS[cheapest.currency] || "$"
              : "$";
            const hitTarget =
              item.targetPrice &&
              item.lastSeenPrice &&
              item.lastSeenPrice <= item.targetPrice;

            return (
              <div
                key={item.productId}
                className={`bg-white rounded-xl border p-4 shadow-sm transition-all ${
                  hitTarget
                    ? "border-green-300 bg-green-50/50"
                    : "border-gray-200"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {/* Product info */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/?q=${encodeURIComponent(item.productName)}`}
                      className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                    >
                      {item.productName}
                    </Link>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-500">
                      <span>
                        {t("watchList.added")}{" "}
                        {new Date(item.addedAt).toLocaleDateString()}
                      </span>
                      {item.lastChecked && (
                        <>
                          <span>•</span>
                          <span>
                            {t("watchList.checked")}{" "}
                            {new Date(item.lastChecked).toLocaleTimeString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Price info */}
                  <div className="flex items-center gap-4">
                    {item.loading ? (
                      <div className="animate-pulse bg-gray-200 rounded h-8 w-24" />
                    ) : item.lastSeenPrice ? (
                      <div className="text-right">
                        <div
                          className={`text-xl font-bold ${
                            hitTarget ? "text-green-600" : "text-gray-900"
                          }`}
                        >
                          {currency}
                          {item.lastSeenPrice.toFixed(2)}
                          {hitTarget && " 🎯"}
                        </div>
                        {item.lastSeenStore && (
                          <div className="text-xs text-gray-500">
                            {t("watchList.at")} {item.lastSeenStore}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">
                        {t("watchList.noPrice")}
                      </span>
                    )}
                  </div>
                </div>

                {/* Target price + actions */}
                <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                  {/* Target price */}
                  {editingTarget === item.productId ? (
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-gray-600">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={targetInput}
                        onChange={(e) => setTargetInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter")
                            handleSetTarget(item.productId);
                          if (e.key === "Escape") setEditingTarget(null);
                        }}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSetTarget(item.productId)}
                        className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => setEditingTarget(null)}
                        className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingTarget(item.productId);
                        setTargetInput(
                          item.targetPrice?.toString() ?? ""
                        );
                      }}
                      className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                        item.targetPrice
                          ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      🎯{" "}
                      {item.targetPrice
                        ? `${t("watchList.target")}: $${item.targetPrice.toFixed(2)}`
                        : t("watchList.setTarget")}
                    </button>
                  )}

                  {/* Clear target */}
                  {item.targetPrice && editingTarget !== item.productId && (
                    <button
                      onClick={() => setTargetPrice(item.productId, undefined)}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                      title={t("watchList.clearTarget")}
                    >
                      ✕
                    </button>
                  )}

                  <div className="flex-1" />

                  {/* Add to shopping list */}
                  <button
                    onClick={() => {
                      addToShoppingList(item.productId, item.productName);
                      setAddedFlashId(item.productId);
                      setTimeout(() => setAddedFlashId(null), 1500);
                    }}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                      addedFlashId === item.productId
                        ? "bg-green-50 text-green-600"
                        : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                    }`}
                  >
                    {addedFlashId === item.productId
                      ? `✓ ${t("card.addedToList")}`
                      : `🛒 ${t("watchList.addToCart")}`}
                  </button>

                  {/* Remove */}
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-full hover:bg-red-100 font-medium transition-colors"
                  >
                    {t("watchList.remove")}
                  </button>
                </div>

                {/* More prices from search */}
                {item.product &&
                  item.product.prices.filter((p) => p.inStock).length > 1 && (
                    <details className="mt-3">
                      <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-800 font-medium">
                        {t("watchList.morePrices", {
                          count: item.product.prices.filter((p) => p.inStock)
                            .length,
                        })}
                      </summary>
                      <div className="mt-2 space-y-1">
                        {item.product.prices
                          .filter((p) => p.inStock)
                          .sort((a, b) => a.price - b.price)
                          .slice(0, 5)
                          .map((p, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-1.5"
                            >
                              <span className="text-gray-700">
                                {p.storeLogo} {p.storeName}
                                {p.url && (
                                  <a
                                    href={p.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-1 text-xs text-blue-500"
                                  >
                                    ↗
                                  </a>
                                )}
                              </span>
                              <span className="font-semibold text-gray-800">
                                {CURRENCY_SYMBOLS[p.currency] || "$"}
                                {p.price.toFixed(2)}
                              </span>
                            </div>
                          ))}
                      </div>
                    </details>
                  )}
              </div>
            );
          })}
        </div>
      )}

      {/* Info */}
      {items.length > 0 && (
        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
          💡 {t("watchList.info")}
        </div>
      )}
    </div>
  );
}
