"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import { useShoppingList } from "@/context/ShoppingListContext";
import { useTranslation } from "@/hooks/useTranslation";
import {
  generateBudgetList,
  GeneratedBudgetList,
  GeneratedListItem,
  BudgetCategory,
} from "@/lib/budget-data";
import { Product } from "@/lib/types";
import StoreRecommendation from "@/components/StoreRecommendation";

interface RealPrice {
  cheapest: number;
  productId: string;
  productName: string;
}

const CATEGORY_ORDER: BudgetCategory[] = [
  "protein",
  "grains",
  "produce",
  "dairy",
  "pantry",
  "frozen",
];

function groupByCategory(items: GeneratedListItem[]) {
  const groups = new Map<BudgetCategory, GeneratedListItem[]>();
  for (const entry of items) {
    const cat = entry.item.category;
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat)!.push(entry);
  }
  return CATEGORY_ORDER
    .filter((c) => groups.has(c))
    .map((c) => ({ category: c, items: groups.get(c)! }));
}

export default function BudgetPage() {
  const t = useTranslation();
  const locale = useLocale();
  const { addItem } = useShoppingList();

  const [budgetInput, setBudgetInput] = useState("");
  const [list, setList] = useState<GeneratedBudgetList | null>(null);
  const [addedMessage, setAddedMessage] = useState("");
  const [realPrices, setRealPrices] = useState<Record<string, RealPrice>>({});
  const [loadingPrices, setLoadingPrices] = useState(false);

  const fetchRealPrice = useCallback(
    async (itemId: string, itemName: string) => {
      try {
        const params = new URLSearchParams({ q: itemName });
        if (locale.countryCode) params.set("locale", locale.countryCode);
        const res = await fetch(`/api/search?${params.toString()}`);
        const data = await res.json();
        const products: Product[] = data.products || [];
        if (products.length === 0) return;
        const product = products[0];
        if (!product.prices || product.prices.length === 0) return;
        const cheapest = Math.min(...product.prices.map((p) => p.price));
        setRealPrices((prev) => ({
          ...prev,
          [itemId]: { cheapest, productId: product.id, productName: product.name },
        }));
      } catch {
        /* keep estimated */
      }
    },
    [locale.countryCode]
  );

  useEffect(() => {
    if (!list || locale.loading) return;
    setLoadingPrices(true);
    const allItems = [...list.essentials, ...list.premium];
    const unique = allItems.filter(
      (e, i, a) => a.findIndex((x) => x.item.id === e.item.id) === i
    );
    let cancelled = false;
    (async () => {
      for (let i = 0; i < unique.length; i += 3) {
        if (cancelled) break;
        await Promise.all(
          unique.slice(i, i + 3).map((e) => fetchRealPrice(e.item.id, e.item.name))
        );
      }
      if (!cancelled) setLoadingPrices(false);
    })();
    return () => { cancelled = true; };
  }, [list, locale.loading, fetchRealPrice]);

  // Re-optimize: when real prices arrive and total drops, increase quantities to fill budget
  useEffect(() => {
    if (!list || loadingPrices) return;
    const priceKeys = Object.keys(realPrices);
    if (priceKeys.length === 0) return;

    const getPrice = (e: GeneratedListItem) => {
      const r = realPrices[e.item.id];
      return r ? r.cheapest : e.localPrice;
    };

    const currentTotal = [...list.essentials, ...list.premium].reduce(
      (s, e) => s + getPrice(e) * e.quantity, 0
    );
    let gap = list.budget - currentTotal;
    if (gap < 1) return; // less than $1 left, no point

    // Clone the list items so we can bump quantities
    const newEssentials = list.essentials.map((e) => ({ ...e }));
    const newPremium = list.premium.map((e) => ({ ...e }));
    const MAX_QTY = 4; // reasonable weekly max per item

    // Spread budget across all items in rounds (1 extra per item per round)
    let changed = true;
    while (changed && gap >= 1) {
      changed = false;
      // Premium first
      for (const entry of newPremium) {
        const p = getPrice(entry);
        if (p > 0 && p <= gap && entry.quantity < MAX_QTY) {
          entry.quantity += 1;
          gap -= p;
          changed = true;
        }
      }
      // Then essentials
      for (const entry of newEssentials) {
        const p = getPrice(entry);
        if (p > 0 && p <= gap && entry.quantity < MAX_QTY) {
          entry.quantity += 1;
          gap -= p;
          changed = true;
        }
      }
    }

    // Only update if we actually changed something
    const newTotal = [...newEssentials, ...newPremium].reduce(
      (s, e) => s + getPrice(e) * e.quantity, 0
    );
    if (newTotal > currentTotal + 0.5) {
      setList((prev) =>
        prev
          ? {
              ...prev,
              essentials: newEssentials,
              premium: newPremium,
              essentialsCost: Math.round(newEssentials.reduce((s, e) => s + getPrice(e) * e.quantity, 0) * 100) / 100,
              premiumCost: Math.round(newPremium.reduce((s, e) => s + getPrice(e) * e.quantity, 0) * 100) / 100,
              totalCost: Math.round(newTotal * 100) / 100,
            }
          : prev
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingPrices]);

  function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(budgetInput);
    if (!amount || amount <= 0) return;
    setRealPrices({});
    setList(generateBudgetList(amount, locale.currency, locale.symbol));
    setAddedMessage("");
  }

  function handleRegenerate() {
    const amount = parseFloat(budgetInput);
    if (!amount || amount <= 0) return;
    setRealPrices({});
    setList(generateBudgetList(amount, locale.currency, locale.symbol));
    setAddedMessage("");
  }

  function handleAddAllToList() {
    if (!list) return;
    let count = 0;
    for (const entry of [...list.essentials, ...list.premium]) {
      const real = realPrices[entry.item.id];
      const id = real ? real.productId : entry.item.id;
      const name = real ? real.productName : entry.item.name;
      for (let i = 0; i < entry.quantity; i++) { addItem(id, name); count++; }
    }
    setAddedMessage(t("budget.addedAll", { count }));
  }

  const groupedEss = useMemo(() => list ? groupByCategory(list.essentials) : null, [list]);
  const groupedPrem = useMemo(() => list ? groupByCategory(list.premium) : null, [list]);

  const storeRecItems = useMemo(() => {
    if (!list) return [];
    return [...list.essentials, ...list.premium].map((e) => ({
      name: e.item.name,
      quantity: e.quantity,
    }));
  }, [list]);

  const calcTotal = useCallback(
    (items: GeneratedListItem[]) =>
      items.reduce((s, e) => {
        const r = realPrices[e.item.id];
        return s + (r ? r.cheapest : e.localPrice) * e.quantity;
      }, 0),
    [realPrices]
  );

  const hasReal = Object.keys(realPrices).length > 0;
  const essTotal = list ? (hasReal ? calcTotal(list.essentials) : list.essentialsCost) : 0;
  const premTotal = list ? (hasReal ? calcTotal(list.premium) : list.premiumCost) : 0;
  const displayTotal = Math.round((essTotal + premTotal) * 100) / 100;
  const remaining = list ? Math.round((list.budget - displayTotal) * 100) / 100 : 0;
  const isOver = remaining < 0;
  const totalItems = list
    ? list.essentials.reduce((s, e) => s + e.quantity, 0) + list.premium.reduce((s, e) => s + e.quantity, 0)
    : 0;

  function ItemRow({ entry }: { entry: GeneratedListItem }) {
    const real = realPrices[entry.item.id];
    const price = real ? real.cheapest : entry.localPrice;
    const href = real
      ? `/product/${encodeURIComponent(real.productId)}`
      : `/?q=${encodeURIComponent(entry.item.name)}`;
    const isLd = !real && loadingPrices;
    const upgName = entry.item.upgradeOf
      ? list?.essentials.find((e) => e.item.id === entry.item.upgradeOf)?.item.name
      : null;

    return (
      <li>
        <Link href={href} className="px-5 py-3 flex items-center gap-3 hover:bg-blue-50 transition-colors group">
          <span className="text-2xl">{entry.item.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate group-hover:text-blue-600">
              {real ? real.productName : entry.item.name}
              <span className="ml-1 text-blue-500 opacity-0 group-hover:opacity-100 text-xs transition-opacity">↗</span>
            </p>
            <p className="text-xs text-gray-500">
              {t("budget.perUnit", { symbol: locale.symbol, price: price.toFixed(2), unit: entry.item.unit })}
              {real && real.cheapest < entry.localPrice && (
                <span className="ml-2 text-green-600 font-medium">
                  ↓ {locale.symbol}{(entry.localPrice - real.cheapest).toFixed(2)} cheaper
                </span>
              )}
              {isLd && <span className="ml-2 inline-block w-2.5 h-2.5 border border-gray-400 border-t-transparent rounded-full animate-spin align-middle" />}
            </p>
            {upgName && (
              <p className="text-xs text-purple-500 mt-0.5">⬆ {t("budget.upgradeOf", { name: upgName })}</p>
            )}
          </div>
          {entry.quantity > 1 && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">×{entry.quantity}</span>
          )}
          <span className="font-semibold text-gray-900 w-24 text-right">
            {locale.symbol}{(price * entry.quantity).toFixed(2)}
          </span>
        </Link>
      </li>
    );
  }

  function CatGroup({ category, items }: { category: BudgetCategory; items: GeneratedListItem[] }) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="bg-gray-50 px-5 py-3 border-b">
          <h3 className="font-semibold text-gray-800">{t(`budget.category.${category}`)}</h3>
        </div>
        <ul className="divide-y divide-gray-100">
          {items.map((e) => <ItemRow key={e.item.id} entry={e} />)}
        </ul>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🥗 {t("budget.title")}</h1>
        <p className="text-gray-600">{t("budget.subtitle")}</p>
      </div>

      <form onSubmit={handleGenerate} className="mb-8 max-w-xl mx-auto">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t("budget.inputLabel")} ({locale.symbol} {locale.currency})
        </label>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">{locale.symbol}</span>
            <input
              type="number" min="1" step="any"
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
              placeholder={t("budget.inputPlaceholder")}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button type="submit" disabled={!budgetInput || parseFloat(budgetInput) <= 0}
            className="px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {t("budget.generate")}
          </button>
        </div>
      </form>

      {!list && (
        <div className="text-center text-gray-400 py-16">
          <div className="text-5xl mb-4">🛒</div>
          <p>{t("budget.empty")}</p>
        </div>
      )}

      {list && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-white rounded-2xl shadow-sm border p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <span className="text-sm font-medium text-gray-500">
                {t("budget.weeklyBudget", { symbol: locale.symbol, amount: list.budget.toFixed(2) })}
              </span>
              <span className="text-sm font-medium text-gray-500">
                {t("budget.itemCount", { count: totalItems })}
                {loadingPrices && <span className="ml-2 inline-block w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />}
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-3 mb-3 flex overflow-hidden">
              <div className="h-3 bg-green-500 transition-all" style={{ width: `${Math.min((essTotal / list.budget) * 100, 100)}%` }} />
              {premTotal > 0 && (
                <div className="h-3 bg-purple-500 transition-all" style={{ width: `${Math.min((premTotal / list.budget) * 100, 100 - (essTotal / list.budget) * 100)}%` }} />
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-lg font-bold text-gray-900">
                  {t("budget.totalCost", { symbol: locale.symbol, amount: displayTotal.toFixed(2) })}
                </span>
                <span className="text-xs text-gray-400">|</span>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  {t("budget.essentialsCost", { symbol: locale.symbol, amount: essTotal.toFixed(2) })}
                </span>
                {premTotal > 0 && (
                  <>
                    <span className="text-xs text-gray-400">+</span>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-600">
                      <span className="w-2 h-2 bg-purple-500 rounded-full" />
                      {t("budget.premiumCost", { symbol: locale.symbol, amount: premTotal.toFixed(2) })}
                    </span>
                  </>
                )}
              </div>
              <span className={`text-sm font-semibold ${isOver ? "text-red-600" : "text-green-600"}`}>
                {isOver
                  ? t("budget.overBudget", { symbol: locale.symbol, amount: Math.abs(remaining).toFixed(2) })
                  : t("budget.remaining", { symbol: locale.symbol, amount: remaining.toFixed(2) })}
              </span>
            </div>
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Essentials */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-full" />
                <h2 className="text-lg font-bold text-gray-900">{t("budget.essentials")}</h2>
              </div>
              <p className="text-sm text-gray-500 -mt-2">{t("budget.essentialsDesc")}</p>
              {groupedEss?.map(({ category, items }) => (
                <CatGroup key={category} category={category} items={items} />
              ))}
            </div>

            {/* Premium */}
            {list.premium.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-purple-500 rounded-full" />
                  <h2 className="text-lg font-bold text-gray-900">{t("budget.premiumUpgrades")}</h2>
                </div>
                <p className="text-sm text-gray-500 -mt-2">{t("budget.premiumDesc")}</p>
                {groupedPrem?.map(({ category, items }) => (
                  <CatGroup key={`p-${category}`} category={category} items={items} />
                ))}
              </div>
            )}
          </div>

          {/* Tip */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
            <span className="text-xl">💡</span>
            <div>
              <span className="font-semibold text-amber-800">{t("budget.tip")}:</span>{" "}
              <span className="text-amber-700">{t(list.tip)}</span>
            </div>
          </div>

          {/* Store Recommendation */}
          {storeRecItems.length > 0 && (
            <StoreRecommendation items={storeRecItems} />
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button onClick={handleAddAllToList}
              className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors">
              🛒 {t("budget.addAllToList")}
            </button>
            <button onClick={handleRegenerate}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors">
              🔄 {t("budget.regenerate")}
            </button>
          </div>

          {addedMessage && (
            <div className="text-center text-green-600 font-medium py-2 bg-green-50 rounded-xl">
              ✅ {addedMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
