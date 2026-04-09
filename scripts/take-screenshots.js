const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const BASE_URL = "https://price-compare-gold.vercel.app";
const OUT_DIR = path.join(__dirname, "..", "screenshots");

// Phone: 1080x1920 (9:16)
const PHONE = { width: 1080, height: 1920, deviceScaleFactor: 1 };
// Tablet 7-inch: 1200x1920 (roughly 10:16)
const TABLET = { width: 1200, height: 1920, deviceScaleFactor: 1 };

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

  // Phone screenshots
  for (const pg of PAGES) {
    const page = await browser.newPage();
    await page.setViewport(PHONE);
    console.log(`Phone: ${pg.name}...`);
    await page.goto(`${BASE_URL}${pg.url}`, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise((r) => setTimeout(r, pg.wait));
    await page.screenshot({
      path: path.join(OUT_DIR, `phone-${pg.name}.png`),
      fullPage: false,
    });
    await page.close();
  }

  // Tablet screenshots
  for (const pg of PAGES) {
    const page = await browser.newPage();
    await page.setViewport(TABLET);
    console.log(`Tablet: ${pg.name}...`);
    await page.goto(`${BASE_URL}${pg.url}`, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise((r) => setTimeout(r, pg.wait));
    await page.screenshot({
      path: path.join(OUT_DIR, `tablet-${pg.name}.png`),
      fullPage: false,
    });
    await page.close();
  }

  await browser.close();
  console.log(`\nDone! Screenshots saved to: ${OUT_DIR}`);
}

takeScreenshots().catch(console.error);
