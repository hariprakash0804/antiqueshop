import React, { useState } from 'react';
import { useToast } from './Toast';
import { API_BASE } from '../config';

export function Checkout({ user, cartItems, onPaymentSuccess, setView, onUpdateQuantity, onRemoveItem, taxRate = 18 }) {
  const toast = useToast();
  const [address, setAddress] = useState(user?.address || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [simulationStatus, setSimulationStatus] = useState(''); // Mock payment visual feedback
  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [shippingMethod, setShippingMethod] = useState('drone'); // drone | orbital | escort

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = (subtotal * discountPercent) / 100;

  const getShippingFee = () => {
    if (shippingMethod === 'orbital') return 2500;
    if (shippingMethod === 'escort') return 9500;
    return 0;
  };

  const taxableAmount = Math.max(subtotal - discountAmount + getShippingFee(), 0);
  const taxAmount = (taxableAmount * taxRate) / 100;
  const finalTotal = taxableAmount + taxAmount;

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    try {
      const res = await fetch(`${API_BASE}/api/coupons/validate/${code}`);
      const data = await res.json();
      if (res.ok) {
        setDiscountPercent(data.discount);
        toast.success(`PROMO GRANTED: ${data.discount}% VALUATION REBATE LOADED`);
      } else {
        toast.error(data.message || 'COUPON KEY INVALID OR DECRYPT ERROR');
      }
    } catch(err) {
      toast.error('Failed to validate promo code signature.');
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!address.trim()) {
      setError('Please input a valid shipment destination address.');
      return;
    }
    if (cartItems.length === 0) {
      setError('No items in the acquisition queue.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // 1. Create order in Database
      const orderRes = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          items: cartItems.map(item => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.price
          })),
          subtotalAmount: subtotal,
          taxAmount: taxAmount,
          discountAmount: discountAmount,
          totalAmount: finalTotal,
          shippingAddress: `[TRANSIT: ${shippingMethod.toUpperCase()}] ${address}`
        })
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.message || 'Order initialization failed.');

      const orderId = orderData.id;

      // 2. Initiate Razorpay Order from API
      const rzpRes = await fetch(`${API_BASE}/api/payments/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          amount: finalTotal,
          orderId: orderId
        })
      });

      const rzpData = await rzpRes.json();
      if (!rzpRes.ok) throw new Error(rzpData.message || 'Payment gateway initiation failed.');

      // 3. Trigger Razorpay Modal (or simulation)
      if (rzpData.isMock) {
        // Simulation Payment Flow
        setSimulationStatus('LAUNCHING SECURE TRANSACTION CORE...');
        setTimeout(() => {
          setSimulationStatus('SIMULATING CARD VERIFICATION...');
        }, 1200);
        setTimeout(() => {
          setSimulationStatus('AUTHORIZING DIGITAL LEDGER TRANSFER...');
        }, 2400);
        setTimeout(async () => {
          try {
            const verifyRes = await fetch(`${API_BASE}/api/payments/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
              },
              body: JSON.stringify({
                orderId: orderId,
                isMock: true,
                razorpay_order_id: rzpData.id,
                razorpay_payment_id: `mock_pay_${Math.random().toString(36).substring(7)}`,
                razorpay_signature: 'mock_signature'
              })
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.message || 'Verification failed');

            setSimulationStatus('');
            onPaymentSuccess();
          } catch (err) {
            setError(err.message);
            setSimulationStatus('');
          }
        }, 3600);

      } else {
        // Real Razorpay modal execution
        const options = {
          key: rzpData.key,
          amount: rzpData.amount,
          currency: rzpData.currency,
          name: 'NEXUS CO.',
          description: 'Holographic Antique Acquisition',
          order_id: rzpData.id,
          handler: async function (response) {
            setLoading(true);
            try {
              const verifyRes = await fetch(`${API_BASE}/api/payments/verify`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({
                  orderId: orderId,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  isMock: false
                })
              });

              const verifyData = await verifyRes.json();
              if (!verifyRes.ok) throw new Error(verifyData.message || 'Verification failed.');

              onPaymentSuccess();
            } catch (err) {
              setError(err.message);
            } finally {
              setLoading(false);
            }
          },
          prefill: {
            name: user.name,
            email: user.email
          },
          theme: {
            color: '#d4af37'
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
        setLoading(false);
      }

    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-6 lg:px-12 grid grid-cols-1 md:grid-cols-2 gap-10">
      
      {/* Checkout Console */}
      <div className="glass-panel-neon-gold p-8 rounded-3xl space-y-6 pulse-gold-glow relative">
        <div className="scanline"></div>
        <h2 className="text-xl font-display font-extrabold text-cyber-gold tracking-widest">
          GATEWAY SECURE CHECKOUT
        </h2>

        {error && (
          <div className="p-3 bg-red-950/40 border border-red-500/50 text-red-400 text-xs rounded-xl font-mono text-center">
            ERROR: {error.toUpperCase()}
          </div>
        )}

        {simulationStatus ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-4">
            <span className="h-8 w-8 rounded-full border-2 border-cyber-cyan border-t-transparent animate-spin"></span>
            <p className="text-xs font-display tracking-widest text-cyber-cyan animate-pulse">
              {simulationStatus}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <form onSubmit={handleCheckout} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-display tracking-widest text-gray-400">
                  SHIPMENT TARGET DESTINATION
                </label>
                <textarea 
                  required
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter complete delivery coordinates (Full Address, City, Country, ZIP)"
                  className="w-full bg-black/60 border border-zinc-800 focus:border-cyber-gold focus:outline-none rounded-2xl p-4 text-sm font-mono placeholder-zinc-700 transition-all text-white animate-fade-in"
                />
              </div>

              {/* Shipping Method Protocol Selector */}
              <div className="space-y-3">
                <label className="block text-[10px] font-display tracking-widest text-gray-400">
                  TRANSIT METHOD PROTOCOL
                </label>
                <div className="space-y-2">
                  <label className={`flex justify-between items-center p-3 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
                    shippingMethod === 'drone' ? 'border-cyber-cyan bg-cyan-950/15' : 'border-zinc-850 bg-black/40 hover:border-zinc-800'
                  }`}>
                    <div className="flex items-center gap-3">
                      <input 
                        type="radio" name="shipping-method" value="drone"
                        checked={shippingMethod === 'drone'}
                        onChange={() => setShippingMethod('drone')}
                        className="accent-cyber-cyan"
                      />
                      <div>
                        <div className="text-white font-sans text-xs">STANDARD DRONE DROP</div>
                        <div className="text-[9px] text-zinc-500 font-sans mt-0.5">Unencrypted flight. Time: 3-5 Earth cycles.</div>
                      </div>
                    </div>
                    <span className="text-cyber-cyan font-bold text-[10px]">FREE</span>
                  </label>

                  <label className={`flex justify-between items-center p-3 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
                    shippingMethod === 'orbital' ? 'border-cyber-gold bg-cyber-gold/5' : 'border-zinc-850 bg-black/40 hover:border-zinc-800'
                  }`}>
                    <div className="flex items-center gap-3">
                      <input 
                        type="radio" name="shipping-method" value="orbital"
                        checked={shippingMethod === 'orbital'}
                        onChange={() => setShippingMethod('orbital')}
                        className="accent-cyber-gold"
                      />
                      <div>
                        <div className="text-white font-sans text-xs">PRIORITY ORBITAL DROP</div>
                        <div className="text-[9px] text-zinc-500 font-sans mt-0.5">Pressurized reentry pod. Time: 24 Earth hours.</div>
                      </div>
                    </div>
                    <span className="text-cyber-gold font-bold text-[10px]">+₹2,500</span>
                  </label>

                  <label className={`flex justify-between items-center p-3 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
                    shippingMethod === 'escort' ? 'border-red-500 bg-red-950/10' : 'border-zinc-850 bg-black/40 hover:border-zinc-800'
                  }`}>
                    <div className="flex items-center gap-3">
                      <input 
                        type="radio" name="shipping-method" value="escort"
                        checked={shippingMethod === 'escort'}
                        onChange={() => setShippingMethod('escort')}
                        className="accent-red-500"
                      />
                      <div>
                        <div className="text-white font-sans text-xs">SECURED CONVOY ESCORT</div>
                        <div className="text-[9px] text-zinc-500 font-sans mt-0.5">Armed tactical hovercraft. Recommended for high-tier relics.</div>
                      </div>
                    </div>
                    <span className="text-red-400 font-bold text-[10px]">+₹9,500</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setView('catalog')}
                  className="w-1/2 py-4 rounded-xl border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-950/50 text-gray-400 hover:text-white font-display text-xs tracking-widest transition-all"
                >
                  [BACK]
                </button>
                <button 
                  type="submit"
                  disabled={loading || cartItems.length === 0}
                  className="w-1/2 py-4 rounded-xl bg-gradient-to-r from-cyber-cyan to-blue-600 hover:from-blue-600 hover:to-cyber-cyan text-black font-display font-black tracking-widest text-xs transition-all transform active:scale-95 shadow-cyan-glow disabled:opacity-30 disabled:scale-100"
                >
                  {loading ? 'PROCESSING...' : 'INITIATE TRANSIT'}
                </button>
              </div>
            </form>

            {/* Promo Code section */}
            <form onSubmit={handleApplyCoupon} className="pt-6 border-t border-zinc-900 flex gap-2">
              <input 
                type="text" 
                value={couponCode} 
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="PROMO CODE (e.g. NEXUS20)" 
                className="flex-1 bg-black/40 border border-zinc-800 focus:border-cyber-cyan focus:outline-none rounded-xl px-3 py-2 text-xs font-mono placeholder-zinc-800 text-white"
              />
              <button 
                type="submit"
                className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-cyber-cyan text-cyber-cyan hover:text-white text-xs font-display rounded-xl tracking-wider transition-all"
              >
                APPLY
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Cart Summary Panel with editing capabilities */}
      <div className="bg-zinc-950/80 border border-zinc-900 rounded-3xl p-8 space-y-6 glass-panel">
        <h3 className="text-sm font-display font-bold text-white tracking-widest border-b border-zinc-900 pb-4">
          INVOICE BREAKDOWN
        </h3>

        {cartItems.length === 0 ? (
          <div className="py-10 text-center font-display text-xs text-zinc-600 tracking-wider">
            NO ASSETS ENQUEUED
          </div>
        ) : (
          <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
            {cartItems.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-xs p-3 bg-black/40 border border-zinc-900/60 rounded-xl">
                <div>
                  <div className="font-sans text-gray-200 font-medium truncate max-w-[150px] md:max-w-[200px]">{item.title}</div>
                  <div className="text-[10px] text-cyber-gold font-mono mt-1">₹{parseFloat(item.price).toLocaleString()}</div>
                </div>
                
                {/* Cart Modifier controls */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 border border-zinc-850 bg-black/50 rounded-lg p-0.5 scale-90">
                    <button
                      onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      className="h-5 w-5 text-xs text-gray-500 hover:text-white"
                    >
                      -
                    </button>
                    <span className="text-[10px] font-mono px-1 text-white">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      className="h-5 w-5 text-xs text-gray-500 hover:text-white"
                    >
                      +
                    </button>
                  </div>
                  <button 
                    onClick={() => onRemoveItem(item.id)}
                    className="text-[9px] font-display text-red-500 hover:text-red-400"
                  >
                    [X]
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-6 border-t border-zinc-900 space-y-3 font-mono text-xs">
          <div className="flex justify-between">
            <span className="text-zinc-550 uppercase">SUBTOTAL:</span>
            <span className="text-white">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          {discountPercent > 0 && (
            <div className="flex justify-between text-cyber-cyan">
              <span>SYSTEM REBATE ({discountPercent}%):</span>
              <span>-₹{discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-zinc-550 uppercase">TRANSIT PROTOCOL ({shippingMethod.toUpperCase()}):</span>
            <span className="text-cyber-cyan">+₹{getShippingFee().toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-555 uppercase">CRYPTO EXCISE TAX ({taxRate}%):</span>
            <span className="text-white">₹{taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-sm font-display font-bold text-cyber-gold pt-3 border-t border-zinc-900">
            <span>TOTAL VALUE TRANSFERRED:</span>
            <span>₹{finalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

    </div>
  );
}
