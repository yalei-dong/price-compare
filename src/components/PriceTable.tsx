"use client";

import { PriceEntry, CURRENCY_SYMBOLS } from "@/lib/types";
import { useTranslation } from "@/hooks/useTranslation";

interface PriceTableProps {
  prices: PriceEntry[];
  sortBy?: "price" | "store";
}

export default function PriceTable({ prices, sortBy = "price" }: PriceTableProps) {
  const t = useTranslation();
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
            const handleRowClick = () => {
              if (price.url) window.open(price.url, "_blank", "noopener,noreferrer");
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
