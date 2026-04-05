"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/context/LocaleContext";
import { useTranslation } from "@/hooks/useTranslation";

export default function Navbar() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  const NAV_ITEMS = [
    { href: "/", label: t("nav.search"), icon: "🔍" },
    { href: "/budget", label: t("nav.budget"), icon: "🥗" },
    { href: "/flyers", label: t("nav.flyers"), icon: "📰" },
    { href: "/receipts", label: t("nav.receipts"), icon: "🧾" },
    { href: "/watch-list", label: t("nav.watchList"), icon: "👁️" },
    { href: "/shopping-list", label: t("nav.shoppingList"), icon: "🛒" },
    { href: "/party", label: t("nav.party"), icon: "🎉" },
    { href: "/scan", label: t("nav.scan"), icon: "📷" },
  ];

  // Bottom tab bar items (most used)
  const BOTTOM_TABS = [
    { href: "/", label: t("nav.search"), icon: "🔍" },
    { href: "/budget", label: t("nav.budget"), icon: "🥗" },
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
            {!locale.loading && locale.label && (
              <span className="ml-3 px-3 py-1 bg-white/15 rounded-full text-xs font-medium">
                📍 {locale.label} ({locale.symbol})
              </span>
            )}
          </nav>

          {/* Mobile: locale + overflow menu */}
          <div className="flex items-center gap-2 md:hidden">
            {!locale.loading && locale.label && (
              <span className="px-2 py-1 bg-white/15 rounded-full text-xs font-medium">
                📍 {locale.symbol}
              </span>
            )}
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
