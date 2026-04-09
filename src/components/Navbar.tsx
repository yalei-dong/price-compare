"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/context/LocaleContext";
import { useTranslation } from "@/hooks/useTranslation";

export default function Navbar() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [postalInput, setPostalInput] = useState("");
  const [postalError, setPostalError] = useState("");
  const locationRef = useRef<HTMLDivElement>(null);

  // Close location popover on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) {
        setLocationOpen(false);
      }
    }
    if (locationOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [locationOpen]);

  function handlePostalSubmit() {
    const code = postalInput.trim();
    if (!code) return;
    setPostalError("");
    locale.setPostalCode(code);
    setLocationOpen(false);
    setPostalInput("");
  }

  function handlePostalClear() {
    locale.clearPostalCode();
    setPostalInput("");
    setPostalError("");
    setLocationOpen(false);
  }

  const locationDisplay = locale.city
    ? `${locale.city}, ${locale.countryCode}`
    : locale.label;

  const locationBadge = (
    <div className="relative" ref={locationRef}>
      <button
        onClick={() => setLocationOpen(!locationOpen)}
        className="px-3 py-1 bg-white/15 rounded-full text-xs font-medium hover:bg-white/25 transition-colors cursor-pointer"
      >
        📍 {locationDisplay} ({locale.symbol})
        <span className="ml-1 opacity-70">▾</span>
      </button>

      {locationOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-[60] text-gray-800">
          <p className="text-sm font-semibold mb-1">Set your location</p>
          <p className="text-xs text-gray-500 mb-3">
            Enter postal/zip code for more accurate local prices
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={postalInput}
              onChange={(e) => setPostalInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handlePostalSubmit()}
              placeholder="e.g. M5V 1J2 or 90210"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              onClick={handlePostalSubmit}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Set
            </button>
          </div>
          {postalError && (
            <p className="text-xs text-red-500 mt-1">{postalError}</p>
          )}
          {locale.postalCode && (
            <button
              onClick={handlePostalClear}
              className="mt-2 text-xs text-blue-600 hover:underline"
            >
              Reset to auto-detect
            </button>
          )}
          {locale.postalCode && (
            <p className="mt-1 text-xs text-gray-400">
              Currently set: {locale.postalCode}
            </p>
          )}
        </div>
      )}
    </div>
  );

  const mobileLocationBadge = (
    <div className="relative" ref={locationOpen ? undefined : locationRef}>
      <button
        onClick={() => setLocationOpen(!locationOpen)}
        className="px-2 py-1 bg-white/15 rounded-full text-xs font-medium hover:bg-white/25 transition-colors"
      >
        📍 {locale.city ? `${locale.city}` : locale.symbol}
        <span className="ml-0.5 opacity-70">▾</span>
      </button>
    </div>
  );

  const NAV_ITEMS = [
    { href: "/", label: t("nav.search"), icon: "🔍" },
    { href: "/ai-deals", label: "AI Deals", icon: "🤖" },
    { href: "/budget", label: t("nav.budget"), icon: "🥗" },
    { href: "/flyers", label: t("nav.flyers"), icon: "📰" },
    { href: "/clipped", label: "Clipped", icon: "✂️" },
    { href: "/stores", label: "Stores", icon: "📍" },
    { href: "/receipts", label: t("nav.receipts"), icon: "🧾" },
    { href: "/watch-list", label: t("nav.watchList"), icon: "👁️" },
    { href: "/shopping-list", label: t("nav.shoppingList"), icon: "🛒" },
    { href: "/party", label: t("nav.party"), icon: "🎉" },
    { href: "/scan", label: t("nav.scan"), icon: "📷" },
  ];

  // Bottom tab bar items (most used)
  const BOTTOM_TABS = [
    { href: "/", label: t("nav.search"), icon: "🔍" },
    { href: "/ai-deals", label: "AI Deals", icon: "🤖" },
    { href: "/flyers", label: t("nav.flyers"), icon: "📰" },
    { href: "/watch-list", label: t("nav.watchList"), icon: "👁️" },
    { href: "/shopping-list", label: t("nav.shoppingList"), icon: "🛒" },
  ];

  // Overflow items for hamburger menu
  const OVERFLOW_ITEMS = NAV_ITEMS.filter(
    (item) => !BOTTOM_TABS.some((tab) => tab.href === item.href)
  );

  return (
    <>
      {/* Top header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <span className="text-2xl">💰</span>
            <span>PriceCompare</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? "bg-white/20 text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className="mr-1">{item.icon}</span>
                {item.label}
              </Link>
            ))}
            {!locale.loading && locale.label && locationBadge}
          </nav>

          {/* Mobile: locale + overflow menu */}
          <div className="flex items-center gap-2 md:hidden">
            {!locale.loading && locale.label && mobileLocationBadge}
            {OVERFLOW_ITEMS.length > 0 && (
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Toggle menu"
              >
                {menuOpen ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Mobile overflow menu (only extra items not in bottom tabs) */}
        {menuOpen && (
          <nav className="md:hidden border-t border-white/20 px-4 py-2 flex flex-wrap gap-1">
            {OVERFLOW_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? "bg-white/20 text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
        <div className="flex items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)]">
          {BOTTOM_TABS.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center justify-center py-2 px-1 min-w-0 flex-1 transition-colors ${
                  isActive
                    ? "text-blue-600"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <span className={`text-xl leading-none mb-0.5 ${isActive ? "scale-110" : ""} transition-transform`}>
                  {tab.icon}
                </span>
                <span className={`text-[10px] font-medium truncate w-full text-center ${isActive ? "text-blue-600" : "text-gray-500"}`}>
                  {tab.label}
                </span>
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-600 rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
