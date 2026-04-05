import { Product, Store } from "./types";

export const STORES: Store[] = [
  // US Online
  { id: "amazon-us", name: "Amazon US", logo: "🅰️", country: "US", type: "online", website: "https://amazon.com" },
  { id: "walmart-us", name: "Walmart US", logo: "🟦", country: "US", type: "online", website: "https://walmart.com" },
  { id: "costco-us", name: "Costco US", logo: "🔴", country: "US", type: "online", website: "https://costco.com" },
  { id: "target-us", name: "Target US", logo: "🎯", country: "US", type: "online", website: "https://target.com" },
  // US Local
  { id: "kroger-local", name: "Kroger (Local)", logo: "🏪", country: "US", type: "local" },
  { id: "trader-joes-local", name: "Trader Joe's (Local)", logo: "🌻", country: "US", type: "local" },
  // Canada Online
  { id: "amazon-ca", name: "Amazon CA", logo: "🅰️", country: "CA", type: "online", website: "https://amazon.ca" },
  { id: "walmart-ca", name: "Walmart CA", logo: "🟦", country: "CA", type: "online", website: "https://walmart.ca" },
  { id: "costco-ca", name: "Costco CA", logo: "🔴", country: "CA", type: "online", website: "https://costco.ca" },
  { id: "loblaws-ca", name: "Loblaws", logo: "🍁", country: "CA", type: "online", website: "https://loblaws.ca" },
  // Canada Local
  { id: "nofrills-local", name: "No Frills (Local)", logo: "🟡", country: "CA", type: "local" },
  { id: "freshco-local", name: "FreshCo (Local)", logo: "🥬", country: "CA", type: "local" },
  // China Online
  { id: "jd-cn", name: "JD.com (京东)", logo: "🟥", country: "CN", type: "online", website: "https://jd.com" },
  { id: "taobao-cn", name: "Taobao (淘宝)", logo: "🟧", country: "CN", type: "online", website: "https://taobao.com" },
  { id: "pinduoduo-cn", name: "Pinduoduo (拼多多)", logo: "🟠", country: "CN", type: "online", website: "https://pinduoduo.com" },
  // China Local
  { id: "hema-local", name: "Hema (盒马)", logo: "🐴", country: "CN", type: "local" },
];

export const PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Organic Whole Milk (1 Gallon)",
    category: "Dairy",
    image: "🥛",
    barcode: "0123456789012",
    description: "Organic whole milk, 1 gallon / 3.78L",
    prices: [
      { storeId: "amazon-us", storeName: "Amazon US", storeLogo: "🅰️", country: "US", type: "online", price: 6.49, currency: "USD", unit: "gallon", lastUpdated: "2026-04-02", inStock: true },
      { storeId: "walmart-us", storeName: "Walmart US", storeLogo: "🟦", country: "US", type: "online", price: 5.97, currency: "USD", unit: "gallon", lastUpdated: "2026-04-02", inStock: true },
      { storeId: "costco-us", storeName: "Costco US", storeLogo: "🔴", country: "US", type: "online", price: 5.49, currency: "USD", unit: "gallon", lastUpdated: "2026-04-01", inStock: true },
      { storeId: "target-us", storeName: "Target US", storeLogo: "🎯", country: "US", type: "online", price: 6.29, currency: "USD", unit: "gallon", lastUpdated: "2026-04-02", inStock: true },
      { storeId: "kroger-local", storeName: "Kroger (Local)", storeLogo: "🏪", country: "US", type: "local", price: 5.79, currency: "USD", unit: "gallon", lastUpdated: "2026-04-03", inStock: true },
      { storeId: "amazon-ca", storeName: "Amazon CA", storeLogo: "🅰️", country: "CA", type: "online", price: 8.99, currency: "CAD", unit: "gallon", lastUpdated: "2026-04-01", inStock: true },
      { storeId: "walmart-ca", storeName: "Walmart CA", storeLogo: "🟦", country: "CA", type: "online", price: 7.97, currency: "CAD", unit: "gallon", lastUpdated: "2026-04-02", inStock: true },
      { storeId: "loblaws-ca", storeName: "Loblaws", storeLogo: "🍁", country: "CA", type: "online", price: 8.49, currency: "CAD", unit: "gallon", lastUpdated: "2026-04-02", inStock: true },
      { storeId: "nofrills-local", storeName: "No Frills (Local)", storeLogo: "🟡", country: "CA", type: "local", price: 7.49, currency: "CAD", unit: "gallon", lastUpdated: "2026-04-03", inStock: true },
      { storeId: "jd-cn", storeName: "JD.com (京东)", storeLogo: "🟥", country: "CN", type: "online", price: 39.90, currency: "CNY", unit: "gallon-equiv", lastUpdated: "2026-04-01", inStock: true },
      { storeId: "hema-local", storeName: "Hema (盒马)", storeLogo: "🐴", country: "CN", type: "local", price: 35.00, currency: "CNY", unit: "gallon-equiv", lastUpdated: "2026-04-03", inStock: true },
    ],
  },
  {
    id: "2",
    name: "Large Eggs (12 pack)",
    category: "Dairy",
    image: "🥚",
    barcode: "0234567890123",
    description: "Grade A Large Eggs, dozen",
    prices: [
      { storeId: "amazon-us", storeName: "Amazon US", storeLogo: "🅰️", country: "US", type: "online", price: 4.99, currency: "USD", unit: "dozen", lastUpdated: "2026-04-02", inStock: true },
      { storeId: "walmart-us", storeName: "Walmart US", storeLogo: "🟦", country: "US", type: "online", price: 3.76, currency: "USD", unit: "dozen", lastUpdated: "2026-04-02", inStock: true },
      { storeId: "costco-us", storeName: "Costco US", storeLogo: "🔴", country: "US", type: "online", price: 3.49, currency: "USD", unit: "dozen", lastUpdated: "2026-04-01", inStock: false },
      { storeId: "kroger-local", storeName: "Kroger (Local)", storeLogo: "🏪", country: "US", type: "local", price: 3.99, currency: "USD", unit: "dozen", lastUpdated: "2026-04-03", inStock: true },
      { storeId: "trader-joes-local", storeName: "Trader Joe's (Local)", storeLogo: "🌻", country: "US", type: "local", price: 4.29, currency: "USD", unit: "dozen", lastUpdated: "2026-04-03", inStock: true },
      { storeId: "walmart-ca", storeName: "Walmart CA", storeLogo: "🟦", country: "CA", type: "online", price: 5.47, currency: "CAD", unit: "dozen", lastUpdated: "2026-04-02", inStock: true },
      { storeId: "loblaws-ca", storeName: "Loblaws", storeLogo: "🍁", country: "CA", type: "online", price: 5.99, currency: "CAD", unit: "dozen", lastUpdated: "2026-04-01", inStock: true },
      { storeId: "nofrills-local", storeName: "No Frills (Local)", storeLogo: "🟡", country: "CA", type: "local", price: 4.97, currency: "CAD", unit: "dozen", lastUpdated: "2026-04-03", inStock: true },
      { storeId: "freshco-local", storeName: "FreshCo (Local)", storeLogo: "🥬", country: "CA", type: "local", price: 4.88, currency: "CAD", unit: "dozen", lastUpdated: "2026-04-03", inStock: true },
      { storeId: "taobao-cn", storeName: "Taobao (淘宝)", storeLogo: "🟧", country: "CN", type: "online", price: 18.80, currency: "CNY", unit: "dozen", lastUpdated: "2026-04-02", inStock: true },
      { storeId: "pinduoduo-cn", storeName: "Pinduoduo (拼多多)", storeLogo: "🟠", country: "CN", type: "online", price: 15.90, currency: "CNY", unit: "dozen", lastUpdated: "2026-04-01", inStock: true },
    ],
  },
  {
    id: "3",
    name: "Bananas (1 lb / 0.45 kg)",
    category: "Fruits",
    image: "🍌",
    barcode: "4011",
    description: "Fresh bananas, price per pound",
    prices: [
      { storeId: "walmart-us", storeName: "Walmart US", storeLogo: "🟦", country: "US", type: "online", price: 0.58, currency: "USD", unit: "lb", lastUpdated: "2026-04-02", inStock: true },
      { storeId: "costco-us", storeName: "Costco US", storeLogo: "🔴", country: "US", type: "online", price: 0.49, currency: "USD", unit: "lb", lastUpdated: "2026-04-01", inStock: true },
      { storeId: "target-us", storeName: "Target US", storeLogo: "🎯", country: "US", type: "online", price: 0.65, currency: "USD", unit: "lb", lastUpdated: "2026-04-02", inStock: true },
      { storeId: "kroger-local", storeName: "Kroger (Local)", storeLogo: "🏪", country: "US", type: "local", price: 0.55, currency: "USD", unit: "lb", lastUpdated: "2026-04-03", inStock: true },
      { storeId: "walmart-ca", storeName: "Walmart CA", storeLogo: "🟦", country: "CA", type: "online", price: 0.79, currency: "CAD", unit: "lb", lastUpdated: "2026-04-02", inStock: true },
      { storeId: "nofrills-local", storeName: "No Frills (Local)", storeLogo: "🟡", country: "CA", type: "local", price: 0.69, currency: "CAD", unit: "lb", lastUpdated: "2026-04-03", inStock: true },
      { storeId: "loblaws-ca", storeName: "Loblaws", storeLogo: "🍁", country: "CA", type: "online", price: 0.85, currency: "CAD", unit: "lb", lastUpdated: "2026-04-02", inStock: true },
      { storeId: "jd-cn", storeName: "JD.com (京东)", storeLogo: "🟥", country: "CN", type: "online", price: 5.90, currency: "CNY", unit: "500g", lastUpdated: "2026-04-01", inStock: true },
      { storeId: "hema-local", storeName: "Hema (盒马)", storeLogo: "🐴", country: "CN", type: "local", price: 4.50, currency: "CNY", unit: "500g", lastUpdated: "2026-04-03", inStock: true },
    ],
  },
  {
    id: "4",
    name: "Chicken Breast (Boneless, 1 lb)",
    category: "Meat",
    image: "🍗",
    barcode: "0456789012345",
    description: "Boneless skinless chicken breast, per pound",
    prices: [
      { storeId: "amazon-us", storeName: "Amazon US", storeLogo: "🅰️", country: "US", type: "online", price: 5.99, currency: "USD", unit: "lb", lastUpdated: "2026-04-02", inStock: true },
      { storeId: "walmart-us", storeName: "Walmart US", storeLogo: "🟦", country: "US", type: "online", price: 4.48, currency: "USD", unit: "lb", lastUpdated: "2026-04-02", inStock: true },
      { storeId: "costco-us", storeName: "Costco US", storeLogo: "🔴", country: "US", type: "online", price: 3.99, currency: "USD", unit: "lb", lastUpdated: "2026-04-01", inStock: true },
      { storeId: "kroger-local", storeName: "Kroger (Local)", storeLogo: "🏪", country: "US", type: "local", price: 4.79, currency: "USD", unit: "lb", lastUpdated: "2026-04-03", inStock: true },
      { storeId: "trader-joes-local", storeName: "Trader Joe's (Local)", storeLogo: "🌻", country: "US", type: "local", price: 5.49, currency: "USD", unit: "lb", lastUpdated: "2026-04-03", inStock: true },
      { storeId: "walmart-ca", storeName: "Walmart CA", storeLogo: "🟦", country: "CA", type: "online", price: 8.97, currency: "CAD", unit: "lb", lastUpdated: "2026-04-02", inStock: true },
      { storeId: "costco-ca", storeName: "Costco CA", storeLogo: "🔴", country: "CA", type: "online", price: 7.99, currency: "CAD", unit: "lb", lastUpdated: "2026-04-01", inStock: true },
      { storeId: "loblaws-ca", storeName: "Loblaws", storeLogo: "🍁", country: "CA", type: "online", price: 9.49, currency: "CAD", unit: "lb", lastUpdated: "2026-04-01", inStock: true },
      { storeId: "freshco-local", storeName: "FreshCo (Local)", storeLogo: "🥬", country: "CA", type: "local", price: 7.49, currency: "CAD", unit: "lb", lastUpdated: "2026-04-03", inStock: true },
      { storeId: "jd-cn", storeName: "JD.com (京东)", storeLogo: "🟥", country: "CN", type: "online", price: 29.90, currency: "CNY", unit: "500g", lastUpdated: "2026-04-01", inStock: true },
      { storeId: "taobao-cn", storeName: "Taobao (淘宝)", storeLogo: "🟧", country: "CN", type: "online", price: 25.50, currency: "CNY", unit: "500g", lastUpdated: "2026-04-02", inStock: true },
      { storeId: "hema-local", storeName: "Hema (盒马)", storeLogo: "🐴", country: "CN", type: "local", price: 32.00, currency: "CNY", unit: "500g", lastUpdated: "2026-04-03", inStock: true },
    ],
  },
  {
    id: "5",
    name: "White Rice (5 lb bag)",
    category: "Grains",
    image: "🍚",
    barcode: "0567890123456",
    description: "Long grain white rice, 5 lb bag",
    prices: [
      { storeId: "amazon-us", storeName: "Amazon US", storeLogo: "🅰️", country: "US", type: "online", price: 7.99, currency: "USD", unit: "5lb", lastUpdated: "2026-04-02", inStock: true },
      { storeId: "walmart-us", storeName: "Walmart US", storeLogo: "🟦", country: "US", type: "online", price: 5.98, currency: "USD", unit: "5lb", lastUpdated: "2026-04-02", inStock: true },
      { storeId: "costco-us", storeName: "Costco US", storeLogo: "🔴", country: "US", type: "online", price: 12.49, currency: "USD", unit: "25lb", lastUpdated: "2026-04-01", inStock: true },
      { storeId: "target-us", storeName: "Target US", storeLogo: "🎯", country: "US", type: "online", price: 6.49, currency: "USD", unit: "5lb", lastUpdated: "2026-04-02", inStock: true },
      { storeId: "walmart-ca", storeName: "Walmart CA", storeLogo: "🟦", country: "CA", type: "online", price: 8.97, currency: "CAD", unit: "5lb", lastUpdated: "2026-04-02", inStock: true },
      { storeId: "costco-ca", storeName: "Costco CA", storeLogo: "🔴", country: "CA", type: "online", price: 16.99, currency: "CAD", unit: "25lb", lastUpdated: "2026-04-01", inStock: true },
      { storeId: "nofrills-local", storeName: "No Frills (Local)", storeLogo: "🟡", country: "CA", type: "local", price: 7.99, currency: "CAD", unit: "5lb", lastUpdated: "2026-04-03", inStock: true },
      { storeId: "jd-cn", storeName: "JD.com (京东)", storeLogo: "🟥", country: "CN", type: "online", price: 32.90, currency: "CNY", unit: "5kg", lastUpdated: "2026-04-01", inStock: true },
      { storeId: "taobao-cn", storeName: "Taobao (淘宝)", storeLogo: "🟧", country: "CN", type: "online", price: 28.50, currency: "CNY", unit: "5kg", lastUpdated: "2026-04-02", inStock: true },
      { storeId: "pinduoduo-cn", storeName: "Pinduoduo (拼多多)", storeLogo: "🟠", country: "CN", type: "online", price: 24.90, currency: "CNY", unit: "5kg", lastUpdated: "2026-04-01", inStock: true },
    ],
  },
  {
    id: "6",
    name: "Olive Oil (500ml)",
    category: "Cooking",
    image: "🫒",
    barcode: "0678901234567",
    description: "Extra virgin olive oil, 500ml bottle",
    prices: [
      { storeId: "amazon-us", storeName: "Amazon US", storeLogo: "🅰️", country: "US", type: "online", price: 8.99, currency: "USD", unit: "500ml", lastUpdated: "2026-04-02", inStock: true },
      { storeId: "walmart-us", storeName: "Walmart US", storeLogo: "🟦", country: "US", type: "online", price: 6.47, currency: "USD", unit: "500ml", lastUpdated: "2026-04-02", inStock: true },
      { storeId: "costco-us", storeName: "Costco US", storeLogo: "🔴", country: "US", type: "online", price: 11.99, currency: "USD", unit: "1L", lastUpdated: "2026-04-01", inStock: true },
      { storeId: "trader-joes-local", storeName: "Trader Joe's (Local)", storeLogo: "🌻", country: "US", type: "local", price: 7.99, currency: "USD", unit: "500ml", lastUpdated: "2026-04-03", inStock: true },
      { storeId: "amazon-ca", storeName: "Amazon CA", storeLogo: "🅰️", country: "CA", type: "online", price: 12.49, currency: "CAD", unit: "500ml", lastUpdated: "2026-04-01", inStock: true },
      { storeId: "loblaws-ca", storeName: "Loblaws", storeLogo: "🍁", country: "CA", type: "online", price: 10.99, currency: "CAD", unit: "500ml", lastUpdated: "2026-04-02", inStock: true },
      { storeId: "freshco-local", storeName: "FreshCo (Local)", storeLogo: "🥬", country: "CA", type: "local", price: 9.99, currency: "CAD", unit: "500ml", lastUpdated: "2026-04-03", inStock: true },
      { storeId: "jd-cn", storeName: "JD.com (京东)", storeLogo: "🟥", country: "CN", type: "online", price: 59.90, currency: "CNY", unit: "500ml", lastUpdated: "2026-04-01", inStock: true },
      { storeId: "taobao-cn", storeName: "Taobao (淘宝)", storeLogo: "🟧", country: "CN", type: "online", price: 45.00, currency: "CNY", unit: "500ml", lastUpdated: "2026-04-02", inStock: true },
    ],
  },
  {
    id: "7",
    name: "Bread (White, Sliced Loaf)",
    category: "Bakery",
    image: "🍞",
    barcode: "0789012345678",
    description: "White sliced bread loaf, ~600g",
    prices: [
      { storeId: "walmart-us", storeName: "Walmart US", storeLogo: "🟦", country: "US", type: "online", price: 1.98, currency: "USD", unit: "loaf", lastUpdated: "2026-04-02", inStock: true },
      { storeId: "amazon-us", storeName: "Amazon US", storeLogo: "🅰️", country: "US", type: "online", price: 3.49, currency: "USD", unit: "loaf", lastUpdated: "2026-04-02", inStock: true },
      { storeId: "target-us", storeName: "Target US", storeLogo: "🎯", country: "US", type: "online", price: 2.79, currency: "USD", unit: "loaf", lastUpdated: "2026-04-02", inStock: true },
      { storeId: "kroger-local", storeName: "Kroger (Local)", storeLogo: "🏪", country: "US", type: "local", price: 2.19, currency: "USD", unit: "loaf", lastUpdated: "2026-04-03", inStock: true },
      { storeId: "walmart-ca", storeName: "Walmart CA", storeLogo: "🟦", country: "CA", type: "online", price: 3.47, currency: "CAD", unit: "loaf", lastUpdated: "2026-04-02", inStock: true },
      { storeId: "nofrills-local", storeName: "No Frills (Local)", storeLogo: "🟡", country: "CA", type: "local", price: 2.99, currency: "CAD", unit: "loaf", lastUpdated: "2026-04-03", inStock: true },
      { storeId: "loblaws-ca", storeName: "Loblaws", storeLogo: "🍁", country: "CA", type: "online", price: 3.79, currency: "CAD", unit: "loaf", lastUpdated: "2026-04-02", inStock: true },
      { storeId: "jd-cn", storeName: "JD.com (京东)", storeLogo: "🟥", country: "CN", type: "online", price: 12.90, currency: "CNY", unit: "loaf", lastUpdated: "2026-04-01", inStock: true },
      { storeId: "hema-local", storeName: "Hema (盒马)", storeLogo: "🐴", country: "CN", type: "local", price: 9.90, currency: "CNY", unit: "loaf", lastUpdated: "2026-04-03", inStock: true },
    ],
  },
  {
    id: "8",
    name: "Coca-Cola (12-pack cans)",
    category: "Beverages",
    image: "🥤",
    barcode: "0890123456789",
    description: "Coca-Cola Classic, 12 x 355ml cans",
    prices: [
      { storeId: "amazon-us", storeName: "Amazon US", storeLogo: "🅰️", country: "US", type: "online", price: 7.48, currency: "USD", unit: "12-pack", lastUpdated: "2026-04-02", inStock: true },
      { storeId: "walmart-us", storeName: "Walmart US", storeLogo: "🟦", country: "US", type: "online", price: 6.98, currency: "USD", unit: "12-pack", lastUpdated: "2026-04-02", inStock: true },
      { storeId: "costco-us", storeName: "Costco US", storeLogo: "🔴", country: "US", type: "online", price: 12.99, currency: "USD", unit: "36-pack", lastUpdated: "2026-04-01", inStock: true },
      { storeId: "target-us", storeName: "Target US", storeLogo: "🎯", country: "US", type: "online", price: 7.49, currency: "USD", unit: "12-pack", lastUpdated: "2026-04-02", inStock: true },
      { storeId: "walmart-ca", storeName: "Walmart CA", storeLogo: "🟦", country: "CA", type: "online", price: 8.97, currency: "CAD", unit: "12-pack", lastUpdated: "2026-04-02", inStock: true },
      { storeId: "costco-ca", storeName: "Costco CA", storeLogo: "🔴", country: "CA", type: "online", price: 16.49, currency: "CAD", unit: "36-pack", lastUpdated: "2026-04-01", inStock: true },
      { storeId: "nofrills-local", storeName: "No Frills (Local)", storeLogo: "🟡", country: "CA", type: "local", price: 7.99, currency: "CAD", unit: "12-pack", lastUpdated: "2026-04-03", inStock: true },
      { storeId: "jd-cn", storeName: "JD.com (京东)", storeLogo: "🟥", country: "CN", type: "online", price: 45.90, currency: "CNY", unit: "12-pack", lastUpdated: "2026-04-01", inStock: true },
      { storeId: "taobao-cn", storeName: "Taobao (淘宝)", storeLogo: "🟧", country: "CN", type: "online", price: 39.90, currency: "CNY", unit: "12-pack", lastUpdated: "2026-04-02", inStock: true },
      { storeId: "pinduoduo-cn", storeName: "Pinduoduo (拼多多)", storeLogo: "🟠", country: "CN", type: "online", price: 35.00, currency: "CNY", unit: "12-pack", lastUpdated: "2026-04-01", inStock: true },
    ],
  },
  {
    id: "9",
    name: "Avocados (each)",
    category: "Fruits",
    image: "🥑",
    barcode: "4225",
    description: "Hass avocado, each",
    prices: [
      { storeId: "walmart-us", storeName: "Walmart US", storeLogo: "🟦", country: "US", type: "online", price: 1.12, currency: "USD", unit: "each", lastUpdated: "2026-04-02", inStock: true },
      { storeId: "amazon-us", storeName: "Amazon US", storeLogo: "🅰️", country: "US", type: "online", price: 1.50, currency: "USD", unit: "each", lastUpdated: "2026-04-02", inStock: false },
      { storeId: "costco-us", storeName: "Costco US", storeLogo: "🔴", country: "US", type: "online", price: 7.99, currency: "USD", unit: "6-pack", lastUpdated: "2026-04-01", inStock: true },
      { storeId: "trader-joes-local", storeName: "Trader Joe's (Local)", storeLogo: "🌻", country: "US", type: "local", price: 1.29, currency: "USD", unit: "each", lastUpdated: "2026-04-03", inStock: true },
      { storeId: "walmart-ca", storeName: "Walmart CA", storeLogo: "🟦", country: "CA", type: "online", price: 1.97, currency: "CAD", unit: "each", lastUpdated: "2026-04-02", inStock: true },
      { storeId: "loblaws-ca", storeName: "Loblaws", storeLogo: "🍁", country: "CA", type: "online", price: 2.49, currency: "CAD", unit: "each", lastUpdated: "2026-04-02", inStock: true },
      { storeId: "freshco-local", storeName: "FreshCo (Local)", storeLogo: "🥬", country: "CA", type: "local", price: 1.49, currency: "CAD", unit: "each", lastUpdated: "2026-04-03", inStock: true },
      { storeId: "hema-local", storeName: "Hema (盒马)", storeLogo: "🐴", country: "CN", type: "local", price: 9.90, currency: "CNY", unit: "each", lastUpdated: "2026-04-03", inStock: true },
      { storeId: "jd-cn", storeName: "JD.com (京东)", storeLogo: "🟥", country: "CN", type: "online", price: 12.90, currency: "CNY", unit: "each", lastUpdated: "2026-04-01", inStock: true },
    ],
  },
  {
    id: "10",
    name: "Toothpaste (Colgate, 170g)",
    category: "Personal Care",
    image: "🪥",
    barcode: "0901234567890",
    description: "Colgate Total toothpaste, 170g tube",
    prices: [
      { storeId: "amazon-us", storeName: "Amazon US", storeLogo: "🅰️", country: "US", type: "online", price: 5.49, currency: "USD", unit: "tube", lastUpdated: "2026-04-02", inStock: true },
      { storeId: "walmart-us", storeName: "Walmart US", storeLogo: "🟦", country: "US", type: "online", price: 4.47, currency: "USD", unit: "tube", lastUpdated: "2026-04-02", inStock: true },
      { storeId: "target-us", storeName: "Target US", storeLogo: "🎯", country: "US", type: "online", price: 4.99, currency: "USD", unit: "tube", lastUpdated: "2026-04-02", inStock: true },
      { storeId: "costco-us", storeName: "Costco US", storeLogo: "🔴", country: "US", type: "online", price: 9.99, currency: "USD", unit: "4-pack", lastUpdated: "2026-04-01", inStock: true },
      { storeId: "amazon-ca", storeName: "Amazon CA", storeLogo: "🅰️", country: "CA", type: "online", price: 6.99, currency: "CAD", unit: "tube", lastUpdated: "2026-04-01", inStock: true },
      { storeId: "walmart-ca", storeName: "Walmart CA", storeLogo: "🟦", country: "CA", type: "online", price: 5.47, currency: "CAD", unit: "tube", lastUpdated: "2026-04-02", inStock: true },
      { storeId: "nofrills-local", storeName: "No Frills (Local)", storeLogo: "🟡", country: "CA", type: "local", price: 4.99, currency: "CAD", unit: "tube", lastUpdated: "2026-04-03", inStock: true },
      { storeId: "jd-cn", storeName: "JD.com (京东)", storeLogo: "🟥", country: "CN", type: "online", price: 19.90, currency: "CNY", unit: "tube", lastUpdated: "2026-04-01", inStock: true },
      { storeId: "taobao-cn", storeName: "Taobao (淘宝)", storeLogo: "🟧", country: "CN", type: "online", price: 16.50, currency: "CNY", unit: "tube", lastUpdated: "2026-04-02", inStock: true },
      { storeId: "pinduoduo-cn", storeName: "Pinduoduo (拼多多)", storeLogo: "🟠", country: "CN", type: "online", price: 14.90, currency: "CNY", unit: "tube", lastUpdated: "2026-04-01", inStock: true },
    ],
  },
];

// Build a lookup from storeId → search URL
const STORE_SEARCH_URLS: Record<string, (q: string) => string> = {
  "amazon-us":     (q) => `https://www.amazon.com/s?k=${encodeURIComponent(q)}`,
  "walmart-us":    (q) => `https://www.walmart.com/search?q=${encodeURIComponent(q)}`,
  "costco-us":     (q) => `https://www.costco.com/CatalogSearch?dept=All&keyword=${encodeURIComponent(q)}`,
  "target-us":     (q) => `https://www.target.com/s?searchTerm=${encodeURIComponent(q)}`,
  "kroger-local":  (q) => `https://www.kroger.com/search?query=${encodeURIComponent(q)}`,
  "trader-joes-local": (q) => `https://www.traderjoes.com/home/search?q=${encodeURIComponent(q)}`,
  "amazon-ca":     (q) => `https://www.amazon.ca/s?k=${encodeURIComponent(q)}`,
  "walmart-ca":    (q) => `https://www.walmart.ca/search?q=${encodeURIComponent(q)}`,
  "costco-ca":     (q) => `https://www.costco.ca/CatalogSearch?dept=All&keyword=${encodeURIComponent(q)}`,
  "loblaws-ca":    (q) => `https://www.loblaws.ca/search?search-bar=${encodeURIComponent(q)}`,
  "nofrills-local": (q) => `https://www.nofrills.ca/search?search-bar=${encodeURIComponent(q)}`,
  "freshco-local": (q) => `https://www.freshco.com/search/?search-term=${encodeURIComponent(q)}`,
  "jd-cn":         (q) => `https://search.jd.com/Search?keyword=${encodeURIComponent(q)}`,
  "taobao-cn":     (q) => `https://s.taobao.com/search?q=${encodeURIComponent(q)}`,
  "pinduoduo-cn":  (q) => `https://mobile.yangkeduo.com/search_result.html?search_key=${encodeURIComponent(q)}`,
  "hema-local":    (q) => `https://www.freshhema.com/search?keyword=${encodeURIComponent(q)}`,
};

/** Attach store search URLs to price entries so every row is clickable. */
function enrichWithUrls(product: Product): Product {
  return {
    ...product,
    prices: product.prices.map((p) => {
      if (p.url) return p; // already has a URL (e.g. from SerpAPI)
      const buildUrl = STORE_SEARCH_URLS[p.storeId];
      return buildUrl ? { ...p, url: buildUrl(product.name) } : p;
    }),
  };
}

export function searchProducts(query: string, category?: string, country?: string, storeType?: string): Product[] {
  let results = PRODUCTS;

  if (query) {
    const q = query.toLowerCase();
    results = results.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.barcode === q ||
        p.description.toLowerCase().includes(q)
    );
  }

  if (category && category !== "all") {
    results = results.filter((p) => p.category === category);
  }

  if (country && country !== "all") {
    results = results.map((p) => ({
      ...p,
      prices: p.prices.filter((pr) => pr.country === country),
    })).filter((p) => p.prices.length > 0);
  }

  if (storeType && storeType !== "all") {
    results = results.map((p) => ({
      ...p,
      prices: p.prices.filter((pr) => pr.type === storeType),
    })).filter((p) => p.prices.length > 0);
  }

  return results.map(enrichWithUrls);
}

export function getProductById(id: string): Product | undefined {
  const p = PRODUCTS.find((p) => p.id === id);
  return p ? enrichWithUrls(p) : undefined;
}

export function getCategories(): string[] {
  return [...new Set(PRODUCTS.map((p) => p.category))];
}
