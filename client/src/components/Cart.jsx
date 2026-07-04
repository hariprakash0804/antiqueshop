import React from 'react';

export function Cart({ isOpen, onClose, cartItems, onUpdateQuantity, onRemoveItem, onCheckout }) {
  if (!isOpen) return null;

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity" 
      />

      {/* Drawer */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-zinc-950 border-l border-zinc-900 flex flex-col justify-between p-6 shadow-2xl relative">
          {/* Cyber Scanline */}
          <div className="scanline"></div>

          {/* Close Indicator */}
          <div className="flex justify-between items-center pb-6 border-b border-zinc-900">
            <h2 className="text-lg font-display font-extrabold text-cyber-gold tracking-widest flex items-center gap-2">
              <span>ACQUISITION CART</span>
              <span className="text-[10px] text-cyber-cyan border border-cyber-cyan/30 rounded px-1.5 py-0.5 font-mono">
                {cartItems.length} UNITS
              </span>
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-cyber-gold font-display text-sm"
            >
              [CLOSE]
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto py-6 space-y-6 pr-1">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                <span className="text-4xl text-gray-700">🛒</span>
                <p className="text-xs font-display tracking-widest text-gray-500">TRANSACTION CART IS EMPTY</p>
              </div>
            ) : (
              cartItems.map((item) => {
                const productImages = item.imageUrl ? item.imageUrl.split(',').map(s => s.trim()).filter(Boolean) : [];
                const mainImg = productImages[0] || 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?q=80&w=400';

                return (
                  <div 
                    key={item.id}
                    className="flex gap-4 p-4 rounded-2xl bg-black/40 border border-zinc-900 hover:border-zinc-800 transition-colors animate-fade-in"
                  >
                    {/* Thumbnail */}
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-zinc-900 border border-zinc-850">
                      <img 
                        src={mainImg} 
                        alt={item.title}
                        className="h-full w-full object-cover filter contrast-[1.05]"
                      />
                    </div>

                    {/* Desc */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-sm font-display font-bold text-white tracking-wide truncate">
                          {item.title}
                        </h4>
                        <p className="text-xs text-cyber-gold font-display mt-1 font-mono">
                          ₹{parseFloat(item.price).toLocaleString('en-IN')}
                        </p>
                        
                        {/* Stock Warnings */}
                        {item.stock <= 2 ? (
                          <div className="text-[8px] font-mono text-red-400 mt-1 uppercase animate-pulse">
                            ⚠️ ONLY {item.stock} LEFT IN VAULT
                          </div>
                        ) : item.quantity === item.stock ? (
                          <div className="text-[8px] font-mono text-amber-500 mt-1 uppercase">
                            ⚠️ MAX STOCK REACHED ({item.stock})
                          </div>
                        ) : null}
                      </div>

                    {/* Controls */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2 border border-zinc-800 bg-black/50 rounded-lg p-0.5">
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                          className="h-6 w-6 text-xs text-gray-400 hover:text-white"
                        >
                          -
                        </button>
                        <span className="text-xs font-mono px-2 text-white">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          className="h-6 w-6 text-xs text-gray-400 hover:text-white"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="text-[10px] font-display text-red-500 hover:text-red-400 tracking-wider"
                      >
                        [REMOVE]
                      </button>
                    </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pricing & Checkout Summary */}
          {cartItems.length > 0 && (
            <div className="pt-6 border-t border-zinc-900 space-y-6">
              <div className="space-y-2 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">NET ASSETS:</span>
                  <span className="text-white">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">TRANSACTION TAX (0%):</span>
                  <span className="text-white">₹0.00</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-zinc-900">
                  <span className="font-display text-cyber-cyan tracking-wider">TOTAL INVOICE:</span>
                  <span className="font-display font-bold text-cyber-gold">
                    ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <button
                onClick={onCheckout}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-cyber-cyan to-blue-600 hover:from-blue-600 hover:to-cyber-cyan text-black font-display font-black tracking-widest text-xs transition-all transform active:scale-95 shadow-cyan-glow"
              >
                PROCEED TO SECURE GATEWAY
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
