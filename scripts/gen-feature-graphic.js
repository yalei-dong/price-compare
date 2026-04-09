const sharp = require("sharp");
const path = require("path");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2563eb"/>
      <stop offset="100%" stop-color="#4f46e5"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="500" fill="url(#bg)"/>
  <text x="512" y="200" text-anchor="middle" font-size="140" fill="white" font-family="Arial,sans-serif" font-weight="bold">$$</text>
  <text x="512" y="320" text-anchor="middle" font-size="80" font-weight="bold" fill="white" font-family="Arial,sans-serif">COMPARE</text>
  <text x="512" y="410" text-anchor="middle" font-size="30" fill="rgba(255,255,255,0.8)" font-family="Arial,sans-serif">Compare Grocery Prices Across Stores</text>
</svg>`;

sharp(Buffer.from(svg))
  .resize(1024, 500)
  .png()
  .toFile(path.join(__dirname, "..", "public", "icons", "feature-graphic.png"))
  .then(() => console.log("Done: public/icons/feature-graphic.png"));
