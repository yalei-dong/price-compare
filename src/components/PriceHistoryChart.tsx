"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { useTranslation } from "@/hooks/useTranslation";
import { PriceEntry, CURRENCY_SYMBOLS } from "@/lib/types";
import {
  PriceSnapshot,
  getProductHistory,
  generateDemoHistory,
  recordPriceSnapshot,
} from "@/lib/price-history";

const STORE_COLORS = [
  "#2563eb", "#dc2626", "#16a34a", "#d97706", "#7c3aed",
  "#0891b2", "#e11d48", "#65a30d", "#ca8a04", "#6366f1",
];

type ChartView = "range" | "stores" | "lowest";

interface PriceHistoryChartProps {
  productId: string;
  productName: string;
  currentPrices: PriceEntry[];
}

export default function PriceHistoryChart({
  productId,
  productName,
  currentPrices,
}: PriceHistoryChartProps) {
  const t = useTranslation();
  const [view, setView] = useState<ChartView>("range");
  const [expanded, setExpanded] = useState(true);

  // Record current prices as today's snapshot
  useMemo(() => {
    recordPriceSnapshot(productId, productName, currentPrices);
  }, [productId, productName, currentPrices]);

  const snapshots = useMemo(() => {
    const history = getProductHistory(productId);
    if (history && history.snapshots.length > 1) {
      return history.snapshots;
    }
    // Generate demo data if we only have 1 day of real data
    return generateDemoHistory(productId, productName, currentPrices);
  }, [productId, productName, currentPrices]);

  const currency = currentPrices.find((p) => p.inStock)?.currency || "USD";
  const symbol = CURRENCY_SYMBOLS[currency] || "$";

  // Get unique store names across all snapshots
  const storeNames = useMemo(() => {
    const names = new Set<string>();
    snapshots.forEach((s) => s.prices.forEach((p) => names.add(p.storeName)));
    return Array.from(names).slice(0, 10); // Max 10 stores on chart
  }, [snapshots]);

  // Build chart data
  const chartData = useMemo(() => {
    return snapshots.map((s) => {
      const row: Record<string, number | string> = {
        date: s.date.slice(5), // MM-DD
        fullDate: s.date,
        lowest: s.lowestPrice,
        highest: s.highestPrice,
        avg: Math.round(s.avgPrice * 100) / 100,
      };
      // Add per-store prices
      storeNames.forEach((name) => {
        const entry = s.prices.find((p) => p.storeName === name);
        if (entry) row[name] = entry.price;
      });
      return row;
    });
  }, [snapshots, storeNames]);

  // Price trend info
  const trend = useMemo(() => {
    if (snapshots.length < 2) return null;
    const first = snapshots[0].lowestPrice;
    const last = snapshots[snapshots.length - 1].lowestPrice;
    const change = last - first;
    const pct = ((change / first) * 100).toFixed(1);
    return { change, pct, direction: change < 0 ? "down" : change > 0 ? "up" : "flat" };
  }, [snapshots]);

  if (snapshots.length === 0) return null;

  const isDemo = !getProductHistory(productId) || getProductHistory(productId)!.snapshots.length <= 1;

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">📈</span>
          <div className="text-left">
            <h2 className="text-lg font-semibold text-gray-900">
              {t("priceHistory.title")}
            </h2>
            {trend && (
              <span
                className={`text-sm font-medium ${
                  trend.direction === "down"
                    ? "text-green-600"
                    : trend.direction === "up"
                    ? "text-red-600"
                    : "text-gray-500"
                }`}
              >
                {trend.direction === "down" ? "↓" : trend.direction === "up" ? "↑" : "→"}{" "}
                {symbol}
                {Math.abs(trend.change).toFixed(2)} ({trend.pct}%){" "}
                {t("priceHistory.overPeriod", { days: snapshots.length })}
              </span>
            )}
          </div>
        </div>
        <span className="text-gray-400 text-xl">{expanded ? "▾" : "▸"}</span>
      </button>

      {expanded && (
        <div className="px-4 pb-4">
          {/* View toggle */}
          <div className="flex flex-wrap gap-2 mb-4">
            {(["range", "stores", "lowest"] as ChartView[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  view === v
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {v === "range"
                  ? t("priceHistory.viewRange")
                  : v === "stores"
                  ? t("priceHistory.viewStores")
                  : t("priceHistory.viewLowest")}
              </button>
            ))}
          </div>

          {/* Chart */}
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              {view === "range" ? (
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="rangeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    stroke="#9ca3af"
                    tickFormatter={(v: number) => `${symbol}${v}`}
                    domain={["auto", "auto"]}
                  />
                  <Tooltip
                    formatter={(value) => [`${symbol}${Number(value).toFixed(2)}`, ""]}
                    labelFormatter={(label) => `${t("priceHistory.date")}: ${label}`}
                    contentStyle={{ borderRadius: "8px", fontSize: "13px" }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="highest"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fill="url(#rangeGrad)"
                    name={t("priceHistory.highest")}
                    dot={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="avg"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="none"
                    strokeDasharray="5 5"
                    name={t("priceHistory.average")}
                    dot={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="lowest"
                    stroke="#22c55e"
                    strokeWidth={2}
                    fill="none"
                    name={t("priceHistory.lowest")}
                    dot={false}
                  />
                </AreaChart>
              ) : view === "stores" ? (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    stroke="#9ca3af"
                    tickFormatter={(v: number) => `${symbol}${v}`}
                    domain={["auto", "auto"]}
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      `${symbol}${Number(value).toFixed(2)}`,
                      name,
                    ]}
                    labelFormatter={(label) => `${t("priceHistory.date")}: ${label}`}
                    contentStyle={{ borderRadius: "8px", fontSize: "13px" }}
                  />
                  <Legend />
                  {storeNames.map((name, i) => (
                    <Line
                      key={name}
                      type="monotone"
                      dataKey={name}
                      stroke={STORE_COLORS[i % STORE_COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              ) : (
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="lowestGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    stroke="#9ca3af"
                    tickFormatter={(v: number) => `${symbol}${v}`}
                    domain={["auto", "auto"]}
                  />
                  <Tooltip
                    formatter={(value) => [`${symbol}${Number(value).toFixed(2)}`, ""]}
                    labelFormatter={(label) => `${t("priceHistory.date")}: ${label}`}
                    contentStyle={{ borderRadius: "8px", fontSize: "13px" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="lowest"
                    stroke="#22c55e"
                    strokeWidth={3}
                    fill="url(#lowestGrad)"
                    name={t("priceHistory.lowestPrice")}
                    dot={{ r: 4, fill: "#22c55e" }}
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Info bar */}
          <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
            <span>
              {isDemo && (
                <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full mr-2">
                  {t("priceHistory.demo")}
                </span>
              )}
              {t("priceHistory.dataPoints", { count: snapshots.length })}
            </span>
            <span>
              {t("priceHistory.lastUpdated", {
                date: snapshots[snapshots.length - 1].date,
              })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
