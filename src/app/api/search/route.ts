import { NextRequest, NextResponse } from "next/server";
import { searchProductsReal } from "@/lib/price-service";
import { detectLocaleFromRequest } from "@/lib/request-locale";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const category = searchParams.get("category") || undefined;
  const storeType = searchParams.get("storeType") || undefined;

  const localeCode = await detectLocaleFromRequest(request);

  const { products, categories, source } = await searchProductsReal(
    query,
    category,
    storeType,
    localeCode
  );

  return NextResponse.json({ products, categories, source, locale: localeCode });
}
