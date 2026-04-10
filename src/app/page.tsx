"use client";

import { useState, useEffect } from "react";
import SearchFilters from "@/components/SearchFilters";
import ProductCard from "@/components/ProductCard";
import { useShoppingList } from "@/context/ShoppingListContext";
import { useLocale } from "@/context/LocaleContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Product } from "@/lib/types";

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [storeType, setStoreType] = useState("all");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const { addItem } = useShoppingList();
  const locale = useLocale();
  const t = useTranslation();

  const HISTORY_KEY = "price-compare-search-history";
  const MAX_HISTORY = 12;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      if (saved) setSearchHistory(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  function saveToHistory(term: string) {
    const trimmed = term.trim();
    if (!trimmed) return;
    setSearchHistory((prev) => {
      const updated = [trimmed, ...prev.filter((h) => h.toLowerCase() !== trimmed.toLowerCase())].slice(0, MAX_HISTORY);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  }

  function clearHistory() {
    setSearchHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  }

  useEffect(() => {
    if (!locale.loading) fetchProducts();
  }, [locale.loading]);

  useEffect(() => {
    if (!locale.loading) fetchProducts();
  }, [category, storeType]);

  async function fetchProducts() {
    setLoading(true);
    if (query.trim()) saveToHistory(query);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (category !== "all") params.set("category", category);
      if (storeType !== "all") params.set("storeType", storeType);
      if (locale.countryCode) params.set("locale", locale.countryCode);
      if (locale.city) params.set("city", locale.city);

      const res = await fetch(`/api/search?${params.toString()}`);
      const data = await res.json();
      setProducts(data.products);
      setCategories(data.categories);
      setSearched(true);
    } catch (err) {
      console.error("Failed to search:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
      {/* Hero - compact on mobile */}
      <div className="text-center mb-4 sm:mb-8">
        <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">
          {t("home.title")}
        </h1>
        <p className="text-gray-500 text-xs sm:text-lg max-w-2xl mx-auto">
          {t("home.subtitle")}
        </p>
        {!locale.loading && locale.label && (
          <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-blue-600 font-medium">
            📍 {t("home.showingPrices", { label: locale.label, symbol: locale.symbol, currency: locale.currency })}
          </p>
        )}
      </div>

      {/* Search area */}
      <SearchFilters
        query={query}
        onQueryChange={setQuery}
        category={category}
        onCategoryChange={setCategory}
        storeType={storeType}
        onStoreTypeChange={setStoreType}
        categories={categories}
        onSearch={fetchProducts}
      />

      {/* Category pills */}
      {categories.length > 0 && (
        <div className="flex flex-nowrap sm:flex-wrap justify-start sm:justify-center gap-2 mb-5 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-hide">
          {["all", ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                category === cat
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {cat === "all" ? t("home.all") : cat}
            </button>
          ))}
        </div>
      )}

      {/* Quick search suggestions when idle */}
      {!searched && !loading && (
        <div className="mt-2 sm:mt-6 space-y-6">
          {searchHistory.length > 0 && (
            <div>
              <div className="flex items-center justify-center gap-2 mb-3">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Recent searches</p>
                <button
                  onClick={clearHistory}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                  title="Clear history"
                >
                  ✕
                </button>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {searchHistory.map((term) => (
                  <button
                    key={term}
                    onClick={() => {
                      setQuery(term);
                      setTimeout(() => fetchProducts(), 100);
                    }}
                    className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-sm text-blue-700 hover:border-blue-400 hover:bg-blue-100 transition-colors shadow-sm"
                  >
                    🕒 {term}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-3 text-center">Popular searches</p>
            <div className="flex flex-wrap justify-center gap-2">
              {["Milk", "Eggs", "Bread", "Chicken", "Rice", "Apples"].map((term) => (
                <button
                  key={term}
                  onClick={() => {
                    setQuery(term);
                    setTimeout(() => fetchProducts(), 100);
                  }}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-colors shadow-sm"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-3 text-gray-500">{t("home.searching")}</p>
        </div>
      ) : products.length > 0 ? (
        <>
          <div className="mb-4">
            <p className="text-sm sm:text-base text-gray-600">
              <span className="font-semibold text-gray-900">{products.length}</span> {t("home.productsFound", { count: products.length })}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} onAddToList={addItem} />
            ))}
          </div>
        </>
      ) : searched ? (
        <div className="text-center py-12">
          <span className="text-5xl mb-4 block">🔍</span>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">{t("home.noResults")}</h3>
          <p className="text-gray-500">{t("home.searchHint")}</p>
        </div>
      ) : null}
    </div>
  );
}
