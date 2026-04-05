import { NextRequest, NextResponse } from "next/server";
import { fetchOpenFoodFactsProduct, fetchPricesForLocale } from "@/lib/price-service";
import { Product } from "@/lib/types";
import { detectLocaleFromRequest } from "@/lib/request-locale";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const barcode = searchParams.get("code");

  if (!barcode || barcode.trim().length === 0) {
    return NextResponse.json({ error: "Barcode is required" }, { status: 400 });
  }

  const localeCode = await detectLocaleFromRequest(request);

  // 1. Check mock data first (by barcode)
  const { PRODUCTS } = await import("@/lib/mock-data");
  const mockMatch = PRODUCTS.find((p) => p.barcode === barcode.trim());

  // 2. Look up product info from Open Food Facts (free, no key needed)
  const offProduct = await fetchOpenFoodFactsProduct(barcode.trim());

  // 3. Determine product name for price search
  const productName = offProduct?.name || mockMatch?.name;

  if (!productName) {
    return NextResponse.json({
      error: "Product not found for this barcode",
      barcode: barcode.trim(),
    }, { status: 404 });
  }

  // 4. Fetch live prices for the user's locale
  const livePrices = await fetchPricesForLocale(productName, localeCode);

  // 5. Build the combined product, filtering mock prices to locale country
  const mockPrices = (mockMatch?.prices || []).filter((p) => p.country === localeCode);
  const product: Product = {
    id: mockMatch?.id || `barcode-${barcode}`,
    name: productName,
    category: offProduct?.category || mockMatch?.category || "Grocery",
    image: offProduct?.image || mockMatch?.image || "📦",
    barcode: barcode.trim(),
    description: offProduct?.description || mockMatch?.description || productName,
    prices: [
      ...livePrices,
      ...mockPrices,
    ],
  };

  return NextResponse.json(product);
}
