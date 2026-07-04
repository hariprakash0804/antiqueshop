import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { API_BASE } from './config';
import { Hero } from './components/Hero';
import { Catalog } from './components/Catalog';
import { Cart } from './components/Cart';
import { Auth } from './components/Auth';
import { Checkout } from './components/Checkout';
import { ProfileSettings } from './components/ProfileSettings';
import { WishlistView } from './components/WishlistView';
import { useToast } from './components/Toast';
import {
  CustomerDashboard,
  SellerDashboard,
  OrderManagerDashboard,
  AdminDashboard
} from './components/Dashboards';
import { Footer } from './components/Footer';
import { CommsTerminal } from './components/CommsTerminal';

function App() {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [view, setView] = useState('catalog'); // 'catalog' | 'checkout' | 'dashboard' | 'profile' | 'wishlist'
  const [cartOpen, setCartOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [commsOpen, setCommsOpen] = useState(false);
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const toast = useToast();



  const fetchWishlistIds = async (token) => {
    try {
      const res = await fetch(`${API_BASE}/api/wishlist`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setWishlistIds(new Set(data.map(item => item.productId)));
    } catch (err) {
      console.error(err);
    }
  };

  // Load User & Cart on Init
  useEffect(() => {
    const savedUser = localStorage.getItem('nexus_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      fetchWishlistIds(parsedUser.token);
    }
    const savedCart = localStorage.getItem('nexus_cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  // Sync Cart to localStorage
  const saveCart = (newCart) => {
    setCart(newCart);
    localStorage.setItem('nexus_cart', JSON.stringify(newCart));
  };

  const handleAddToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) {
        toast.warning('Quantity limit reached. No additional stock metrics available.');
        return;
      }
      const updated = cart.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      );
      saveCart(updated);
    } else {
      saveCart([...cart, { ...product, quantity: 1 }]);
    }
    setCartOpen(true); // Open cart immediately
  };

  const handleUpdateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }
    // Check stock bounds
    const item = cart.find(i => i.id === itemId);
    if (item && newQuantity > item.stock) {
      toast.warning('Exceeds available storage metrics.');
      return;
    }
    const updated = cart.map(i => i.id === itemId ? { ...i, quantity: newQuantity } : i);
    saveCart(updated);
  };

  const handleRemoveItem = (itemId) => {
    const updated = cart.filter(i => i.id !== itemId);
    saveCart(updated);
  };

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('nexus_user', JSON.stringify(userData));
    setAuthOpen(false);
    fetchWishlistIds(userData.token);
    toast.success(`Connected successfully as ${userData.name}`);
  };

  const handleProfileUpdate = (userData) => {
    setUser(userData);
    localStorage.setItem('nexus_user', JSON.stringify(userData));
  };

  const handleLogout = async () => {
    try {
      if (user && user.token) {
        await fetch(`${API_BASE}/api/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
      }
    } catch (e) {
      console.warn("Failed to notify auth server of disconnect signature.");
    }
    setUser(null);
    setWishlistIds(new Set());
    localStorage.removeItem('nexus_user');
    setView('catalog');
    toast.info('Disconnected from core link.');
  };

  const handleCheckoutInitiation = () => {
    if (!user) {
      setCartOpen(false);
      setAuthOpen(true);
      return;
    }
    setCartOpen(false);
    setView('checkout');
  };

  const handlePaymentSuccess = () => {
    toast.success('TRANSACTION VERIFIED BY BLOCKCHAIN LEDGER. TRANSACTION COMPLETED.');
    saveCart([]); // clear cart
    setView('dashboard'); // take to customer order panel
  };

  return (
    <div className="min-h-screen bg-cyber-dark text-white font-sans overflow-x-hidden relative flex flex-col justify-between">
      
      {/* Upper Navigation Bar */}
      <Navbar 
        user={user}
        cartCount={cart.reduce((sum, i) => sum + i.quantity, 0)}
        wishlistCount={wishlistIds.size}
        onOpenCart={() => setCartOpen(true)}
        onOpenComms={() => setCommsOpen(true)}
        onOpenAuth={() => setAuthOpen(true)}
        onLogout={handleLogout}
        setView={setView}
        activeView={view}
      />

      {/* Main Core Router View */}
      <main className="flex-1 w-full relative">
        {view === 'catalog' && (
          <div className="space-y-4">
            <Hero onExploreClick={() => {
              const el = document.getElementById('catalog-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }} />
            <Catalog onAddToCart={handleAddToCart} user={user} />
          </div>
        )}

        {view === 'checkout' && (
          <Checkout 
            user={user}
            cartItems={cart}
            onPaymentSuccess={handlePaymentSuccess}
            setView={setView}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
          />
        )}

        {view === 'profile' && user && (
          <ProfileSettings 
            user={user}
            onProfileUpdate={handleProfileUpdate}
            setView={setView}
          />
        )}

        {view === 'wishlist' && user && (
          <WishlistView 
            user={user}
            onAddToCart={handleAddToCart}
            setView={setView}
          />
        )}

        {view === 'dashboard' && user && (
          <div className="max-w-7xl mx-auto py-12 px-6 lg:px-12 bg-zinc-950/20 rounded-3xl border border-zinc-900/60 my-6">
            {user.role === 'customer' && <CustomerDashboard user={user} />}
            {user.role === 'seller' && <SellerDashboard user={user} />}
            {user.role === 'order_manager' && <OrderManagerDashboard user={user} />}
            {user.role === 'admin' && (
              <AdminDashboard 
                user={user} 
              />
            )}
          </div>
        )}
      </main>

      {/* Futuristic footer display */}
      <Footer setView={setView} activeView={view} />

      {/* Side Cart terminal */}
      <Cart 
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cartItems={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleCheckoutInitiation}
      />

      {/* Neural Comms Terminal slide-over */}
      <CommsTerminal 
        isOpen={commsOpen}
        onClose={() => setCommsOpen(false)}
        user={user}
      />

      {/* Sliding Connect interface modal */}
      {authOpen && (
        <Auth 
          onAuthSuccess={handleAuthSuccess}
          onClose={() => setAuthOpen(false)}
        />
      )}

    </div>
  );
}

export default App;
