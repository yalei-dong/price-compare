"use client";

import { useState } from "react";
import { PriceEntry, CURRENCY_SYMBOLS } from "@/lib/types";
import { useTranslation } from "@/hooks/useTranslation";

export interface FlyerModalData {
  store: string;
  product: string;
  price: string;
  currency: string;
  image: string;
  validFrom: string;
  validTo: string;
  unit: string;
  saleStory: string;
  storeLogo: string;
}

export function parseFlyerUrl(url: string): FlyerModalData | null {
  if (!url.startsWith("/flyer-item?")) return null;
  try {
    const params = new URLSearchParams(url.split("?")[1]);
    return {
      store: params.get("store") || "Unknown Store",
      product: params.get("product") || "Flyer Item",
      price: params.get("price") || "",
      currency: params.get("currency") || "CAD",
      image: params.get("image") || "",
      validFrom: params.get("from") || "",
      validTo: params.get("to") || "",
      unit: params.get("unit") || "each",
      saleStory: params.get("sale") || "",
      storeLogo: params.get("logo") || "",
    };
  } catch {
    return null;
  }
}

export function FlyerDetailModal({ data, onClose }: { data: FlyerModalData; onClose: () => void }) {
  const priceNum = parseFloat(data.price);
  const currSymbol = CURRENCY_SYMBOLS[data.currency] || "$";

  const formatDate = (iso: string) => {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleDateString("en-CA", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    } catch {
      return iso;
    }
  };

  const fromStr = formatDate(data.validFrom);
  const toStr = formatDate(data.validTo);
  const isExpired = data.validTo ? new Date(data.validTo) < new Date() : false;
  const daysLeft = data.validTo
    ? Math.max(0, Math.ceil((new Date(data.validTo).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Store header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
          <div className="flex items-center gap-3">
            {data.storeLogo ? (
              <img
                src={data.storeLogo}
                alt={data.store}
                className="w-10 h-10 rounded-lg bg-white object-contain p-1"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <span className="text-3xl">📰</span>
            )}
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">{data.store}</h2>
              <p className="text-indigo-200 text-sm">Weekly Flyer Deal</p>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white text-2xl leading-none">✕</button>
          </div>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* Product image */}
          {data.image && (
            <div className="bg-gray-50 rounded-xl p-4 mb-4 flex justify-center">
              <img
                src={data.image}
                alt={data.product}
                className="max-h-48 object-contain"
                onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = "none"; }}
              />
            </div>
          )}

          <h3 className="text-lg font-bold text-gray-900 mb-2">{data.product}</h3>

          {data.saleStory && (
            <p className="text-sm text-orange-600 font-medium mb-4 bg-orange-50 px-3 py-1.5 rounded-lg inline-block">
              🏷️ {data.saleStory}
            </p>
          )}

          {!isNaN(priceNum) && priceNum > 0 && (
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-3xl font-bold text-green-700">{currSymbol}{priceNum.toFixed(2)}</span>
              <span className="text-gray-500 text-sm">{data.currency}</span>
              {data.unit && data.unit !== "each" && (
                <span className="text-gray-500 text-sm">/ {data.unit}</span>
              )}
            </div>
          )}

          {(fromStr || toStr) && (
            <div className={`rounded-lg px-4 py-3 mb-4 ${isExpired ? "bg-red-50 border border-red-200" : "bg-green-50 border border-green-200"}`}>
              <div className="flex items-center gap-2">
                <span>{isExpired ? "⏰" : "✅"}</span>
                <div>
                  {isExpired ? (
                    <span className="text-red-700 text-sm font-medium">This deal has expired</span>
                  ) : (
                    <>
                      <span className="text-green-700 text-sm font-medium">Valid: {fromStr} – {toStr}</span>
                      {daysLeft !== null && daysLeft <= 3 && (
                        <span className="text-orange-600 text-xs ml-2">
                          ({daysLeft === 0 ? "Ends today!" : `${daysLeft} day${daysLeft > 1 ? "s" : ""} left`})
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface PriceTableProps {
  prices: PriceEntry[];
  sortBy?: "price" | "store";
}

export default function PriceTable({ prices, sortBy = "price" }: PriceTableProps) {
  const t = useTranslation();
  const [flyerModal, setFlyerModal] = useState<FlyerModalData | null>(null);
  const sorted = [...prices].sort((a, b) => {
    if (sortBy === "price") return a.price - b.price;
    return a.storeName.localeCompare(b.storeName);
  });

  const lowestPrice = prices.reduce(
    (min, p) => {
      if (p.inStock && (min === null || p.price < min)) return p.price;
      return min;
    },
    null as number | null
  );

  return (
    <div className="overflow-x-auto">
      {flyerModal && <FlyerDetailModal data={flyerModal} onClose={() => setFlyerModal(null)} />}
      <table className="w-full text-left table-fixed">
        <thead>
          <tr className="border-b-2 border-gray-200">
            <th className="py-3 px-2 sm:px-4 text-sm font-semibold text-gray-600 w-[60%] sm:w-auto">{t("table.store")}</th>
            <th className="py-3 px-2 sm:px-4 text-sm font-semibold text-gray-600 hidden sm:table-cell">{t("table.type")}</th>
            <th className="py-3 px-2 sm:px-4 text-sm font-semibold text-gray-600 w-[40%] sm:w-auto text-right sm:text-left">{t("table.price")}</th>
            <th className="py-3 px-2 sm:px-4 text-sm font-semibold text-gray-600 hidden md:table-cell">{t("table.unit")}</th>
            <th className="py-3 px-2 sm:px-4 text-sm font-semibold text-gray-600 hidden sm:table-cell">{t("table.stock")}</th>
            <th className="py-3 px-2 sm:px-4 text-sm font-semibold text-gray-600 hidden lg:table-cell">{t("table.updated")}</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((price, idx) => {
            const isBest = price.inStock && lowestPrice !== null && price.price === lowestPrice;
            const isInternal = price.url?.startsWith("/");
            const flyerData = price.url ? parseFlyerUrl(price.url) : null;
            const handleRowClick = () => {
              if (flyerData) {
                setFlyerModal(flyerData);
              } else if (price.url) {
                if (isInternal) {
                  window.location.href = price.url;
                } else {
                  window.open(price.url, "_blank", "noopener,noreferrer");
                }
              }
            };
            return (
              <tr
                key={`${price.storeId}-${idx}`}
                onClick={handleRowClick}
                className={`border-b border-gray-100 transition-colors ${
                  price.url ? "cursor-pointer" : ""
                } ${
                  isBest
                    ? "bg-green-50 hover:bg-green-100"
                    : "hover:bg-gray-50"
                } ${!price.inStock ? "opacity-60" : ""}`}
              >
                <td className="py-3 px-2 sm:px-4">
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                    {price.thumbnail ? (
                      <img
                        src={price.thumbnail}
                        alt={price.storeName}
                        className="w-8 h-8 sm:w-10 sm:h-10 object-contain rounded bg-gray-50 flex-shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <span className="text-lg flex-shrink-0">{price.storeLogo}</span>
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-gray-800 text-sm sm:text-base block truncate">{price.storeName}</span>
                      {price.url && (
                        <span className="block text-xs text-blue-500">
                          {price.isFlyer ? (t("table.viewFlyer") || "View flyer →") : t("table.visitStore")}
                        </span>
                      )}
                    </div>
                    {isBest && (
                      <span className="text-xs bg-green-200 text-green-800 px-1.5 py-0.5 rounded font-medium hidden sm:inline">
                        {t("table.best")}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-2 sm:px-4 hidden sm:table-cell">
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      price.type === "both"
                        ? "bg-purple-100 text-purple-700"
                        : price.type === "online"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {price.type === "both" ? t("table.both") : price.type === "online" ? t("table.online") : t("table.local")}
                  </span>
                </td>
                <td className="py-3 px-2 sm:px-4 text-right sm:text-left whitespace-nowrap">
                  <span className={`text-sm sm:text-lg font-bold ${isBest ? "text-green-700" : "text-gray-800"}`}>
                    {CURRENCY_SYMBOLS[price.currency]}{price.price.toFixed(2)}
                  </span>
                  <span className="text-xs text-gray-500 ml-0.5 sm:ml-1">{price.currency}</span>
                </td>
                <td className="py-3 px-2 sm:px-4 text-sm text-gray-600 hidden md:table-cell">{price.unit}</td>
                <td className="py-3 px-2 sm:px-4 hidden sm:table-cell">
                  {price.inStock ? (
                    <span className="text-green-600 text-sm font-medium">{t("table.inStock")}</span>
                  ) : (
                    <span className="text-red-500 text-sm font-medium">{t("table.outOfStock")}</span>
                  )}
                </td>
                <td className="py-3 px-2 sm:px-4 text-sm text-gray-500 hidden lg:table-cell">{price.lastUpdated}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
