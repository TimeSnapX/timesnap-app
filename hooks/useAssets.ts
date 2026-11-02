import { useQuery } from '@tanstack/react-query';
import { ASSETS } from '../constants';

// Fallback prices in case API fails or hits limits
const FALLBACK_PRICES: Record<string, number> = {
  'bitcoin': 95000,
  'ethereum': 3500,
  'ripple': 0.60,
  'solana': 140,
  'binancecoin': 600,
  'zcash': 30,
  'monero': 150,
  'tether-platinum': 950,
  'tether-gold': 2400,
  'silver-token': 30,
};

export function useAssets() {
  const { data: prices, isLoading, isError } = useQuery({
    queryKey: ['assetPrices'],
    queryFn: async () => {
      const ids = ASSETS.map(a => a.coingeckoId).join(',');
      try {
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`);
        if (!response.ok) {
           throw new Error('Network response was not ok');
        }
        const data = await response.json();
        
        // Map response to simple { SYMBOL: Price } object
        return ASSETS.reduce((acc, asset) => {
          acc[asset.symbol] = data[asset.coingeckoId]?.usd || FALLBACK_PRICES[asset.coingeckoId] || 0;
          return acc;
        }, {} as Record<string, number>);

      } catch (error) {
        console.warn("Failed to fetch prices, using fallback:", error);
        // Return fallback mapped to symbols
        return ASSETS.reduce((acc, asset) => {
            acc[asset.symbol] = FALLBACK_PRICES[asset.coingeckoId] || 0;
            return acc;
        }, {} as Record<string, number>);
      }
    },
    staleTime: 60 * 1000, // Refresh every minute
  });

  return { assets: ASSETS, prices: (prices || {}) as Record<string, number>, isLoading, isError };
}