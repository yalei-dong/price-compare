const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const outDir = path.join(__dirname, '..', 'public', 'icons');

// Design 1: Shopping cart with price tag
const design1 = `
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#10B981"/>
      <stop offset="100%" style="stop-color:#059669"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="90" fill="url(#bg1)"/>
  <!-- Cart body -->
  <path d="M130 170 L170 170 L220 330 L370 330 L400 200 L195 200" 
        stroke="white" stroke-width="18" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <!-- Cart wheels -->
  <circle cx="240" cy="370" r="22" fill="white"/>
  <circle cx="350" cy="370" r="22" fill="white"/>
  <!-- Price tag -->
  <rect x="290" y="80" width="140" height="90" rx="14" fill="#FCD34D"/>
  <text x="360" y="140" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="48" font-weight="900" fill="#059669">$</text>
  <!-- Down arrow (savings) -->
  <polygon points="360,245 330,215 345,215 345,185 375,185 375,215 390,215" fill="#FCD34D"/>
</svg>`;

// Design 2: Two price tags overlapping with compare arrows
const design2 = `
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#F59E0B"/>
      <stop offset="100%" style="stop-color:#D97706"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="90" fill="url(#bg2)"/>
  <!-- Price tag 1 (left, tilted) -->
  <g transform="translate(120, 130) rotate(-12, 80, 120)">
    <rect x="0" y="0" width="160" height="240" rx="16" fill="white" opacity="0.95"/>
    <circle cx="80" cy="35" r="18" fill="#D97706"/>
    <text x="80" y="150" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="64" font-weight="900" fill="#D97706">$5</text>
  </g>
  <!-- Price tag 2 (right, tilted) -->
  <g transform="translate(232, 130) rotate(12, 80, 120)">
    <rect x="0" y="0" width="160" height="240" rx="16" fill="white" opacity="0.95"/>
    <circle cx="80" cy="35" r="18" fill="#D97706"/>
    <text x="80" y="150" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="64" font-weight="900" fill="#16A34A">$3</text>
  </g>
  <!-- Compare arrows -->
  <path d="M200 400 L170 380 L170 392 L130 392 L130 408 L170 408 L170 420 Z" fill="white"/>
  <path d="M312 400 L342 380 L342 392 L382 392 L382 408 L342 408 L342 420 Z" fill="white"/>
  <!-- Checkmark on cheaper -->
  <circle cx="312" cy="310" r="24" fill="#16A34A"/>
  <path d="M298 310 L308 320 L326 298" stroke="white" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Design 3: Grocery bag with magnifying glass / search
const design3 = `
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#8B5CF6"/>
      <stop offset="100%" style="stop-color:#6D28D9"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="90" fill="url(#bg3)"/>
  <!-- Grocery bag -->
  <path d="M140 200 L140 410 Q140 430 160 430 L290 430 Q310 430 310 410 L310 200 Z" fill="white" opacity="0.95"/>
  <!-- Bag handle -->
  <path d="M175 200 L175 160 Q175 120 225 120 Q275 120 275 160 L275 200" 
        stroke="white" stroke-width="18" fill="none" stroke-linecap="round"/>
  <!-- Apple in bag -->
  <circle cx="200" cy="310" r="30" fill="#EF4444"/>
  <path d="M200 282 L205 270" stroke="#16A34A" stroke-width="4" stroke-linecap="round"/>
  <!-- Carrot in bag -->
  <path d="M250 340 L265 280" stroke="#F97316" stroke-width="14" stroke-linecap="round"/>
  <path d="M262 285 L255 265 M262 285 L272 268" stroke="#16A34A" stroke-width="4" stroke-linecap="round"/>
  <!-- Magnifying glass -->
  <circle cx="370" cy="280" r="60" stroke="white" stroke-width="14" fill="none"/>
  <line x1="410" y1="320" x2="440" y2="355" stroke="white" stroke-width="16" stroke-linecap="round"/>
  <!-- Dollar sign in magnifier -->
  <text x="370" y="300" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="60" font-weight="900" fill="white">$</text>
</svg>`;

async function generate() {
  const designs = [
    { name: 'icon-variant-1.png', svg: design1, label: 'Green cart + price tag' },
    { name: 'icon-variant-2.png', svg: design2, label: 'Yellow compare tags' },
    { name: 'icon-variant-3.png', svg: design3, label: 'Purple bag + search' },
  ];

  for (const d of designs) {
    await sharp(Buffer.from(d.svg)).resize(512, 512).png().toFile(path.join(outDir, d.name));
    console.log(`Created ${d.name} — ${d.label}`);
  }
  console.log('\nAll 3 variants saved to public/icons/');
}

generate().catch(console.error);
