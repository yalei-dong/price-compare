"use client";

import { useState, useMemo } from "react";
import { useLocale } from "@/context/LocaleContext";
import { useTranslation } from "@/hooks/useTranslation";
import {
  getStoresForLocale,
  FlyerCountry,
  StoreFlyer,
  COUNTRY_NAMES,
  TYPE_LABELS,
} from "@/lib/flyer-data";

export default function FlyersPage() {
  const t = useTranslation();
  const locale = useLocale();

  const data = useMemo(
    () => getStoresForLocale(locale.countryCode),
    [locale.countryCode]
  );

  const [activeCountry, setActiveCountry] = useState<FlyerCountry>(data.country);
  const [filterType, setFilterType] = useState<string>("all");

  const allCountries: { code: FlyerCountry; stores: StoreFlyer[] }[] = useMemo(() => {
    const list = [{ code: data.country, stores: data.stores }];
    for (const o of data.otherCountries) {
      list.push({ code: o.country, stores: o.stores });
    }
    return list;
  }, [data]);

  const currentStores = useMemo(() => {
    const entry = allCountries.find((c) => c.code === activeCountry);
    const stores = entry?.stores || [];
    if (filterType === "all") return stores;
    return stores.filter((s) => s.type === filterType);
  }, [allCountries, activeCountry, filterType]);

  const storeTypes = useMemo(() => {
    const entry = allCountries.find((c) => c.code === activeCountry);
    const types = new Set((entry?.stores || []).map((s) => s.type));
    return ["all", ...Array.from(types)] as string[];
  }, [allCountries, activeCountry]);

  const typeColor: Record<string, string> = {
    grocery: "bg-green-100 text-green-700",
    warehouse: "bg-blue-100 text-blue-700",
    pharmacy: "bg-purple-100 text-purple-700",
    discount: "bg-yellow-100 text-yellow-700",
    general: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          📰 {t("flyers.title")}
        </h1>
        <p className="text-gray-600">{t("flyers.subtitle")}</p>
      </div>

      {/* Country tabs */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {allCountries.map(({ code }) => (
          <button
            key={code}
            onClick={() => { setActiveCountry(code); setFilterType("all"); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeCountry === code
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-white border border-gray-200 text-gray-700 hover:border-indigo-300"
            }`}
          >
            {t(COUNTRY_NAMES[code])}
            <span className="ml-1 text-xs opacity-70">
              ({allCountries.find((c) => c.code === code)?.stores.length})
            </span>
          </button>
        ))}
      </div>

      {/* Type filter */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {storeTypes.map((tp) => (
          <button
            key={tp}
            onClick={() => setFilterType(tp)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterType === tp
                ? "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300"
                : "bg-gray-50 text-gray-500 hover:bg-gray-100"
            }`}
          >
            {tp === "all" ? t("flyers.allTypes") : t(TYPE_LABELS[tp as StoreFlyer["type"]])}
          </button>
        ))}
      </div>

      {/* Store grid */}
      {currentStores.length === 0 ? (
        <div className="text-center text-gray-400 py-16">
          <div className="text-4xl mb-3">📭</div>
          <p>{t("flyers.noStores")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentStores.map((store) => (
            <a
              key={store.name}
              href={store.flyerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white rounded-2xl border shadow-sm hover:shadow-lg hover:border-indigo-300 transition-all overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{store.logo}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                      {store.name}
                    </h3>
                    <span
                      className={`inline-block text-xs px-2 py-0.5 rounded-full mt-1 ${
                        typeColor[store.type] || "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {t(TYPE_LABELS[store.type])}
                    </span>
                  </div>
                  <span className="text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity text-lg">
                    ↗
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-indigo-600 font-medium group-hover:underline">
                    {t("flyers.viewFlyer")} →
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Info banner */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <span className="text-xl">ℹ️</span>
        <div>
          <span className="text-blue-800 text-sm">{t("flyers.info")}</span>
        </div>
      </div>
    </div>
  );
}
