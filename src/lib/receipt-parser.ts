/**
 * Receipt OCR text parser — extracts store name and line items (name + price)
 * from raw OCR text of grocery receipts.
 *
 * Handles common formats:
 *   ITEM NAME           $1.99
 *   ITEM NAME     1.99
 *   ITEM NAME   2 @ $1.99   3.98
 *   ITEM NAME            1.49 F
 */

export interface ReceiptItem {
  name: string;
  price: number;
  quantity: number;
}

export interface ParsedReceipt {
  storeName: string;
  date: string;       // YYYY-MM-DD
  items: ReceiptItem[];
  total: number | null;
  rawText: string;
}

// Known store name patterns (case-insensitive)
const STORE_PATTERNS: [RegExp, string][] = [
  [/walmart/i, "Walmart"],
  [/costco/i, "Costco"],
  [/kroger/i, "Kroger"],
  [/safeway/i, "Safeway"],
  [/whole\s*foods/i, "Whole Foods"],
  [/trader\s*joe/i, "Trader Joe's"],
  [/target/i, "Target"],
  [/aldi/i, "Aldi"],
  [/lidl/i, "Lidl"],
  [/publix/i, "Publix"],
  [/h[\s-]*e[\s-]*b\b/i, "H-E-B"],
  [/meijer/i, "Meijer"],
  [/food\s*lion/i, "Food Lion"],
  [/loblaws/i, "Loblaws"],
  [/no\s*frills/i, "No Frills"],
  [/food\s*basics/i, "Food Basics"],
  [/metro\b/i, "Metro"],
  [/sobeys/i, "Sobeys"],
  [/freshco/i, "FreshCo"],
  [/real\s*canadian/i, "Real Canadian Superstore"],
  [/superstore/i, "Real Canadian Superstore"],
  [/t&t|t\s*&\s*t/i, "T&T Supermarket"],
  [/save[\s-]*on/i, "Save-On-Foods"],
  [/shoppers/i, "Shoppers Drug Mart"],
  [/dollarama/i, "Dollarama"],
  [/giant\s*tiger/i, "Giant Tiger"],
  [/tesco/i, "Tesco"],
  [/asda/i, "ASDA"],
  [/sainsbury/i, "Sainsbury's"],
  [/morrison/i, "Morrisons"],
  [/woolworths/i, "Woolworths"],
  [/coles\b/i, "Coles"],
];

// Lines to skip (receipt noise)
const SKIP_PATTERNS = [
  /^\s*$/,
  /^[-=*_]{3,}/,
  /\b(subtotal|sub\s*total)\b/i,
  /\b(tax|hst|gst|pst)\b/i,
  /\btotal\b/i,
  /\b(visa|mastercard|debit|credit|cash|change|tend)\b/i,
  /\b(thank\s*you|receipt|transaction|terminal|approved)\b/i,
  /\b(store\s*#|st\s*#|cashier|register|ref|auth)\b/i,
  /\b(points|reward|savings|you\s*saved)\b/i,
  /^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/,  // dates
  /^\d{2}:\d{2}/,  // times
  /^tel|phone|fax|www\.|http/i,
  /^\d{5,}/,  // long numbers (addresses, phone numbers)
];

// Price pattern: captures dollar amount at end of line
// Matches: $1.99, 1.99, 1.99 F, 1.99 T, 1.99-, etc.
const PRICE_REGEX = /\$?\s*(\d{1,5}\.\d{2})\s*[A-Z]?\s*[-]?\s*$/;

// Quantity pattern: "2 @ $1.99" or "2 x $1.99" or "2@1.99"
const QTY_REGEX = /(\d+)\s*[@xX]\s*\$?\s*(\d+\.\d{2})/;

// Total line
const TOTAL_REGEX = /\btotal\b.*?\$?\s*(\d{1,6}\.\d{2})/i;

// Date patterns
const DATE_REGEXES = [
  /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,          // 2026-04-04
  /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,          // 04/04/2026
  /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})\b/,        // 04/04/26
];

function extractStoreName(text: string): string {
  const firstLines = text.split("\n").slice(0, 8).join(" ");
  for (const [pattern, name] of STORE_PATTERNS) {
    if (pattern.test(firstLines)) return name;
  }
  // Use the first non-empty line as store name
  const first = text.split("\n").find((l) => l.trim().length > 2);
  return first?.trim().slice(0, 40) || "Unknown Store";
}

function extractDate(text: string): string {
  for (const regex of DATE_REGEXES) {
    const m = text.match(regex);
    if (m) {
      // Normalize to YYYY-MM-DD
      if (m[1].length === 4) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
      const year = m[3].length === 2 ? `20${m[3]}` : m[3];
      return `${year}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
    }
  }
  return new Date().toISOString().split("T")[0];
}

function shouldSkipLine(line: string): boolean {
  return SKIP_PATTERNS.some((p) => p.test(line.trim()));
}

function cleanItemName(name: string): string {
  return name
    .replace(/\d+\s*[@xX]\s*\$?\s*\d+\.\d{2}/, "") // remove qty @ price
    .replace(/\$?\s*\d+\.\d{2}.*$/, "")              // remove trailing price
    .replace(/^\d+\s+/, "")                           // remove leading item number
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function parseReceipt(rawText: string): ParsedReceipt {
  const storeName = extractStoreName(rawText);
  const date = extractDate(rawText);
  const items: ReceiptItem[] = [];
  let total: number | null = null;

  const lines = rawText.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || shouldSkipLine(trimmed)) {
      // Check for total
      const totalMatch = trimmed.match(TOTAL_REGEX);
      if (totalMatch) {
        total = parseFloat(totalMatch[1]);
      }
      continue;
    }

    // Check for price on line
    const priceMatch = trimmed.match(PRICE_REGEX);
    if (!priceMatch) continue;

    const price = parseFloat(priceMatch[1]);
    if (price <= 0 || price > 9999) continue;

    // Check for quantity
    const qtyMatch = trimmed.match(QTY_REGEX);
    let quantity = 1;
    if (qtyMatch) {
      quantity = parseInt(qtyMatch[1], 10);
    }

    const name = cleanItemName(trimmed);
    if (name.length < 2) continue;

    items.push({ name, price, quantity });
  }

  return { storeName, date, items, total, rawText };
}

/**
 * Normalize item names for matching across receipts.
 * E.g., "COCO MILK 400ML" and "Coconut Milk" -> "coconut milk"
 */
export function normalizeItemName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\b\d+\s*(ml|l|oz|lb|kg|g|ct|pk|ea)\b/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}
