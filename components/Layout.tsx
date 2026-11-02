import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, Camera, Wallet, Map, Coins, CreditCard, HelpCircle, Eye, LayoutGrid, ChevronRight } from 'lucide-react';

const navItems = [
  { to: '/', icon: Camera, label: 'Snap & Estimate', short: 'Snap' },
  { to: '/vault', icon: Wallet, label: 'Vault', short: 'Vault' },
  { to: '/roadmap', icon: Map, label: 'Roadmap', short: 'Roadmap' },
  { to: '/token', icon: Coins, label: '$TIME Token', short: '$TIME' },
  { to: '/subscriptions', icon: CreditCard, label: 'Subscriptions', short: 'Plans' },
  { to: '/vision', icon: Eye, label: 'Vision', short: 'Vision' },
  { to: '/faq', icon: HelpCircle, label: 'FAQ', short: 'FAQ' },
];
const PRIMARY = ['/', '/vault', '/token'];
const MORE = navItems.filter((n) => !PRIMARY.includes(n.to));

const isActive = (path: string, to: string) => (to === '/' ? path === '/' : path.startsWith(to));

export const Logo: React.FC<{ size?: 'sm' | 'md' }> = ({ size = 'md' }) => (
  <div className="flex items-center gap-2.5">
    <div className={`${size === 'sm' ? 'w-8 h-8 text-lg' : 'w-9 h-9 text-xl'} rounded-xl btn-gold shadow-glow flex items-center justify-center font-display font-bold`}>
      T
    </div>
    <span className={`${size === 'sm' ? 'text-lg' : 'text-xl'} font-display font-semibold tracking-tight`}>
      Time<span className="text-gold-400">Snap</span>
    </span>
  </div>
);

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const path = location.pathname;
  const current = navItems.find((n) => isActive(path, n.to));
  const moreActive = MORE.some((n) => isActive(path, n.to));

  useEffect(() => { setMoreOpen(false); window.scrollTo(0, 0); }, [path]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row text-white">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-white/[0.06] bg-ink-950/60 backdrop-blur-xl p-4 sticky top-0 h-screen overflow-y-auto">
        <div className="mb-8 px-3 pt-2"><Logo /></div>
        <nav className="flex-1 space-y-1" aria-label="Main">
          {navItems.map(({ to, icon: Icon, label }) => {
            const active = isActive(path, to);
            return (
              <Link key={to} to={to} aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${active ? 'bg-gold-500/15 text-gold-200 ring-1 ring-gold-500/30' : 'text-ink-400 hover:text-white hover:bg-white/[0.04]'}`}>
                <Icon size={20} />
                <span className="font-medium">{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="pt-4 border-t border-white/[0.06] text-xs text-ink-500 text-center">© 2026 ValueTime PTY LTD</div>
      </aside>

      {/* Mobile Header (sticky, compact) */}
      <header className="md:hidden sticky top-0 z-40 glass border-x-0 border-t-0 pt-safe">
        <div className="h-14 px-4 flex items-center justify-between">
          <Logo size="sm" />
          <span className="text-xs font-medium text-ink-400 uppercase tracking-widest">{current?.short}</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden">
        <div key={path} className="px-4 pt-5 pb-28 md:p-8 md:pb-10 max-w-5xl mx-auto animate-rise">
          {children}
          <p className="md:hidden mt-10 text-center text-xs text-ink-500">© 2026 ValueTime PTY LTD</p>
        </div>
      </main>

      {/* Bottom tab bar - Mobile */}
      <nav aria-label="Main" className="md:hidden fixed bottom-0 inset-x-0 z-40 glass border-x-0 border-b-0 pb-safe">
        <div className="grid grid-cols-4 h-16">
          {navItems.filter((n) => PRIMARY.includes(n.to)).map(({ to, icon: Icon, short }) => {
            const active = isActive(path, to) && !moreOpen;
            return (
              <Link key={to} to={to} aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${active ? 'text-gold-300' : 'text-ink-400'}`}>
                <span className={`flex items-center justify-center w-12 h-7 rounded-full transition-colors ${active ? 'bg-gold-500/15' : ''}`}><Icon size={20} /></span>
                {short}
              </Link>
            );
          })}
          <button type="button" onClick={() => setMoreOpen((o) => !o)} aria-expanded={moreOpen}
            className={`flex flex-col items-center justify-center gap-1 text-[11px] font-medium ${moreOpen || moreActive ? 'text-gold-300' : 'text-ink-400'}`}>
            <span className={`flex items-center justify-center w-12 h-7 rounded-full ${moreOpen || moreActive ? 'bg-gold-500/15' : ''}`}><LayoutGrid size={20} /></span>
            More
          </button>
        </div>
      </nav>

      {/* "More" bottom sheet */}
      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-30" role="dialog" aria-label="More pages">
          <button aria-label="Close" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMoreOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 pb-[calc(4rem+env(safe-area-inset-bottom))] animate-rise">
            <div className="mx-3 mb-3 card p-2">
              <div className="flex items-center justify-between px-3 pt-2 pb-1">
                <span className="text-xs uppercase tracking-widest text-ink-400">More</span>
                <button onClick={() => setMoreOpen(false)} aria-label="Close menu" className="p-2 -mr-2 text-ink-400"><X size={18} /></button>
              </div>
              {MORE.map(({ to, icon: Icon, label }) => (
                <Link key={to} to={to} onClick={() => setMoreOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3.5 rounded-2xl ${isActive(path, to) ? 'bg-gold-500/10 text-gold-200' : 'text-ink-200 active:bg-white/[0.05]'}`}>
                  <span className="w-9 h-9 rounded-xl bg-white/[0.05] flex items-center justify-center"><Icon size={18} /></span>
                  <span className="flex-1 font-medium">{label}</span>
                  <ChevronRight size={18} className="text-ink-500" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
