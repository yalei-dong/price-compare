// Party / BBQ grocery planner — generates a shopping list scaled by guest count.

export type PartyType = "bbq" | "team-celebration" | "project-launch" | "potluck" | "birthday" | "camping";

export interface PartyTemplate {
  id: PartyType;
  nameKey: string;       // i18n key
  descKey: string;       // i18n key
  emoji: string;
  multiDay?: boolean;    // if true, UI shows a "days" input
  items: PartyItem[];
}

export interface PartyItem {
  name: string;           // English name (also used as search query)
  emoji: string;
  unit: string;           // display unit, e.g. "lbs", "packs", "bags"
  perPerson: number;      // quantity per person per event (or per day if template.multiDay)
  category: PartyCategory;
  basePrice: number;      // approximate USD price per unit
  oncePerTrip?: boolean;  // if true, quantity scales by guests only, not by days
}

export type PartyCategory = "meat" | "sides" | "drinks" | "snacks" | "condiments" | "dessert" | "supplies";

export interface GeneratedPartyList {
  partyType: PartyType;
  guests: number;
  days: number;
  items: GeneratedPartyItem[];
  totalEstimate: number;
  currency: string;
  symbol: string;
}

export interface GeneratedPartyItem {
  item: PartyItem;
  quantity: number;       // rounded up
  localPrice: number;     // price per unit in local currency
  lineTotal: number;
}

// Rough exchange rates from USD
const FX_FROM_USD: Record<string, number> = {
  USD: 1, CAD: 1.37, CNY: 7.25, GBP: 0.79, AUD: 1.55,
  INR: 83.5, JPY: 155, KRW: 1340, EUR: 0.92, MXN: 17.2, BRL: 5.0,
};

const TEMPLATES: PartyTemplate[] = [
  {
    id: "bbq",
    nameKey: "party.type.bbq",
    descKey: "party.type.bbqDesc",
    emoji: "🔥",
    items: [
      // Meat / Protein
      { name: "Burger Patties", emoji: "🍔", unit: "patties", perPerson: 2, category: "meat", basePrice: 1.50 },
      { name: "Hot Dogs", emoji: "🌭", unit: "pieces", perPerson: 1.5, category: "meat", basePrice: 0.75 },
      { name: "Chicken Wings", emoji: "🍗", unit: "lbs", perPerson: 0.5, category: "meat", basePrice: 4.99 },
      { name: "Steak", emoji: "🥩", unit: "pieces", perPerson: 0.5, category: "meat", basePrice: 8.99 },
      { name: "Sausages", emoji: "🌭", unit: "pieces", perPerson: 1, category: "meat", basePrice: 1.25 },
      // Sides
      { name: "Burger Buns", emoji: "🍞", unit: "packs (8)", perPerson: 0.25, category: "sides", basePrice: 3.49 },
      { name: "Hot Dog Buns", emoji: "🍞", unit: "packs (8)", perPerson: 0.2, category: "sides", basePrice: 3.49 },
      { name: "Coleslaw", emoji: "🥗", unit: "containers", perPerson: 0.15, category: "sides", basePrice: 4.99 },
      { name: "Corn on the Cob", emoji: "🌽", unit: "ears", perPerson: 1, category: "sides", basePrice: 0.75 },
      { name: "Potato Salad", emoji: "🥔", unit: "lbs", perPerson: 0.33, category: "sides", basePrice: 4.49 },
      { name: "Green Salad Mix", emoji: "🥬", unit: "bags", perPerson: 0.1, category: "sides", basePrice: 3.99 },
      // Drinks
      { name: "Soda (2L)", emoji: "🥤", unit: "bottles", perPerson: 0.25, category: "drinks", basePrice: 2.49 },
      { name: "Water Bottles (24-pack)", emoji: "💧", unit: "packs", perPerson: 0.05, category: "drinks", basePrice: 4.99 },
      { name: "Beer (12-pack)", emoji: "🍺", unit: "packs", perPerson: 0.25, category: "drinks", basePrice: 15.99 },
      { name: "Juice Box (10-pack)", emoji: "🧃", unit: "packs", perPerson: 0.1, category: "drinks", basePrice: 5.49 },
      // Snacks
      { name: "Tortilla Chips", emoji: "🫓", unit: "bags", perPerson: 0.1, category: "snacks", basePrice: 4.49 },
      { name: "Salsa", emoji: "🫙", unit: "jars", perPerson: 0.08, category: "snacks", basePrice: 3.99 },
      // Condiments
      { name: "Ketchup", emoji: "🍅", unit: "bottles", perPerson: 0.05, category: "condiments", basePrice: 3.99 },
      { name: "Mustard", emoji: "🟡", unit: "bottles", perPerson: 0.05, category: "condiments", basePrice: 2.99 },
      { name: "BBQ Sauce", emoji: "🍖", unit: "bottles", perPerson: 0.08, category: "condiments", basePrice: 3.99 },
      // Dessert
      { name: "Watermelon", emoji: "🍉", unit: "whole", perPerson: 0.1, category: "dessert", basePrice: 6.99 },
      { name: "Ice Cream (tub)", emoji: "🍦", unit: "tubs", perPerson: 0.08, category: "dessert", basePrice: 5.99 },
      // Supplies
      { name: "Paper Plates", emoji: "🍽️", unit: "packs (50)", perPerson: 0.04, category: "supplies", basePrice: 5.99 },
      { name: "Plastic Cups", emoji: "🥤", unit: "packs (50)", perPerson: 0.04, category: "supplies", basePrice: 4.99 },
      { name: "Napkins", emoji: "🧻", unit: "packs (100)", perPerson: 0.03, category: "supplies", basePrice: 3.99 },
      { name: "Charcoal", emoji: "🪨", unit: "bags", perPerson: 0.05, category: "supplies", basePrice: 9.99 },
    ],
  },
  {
    id: "team-celebration",
    nameKey: "party.type.teamCelebration",
    descKey: "party.type.teamCelebrationDesc",
    emoji: "🏆",
    items: [
      { name: "Pizza (large, frozen)", emoji: "🍕", unit: "pizzas", perPerson: 0.33, category: "meat", basePrice: 7.99 },
      { name: "Chicken Wings", emoji: "🍗", unit: "lbs", perPerson: 0.5, category: "meat", basePrice: 4.99 },
      { name: "Sub Sandwich Platter", emoji: "🥖", unit: "platters (serves 8)", perPerson: 0.125, category: "meat", basePrice: 24.99 },
      { name: "Veggie Tray", emoji: "🥕", unit: "trays", perPerson: 0.1, category: "sides", basePrice: 12.99 },
      { name: "Fruit Platter", emoji: "🍓", unit: "trays", perPerson: 0.1, category: "sides", basePrice: 14.99 },
      { name: "Cheese & Crackers", emoji: "🧀", unit: "trays", perPerson: 0.1, category: "snacks", basePrice: 12.99 },
      { name: "Tortilla Chips", emoji: "🫓", unit: "bags", perPerson: 0.1, category: "snacks", basePrice: 4.49 },
      { name: "Guacamole", emoji: "🥑", unit: "containers", perPerson: 0.1, category: "snacks", basePrice: 5.99 },
      { name: "Hummus", emoji: "🫘", unit: "containers", perPerson: 0.1, category: "snacks", basePrice: 4.99 },
      { name: "Soda (2L)", emoji: "🥤", unit: "bottles", perPerson: 0.25, category: "drinks", basePrice: 2.49 },
      { name: "Beer (12-pack)", emoji: "🍺", unit: "packs", perPerson: 0.25, category: "drinks", basePrice: 15.99 },
      { name: "Water Bottles (24-pack)", emoji: "💧", unit: "packs", perPerson: 0.05, category: "drinks", basePrice: 4.99 },
      { name: "Sparkling Water (12-pack)", emoji: "✨", unit: "packs", perPerson: 0.1, category: "drinks", basePrice: 6.99 },
      { name: "Celebration Cake", emoji: "🎂", unit: "cakes", perPerson: 0.08, category: "dessert", basePrice: 24.99 },
      { name: "Brownies (box mix)", emoji: "🍫", unit: "boxes", perPerson: 0.08, category: "dessert", basePrice: 3.99 },
      { name: "Paper Plates", emoji: "🍽️", unit: "packs (50)", perPerson: 0.04, category: "supplies", basePrice: 5.99 },
      { name: "Napkins", emoji: "🧻", unit: "packs (100)", perPerson: 0.03, category: "supplies", basePrice: 3.99 },
      { name: "Plastic Cups", emoji: "🥤", unit: "packs (50)", perPerson: 0.04, category: "supplies", basePrice: 4.99 },
    ],
  },
  {
    id: "project-launch",
    nameKey: "party.type.projectLaunch",
    descKey: "party.type.projectLaunchDesc",
    emoji: "🚀",
    items: [
      { name: "Assorted Sandwiches", emoji: "🥪", unit: "platters (serves 10)", perPerson: 0.1, category: "meat", basePrice: 29.99 },
      { name: "Sushi Platter", emoji: "🍣", unit: "platters (serves 8)", perPerson: 0.125, category: "meat", basePrice: 34.99 },
      { name: "Cheese & Crackers", emoji: "🧀", unit: "trays", perPerson: 0.1, category: "snacks", basePrice: 12.99 },
      { name: "Fruit Platter", emoji: "🍓", unit: "trays", perPerson: 0.1, category: "sides", basePrice: 14.99 },
      { name: "Veggie Tray", emoji: "🥕", unit: "trays", perPerson: 0.1, category: "sides", basePrice: 12.99 },
      { name: "Mixed Nuts", emoji: "🥜", unit: "containers", perPerson: 0.08, category: "snacks", basePrice: 9.99 },
      { name: "Sparkling Water (12-pack)", emoji: "✨", unit: "packs", perPerson: 0.1, category: "drinks", basePrice: 6.99 },
      { name: "Coffee (ground)", emoji: "☕", unit: "bags", perPerson: 0.08, category: "drinks", basePrice: 9.99 },
      { name: "Orange Juice (2L)", emoji: "🍊", unit: "bottles", perPerson: 0.1, category: "drinks", basePrice: 4.99 },
      { name: "Wine (bottle)", emoji: "🍷", unit: "bottles", perPerson: 0.2, category: "drinks", basePrice: 12.99 },
      { name: "Soda (2L)", emoji: "🥤", unit: "bottles", perPerson: 0.15, category: "drinks", basePrice: 2.49 },
      { name: "Cupcakes (12-pack)", emoji: "🧁", unit: "packs", perPerson: 0.1, category: "dessert", basePrice: 8.99 },
      { name: "Cookies (assorted)", emoji: "🍪", unit: "boxes", perPerson: 0.08, category: "dessert", basePrice: 6.99 },
      { name: "Paper Plates", emoji: "🍽️", unit: "packs (50)", perPerson: 0.04, category: "supplies", basePrice: 5.99 },
      { name: "Napkins", emoji: "🧻", unit: "packs (100)", perPerson: 0.03, category: "supplies", basePrice: 3.99 },
      { name: "Plastic Cups", emoji: "🥤", unit: "packs (50)", perPerson: 0.04, category: "supplies", basePrice: 4.99 },
    ],
  },
  {
    id: "potluck",
    nameKey: "party.type.potluck",
    descKey: "party.type.potluckDesc",
    emoji: "🍲",
    items: [
      { name: "Pasta (dry)", emoji: "🍝", unit: "boxes", perPerson: 0.25, category: "sides", basePrice: 1.99 },
      { name: "Pasta Sauce", emoji: "🍅", unit: "jars", perPerson: 0.15, category: "condiments", basePrice: 3.99 },
      { name: "Ground Beef", emoji: "🥩", unit: "lbs", perPerson: 0.25, category: "meat", basePrice: 5.99 },
      { name: "Garlic Bread", emoji: "🧄", unit: "loaves", perPerson: 0.15, category: "sides", basePrice: 3.99 },
      { name: "Green Salad Mix", emoji: "🥬", unit: "bags", perPerson: 0.1, category: "sides", basePrice: 3.99 },
      { name: "Salad Dressing", emoji: "🫙", unit: "bottles", perPerson: 0.05, category: "condiments", basePrice: 3.49 },
      { name: "Dinner Rolls", emoji: "🍞", unit: "packs (12)", perPerson: 0.12, category: "sides", basePrice: 3.49 },
      { name: "Butter", emoji: "🧈", unit: "sticks", perPerson: 0.15, category: "condiments", basePrice: 1.49 },
      { name: "Soda (2L)", emoji: "🥤", unit: "bottles", perPerson: 0.2, category: "drinks", basePrice: 2.49 },
      { name: "Water Bottles (24-pack)", emoji: "💧", unit: "packs", perPerson: 0.05, category: "drinks", basePrice: 4.99 },
      { name: "Juice (2L)", emoji: "🧃", unit: "bottles", perPerson: 0.1, category: "drinks", basePrice: 3.99 },
      { name: "Pie (frozen)", emoji: "🥧", unit: "pies", perPerson: 0.12, category: "dessert", basePrice: 7.99 },
      { name: "Ice Cream (tub)", emoji: "🍦", unit: "tubs", perPerson: 0.06, category: "dessert", basePrice: 5.99 },
      { name: "Paper Plates", emoji: "🍽️", unit: "packs (50)", perPerson: 0.04, category: "supplies", basePrice: 5.99 },
      { name: "Napkins", emoji: "🧻", unit: "packs (100)", perPerson: 0.03, category: "supplies", basePrice: 3.99 },
    ],
  },
  {
    id: "birthday",
    nameKey: "party.type.birthday",
    descKey: "party.type.birthdayDesc",
    emoji: "🎂",
    items: [
      { name: "Pizza (large, frozen)", emoji: "🍕", unit: "pizzas", perPerson: 0.33, category: "meat", basePrice: 7.99 },
      { name: "Chicken Nuggets (frozen)", emoji: "🍗", unit: "bags", perPerson: 0.1, category: "meat", basePrice: 6.99 },
      { name: "Mini Sliders", emoji: "🍔", unit: "packs (12)", perPerson: 0.1, category: "meat", basePrice: 9.99 },
      { name: "Fruit Platter", emoji: "🍓", unit: "trays", perPerson: 0.1, category: "sides", basePrice: 14.99 },
      { name: "Veggie Tray", emoji: "🥕", unit: "trays", perPerson: 0.1, category: "sides", basePrice: 12.99 },
      { name: "Tortilla Chips", emoji: "🫓", unit: "bags", perPerson: 0.1, category: "snacks", basePrice: 4.49 },
      { name: "Popcorn", emoji: "🍿", unit: "bags", perPerson: 0.1, category: "snacks", basePrice: 3.99 },
      { name: "Candy Mix", emoji: "🍬", unit: "bags", perPerson: 0.08, category: "snacks", basePrice: 5.99 },
      { name: "Soda (2L)", emoji: "🥤", unit: "bottles", perPerson: 0.25, category: "drinks", basePrice: 2.49 },
      { name: "Juice Box (10-pack)", emoji: "🧃", unit: "packs", perPerson: 0.12, category: "drinks", basePrice: 5.49 },
      { name: "Birthday Cake", emoji: "🎂", unit: "cakes", perPerson: 0.06, category: "dessert", basePrice: 29.99 },
      { name: "Ice Cream (tub)", emoji: "🍦", unit: "tubs", perPerson: 0.06, category: "dessert", basePrice: 5.99 },
      { name: "Balloons (pack)", emoji: "🎈", unit: "packs", perPerson: 0.05, category: "supplies", basePrice: 4.99 },
      { name: "Party Hats", emoji: "🥳", unit: "packs (8)", perPerson: 0.15, category: "supplies", basePrice: 3.99 },
      { name: "Paper Plates", emoji: "🍽️", unit: "packs (50)", perPerson: 0.04, category: "supplies", basePrice: 5.99 },
      { name: "Napkins", emoji: "🧻", unit: "packs (100)", perPerson: 0.03, category: "supplies", basePrice: 3.99 },
      { name: "Candles", emoji: "🕯️", unit: "packs", perPerson: 0.05, category: "supplies", basePrice: 2.99 },
    ],
  },
  {
    id: "camping",
    nameKey: "party.type.camping",
    descKey: "party.type.campingDesc",
    emoji: "⛺",
    multiDay: true,
    items: [
      // Breakfast
      { name: "Eggs", emoji: "🥚", unit: "dozen", perPerson: 0.25, category: "meat", basePrice: 3.49 },
      { name: "Bacon", emoji: "🥓", unit: "packs", perPerson: 0.2, category: "meat", basePrice: 6.99 },
      { name: "Pancake Mix", emoji: "🥞", unit: "boxes", perPerson: 0.08, category: "sides", basePrice: 3.99 },
      { name: "Maple Syrup", emoji: "🍁", unit: "bottles", perPerson: 0.04, category: "condiments", basePrice: 5.99, oncePerTrip: true },
      { name: "Instant Oatmeal", emoji: "🥣", unit: "boxes", perPerson: 0.1, category: "sides", basePrice: 4.49 },
      { name: "Bread", emoji: "🍞", unit: "loaves", perPerson: 0.15, category: "sides", basePrice: 2.99 },
      // Lunch & Dinner
      { name: "Hot Dogs", emoji: "🌭", unit: "packs (8)", perPerson: 0.15, category: "meat", basePrice: 4.99 },
      { name: "Hot Dog Buns", emoji: "🍞", unit: "packs (8)", perPerson: 0.15, category: "sides", basePrice: 3.49 },
      { name: "Hamburger Patties", emoji: "🍔", unit: "packs (8)", perPerson: 0.12, category: "meat", basePrice: 9.99 },
      { name: "Burger Buns", emoji: "🍞", unit: "packs (8)", perPerson: 0.12, category: "sides", basePrice: 3.49 },
      { name: "Steak", emoji: "🥩", unit: "pieces", perPerson: 0.3, category: "meat", basePrice: 8.99 },
      { name: "Chicken Breast", emoji: "🍗", unit: "lbs", perPerson: 0.3, category: "meat", basePrice: 4.99 },
      { name: "Canned Chili", emoji: "🥫", unit: "cans", perPerson: 0.2, category: "meat", basePrice: 2.99 },
      { name: "Pasta (dry)", emoji: "🍝", unit: "boxes", perPerson: 0.1, category: "sides", basePrice: 1.99 },
      { name: "Pasta Sauce", emoji: "🍅", unit: "jars", perPerson: 0.08, category: "condiments", basePrice: 3.99 },
      { name: "Rice", emoji: "🍚", unit: "bags (2kg)", perPerson: 0.05, category: "sides", basePrice: 3.99 },
      { name: "Canned Beans", emoji: "🥫", unit: "cans", perPerson: 0.15, category: "sides", basePrice: 1.29 },
      { name: "Corn on the Cob", emoji: "🌽", unit: "ears", perPerson: 0.5, category: "sides", basePrice: 0.75 },
      { name: "Potatoes", emoji: "🥔", unit: "bags (5lb)", perPerson: 0.06, category: "sides", basePrice: 4.99 },
      // Snacks
      { name: "Trail Mix", emoji: "🥜", unit: "bags", perPerson: 0.15, category: "snacks", basePrice: 5.99 },
      { name: "Granola Bars (box)", emoji: "🍫", unit: "boxes", perPerson: 0.12, category: "snacks", basePrice: 4.99 },
      { name: "Tortilla Chips", emoji: "🫓", unit: "bags", perPerson: 0.06, category: "snacks", basePrice: 4.49 },
      { name: "Salsa", emoji: "🫙", unit: "jars", perPerson: 0.04, category: "snacks", basePrice: 3.99, oncePerTrip: true },
      { name: "Marshmallows", emoji: "☁️", unit: "bags", perPerson: 0.1, category: "snacks", basePrice: 2.99 },
      { name: "Graham Crackers", emoji: "🍪", unit: "boxes", perPerson: 0.08, category: "snacks", basePrice: 3.99 },
      { name: "Chocolate Bars", emoji: "🍫", unit: "packs", perPerson: 0.08, category: "snacks", basePrice: 4.99 },
      { name: "Apples", emoji: "🍎", unit: "bags", perPerson: 0.06, category: "snacks", basePrice: 4.99 },
      { name: "Bananas", emoji: "🍌", unit: "bunches", perPerson: 0.12, category: "snacks", basePrice: 1.49 },
      // Drinks
      { name: "Water Bottles (24-pack)", emoji: "💧", unit: "packs", perPerson: 0.1, category: "drinks", basePrice: 4.99 },
      { name: "Coffee (ground)", emoji: "☕", unit: "bags", perPerson: 0.04, category: "drinks", basePrice: 9.99, oncePerTrip: true },
      { name: "Juice Box (10-pack)", emoji: "🧃", unit: "packs", perPerson: 0.08, category: "drinks", basePrice: 5.49 },
      { name: "Beer (12-pack)", emoji: "🍺", unit: "packs", perPerson: 0.15, category: "drinks", basePrice: 15.99 },
      { name: "Soda (2L)", emoji: "🥤", unit: "bottles", perPerson: 0.12, category: "drinks", basePrice: 2.49 },
      { name: "Hot Chocolate Mix", emoji: "🍫", unit: "boxes", perPerson: 0.06, category: "drinks", basePrice: 4.99 },
      // Condiments
      { name: "Ketchup", emoji: "🍅", unit: "bottles", perPerson: 0.04, category: "condiments", basePrice: 3.99, oncePerTrip: true },
      { name: "Mustard", emoji: "🟡", unit: "bottles", perPerson: 0.04, category: "condiments", basePrice: 2.99, oncePerTrip: true },
      { name: "BBQ Sauce", emoji: "🍖", unit: "bottles", perPerson: 0.04, category: "condiments", basePrice: 3.99, oncePerTrip: true },
      { name: "Salt & Pepper", emoji: "🧂", unit: "sets", perPerson: 0.05, category: "condiments", basePrice: 2.49, oncePerTrip: true },
      { name: "Cooking Oil", emoji: "🫒", unit: "bottles", perPerson: 0.04, category: "condiments", basePrice: 4.99, oncePerTrip: true },
      { name: "Butter", emoji: "🧈", unit: "sticks", perPerson: 0.1, category: "condiments", basePrice: 1.49 },
      // Supplies
      { name: "Charcoal", emoji: "🪨", unit: "bags", perPerson: 0.05, category: "supplies", basePrice: 9.99 },
      { name: "Fire Starters", emoji: "🔥", unit: "packs", perPerson: 0.04, category: "supplies", basePrice: 5.99, oncePerTrip: true },
      { name: "Paper Plates", emoji: "🍽️", unit: "packs (50)", perPerson: 0.04, category: "supplies", basePrice: 5.99 },
      { name: "Plastic Cups", emoji: "🥤", unit: "packs (50)", perPerson: 0.04, category: "supplies", basePrice: 4.99 },
      { name: "Napkins", emoji: "🧻", unit: "packs (100)", perPerson: 0.02, category: "supplies", basePrice: 3.99 },
      { name: "Aluminum Foil", emoji: "🫕", unit: "rolls", perPerson: 0.04, category: "supplies", basePrice: 4.49, oncePerTrip: true },
      { name: "Trash Bags", emoji: "🗑️", unit: "rolls", perPerson: 0.03, category: "supplies", basePrice: 5.99, oncePerTrip: true },
      { name: "Paper Towels", emoji: "🧻", unit: "rolls", perPerson: 0.06, category: "supplies", basePrice: 1.99 },
      { name: "Ziploc Bags", emoji: "🛍️", unit: "boxes", perPerson: 0.03, category: "supplies", basePrice: 3.99, oncePerTrip: true },
      { name: "Ice (bags)", emoji: "🧊", unit: "bags", perPerson: 0.15, category: "supplies", basePrice: 2.99 },
    ],
  },
];

const CATEGORY_LABELS: Record<PartyCategory, string> = {
  meat: "party.cat.meat",
  sides: "party.cat.sides",
  drinks: "party.cat.drinks",
  snacks: "party.cat.snacks",
  condiments: "party.cat.condiments",
  dessert: "party.cat.dessert",
  supplies: "party.cat.supplies",
};

export const CATEGORY_ORDER: PartyCategory[] = [
  "meat", "sides", "snacks", "condiments", "drinks", "dessert", "supplies",
];

export function getTemplates(): PartyTemplate[] {
  return TEMPLATES;
}

export function getCategoryLabel(cat: PartyCategory): string {
  return CATEGORY_LABELS[cat];
}

export function generatePartyList(
  partyType: PartyType,
  guests: number,
  currency: string,
  symbol: string,
  days: number = 1,
): GeneratedPartyList {
  const template = TEMPLATES.find((t) => t.id === partyType);
  if (!template) throw new Error(`Unknown party type: ${partyType}`);

  const fx = FX_FROM_USD[currency] || 1;
  const effectiveDays = template.multiDay ? Math.max(1, days) : 1;

  const items: GeneratedPartyItem[] = template.items.map((item) => {
    const multiplier = item.oncePerTrip ? guests : guests * effectiveDays;
    const rawQty = item.perPerson * multiplier;
    const quantity = Math.max(1, Math.ceil(rawQty));
    const localPrice = Math.round(item.basePrice * fx * 100) / 100;
    return {
      item,
      quantity,
      localPrice,
      lineTotal: Math.round(localPrice * quantity * 100) / 100,
    };
  });

  const totalEstimate = Math.round(items.reduce((s, i) => s + i.lineTotal, 0) * 100) / 100;

  return { partyType, guests, days: effectiveDays, items, totalEstimate, currency, symbol };
}
