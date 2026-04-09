"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { CURRENCY_SYMBOLS } from "@/lib/types";

function FlyerItemContent() {
  const params = useSearchParams();

  const store = params.get("store") || "Unknown Store";
  const product = params.get("product") || "Flyer Item";
  const price = params.get("price") || "";
  const currency = params.get("currency") || "CAD";
  const image = params.get("image") || "";
  const validFrom = params.get("from") || "";
  const validTo = params.get("to") || "";
  const unit = params.get("unit") || "each";
  const saleStory = params.get("sale") || "";
  const storeLogo = params.get("logo") || "";
  const flyerId = params.get("fid") || "";
  const itemId = params.get("iid") || "";
  const query = params.get("q") || "";

  const priceNum = parseFloat(price);
  const currSymbol = CURRENCY_SYMBOLS[currency] || "$";

  // Format dates
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

  const fromStr = formatDate(validFrom);
  const toStr = formatDate(validTo);

  // Check if deal is still valid
  const isExpired = validTo ? new Date(validTo) < new Date() : false;
  const daysLeft = validTo
    ? Math.max(0, Math.ceil((new Date(validTo).getTime() - Date.now()) / 86400000))
    : null;

  const flippUrl =
    flyerId && itemId
      ? `https://flipp.com/flyer/${flyerId}?item_id=${itemId}`
      : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Back nav */}
      <div className="mb-6">
        {query ? (
          <Link
            href={`/product/live-${encodeURIComponent(query)}`}
            className="text-blue-600 hover:underline text-sm"
          >
            ← Back to {query} prices
          </Link>
        ) : (
          <Link href="/" className="text-blue-600 hover:underline text-sm">
            ← Back to search
          </Link>
        )}
      </div>

      {/* Store header */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
          <div className="flex items-center gap-3">
            {storeLogo ? (
              <img
                src={storeLogo}
                alt={store}
                className="w-10 h-10 rounded-lg bg-white object-contain p-1"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <span className="text-3xl">📰</span>
            )}
            <div>
              <h1 className="text-xl font-bold text-white">{store}</h1>
              <p className="text-indigo-200 text-sm">Weekly Flyer Deal</p>
            </div>
          </div>
        </div>

        {/* Product image */}
        <div className="p-6">
          {image && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6 flex justify-center">
              <img
                src={image}
                alt={product}
                className="max-h-64 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).parentElement!.style.display =
                    "none";
                }}
              />
            </div>
          )}

          {/* Product name */}
          <h2 className="text-lg font-bold text-gray-900 mb-2">{product}</h2>

          {/* Sale story */}
          {saleStory && (
            <p className="text-sm text-orange-600 font-medium mb-4 bg-orange-50 px-3 py-1.5 rounded-lg inline-block">
              🏷️ {saleStory}
            </p>
          )}

          {/* Price */}
          {!isNaN(priceNum) && priceNum > 0 && (
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-3xl font-bold text-green-700">
                {currSymbol}
                {priceNum.toFixed(2)}
              </span>
              <span className="text-gray-500 text-sm">{currency}</span>
              {unit && unit !== "each" && (
                <span className="text-gray-500 text-sm">/ {unit}</span>
              )}
            </div>
          )}

          {/* Validity */}
          {(fromStr || toStr) && (
            <div
              className={`rounded-lg px-4 py-3 mb-4 ${
                isExpired
                  ? "bg-red-50 border border-red-200"
                  : "bg-green-50 border border-green-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{isExpired ? "⏰" : "✅"}</span>
                <div>
                  {isExpired ? (
                    <span className="text-red-700 text-sm font-medium">
                      This deal has expired
                    </span>
                  ) : (
                    <>
                      <span className="text-green-700 text-sm font-medium">
                        Valid: {fromStr} – {toStr}
                      </span>
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

          {/* Actions */}
          <div className="space-y-3 mt-6">
            {flippUrl && (
              <a
                href={flippUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center px-4 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
              >
                📰 View Full Flyer on Flipp
              </a>
            )}
            {query && (
              <Link
                href={`/product/live-${encodeURIComponent(query)}`}
                className="block w-full text-center px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                🔍 Compare Prices at Other Stores
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FlyerItemPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
          <p className="mt-3 text-gray-500">Loading flyer item...</p>
        </div>
      }
    >
      <FlyerItemContent />
    </Suspense>
  );
}
