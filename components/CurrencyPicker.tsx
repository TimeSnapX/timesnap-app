import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, Check } from 'lucide-react';
import { useCurrencyStore, useCurrency } from '../stores/currencyStore';

const PINNED = ['AUD', 'USD', 'EUR', 'GBP', 'NZD', 'JPY', 'CAD', 'SGD', 'CNY', 'INR'];

function symbolFor(code: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: code, currencyDisplay: 'narrowSymbol' })
      .formatToParts(0).find((p) => p.type === 'currency')?.value || code;
  } catch { return code; }
}
let names: Intl.DisplayNames | null = null;
function nameFor(code: string) {
  try { names = names || new Intl.DisplayNames(undefined, { type: 'currency' }); return names.of(code) || code; } catch { return code; }
}

export const CurrencyChip: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { chosen } = useCurrency();
  const open = useCurrencyStore((s) => s.openPicker);
  return (
    <button type="button" onClick={() => open(true)} aria-label={`Currency: ${chosen}. Change currency`}
      className={`inline-flex items-center gap-1.5 min-h-[36px] px-3 rounded-full border border-gold-500/30 bg-gold-500/10 text-gold-200 text-xs font-semibold tracking-wide ${className}`}>
      <span className="text-gold-400">{symbolFor(chosen)}</span>{chosen}
    </button>
  );
};

export const RatesNote: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { code, chosen, asOf, status, fallbackToUsd } = useCurrency();
  if (chosen === 'USD' && !fallbackToUsd) return null;
  if (fallbackToUsd) return <p className={`text-[11px] text-ink-400 ${className}`}>Exchange rates unavailable offline — showing USD.</p>;
  if (!asOf) return null;
  return (
    <p className={`text-[11px] text-ink-400 ${className}`}>
      Converted from USD to {code} · rates as of {new Date(asOf).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}{status === 'cached' ? ' (cached)' : ''}
    </p>
  );
};

export const CurrencyPicker: React.FC = () => {
  const { pickerOpen, openPicker, setCode, rates, code } = useCurrencyStore();
  const [q, setQ] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (pickerOpen) { setQ(''); setTimeout(() => inputRef.current?.focus(), 50); } }, [pickerOpen]);

  const list = useMemo(() => {
    const codes = Object.keys(rates || { USD: 1 }).filter((c) => { try { new Intl.NumberFormat('en', { style: 'currency', currency: c }); return true; } catch { return false; } });
    const all = codes.map((c) => ({ code: c, name: nameFor(c), symbol: symbolFor(c) }))
      .sort((a, b) => (PINNED.indexOf(a.code) + 1 || 99) - (PINNED.indexOf(b.code) + 1 || 99) || a.name.localeCompare(b.name));
    const s = q.trim().toLowerCase();
    return s ? all.filter((c) => c.code.toLowerCase().includes(s) || c.name.toLowerCase().includes(s) || c.symbol.toLowerCase() === s) : all;
  }, [rates, q]);

  if (!pickerOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center" role="dialog" aria-label="Choose currency">
      <button aria-label="Close" className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => openPicker(false)} />
      <div className="relative w-full md:max-w-md card rounded-b-none md:rounded-3xl max-h-[85vh] flex flex-col animate-rise pb-safe">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <h2 className="text-2xl font-semibold">Currency</h2>
            <p className="text-xs text-ink-400 mt-0.5">Values are estimated in USD and converted for display.</p>
          </div>
          <button onClick={() => openPicker(false)} aria-label="Close currency picker" className="p-2 -mr-2 text-ink-400"><X size={20} /></button>
        </div>
        <div className="px-5 pb-3">
          <label className="flex items-center gap-2 bg-ink-950/70 border border-white/[0.08] rounded-2xl px-4 min-h-[48px] focus-within:ring-2 focus-within:ring-gold-500/50">
            <Search size={18} className="text-ink-400" />
            <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search code or name (e.g. EUR, yen)"
              className="flex-1 bg-transparent outline-none text-white placeholder:text-ink-500" aria-label="Search currencies" />
          </label>
          {!rates && <p className="text-[11px] text-ink-400 mt-2">Exchange rates unavailable — only USD can be shown until you're back online.</p>}
        </div>
        <ul className="overflow-y-auto px-2 pb-3" data-testid="currency-list">
          {list.map((c) => (
            <li key={c.code}>
              <button type="button" onClick={() => setCode(c.code)} data-code={c.code}
                className={`w-full flex items-center gap-3 px-3 min-h-[52px] rounded-2xl text-left ${c.code === code ? 'bg-gold-500/10' : 'active:bg-white/[0.05] hover:bg-white/[0.03]'}`}>
                <span className="w-11 h-9 rounded-xl bg-ink-800 text-gold-300 text-sm font-semibold flex items-center justify-center">{c.symbol}</span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-white">{c.code}</span>
                  <span className="block text-xs text-ink-400 truncate">{c.name}</span>
                </span>
                {c.code === code && <Check size={18} className="text-gold-400" />}
              </button>
            </li>
          ))}
          {list.length === 0 && <li className="px-4 py-6 text-sm text-ink-400 text-center">No currency matches “{q}”.</li>}
        </ul>
      </div>
    </div>
  );
};
