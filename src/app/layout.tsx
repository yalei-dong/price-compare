import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Providers from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#2563eb",
};

export const metadata: Metadata = {
  title: "PriceCompare - Compare Grocery Prices Across US, Canada & China",
  description:
    "Compare product prices across Amazon, Costco, Walmart, and local stores in the US, Canada, and China. Perfect for grocery shoppers and online buyers.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PriceCompare",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-full flex flex-col bg-gray-50">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="bg-gray-800 text-gray-400 text-center py-4 text-sm space-y-1">
            <p>PriceCompare &copy; 2026 &mdash; Compare grocery prices worldwide</p>
            <p className="space-x-3">
              <a href="/privacy" className="hover:text-gray-200 underline">Privacy Policy</a>
              <a href="/terms" className="hover:text-gray-200 underline">Terms of Service</a>
            </p>
          </footer>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
