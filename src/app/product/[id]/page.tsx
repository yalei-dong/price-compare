"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import PriceTable from "@/components/PriceTable";
import ProductImage from "@/components/ProductImage";
import PriceHistoryChart from "@/components/PriceHistoryChart";
import { useShoppingList } from "@/context/ShoppingListContext";
import { useLocale } from "@/context/LocaleContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Product, CURRENCY_SYMBOLS } from "@/lib/types";
import { filterOutlierPrices } from "@/lib/price-history";

export default function ProductDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"price" | "store">("price");
  const [filterType, setFilterType] = useState<string>("all");
  const [addedFlash, setAddedFlash] = useState(false);
  const { addItem } = useShoppingList();
  const locale = useLocale();
  const t = useTranslation();

  useEffect(() => {
    if (locale.loading) return;
    const localeParam = locale.countryCode ? `?locale=${locale.countryCode}` : "";
    fetch(`/api/products/${id}${localeParam}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setProduct(null);
        } else {
          setProduct(data);
        }
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id, locale.loading, locale.countryCode]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
        <p className="mt-3 text-gray-500">{t("detail.loading")}</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <span className="text-5xl block mb-4">❌</span>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{t("detail.notFound")}</h2>
        <Link href="/" className="text-blue-600 hover:underline">
          {t("detail.back")}
        </Link>
      </div>
    );
  }

  let filteredPrices = product.prices;
  if (filterType !== "all") {
    filteredPrices = filteredPrices.filter((p) => p.type === filterType);
  }

  // Overall price stats (filtered to exclude extreme outliers)
  const inStockPrices = filterOutlierPrices(product.prices.filter((p) => p.inStock));
  const cheapest = inStockPrices.length > 0
    ? inStockPrices.reduce((min, p) => (p.price < min.price ? p : min), inStockPrices[0])
    : null;
  const mostExpensive = inStockPrices.length > 0
    ? inStockPrices.reduce((max, p) => (p.price > max.price ? p : max), inStockPrices[0])
    : null;
  const avgPrice = inStockPrices.length > 0
    ? inStockPrices.reduce((s, p) => s + p.price, 0) / inStockPrices.length
    : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <Link href="/" className="text-blue-600 hover:underline text-sm mb-4 inline-block">
        {t("detail.back")}
      </Link>

      {/* Product Header */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <ProductImage src={product.image} alt={product.name} size="xl" />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-1">{product.name}</h1>
            <p className="text-gray-600 text-sm sm:text-base mb-2">{product.description}</p>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs sm:text-sm">
                {product.category}
              </span>
              {product.barcode && (
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs sm:text-sm">
                  {t("detail.barcode", { code: product.barcode })}
                </span>
              )}
              <span className="text-xs sm:text-sm text-gray-500">
                {t("detail.priceListing", { count: product.prices.length })}
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              addItem(product.id, product.name);
              setAddedFlash(true);
              setTimeout(() => setAddedFlash(false), 1500);
            }}
            className={`w-full sm:w-auto px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
              addedFlash
                ? "bg-green-600 text-white"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {addedFlash ? `✓ ${t("card.addedToList")}` : t("detail.addToList")}
          </button>
        </div>
      </div>

      {/* Price Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {cheapest && (
          cheapest.url ? (
            <a
              href={cheapest.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-green-50 border border-green-200 rounded-xl p-4 transition-colors hover:bg-green-100 hover:border-green-400 cursor-pointer group"
            >
              <div className="text-xs text-green-700 font-medium mb-1">{t("detail.cheapest")}</div>
              <div className="text-2xl font-bold text-green-700">
                {CURRENCY_SYMBOLS[cheapest.currency]}{cheapest.price.toFixed(2)}
                <span className="text-sm font-normal text-green-600 ml-1">{cheapest.currency}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-green-600 mt-1">
                <span>{cheapest.storeLogo} {cheapest.storeName}</span>
                <span className="text-xs font-medium group-hover:underline">{t("card.visitStore")} ↗</span>
              </div>
            </a>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="text-xs text-green-700 font-medium mb-1">{t("detail.cheapest")}</div>
              <div className="text-2xl font-bold text-green-700">
                {CURRENCY_SYMBOLS[cheapest.currency]}{cheapest.price.toFixed(2)}
                <span className="text-sm font-normal text-green-600 ml-1">{cheapest.currency}</span>
              </div>
              <div className="text-sm text-green-600 mt-1">
                {cheapest.storeLogo} {cheapest.storeName}
              </div>
            </div>
          )
        )}
        {mostExpensive && (
          mostExpensive.url ? (
            <a
              href={mostExpensive.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-red-50 border border-red-200 rounded-xl p-4 transition-colors hover:bg-red-100 hover:border-red-400 cursor-pointer group"
            >
              <div className="text-xs text-red-700 font-medium mb-1">{t("detail.mostExpensive")}</div>
              <div className="text-2xl font-bold text-red-600">
                {CURRENCY_SYMBOLS[mostExpensive.currency]}{mostExpensive.price.toFixed(2)}
                <span className="text-sm font-normal text-red-500 ml-1">{mostExpensive.currency}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-red-500 mt-1">
                <span>{mostExpensive.storeLogo} {mostExpensive.storeName}</span>
                <span className="text-xs font-medium group-hover:underline">{t("card.visitStore")} ↗</span>
              </div>
            </a>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="text-xs text-red-700 font-medium mb-1">{t("detail.mostExpensive")}</div>
              <div className="text-2xl font-bold text-red-600">
                {CURRENCY_SYMBOLS[mostExpensive.currency]}{mostExpensive.price.toFixed(2)}
                <span className="text-sm font-normal text-red-500 ml-1">{mostExpensive.currency}</span>
              </div>
              <div className="text-sm text-red-500 mt-1">
                {mostExpensive.storeLogo} {mostExpensive.storeName}
              </div>
            </div>
          )
        )}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="text-xs text-blue-700 font-medium mb-1">{t("detail.priceRange")}</div>
          <div className="text-lg font-bold text-blue-700">
            {t("detail.stores", { count: inStockPrices.length })}
          </div>
          <div className="text-sm text-blue-600 mt-1">
            {t("detail.avg", { symbol: cheapest ? CURRENCY_SYMBOLS[cheapest.currency] : "$", price: avgPrice.toFixed(2) })}
          </div>
        </div>
      </div>

      {/* Price History Chart */}
      <PriceHistoryChart
        productId={product.id}
        productName={product.name}
        currentPrices={product.prices}
      />

      {/* Filters & Sort */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="text-sm text-gray-600 mr-2">{t("detail.sortBy")}</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "price" | "store")}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700"
            >
              <option value="price">{t("detail.priceLowHigh")}</option>
              <option value="store">{t("detail.storeName")}</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600 mr-2">{t("detail.typeFilter")}</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700"
            >
              <option value="all">{t("detail.all")}</option>
              <option value="online">{t("filter.onlineOnly")}</option>
              <option value="local">{t("filter.inStoreOnly")}</option>
              <option value="both">{t("filter.inStoreAndOnline")}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Price Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <PriceTable prices={filteredPrices} sortBy={sortBy} />
      </div>
    </div>
  );
}
