const sharp = require('sharp');
const path = require('path');

const outDir = path.join(__dirname, '..', 'public', 'icons');

const iconSvg = `
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#10B981"/>
      <stop offset="100%" style="stop-color:#059669"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="90" fill="url(#bg1)"/>
  <path d="M130 170 L170 170 L220 330 L370 330 L400 200 L195 200" 
        stroke="white" stroke-width="18" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="240" cy="370" r="22" fill="white"/>
  <circle cx="350" cy="370" r="22" fill="white"/>
  <rect x="290" y="80" width="140" height="90" rx="14" fill="#FCD34D"/>
  <text x="360" y="140" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="48" font-weight="900" fill="#059669">$</text>
  <polygon points="360,245 330,215 345,215 345,185 375,185 375,215 390,215" fill="#FCD34D"/>
</svg>`;

const maskableSvg = `
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#10B981"/>
      <stop offset="100%" style="stop-color:#059669"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg1)"/>
  <path d="M150 185 L185 185 L230 330 L365 330 L390 210 L210 210" 
        stroke="white" stroke-width="16" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="248" cy="365" r="20" fill="white"/>
  <circle cx="348" cy="365" r="20" fill="white"/>
  <rect x="295" y="100" width="125" height="80" rx="12" fill="#FCD34D"/>
  <text x="358" y="155" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="44" font-weight="900" fill="#059669">$</text>
  <polygon points="358,240 332,214 345,214 345,188 371,188 371,214 384,214" fill="#FCD34D"/>
</svg>`;

const sizes = [48, 72, 96, 128, 144, 192, 384, 512];

async function generate() {
  for (const s of sizes) {
    await sharp(Buffer.from(iconSvg)).resize(s, s).png().toFile(path.join(outDir, `icon-${s}.png`));
    console.log(`icon-${s}.png`);
  }
  for (const s of [192, 512]) {
    await sharp(Buffer.from(maskableSvg)).resize(s, s).png().toFile(path.join(outDir, `icon-${s}-maskable.png`));
    console.log(`icon-${s}-maskable.png`);
  }
  console.log('Done — all icons regenerated with Design 1');
}

generate().catch(console.error);
