import { API_BASE } from '../config';
import type { MarketAsset } from './markets';

// Price history for one asset. Crypto: CoinGecko market_chart (1D–1Y); crypto 5Y and all stocks/commodities:
// Yahoo v8 chart via the TimeSnap worker /api/chart. Points are [ms, priceUsd]. Never synthesised.
export type Range = '1d' | '7d' | '1m' | '1y' | '5y';
export const RANGES: { r: Range; label: string; days: number }[] = [
  { r: '1d', label: '1D', days: 1 }, { r: '7d', label: '7D', days: 7 }, { r: '1m', label: '1M', days: 30 },
  { r: '1y', label: '1Y', days: 365 }, { r: '5y', label: '5Y', days: 1825 },
];
export interface ChartData { points: [number, number][]; source: string; fetchedAt: number }

const mem = new Map<string, ChartData>();
const MEM_TTL = 10 * 60 * 1000;

function toUsd(price: number, cur: string, rates: Record<string, number> | null): number | null {
  if (cur === 'USX' || cur === 'USc') return price / 100;
  if (cur === 'GBp') { const r = rates?.GBP; return r ? price / 100 / r : null; }
  if (cur === 'USD') return price;
  const r = rates?.[cur]; return r ? price / r : null;
}

async function viaWorker(symbol: string, range: Range, rates: Record<string, number> | null): Promise<ChartData> {
  const r = await fetch(`${API_BASE}/api/chart?symbol=${encodeURIComponent(symbol)}&range=${range}`, { cache: 'no-store' });
  if (!r.ok) throw new Error(`chart ${r.status}`);
  const d = await r.json();
  const points: [number, number][] = [];
  for (const [t, p] of d.points || []) { const u = toUsd(p, String(d.currency || 'USD'), rates); if (u && isFinite(u)) points.push([t, u]); }
  if (points.length < 2) throw new Error('no data');
  return { points, source: d.source || 'Yahoo Finance', fetchedAt: Date.now() };
}

export function cachedChart(a: MarketAsset, range: Range) {
  const c = mem.get(`${a.key}|${range}`); return c && Date.now() - c.fetchedAt < MEM_TTL ? c : null;
}

export async function loadChart(a: MarketAsset, range: Range, rates: Record<string, number> | null): Promise<ChartData> {
  const hit = cachedChart(a, range); if (hit) return hit;
  let data: ChartData;
  if (a.kind === 'crypto') {
    // CoinGecko first (1D–1Y). Its keyless API only serves 365 days and rate-limits bursts, so 5Y and any
    // CoinGecko failure fall back to the real Yahoo COIN-USD series via the worker.
    try {
      if (range === '5y') throw new Error('beyond CoinGecko keyless range');
      const days = RANGES.find((x) => x.r === range)!.days;
      const r = await fetch(`https://api.coingecko.com/api/v3/coins/${encodeURIComponent(a.key.slice(7))}/market_chart?vs_currency=usd&days=${days}`, { cache: 'no-store' });
      if (!r.ok) throw new Error(`CoinGecko ${r.status}`);
      const d = await r.json();
      const points = (d.prices || []).filter((p: any) => Array.isArray(p) && p[1] > 0) as [number, number][];
      if (points.length < 2) throw new Error('no data');
      data = { points, source: 'CoinGecko', fetchedAt: Date.now() };
    } catch {
      data = await viaWorker(`${a.symbol}-USD`, range, rates);
    }
  } else {
    data = await viaWorker(a.key.slice(a.key.indexOf(':') + 1), range, rates);
  }
  mem.set(`${a.key}|${range}`, data);
  return data;
}
