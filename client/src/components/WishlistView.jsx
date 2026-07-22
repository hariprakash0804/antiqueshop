import React, { useState, useEffect } from 'react';
import { useToast } from './Toast';
import { API_BASE } from '../config';

export function WishlistView({ user, onAddToCart, setView }) {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/wishlist`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId) => {
    try {
      const res = await fetch(`${API_BASE}/api/wishlist/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        setItems(prev => prev.filter(i => i.productId !== productId));
        toast.info('Removed from wishlist');
      }
    } catch (err) {
      toast.error('Failed to remove item');
    }
  };

  const handleAddToCart = (product) => {
    onAddToCart(product);
    toast.success(`${product.title} added to cart`);
  };

  return (
    <div className="max-w-5xl mx-auto py-8 sm:py-12 px-4 sm:px-6 animate-fade-in">
      {/* Back button */}
      <button 
        onClick={() => setView('catalog')}
        className="mb-6 text-[10px] font-display tracking-widest text-gray-400 hover:text-cyber-gold transition-colors"
      >
        ← BACK TO CATALOGUE
      </button>

      <div className="flex items-center gap-4 mb-8">
        <h2 className="text-xl font-display font-extrabold text-cyber-gold tracking-widest">
          WISHLIST VAULT
        </h2>
        <span className="text-[10px] font-mono text-cyber-cyan border border-cyber-cyan/30 rounded px-2 py-0.5">
          {items.length} ITEMS
        </span>
      </div>

      {loading ? (
        <div className="text-center py-20 font-display text-cyber-gold text-sm holo-flicker">
          LOADING SAVED ITEMS...
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 space-y-4">
          <span className="text-5xl block">♡</span>
          <p className="text-gray-500 font-display text-xs tracking-widest">
            YOUR WISHLIST VAULT IS EMPTY
          </p>
          <button 
            onClick={() => setView('catalog')}
            className="px-6 py-2 rounded-xl border border-cyber-gold text-cyber-gold font-display text-xs tracking-widest hover:bg-cyber-gold/10 transition-all"
          >
            EXPLORE CATALOGUE
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {items.map(item => {
            const product = item.product;
            if (!product) return null;
            return (
              <div key={item.id} className="group rounded-3xl bg-zinc-950/70 border border-zinc-900 hover:border-cyber-gold/30 transition-all duration-500 overflow-hidden">
                {/* Image */}
                <div className="relative h-48 overflow-hidden bg-black">
                  <img 
                    src={product.imageUrl || 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?q=80&w=400'} 
                    alt={product.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                  <button 
                    onClick={() => handleRemove(product.id)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/80 border border-red-500/30 flex items-center justify-center text-red-500 hover:bg-red-500/20 transition-all"
                    title="Remove from wishlist"
                  >
                    ♥
                  </button>
                  <span className="absolute top-3 left-3 bg-black/80 border border-cyber-cyan text-cyber-cyan font-display text-[9px] tracking-widest rounded-lg px-2 py-0.5">
                    {product.category?.toUpperCase()}
                  </span>
                </div>

                {/* Details */}
                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="text-sm font-display font-bold text-white tracking-wide group-hover:text-cyber-gold transition-colors">
                      {product.title}
                    </h3>
                    <p className="text-[10px] text-gray-500 font-mono mt-1">
                      BY: {product.seller?.name || 'Unknown Seller'}
                    </p>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-lg font-display font-extrabold text-cyber-gold">
                      ₹{parseFloat(product.price).toLocaleString('en-IN')}
                    </span>
                    <button 
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock === 0}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyber-gold to-yellow-600 text-black font-display font-bold text-[10px] tracking-widest transition-all active:scale-95 disabled:opacity-30"
                    >
                      ACQUIRE
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
