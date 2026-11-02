import { create } from 'zustand';
import { API_BASE } from '../config';

// Asset-conversion data for the "sound money" panel.
// Crypto: CoinGecko /coins/markets (keyless, CORS). Stocks & commodities: Yahoo Finance via the
// TimeSnap worker (/api/quotes, edge-cached ~10 min) because Yahoo has no browser CORS.
// Everything is cached in localStorage with its timestamp; nothing goes through the service worker cache.

export type Kind = 'crypto' | 'stocks' | 'commodities';
export interface MarketAsset {
  key: string;          // stable id used for pins and Vault conversions
  kind: Kind;
  symbol: string;
  name: string;
  priceUsd: number;
  change24h: number | null;
  image?: string;
  unit?: string;        // commodities: "oz", "barrel", ...
  native?: { price: number; currency: string }; // stocks quoted in another currency (e.g. ASX in AUD)
}
export type FeedStatus = 'loading' | 'live' | 'cached' | 'fallback' | 'error';
export interface Feed { items: MarketAsset[]; asOf: number | null; status: FeedStatus; source: string }

const TTL = 10 * 60 * 1000;
const LS = (k: Kind) => `timesnap.mkt.${k}`;
const PINS_KEY = 'timesnap.pins';
const DEFAULT_PINS = ['crypto:bitcoin', 'cmdty:GC=F', 'stock:AAPL', 'cmdty:SI=F'];

export const COMMODITY_META: Record<string, { name: string; unit: string }> = {
  'GC=F': { name: 'Gold', unit: 'troy oz' }, 'SI=F': { name: 'Silver', unit: 'troy oz' },
  'PL=F': { name: 'Platinum', unit: 'troy oz' }, 'PA=F': { name: 'Palladium', unit: 'troy oz' },
  'HG=F': { name: 'Copper', unit: 'lb' }, 'ALI=F': { name: 'Aluminium', unit: 'tonne' },
  'CL=F': { name: 'Crude Oil (WTI)', unit: 'barrel' }, 'BZ=F': { name: 'Crude Oil (Brent)', unit: 'barrel' },
  'NG=F': { name: 'Natural Gas', unit: 'MMBtu' }, 'RB=F': { name: 'Gasoline (RBOB)', unit: 'gallon' },
  'HO=F': { name: 'Heating Oil', unit: 'gallon' }, 'ZW=F': { name: 'Wheat', unit: 'bushel' },
  'ZC=F': { name: 'Corn', unit: 'bushel' }, 'ZS=F': { name: 'Soybeans', unit: 'bushel' },
  'KC=F': { name: 'Coffee', unit: 'lb' }, 'SB=F': { name: 'Sugar #11', unit: 'lb' },
  'CC=F': { name: 'Cocoa', unit: 'tonne' }, 'CT=F': { name: 'Cotton', unit: 'lb' },
  'OJ=F': { name: 'Orange Juice', unit: 'lb' }, 'LE=F': { name: 'Live Cattle', unit: 'lb' },
  'HE=F': { name: 'Lean Hogs', unit: 'lb' },
};

function readCache(k: Kind): Feed | null {
  try { const c = JSON.parse(localStorage.getItem(LS(k)) || 'null'); return c?.items?.length ? c : null; } catch { return null; }
}
function writeCache(k: Kind, f: Feed) { try { localStorage.setItem(LS(k), JSON.stringify(f)); } catch {} }

async function fetchCrypto(): Promise<Feed> {
  const r = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h', { cache: 'no-store' });
  if (!r.ok) throw new Error(`CoinGecko ${r.status}`);
  const d = await r.json();
  if (!Array.isArray(d) || !d.length) throw new Error('CoinGecko empty');
  const items: MarketAsset[] = d.filter((c: any) => typeof c.current_price === 'number' && c.current_price > 0).map((c: any) => ({
    key: `crypto:${c.id}`, kind: 'crypto', symbol: String(c.symbol).toUpperCase(), name: c.name, priceUsd: c.current_price,
    change24h: typeof c.price_change_percentage_24h === 'number' ? c.price_change_percentage_24h : null, image: c.image,
  }));
  const asOf = Math.max(...d.map((c: any) => Date.parse(c.last_updated) || 0)) || Date.now();
  return { items, asOf, status: 'live', source: 'CoinGecko' };
}

async function fetchQuotes(kind: 'stocks' | 'commodities', fxRates: Record<string, number> | null): Promise<Feed> {
  const r = await fetch(`${API_BASE}/api/quotes?set=${kind}`, { cache: 'no-store' });
  if (!r.ok) throw new Error(`quotes ${r.status}`);
  const d = await r.json();
  const items: MarketAsset[] = [];
  for (const q of d.quotes || []) {
    let price = q.price as number; let cur = String(q.currency || 'USD');
    if (cur === 'USX' || cur === 'USc') { price = price / 100; cur = 'USD'; } // US cents (grains, softs, livestock)
    if (cur === 'GBp') { price = price / 100; cur = 'GBP'; }
    let priceUsd = price;
    if (cur !== 'USD') { const rate = fxRates?.[cur]; if (!rate) continue; priceUsd = price / rate; }
    if (kind === 'commodities') {
      const m = COMMODITY_META[q.symbol];
      items.push({ key: `cmdty:${q.symbol}`, kind, symbol: q.symbol.replace('=F', ''), name: m?.name || q.name, unit: m?.unit, priceUsd, change24h: q.changePct ?? null });
    } else {
      items.push({ key: `stock:${q.symbol}`, kind, symbol: q.symbol, name: q.name, priceUsd, change24h: q.changePct ?? null, ...(cur !== 'USD' ? { native: { price, currency: cur } } : {}) });
    }
  }
  if (!items.length) throw new Error('no quotes');
  if (kind === 'commodities') items.sort((a, b) => Object.keys(COMMODITY_META).indexOf(a.key.slice(6)) - Object.keys(COMMODITY_META).indexOf(b.key.slice(6)));
  return { items, asOf: d.asOf || Date.now(), status: 'live', source: d.source || 'Yahoo Finance' };
}

interface MarketState {
  feeds: Record<Kind, Feed>;
  pins: string[];
  togglePin: (key: string) => void;
  load: (kind: Kind, fxRates: Record<string, number> | null, force?: boolean) => Promise<void>;
}
const initFeed = (k: Kind): Feed => readCache(k) ? { ...(readCache(k) as Feed), status: 'cached' } : { items: [], asOf: null, status: 'loading', source: '' };
function readPins(): string[] { try { const p = JSON.parse(localStorage.getItem(PINS_KEY) || 'null'); return Array.isArray(p) ? p : DEFAULT_PINS; } catch { return DEFAULT_PINS; } }

const inflight: Partial<Record<Kind, Promise<void>>> = {};
export const useMarkets = create<MarketState>()((set, get) => ({
  feeds: { crypto: initFeed('crypto'), stocks: initFeed('stocks'), commodities: initFeed('commodities') },
  pins: readPins(),
  togglePin: (key) => {
    const pins = get().pins.includes(key) ? get().pins.filter((p) => p !== key) : [...get().pins, key];
    try { localStorage.setItem(PINS_KEY, JSON.stringify(pins)); } catch {}
    set({ pins });
  },
  load: (kind, fxRates, force = false) => {
    if (inflight[kind]) return inflight[kind]!;
    const cached = readCache(kind);
    if (!force && cached && Date.now() - (cached as any).fetchedAt < TTL) {
      set((s) => ({ feeds: { ...s.feeds, [kind]: { ...cached, status: 'cached' } } }));
      return Promise.resolve();
    }
    const p = (async () => {
      try {
        if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new Error('offline');
        const feed = kind === 'crypto' ? await fetchCrypto() : await fetchQuotes(kind, fxRates);
        writeCache(kind, { ...feed, fetchedAt: Date.now() } as Feed);
        set((s) => ({ feeds: { ...s.feeds, [kind]: feed } }));
      } catch {
        if (cached) set((s) => ({ feeds: { ...s.feeds, [kind]: { ...cached, status: 'cached' } } }));
        else set((s) => ({ feeds: { ...s.feeds, [kind]: { items: [], asOf: null, status: 'error', source: '' } } }));
      } finally { delete inflight[kind]; }
    })();
    inflight[kind] = p;
    return p;
  },
}));

/** key -> USD price across all loaded feeds */
export function usePriceIndex() {
  const feeds = useMarkets((s) => s.feeds);
  const idx: Record<string, MarketAsset> = {};
  for (const f of Object.values(feeds)) for (const a of f.items) idx[a.key] = a;
  return idx;
}
