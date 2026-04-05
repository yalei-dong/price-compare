"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import { useShoppingList } from "@/context/ShoppingListContext";
import { useTranslation } from "@/hooks/useTranslation";
import {
  getTemplates,
  generatePartyList,
  GeneratedPartyList,
  GeneratedPartyItem,
  PartyCategory,
  PartyType,
  CATEGORY_ORDER,
  getCategoryLabel,
} from "@/lib/party-data";
import { Product } from "@/lib/types";

interface RealPrice {
  cheapest: number;
  productId: string;
  productName: string;
}

export default function PartyPage() {
  const t = useTranslation();
  const locale = useLocale();
  const { addItem } = useShoppingList();
  const templates = getTemplates();

  const [selectedType, setSelectedType] = useState<PartyType>("bbq");
  const [guestInput, setGuestInput] = useState("");
  const [daysInput, setDaysInput] = useState("");
  const [list, setList] = useState<GeneratedPartyList | null>(null);
  const [addedMsg, setAddedMsg] = useState("");
  const [realPrices, setRealPrices] = useState<Record<string, RealPrice>>({});
  const [loadingPrices, setLoadingPrices] = useState(false);

  const fetchRealPrice = useCallback(
    async (itemName: string) => {
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
          [itemName]: { cheapest, productId: product.id, productName: product.name },
        }));
      } catch {
        /* keep estimate */
      }
    },
    [locale.countryCode]
  );

  useEffect(() => {
    if (!list || locale.loading) return;
    setLoadingPrices(true);
    let cancelled = false;
    (async () => {
      const names = [...new Set(list.items.map((i) => i.item.name))];
      for (let i = 0; i < names.length; i += 3) {
        if (cancelled) break;
        await Promise.all(names.slice(i, i + 3).map((n) => fetchRealPrice(n)));
      }
      if (!cancelled) setLoadingPrices(false);
    })();
    return () => { cancelled = true; };
  }, [list, locale.loading, fetchRealPrice]);

  function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    const guests = parseInt(guestInput, 10);
    if (!guests || guests < 1) return;
    const days = tmpl.multiDay ? Math.max(1, parseInt(daysInput, 10) || 1) : 1;
    setRealPrices({});
    setAddedMsg("");
    setList(generatePartyList(selectedType, guests, locale.currency, locale.symbol, days));
  }

  function handleAddAll() {
    if (!list) return;
    let count = 0;
    for (const entry of list.items) {
      const real = realPrices[entry.item.name];
      const id = real ? real.productId : `party-${entry.item.name}`;
      const name = real ? real.productName : entry.item.name;
      for (let i = 0; i < entry.quantity; i++) { addItem(id, name); count++; }
    }
    setAddedMsg(t("party.addedAll", { count }));
  }

  const grouped = useMemo(() => {
    if (!list) return null;
    const map = new Map<PartyCategory, GeneratedPartyItem[]>();
    for (const entry of list.items) {
      const c = entry.item.category;
      if (!map.has(c)) map.set(c, []);
      map.get(c)!.push(entry);
    }
    return CATEGORY_ORDER.filter((c) => map.has(c)).map((c) => ({ category: c, items: map.get(c)! }));
  }, [list]);

  const realTotal = useMemo(() => {
    if (!list) return 0;
    return list.items.reduce((s, e) => {
      const r = realPrices[e.item.name];
      return s + (r ? r.cheapest : e.localPrice) * e.quantity;
    }, 0);
  }, [list, realPrices]);

  const hasReal = Object.keys(realPrices).length > 0;
  const displayTotal = hasReal ? Math.round(realTotal * 100) / 100 : list?.totalEstimate ?? 0;
  const totalItems = list ? list.items.reduce((s, e) => s + e.quantity, 0) : 0;

  const tmpl = templates.find((t) => t.id === selectedType)!;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🎉 {t("party.title")}</h1>
        <p className="text-gray-600">{t("party.subtitle")}</p>
      </div>

      {/* Event type selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-6">
        {templates.map((tp) => (
          <button
            key={tp.id}
            onClick={() => setSelectedType(tp.id)}
            className={`p-3 rounded-xl border-2 text-center transition-all ${
              selectedType === tp.id
                ? "border-indigo-500 bg-indigo-50 shadow-md"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <div className="text-2xl mb-1">{tp.emoji}</div>
            <div className="text-xs font-semibold text-gray-800">{t(tp.nameKey)}</div>
          </button>
        ))}
      </div>

      <p className="text-sm text-gray-500 text-center mb-4">{t(tmpl.descKey)}</p>

      {/* Guest count + optional days */}
      <form onSubmit={handleGenerate} className="mb-8 max-w-lg mx-auto">
        <div className="flex gap-4 mb-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("party.guestLabel")}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">👥</span>
              <input
                type="number" min="1" max="500"
                value={guestInput}
                onChange={(e) => setGuestInput(e.target.value)}
                placeholder={t("party.guestPlaceholder")}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          {tmpl.multiDay && (
            <div className="w-32">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("party.daysLabel")}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">📅</span>
                <input
                  type="number" min="1" max="30"
                  value={daysInput}
                  onChange={(e) => setDaysInput(e.target.value)}
                  placeholder="5"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={!guestInput || parseInt(guestInput, 10) < 1}
          className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {t("party.generate")}
        </button>
      </form>

      {!list && (
        <div className="text-center text-gray-400 py-16">
          <div className="text-5xl mb-4">{tmpl.emoji}</div>
          <p>{t("party.empty")}</p>
        </div>
      )}

      {list && grouped && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-white rounded-2xl shadow-sm border p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
              <span className="text-sm font-medium text-gray-500">
                {tmpl.emoji} {t(tmpl.nameKey)} — {list.guests} {t("party.guests")}
                {list.days > 1 && ` · ${list.days} ${t("party.days")}`}
              </span>
              <span className="text-sm font-medium text-gray-500">
                {t("party.itemCount", { count: totalItems })}
                {loadingPrices && (
                  <span className="ml-2 inline-block w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                )}
              </span>
            </div>
            <div className="text-lg font-bold text-gray-900">
              {t("party.estimated", { symbol: locale.symbol, amount: displayTotal.toFixed(2) })}
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({locale.symbol}{(displayTotal / list.guests).toFixed(2)} / {t("party.perPerson")}
                {list.days > 1 && ` · ${locale.symbol}${(displayTotal / list.days).toFixed(2)} / ${t("party.perDay")}`})
              </span>
            </div>
          </div>

          {/* Items by category */}
          {grouped.map(({ category, items }) => (
            <div key={category} className="bg-white rounded-2xl shadow-sm border overflow-hidden">
              <div className="bg-gray-50 px-5 py-3 border-b">
                <h2 className="font-semibold text-gray-800">{t(getCategoryLabel(category))}</h2>
              </div>
              <ul className="divide-y divide-gray-100">
                {items.map((entry) => {
                  const real = realPrices[entry.item.name];
                  const price = real ? real.cheapest : entry.localPrice;
                  const href = real
                    ? `/product/${encodeURIComponent(real.productId)}`
                    : `/?q=${encodeURIComponent(entry.item.name)}`;
                  const isLd = !real && loadingPrices;

                  return (
                    <li key={entry.item.name}>
                      <Link
                        href={href}
                        className="px-5 py-3 flex items-center gap-3 hover:bg-indigo-50 transition-colors group"
                      >
                        <span className="text-2xl">{entry.item.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate group-hover:text-indigo-600">
                            {real ? real.productName : entry.item.name}
                            <span className="ml-1 text-indigo-500 opacity-0 group-hover:opacity-100 text-xs transition-opacity">↗</span>
                          </p>
                          <p className="text-xs text-gray-500">
                            {locale.symbol}{price.toFixed(2)} / {entry.item.unit}
                            {real && real.cheapest < entry.localPrice && (
                              <span className="ml-2 text-green-600 font-medium">
                                ↓ {locale.symbol}{(entry.localPrice - real.cheapest).toFixed(2)} cheaper
                              </span>
                            )}
                            {isLd && <span className="ml-2 inline-block w-2.5 h-2.5 border border-gray-400 border-t-transparent rounded-full animate-spin align-middle" />}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                          ×{entry.quantity}
                        </span>
                        <span className="font-semibold text-gray-900 w-24 text-right">
                          {locale.symbol}{(price * entry.quantity).toFixed(2)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {/* Tip */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex gap-3">
            <span className="text-xl">💡</span>
            <span className="text-indigo-700">{t("party.tip")}</span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button onClick={handleAddAll}
              className="flex-1 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
              🛒 {t("party.addAllToList")}
            </button>
            <button onClick={() => { setRealPrices({}); setList(generatePartyList(selectedType, list.guests, locale.currency, locale.symbol, list.days)); setAddedMsg(""); }}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors">
              🔄 {t("party.regenerate")}
            </button>
          </div>

          {addedMsg && (
            <div className="text-center text-green-600 font-medium py-2 bg-green-50 rounded-xl">
              ✅ {addedMsg}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
