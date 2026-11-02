import { Asset } from './types';

export const ASSETS: Asset[] = [
  { symbol: 'BTC', name: 'Bitcoin', coingeckoId: 'bitcoin' },
  { symbol: 'ETH', name: 'Ethereum', coingeckoId: 'ethereum' },
  { symbol: 'XRP', name: 'Ripple', coingeckoId: 'ripple' },
  { symbol: 'SOL', name: 'Solana', coingeckoId: 'solana' },
  { symbol: 'BNB', name: 'Binance Coin', coingeckoId: 'binancecoin' },
  { symbol: 'ZEC', name: 'Zcash', coingeckoId: 'zcash' },
  { symbol: 'XMR', name: 'Monero', coingeckoId: 'monero' },
  { symbol: 'XPT', name: 'Platinum', coingeckoId: 'tether-platinum' }, 
  { symbol: 'XAU', name: 'Gold', coingeckoId: 'tether-gold' },
  { symbol: 'XAG', name: 'Silver', coingeckoId: 'silver-token' },
];
