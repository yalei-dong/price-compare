const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const BASE_URL = "https://price-compare-gold.vercel.app";
const OUT_DIR = path.join(__dirname, "..", "screenshots");

// 10-inch tablet: 1920x1200 landscape → 9:16 portrait = 1200x1920 won't work
// Requirements: 16:9 or 9:16, each side between 1080-7680px
const TABLET_10 = { width: 1920, height: 1080, deviceScaleFactor: 1 }; // 16:9 landscape

const PAGES = [
  { name: "home", url: "/", wait: 8000 },
  { name: "ai-deals", url: "/ai-deals", wait: 3000 },
  { name: "budget", url: "/budget", wait: 3000 },
  { name: "flyers", url: "/flyers", wait: 3000 },
];

async function takeScreenshots() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  for (const pg of PAGES) {
    const page = await browser.newPage();
    await page.setViewport(TABLET_10);
    console.log(`Tablet 10-inch: ${pg.name}...`);
    await page.goto(`${BASE_URL}${pg.url}`, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise((r) => setTimeout(r, pg.wait));
    await page.screenshot({
      path: path.join(OUT_DIR, `tablet10-${pg.name}.png`),
      fullPage: false,
    });
    await page.close();
  }

  await browser.close();
  console.log(`\nDone! 10-inch tablet screenshots saved to: ${OUT_DIR}`);
}

takeScreenshots().catch(console.error);
