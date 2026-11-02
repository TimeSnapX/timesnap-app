export interface Asset {
  symbol: string;
  name: string;
  coingeckoId: string;
}

export interface Snap {
  id: string;
  timestamp: number;
  imageUri?: string; // Base64 string for web
  usdValue: number;
  title?: string; // Separated from description for better editing
  description: string;
  tags?: string[]; // For organization
  valuationReasoning?: string; // AI explanation for the price
  sources?: { title: string; uri: string }[]; // Valuation sources from Google Search
  conversions: Record<string, number>; // Amount of asset at time of snap
}

export interface AssetPrice {
  [key: string]: number;
}