"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useShoppingList } from "@/context/ShoppingListContext";
import { useTranslation } from "@/hooks/useTranslation";
import { ShoppingListItem } from "@/lib/types";

/* ── Saved List & Run types ── */
interface SavedList {
  id: string;
  name: string;
  items: ShoppingListItem[];
  createdAt: string;
}

interface ShoppingRun {
  id: string;
  name: string;
  date: string;
  items: ShoppingListItem[];
  totalItems: number;
  checkedItems: number;
  completed: boolean;
}

const LS_SAVED = "price-compare-saved-lists";
const LS_RUNS = "price-compare-shopping-runs";

function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export default function ShoppingListPage() {
  const {
    items,
    addItem,
    removeItem,
    toggleChecked,
    updateQuantity,
    clearList,
    clearChecked,
  } = useShoppingList();
  const t = useTranslation();

  /* ── Saved lists ── */
  const [savedLists, setSavedLists] = useState<SavedList[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [showSaveInput, setShowSaveInput] = useState(false);

  /* ── Shopping runs ── */
  const [runs, setRuns] = useState<ShoppingRun[]>([]);
  const [showRuns, setShowRuns] = useState(false);
  const [runName, setRunName] = useState("");
  const [showRunInput, setShowRunInput] = useState(false);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);

  /* ── Scan handwritten list ── */
  const scanFileRef = useRef<HTMLInputElement>(null);
  const [showScan, setShowScan] = useState(false);
  const [scanStep, setScanStep] = useState<"idle" | "scanning" | "review">("idle");
  const [scanProgress, setScanProgress] = useState(0);
  const [scanImageUrl, setScanImageUrl] = useState<string | null>(null);
  const [scanItems, setScanItems] = useState<{ name: string; qty: number; include: boolean }[]>([]);
  const [scanError, setScanError] = useState<string | null>(null);

  useEffect(() => {
    setSavedLists(loadJSON<SavedList[]>(LS_SAVED, []));
    setRuns(loadJSON<ShoppingRun[]>(LS_RUNS, []));
  }, []);

  const persistSaved = useCallback((lists: SavedList[]) => {
    setSavedLists(lists);
    localStorage.setItem(LS_SAVED, JSON.stringify(lists));
  }, []);

  const persistRuns = useCallback((r: ShoppingRun[]) => {
    setRuns(r);
    localStorage.setItem(LS_RUNS, JSON.stringify(r));
  }, []);

  /* ── Saved list actions ── */
  const handleSaveList = () => {
    const name = saveName.trim();
    if (!name || items.length === 0) return;
    const newList: SavedList = {
      id: Date.now().toString(36),
      name,
      items: items.map((i) => ({ ...i, checked: false })),
      createdAt: new Date().toISOString(),
    };
    persistSaved([newList, ...savedLists]);
    setSaveName("");
    setShowSaveInput(false);
  };

  const handleLoadList = (list: SavedList) => {
    clearList();
    // Use setTimeout so clearList state update is flushed first
    setTimeout(() => {
      list.items.forEach((i) => addItem(i.productId, i.productName));
    }, 0);
  };

  const handleDeleteSavedList = (id: string) => {
    persistSaved(savedLists.filter((l) => l.id !== id));
  };

  /* ── Shopping run actions ── */
  const handleStartRun = () => {
    const name = runName.trim() || t("list.runDefault");
    const run: ShoppingRun = {
      id: Date.now().toString(36),
      name,
      date: new Date().toISOString().split("T")[0],
      items: items.map((i) => ({ ...i })),
      totalItems: items.length,
      checkedItems: items.filter((i) => i.checked).length,
      completed: false,
    };
    persistRuns([run, ...runs]);
    setRunName("");
    setShowRunInput(false);
  };

  const handleCompleteRun = (id: string) => {
    persistRuns(
      runs.map((r) =>
        r.id === id
          ? {
              ...r,
              completed: true,
              items: items.map((i) => ({ ...i })),
              checkedItems: items.filter((i) => i.checked).length,
            }
          : r
      )
    );
  };

  const handleReloadRun = (run: ShoppingRun) => {
    clearList();
    setTimeout(() => {
      run.items
        .filter((i) => !i.checked)
        .forEach((i) => addItem(i.productId, i.productName));
    }, 0);
  };

  const handleDeleteRun = (id: string) => {
    persistRuns(runs.filter((r) => r.id !== id));
  };

  /* ── Scan handwritten list logic ── */
  const parseListText = (text: string): { name: string; qty: number }[] => {
    const lines = text
      .split(/\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 1);

    const items: { name: string; qty: number }[] = [];
    for (const line of lines) {
      // Skip lines that look like headers/noise
      if (/^[-=_*]{3,}$/.test(line)) continue;
      if (/^(shopping|grocery|list|to\s*buy|items)/i.test(line)) continue;

      // Try to extract quantity: "2x Milk", "3 Eggs", "Bread x2", "Milk (2)"
      let qty = 1;
      let name = line;

      // Leading number: "2 Milk", "2x Milk", "2. Milk"
      const leadMatch = name.match(/^(\d+)\s*[.x×):\-]?\s+(.+)/i);
      if (leadMatch) {
        qty = parseInt(leadMatch[1]) || 1;
        name = leadMatch[2];
      } else {
        // Trailing: "Milk x2", "Milk (2)", "Milk ×3"
        const trailMatch = name.match(/^(.+?)\s*[x×]\s*(\d+)\s*$/i);
        const parenMatch = name.match(/^(.+?)\s*\((\d+)\)\s*$/);
        if (trailMatch) {
          name = trailMatch[1];
          qty = parseInt(trailMatch[2]) || 1;
        } else if (parenMatch) {
          name = parenMatch[1];
          qty = parseInt(parenMatch[2]) || 1;
        }
      }

      // Clean up: remove leading bullets, dashes, checkboxes
      name = name.replace(/^[\s\-•○●☐☑✓✔□■►▸→*]+/, "").trim();
      // Remove trailing punctuation
      name = name.replace(/[,;.]+$/, "").trim();

      if (name.length > 0 && qty > 0 && qty <= 99) {
        items.push({ name, qty: Math.min(qty, 20) });
      }
    }
    return items;
  };

  const handleScanFile = useCallback(
    async (file: File) => {
      setScanError(null);
      setScanStep("scanning");
      setScanProgress(0);
      const url = URL.createObjectURL(file);
      setScanImageUrl(url);

      try {
        const Tesseract = (await import("tesseract.js")).default;
        const result = await Tesseract.recognize(file, "eng", {
          logger: (m: { status: string; progress: number }) => {
            if (m.status === "recognizing text") {
              setScanProgress(Math.round(m.progress * 100));
            }
          },
        });

        const text = result.data.text;
        const parsed = parseListText(text);

        if (parsed.length === 0) {
          setScanError(t("list.scanNoItems"));
          setScanStep("idle");
          return;
        }

        setScanItems(parsed.map((p) => ({ name: p.name, qty: p.qty, include: true })));
        setScanStep("review");
      } catch (err) {
        console.error("OCR failed:", err);
        setScanError(t("list.scanFailed"));
        setScanStep("idle");
      }
    },
    [t]
  );

  const handleScanDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) handleScanFile(file);
    },
    [handleScanFile]
  );

  const handleAddScannedItems = () => {
    const toAdd = scanItems.filter((i) => i.include && i.name.trim());
    toAdd.forEach((i) => {
      const id = `scan-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      // Add with quantity by calling addItem multiple times or once
      addItem(id, i.name.trim());
      if (i.qty > 1) {
        updateQuantity(id, i.qty);
      }
    });
    // Reset scan state
    setScanStep("idle");
    setScanItems([]);
    setScanImageUrl(null);
    setShowScan(false);
  };

  const resetScan = () => {
    setScanStep("idle");
    setScanProgress(0);
    setScanImageUrl(null);
    setScanItems([]);
    setScanError(null);
  };

  const uncheckedCount = items.filter((i) => !i.checked).length;
  const checkedCount = items.filter((i) => i.checked).length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t("list.title")}</h1>
          <p className="text-gray-500 mt-1">
            {items.length === 0
              ? t("list.empty")
              : t("list.summary", {
                  unchecked: uncheckedCount,
                  checked: checkedCount,
                })}
          </p>
        </div>
        {items.length > 0 && (
          <div className="flex gap-2">
            {checkedCount > 0 && (
              <button
                onClick={clearChecked}
                className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                {t("list.clearChecked")}
              </button>
            )}
            <button
              onClick={clearList}
              className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
            >
              {t("list.clearAll")}
            </button>
          </div>
        )}
      </div>

      {/* ── Action bar: Save / Run / Scan buttons ── */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => {
            setShowScan(!showScan);
            setShowSaved(false);
            setShowRuns(false);
          }}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            showScan
              ? "bg-teal-100 text-teal-800 border border-teal-300"
              : "bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200"
          }`}
        >
          📸 {t("list.scanList")}
        </button>
        <button
          onClick={() => {
            setShowSaved(!showSaved);
            setShowRuns(false);
            setShowScan(false);
          }}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            showSaved
              ? "bg-amber-100 text-amber-800 border border-amber-300"
              : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
          }`}
        >
          📋 {t("list.savedLists")} ({savedLists.length})
        </button>
        <button
          onClick={() => {
            setShowRuns(!showRuns);
            setShowSaved(false);
            setShowScan(false);
          }}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            showRuns
              ? "bg-indigo-100 text-indigo-800 border border-indigo-300"
              : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
          }`}
        >
          🏃 {t("list.shoppingRuns")} ({runs.length})
        </button>
        {items.length > 0 && (
          <>
            <button
              onClick={() => {
                setShowSaveInput(!showSaveInput);
                setShowRunInput(false);
              }}
              className="px-4 py-2 text-sm font-medium bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 rounded-lg transition-colors ml-auto"
            >
              💾 {t("list.saveAsList")}
            </button>
            <button
              onClick={() => {
                setShowRunInput(!showRunInput);
                setShowSaveInput(false);
              }}
              className="px-4 py-2 text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
            >
              🛍️ {t("list.startRun")}
            </button>
          </>
        )}
      </div>

      {/* ── Save current list form ── */}
      {showSaveInput && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-green-800 mb-1">
              {t("list.saveNameLabel")}
            </label>
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveList()}
              placeholder={t("list.saveNamePlaceholder")}
              className="w-full px-3 py-2 border border-green-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-green-500 text-sm"
              autoFocus
            />
          </div>
          <button
            onClick={handleSaveList}
            disabled={!saveName.trim()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm transition-colors disabled:opacity-50"
          >
            {t("list.saveBtn")}
          </button>
        </div>
      )}

      {/* ── Start run form ── */}
      {showRunInput && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-blue-800 mb-1">
              {t("list.runNameLabel")}
            </label>
            <input
              type="text"
              value={runName}
              onChange={(e) => setRunName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleStartRun()}
              placeholder={t("list.runNamePlaceholder")}
              className="w-full px-3 py-2 border border-blue-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500 text-sm"
              autoFocus
            />
          </div>
          <button
            onClick={handleStartRun}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors"
          >
            {t("list.startBtn")}
          </button>
        </div>
      )}

      {/* ── Scan Handwritten List panel ── */}
      {showScan && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-4">
          <h3 className="font-semibold text-teal-900 mb-3">
            📸 {t("list.scanListTitle")}
          </h3>
          <p className="text-sm text-teal-700 mb-4">{t("list.scanListHint")}</p>

          {scanError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3 text-sm text-red-700">
              {scanError}
            </div>
          )}

          {/* Upload / Idle */}
          {scanStep === "idle" && (
            <div
              onDrop={handleScanDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => scanFileRef.current?.click()}
              className="border-2 border-dashed border-teal-300 rounded-lg p-8 text-center cursor-pointer hover:border-teal-500 hover:bg-teal-100/50 transition-colors"
            >
              <span className="text-4xl block mb-2">✍️</span>
              <p className="text-sm font-medium text-teal-800 mb-1">
                {t("list.scanDropTitle")}
              </p>
              <p className="text-xs text-teal-600">{t("list.scanDropHint")}</p>
              <input
                ref={scanFileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleScanFile(file);
                }}
              />
            </div>
          )}

          {/* Scanning */}
          {scanStep === "scanning" && (
            <div className="text-center py-6">
              {scanImageUrl && (
                <img
                  src={scanImageUrl}
                  alt="List"
                  className="max-h-40 mx-auto rounded-lg mb-4 shadow-sm"
                />
              )}
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-4 border-teal-600 border-t-transparent mb-3" />
              <p className="text-sm font-medium text-teal-800 mb-2">
                {t("list.scanScanning")}
              </p>
              <div className="w-48 mx-auto bg-gray-200 rounded-full h-2">
                <div
                  className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{scanProgress}%</p>
            </div>
          )}

          {/* Review */}
          {scanStep === "review" && (
            <div className="space-y-3">
              {scanImageUrl && (
                <details className="bg-white rounded-lg border border-teal-100 overflow-hidden">
                  <summary className="px-3 py-2 cursor-pointer text-xs font-medium text-teal-600 hover:bg-gray-50">
                    📷 {t("list.scanShowImage")}
                  </summary>
                  <img src={scanImageUrl} alt="Scanned list" className="max-h-48 mx-auto p-3" />
                </details>
              )}

              <div className="text-sm font-medium text-teal-800 mb-1">
                {t("list.scanFound", { count: scanItems.filter((i) => i.include).length })}
              </div>

              <div className="bg-white rounded-lg border border-teal-100 divide-y divide-gray-100 max-h-64 overflow-auto">
                {scanItems.map((item, idx) => (
                  <div key={idx} className="px-3 py-2 flex items-center gap-3">
                    <button
                      onClick={() =>
                        setScanItems((prev) =>
                          prev.map((it, i) =>
                            i === idx ? { ...it, include: !it.include } : it
                          )
                        )
                      }
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${
                        item.include
                          ? "bg-teal-500 border-teal-500 text-white"
                          : "border-gray-300"
                      }`}
                    >
                      {item.include && <span className="text-xs">✓</span>}
                    </button>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) =>
                        setScanItems((prev) =>
                          prev.map((it, i) =>
                            i === idx ? { ...it, name: e.target.value } : it
                          )
                        )
                      }
                      className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm text-gray-800 focus:ring-1 focus:ring-teal-500"
                    />
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={item.qty}
                      onChange={(e) =>
                        setScanItems((prev) =>
                          prev.map((it, i) =>
                            i === idx
                              ? { ...it, qty: Math.max(1, parseInt(e.target.value) || 1) }
                              : it
                          )
                        )
                      }
                      className="w-14 px-2 py-1 border border-gray-200 rounded text-sm text-center text-gray-800 focus:ring-1 focus:ring-teal-500"
                    />
                    <button
                      onClick={() =>
                        setScanItems((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAddScannedItems}
                  disabled={!scanItems.some((i) => i.include && i.name.trim())}
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium text-sm transition-colors disabled:opacity-50"
                >
                  ➕ {t("list.scanAddItems", { count: scanItems.filter((i) => i.include && i.name.trim()).length })}
                </button>
                <button
                  onClick={resetScan}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm transition-colors"
                >
                  {t("list.scanCancel")}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Saved Lists panel ── */}
      {showSaved && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
          <h3 className="font-semibold text-amber-900 mb-3">
            📋 {t("list.savedLists")}
          </h3>
          {savedLists.length === 0 ? (
            <p className="text-sm text-amber-700">{t("list.noSavedLists")}</p>
          ) : (
            <div className="space-y-2">
              {savedLists.map((list) => (
                <div
                  key={list.id}
                  className="bg-white rounded-lg border border-amber-100 px-4 py-3 flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium text-gray-900">{list.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {list.items.length} {t("list.itemsLower")} ·{" "}
                      {new Date(list.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleLoadList(list)}
                      className="text-xs px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full hover:bg-amber-200 font-medium transition-colors"
                    >
                      {t("list.loadList")}
                    </button>
                    <button
                      onClick={() => handleDeleteSavedList(list.id)}
                      className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-full hover:bg-red-100 font-medium transition-colors"
                    >
                      {t("list.deleteList")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Shopping Runs panel ── */}
      {showRuns && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4">
          <h3 className="font-semibold text-indigo-900 mb-3">
            🏃 {t("list.shoppingRuns")}
          </h3>
          {runs.length === 0 ? (
            <p className="text-sm text-indigo-700">{t("list.noRuns")}</p>
          ) : (
            <div className="space-y-2">
              {runs.map((run) => {
                const isExpanded = expandedRun === run.id;
                return (
                  <div
                    key={run.id}
                    className="bg-white rounded-lg border border-indigo-100 overflow-hidden"
                  >
                    <button
                      onClick={() =>
                        setExpandedRun(isExpanded ? null : run.id)
                      }
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {run.name}
                          </span>
                          {run.completed ? (
                            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                              ✓ {t("list.runComplete")}
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">
                              {t("list.runActive")}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {run.date} · {run.checkedItems}/{run.totalItems}{" "}
                          {t("list.itemsChecked")}
                        </div>
                      </div>
                      <span className="text-gray-400">
                        {isExpanded ? "▾" : "▸"}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-indigo-100 px-4 py-3 bg-gray-50/50">
                        <div className="space-y-1 mb-3">
                          {run.items.map((item) => (
                            <div
                              key={item.productId}
                              className={`text-sm flex items-center gap-2 ${
                                item.checked
                                  ? "text-gray-400 line-through"
                                  : "text-gray-700"
                              }`}
                            >
                              <span>
                                {item.checked ? "☑" : "☐"}
                              </span>
                              <span>
                                {item.productName} × {item.quantity}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          {!run.completed && (
                            <button
                              onClick={() => handleCompleteRun(run.id)}
                              className="text-xs px-3 py-1.5 bg-green-50 text-green-600 rounded-full hover:bg-green-100 font-medium transition-colors"
                            >
                              ✓ {t("list.markComplete")}
                            </button>
                          )}
                          <button
                            onClick={() => handleReloadRun(run)}
                            className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 font-medium transition-colors"
                          >
                            🔄 {t("list.reloadUnchecked")}
                          </button>
                          <button
                            onClick={() => handleDeleteRun(run.id)}
                            className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-full hover:bg-red-100 font-medium transition-colors"
                          >
                            {t("list.deleteList")}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Main shopping list ── */}
      {items.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <span className="text-6xl block mb-4">📝</span>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            {t("list.emptyTitle")}
          </h3>
          <p className="text-gray-500 mb-6">{t("list.emptyDesc")}</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {t("list.browse")}
            </Link>
            {savedLists.length > 0 && (
              <button
                onClick={() => setShowSaved(true)}
                className="px-6 py-3 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors font-medium"
              >
                📋 {t("list.loadSaved")}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.productId}
              className={`bg-white rounded-xl shadow-sm border p-4 flex items-center gap-4 transition-all ${
                item.checked
                  ? "opacity-60 border-gray-200"
                  : "border-gray-100"
              }`}
            >
              {/* Checkbox */}
              <button
                onClick={() => toggleChecked(item.productId)}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  item.checked
                    ? "bg-green-500 border-green-500 text-white"
                    : "border-gray-300 hover:border-blue-500"
                }`}
              >
                {item.checked && <span className="text-xs">✓</span>}
              </button>

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <Link
                  href={
                    item.productId.startsWith("b-")
                      ? `/?q=${encodeURIComponent(item.productName)}`
                      : `/product/${item.productId}`
                  }
                  className={`font-medium hover:text-blue-600 transition-colors ${
                    item.checked
                      ? "line-through text-gray-400"
                      : "text-gray-800"
                  }`}
                >
                  {item.productName}
                </Link>
                <Link
                  href={
                    item.productId.startsWith("b-")
                      ? `/?q=${encodeURIComponent(item.productName)}`
                      : `/product/${item.productId}`
                  }
                  className="block text-xs text-blue-500 hover:underline mt-0.5"
                >
                  {t("list.viewPrices")}
                </Link>
              </div>

              {/* Quantity */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    updateQuantity(item.productId, item.quantity - 1)
                  }
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-colors"
                >
                  −
                </button>
                <span className="w-8 text-center font-medium text-gray-800">
                  {item.quantity}
                </span>
                <button
                  onClick={() =>
                    updateQuantity(item.productId, item.quantity + 1)
                  }
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-colors"
                >
                  +
                </button>
              </div>

              {/* Remove */}
              <button
                onClick={() => removeItem(item.productId)}
                className="text-gray-400 hover:text-red-500 transition-colors text-lg"
                title={t("list.remove")}
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
