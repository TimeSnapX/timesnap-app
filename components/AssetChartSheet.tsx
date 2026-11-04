import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { MarketAsset } from '../services/markets';
import { RANGES, Range, ChartData, loadChart, cachedChart } from '../services/chart';
import { useCurrency, useCurrencyStore } from '../stores/currencyStore';

const W = 360, H = 200, PAD = 6;

function fmtUnits(n: number) {
  if (!isFinite(n) || n <= 0) return '—';
  return n.toLocaleString(undefined, { maximumFractionDigits: n < 0.0001 ? 8 : n < 1 ? 6 : 4 });
}

export function AssetChartSheet({ asset, usd, onClose }: { asset: MarketAsset; usd: number; onClose: () => void }) {
  const [range, setRange] = useState<Range>('1m');
  const [data, setData] = useState<ChartData | null>(() => cachedChart(asset, '1m'));
  const [state, setState] = useState<'loading' | 'ok' | 'error'>(data ? 'ok' : 'loading');
  const [hover, setHover] = useState<number | null>(null);
  const [shown, setShown] = useState<Range | null>(data ? '1m' : null);
  const rates = useCurrencyStore((s) => s.rates);
  const cur = useCurrency();
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    let live = true;
    const c = cachedChart(asset, range);
    setHover(null);
    if (c) { setData(c); setState('ok'); setShown(range); return; }
    setState('loading'); setData(null);
    loadChart(asset, range, rates).then((d) => { if (live) { setData(d); setState('ok'); setShown(range); } }).catch(() => { if (live) { setState('error'); setShown(range); } });
    return () => { live = false; };
  }, [asset, range, rates]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [onClose]);

  const g = useMemo(() => {
    if (!data) return null;
    const pts = data.points;
    const t0 = pts[0][0], t1 = pts[pts.length - 1][0];
    let lo = Infinity, hi = -Infinity;
    for (const [, p] of pts) { if (p < lo) lo = p; if (p > hi) hi = p; }
    const span = hi - lo || hi * 0.01 || 1;
    const x = (t: number) => PAD + ((t - t0) / (t1 - t0 || 1)) * (W - 2 * PAD);
    const y = (p: number) => PAD + (1 - (p - lo) / span) * (H - 2 * PAD);
    const line = pts.map(([t, p], i) => `${i ? 'L' : 'M'}${x(t).toFixed(1)},${y(p).toFixed(1)}`).join('');
    const area = `${line}L${x(t1).toFixed(1)},${H}L${x(t0).toFixed(1)},${H}Z`;
    return { pts, x, y, line, area, lo, hi, first: pts[0][1], last: pts[pts.length - 1][1] };
  }, [data]);

  const pick = (clientX: number) => {
    if (!g || !svgRef.current) return;
    const r = svgRef.current.getBoundingClientRect();
    const sx = ((clientX - r.left) / r.width) * W;
    let best = 0, bd = Infinity;
    for (let i = 0; i < g.pts.length; i++) { const d = Math.abs(g.x(g.pts[i][0]) - sx); if (d < bd) { bd = d; best = i; } }
    setHover(best);
  };

  const change = g ? ((g.last - g.first) / g.first) * 100 : null;
  const up = (change ?? 0) >= 0;
  const hp = g && hover !== null ? g.pts[hover] : null;
  const fmtDate = (t: number) => new Date(t).toLocaleString(undefined, range === '1d' || range === '7d'
    ? { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' } : { day: 'numeric', month: 'short', year: 'numeric' });
  const unitLabel = asset.kind === 'commodities' ? asset.unit : asset.kind === 'stocks' ? 'sh' : asset.symbol;
  const units = g ? usd / g.first : 0;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60" onClick={onClose} data-testid="chart-sheet">
      <div className="w-full max-w-md bg-ink-900 border-t border-gold-500/30 rounded-t-3xl p-5 pb-[max(2rem,env(safe-area-inset-bottom))] max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()} data-state={state} data-range-shown={shown ?? ''} role="dialog" aria-label={`${asset.name} price chart`}>
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2 min-w-0">
            {asset.image ? <img src={asset.image} alt="" className="w-7 h-7 rounded-full" /> : <span className="text-[10px] font-bold bg-ink-800 text-gold-300 px-1.5 py-1 rounded-md">{asset.symbol}</span>}
            <div className="min-w-0">
              <div className="text-white font-semibold truncate">{asset.name}</div>
              <div className="text-[11px] text-ink-500">{asset.symbol}{asset.unit ? ` · per ${asset.unit}` : ''}</div>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-2 -m-2 text-ink-400"><X size={20} /></button>
        </div>
        <div className="mb-2 min-h-[52px]">
          <div className="text-2xl font-semibold text-white tabular-nums" data-testid="chart-price">{cur.format(hp ? hp[1] : (g ? g.last : asset.priceUsd))}</div>
          <div className="text-xs tabular-nums">
            {hp ? <span className="text-gold-300" data-testid="crosshair-label">{fmtDate(hp[0])}</span>
              : change !== null ? <span className={up ? 'text-emerald-400' : 'text-rose-400'} data-testid="chart-change">{up ? '+' : ''}{change.toFixed(2)}% · {RANGES.find((x) => x.r === range)!.label}</span>
              : <span className="text-ink-500">&nbsp;</span>}
          </div>
        </div>
        <div className="relative h-[200px] select-none" style={{ touchAction: 'none' }}>
          {state === 'loading' && <div className="absolute inset-0 flex items-center justify-center text-sm text-ink-400 animate-pulse" data-testid="chart-loading">Loading chart…</div>}
          {state === 'error' && <div className="absolute inset-0 flex items-center justify-center text-sm text-ink-400" data-testid="chart-error">Chart unavailable</div>}
          {g && state === 'ok' && (
            <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-full" data-testid="chart-svg"
              onPointerDown={(e) => { (e.target as Element).setPointerCapture?.(e.pointerId); pick(e.clientX); }}
              onPointerMove={(e) => { pick(e.clientX); }}
              onPointerUp={(e) => e.pointerType !== 'mouse' && setHover(null)} onPointerLeave={() => setHover(null)} onPointerCancel={() => setHover(null)}>
              <defs>
                <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E5A632" stopOpacity="0.45" /><stop offset="100%" stopColor="#E5A632" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={g.area} fill="url(#goldFill)" />
              <path d={g.line} fill="none" stroke="#F2BC4B" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
              {hp && <>
                <line x1={g.x(hp[0])} x2={g.x(hp[0])} y1={0} y2={H} stroke="#FCE29A" strokeOpacity="0.6" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
                <circle cx={g.x(hp[0])} cy={g.y(hp[1])} r="4" fill="#F2BC4B" stroke="#101830" strokeWidth="2" vectorEffect="non-scaling-stroke" />
              </>}
            </svg>
          )}
        </div>
        <div className="flex gap-1 mt-3" role="tablist">
          {RANGES.map(({ r, label }) => (
            <button key={r} data-range={r} aria-selected={range === r} onClick={() => setRange(r)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold ${range === r ? 'bg-gold-500/20 text-gold-300' : 'bg-ink-800 text-ink-400'}`}>{label}</button>
          ))}
        </div>
        {g && state === 'ok' && (
          <>
            <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
              <div className="bg-ink-800 rounded-xl p-2"><div className="text-ink-500">High</div><div className="text-white tabular-nums" data-testid="chart-high">{cur.format(g.hi)}</div></div>
              <div className="bg-ink-800 rounded-xl p-2"><div className="text-ink-500">Low</div><div className="text-white tabular-nums" data-testid="chart-low">{cur.format(g.lo)}</div></div>
            </div>
            {usd > 0 && (
              <div className="mt-3 bg-gold-500/10 border border-gold-500/20 rounded-xl p-3 text-xs text-ink-200" data-testid="chart-worth">
                Your item ({cur.format(usd)}) at the start of this range = <b className="text-white">{fmtUnits(units)} {unitLabel}</b>.
                Held until now, that's worth <b className={up ? 'text-emerald-400' : 'text-rose-400'}>{cur.format(units * g.last)}</b>.
                <div className="text-ink-400 mt-1">Today the same {cur.format(usd)} buys {fmtUnits(usd / g.last)} {unitLabel}.</div>
              </div>
            )}
            <p className="text-[10px] text-ink-500 mt-2">{data!.source} · {fmtDate(g.pts[0][0])} – {fmtDate(g.pts[g.pts.length - 1][0])} · indicative, not financial advice.</p>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
