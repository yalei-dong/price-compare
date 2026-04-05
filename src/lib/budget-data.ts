// Healthy grocery items with approximate USD base prices.
// Prices are converted to the user's locale currency at runtime.

export type BudgetCategory = "protein" | "grains" | "produce" | "dairy" | "pantry" | "frozen";

export interface BudgetItem {
  id: string;
  name: string;            // English name (used as search term too)
  category: BudgetCategory;
  basePrice: number;       // approximate price in USD
  unit: string;            // e.g. "1 kg", "dozen", "500g"
  emoji: string;
  priority: number;        // 1 = essential, 2 = recommended, 3 = nice-to-have
  healthy: boolean;
  upgradeOf?: string;      // id of the essential item this upgrades (for premium tier)
}

// Rough exchange rates from USD (for budget estimation only)
const FX_FROM_USD: Record<string, number> = {
  USD: 1,
  CAD: 1.37,
  CNY: 7.25,
  GBP: 0.79,
  AUD: 1.55,
  INR: 83.5,
  JPY: 155,
  KRW: 1340,
  EUR: 0.92,
  MXN: 17.2,
  BRL: 5.0,
};

const ITEMS: BudgetItem[] = [
  // Protein
  { id: "b-chicken", name: "Chicken Breast", category: "protein", basePrice: 6.99, unit: "1 kg", emoji: "🍗", priority: 1, healthy: true },
  { id: "b-eggs", name: "Eggs", category: "protein", basePrice: 3.49, unit: "dozen", emoji: "🥚", priority: 1, healthy: true },
  { id: "b-lentils", name: "Lentils", category: "protein", basePrice: 2.29, unit: "500g", emoji: "🫘", priority: 1, healthy: true },
  { id: "b-canned-tuna", name: "Canned Tuna", category: "protein", basePrice: 1.99, unit: "can", emoji: "🐟", priority: 2, healthy: true },
  { id: "b-tofu", name: "Tofu", category: "protein", basePrice: 2.49, unit: "400g", emoji: "🧈", priority: 2, healthy: true },
  { id: "b-ground-beef", name: "Ground Beef (lean)", category: "protein", basePrice: 7.49, unit: "1 kg", emoji: "🥩", priority: 3, healthy: true },
  { id: "b-salmon", name: "Salmon Fillet", category: "protein", basePrice: 9.99, unit: "500g", emoji: "🐠", priority: 3, healthy: true },

  // Grains & Carbs
  { id: "b-rice", name: "Brown Rice", category: "grains", basePrice: 3.99, unit: "2 kg", emoji: "🍚", priority: 1, healthy: true },
  { id: "b-oats", name: "Rolled Oats", category: "grains", basePrice: 3.49, unit: "1 kg", emoji: "🥣", priority: 1, healthy: true },
  { id: "b-bread", name: "Whole Wheat Bread", category: "grains", basePrice: 2.99, unit: "loaf", emoji: "🍞", priority: 1, healthy: true },
  { id: "b-pasta", name: "Whole Wheat Pasta", category: "grains", basePrice: 1.79, unit: "500g", emoji: "🍝", priority: 2, healthy: true },
  { id: "b-potatoes", name: "Potatoes", category: "grains", basePrice: 3.49, unit: "2 kg", emoji: "🥔", priority: 2, healthy: true },
  { id: "b-quinoa", name: "Quinoa", category: "grains", basePrice: 5.99, unit: "500g", emoji: "🌾", priority: 3, healthy: true },

  // Produce
  { id: "b-bananas", name: "Bananas", category: "produce", basePrice: 1.49, unit: "bunch", emoji: "🍌", priority: 1, healthy: true },
  { id: "b-apples", name: "Apples", category: "produce", basePrice: 3.99, unit: "1 kg", emoji: "🍎", priority: 1, healthy: true },
  { id: "b-spinach", name: "Spinach", category: "produce", basePrice: 2.99, unit: "bunch", emoji: "🥬", priority: 1, healthy: true },
  { id: "b-carrots", name: "Carrots", category: "produce", basePrice: 1.99, unit: "1 kg", emoji: "🥕", priority: 1, healthy: true },
  { id: "b-tomatoes", name: "Tomatoes", category: "produce", basePrice: 2.99, unit: "1 kg", emoji: "🍅", priority: 2, healthy: true },
  { id: "b-broccoli", name: "Broccoli", category: "produce", basePrice: 2.49, unit: "head", emoji: "🥦", priority: 2, healthy: true },
  { id: "b-onions", name: "Onions", category: "produce", basePrice: 1.49, unit: "1 kg", emoji: "🧅", priority: 1, healthy: true },
  { id: "b-garlic", name: "Garlic", category: "produce", basePrice: 0.99, unit: "head", emoji: "🧄", priority: 2, healthy: true },
  { id: "b-oranges", name: "Oranges", category: "produce", basePrice: 3.49, unit: "1 kg", emoji: "🍊", priority: 3, healthy: true },
  { id: "b-bell-pepper", name: "Bell Peppers", category: "produce", basePrice: 2.99, unit: "3 pack", emoji: "🫑", priority: 3, healthy: true },

  // Dairy & Eggs
  { id: "b-milk", name: "Milk (2%)", category: "dairy", basePrice: 3.99, unit: "1 L", emoji: "🥛", priority: 1, healthy: true },
  { id: "b-yogurt", name: "Greek Yogurt", category: "dairy", basePrice: 4.49, unit: "500g", emoji: "🫙", priority: 1, healthy: true },
  { id: "b-cheese", name: "Cheddar Cheese", category: "dairy", basePrice: 4.99, unit: "300g", emoji: "🧀", priority: 2, healthy: true },
  { id: "b-butter", name: "Butter", category: "dairy", basePrice: 4.49, unit: "250g", emoji: "🧈", priority: 3, healthy: true },

  // Pantry Staples
  { id: "b-olive-oil", name: "Olive Oil", category: "pantry", basePrice: 6.99, unit: "500 mL", emoji: "🫒", priority: 1, healthy: true },
  { id: "b-canned-beans", name: "Canned Beans", category: "pantry", basePrice: 1.29, unit: "can", emoji: "🥫", priority: 1, healthy: true },
  { id: "b-canned-tomatoes", name: "Canned Tomatoes", category: "pantry", basePrice: 1.49, unit: "can", emoji: "🥫", priority: 1, healthy: true },
  { id: "b-peanut-butter", name: "Peanut Butter", category: "pantry", basePrice: 3.99, unit: "500g", emoji: "🥜", priority: 2, healthy: true },
  { id: "b-honey", name: "Honey", category: "pantry", basePrice: 5.99, unit: "500g", emoji: "🍯", priority: 3, healthy: true },

  // Frozen
  { id: "b-frozen-berries", name: "Frozen Mixed Berries", category: "frozen", basePrice: 4.49, unit: "500g", emoji: "🫐", priority: 2, healthy: true },
  { id: "b-frozen-veg", name: "Frozen Mixed Vegetables", category: "frozen", basePrice: 2.99, unit: "500g", emoji: "🥦", priority: 2, healthy: true },
  { id: "b-frozen-fish", name: "Frozen Fish Fillets", category: "frozen", basePrice: 6.99, unit: "500g", emoji: "🐟", priority: 3, healthy: true },
];

// Premium upgrades — higher quality versions of essential items
const PREMIUM_ITEMS: BudgetItem[] = [
  // Protein upgrades
  { id: "bp-organic-chicken", name: "Organic Chicken Breast", category: "protein", basePrice: 12.99, unit: "1 kg", emoji: "🍗", priority: 1, healthy: true, upgradeOf: "b-chicken" },
  { id: "bp-free-range-eggs", name: "Free-Range Organic Eggs", category: "protein", basePrice: 6.99, unit: "dozen", emoji: "🥚", priority: 1, healthy: true, upgradeOf: "b-eggs" },
  { id: "bp-wild-salmon", name: "Wild-Caught Salmon", category: "protein", basePrice: 16.99, unit: "500g", emoji: "🐠", priority: 1, healthy: true, upgradeOf: "b-salmon" },
  { id: "bp-grass-fed-beef", name: "Grass-Fed Ground Beef", category: "protein", basePrice: 12.99, unit: "1 kg", emoji: "🥩", priority: 2, healthy: true, upgradeOf: "b-ground-beef" },
  { id: "bp-shrimp", name: "Wild Shrimp", category: "protein", basePrice: 13.99, unit: "500g", emoji: "🦐", priority: 2, healthy: true },
  { id: "bp-lamb", name: "Lamb Chops", category: "protein", basePrice: 14.99, unit: "500g", emoji: "🍖", priority: 3, healthy: true },

  // Grains upgrades
  { id: "bp-sourdough", name: "Artisan Sourdough Bread", category: "grains", basePrice: 5.99, unit: "loaf", emoji: "🍞", priority: 1, healthy: true, upgradeOf: "b-bread" },
  { id: "bp-basmati", name: "Organic Basmati Rice", category: "grains", basePrice: 7.99, unit: "2 kg", emoji: "🍚", priority: 2, healthy: true, upgradeOf: "b-rice" },
  { id: "bp-granola", name: "Organic Granola", category: "grains", basePrice: 6.99, unit: "500g", emoji: "🥣", priority: 2, healthy: true },
  { id: "bp-sweet-potato", name: "Sweet Potatoes", category: "grains", basePrice: 4.99, unit: "1 kg", emoji: "🍠", priority: 2, healthy: true },

  // Produce upgrades
  { id: "bp-organic-spinach", name: "Organic Baby Spinach", category: "produce", basePrice: 4.99, unit: "300g", emoji: "🥬", priority: 1, healthy: true, upgradeOf: "b-spinach" },
  { id: "bp-avocados", name: "Avocados", category: "produce", basePrice: 4.99, unit: "4 pack", emoji: "🥑", priority: 1, healthy: true },
  { id: "bp-berries-fresh", name: "Fresh Blueberries", category: "produce", basePrice: 4.99, unit: "pint", emoji: "🫐", priority: 2, healthy: true },
  { id: "bp-kale", name: "Organic Kale", category: "produce", basePrice: 3.99, unit: "bunch", emoji: "🥬", priority: 2, healthy: true },
  { id: "bp-mango", name: "Mangoes", category: "produce", basePrice: 3.49, unit: "2 pack", emoji: "🥭", priority: 3, healthy: true },
  { id: "bp-asparagus", name: "Asparagus", category: "produce", basePrice: 4.49, unit: "bunch", emoji: "🌿", priority: 3, healthy: true },

  // Dairy upgrades
  { id: "bp-organic-milk", name: "Organic Whole Milk", category: "dairy", basePrice: 6.49, unit: "2 L", emoji: "🥛", priority: 1, healthy: true, upgradeOf: "b-milk" },
  { id: "bp-aged-cheese", name: "Aged Cheddar Cheese", category: "dairy", basePrice: 8.99, unit: "300g", emoji: "🧀", priority: 2, healthy: true, upgradeOf: "b-cheese" },
  { id: "bp-kefir", name: "Organic Kefir", category: "dairy", basePrice: 5.49, unit: "1 L", emoji: "🥛", priority: 2, healthy: true },
  { id: "bp-parmesan", name: "Parmesan Cheese", category: "dairy", basePrice: 7.99, unit: "200g", emoji: "🧀", priority: 3, healthy: true },

  // Pantry upgrades
  { id: "bp-evoo", name: "Extra Virgin Olive Oil (Italian)", category: "pantry", basePrice: 12.99, unit: "500 mL", emoji: "🫒", priority: 1, healthy: true, upgradeOf: "b-olive-oil" },
  { id: "bp-almond-butter", name: "Almond Butter", category: "pantry", basePrice: 8.99, unit: "350g", emoji: "🥜", priority: 2, healthy: true, upgradeOf: "b-peanut-butter" },
  { id: "bp-mixed-nuts", name: "Mixed Nuts (raw)", category: "pantry", basePrice: 9.99, unit: "500g", emoji: "🌰", priority: 2, healthy: true },
  { id: "bp-chia-seeds", name: "Chia Seeds", category: "pantry", basePrice: 7.99, unit: "300g", emoji: "🌱", priority: 3, healthy: true },
  { id: "bp-manuka-honey", name: "Manuka Honey", category: "pantry", basePrice: 19.99, unit: "250g", emoji: "🍯", priority: 3, healthy: true, upgradeOf: "b-honey" },

  // Frozen upgrades
  { id: "bp-organic-berries", name: "Organic Frozen Berries", category: "frozen", basePrice: 7.99, unit: "500g", emoji: "🫐", priority: 2, healthy: true, upgradeOf: "b-frozen-berries" },
  { id: "bp-frozen-salmon", name: "Wild Frozen Salmon Portions", category: "frozen", basePrice: 11.99, unit: "500g", emoji: "🐠", priority: 2, healthy: true, upgradeOf: "b-frozen-fish" },
  { id: "bp-frozen-edamame", name: "Frozen Edamame", category: "frozen", basePrice: 4.49, unit: "500g", emoji: "🫛", priority: 3, healthy: true },
];

export interface GeneratedListItem {
  item: BudgetItem;
  localPrice: number;    // price in user's currency
  quantity: number;
}

export interface GeneratedBudgetList {
  essentials: GeneratedListItem[];   // budget-friendly basics
  premium: GeneratedListItem[];      // quality upgrades to fill remaining budget
  essentialsCost: number;
  premiumCost: number;
  totalCost: number;
  budget: number;
  currency: string;
  symbol: string;
  tip: string;           // i18n key for a random tip
}

/**
 * Generate a healthy grocery list that fits within the given budget.
 * Returns two tiers: "essentials" (affordable basics) and "premium" (quality upgrades).
 * `budget` is in the user's local currency.
 */
export function generateBudgetList(
  budget: number,
  currency: string,
  symbol: string,
): GeneratedBudgetList {
  const fx = FX_FROM_USD[currency] || 1;

  // Convert all items to local prices
  const localItems = ITEMS.map((item) => ({
    item,
    localPrice: Math.round(item.basePrice * fx * 100) / 100,
  }));

  // Sort by priority first, then by price
  localItems.sort((a, b) => {
    if (a.item.priority !== b.item.priority) return a.item.priority - b.item.priority;
    return a.localPrice - b.localPrice;
  });

  const essentials: GeneratedListItem[] = [];
  let remaining = budget;

  // Pass 1: add one of each priority-1 item (true essentials only)
  for (const { item, localPrice } of localItems) {
    if (item.priority === 1 && localPrice <= remaining) {
      essentials.push({ item, localPrice, quantity: 1 });
      remaining -= localPrice;
    }
  }

  // --- Premium tier: allocate BEFORE priority 2/3 essentials ---
  const localPremium = PREMIUM_ITEMS.map((item) => ({
    item,
    localPrice: Math.round(item.basePrice * fx * 100) / 100,
  }));
  localPremium.sort((a, b) => {
    if (a.item.priority !== b.item.priority) return a.item.priority - b.item.priority;
    return a.localPrice - b.localPrice;
  });

  const premium: GeneratedListItem[] = [];

  // Pass 2: add premium upgrades of essentials already in the list
  for (const { item, localPrice } of localPremium) {
    if (localPrice <= remaining && !premium.find((r) => r.item.id === item.id)) {
      if (item.upgradeOf && essentials.find((e) => e.item.id === item.upgradeOf)) {
        premium.push({ item, localPrice, quantity: 1 });
        remaining -= localPrice;
      }
    }
  }

  // Pass 3: add new premium items (not upgrades)
  for (const { item, localPrice } of localPremium) {
    if (localPrice <= remaining && !premium.find((r) => r.item.id === item.id) && !item.upgradeOf) {
      premium.push({ item, localPrice, quantity: 1 });
      remaining -= localPrice;
    }
  }

  // Pass 4: fill priority-2 essentials with leftover
  for (const { item, localPrice } of localItems) {
    if (item.priority === 2 && localPrice <= remaining && !essentials.find((r) => r.item.id === item.id)) {
      essentials.push({ item, localPrice, quantity: 1 });
      remaining -= localPrice;
    }
  }

  // Pass 5: fill priority-3 essentials
  for (const { item, localPrice } of localItems) {
    if (item.priority === 3 && localPrice <= remaining && !essentials.find((r) => r.item.id === item.id)) {
      essentials.push({ item, localPrice, quantity: 1 });
      remaining -= localPrice;
    }
  }

  // Pass 6 & 7: spread remaining budget across items (max 4 per item)
  const MAX_QTY = 4;
  let spread = true;
  while (spread && remaining >= 1) {
    spread = false;
    for (const entry of premium) {
      if (entry.localPrice <= remaining && entry.quantity < MAX_QTY) {
        entry.quantity += 1;
        remaining -= entry.localPrice;
        spread = true;
      }
    }
    for (const entry of essentials) {
      if (entry.localPrice <= remaining && entry.quantity < MAX_QTY) {
        entry.quantity += 1;
        remaining -= entry.localPrice;
        spread = true;
      }
    }
  }

  const essentialsCost = Math.round(essentials.reduce((sum, r) => sum + r.localPrice * r.quantity, 0) * 100) / 100;
  const premiumCost = Math.round(premium.reduce((sum, r) => sum + r.localPrice * r.quantity, 0) * 100) / 100;
  const actualTotal = Math.round((essentialsCost + premiumCost) * 100) / 100;

  // Pick a random tip
  const tips = [
    "budget.tips.bulk",
    "budget.tips.seasonal",
    "budget.tips.frozen",
    "budget.tips.protein",
    "budget.tips.plan",
  ];
  const tip = tips[Math.floor(Math.random() * tips.length)];

  return {
    essentials,
    premium,
    essentialsCost,
    premiumCost,
    totalCost: actualTotal,
    budget,
    currency,
    symbol,
    tip,
  };
}
