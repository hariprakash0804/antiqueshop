import React, { useState, useEffect, useRef } from 'react';
import { useToast } from './Toast';
import { API_BASE } from '../config';

// Star Rating Display
function StarRating({ rating, count }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) {
      stars.push(<span key={i} className="text-cyber-gold">★</span>);
    } else if (i - 0.5 <= rating) {
      stars.push(<span key={i} className="text-cyber-gold">★</span>);
    } else {
      stars.push(<span key={i} className="text-zinc-700">★</span>);
    }
  }
  return (
    <div className="flex items-center gap-1 text-xs">
      <span className="flex">{stars}</span>
      <span className="text-[10px] text-gray-500 font-mono">({count})</span>
    </div>
  );
}

// Review Modal Component with Rating distribution logs breakdown
function ReviewModal({ product, user, onClose }) {
  const toast = useToast();
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/reviews/product/${product.id}`);
      const data = await res.json();
      setReviews(data.reviews || []);
      setAvgRating(data.avgRating || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.warning('Please log in to submit a review');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ productId: product.id, rating: newRating, comment: newComment, imageUrl: newImageUrl })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success('Review submitted successfully');
      setNewComment('');
      setNewImageUrl('');
      fetchReviews();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate rating distribution
  const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach(r => {
    const star = Math.round(r.rating);
    if (ratingCounts[star] !== undefined) ratingCounts[star]++;
  });
  const totalReviews = reviews.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden glass-panel-neon-gold rounded-3xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-zinc-900 flex justify-between items-start">
          <div>
            <h3 className="text-lg font-display font-bold text-white tracking-wider">{product.title}</h3>
            <div className="flex items-center gap-3 mt-2">
              <StarRating rating={avgRating} count={reviews.length} />
              <span className="text-sm font-display font-bold text-cyber-gold">{avgRating}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-cyber-gold font-display text-lg">[X]</button>
        </div>

        {/* Reviews list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* Ratings distribution visual breakdown */}
          {!loading && totalReviews > 0 && (
            <div className="p-4 rounded-2xl bg-black/60 border border-zinc-900/60 space-y-2 mb-2 font-mono text-[10px]">
              <span className="text-[8px] font-display text-cyber-gold tracking-widest block mb-1">RATING DISTRIBUTION LOGS:</span>
              {[5, 4, 3, 2, 1].map(star => {
                const count = ratingCounts[star];
                const percent = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-3">
                    <span className="w-12 text-zinc-500 uppercase">{star} STARS</span>
                    <div className="flex-1 h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                      <div 
                        style={{ width: `${percent}%` }}
                        className="h-full bg-cyber-gold rounded-full"
                      />
                    </div>
                    <span className="w-8 text-right text-cyber-cyan">{count}</span>
                  </div>
                );
              })}
            </div>
          )}

          {loading ? (
            <div className="text-center text-cyber-gold font-display text-sm">LOADING REVIEWS...</div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-10 text-gray-500 font-display text-xs">NO REVIEWS YET</div>
          ) : (
            reviews.map(review => (
              <div key={review.id} className="p-4 rounded-2xl bg-black/40 border border-zinc-900 space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-display font-bold text-cyber-gold">
                      {review.reviewer?.name?.charAt(0) || '?'}
                    </div>
                    <span className="text-xs font-mono text-white">{review.reviewer?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StarRating rating={review.rating} count={0} />
                    <span className="text-[10px] text-gray-500 font-mono">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {review.comment && (
                  <p className="text-xs text-gray-400 font-sans leading-relaxed pl-9">{review.comment}</p>
                )}
                {review.imageUrl && (
                  <div className="pl-9 pt-2">
                    <img 
                      src={review.imageUrl} 
                      alt="Review Attachment" 
                      className="w-24 h-24 object-cover rounded-xl border border-zinc-900 filter contrast-[1.05]"
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Submit Review */}
        {user && (
          <form onSubmit={handleSubmit} className="p-6 border-t border-zinc-900 space-y-3">
            <div className="flex items-center gap-4">
              <label className="text-[10px] font-display text-gray-400 tracking-wider">YOUR RATING:</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n} type="button"
                    onClick={() => setNewRating(n)}
                    className={`text-lg transition-colors ${n <= newRating ? 'text-cyber-gold' : 'text-zinc-700'} hover:text-cyber-gold`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input 
                type="text" value={newComment} onChange={e => setNewComment(e.target.value)}
                placeholder="Write your review..."
                className="flex-1 bg-black/60 border border-zinc-800 focus:border-cyber-gold focus:outline-none rounded-xl p-3 text-sm font-mono placeholder-zinc-700 text-white"
              />
              
              <div className="flex-1 flex gap-2 items-center bg-black/60 border border-zinc-800 rounded-xl px-3 py-1.5 min-w-[200px]">
                <span className="text-[10px] font-display text-zinc-500 tracking-wider shrink-0">PHOTO:</span>
                <input 
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setNewImageUrl(reader.result);
                        toast.success("✦ IMAGE ATTACHED.");
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="flex-1 text-xs text-zinc-500 file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[8px] file:font-display file:font-bold file:bg-cyber-cyan file:text-black hover:file:bg-cyan-400 file:cursor-pointer"
                />
                {newImageUrl && (
                  <div className="flex items-center gap-2 shrink-0">
                    <img src={newImageUrl} className="w-8 h-8 object-cover rounded border border-zinc-700" alt="Preview" />
                    <button 
                      type="button" 
                      onClick={() => setNewImageUrl('')} 
                      className="text-red-500 text-[10px] font-display hover:text-red-400 font-bold"
                    >
                      [REMOVE]
                    </button>
                  </div>
                )}
              </div>

              <button 
                type="submit" disabled={submitting}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyber-gold to-yellow-600 text-black font-display font-bold text-[10px] tracking-widest transition-all active:scale-95 shrink-0"
              >
                {submitting ? '...' : 'POST'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export function Catalog({ onAddToCart, user }) {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [reviewProduct, setReviewProduct] = useState(null);
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [auctionTimeLeft, setAuctionTimeLeft] = useState('');

  useEffect(() => {
    if (!selectedProduct || (selectedProduct.category !== 'Antiques' && selectedProduct.stock !== 1)) {
      setAuctionTimeLeft('');
      return;
    }

    const offsetHours = ((selectedProduct.id * 17) % 6) + 1; // 1 to 6 hours
    const offsetMins = (selectedProduct.id * 23) % 60;
    const targetTime = Date.now() + offsetHours * 3600000 + offsetMins * 60000;

    const updateTimer = () => {
      const diff = targetTime - Date.now();
      if (diff <= 0) {
        setAuctionTimeLeft('AUCTION TERMINATED');
        return;
      }
      const hrs = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      
      const pad = (num) => String(num).padStart(2, '0');
      setAuctionTimeLeft(`${pad(hrs)}h ${pad(mins)}m ${pad(secs)}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [selectedProduct]);

  const categories = ['All', 'Jewelry', 'Watches', 'Antiques', 'Coins'];

  const isFirstMount = useRef(true);

  useEffect(() => {
    fetchProducts();
  }, [category, sort, page, minPrice, maxPrice]);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    const delayDebounceFn = setTimeout(() => {
      setPage(1);
      fetchProducts();
    }, 450);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  useEffect(() => {
    if (user) fetchWishlistIds();
  }, [user]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}/api/products?category=${category}&sort=${sort}&page=${page}&limit=12`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (minPrice) url += `&minPrice=${minPrice}`;
      if (maxPrice) url += `&maxPrice=${maxPrice}`;
      const response = await fetch(url);
      const data = await response.json();
      setProducts(data.products || []);
      setPagination(data.pagination || null);
    } catch (error) {
      console.error('Fetch products error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWishlistIds = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/wishlist`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await res.json();
      setWishlistIds(new Set(data.map(item => item.productId)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const toggleWishlist = async (productId) => {
    if (!user) {
      toast.warning('Please connect to manage your wishlist');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/wishlist/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ productId })
      });
      const data = await res.json();
      if (data.action === 'added') {
        setWishlistIds(prev => new Set([...prev, productId]));
        toast.success('Added to wishlist');
      } else {
        setWishlistIds(prev => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
        toast.info('Removed from wishlist');
      }
    } catch (err) {
      toast.error('Wishlist action failed');
    }
  };

  const handleAddToCart = (product) => {
    onAddToCart(product);
    toast.success(`${product.title} added to cart`);
  };

  // Split images list
  const modalImages = selectedProduct?.imageUrl 
    ? selectedProduct.imageUrl.split(',').map(img => img.trim()).filter(Boolean)
    : [];

  return (
    <section id="catalog-section" className="py-8 sm:py-12 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto space-y-6 sm:space-y-10">
      
      {/* Search, Filter & Sort Console */}
      <div className="flex flex-col gap-5 sm:gap-6 bg-zinc-950/80 border border-zinc-900 rounded-3xl p-4 sm:p-6 glass-panel">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 sm:gap-6">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
            <input 
              type="text"
              placeholder="Search catalog matrix..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black/60 border border-zinc-800 focus:border-cyber-cyan focus:outline-none rounded-2xl py-2.5 sm:py-3 pl-4 sm:pl-5 pr-12 text-xs sm:text-sm font-mono placeholder-zinc-700 transition-all text-white"
            />
            <button 
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-cyber-cyan font-display hover:text-white transition-colors text-[10px] sm:text-xs"
            >
              [SCAN]
            </button>
          </form>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center w-full lg:w-auto">
            {/* Categories */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setCategory(cat); setSearch(''); setPage(1); }}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-display tracking-widest transition-all ${
                    category === cat 
                      ? 'bg-cyber-gold text-black font-extrabold border border-cyber-gold shadow-gold-glow'
                      : 'bg-transparent border border-zinc-800 text-gray-400 hover:text-white hover:border-zinc-700'
                  }`}
                >
                  {cat.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Sort */}
            <select 
              value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}
              className="w-full sm:w-auto bg-black border border-zinc-800 text-[11px] sm:text-xs font-display text-cyber-cyan rounded-xl p-2.5 focus:outline-none focus:border-cyber-cyan"
            >
              <option value="newest">NEWEST</option>
              <option value="oldest">OLDEST</option>
              <option value="price_asc">PRICE ↑</option>
              <option value="price_desc">PRICE ↓</option>
            </select>
          </div>
        </div>

        {/* Additional Filters row */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-zinc-900/60 text-xs">
          <span className="text-[9px] sm:text-[10px] font-display text-gray-500 tracking-wider">VALUATION THRESHOLD:</span>
          <div className="flex items-center gap-2">
            <input 
              type="number" 
              placeholder="MIN INR" 
              value={minPrice} 
              onChange={e => { setMinPrice(e.target.value); setPage(1); }}
              className="w-24 sm:w-28 bg-black/50 border border-zinc-800 focus:border-cyber-gold text-xs font-mono rounded-lg p-2 focus:outline-none text-white text-center"
            />
            <span className="text-zinc-600 text-xs">➔</span>
            <input 
              type="number" 
              placeholder="MAX INR" 
              value={maxPrice} 
              onChange={e => { setPage(1); setMaxPrice(e.target.value); }}
              className="w-24 sm:w-28 bg-black/50 border border-zinc-800 focus:border-cyber-gold text-xs font-mono rounded-lg p-2 focus:outline-none text-white text-center"
            />
          </div>
          {(minPrice || maxPrice) && (
            <button 
              onClick={() => { setMinPrice(''); setMaxPrice(''); setPage(1); }}
              className="text-[9px] font-display tracking-widest text-red-400 hover:text-red-300 underline"
            >
              [RESET PRICE]
            </button>
          )}
        </div>
      </div>

      {/* Grid Console */}
      {loading ? (
        <div className="text-center py-20 font-display text-cyber-gold tracking-widest holo-flicker text-xs sm:text-sm">
          LOADING DIGITAL MATRICES...
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 font-display text-gray-500 tracking-wider text-xs sm:text-sm">
          NO MATCHING ARTIFACTS RETRIEVED
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
            {products.map((product) => {
              const productImages = product.imageUrl ? product.imageUrl.split(',').map(s => s.trim()).filter(Boolean) : [];
              const mainImg = productImages[0] || 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?q=80&w=400';
              
              return (
                <div 
                  key={product.id}
                  className="group overflow-hidden rounded-3xl bg-zinc-950/70 border border-zinc-900 hover:border-cyber-gold/40 transition-all duration-500 flex flex-col justify-between"
                >
                  {/* Product Image Window */}
                  <div className="relative h-56 sm:h-64 overflow-hidden bg-black">
                    <img 
                      src={mainImg} 
                      alt={product.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 filter sepia-[0.1] contrast-[1.05]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent"></div>
                    
                    {/* Category badge */}
                    <span className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-black/80 backdrop-blur-md border border-cyber-cyan text-cyber-cyan font-display text-[9px] tracking-widest rounded-lg px-2.5 py-1">
                      {product.category.toUpperCase()}
                    </span>

                    {/* Wishlist Heart */}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }}
                      className={`absolute top-3 right-3 sm:top-4 sm:right-4 w-9 h-9 rounded-xl bg-black/70 backdrop-blur border flex items-center justify-center text-sm transition-all duration-300 z-20 ${
                        wishlistIds.has(product.id) 
                          ? 'border-red-500 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)] scale-105' 
                          : 'border-zinc-750 text-gray-200 hover:text-red-550 hover:border-red-500 hover:scale-105'
                      }`}
                    >
                      {wishlistIds.has(product.id) ? '♥' : '♡'}
                    </button>

                    {product.stock === 0 && (
                      <span className="absolute inset-0 z-10 flex items-center justify-center bg-black/75 font-display text-red-500 tracking-widest text-sm uppercase">
                        Sold Out
                      </span>
                    )}
                  </div>

                  {/* Details Pane */}
                  <div className="p-5 sm:p-6 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <h3 className="text-base sm:text-lg font-display font-bold text-white tracking-wide group-hover:text-cyber-gold transition-colors">
                        {product.title}
                      </h3>
                      <p className="text-xs text-gray-400 font-sans line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                      {/* Rating */}
                      <StarRating rating={product.avgRating || 0} count={product.reviewCount || 0} />
                    </div>

                    <div className="space-y-3.5">
                      <div className="flex justify-between items-baseline">
                        <span className="text-[10px] text-gray-500 font-display">VALUATION:</span>
                        <span className="text-base sm:text-lg font-display font-extrabold text-cyber-gold">
                          ₹{parseFloat(product.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                        <button
                          onClick={() => { setSelectedProduct(product); setActiveImgIndex(0); }}
                          className="py-2 sm:py-2.5 px-1 rounded-xl border border-zinc-800 text-gray-400 hover:text-white hover:border-zinc-700 font-display text-[9px] sm:text-[10px] tracking-wider truncate transition-all"
                        >
                          INSPECT
                        </button>
                        <button
                          onClick={() => setReviewProduct(product)}
                          className="py-2 sm:py-2.5 px-1 rounded-xl border border-zinc-800 text-gray-400 hover:text-cyber-cyan hover:border-cyber-cyan/30 font-display text-[9px] sm:text-[10px] tracking-wider truncate transition-all"
                        >
                          REVIEWS
                        </button>
                        <button
                          onClick={() => handleAddToCart(product)}
                          disabled={product.stock === 0}
                          className="py-2 sm:py-2.5 px-1 rounded-xl bg-gradient-to-r from-cyber-gold to-yellow-600 hover:from-yellow-600 hover:to-cyber-gold text-black font-display font-bold text-[9px] sm:text-[10px] tracking-wider truncate transition-all transform active:scale-95 disabled:opacity-30 disabled:scale-100"
                        >
                          ACQUIRE
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex justify-center items-center gap-2 sm:gap-3 pt-6">
              <button 
                disabled={page <= 1} 
                onClick={() => setPage(p => p - 1)}
                className="px-3 sm:px-4 py-2 rounded-xl border border-zinc-800 text-gray-400 hover:text-white font-display text-[9px] sm:text-[10px] tracking-widest disabled:opacity-30 transition-all"
              >
                ← PREV
              </button>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button 
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg font-display text-xs transition-all ${
                        page === pageNum
                          ? 'bg-cyber-gold text-black font-bold'
                          : 'border border-zinc-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button 
                disabled={page >= (pagination?.pages || 1)} 
                onClick={() => setPage(p => p + 1)}
                className="px-3 sm:px-4 py-2 rounded-xl border border-zinc-800 text-gray-400 hover:text-white font-display text-[9px] sm:text-[10px] tracking-widest disabled:opacity-30 transition-all"
              >
                NEXT →
              </button>
            </div>
          )}
        </>
      )}

      {/* Inspect Product Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-panel-neon-gold rounded-3xl pulse-gold-glow grid grid-cols-1 md:grid-cols-2">
            
            {/* Modal Image & Switcher */}
            <div className="h-[350px] md:h-full bg-black relative flex flex-col justify-between">
              <div className="flex-1 w-full relative overflow-hidden bg-black/25">
                {/* Wishlist Heart on modal image */}
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleWishlist(selectedProduct.id); }}
                  className={`absolute top-4 left-4 z-10 w-9 h-9 flex items-center justify-center rounded-xl bg-black/70 backdrop-blur border transition-all duration-300 ${
                    wishlistIds.has(selectedProduct.id)
                      ? 'border-red-500 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)] scale-105'
                      : 'border-zinc-750 text-gray-200 hover:text-red-550 hover:border-red-500 hover:scale-105'
                  }`}
                  title={wishlistIds.has(selectedProduct.id) ? "Remove from Wishlist" : "Add to Wishlist"}
                >
                  <span className="text-base leading-none">
                    {wishlistIds.has(selectedProduct.id) ? '♥' : '♡'}
                  </span>
                </button>
                <img 
                  src={modalImages[activeImgIndex] || 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?q=80&w=400'} 
                  alt={selectedProduct.title}
                  className="w-full h-full object-cover filter contrast-[1.05]"
                />
                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black via-black/10 to-transparent"></div>
              </div>

              {/* Thumbnails Swapping Row */}
              {modalImages.length > 1 && (
                <div className="p-3 bg-black/90 flex gap-2 overflow-x-auto border-t border-zinc-900/60 justify-center">
                  {modalImages.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImgIndex(idx)}
                      className={`w-12 h-12 rounded-lg border overflow-hidden shrink-0 transition-all ${
                        idx === activeImgIndex ? 'border-cyber-gold shadow-gold-glow scale-105' : 'border-zinc-850 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={imgUrl} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Content */}
            <div className="p-6 md:p-8 space-y-6 flex flex-col justify-between">
              <div>
                <button 
                  onClick={() => setSelectedProduct(null)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-cyber-gold font-display text-lg"
                >
                  [X]
                </button>

                <span className="text-[10px] font-display text-cyber-cyan border border-cyber-cyan/30 rounded px-2 py-0.5 tracking-widest">
                  {selectedProduct.category.toUpperCase()}
                </span>
                
                <h2 className="text-xl md:text-2xl font-display font-extrabold text-white tracking-wide mt-4">
                  {selectedProduct.title}
                </h2>

                {/* Rating */}
                <div className="mt-3">
                  <StarRating rating={selectedProduct.avgRating || 0} count={selectedProduct.reviewCount || 0} />
                </div>
                
                <p className="text-xs md:text-sm text-gray-400 font-sans leading-relaxed mt-4">
                  {selectedProduct.description}
                </p>

                {/* Specs */}
                <div className="mt-6 pt-4 border-t border-zinc-900 space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-gray-500">SERIAL ID:</span>
                    <span className="text-cyber-cyan">#NX_{selectedProduct.id}084</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">SELLER LINK:</span>
                    <span className="text-gray-300">{selectedProduct.seller?.name || 'Vanguard'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">AVAILABLE METRIC:</span>
                    <span className={`${selectedProduct.stock > 0 ? 'text-green-400' : 'text-red-500'}`}>
                      {selectedProduct.stock > 0 ? `${selectedProduct.stock} UNITS` : 'SOLD OUT'}
                    </span>
                  </div>
                </div>

                {/* Custom Category Specs */}
                {(() => {
                  try {
                    if (selectedProduct.specifications) {
                      const parsed = JSON.parse(selectedProduct.specifications);
                      if (parsed.spec1 || parsed.spec2) {
                        return (
                          <div className="mt-4 p-3 rounded-xl bg-black/40 border border-zinc-900/60 text-xs font-mono space-y-1.5">
                            <span className="text-[8px] font-display text-cyber-cyan tracking-widest block mb-1">REGISTRY PROPERTIES:</span>
                            {parsed.spec1 && (
                              <div className="flex justify-between gap-4">
                                <span className="text-zinc-500 uppercase shrink-0">
                                  {selectedProduct.category === 'Jewelry' ? 'Material/Metal' :
                                   selectedProduct.category === 'Watches' ? 'Caliber/Movement' :
                                   selectedProduct.category === 'Antiques' ? 'Historical Era' :
                                   selectedProduct.category === 'Coins' ? 'Grade/Certification' : 'Property A'}
                                </span>
                                <span className="text-gray-350 text-right truncate">{parsed.spec1}</span>
                              </div>
                            )}
                            {parsed.spec2 && (
                              <div className="flex justify-between gap-4">
                                <span className="text-zinc-500 uppercase shrink-0">
                                  {selectedProduct.category === 'Jewelry' ? 'Primary Gemstone' :
                                   selectedProduct.category === 'Watches' ? 'Manufacture Year' :
                                   selectedProduct.category === 'Antiques' ? 'Source/Origin' :
                                   selectedProduct.category === 'Coins' ? 'Composition' : 'Property B'}
                                </span>
                                <span className="text-gray-355 text-right truncate">{parsed.spec2}</span>
                              </div>
                            )}
                          </div>
                        );
                      }
                    }
                  } catch (e) {
                    console.error('Spec parse error:', e);
                  }
                  return null;
                })()}

                {/* Place a Bid / Bid Console */}
                {(selectedProduct.category === 'Antiques' || selectedProduct.stock === 1) && (
                  <div className="mt-4 p-3.5 rounded-2xl bg-cyber-gold/5 border border-cyber-gold/20 text-xs font-mono space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-[8px] font-display text-cyber-gold tracking-widest block uppercase font-bold">
                        ✦ VIRTUAL AUCTION & BID CONSOLE ✦
                      </span>
                      <span className="text-[8px] border border-cyber-gold/45 text-cyber-gold px-1 rounded animate-pulse">LIVE AUCTION</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-zinc-400">
                      <span>EST. RESERVE: ₹{parseFloat(selectedProduct.price).toLocaleString()}</span>
                      {auctionTimeLeft && (
                        <span className="text-red-400 font-bold border border-red-500/25 px-1.5 py-0.5 rounded animate-pulse text-[8px] tracking-wider">
                          ENDS IN: {auctionTimeLeft}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between text-[10px] text-zinc-400">
                      <span>CURRENT HIGH: <span className="text-white font-bold">₹{Math.round(parseFloat(selectedProduct.price) * 1.08).toLocaleString()}</span></span>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <input 
                        type="number"
                        id="bid-amount-input"
                        placeholder="Offer Valuation (INR)..."
                        className="flex-1 bg-black border border-zinc-800 text-[10px] font-mono rounded p-2 focus:outline-none focus:border-cyber-gold text-white placeholder-zinc-800"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = parseFloat(document.getElementById('bid-amount-input')?.value || '0');
                          const reserve = parseFloat(selectedProduct.price);
                          if (isNaN(val) || val <= reserve * 1.08) {
                            toast.warning(`Bid must exceed current high offer: ₹${Math.round(reserve * 1.08).toLocaleString()}`);
                          } else {
                            toast.success(`✦ OFFER OF ₹${val.toLocaleString()} BROADCASTED TO RELIC LEDGER.`);
                            document.getElementById('bid-amount-input').value = '';
                          }
                        }}
                        className="px-3.5 py-2 bg-gradient-to-r from-cyber-gold to-yellow-600 hover:from-yellow-600 hover:to-cyber-gold text-black font-display font-extrabold text-[9px] tracking-wider rounded"
                      >
                        SUBMIT BID
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-baseline pt-4 border-t border-zinc-900">
                  <span className="text-xs text-gray-500 font-display">VALUATION:</span>
                  <span className="text-xl font-display font-extrabold text-cyber-gold">
                    ₹{parseFloat(selectedProduct.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => { setReviewProduct(selectedProduct); setSelectedProduct(null); }}
                    className="py-3 rounded-xl border border-cyber-cyan/30 text-cyber-cyan font-display text-[10px] tracking-widest hover:bg-cyber-cyan/10 transition-all"
                  >
                    VIEW REVIEWS
                  </button>
                  <button
                    onClick={() => { handleAddToCart(selectedProduct); setSelectedProduct(null); }}
                    disabled={selectedProduct.stock === 0}
                    className="py-3 rounded-xl bg-gradient-to-r from-cyber-gold to-yellow-600 hover:from-yellow-600 hover:to-cyber-gold text-black font-display font-bold tracking-widest text-xs transition-all active:scale-95 disabled:opacity-30 disabled:scale-100 shadow-gold-glow"
                  >
                    ADD TO CART
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewProduct && (
        <ReviewModal 
          product={reviewProduct} 
          user={user} 
          onClose={() => setReviewProduct(null)} 
        />
      )}
    </section>
  );
}
