"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { parseReceipt, ParsedReceipt, ReceiptItem } from "@/lib/receipt-parser";
import {
  saveReceipt,
  getBestPrices,
  getReceipts,
  getItemComparison,
  deleteReceipt,
  Receipt,
} from "@/lib/receipt-db";

type MainTab = "scan" | "items" | "receipts";
type Step = "upload" | "scanning" | "review" | "saved";

export default function ReceiptsPage() {
  const t = useTranslation();
  const [mainTab, setMainTab] = useState<MainTab>("items");
  const [refreshKey, setRefreshKey] = useState(0);

  // ── Scan state ──
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [progress, setProgress] = useState(0);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedReceipt | null>(null);
  const [editItems, setEditItems] = useState<ReceiptItem[]>([]);
  const [storeName, setStoreName] = useState("");
  const [receiptDate, setReceiptDate] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ── My Prices state ──
  const [search, setSearch] = useState("");
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  useEffect(() => {
    setReceipts(getReceipts());
  }, [refreshKey]);

  const bestPrices = useMemo(() => getBestPrices(), [refreshKey]);

  const filtered = useMemo(() => {
    if (!search.trim()) return bestPrices;
    const q = search.toLowerCase();
    return bestPrices.filter(
      (p) =>
        p.normalizedName.includes(q) ||
        p.bestRecord.itemName.toLowerCase().includes(q)
    );
  }, [bestPrices, search]);

  const handleDeleteReceipt = (id: string) => {
    deleteReceipt(id);
    setRefreshKey((k) => k + 1);
  };

  const totalItems = bestPrices.length;
  const totalReceipts = receipts.length;
  const storesTracked = new Set(receipts.map((r) => r.storeName)).size;

  // ── Scan handlers ──
  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setStep("scanning");
      setProgress(0);
      const url = URL.createObjectURL(file);
      setImageUrl(url);

      try {
        const Tesseract = (await import("tesseract.js")).default;
        const result = await Tesseract.recognize(file, "eng", {
          logger: (m: { status: string; progress: number }) => {
            if (m.status === "recognizing text") {
              setProgress(Math.round(m.progress * 100));
            }
          },
        });

        const rawText = result.data.text;
        const receipt = parseReceipt(rawText);

        setParsed(receipt);
        setEditItems(receipt.items.map((i) => ({ ...i })));
        setStoreName(receipt.storeName);
        setReceiptDate(receipt.date);
        setStep("review");
      } catch (err) {
        console.error("OCR failed:", err);
        setError(t("receipt.ocrFailed"));
        setStep("upload");
      }
    },
    [t]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) handleFile(file);
    },
    [handleFile]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData.items;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) handleFile(file);
          break;
        }
      }
    },
    [handleFile]
  );

  const updateItem = (idx: number, field: keyof ReceiptItem, value: string | number) => {
    setEditItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };

  const removeItem = (idx: number) => {
    setEditItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const addItem = () => {
    setEditItems((prev) => [...prev, { name: "", price: 0, quantity: 1 }]);
  };

  const handleSave = () => {
    const validItems = editItems.filter((i) => i.name.trim() && i.price > 0);
    if (validItems.length === 0) return;
    const total = parsed?.total ?? null;
    const id = saveReceipt(storeName, receiptDate, validItems, total);
    setSavedId(id);
    setStep("saved");
    setRefreshKey((k) => k + 1);
  };

  const resetAll = () => {
    setStep("upload");
    setProgress(0);
    setImageUrl(null);
    setParsed(null);
    setEditItems([]);
    setStoreName("");
    setReceiptDate("");
    setSavedId(null);
    setError(null);
  };

  const itemTotal = editItems
    .filter((i) => i.price > 0)
    .reduce((s, i) => s + i.price, 0);

  const TABS: { key: MainTab; icon: string; labelKey: string }[] = [
    { key: "scan", icon: "🧾", labelKey: "receipt.title" },
    { key: "items", icon: "🏷️", labelKey: "myPrices.tabItems" },
    { key: "receipts", icon: "📋", labelKey: "myPrices.tabReceipts" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6" onPaste={handlePaste}>
      {/* Header */}
      <h1 className="text-3xl font-bold text-gray-900 mb-1">
        🧾 {t("receipt.pageTitle")}
      </h1>
      <p className="text-gray-600 mb-4">{t("receipt.pageSubtitle")}</p>

      {/* Stats */}
      {totalReceipts > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-blue-700">{totalItems}</div>
            <div className="text-xs text-blue-600">{t("myPrices.uniqueItems")}</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-green-700">{totalReceipts}</div>
            <div className="text-xs text-green-600">{t("myPrices.receipts")}</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-purple-700">{storesTracked}</div>
            <div className="text-xs text-purple-600">{t("myPrices.stores")}</div>
          </div>
        </div>
      )}

      {/* Main tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1">
        {TABS.map((tb) => (
          <button
            key={tb.key}
            onClick={() => setMainTab(tb.key)}
            className={`flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
              mainTab === tb.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tb.icon} {t(tb.labelKey)}
          </button>
        ))}
      </div>

      {/* ══════════════ SCAN TAB ══════════════ */}
      {mainTab === "scan" && (
        <>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-red-700">
              {error}
            </div>
          )}

          {/* Upload step */}
          {step === "upload" && (
            <div className="space-y-4">
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
              >
                <span className="text-6xl block mb-4">📸</span>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  {t("receipt.dropTitle")}
                </h3>
                <p className="text-gray-500 text-sm mb-4">{t("receipt.dropHint")}</p>
                <span className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm">
                  {t("receipt.chooseFile")}
                </span>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                />
              </div>

              {/* Manual entry */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="font-semibold text-gray-800 mb-3">
                  ✏️ {t("receipt.manualTitle")}
                </h3>
                <p className="text-sm text-gray-500 mb-4">{t("receipt.manualHint")}</p>
                <button
                  onClick={() => {
                    setStoreName("");
                    setReceiptDate(new Date().toISOString().split("T")[0]);
                    setEditItems([
                      { name: "", price: 0, quantity: 1 },
                      { name: "", price: 0, quantity: 1 },
                      { name: "", price: 0, quantity: 1 },
                    ]);
                    setParsed(null);
                    setStep("review");
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm transition-colors"
                >
                  {t("receipt.enterManually")}
                </button>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
                💡 {t("receipt.tip")}
              </div>
            </div>
          )}

          {/* Scanning step */}
          {step === "scanning" && (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="Receipt"
                  className="max-h-64 mx-auto rounded-lg mb-6 shadow-sm"
                />
              )}
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {t("receipt.scanning")}
              </h3>
              <div className="w-64 mx-auto bg-gray-200 rounded-full h-3 mb-2">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-500">{progress}%</p>
            </div>
          )}

          {/* Review step */}
          {step === "review" && (
            <div className="space-y-4">
              {imageUrl && (
                <details className="bg-white rounded-xl shadow-md overflow-hidden">
                  <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-blue-600 hover:bg-gray-50">
                    📷 {t("receipt.showImage")}
                  </summary>
                  <img src={imageUrl} alt="Receipt" className="max-h-96 mx-auto p-4" />
                </details>
              )}

              {/* Store & date */}
              <div className="bg-white rounded-xl shadow-md p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      🏪 {t("receipt.storeName")}
                    </label>
                    <input
                      type="text"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. Walmart"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      📅 {t("receipt.date")}
                    </label>
                    <input
                      type="date"
                      value={receiptDate}
                      onChange={(e) => setReceiptDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Items table */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">
                    {t("receipt.items")} ({editItems.length})
                  </h3>
                  <button
                    onClick={addItem}
                    className="text-sm px-3 py-1 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 font-medium"
                  >
                    + {t("receipt.addItem")}
                  </button>
                </div>

                <div className="divide-y divide-gray-100">
                  {editItems.map((item, idx) => (
                    <div key={idx} className="px-4 py-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateItem(idx, "name", e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm text-gray-800 focus:ring-1 focus:ring-blue-500"
                          placeholder={t("receipt.itemName")}
                        />
                      </div>
                      <div className="w-20">
                        <input
                          type="number"
                          step="1"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(idx, "quantity", parseInt(e.target.value) || 1)
                          }
                          className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm text-center text-gray-800 focus:ring-1 focus:ring-blue-500"
                          title={t("receipt.qty")}
                        />
                      </div>
                      <div className="w-24">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                            $
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.price || ""}
                            onChange={(e) =>
                              updateItem(idx, "price", parseFloat(e.target.value) || 0)
                            }
                            className="w-full pl-5 pr-2 py-1.5 border border-gray-200 rounded text-sm text-right text-gray-800 focus:ring-1 focus:ring-blue-500"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => removeItem(idx)}
                        className="text-gray-400 hover:text-red-500 transition-colors text-lg"
                        title={t("receipt.removeItem")}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {t("receipt.itemsTotal")}: <strong>${itemTotal.toFixed(2)}</strong>
                    {parsed?.total && (
                      <span className="text-gray-400 ml-2">
                        ({t("receipt.receiptTotal")}: ${parsed.total.toFixed(2)})
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Raw OCR text */}
              {parsed?.rawText && (
                <details className="bg-white rounded-xl shadow-md overflow-hidden">
                  <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-gray-600 hover:bg-gray-50">
                    📄 {t("receipt.showRawText")}
                  </summary>
                  <pre className="px-4 py-3 text-xs text-gray-500 whitespace-pre-wrap max-h-64 overflow-auto bg-gray-50">
                    {parsed.rawText}
                  </pre>
                </details>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={
                    editItems.filter((i) => i.name.trim() && i.price > 0).length === 0
                  }
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50"
                >
                  💾 {t("receipt.save")} (
                  {editItems.filter((i) => i.name.trim() && i.price > 0).length}{" "}
                  {t("receipt.items").toLowerCase()})
                </button>
                <button
                  onClick={resetAll}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                >
                  {t("receipt.cancel")}
                </button>
              </div>
            </div>
          )}

          {/* Saved step */}
          {step === "saved" && (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <span className="text-6xl block mb-4">✅</span>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {t("receipt.savedTitle")}
              </h2>
              <p className="text-gray-600 mb-6">
                {t("receipt.savedDesc", {
                  count: editItems.filter((i) => i.name.trim() && i.price > 0).length,
                  store: storeName,
                })}
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={resetAll}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                  🧾 {t("receipt.scanAnother")}
                </button>
                <button
                  onClick={() => setMainTab("items")}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                >
                  📊 {t("receipt.viewDatabase")}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ══════════════ ITEMS TAB ══════════════ */}
      {mainTab === "items" && (
        <>
          {totalReceipts === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <span className="text-6xl block mb-4">🧾</span>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                {t("myPrices.empty")}
              </h2>
              <p className="text-gray-500 mb-6">{t("myPrices.emptyHint")}</p>
              <button
                onClick={() => setMainTab("scan")}
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                {t("myPrices.scanFirst")}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("myPrices.searchPlaceholder")}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500"
              />

              {filtered.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {t("myPrices.noResults")}
                </div>
              ) : (
                filtered.map((item) => {
                  const isExpanded = expandedItem === item.normalizedName;
                  const comparison = isExpanded
                    ? getItemComparison(item.normalizedName)
                    : [];

                  return (
                    <div
                      key={item.normalizedName}
                      className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
                    >
                      <button
                        onClick={() =>
                          setExpandedItem(isExpanded ? null : item.normalizedName)
                        }
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <div className="text-left">
                          <div className="font-medium text-gray-900">
                            {item.bestRecord.itemName}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {item.storeCount} {t("myPrices.storesCompared")} ·{" "}
                            {item.allRecords.length} {t("myPrices.priceRecords")}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">
                              ${item.bestRecord.unitPrice.toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {item.bestRecord.storeName}
                            </div>
                          </div>
                          <span className="text-gray-400">
                            {isExpanded ? "▾" : "▸"}
                          </span>
                        </div>
                      </button>

                      {isExpanded && comparison.length > 0 && (
                        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/50">
                          <div className="text-xs font-medium text-gray-500 mb-2">
                            {t("myPrices.priceByStore")}
                          </div>
                          <div className="space-y-2">
                            {comparison.map((c, idx) => {
                              const isBest = idx === 0;
                              const priceDiff =
                                idx > 0
                                  ? c.latestPrice - comparison[0].latestPrice
                                  : 0;

                              return (
                                <div
                                  key={c.storeName}
                                  className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                                    isBest
                                      ? "bg-green-50 border border-green-200"
                                      : "bg-white border border-gray-100"
                                  }`}
                                >
                                  <div>
                                    <span
                                      className={`font-medium ${
                                        isBest ? "text-green-700" : "text-gray-700"
                                      }`}
                                    >
                                      {isBest && "🏆 "}
                                      {c.storeName}
                                    </span>
                                    <span className="text-xs text-gray-400 ml-2">
                                      {c.latestDate}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`font-bold ${
                                        isBest ? "text-green-600" : "text-gray-800"
                                      }`}
                                    >
                                      ${c.latestPrice.toFixed(2)}
                                    </span>
                                    {priceDiff > 0 && (
                                      <span className="text-xs text-red-500">
                                        +${priceDiff.toFixed(2)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      )}

      {/* ══════════════ RECEIPTS TAB ══════════════ */}
      {mainTab === "receipts" && (
        <>
          {totalReceipts === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <span className="text-6xl block mb-4">📋</span>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                {t("myPrices.empty")}
              </h2>
              <p className="text-gray-500 mb-6">{t("myPrices.emptyHint")}</p>
              <button
                onClick={() => setMainTab("scan")}
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                {t("myPrices.scanFirst")}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {receipts.map((r) => (
                <div
                  key={r.id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium text-gray-900">{r.storeName}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {r.date} · {r.itemCount} {t("myPrices.itemsLower")}
                      {r.total && ` · $${r.total.toFixed(2)}`}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteReceipt(r.id)}
                    className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-full hover:bg-red-100 font-medium transition-colors"
                  >
                    {t("myPrices.delete")}
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Info tip */}
      {totalReceipts > 0 && mainTab !== "scan" && (
        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
          💡 {t("myPrices.info")}
        </div>
      )}
    </div>
  );
}
