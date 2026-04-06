import { NextRequest } from "next/server";
import { detectCountryFromIP, detectGeoFromIP, GeoIPResult } from "./locale";

/** Returns true for loopback / private IPs that geo-IP APIs cannot resolve. */
function isPrivateIP(ip: string): boolean {
  return (
    ip === "::1" ||
    ip === "127.0.0.1" ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ||
    ip.startsWith("fc") ||
    ip.startsWith("fd")
  );
}

/** Extract client IP from standard proxy / Next.js headers.
 *  Returns null for private/loopback IPs so the geo-IP API
 *  falls back to using the server's outgoing public IP. */
export function getClientIP(request: NextRequest): string | null {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const ip = xff.split(",")[0].trim();
    if (!isPrivateIP(ip)) return ip;
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP && !isPrivateIP(realIP.trim())) return realIP.trim();

  return null;
}

/** Detect locale country code from request. */
export async function detectLocaleFromRequest(request: NextRequest): Promise<string> {
  const url = new URL(request.url);
  const explicit = url.searchParams.get("locale");
  if (explicit && /^[A-Z]{2}$/i.test(explicit)) return explicit.toUpperCase();

  const clientIP = getClientIP(request);
  return detectCountryFromIP(clientIP);
}

/** Detect full geo info (country + city + region) from request. */
export async function detectGeoFromRequest(request: NextRequest): Promise<GeoIPResult> {
  const url = new URL(request.url);
  const explicit = url.searchParams.get("locale");
  if (explicit && /^[A-Z]{2}$/i.test(explicit)) {
    return { country: explicit.toUpperCase() };
  }

  const clientIP = getClientIP(request);
  return detectGeoFromIP(clientIP);
}
