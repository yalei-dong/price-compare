import { NextRequest, NextResponse } from "next/server";
import { getLocaleConfig } from "@/lib/locale";
import { detectLocaleFromRequest, detectGeoFromRequest } from "@/lib/request-locale";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const tzHint = url.searchParams.get("tzHint");

  let geo: { country: string; region?: string; city?: string } = { country: "US" };
  try {
    geo = await detectGeoFromRequest(request);
  } catch {
    // Geo detection failed (e.g. localhost) — use defaults
  }
  let countryCode = geo.country || "US";

  // If geo-IP returned the default "US" and the browser sent a timezone hint,
  // prefer the timezone hint — it's more reliable on localhost/VPN/corporate networks.
  if (countryCode === "US" && tzHint && /^[A-Z]{2}$/i.test(tzHint)) {
    const hintCode = tzHint.toUpperCase();
    if (hintCode !== "US") {
      countryCode = hintCode;
    }
  }

  const locale = getLocaleConfig(countryCode);

  return NextResponse.json({
    countryCode: locale.code,
    currency: locale.currency,
    symbol: locale.symbol,
    label: locale.label,
    lang: locale.lang,
    city: geo.city || "",
  });
}
