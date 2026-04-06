import { NextRequest, NextResponse } from "next/server";
import { getLocaleConfig } from "@/lib/locale";

// GET /api/postal-lookup?code=M5V1J2  or  ?code=90210
// Uses zippopotam.us (free, no key needed) to resolve postal/zip → city + country

export async function GET(request: NextRequest) {
  const code = new URL(request.url).searchParams.get("code")?.trim();
  if (!code || code.length < 3) {
    return NextResponse.json({ error: "Invalid postal/zip code" }, { status: 400 });
  }

  // Normalize: remove spaces for lookup
  const clean = code.replace(/\s+/g, "").toUpperCase();

  // Detect country from format
  let country = "";
  if (/^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(clean) || /^[A-Z]\d[A-Z]$/.test(clean)) {
    country = "CA"; // Canadian postal code (A1A1A1 or A1A)
  } else if (/^\d{5}(-\d{4})?$/.test(clean)) {
    country = "US"; // US zip code
  } else if (/^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i.test(clean)) {
    country = "GB"; // UK postcode
  } else if (/^\d{4}$/.test(clean)) {
    country = "AU"; // Australian postcode (4 digits)
  }

  if (!country) {
    // Try US first, then CA
    const result = await tryLookup("US", clean) || await tryLookup("CA", clean);
    if (result) return NextResponse.json(result);
    return NextResponse.json({ error: "Could not resolve postal/zip code" }, { status: 404 });
  }

  const result = await tryLookup(country, clean);
  if (result) return NextResponse.json(result);

  return NextResponse.json({ error: "Could not resolve postal/zip code" }, { status: 404 });
}

async function tryLookup(country: string, code: string) {
  // For Canadian codes, API expects first 3 chars only
  const lookupCode = country === "CA" ? code.slice(0, 3) : code;
  const countryLower = country.toLowerCase();

  try {
    const res = await fetch(
      `https://api.zippopotam.us/${countryLower}/${lookupCode}`,
      { next: { revalidate: 86400 } } // cache 24h
    );
    if (!res.ok) return null;

    const data = await res.json();
    const place = data.places?.[0];
    if (!place) return null;

    const city = place["place name"] || "";
    const region = place["state abbreviation"] || place.state || "";
    const countryCode = data["country abbreviation"] || country;

    const locale = getLocaleConfig(countryCode);

    return {
      city,
      region,
      countryCode: locale.code,
      currency: locale.currency,
      symbol: locale.symbol,
      label: city ? `${city}, ${locale.label}` : locale.label,
      lang: locale.lang,
    };
  } catch {
    return null;
  }
}
