"use client";

import { useState, useRef, useCallback } from "react";
import Tesseract from "tesseract.js";
import { useTranslation } from "@/hooks/useTranslation";
import VoiceSearch from "./VoiceSearch";

interface SearchFiltersProps {
  query: string;
  onQueryChange: (q: string) => void;
  category: string;
  onCategoryChange: (c: string) => void;
  storeType: string;
  onStoreTypeChange: (s: string) => void;
  categories: string[];
  onSearch: () => void;
}

export default function SearchFilters({
  query,
  onQueryChange,
  category,
  onCategoryChange,
  storeType,
  onStoreTypeChange,
  categories,
  onSearch,
}: SearchFiltersProps) {
  const t = useTranslation();
  const imgRef = useRef<HTMLInputElement>(null);
  const [imgScanning, setImgScanning] = useState(false);

  const handleImageSearch = useCallback(
    async (file: File) => {
      setImgScanning(true);
      try {
        const url = URL.createObjectURL(file);
        const result = await Tesseract.recognize(url, "eng");
        URL.revokeObjectURL(url);
        const raw = result.data.text.trim();

        // Extract the most product-like line: skip short noise, pick the longest meaningful line
        const lines = raw
          .split(/\n/)
          .map((l) => l.trim())
          .filter((l) => l.length > 2 && !/^[\d\s$.,]+$/.test(l));

        // Try to find a product name — prefer lines that look like product labels
        let best = lines[0] || raw.slice(0, 60);
        for (const line of lines) {
          // Prefer lines with letters, not just numbers/symbols
          if (/[a-zA-Z]{3,}/.test(line) && line.length > best.length && line.length < 80) {
            best = line;
          }
        }

        // Clean up: remove leading/trailing special chars
        best = best.replace(/^[^a-zA-Z0-9]+/, "").replace(/[^a-zA-Z0-9]+$/, "").trim();

        if (best) {
          onQueryChange(best);
          // Auto-search after a short delay so user sees the query
          setTimeout(() => onSearch(), 300);
        }
      } catch (err) {
        console.error("Image OCR failed:", err);
      } finally {
        setImgScanning(false);
        // Reset file input so same file can be re-selected
        if (imgRef.current) imgRef.current.value = "";
      }
    },
    [onQueryChange, onSearch]
  );

  const STORE_TYPES = [
    { value: "all", label: t("filter.allStores") },
    { value: "online", label: t("filter.onlineOnly") },
    { value: "local", label: t("filter.inStoreOnly") },
    { value: "both", label: t("filter.inStoreAndOnline") },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-3 sm:p-4 mb-5 space-y-3" suppressHydrationWarning>
      {/* Search Bar */}
      <div className="flex gap-2" suppressHydrationWarning>
        <div className="flex-1 flex items-center border border-gray-200 rounded-xl bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent focus-within:bg-white transition-colors overflow-hidden">
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
            placeholder={t("filter.placeholder")}
            className="flex-1 min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 bg-transparent text-gray-800 placeholder-gray-400 text-sm sm:text-base outline-none"
            suppressHydrationWarning
          />
          {/* Image search */}
          <button
            onClick={() => imgRef.current?.click()}
            disabled={imgScanning}
            className={`px-2 py-2 transition-colors text-base flex-shrink-0 ${
              imgScanning
                ? "text-yellow-500 animate-pulse"
                : "text-gray-400 hover:text-gray-600"
            }`}
            title={t("filter.imageSearch")}
            suppressHydrationWarning
          >
            {imgScanning ? "⏳" : "📷"}
          </button>
        </div>
        <input
          ref={imgRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageSearch(file);
          }}
        />
        <VoiceSearch onResult={onQueryChange} onSearch={onSearch} />
        <button
          onClick={onSearch}
          className="px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-colors font-semibold text-sm sm:text-base whitespace-nowrap shadow-sm"
        >
          <span className="hidden sm:inline">{t("filter.search")}</span>
          <span className="sm:hidden">Search</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-2 sm:flex sm:flex-row sm:flex-wrap gap-2 sm:gap-3">
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors appearance-none"
        >
          <option value="all">{t("filter.allCategories")}</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={storeType}
          onChange={(e) => onStoreTypeChange(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors appearance-none"
        >
          {STORE_TYPES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
