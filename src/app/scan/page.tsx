"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PriceTable from "@/components/PriceTable";
import { useLocale } from "@/context/LocaleContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Product } from "@/lib/types";

export default function ScanPage() {
  const [barcode, setBarcode] = useState("");
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslation();

  async function handleSearch() {
    const code = barcode.trim();
    if (!code) return;

    setLoading(true);
    setError(null);
    setProduct(null);

    const localeParam = locale.countryCode ? `&locale=${locale.countryCode}` : "";

    try {
      // Try barcode API first (Open Food Facts + live prices)
      const res = await fetch(`/api/barcode?code=${encodeURIComponent(code)}${localeParam}`);
      if (res.ok) {
        const data = await res.json();
        setProduct(data);
      } else {
        // Fallback: search by barcode string
        const searchRes = await fetch(`/api/search?q=${encodeURIComponent(code)}${localeParam}`);
        const searchData = await searchRes.json();
        if (searchData.products?.length > 0) {
          setProduct(searchData.products[0]);
        } else {
          setError(t("scan.noProduct", { code }));
        }
      }
    } catch {
      setError(t("scan.failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <span className="text-6xl block mb-4">📷</span>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t("scan.title")}</h1>
        <p className="text-gray-600">
          {t("scan.subtitle")}
        </p>
      </div>

      {/* Camera Placeholder */}
      <div className="bg-white rounded-xl shadow-md p-8 mb-6">
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center mb-6 bg-gray-50">
          <span className="text-5xl block mb-4">📸</span>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">{t("scan.cameraTitle")}</h3>
          <p className="text-gray-500 text-sm mb-4 whitespace-pre-line">
            {t("scan.cameraDesc")}
          </p>
          <div className="inline-block px-4 py-2 bg-gray-200 text-gray-500 rounded-lg text-sm">
            {t("scan.cameraNA")}
          </div>
        </div>

        {/* Manual Entry */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("scan.inputLabel")}
            Enter Barcode (UPC / EAN / PLU)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder={t("scan.inputPlaceholder")}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? t("scan.searching") : t("scan.lookUp")}
            </button>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-3 text-gray-500">{t("scan.lookingUp")}</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700">
          {error}
        </div>
      )}

      {/* Result */}
      {product && !loading && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-start gap-4">
              {product.image && product.image.startsWith("http") ? (
                <img src={product.image} alt={product.name} className="w-20 h-20 object-contain rounded-lg bg-gray-50" />
              ) : (
                <span className="text-5xl">{product.image || "📦"}</span>
              )}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
                <p className="text-gray-600 text-sm mt-1">{product.description}</p>
                <div className="flex gap-2 mt-2">
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                    {product.category}
                  </span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                    {t("detail.barcode", { code: product.barcode || "" })}
                  </span>
                  {product.prices.some((p) => p.url) && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                      {t("scan.livePrices")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          {product.prices.length > 0 ? (
            <PriceTable prices={product.prices} />
          ) : (
            <div className="p-8 text-center text-gray-500">
              {t("scan.noPriceData")}
            </div>
          )}
        </div>
      )}

      {/* Sample Barcodes */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="font-semibold text-gray-800 mb-1">{t("scan.tryBarcodes")}</h3>
        <p className="text-xs text-gray-500 mb-3">
          {t("scan.tryBarcodesDesc")}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { code: "5000112637922", name: "Coca-Cola (real UPC)" },
            { code: "3017620422003", name: "Nutella (real EAN)" },
            { code: "8801234567893", name: "Korean Ramen (real EAN)" },
            { code: "4011", name: "Bananas (PLU – mock)" },
            { code: "0123456789012", name: "Organic Milk (mock)" },
            { code: "0234567890123", name: "Large Eggs (mock)" },
          ].map(({ code, name }) => (
            <button
              key={code}
              onClick={() => {
                setBarcode(code);
                setProduct(null);
                setError(null);
              }}
              className="text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="font-mono text-sm text-blue-600">{code}</div>
              <div className="text-xs text-gray-500">{name}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
