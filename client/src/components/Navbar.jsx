import React, { useState } from 'react';

export function Navbar({ user, cartCount, wishlistCount = 0, onOpenCart, onOpenComms, onOpenAuth, onLogout, setView, activeView }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLink = (label, viewName) => (
    <button 
      onClick={() => { setView(viewName); setMobileMenuOpen(false); }}
      className={`hover:text-cyber-gold transition-colors ${activeView === viewName ? 'text-cyber-gold font-bold underline decoration-2 underline-offset-8' : ''}`}
    >
      {label}
    </button>
  );

  return (
    <header className="sticky top-0 z-40 w-full bg-cyber-dark/85 backdrop-blur-md border-b border-zinc-900 py-4 px-6 lg:px-12 transition-all">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo Console */}
        <div 
          onClick={() => setView('catalog')}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <span className="text-xl font-display font-extrabold tracking-widest bg-gradient-to-r from-cyber-gold to-yellow-600 bg-clip-text text-transparent group-hover:drop-shadow-cyan-glow transition-all">
            NEXUS
          </span>
          <span className="hidden sm:inline font-display text-[9px] border border-cyber-cyan text-cyber-cyan rounded-md px-1.5 py-0.5 tracking-widest holo-flicker">
            v4.0_SECURE
          </span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 font-display text-xs tracking-widest text-gray-400">
          {navLink('CATALOGUE', 'catalog')}
          {user && navLink('CONTROL PANEL', 'dashboard')}
          {user && navLink('WISHLIST', 'wishlist')}
        </nav>

        {/* Action Center */}
        <div className="flex items-center gap-3">
          {/* Wishlist icon (desktop) */}
          {user && (
            <button 
              onClick={() => setView('wishlist')}
              className="hidden md:flex relative p-2.5 rounded-xl border border-zinc-800 hover:border-red-400 bg-zinc-950/50 text-gray-300 hover:text-red-400 transition-all duration-300"
              title="Wishlist"
            >
              <span className="text-sm">♥</span>
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white border border-black animate-pulse">
                  {wishlistCount}
                </span>
              )}
            </button>
          )}

          {/* Chat / Comms Terminal Icon */}
          {user && (
            <button 
              onClick={onOpenComms}
              className="relative p-2.5 rounded-xl border border-zinc-800 hover:border-cyber-gold bg-zinc-950/50 text-gray-300 hover:text-cyber-gold transition-all duration-300"
              title="Neural Comms Terminal"
            >
              <span className="font-display text-sm">💬</span>
            </button>
          )}

          {/* Cart Icon */}
          <button 
            onClick={onOpenCart}
            className="relative p-2.5 rounded-xl border border-zinc-800 hover:border-cyber-cyan bg-zinc-950/50 text-gray-300 hover:text-cyber-cyan transition-all duration-300"
            title="Open Cart"
          >
            <span className="font-display text-sm">🛒</span>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-cyber-cyan text-[10px] font-bold text-black border border-black animate-pulse">
                {cartCount}
              </span>
            )}
          </button>

          {/* User Auth Console */}
          {user ? (
            <div className="hidden md:flex items-center gap-3 bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-1.5">
              <button 
                onClick={() => setView('profile')}
                className="text-right group"
              >
                <div className="text-xs font-mono font-medium text-white group-hover:text-cyber-gold transition-colors">{user.name}</div>
                <div className="text-[9px] font-display tracking-widest text-cyber-gold">{user.role.toUpperCase()}</div>
              </button>
              <button 
                onClick={onLogout}
                className="text-[10px] font-display tracking-widest border border-red-500/30 hover:border-red-500 text-red-400 hover:bg-red-500/10 rounded-lg px-2 py-1 transition-all"
              >
                DISCONNECT
              </button>
            </div>
          ) : (
            <button 
              onClick={onOpenAuth}
              className="hidden md:block px-5 py-2 rounded-xl bg-transparent border border-cyber-gold text-cyber-gold font-display font-medium tracking-widest text-xs hover:bg-cyber-gold hover:text-black transition-all duration-300 active:scale-95"
            >
              CONNECT
            </button>
          )}

          {/* Mobile Hamburger */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl border border-zinc-800 text-gray-300 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-4 pt-4 border-t border-zinc-900 space-y-3 animate-fade-in">
          <nav className="flex flex-col gap-3 font-display text-xs tracking-widest text-gray-400">
            <button 
              onClick={() => { setView('catalog'); setMobileMenuOpen(false); }}
              className={`text-left py-2 px-3 rounded-xl transition-all ${activeView === 'catalog' ? 'text-cyber-gold bg-cyber-gold/10' : 'hover:text-white'}`}
            >
              CATALOGUE
            </button>
            {user && (
              <>
                <button 
                  onClick={() => { setView('dashboard'); setMobileMenuOpen(false); }}
                  className={`text-left py-2 px-3 rounded-xl transition-all ${activeView === 'dashboard' ? 'text-cyber-gold bg-cyber-gold/10' : 'hover:text-white'}`}
                >
                  CONTROL PANEL
                </button>
                <button 
                  onClick={() => { setView('wishlist'); setMobileMenuOpen(false); }}
                  className={`text-left py-2 px-3 rounded-xl transition-all ${activeView === 'wishlist' ? 'text-cyber-gold bg-cyber-gold/10' : 'hover:text-white'}`}
                >
                  ♥ WISHLIST
                </button>
                <button 
                  onClick={() => { setView('profile'); setMobileMenuOpen(false); }}
                  className={`text-left py-2 px-3 rounded-xl transition-all ${activeView === 'profile' ? 'text-cyber-gold bg-cyber-gold/10' : 'hover:text-white'}`}
                >
                  ⚙ PROFILE SETTINGS
                </button>
                <div className="flex items-center justify-between py-2 px-3 bg-zinc-950/50 rounded-xl">
                  <div>
                    <div className="text-xs text-white">{user.name}</div>
                    <div className="text-[9px] text-cyber-gold">{user.role.toUpperCase()}</div>
                  </div>
                  <button 
                    onClick={() => { onLogout(); setMobileMenuOpen(false); }}
                    className="text-[10px] font-display text-red-400 border border-red-500/30 rounded-lg px-2 py-1"
                  >
                    DISCONNECT
                  </button>
                </div>
              </>
            )}
            {!user && (
              <button 
                onClick={() => { onOpenAuth(); setMobileMenuOpen(false); }}
                className="text-left py-2 px-3 rounded-xl border border-cyber-gold text-cyber-gold hover:bg-cyber-gold/10 transition-all"
              >
                CONNECT
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
