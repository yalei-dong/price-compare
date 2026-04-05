export type Country = "US" | "CA" | "CN";
export type StoreType = "online" | "local" | "both";

export interface Store {
  id: string;
  name: string;
  logo: string;
  country: Country;
  type: StoreType;
  website?: string;
}

export interface PriceEntry {
  storeId: string;
  storeName: string;
  storeLogo: string;
  country: Country;
  type: StoreType;
  price: number;
  currency: string;
  unit: string;
  url?: string;
  thumbnail?: string;
  lastUpdated: string;
  inStock: boolean;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  image: string;
  barcode?: string;
  description: string;
  prices: PriceEntry[];
}

export interface ShoppingListItem {
  productId: string;
  productName: string;
  preferredStoreId?: string;
  quantity: number;
  checked: boolean;
}

export const CURRENCIES: Record<Country, string> = {
  US: "USD",
  CA: "CAD",
  CN: "CNY",
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  CAD: "C$",
  CNY: "¥",
  GBP: "£",
  AUD: "A$",
  INR: "₹",
  JPY: "¥",
  KRW: "₩",
  EUR: "€",
  MXN: "$",
  BRL: "R$",
};

export const COUNTRY_NAMES: Record<Country, string> = {
  US: "United States",
  CA: "Canada",
  CN: "China",
};
