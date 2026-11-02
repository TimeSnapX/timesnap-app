import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { Download, X, MoreVertical, Share, ExternalLink, Check } from 'lucide-react';

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice?: Promise<{ outcome: 'accepted' | 'dismissed' }> };
type InstallState = { deferred: BIPEvent | null; installed: boolean };
declare global { interface Window { __tsInstall?: InstallState } }

const state = (): InstallState => (window.__tsInstall = window.__tsInstall || { deferred: null, installed: false });
const emit = () => window.dispatchEvent(new Event('ts-install-change'));

function isStandalone() {
  const mm = (q: string) => window.matchMedia && window.matchMedia(q).matches;
  return mm('(display-mode: standalone)') || mm('(display-mode: fullscreen)') || mm('(display-mode: minimal-ui)') || (navigator as any).standalone === true;
}

let snapshot = '';
function subscribe(cb: () => void) {
  window.addEventListener('ts-install-change', cb);
  const mq = window.matchMedia?.('(display-mode: standalone)');
  mq?.addEventListener?.('change', cb);
  return () => { window.removeEventListener('ts-install-change', cb); mq?.removeEventListener?.('change', cb); };
}
function getSnap() {
  const s = state();
  const next = `${!!s.deferred}|${s.installed || isStandalone()}`;
  if (next !== snapshot) snapshot = next;
  return snapshot;
}

// Hint sheet open state (shared between all buttons)
let hintOpen = false;
const setHint = (v: boolean) => { hintOpen = v; emit(); };

export function useInstall() {
  const snap = useSyncExternalStore(subscribe, getSnap);
  const [canPrompt, installed] = snap.split('|').map((x) => x === 'true');
  const [, force] = useState(0);
  useEffect(() => subscribe(() => force((n) => n + 1)), []);
  const install = async () => {
    const ev = state().deferred;
    if (!ev) { setHint(true); return; }
    state().deferred = null; emit();
    try {
      await ev.prompt();
      const choice = await (ev.userChoice || Promise.resolve({ outcome: 'dismissed' as const }));
      if (choice.outcome === 'accepted') { state().installed = true; emit(); }
      else setHint(true);
    } catch { setHint(true); }
  };
  return { canPrompt, installed, install, hintOpen };
}

type Platform = 'inapp' | 'ios' | 'android' | 'desktop';
function platform(): Platform {
  const ua = navigator.userAgent || '';
  if (/FBAN|FBAV|FB_IAB|Instagram|Messenger|MessengerForiOS|Line\/|Snapchat|TikTok|; wv\)/i.test(ua)) return 'inapp';
  if (/iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'desktop';
}

export const InstallChip: React.FC = () => {
  const { installed, install } = useInstall();
  if (installed) return null;
  return (
    <button type="button" onClick={install} data-testid="install-chip" aria-label="Install app"
      className="inline-flex items-center gap-1 min-h-[36px] px-3 rounded-full btn-gold text-xs font-semibold shadow-glow">
      <Download size={14} /> Install
    </button>
  );
};

export const InstallBanner: React.FC = () => {
  const { installed, install, canPrompt } = useInstall();
  if (installed) return null;
  return (
    <div className="card p-4 flex items-center gap-4 bg-gradient-to-br from-gold-500/[0.14] via-ink-900/80 to-ink-900/80 border-gold-500/25" data-testid="install-banner">
      <img src={`${import.meta.env.BASE_URL}icons/icon-192.png`} alt="" className="w-12 h-12 rounded-2xl flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white leading-tight">Install TimeSnap</p>
        <p className="text-xs text-ink-300 mt-0.5">Add it to your home screen for one-tap snaps, full screen, offline Vault.</p>
      </div>
      <button type="button" onClick={install} data-testid="install-btn" data-ready={canPrompt ? 'prompt' : 'hint'}
        className="btn-gold shadow-glow font-semibold rounded-2xl px-4 min-h-[48px] inline-flex items-center gap-2 flex-shrink-0 active:scale-[0.98] transition-transform">
        <Download size={18} /> Install app
      </button>
    </div>
  );
};

export const InstallHintSheet: React.FC = () => {
  const { hintOpen, installed } = useInstall();
  if (!hintOpen) return null;
  const p = platform();
  const close = () => setHint(false);
  const Step: React.FC<{ n: number; children: React.ReactNode }> = ({ n, children }) => (
    <li className="flex items-start gap-3"><span className="w-7 h-7 rounded-full bg-gold-500/15 text-gold-300 text-sm font-semibold flex items-center justify-center flex-shrink-0">{n}</span><span className="pt-0.5 text-ink-100">{children}</span></li>
  );
  return (
    <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center" role="dialog" aria-label="How to install TimeSnap" data-testid="install-hint">
      <button aria-label="Close" className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={close} />
      <div className="relative w-full md:max-w-md card rounded-b-none md:rounded-3xl p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] animate-rise">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-semibold">{installed ? 'TimeSnap is installed' : 'Install TimeSnap'}</h2>
            <p className="text-xs text-ink-400 mt-1">{installed ? 'Open it from your home screen.' : 'Your browser needs one quick step:'}</p>
          </div>
          <button onClick={close} aria-label="Close install help" className="p-2 -mr-2 text-ink-400"><X size={20} /></button>
        </div>
        {!installed && (
          <ol className="space-y-3 text-sm">
            {p === 'inapp' && (<>
              <Step n={1}>This is an in-app browser, which can't install apps. Tap the <b>⋯</b> or <ExternalLink size={14} className="inline -mt-0.5" /> menu and choose <b>Open in Chrome</b> (or Open in browser).</Step>
              <Step n={2}>In Chrome, tap <MoreVertical size={14} className="inline -mt-0.5" /> <b>menu</b> → <b>Install app</b> (or <b>Add to Home screen</b>).</Step>
            </>)}
            {p === 'ios' && (<>
              <Step n={1}>In Safari, tap <Share size={14} className="inline -mt-0.5" /> <b>Share</b>.</Step>
              <Step n={2}>Choose <b>Add to Home Screen</b>, then <b>Add</b>.</Step>
            </>)}
            {(p === 'android' || p === 'desktop') && (<>
              <Step n={1}>Tap Chrome's <MoreVertical size={14} className="inline -mt-0.5" /> <b>three-dot menu</b> (top right).</Step>
              <Step n={2}>Choose <b>Install app</b> (or <b>Add to Home screen</b>), then <b>Install</b>.</Step>
            </>)}
          </ol>
        )}
        <button onClick={close} className="mt-5 w-full min-h-[48px] rounded-2xl border border-white/10 bg-white/[0.04] font-semibold inline-flex items-center justify-center gap-2"><Check size={18} /> Got it</button>
      </div>
    </div>
  );
};
