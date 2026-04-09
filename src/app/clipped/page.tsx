"use client";

import { useClippedDeals } from "@/context/ClippedDealsContext";
import { CURRENCY_SYMBOLS } from "@/lib/types";
import { useShoppingList } from "@/context/ShoppingListContext";
import { useState } from "react";

export default function ClippedPage() {
  const { deals, unclipDeal, clearExpired, clearAll } = useClippedDeals();
  const { addItem } = useShoppingList();
  const [addedId, setAddedId] = useState<string | null>(null);

  const now = new Date().toISOString();
  const activeDeals = deals.filter((d) => !d.validUntil || d.validUntil >= now);
  const expiredDeals = deals.filter((d) => d.validUntil && d.validUntil < now);

  const totalSavings = activeDeals.length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">✂️ Clipped Deals</h1>
        <p className="text-gray-600">
          Your saved coupons and flyer deals — {activeDeals.length} active deal{activeDeals.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Actions */}
      {deals.length > 0 && (
        <div className="flex justify-center gap-3 mb-6">
          {expiredDeals.length > 0 && (
            <button
              onClick={clearExpired}
              className="px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg text-sm font-medium hover:bg-yellow-100 transition-colors"
            >
              🗑️ Remove Expired ({expiredDeals.length})
            </button>
          )}
          <button
            onClick={clearAll}
            className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
          >
            Clear All
          </button>
        </div>
      )}

      {/* No deals */}
      {deals.length === 0 && (
        <div className="text-center text-gray-400 py-16">
          <div className="text-5xl mb-4">✂️</div>
          <p className="text-lg">No clipped deals yet</p>
          <p className="text-sm mt-2">
            Search for products and click the ✂️ Clip button to save deals here
          </p>
        </div>
      )}

      {/* Active Deals */}
      {activeDeals.length > 0 && (
        <div className="space-y-3 mb-8">
          <h2 className="text-lg font-bold text-gray-800">🟢 Active Deals</h2>
          {activeDeals.map((deal) => (
            <div
              key={deal.id}
              className="bg-white rounded-xl border shadow-sm p-4 flex items-center gap-4"
            >
              {deal.thumbnail && (
                <img
                  src={deal.thumbnail}
                  alt={deal.productName}
                  className="w-14 h-14 rounded-lg object-cover"
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{deal.productName}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>{deal.storeLogo} {deal.storeName}</span>
                  {deal.validUntil && (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">
                      Ends {new Date(deal.validUntil).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-lg font-bold text-green-700">
                  {CURRENCY_SYMBOLS[deal.currency] || "$"}{deal.price.toFixed(2)}
                </div>
                <div className="text-xs text-gray-400">{deal.currency} / {deal.unit}</div>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <button
                  onClick={() => {
                    addItem(`clip-${deal.id}`, deal.productName);
                    setAddedId(deal.id);
                    setTimeout(() => setAddedId(null), 1500);
                  }}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    addedId === deal.id
                      ? "bg-green-100 text-green-700"
                      : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                  }`}
                >
                  {addedId === deal.id ? "✓ Added" : "🛒 Add to List"}
                </button>
                <button
                  onClick={() => unclipDeal(deal.id)}
                  className="px-2 py-1 bg-gray-50 text-gray-500 rounded text-xs font-medium hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  ✕ Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Expired Deals */}
      {expiredDeals.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-gray-400">⏰ Expired</h2>
          {expiredDeals.map((deal) => (
            <div
              key={deal.id}
              className="bg-gray-50 rounded-xl border border-gray-200 p-4 flex items-center gap-4 opacity-60"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-600 truncate">{deal.productName}</h3>
                <span className="text-sm text-gray-400">{deal.storeLogo} {deal.storeName}</span>
              </div>
              <span className="text-sm text-gray-400 line-through">
                {CURRENCY_SYMBOLS[deal.currency] || "$"}{deal.price.toFixed(2)}
              </span>
              <button
                onClick={() => unclipDeal(deal.id)}
                className="text-xs text-gray-400 hover:text-red-500"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
