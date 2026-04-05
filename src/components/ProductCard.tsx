"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Product, CURRENCY_SYMBOLS } from "@/lib/types";
import ProductImage from "./ProductImage";
import { useTranslation } from "@/hooks/useTranslation";
import { useWatchList } from "@/context/WatchListContext";

interface ProductCardProps {
  product: Product;
  onAddToList?: (productId: string, productName: string) => void;
}

export default function ProductCard({ product, onAddToList }: ProductCardProps) {
  const t = useTranslation();
  const router = useRouter();
  const [addedFlash, setAddedFlash] = useState(false);
  const { isWatching, addItem: addToWatch, removeItem: removeFromWatch } = useWatchList();
  const watching = isWatching(product.id);
  const lowestPrice = product.prices.reduce(
    (min, p) => (p.inStock && p.price < min.price ? p : min),
    product.prices.find((p) => p.inStock) || product.prices[0]
  );

  // Top 3 cheapest in-stock stores
  const topStores = [...product.prices]
    .filter((p) => p.inStock)
    .sort((a, b) => a.price - b.price)
    .slice(0, 3);

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden border border-gray-100 cursor-pointer">
      <div className="block" onClick={() => router.push(`/product/${product.id}`)}>
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            <ProductImage src={product.image} alt={product.name} size="md" />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-1">
                <h3 className="font-semibold text-gray-900 text-lg leading-tight truncate">
                  {product.name}
                </h3>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    watching
                      ? removeFromWatch(product.id)
                      : addToWatch(product.id, product.name);
                  }}
                  className={`shrink-0 text-lg transition-transform hover:scale-110 ${
                    watching ? "text-red-500" : "text-gray-300 hover:text-red-400"
                  }`}
                  title={watching ? t("card.unwatch") : t("card.watch")}
                >
                  {watching ? "♥" : "♡"}
                </button>
              </div>
              <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                {product.category}
              </span>
            </div>
          </div>

          {/* Best Price Highlight */}
          {lowestPrice && (
            <a
              href={lowestPrice.url || `/product/${product.id}`}
              target={lowestPrice.url ? "_blank" : undefined}
              rel={lowestPrice.url ? "noopener noreferrer" : undefined}
              className={`block bg-green-50 border border-green-200 rounded-lg p-3 mb-3 ${
                lowestPrice.url ? "hover:border-green-400 hover:bg-green-100" : "hover:border-green-300"
              } transition-colors`}
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <div className="text-xs text-green-700 font-medium mb-1">{t("card.bestPrice")}</div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-green-700">
                  {CURRENCY_SYMBOLS[lowestPrice.currency]}{lowestPrice.price.toFixed(2)}
                </span>
                <span className="text-sm text-green-600">
                  {lowestPrice.currency} / {lowestPrice.unit}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-green-600 mt-1">
                <span>
                  {lowestPrice.storeLogo} {lowestPrice.storeName}
                  {lowestPrice.type === "local" && (
                    <span className="ml-1 text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
                      {t("card.inStoreOnly")}
                    </span>
                  )}
                  {lowestPrice.type === "both" && (
                    <span className="ml-1 text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                      {t("card.inStoreOnline")}
                    </span>
                  )}
                </span>
                {lowestPrice.url && (
                  <span className="text-xs text-green-700 font-medium">{t("card.visitStore")}</span>
                )}
              </div>
            </a>
          )}

          {/* Top Stores */}
          {topStores.length > 1 && (
            <div className="space-y-1.5 mb-3">
              <div className="text-xs text-gray-500 font-medium">{t("card.alsoAt")}</div>
              {topStores.slice(1).map((sp) =>
                sp.url ? (
                  <a
                    key={sp.storeId}
                    href={sp.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-1.5 hover:bg-blue-50 hover:border-blue-200 border border-transparent cursor-pointer transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-gray-700">
                      {sp.storeLogo} {sp.storeName}
                      <span className="ml-1 text-xs text-blue-500">↗</span>
                    </span>
                    <span className="font-semibold text-gray-800">
                      {CURRENCY_SYMBOLS[sp.currency]}{sp.price.toFixed(2)}
                    </span>
                  </a>
                ) : (
                  <div
                    key={sp.storeId}
                    className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-1.5"
                  >
                    <span className="text-gray-700">
                      {sp.storeLogo} {sp.storeName}
                    </span>
                    <span className="font-semibold text-gray-800">
                      {CURRENCY_SYMBOLS[sp.currency]}{sp.price.toFixed(2)}
                    </span>
                  </div>
                )
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{t("card.storesCompared", { count: product.prices.length })}</span>
            <span className="text-blue-600 font-medium">{t("card.viewDetails")}</span>
          </div>
        </div>
      </div>

      {/* Add to Shopping List */}
      {onAddToList && (
        <div className="border-t border-gray-100 px-4 py-2">
          <button
            onClick={(e) => {
              e.preventDefault();
              onAddToList(product.id, product.name);
              setAddedFlash(true);
              setTimeout(() => setAddedFlash(false), 1500);
            }}
            className={`w-full text-sm font-medium py-1 transition-colors ${
              addedFlash
                ? "text-green-600"
                : "text-blue-600 hover:text-blue-800"
            }`}
          >
            {addedFlash ? `✓ ${t("card.addedToList")}` : t("card.addToList")}
          </button>
        </div>
      )}
    </div>
  );
}
