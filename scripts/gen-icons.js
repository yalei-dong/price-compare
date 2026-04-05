const fs = require("fs");

const svg192 = `<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192">
  <defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#2563eb"/><stop offset="100%" stop-color="#4f46e5"/></linearGradient></defs>
  <rect width="192" height="192" rx="40" fill="url(#bg)"/>
  <text x="96" y="105" text-anchor="middle" font-size="80" fill="white" font-family="Arial">$$</text>
  <text x="96" y="155" text-anchor="middle" font-size="20" font-weight="bold" fill="white" font-family="Arial">COMPARE</text>
</svg>`;

const svg512 = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#2563eb"/><stop offset="100%" stop-color="#4f46e5"/></linearGradient></defs>
  <rect width="512" height="512" rx="100" fill="url(#bg)"/>
  <text x="256" y="280" text-anchor="middle" font-size="210" fill="white" font-family="Arial">$$</text>
  <text x="256" y="410" text-anchor="middle" font-size="55" font-weight="bold" fill="white" font-family="Arial">COMPARE</text>
</svg>`;

fs.writeFileSync("public/icons/icon-192.svg", svg192);
fs.writeFileSync("public/icons/icon-512.svg", svg512);
console.log("SVG icons written");
