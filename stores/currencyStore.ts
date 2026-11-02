import { create } from 'zustand';

// Stored snap values stay in USD (snaps-storage unchanged). This store only drives display.
export const CURRENCY_KEY = 'timesnap.currency';
const RATES_KEY = 'timesnap.fxRates';
const MAX_AGE_MS = 12 * 60 * 60 * 1000;
const DEFAULT_CURRENCY = 'AUD';

type RatesStatus = 'loading' | 'live' | 'cached' | 'unavailable';
interface CachedRates { rates: Record<string, number>; asOf: number; fetchedAt: number; source: string }

interface CurrencyState {
  code: string;
  rates: Record<string, number> | null;
  asOf: number | null;
  source: string | null;
  status: RatesStatus;
  pickerOpen: boolean;
  setCode: (code: string) => void;
  openPicker: (open: boolean) => void;
  loadRates: (force?: boolean) => Promise<void>;
}

function readCache(): CachedRates | null {
  try { const c = JSON.parse(localStorage.getItem(RATES_KEY) || 'null'); return c && c.rates && c.rates.USD === 1 ? c : null; } catch { return null; }
}
function readCode(): string {
  try { const c = localStorage.getItem(CURRENCY_KEY); return c && /^[A-Z]{3}$/.test(c) ? c : DEFAULT_CURRENCY; } catch { return DEFAULT_CURRENCY; }
}

async function fetchRates(): Promise<CachedRates> {
  try {
    const r = await fetch('https://open.er-api.com/v6/latest/USD', { cache: 'no-store' });
    const d = await r.json();
    if (d?.result !== 'success' || !d.rates) throw new Error('bad rates');
    return { rates: d.rates, asOf: d.time_last_update_unix * 1000, fetchedAt: Date.now(), source: 'open.er-api.com' };
  } catch {
    const r = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json', { cache: 'no-store' });
    const d = await r.json();
    const rates: Record<string, number> = { USD: 1 };
    for (const [k, v] of Object.entries(d.usd || {})) if (/^[a-z]{3}$/.test(k) && typeof v === 'number') rates[k.toUpperCase()] = v;
    if (Object.keys(rates).length < 20) throw new Error('bad fallback rates');
    return { rates, asOf: new Date(d.date + 'T00:00:00Z').getTime(), fetchedAt: Date.now(), source: 'currency-api (jsDelivr)' };
  }
}

const cached = readCache();
export const useCurrencyStore = create<CurrencyState>()((set, get) => ({
  code: readCode(),
  rates: cached?.rates ?? null,
  asOf: cached?.asOf ?? null,
  source: cached?.source ?? null,
  status: cached ? 'cached' : 'loading',
  pickerOpen: false,
  setCode: (code) => { try { localStorage.setItem(CURRENCY_KEY, code); } catch {} set({ code, pickerOpen: false }); },
  openPicker: (open) => set({ pickerOpen: open }),
  loadRates: async (force = false) => {
    const c = readCache();
    if (!force && c && Date.now() - c.fetchedAt < MAX_AGE_MS) { set({ rates: c.rates, asOf: c.asOf, source: c.source, status: 'cached' }); return; }
    if (typeof navigator !== 'undefined' && navigator.onLine === false) { set({ status: c ? 'cached' : 'unavailable', ...(c ? { rates: c.rates, asOf: c.asOf, source: c.source } : {}) }); return; }
    try {
      const fresh = await fetchRates();
      try { localStorage.setItem(RATES_KEY, JSON.stringify(fresh)); } catch {}
      set({ rates: fresh.rates, asOf: fresh.asOf, source: fresh.source, status: 'live' });
    } catch {
      if (c) set({ rates: c.rates, asOf: c.asOf, source: c.source, status: 'cached' }); else set({ status: get().rates ? 'cached' : 'unavailable' });
    }
  },
}));

const fmtCache = new Map<string, Intl.NumberFormat>();
function nf(code: string, compact = false) {
  const k = code + compact;
  let f = fmtCache.get(k);
  if (!f) {
    f = new Intl.NumberFormat(undefined, compact
      ? { style: 'currency', currency: code, notation: 'compact', maximumFractionDigits: 1 }
      : { style: 'currency', currency: code });
    fmtCache.set(k, f);
  }
  return f;
}

export function currencyDigits(code: string) {
  try { return new Intl.NumberFormat('en', { style: 'currency', currency: code }).resolvedOptions().maximumFractionDigits ?? 2; } catch { return 2; }
}

/** Display helpers. Falls back to USD when no rate is available for the chosen code. */
export function useCurrency() {
  const { code: chosen, rates, asOf, status, source } = useCurrencyStore();
  const rate = chosen === 'USD' ? 1 : rates?.[chosen];
  const code = rate ? chosen : 'USD';
  const r = rate || 1;
  return {
    code,
    chosen,
    fallbackToUsd: !rate && chosen !== 'USD',
    rate: r,
    asOf,
    status,
    source,
    fromUsd: (usd: number) => usd * r,
    toUsd: (local: number) => local / r,
    format: (usd: number, opts?: { compact?: boolean }) => nf(code, !!opts?.compact).format(usd * r),
  };
}
