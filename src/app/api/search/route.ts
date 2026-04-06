import { NextRequest, NextResponse } from "next/server";
import { searchProductsReal } from "@/lib/price-service";
import { detectGeoFromRequest } from "@/lib/request-locale";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const category = searchParams.get("category") || undefined;
  const storeType = searchParams.get("storeType") || undefined;
  const cityOverride = searchParams.get("city") || undefined;
  const regionOverride = searchParams.get("region") || undefined;

  let geo: { country: string; city?: string; region?: string };
  try {
    geo = await detectGeoFromRequest(request);
  } catch {
    geo = { country: "US" };
  }

  // Apply client-side postal code override if provided
  if (cityOverride) {
    geo.city = cityOverride;
    if (regionOverride) geo.region = regionOverride;
  }

  const { products, categories, source } = await searchProductsReal(
    query,
    category,
    storeType,
    geo.country,
    geo
  );

  return NextResponse.json({
    products,
    categories,
    source,
    locale: geo.country,
    metro: geo.city || undefined,
  });
}
