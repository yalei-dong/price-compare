const fs = require("fs");
const sharp = require("sharp");
const path = require("path");

const ICONS_DIR = path.join(__dirname, "..", "public", "icons");

// Regular icon SVG (rounded corners)
function regularSvg(size) {
  const rx = Math.round(size * 0.195);
  const dollarSize = Math.round(size * 0.41);
  const dollarY = Math.round(size * 0.547);
  const textSize = Math.round(size * 0.107);
  const textY = Math.round(size * 0.8);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#2563eb"/><stop offset="100%" stop-color="#4f46e5"/></linearGradient></defs>
  <rect width="${size}" height="${size}" rx="${rx}" fill="url(#bg)"/>
  <text x="${size/2}" y="${dollarY}" text-anchor="middle" font-size="${dollarSize}" fill="white" font-family="Arial, sans-serif" font-weight="bold">$$</text>
  <text x="${size/2}" y="${textY}" text-anchor="middle" font-size="${textSize}" font-weight="bold" fill="white" font-family="Arial, sans-serif">COMPARE</text>
</svg>`;
}

// Maskable icon SVG (no rounded corners, content in safe zone — inner 80%)
function maskableSvg(size) {
  const pad = Math.round(size * 0.1); // 10% padding each side = 80% safe zone
  const inner = size - pad * 2;
  const dollarSize = Math.round(inner * 0.41);
  const dollarY = pad + Math.round(inner * 0.52);
  const textSize = Math.round(inner * 0.107);
  const textY = pad + Math.round(inner * 0.78);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#2563eb"/><stop offset="100%" stop-color="#4f46e5"/></linearGradient></defs>
  <rect width="${size}" height="${size}" fill="url(#bg)"/>
  <text x="${size/2}" y="${dollarY}" text-anchor="middle" font-size="${dollarSize}" fill="white" font-family="Arial, sans-serif" font-weight="bold">$$</text>
  <text x="${size/2}" y="${textY}" text-anchor="middle" font-size="${textSize}" font-weight="bold" fill="white" font-family="Arial, sans-serif">COMPARE</text>
</svg>`;
}

async function generate() {
  fs.mkdirSync(ICONS_DIR, { recursive: true });

  const sizes = [48, 72, 96, 128, 144, 192, 384, 512];

  // Generate regular PNGs
  for (const size of sizes) {
    const svg = Buffer.from(regularSvg(size));
    await sharp(svg).resize(size, size).png().toFile(path.join(ICONS_DIR, `icon-${size}.png`));
    console.log(`  ✓ icon-${size}.png`);
  }

  // Generate maskable PNGs (192 + 512)
  for (const size of [192, 512]) {
    const svg = Buffer.from(maskableSvg(size));
    await sharp(svg).resize(size, size).png().toFile(path.join(ICONS_DIR, `icon-${size}-maskable.png`));
    console.log(`  ✓ icon-${size}-maskable.png`);
  }

  // Keep SVGs too
  fs.writeFileSync(path.join(ICONS_DIR, "icon-192.svg"), regularSvg(192));
  fs.writeFileSync(path.join(ICONS_DIR, "icon-512.svg"), regularSvg(512));
  console.log("  ✓ SVGs updated");

  console.log("\nAll icons generated!");
}

generate().catch(console.error);
