import React, { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useMarkets, Kind, MarketAsset } from '../services/markets';
import { useCurrency, useCurrencyStore } from '../stores/currencyStore';

const TABS: { k: Kind; label: string }[] = [{ k: 'crypto', label: 'Crypto' }, { k: 'stocks', label: 'Stocks' }, { k: 'commodities', label: 'Commodities' }];

function fmtUnits(n: number) {
  if (!isFinite(n) || n <= 0) return '—';
  if (n < 0.0001) return n.toLocaleString(undefined, { maximumFractionDigits: 8 });
  if (n < 1) return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
  return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

export function MarketsPanel({ usd }: { usd: number }) {
  const [tab, setTab] = useState<Kind>('crypto');
  const [q, setQ] = useState('');
  const feeds = useMarkets((s) => s.feeds);
  const load = useMarkets((s) => s.load);
  const rates = useCurrencyStore((s) => s.rates);
  const cur = useCurrency();
  useEffect(() => { (['crypto', 'stocks', 'commodities'] as Kind[]).forEach((k) => load(k, rates)); }, [load, rates]);
  const feed = feeds[tab];
  const items = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? feed.items.filter((a) => a.name.toLowerCase().includes(t) || a.symbol.toLowerCase().includes(t)) : feed.items;
  }, [feed.items, q]);

  return (
    <div className="px-5 pb-2 border-t border-white/[0.06] pt-4" data-testid="markets-panel">
      <h3 className="text-[11px] font-semibold text-gold-400 uppercase tracking-wider mb-2">Purchasing Power Conversions</h3>
      <div className="flex gap-1 mb-2" role="tablist">
        {TABS.map(({ k, label }) => (
          <button key={k} role="tab" aria-selected={tab === k} data-tab={k} onClick={() => setTab(k)}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold ${tab === k ? 'bg-gold-500/20 text-gold-300' : 'bg-ink-800 text-ink-400'}`}>
            {label} <span className="opacity-60">{feeds[k].items.length || ''}</span>
          </button>
        ))}
      </div>
      <label className="flex items-center gap-2 bg-ink-800 rounded-xl px-3 py-2 mb-1">
        <Search size={14} className="text-ink-500" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or symbol" className="bg-transparent text-sm text-white outline-none flex-1" />
      </label>
      <p className="text-[11px] text-ink-500 mb-1" data-testid="asof">
        {feed.status === 'loading' ? 'Loading prices…' : feed.status === 'error' ? 'Prices unavailable right now' :
          `${feed.status === 'cached' ? 'Cached' : 'Live'} · as of ${feed.asOf ? new Date(feed.asOf).toLocaleString() : 'unknown'} · ${feed.source}`}
      </p>
      <div className="max-h-[420px] overflow-y-auto" data-testid="market-list">
        {items.map((a: MarketAsset) => (
          <div key={a.key} className="flex justify-between items-center py-2 border-b border-white/[0.05] gap-2" data-row={a.kind}>
            <div className="flex items-center gap-2 min-w-0">
              {a.image ? <img src={a.image} alt="" className="w-5 h-5 rounded-full" loading="lazy" /> : <span className="text-[10px] font-bold bg-ink-800 text-ink-300 px-1.5 py-1 rounded-md">{a.symbol}</span>}
              <div className="min-w-0">
                <div className="text-sm text-ink-200 truncate">{a.name}</div>
                <div className="text-[11px] text-ink-500">{cur.format(a.priceUsd)}{a.unit ? ` / ${a.unit}` : ''}{a.native ? ` (${a.native.price.toLocaleString()} ${a.native.currency})` : ''}</div>
              </div>
            </div>
            <span className="font-mono text-sm text-white tabular-nums text-right whitespace-nowrap">
              = {fmtUnits(usd / a.priceUsd)} <span className="text-ink-400 text-xs">{a.kind === 'commodities' ? a.unit : a.kind === 'stocks' ? 'sh' : a.symbol}</span>
            </span>
          </div>
        ))}
        {feed.status !== 'loading' && !items.length && <p className="text-sm text-ink-400 py-3">{feed.status === 'error' ? 'Unavailable — no prices shown rather than guessing.' : 'No matches.'}</p>}
      </div>
      <p className="text-[10px] text-ink-500 mt-2">Indicative only, not financial advice. Quotes may be delayed.</p>
    </div>
  );
}
