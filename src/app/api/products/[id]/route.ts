import { NextRequest, NextResponse } from "next/server";
import { getProductByIdReal } from "@/lib/price-service";
import { detectLocaleFromRequest } from "@/lib/request-locale";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const localeCode = await detectLocaleFromRequest(request);
  const product = await getProductByIdReal(id, localeCode);

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json(product, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
