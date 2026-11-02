import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Camera, Wallet, Map, Coins, CreditCard, Info, HelpCircle, Eye } from 'lucide-react';

interface NavItemProps {
  to: string;
  icon: any;
  label: string;
  onClick?: () => void;
  active: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon: Icon, label, onClick, active }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center space-x-2 px-4 py-3 rounded-xl transition-colors ${
      active ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </Link>
);

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { to: '/', icon: Camera, label: 'Snap & Estimate' },
    { to: '/vault', icon: Wallet, label: 'Vault' },
    { to: '/roadmap', icon: Map, label: 'Roadmap' },
    { to: '/token', icon: Coins, label: '$TIME Token' },
    { to: '/subscriptions', icon: CreditCard, label: 'Subscriptions' },
    { to: '/vision', icon: Eye, label: 'Vision' },
    { to: '/faq', icon: HelpCircle, label: 'FAQ' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col md:flex-row text-white">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-gray-800 p-4 sticky top-0 h-screen overflow-y-auto">
        <div className="flex items-center space-x-2 mb-8 px-4">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="font-bold text-lg">T</span>
          </div>
          <span className="text-xl font-bold tracking-tight">TimeSnap</span>
        </div>
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <NavItem 
              key={item.to} 
              to={item.to}
              icon={item.icon}
              label={item.label}
              active={location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to))} 
            />
          ))}
        </nav>
        <div className="pt-4 border-t border-gray-800 text-xs text-gray-500 text-center">
          © 2026 ValueTime PTY LTD
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden bg-gray-900 p-4 flex justify-between items-center border-b border-gray-800 sticky top-0 z-50">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="font-bold text-white">T</span>
          </div>
          <span className="text-lg font-bold">TimeSnap</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-gray-950 pt-20 px-4 pb-4 overflow-y-auto">
          <nav className="space-y-2">
             {navItems.map((item) => (
              <NavItem 
                key={item.to} 
                to={item.to}
                icon={item.icon}
                label={item.label}
                onClick={() => setIsMobileMenuOpen(false)}
                active={location.pathname === item.to}
              />
            ))}
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden">
        <div className="p-4 md:p-8 max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};