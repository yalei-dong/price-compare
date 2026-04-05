"use client";

import { useState } from "react";

interface ProductImageProps {
  src: string;
  alt: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZES = {
  sm: "w-10 h-10",
  md: "w-16 h-16",
  lg: "w-20 h-20",
  xl: "w-28 h-28",
};

const EMOJI_SIZES = {
  sm: "text-2xl",
  md: "text-4xl",
  lg: "text-5xl",
  xl: "text-6xl",
};

function isUrl(str: string) {
  return str.startsWith("http://") || str.startsWith("https://");
}

export default function ProductImage({ src, alt, size = "md", className = "" }: ProductImageProps) {
  const [errored, setErrored] = useState(false);

  if (!src || (!isUrl(src) && src.length <= 4) || errored) {
    // It's an emoji or image failed to load — render as text
    const emoji = src && !isUrl(src) ? src : "📦";
    return (
      <div
        className={`${SIZES[size]} flex items-center justify-center bg-gray-50 rounded-xl ${className}`}
      >
        <span className={EMOJI_SIZES[size]}>{emoji}</span>
      </div>
    );
  }

  return (
    <div className={`${SIZES[size]} relative rounded-xl overflow-hidden bg-gray-50 flex-shrink-0 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-contain"
        onError={() => setErrored(true)}
      />
    </div>
  );
}
