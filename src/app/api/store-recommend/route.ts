import { NextRequest, NextResponse } from "next/server";
import { searchProductsReal } from "@/lib/price-service";
import { detectLocaleFromRequest } from "@/lib/request-locale";
import { PriceEntry } from "@/lib/types";

interface StoreItemPrice {
  itemName: string;
  price: number;
  url?: string;
}

interface StoreScore {
  storeName: string;
  storeLogo: string;
  storeType: "online" | "local" | "both";
  items: StoreItemPrice[];
  coverage: number;       // fraction 0-1
  totalCost: number;
  avgPrice: number;
  score: number;          // composite score (lower = better)
  reasons: string[];      // i18n reason keys
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const items: { name: string; quantity: number }[] = body.items || [];
    if (items.length === 0) {
      return NextResponse.json({ stores: [] });
    }

    const localeCode = await detectLocaleFromRequest(request);

    // Fetch prices for each item (batch in groups of 3 to limit API load)
    const storeMap = new Map<
      string,
      {
        storeName: string;
        storeLogo: string;
        storeType: "online" | "local" | "both";
        items: Map<string, { price: number; url?: string }>;
      }
    >();

    const totalItems = items.length;

    for (let i = 0; i < items.length; i += 3) {
      const batch = items.slice(i, i + 3);
      const results = await Promise.all(
        batch.map(async (item) => {
          const { products } = await searchProductsReal(
            item.name,
            undefined,
            undefined,
            localeCode
          );
          return { itemName: item.name, quantity: item.quantity, products };
        })
      );

      for (const { itemName, quantity, products } of results) {
        if (!products.length) continue;
        // Gather prices from all products
        const allPrices: PriceEntry[] = products.flatMap((p) => p.prices);

        for (const pe of allPrices) {
          const key = pe.storeName.toLowerCase().trim();
          if (!storeMap.has(key)) {
            storeMap.set(key, {
              storeName: pe.storeName,
              storeLogo: pe.storeLogo,
              storeType: pe.type,
              items: new Map(),
            });
          }
          const store = storeMap.get(key)!;
          const existing = store.items.get(itemName);
          const totalPrice = pe.price * quantity;
          // Keep cheapest listing per item per store
          if (!existing || totalPrice < existing.price * quantity) {
            store.items.set(itemName, { price: pe.price, url: pe.url });
          }
        }
      }
    }

    // Score each store
    const scored: StoreScore[] = [];
    let globalMinTotal = Infinity;
    let globalMaxTotal = 0;

    // First pass: compute totals
    const storeEntries: {
      key: string;
      data: (typeof storeMap extends Map<string, infer V> ? V : never);
      totalCost: number;
      coverage: number;
    }[] = [];

    for (const [key, data] of storeMap) {
      const coverage = data.items.size / totalItems;
      if (coverage < 0.3) continue; // skip stores with < 30% coverage

      let totalCost = 0;
      for (const [itemName, { price }] of data.items) {
        const qty = items.find((i) => i.name === itemName)?.quantity || 1;
        totalCost += price * qty;
      }
      totalCost = Math.round(totalCost * 100) / 100;

      if (totalCost < globalMinTotal) globalMinTotal = totalCost;
      if (totalCost > globalMaxTotal) globalMaxTotal = totalCost;

      storeEntries.push({ key, data, totalCost, coverage });
    }

    // Second pass: score and build reasons
    for (const { data, totalCost, coverage } of storeEntries) {
      const reasons: string[] = [];

      // Cost score: 0 (cheapest) to 1 (most expensive)
      const costRange = globalMaxTotal - globalMinTotal;
      const costScore =
        costRange > 0 ? (totalCost - globalMinTotal) / costRange : 0;

      // Coverage score: 1 (all items) to 0 (30% items)
      const coverageScore = 1 - coverage;

      // Type bonus: physical/both stores rated higher for quality
      let typeBonus = 0;
      if (data.storeType === "local") typeBonus = -0.15;
      else if (data.storeType === "both") typeBonus = -0.1;

      const score =
        costScore * 0.45 + coverageScore * 0.4 + typeBonus + 0.15;

      // Build reasons
      if (coverage >= 0.9) {
        reasons.push("storeRec.reason.highCoverage");
      } else if (coverage >= 0.6) {
        reasons.push("storeRec.reason.goodCoverage");
      }

      if (costScore <= 0.15) {
        reasons.push("storeRec.reason.lowestPrices");
      } else if (costScore <= 0.35) {
        reasons.push("storeRec.reason.competitivePrices");
      }

      if (data.storeType === "local") {
        reasons.push("storeRec.reason.physicalStore");
      } else if (data.storeType === "both") {
        reasons.push("storeRec.reason.onlineAndPhysical");
      } else {
        reasons.push("storeRec.reason.onlineStore");
      }

      if (totalCost === globalMinTotal && storeEntries.length > 1) {
        reasons.push("storeRec.reason.cheapestOverall");
      }

      const storeItems: StoreItemPrice[] = [];
      for (const [itemName, { price, url }] of data.items) {
        storeItems.push({ itemName, price, url });
      }

      scored.push({
        storeName: data.storeName,
        storeLogo: data.storeLogo,
        storeType: data.storeType,
        items: storeItems,
        coverage,
        totalCost,
        avgPrice: Math.round((totalCost / data.items.size) * 100) / 100,
        score,
        reasons,
      });
    }

    // Sort by score (lower = better)
    scored.sort((a, b) => a.score - b.score);

    return NextResponse.json({ stores: scored.slice(0, 5) });
  } catch (error) {
    console.error("Store recommendation error:", error);
    return NextResponse.json({ stores: [] }, { status: 500 });
  }
}
