import React, { useState, useEffect } from 'react';
import { useToast } from './Toast';
import { API_BASE } from '../config';

// Status Badge formatter helper
function StatusBadge({ status }) {
  const styles = {
    Pending: 'border-yellow-500/30 text-yellow-500 bg-yellow-500/10',
    Paid: 'border-cyber-cyan/30 text-cyber-cyan bg-cyber-cyan/10',
    Shipped: 'border-blue-500/30 text-blue-500 bg-blue-500/10',
    Delivered: 'border-green-500/30 text-green-500 bg-green-500/10',
    Cancelled: 'border-red-500/30 text-red-500 bg-red-500/10',
    Refunded: 'border-purple-500/30 text-purple-500 bg-purple-500/10'
  };

  return (
    <span className={`px-2.5 py-1 text-[9px] font-display tracking-widest border rounded-md uppercase ${styles[status] || 'border-zinc-800 text-gray-400'}`}>
      {status}
    </span>
  );
}

// -------------------------------------------------------------
// INVOICE PRINT MODAL (Cyberpunk Dot-Matrix Style Receipt)
// -------------------------------------------------------------
function InvoiceModal({ order, onClose }) {
  const handlePrint = () => {
    window.print();
  };

  const invoiceSubtotal = order.items.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
  const discount = Math.max(invoiceSubtotal - parseFloat(order.totalAmount), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in print:bg-white print:p-0">
      <div className="relative w-full max-w-xl glass-panel border border-cyber-gold/45 rounded-3xl p-8 space-y-6 pulse-gold-glow print:border-0 print:shadow-none print:w-full print:max-w-none print:h-full print:bg-white print:text-black">
        {/* Printable Section wrapper */}
        <div id="print-area" className="space-y-6 print:text-black font-mono">
          {/* Header */}
          <div className="text-center border-b border-dashed border-zinc-800 pb-4 print:border-black">
            <h2 className="text-xl font-display font-extrabold text-cyber-gold tracking-widest print:text-black">
              NEXUS SECURE INVOICE
            </h2>
            <p className="text-[10px] text-zinc-500 mt-1 print:text-zinc-700">VALUATION RECEIPT // BLOCKCHAIN VERIFICATION LOG</p>
            <div className="text-[9px] text-zinc-600 mt-1 flex justify-between px-4">
              <span>DATE: {new Date(order.createdAt).toLocaleDateString()}</span>
              <span>INVOICE ID: #NX_{order.id}084</span>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-500">TRANSACTION ACCOUNT:</span>
              <span className="text-white print:text-black">{order.customer?.name || 'Nexus Customer'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">EMAIL REGISTRY:</span>
              <span className="text-gray-300 print:text-black">{order.customer?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">SECURITY STATUS:</span>
              <span className="font-bold uppercase text-cyber-cyan print:text-black">{order.status}</span>
            </div>
          </div>

          {/* Items Table */}
          <div className="border-t border-b border-dashed border-zinc-800 py-3 space-y-2 print:border-black">
            <div className="grid grid-cols-4 text-[10px] text-zinc-500 font-bold uppercase pb-1 border-b border-zinc-900/60 print:border-black print:text-zinc-700">
              <span className="col-span-2">ARTIFACT SPEC</span>
              <span className="text-center">QTY</span>
              <span className="text-right">VALUATION</span>
            </div>
            {order.items.map(item => (
              <div key={item.id} className="grid grid-cols-4 text-xs text-gray-300 print:text-black">
                <span className="col-span-2 truncate">{item.product?.title || 'Unknown Artifact'}</span>
                <span className="text-center font-mono">x{item.quantity}</span>
                <span className="text-right font-mono">₹{(parseFloat(item.price) * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-1.5 text-xs text-right font-mono">
            <div className="flex justify-between">
              <span className="text-zinc-500">SUBTOTAL VALUATION:</span>
              <span className="text-white print:text-black">₹{invoiceSubtotal.toLocaleString()}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-cyber-cyan print:text-black">
                <span>SYSTEM PROMO REBATE:</span>
                <span>-₹{discount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-cyber-gold pt-2 border-t border-zinc-900/50 print:border-black print:text-black">
              <span>TOTAL VALUE TRANSFERRED:</span>
              <span>₹{parseFloat(order.totalAmount).toLocaleString()}</span>
            </div>
          </div>

          {/* Shipping coordinates */}
          <div className="pt-4 border-t border-dashed border-zinc-800 text-[10px] text-zinc-500 print:border-black print:text-zinc-700">
            <span className="block font-bold uppercase text-zinc-400 print:text-black mb-1">SHIPMENT DESTINATION COORDINATES:</span>
            <p className="font-sans leading-relaxed text-gray-300 print:text-black">{order.shippingAddress}</p>
          </div>

          {/* Digital Signature */}
          <div className="text-center pt-4 border-t border-dashed border-zinc-800 text-[9px] text-zinc-600 print:border-black">
            <span className="block font-mono">NEXUS INTEGRITY ENVELOPE SHA-256 HASH:</span>
            <span className="block font-mono text-zinc-400 select-all truncate">
              0x{Array.from({ length: 64 }, (_, i) => ((order.id + i) % 16).toString(16)).join('')}
            </span>
          </div>
        </div>

        {/* Action controls (Hidden in print) */}
        <div className="flex gap-4 pt-4 border-t border-zinc-900/60 print:hidden">
          <button
            onClick={onClose}
            className="w-1/2 py-3 rounded-xl border border-zinc-800 hover:border-zinc-700 text-gray-400 font-display text-xs"
          >
            [CLOSE LEDGER]
          </button>
          <button
            onClick={handlePrint}
            className="w-1/2 py-3 rounded-xl bg-gradient-to-r from-cyber-gold to-yellow-600 hover:from-yellow-600 hover:to-cyber-gold text-black font-display font-bold text-xs tracking-widest shadow-gold-glow"
          >
            [PRINT LEDGER]
          </button>
        </div>
      </div>
    </div>
  );
}

// Visual Step-by-Step Order Timeline
function OrderTimeline({ status, date }) {
  const steps = ['Pending', 'Paid', 'Shipped', 'Delivered'];
  const cancelledSteps = ['Pending', 'Paid', 'Cancelled', 'Refunded'];
  
  const isCancelledFlow = ['Cancelled', 'Refunded'].includes(status);
  const activeSteps = isCancelledFlow ? cancelledSteps : steps;
  const currentIndex = activeSteps.indexOf(status);

  return (
    <div className="py-6 px-4 bg-black/40 rounded-2xl border border-zinc-900/60 my-4">
      <div className="text-[10px] font-display tracking-widest text-zinc-500 mb-4 uppercase">
        TRANSMISSION TIMELINE
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative">
        {/* Connection Line */}
        <div className="hidden sm:block absolute left-4 right-4 top-[14px] h-[2px] bg-zinc-800 -z-10" />
        
        {activeSteps.map((step, idx) => {
          const isCompleted = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          
          let colorClass = 'border-zinc-800 text-zinc-500 bg-zinc-950';
          if (isCompleted) {
            if (step === 'Cancelled' || step === 'Refunded') {
              colorClass = 'border-red-500/50 text-red-400 bg-red-950/20';
            } else {
              colorClass = 'border-cyber-cyan/50 text-cyber-cyan bg-cyan-950/20';
            }
          }
          if (isCurrent) {
            if (step === 'Cancelled' || step === 'Refunded') {
              colorClass = 'border-red-500 text-white bg-red-600 animate-pulse';
            } else {
              colorClass = 'border-cyber-cyan text-white bg-cyber-cyan animate-pulse text-black';
            }
          }

          return (
            <div key={step} className="flex sm:flex-col items-center gap-3 sm:gap-2 flex-1 w-full">
              <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-display text-xs font-bold transition-all duration-300 ${colorClass}`}>
                {idx + 1}
              </div>
              <div className="text-left sm:text-center">
                <div className={`text-[10px] font-display tracking-wider uppercase font-bold ${isCompleted ? 'text-white' : 'text-zinc-600'}`}>
                  {step}
                </div>
                {isCurrent && (
                  <div className="text-[8px] font-mono text-zinc-500">
                    ACTIVE STATUS
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 1. CUSTOMER DASHBOARD
// -------------------------------------------------------------
export function CustomerDashboard({ user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);
  const toast = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/orders`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to retrieve order matrices.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order transaction?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        toast.success('Order successfully cancelled. Refund initiated.');
        fetchOrders();
      } else {
        const errorData = await res.json();
        toast.error(`Cancellation failed: ${errorData.message}`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error contacting authorization gateway.');
    }
  };

  // Fast test simulator for developers/users to transition orders
  const handleSimulateStatus = async (orderId, currentStatus) => {
    const transitions = {
      'Pending': 'Paid',
      'Paid': 'Shipped',
      'Shipped': 'Delivered',
      'Delivered': 'Pending',
      'Cancelled': 'Refunded',
      'Refunded': 'Pending'
    };
    const nextStatus = transitions[currentStatus] || 'Pending';
    try {
      const res = await fetch(`${API_BASE}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ status: nextStatus, notes: `Automated testing transit to ${nextStatus}` })
      });
      if (res.ok) {
        toast.info(`TEST SIMULATOR: Transiting status step to ${nextStatus}`);
        fetchOrders();
      }
    } catch (err) {
      console.error(err);
      toast.error('Simulating timeline update failed.');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-display font-extrabold text-cyber-gold tracking-widest">
          MY ACQUISITION CONSOLE
        </h2>
        <span className="text-[10px] font-mono text-zinc-500">USER ID: #NX_USER_{user.id}</span>
      </div>

      {loading ? (
        <div className="text-center text-cyber-gold font-display text-sm holo-flicker">POLLING BLOCKCHAIN LEDGER...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 text-gray-500 font-display text-xs border border-zinc-900 rounded-3xl">
          NO TRANSIT HISTORIES DECLARED
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => (
            <div key={order.id} className="p-6 rounded-3xl bg-zinc-950/70 border border-zinc-900 hover:border-zinc-800 transition-all space-y-4">
              <div className="flex flex-wrap justify-between items-center gap-4 border-b border-zinc-900 pb-4">
                <div className="space-y-1">
                  <div className="text-xs font-display text-white">ORDER ID: #NX_{order.id}084</div>
                  <div className="text-[10px] font-mono text-gray-500">PLACED AT: {new Date(order.createdAt).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={order.status} />
                  <span className="text-sm font-display font-extrabold text-cyber-gold">
                    ₹{parseFloat(order.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Order Tracking Timeline Visual */}
              <OrderTimeline status={order.status} date={order.updatedAt} />

              {/* Order logistics Notes section */}
              {order.notes && (
                <div className="p-3.5 rounded-2xl bg-zinc-900/30 border border-zinc-850 text-xs font-mono text-gray-400 space-y-1">
                  <span className="text-[9px] font-display text-cyber-cyan tracking-wider block">LOGISTICS OFFICER TRANSMISSION LOGS:</span>
                  <p className="leading-relaxed">"{order.notes}"</p>
                </div>
              )}

              {/* Items List */}
              <div className="space-y-3">
                {order.items.map(item => (
                  <div key={item.id} className="flex justify-between items-center text-xs">
                    <span className="text-gray-300 font-sans">
                      {item.product?.title || 'Unknown Item'} <span className="text-cyber-cyan font-mono">x{item.quantity}</span>
                    </span>
                    <span className="text-gray-500 font-mono">
                      ₹{parseFloat(item.price).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Shipping & Cancellation controls */}
              <div className="pt-4 border-t border-zinc-900 flex justify-between items-end gap-6 flex-wrap">
                <div className="text-[10px] font-mono text-gray-500 max-w-md">
                  <span className="block font-display text-[9px] tracking-wider text-gray-400">DELIVERY ADDRESS COORDINATES:</span>
                  {order.shippingAddress}
                </div>
                
                <div className="flex items-center gap-2">
                  {/* View Invoice button */}
                  {['Paid', 'Shipped', 'Delivered'].includes(order.status) && (
                    <button
                      onClick={() => setSelectedInvoiceOrder(order)}
                      className="px-2.5 py-1.5 border border-cyber-gold/30 text-cyber-gold hover:border-cyber-gold hover:bg-cyber-gold/10 text-[9px] font-display tracking-widest rounded-lg transition-all"
                    >
                      [VIEW INVOICE]
                    </button>
                  )}

                  {/* Simulate Status button for quick user testing */}
                  <button
                    onClick={() => handleSimulateStatus(order.id, order.status)}
                    className="px-2.5 py-1.5 border border-cyber-cyan/30 text-cyber-cyan hover:border-cyber-cyan hover:bg-cyber-cyan/10 text-[9px] font-display tracking-widest rounded-lg transition-all"
                    title="Dev Simulator for stepping order status"
                  >
                    [SIMULATE STEP]
                  </button>

                  {['Pending', 'Paid'].includes(order.status) && (
                    <button 
                      onClick={() => handleCancel(order.id)}
                      className="px-3 py-1.5 border border-red-500/30 hover:border-red-500 text-red-400 hover:bg-red-500/10 text-[9px] font-display tracking-widest rounded-lg transition-all"
                    >
                      REQUEST CANCEL
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invoice modal renderer */}
      {selectedInvoiceOrder && (
        <InvoiceModal
          order={selectedInvoiceOrder}
          onClose={() => setSelectedInvoiceOrder(null)}
        />
      )}
    </div>
  );
}

// -------------------------------------------------------------
// 2. SELLER DASHBOARD
// -------------------------------------------------------------
export function SellerDashboard({ user }) {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewTab, setViewTab] = useState('inventory'); // 'inventory' or 'sales' or 'add'
  const toast = useToast();
  
  // Form State for Adding/Editing Product
  const [editMode, setEditMode] = useState(false);
  const [productIdToEdit, setProductIdToEdit] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Jewelry');
  const [stock, setStock] = useState('1');
  const [imageUrl, setImageUrl] = useState('');
  const [spec1, setSpec1] = useState('');
  const [spec2, setSpec2] = useState('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all products
      const prodRes = await fetch(`${API_BASE}/api/products`);
      const prodData = await prodRes.json();
      // Filter products belonging to this seller
      const myProducts = (prodData.products || prodData).filter(p => p.sellerId === user.id);
      setProducts(myProducts);

      // Fetch seller specific orders
      const orderRes = await fetch(`${API_BASE}/api/orders`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const orderData = await orderRes.json();
      setOrders(orderData);
    } catch (err) {
      console.error(err);
      toast.error('Error connecting to digital inventory ledger.');
    } finally {
      setLoading(false);
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    const payload = {
      title,
      description,
      price: parseFloat(price),
      category,
      stock: parseInt(stock),
      imageUrl,
      specifications: JSON.stringify({ spec1, spec2 })
    };

    try {
      const endpoint = editMode 
        ? `${API_BASE}/api/products/${productIdToEdit}`
        : `${API_BASE}/api/products`;
      const method = editMode ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Product save failed.');
      }

      toast.success(editMode ? 'Listing updated successfully!' : 'New product listed successfully!');
      
      // Reset form
      resetForm();
      fetchData();
      setViewTab('inventory');
    } catch (err) {
      setFormError(err.message);
      toast.error(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // Direct Restocking Action in Seller view
  const handleQuickRestock = async (productId, currentStock) => {
    const inputEl = document.getElementById(`restock-qty-${productId}`);
    const addQty = parseInt(inputEl?.value || '0');
    if (isNaN(addQty) || addQty <= 0) {
      toast.warning('Please enter a valid positive quantity.');
      return;
    }
    const newStock = currentStock + addQty;
    try {
      const res = await fetch(`${API_BASE}/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ stock: newStock })
      });
      if (res.ok) {
        toast.success(`Inventory restocked to ${newStock} units.`);
        if (inputEl) inputEl.value = '';
        fetchData();
      } else {
        toast.error('Restocking process failed.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to connect to ledger.');
    }
  };

  const startEdit = (product) => {
    setEditMode(true);
    setProductIdToEdit(product.id);
    setTitle(product.title);
    setDescription(product.description);
    setPrice(product.price);
    setCategory(product.category);
    setStock(product.stock.toString());
    setImageUrl(product.imageUrl);

    // Parse specifications JSON
    try {
      if (product.specifications) {
        const parsed = JSON.parse(product.specifications);
        setSpec1(parsed.spec1 || '');
        setSpec2(parsed.spec2 || '');
      } else {
        setSpec1('');
        setSpec2('');
      }
    } catch (err) {
      setSpec1('');
      setSpec2('');
    }

    setViewTab('add');
  };

  const resetForm = () => {
    setEditMode(false);
    setProductIdToEdit(null);
    setTitle('');
    setDescription('');
    setPrice('');
    setCategory('Jewelry');
    setStock('1');
    setImageUrl('');
    setSpec1('');
    setSpec2('');
    setFormError('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this product?')) return;

    try {
      const res = await fetch(`${API_BASE}/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        toast.info('Product deleted.');
        fetchData();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to complete deletion process.');
    }
  };

  const handleMarkShipped = async (orderId) => {
    try {
      const res = await fetch(`${API_BASE}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ status: 'Shipped', notes: 'Merchant marked order cargo dispatched.' })
      });
      if (res.ok) {
        toast.success('Order status marked as Shipped.');
        fetchData();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update cargo status.');
    }
  };

  // Seller Telemetry calculations
  const totalStockValuation = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
  const outOfStockItems = products.filter(p => p.stock === 0).length;
  const criticalStockItems = products.filter(p => p.stock > 0 && p.stock <= 2).length;

  // Render spec labels based on selected category
  const getSpecLabels = () => {
    switch (category) {
      case 'Jewelry':
        return {
          label1: 'METAL KARAT / MATERIAL',
          placeholder1: 'e.g. 18k Yellow Gold',
          label2: 'PRIMARY GEMSTONE',
          placeholder2: 'e.g. Flawless Sapphire'
        };
      case 'Watches':
        return {
          label1: 'CALIBER / MOVEMENT TYPE',
          placeholder1: 'e.g. Mechanical Manual Wind',
          label2: 'MANUFACTURE YEAR',
          placeholder2: 'e.g. Circa 1890'
        };
      case 'Antiques':
        return {
          label1: 'HISTORICAL ERA',
          placeholder1: 'e.g. Roman Empire Period',
          label2: 'ORIGIN COUNTRY / SOURCE',
          placeholder2: 'e.g. Excavated in Pompeii'
        };
      case 'Coins':
        return {
          label1: 'GRADE / CERTIFICATION',
          placeholder1: 'e.g. NGC MS-65 graded',
          label2: 'METAL COMPOSITION',
          placeholder2: 'e.g. 90% Silver, 10% Copper'
        };
      default:
        return {
          label1: 'SPECIFICATION KEY A',
          placeholder1: 'e.g. Vintage details',
          label2: 'SPECIFICATION KEY B',
          placeholder2: 'e.g. Certified values'
        };
    }
  };

  const labels = getSpecLabels();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Navigation Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-zinc-900 pb-4">
        <div>
          <h2 className="text-xl font-display font-extrabold text-cyber-gold tracking-widest">
            MERCHANT TERMINAL
          </h2>
          <p className="text-[10px] font-mono text-zinc-500 mt-1">OPERATED BY: {user.name.toUpperCase()}</p>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => setViewTab('inventory')}
            className={`px-4 py-2 rounded-xl text-xs font-display tracking-wider transition-all ${
              viewTab === 'inventory' ? 'bg-cyber-gold text-black font-bold' : 'border border-zinc-950 text-gray-400 hover:text-white'
            }`}
          >
            INVENTORY MATRIX
          </button>
          <button 
            onClick={() => setViewTab('sales')}
            className={`px-4 py-2 rounded-xl text-xs font-display tracking-wider transition-all ${
              viewTab === 'sales' ? 'bg-cyber-gold text-black font-bold' : 'border border-zinc-950 text-gray-400 hover:text-white'
            }`}
          >
            SALES LOGS ({orders.length})
          </button>
          <button 
            onClick={() => { resetForm(); setViewTab('add'); }}
            className={`px-4 py-2 rounded-xl text-xs font-display tracking-wider transition-all ${
              viewTab === 'add' ? 'bg-cyber-cyan text-black font-bold shadow-cyan-glow' : 'border border-zinc-950 text-gray-400 hover:text-white'
            }`}
          >
            {editMode ? 'EDIT PRODUCT' : 'LIST PRODUCT'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-cyber-gold font-display text-sm holo-flicker">CONNECTING MERCHANT INTERFACE...</div>
      ) : (
        <>
          {/* Seller Analytics Summary Cards */}
          {viewTab === 'inventory' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-900">
                <div className="text-[9px] font-display text-zinc-500 tracking-wider">TOTAL LISTED</div>
                <div className="text-xl font-display font-bold text-white mt-1">{products.length} ITEMS</div>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-900">
                <div className="text-[9px] font-display text-zinc-500 tracking-wider">VAULT ASSET VALUE</div>
                <div className="text-xl font-display font-bold text-cyber-cyan mt-1">₹{totalStockValuation.toLocaleString()}</div>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-900">
                <div className="text-[9px] font-display text-zinc-500 tracking-wider">STOCK DEPLETED</div>
                <div className="text-xl font-display font-bold text-red-500 mt-1">{outOfStockItems} LISTINGS</div>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-900">
                <div className="text-[9px] font-display text-zinc-500 tracking-wider">CRITICAL ALERT STOCK</div>
                <div className={`text-xl font-display font-bold mt-1 ${criticalStockItems > 0 ? 'text-amber-500 animate-pulse' : 'text-zinc-500'}`}>
                  {criticalStockItems} LISTINGS
                </div>
              </div>
            </div>
          )}

          {/* Dynamic Relic Stock Telemetry Chart */}
          {viewTab === 'inventory' && products.length > 0 && (
            <div className="p-6 rounded-3xl bg-zinc-950/70 border border-zinc-900 space-y-4 animate-fade-in">
              <div className="text-xs font-display text-cyber-gold tracking-widest font-bold">
                RELIC VAULT STOCK TELEMETRY
              </div>
              <div className="h-40 flex items-end gap-4 pt-6 border-b border-zinc-900 pb-2 overflow-x-auto">
                {products.map((p) => {
                  const maxCap = 10;
                  const percent = Math.min((p.stock / maxCap) * 100, 100);
                  const isLow = p.stock <= 2;
                  const isDepleted = p.stock === 0;
                  
                  return (
                    <div key={p.id} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end min-w-[50px]">
                      <div className="relative w-full group flex justify-center items-end h-full">
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 bg-black border border-cyber-cyan text-[8px] font-mono text-cyber-cyan py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none mb-1 z-10 whitespace-nowrap">
                          {p.title}: {p.stock} units
                        </div>
                        <div 
                          style={{ height: `${Math.max(percent, 6)}%` }}
                          className={`w-4 rounded-t-sm transition-all duration-1000 ${
                            isDepleted ? 'bg-red-950 border border-red-550/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]' :
                            isLow ? 'bg-amber-500/80 border border-amber-400 animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.3)]' :
                            'bg-gradient-to-t from-cyber-cyan/30 to-cyber-cyan border border-cyber-cyan/50 hover:shadow-cyan-glow'
                          }`}
                        />
                      </div>
                      <div className="text-[8px] font-mono text-zinc-500 truncate max-w-[50px] uppercase">
                        {p.title}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Inventory Manager */}
          {viewTab === 'inventory' && (
            products.length === 0 ? (
              <div className="text-center py-20 text-gray-500 font-display text-xs border border-zinc-900 rounded-3xl">
                NO REGISTERED INVENTORY LISTINGS DETECTED
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {products.map(p => {
                  const productImages = p.imageUrl ? p.imageUrl.split(',').map(s => s.trim()).filter(Boolean) : [];
                  const mainImg = productImages[0] || 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?q=80&w=400';
                  
                  return (
                    <div key={p.id} className="p-5 rounded-2xl bg-zinc-950/60 border border-zinc-900 flex flex-col justify-between relative">
                      <div className="flex gap-4">
                        <img src={mainImg} alt={p.title} className="w-20 h-20 object-cover rounded-xl border border-zinc-800 shrink-0" />
                        
                        <div className="flex-1 flex flex-col justify-between min-w-0">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-sm font-display font-bold text-white tracking-wide truncate">{p.title}</h4>
                              {p.stock === 0 ? (
                                <span className="text-[8px] font-mono border border-red-500 text-red-500 px-1 py-0.5 rounded shrink-0">DEPLETED</span>
                              ) : p.stock <= 2 ? (
                                <span className="text-[8px] font-mono border border-amber-500 text-amber-500 px-1 py-0.5 rounded shrink-0 animate-pulse font-bold">LOW STOCK</span>
                              ) : null}
                            </div>
                            <div className="text-[10px] font-mono text-gray-500 mt-1 uppercase">CAT: {p.category} | STOCK: {p.stock} units</div>
                          </div>
                          <div className="flex justify-between items-center mt-3">
                            <span className="text-sm font-display font-bold text-cyber-gold">₹{parseFloat(p.price).toLocaleString()}</span>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => startEdit(p)}
                                className="px-2 py-1 text-[9px] font-display text-cyber-cyan border border-cyber-cyan/30 hover:border-cyber-cyan rounded"
                              >
                                EDIT
                              </button>
                              <button 
                                onClick={() => handleDelete(p.id)}
                                className="px-2 py-1 text-[9px] font-display text-red-500 border border-red-500/30 hover:border-red-500 rounded"
                              >
                                DELETE
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Quick Restocking widget */}
                      <div className="flex gap-2 items-center mt-4 pt-3 border-t border-zinc-900/60 justify-between">
                        <span className="text-[9px] font-display text-zinc-500 tracking-wider">RESTOCK WIDGET:</span>
                        <div className="flex gap-2 items-center">
                          <input 
                            type="number"
                            placeholder="+ Qty"
                            id={`restock-qty-${p.id}`}
                            className="w-14 bg-black border border-zinc-800 text-[10px] font-mono rounded p-1 text-center text-white focus:outline-none focus:border-cyber-cyan"
                          />
                          <button
                            onClick={() => handleQuickRestock(p.id, p.stock)}
                            className="px-2 py-1 bg-cyber-cyan hover:bg-cyan-400 text-black font-display font-extrabold text-[9px] tracking-wider rounded transition-colors"
                          >
                            RESTOCK
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* Sales Logs */}
          {viewTab === 'sales' && (
            orders.length === 0 ? (
              <div className="text-center py-20 text-gray-500 font-display text-xs border border-zinc-900 rounded-3xl">
                NO REVENUE OPERATIONS REPORTED
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map(order => (
                  <div key={order.id} className="p-5 rounded-2xl bg-zinc-950/40 border border-zinc-900 flex justify-between items-center flex-wrap gap-4 select-none">
                    <div>
                      <div className="text-xs font-display text-white font-bold">ORDER ID: #NX_{order.id}</div>
                      <div className="text-[10px] font-mono text-gray-500 mt-1">
                        CUSTOMER: {order.customer?.name} ({order.customer?.email})
                      </div>
                      <div className="text-[10px] font-mono text-gray-400 mt-2 space-y-1">
                        {order.items.map(item => (
                          <div key={item.id}>
                            • {item.product?.title} <span className="text-cyber-cyan font-bold">x{item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="text-right space-y-2">
                      <StatusBadge status={order.status} />
                      <div className="text-xs font-display font-bold text-cyber-gold pt-1">
                        ₹{parseFloat(order.totalAmount).toLocaleString()}
                      </div>
                      {order.status === 'Paid' && (
                        <button
                          onClick={() => handleMarkShipped(order.id)}
                          className="mt-2 block px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-black font-display font-extrabold text-[9px] tracking-widest text-center"
                        >
                          MARK SHIPPED
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* Add / Edit Form */}
          {viewTab === 'add' && (
            <form onSubmit={handleProductSubmit} className="max-w-xl mx-auto glass-panel p-8 rounded-3xl border border-zinc-900 space-y-5">
              <h3 className="text-sm font-display font-bold text-cyber-gold tracking-widest border-b border-zinc-900 pb-3">
                {editMode ? 'MODIFY ITEM VIRTUAL REGISTRY' : 'LIST NEW UNIQUE ITEM'}
              </h3>

              {formError && (
                <div className="p-3 bg-red-950/40 border border-red-500/50 text-red-400 text-xs rounded-xl font-mono text-center">
                  ERROR: {formError.toUpperCase()}
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[10px] font-display text-gray-400">PRODUCT TITLE</label>
                <input 
                  type="text" required
                  value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Victorian Sovereign Ring"
                  className="w-full bg-black/60 border border-zinc-800 focus:border-cyber-gold focus:outline-none rounded-xl p-3 text-sm font-mono placeholder-zinc-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-display text-gray-400">PRODUCT CATEGORY</label>
                  <select 
                    value={category} onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-black/60 border border-zinc-800 focus:border-cyber-gold focus:outline-none rounded-xl p-3 text-sm font-display text-cyber-gold"
                  >
                    <option value="Jewelry">JEWELRY</option>
                    <option value="Watches">WATCHES</option>
                    <option value="Antiques">ANTIQUES</option>
                    <option value="Coins">COINS</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-display text-gray-400">ESTIMATED VALUATION (INR)</label>
                  <input 
                    type="number" required step="0.01"
                    value={price} onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full bg-black/60 border border-zinc-800 focus:border-cyber-gold focus:outline-none rounded-xl p-3 text-sm font-mono placeholder-zinc-800 text-white"
                  />
                </div>
              </div>

              {/* Dynamic Specifications Row */}
              <div className="grid grid-cols-2 gap-4 p-4 border border-zinc-900 bg-black/30 rounded-2xl">
                <div className="space-y-1">
                  <label className="block text-[9px] font-display text-cyber-cyan tracking-wider">{labels.label1}</label>
                  <input 
                    type="text"
                    value={spec1} onChange={e => setSpec1(e.target.value)}
                    placeholder={labels.placeholder1}
                    className="w-full bg-black/60 border border-zinc-800 focus:border-cyber-gold focus:outline-none rounded-xl p-2.5 text-xs font-mono text-white placeholder-zinc-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[9px] font-display text-cyber-cyan tracking-wider">{labels.label2}</label>
                  <input 
                    type="text"
                    value={spec2} onChange={e => setSpec2(e.target.value)}
                    placeholder={labels.placeholder2}
                    className="w-full bg-black/60 border border-zinc-800 focus:border-cyber-gold focus:outline-none rounded-xl p-2.5 text-xs font-mono text-white placeholder-zinc-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-display text-gray-400">INITIAL AVAILABILITY STOCK</label>
                  <input 
                    type="number" required
                    value={stock} onChange={(e) => setStock(e.target.value)}
                    placeholder="1"
                    className="w-full bg-black/60 border border-zinc-800 focus:border-cyber-gold focus:outline-none rounded-xl p-3 text-sm font-mono placeholder-zinc-800 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] font-display text-gray-400">HOLOGRAPHIC IMAGE URL</label>
                    <button
                      type="button"
                      onClick={() => {
                        const prompt = window.prompt("ENTER MOLECULAR HOLOGRAM SYNTHESIZER PROMPT:\n(e.g., 'gold crown', 'silver coin', 'emerald ring', 'pocket watch')");
                        if (!prompt) return;
                        toast.info("✦ INITIALIZING MOLECULAR HOLOGRAM SYNTHESIS...");
                        setTimeout(() => {
                          const query = prompt.toLowerCase();
                          let url = 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?q=80&w=400'; // default painting
                          if (query.includes('ring') || query.includes('emerald') || query.includes('jewelry')) {
                            url = 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=400';
                          } else if (query.includes('watch') || query.includes('clock') || query.includes('chronometer')) {
                            url = 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?q=80&w=400';
                          } else if (query.includes('bust') || query.includes('statue') || query.includes('sculpture')) {
                            url = 'https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?q=80&w=400';
                          } else if (query.includes('coin') || query.includes('gold') || query.includes('silver') || query.includes('money')) {
                            url = 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?q=80&w=400';
                          }
                          setImageUrl(url);
                          toast.success("✦ HOLOGRAM MOLECULAR SYNTHESIS COMPLETED.");
                        }, 1200);
                      }}
                      className="text-[8px] font-display text-cyber-cyan hover:underline tracking-wider uppercase font-bold"
                    >
                      [SYNTHESIZE HOLOGRAM]
                    </button>
                  </div>
                  <input 
                    type="text" required
                    value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://image-url.com, https://another-image.com"
                    className="w-full bg-black/60 border border-zinc-800 focus:border-cyber-gold focus:outline-none rounded-xl p-3 text-sm font-mono placeholder-zinc-800 text-white"
                  />
                  <p className="text-[8px] text-zinc-500 font-mono mt-0.5">Separate multiple URLs with commas for a slider gallery</p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-display text-gray-400">ARTIFACT COMPREHENSIVE DESCRIPTION</label>
                <textarea 
                  required rows={4}
                  value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="Include historical origins, verification details, carbon dimensions..."
                  className="w-full bg-black/60 border border-zinc-800 focus:border-cyber-gold focus:outline-none rounded-xl p-3 text-sm font-mono placeholder-zinc-800 text-white"
                />
              </div>

              <div className="pt-2 flex gap-4">
                <button 
                  type="button" onClick={() => setViewTab('inventory')}
                  className="w-1/2 py-3 rounded-xl border border-zinc-800 hover:border-zinc-700 text-gray-400 font-display text-xs"
                >
                  CANCEL
                </button>
                <button 
                  type="submit" disabled={formLoading}
                  className="w-1/2 py-3 rounded-xl bg-gradient-to-r from-cyber-gold to-yellow-600 hover:from-yellow-600 hover:to-cyber-gold text-black font-display font-bold text-xs"
                >
                  {formLoading ? 'STORING TO CHAIN...' : editMode ? 'UPDATE LISTING' : 'BROADCAST LISTING'}
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// 3. ORDER MANAGER DASHBOARD
// -------------------------------------------------------------
export function OrderManagerDashboard({ user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [refundReceipts, setRefundReceipts] = useState({});
  const [logisticsNotes, setLogisticsNotes] = useState({}); // Mapped notes inputs
  const toast = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/orders`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to poll logs database.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    const noteContent = logisticsNotes[orderId] || '';
    try {
      const res = await fetch(`${API_BASE}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ status: newStatus, notes: noteContent })
      });
      if (res.ok) {
        toast.success(`Order #${orderId} status changed to ${newStatus}`);
        // Clear logistics note input
        setLogisticsNotes(prev => ({ ...prev, [orderId]: '' }));
        fetchOrders();
      } else {
        const errorData = await res.json();
        toast.error(`Error: ${errorData.message}`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error during log override.');
    }
  };

  const handleRefund = async (orderId) => {
    if (!window.confirm('Are you sure you want to trigger a payment gateway refund for this order?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/payments/refund/${orderId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (res.ok) {
        const generatedHash = `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
        setRefundReceipts(prev => ({ ...prev, [orderId]: generatedHash }));
        toast.success(`Refund processed successfully. ID: ${data.refundId}`);
        fetchOrders();
      } else {
        toast.error(`Refund execution failed: ${data.message}`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to verify API gateway.');
    }
  };

  const filteredOrders = filterStatus === 'All' 
    ? orders
    : orders.filter(o => o.status === filterStatus);

  const statuses = ['All', 'Pending', 'Paid', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-zinc-900 pb-4">
        <div>
          <h2 className="text-xl font-display font-extrabold text-cyber-cyan tracking-widest hover:drop-shadow-cyan-glow transition-all">
            LOGISTICS CONTROLLER TERMINAL
          </h2>
          <p className="text-[10px] font-mono text-zinc-500 mt-1">OPERATOR ROLE: LOGISTICS OFFICER</p>
        </div>

        {/* Filter */}
        <div className="flex flex-wrap gap-1">
          {statuses.map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-display tracking-wider transition-all ${
                filterStatus === st 
                  ? 'bg-cyber-cyan text-black font-extrabold shadow-cyan-glow'
                  : 'border border-zinc-950 text-gray-500 hover:text-white'
              }`}
            >
              {st.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center text-cyber-cyan font-display text-sm holo-flicker">POLLING ACTIVE SHIPMENT CHANNELS...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-20 text-gray-500 font-display text-xs border border-zinc-900 rounded-3xl">
          NO MATCHING SHIPMENT CONTRACTS RETRIEVED
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(order => (
            <div key={order.id} className="p-6 rounded-3xl bg-zinc-950/70 border border-zinc-900 space-y-4">
              <div className="flex flex-wrap justify-between items-center gap-4 border-b border-zinc-900 pb-4">
                <div>
                  <div className="text-xs font-display text-white">CONTRACT #NX_{order.id}</div>
                  <div className="text-[10px] font-mono text-gray-500 mt-1">
                    BUYER: {order.customer?.name} ({order.customer?.email}) | {new Date(order.createdAt).toLocaleString()}
                  </div>
                  {order.customer?.phone && (
                    <div className="text-[9px] font-mono text-cyber-cyan mt-0.5">
                      BUYER CONTACT TEL: {order.customer.phone}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <StatusBadge status={order.status} />
                  <span className="text-sm font-display font-extrabold text-cyber-gold">
                    ₹{parseFloat(order.totalAmount).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Items details */}
              <div className="space-y-2">
                {order.items.map(item => (
                  <div key={item.id} className="text-xs font-mono text-gray-350 flex justify-between">
                    <span>{item.product?.title || 'Unknown artifact'} x{item.quantity}</span>
                    <span className="text-gray-500">₹{parseFloat(item.price).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Display existing logs / notes */}
              {order.notes && (
                <div className="p-3 bg-zinc-900/40 border border-zinc-850 rounded-xl text-xs font-mono text-zinc-400">
                  <span className="text-[9px] text-zinc-500 font-display tracking-wider block mb-0.5">ACTIVE LOGISTICS NOTE:</span>
                  "{order.notes}"
                </div>
              )}

              {/* Refund confirmation hash badge if refunded */}
              {order.status === 'Refunded' && refundReceipts[order.id] && (
                <div className="p-2.5 bg-purple-950/30 border border-purple-500/20 text-purple-400 text-[10px] font-mono rounded-xl">
                  ✦ CRYPTO REFUND RECEIPT REGISTERED: <span className="text-white select-all">{refundReceipts[order.id]}</span>
                </div>
              )}

              {/* Coordinates and Actions */}
              <div className="pt-4 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="text-[10px] font-mono text-gray-500 flex-1">
                  <span className="block font-display text-[9px] tracking-wider text-gray-400">SHIPMENT TARGET COORDINATES:</span>
                  {order.shippingAddress}
                </div>

                {/* Operations Dropdown with Notes parameters */}
                <div className="flex flex-wrap items-center gap-3 self-end justify-end">
                  <input 
                    type="text" 
                    placeholder="Enter logistics logs / details..." 
                    value={logisticsNotes[order.id] || ''}
                    onChange={(e) => setLogisticsNotes({ ...logisticsNotes, [order.id]: e.target.value })}
                    className="w-48 bg-black/60 border border-zinc-800 focus:border-cyber-cyan text-xs font-mono rounded-lg p-2 focus:outline-none placeholder-zinc-800 text-white"
                  />

                  <select
                    value={order.status}
                    onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                    className="bg-black border border-zinc-800 focus:border-cyber-cyan text-xs font-display text-cyber-cyan rounded-lg p-2 focus:outline-none"
                  >
                    <option value="Pending">PENDING</option>
                    <option value="Paid">PAID</option>
                    <option value="Shipped">SHIPPED</option>
                    <option value="Delivered">DELIVERED</option>
                    <option value="Cancelled">CANCELLED</option>
                    <option value="Refunded">REFUNDED</option>
                  </select>

                  {/* Refund Trigger */}
                  {order.status === 'Cancelled' && (
                    <button
                      onClick={() => handleRefund(order.id)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-red-700 hover:from-red-700 hover:to-red-500 text-white font-display font-extrabold text-[10px] tracking-widest transition-all duration-300 transform active:scale-95 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse"
                    >
                      REFUND VALUE
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// 4. ADMIN DASHBOARD
// -------------------------------------------------------------
export function AdminDashboard({ user }) {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [roleRequests, setRoleRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const userRes = await fetch(`${API_BASE}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        setUsers(userData);
      } else {
        toast.error('Failed to retrieve client directory.');
      }

      const statRes = await fetch(`${API_BASE}/api/admin/stats`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (statRes.ok) {
        const statData = await statRes.json();
        setStats(statData);
      } else {
        toast.error('Failed to retrieve platform telemetry.');
        setStats(null);
      }

      const couponRes = await fetch(`${API_BASE}/api/admin/coupons`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (couponRes.ok) {
        const couponData = await couponRes.json();
        setCoupons(couponData || []);
      } else {
        toast.error('Failed to retrieve coupon registry.');
      }

      const requestRes = await fetch(`${API_BASE}/api/admin/role-requests`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (requestRes.ok) {
        const requestData = await requestRes.json();
        setRoleRequests(requestData || []);
      } else {
        toast.error('Failed to retrieve role upgrade requests.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Central security link lost.');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveRequest = async (requestId, status) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/role-requests/${requestId}/resolve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Clearance upgrade ${status === 'approved' ? 'approved' : 'rejected'}.`);
        fetchAdminData();
      } else {
        toast.error(data.message || 'Failed to resolve request.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to communicate with authorization center.');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.emailAlert) {
          toast.success(data.emailAlert);
        } else {
          toast.success('User credentials state shifted.');
        }
        fetchAdminData();
      } else {
        const errData = await res.json();
        toast.error(errData.message);
      }
    } catch (err) {
      console.error(err);
      toast.error('Central auth database sync failed.');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to permanently erase this user registry?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        toast.info('User registry successfully purged.');
        fetchAdminData();
      } else {
        const errData = await res.json();
        toast.error(errData.message);
      }
    } catch (err) {
      console.error(err);
      toast.error(' PURGE process errored.');
    }
  };

  const handleAddCoupon = async (code, discount) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/coupons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ code, discount })
      });
      const data = await res.json();
      if (res.ok) {
        setCoupons(prev => [data, ...prev]);
        toast.success(`PROMO REGISTERED: ${code} (${discount}%)`);
      } else {
        toast.error(data.message || 'Failed to create coupon.');
      }
    } catch(err) {
      toast.error('Failed to dispatch coupon registry creation.');
    }
  };

  const handleDeleteCoupon = async (code) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/coupons/${code}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        setCoupons(prev => prev.filter(c => c.code !== code));
        toast.info('Promo coupon deleted.');
      } else {
        toast.error('Failed to delete coupon.');
      }
    } catch(err) {
      toast.error('Failed to dispatch coupon deletion.');
    }
  };

  // Pre-calculate maximum daily revenue for scale
  const revenueDays = stats?.revenueByDay ? Object.keys(stats.revenueByDay) : [];
  const revenueValues = stats?.revenueByDay ? Object.values(stats.revenueByDay) : [];
  const maxRevenue = Math.max(...revenueValues, 1000);

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="border-b border-zinc-900 pb-4">
        <h2 className="text-xl font-display font-extrabold text-cyber-gold tracking-widest pulse-gold-glow border border-cyber-gold/25 inline-block px-4 py-2 rounded-xl">
          NEXUS OVERLORD CONSOLE
        </h2>
        <p className="text-[10px] font-mono text-zinc-500 mt-2">GLOBAL CONTROLLER STATUS: SECURITY LEVEL OMNIPOTENT</p>
      </div>

      {loading ? (
        <div className="text-center text-cyber-gold font-display text-sm holo-flicker font-bold">PROBING CENTRAL OPERATIONS CORE...</div>
      ) : (
        <>
          {/* Stats Summary Panel */}
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 rounded-3xl bg-zinc-950/60 border border-zinc-900">
                <div className="text-[10px] font-display text-gray-500 tracking-wider">TOTAL CLIENTS</div>
                <div className="text-2xl font-display font-black text-white mt-2">{stats.totalUsers}</div>
              </div>
              <div className="p-6 rounded-3xl bg-zinc-950/60 border border-zinc-900">
                <div className="text-[10px] font-display text-gray-500 tracking-wider">TOTAL ARTIFACTS</div>
                <div className="text-2xl font-display font-black text-cyber-cyan mt-2">{stats.totalProducts}</div>
              </div>
              <div className="p-6 rounded-3xl bg-zinc-950/60 border border-zinc-900">
                <div className="text-[10px] font-display text-gray-500 tracking-wider">TOTAL TRANSACTIONS</div>
                <div className="text-2xl font-display font-black text-cyber-gold mt-2">{stats.totalOrders}</div>
              </div>
              <div className="p-6 rounded-3xl bg-zinc-950/60 border border-zinc-900">
                <div className="text-[10px] font-display text-gray-500 tracking-wider">TOTAL REVENUE (INR)</div>
                <div className="text-xl font-display font-black text-green-400 mt-2">
                  ₹{stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          )}

          {/* Futuristic Analytics Visual Section */}
          {stats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Daily Revenue Bar Chart (SVG / HTML elements) */}
              <div className="p-6 rounded-3xl bg-zinc-950/70 border border-zinc-900 space-y-4">
                <div className="text-xs font-display text-cyber-cyan tracking-widest font-bold">
                  REVENUE LOGS (LAST 7 DAYS)
                </div>
                <div className="h-48 flex items-end gap-3 pt-6 border-b border-zinc-800 pb-2">
                  {revenueDays.map((day, idx) => {
                    const value = stats.revenueByDay[day];
                    const percent = (value / maxRevenue) * 100;
                    return (
                      <div key={day} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                        <div className="relative w-full group">
                          {/* Tooltip on hover */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 bg-black border border-cyber-cyan text-[8px] font-mono text-cyber-cyan py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none mb-1 z-10 whitespace-nowrap">
                            ₹{parseFloat(value).toLocaleString()}
                          </div>
                          <div 
                            style={{ height: `${Math.max(percent, 4)}%` }}
                            className="w-full bg-gradient-to-t from-cyber-cyan/30 to-cyber-cyan border border-cyber-cyan/50 rounded-t-md transition-all duration-1000 group-hover:shadow-[0_0_15px_rgba(0,240,255,0.4)]"
                          />
                        </div>
                        <div className="text-[8px] font-mono text-zinc-500 rotate-45 sm:rotate-0 tracking-tighter">
                          {day.substring(5)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Status Breakdown & Users Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Orders Breakdown */}
                <div className="p-6 rounded-3xl bg-zinc-950/70 border border-zinc-900 space-y-4">
                  <div className="text-xs font-display text-cyber-gold tracking-widest font-bold">
                    ORDER STATISTICAL MATRIX
                  </div>
                  <div className="space-y-3 pt-2">
                    {Object.keys(stats.ordersByStatus || {}).map(status => {
                      const count = stats.ordersByStatus[status];
                      const pct = stats.totalOrders > 0 ? (count / stats.totalOrders) * 100 : 0;
                      return (
                        <div key={status} className="space-y-1">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-gray-400 uppercase">{status}</span>
                            <span className="text-cyber-gold">{count} ({pct.toFixed(0)}%)</span>
                          </div>
                          <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                            <div 
                              style={{ width: `${pct}%` }} 
                              className="h-full bg-cyber-gold rounded-full"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Users breakdown by Role */}
                <div className="p-6 rounded-3xl bg-zinc-950/70 border border-zinc-900 space-y-4">
                  <div className="text-xs font-display text-white tracking-widest font-bold">
                    SYSTEM INSTANCE ACCESS
                  </div>
                  <div className="space-y-3 pt-2">
                    {Object.keys(stats.usersByRole || {}).map(role => {
                      const count = stats.usersByRole[role];
                      const pct = stats.totalUsers > 0 ? (count / stats.totalUsers) * 100 : 0;
                      return (
                        <div key={role} className="space-y-1">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-gray-400 uppercase">{role.replace('_', ' ')}</span>
                            <span className="text-cyber-cyan">{count}</span>
                          </div>
                          <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                            <div 
                              style={{ width: `${pct}%` }} 
                              className="h-full bg-cyber-cyan rounded-full"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Top Selling Products */}
          {stats && stats.topProducts && stats.topProducts.length > 0 && (
            <div className="p-6 rounded-3xl bg-zinc-950/70 border border-zinc-900 space-y-4">
              <div className="text-xs font-display text-cyber-gold tracking-widest font-bold">
                TOP TRANSACTED ARTIFACTS
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {stats.topProducts.map((p, idx) => (
                  <div key={p.productId} className="p-4 bg-black/40 border border-zinc-900 rounded-2xl flex flex-col justify-between items-center text-center space-y-2">
                    <img src={p.product?.imageUrl} alt={p.product?.title} className="w-16 h-16 object-cover rounded-xl border border-zinc-800" />
                    <div>
                      <div className="text-xs font-display text-white truncate max-w-[120px]">{p.product?.title}</div>
                      <div className="text-[9px] font-mono text-zinc-500">SOLD: {p.totalSold} UNITS</div>
                    </div>
                    <div className="text-xs font-display text-cyber-gold font-bold">
                      ₹{parseFloat(p.totalRevenue).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Users Matrix */}
          <div className="space-y-4">
            <h3 className="text-sm font-display font-bold text-white tracking-widest">
              USER ROLES DIRECTORY MATRIX
            </h3>
            
            <div className="overflow-x-auto border border-zinc-900 rounded-3xl bg-zinc-950/40">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-zinc-900 bg-black/60 text-gray-400 font-display text-[9px] tracking-widest">
                    <th className="p-4">USER ID</th>
                    <th className="p-4">NAME</th>
                    <th className="p-4">EMAIL</th>
                    <th className="p-4">REGISTERED</th>
                    <th className="p-4 text-center">SYSTEM ROLE OVERRIDE</th>
                    <th className="p-4 text-right">SYSTEM ACCESS ERASURE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900 text-gray-300">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-zinc-950/80 transition-colors">
                      <td className="p-4 text-cyber-cyan">#NX_U_{u.id}</td>
                      <td className="p-4 text-white font-sans font-medium">{u.name}</td>
                      <td className="p-4">{u.email}</td>
                      <td className="p-4 text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="p-4 text-center">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="bg-black border border-zinc-800 text-xs font-display text-cyber-gold rounded-lg p-2 focus:outline-none"
                        >
                          <option value="customer">CUSTOMER</option>
                          <option value="seller">SELLER</option>
                          <option value="order_manager">ORDER MANAGER</option>
                          <option value="admin">ADMIN</option>
                        </select>
                      </td>
                      <td className="p-4 text-right">
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="px-2.5 py-1 text-[9px] font-display text-red-500 border border-red-500/20 hover:border-red-500 rounded transition-colors"
                          >
                            ERASE REGISTRY
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Role Upgrade Requests Matrix */}
          <div className="space-y-4">
            <h3 className="text-sm font-display font-bold text-white tracking-widest uppercase">
              ✦ ROLE PRIVILEGE UPGRADE REQUESTS ✦
            </h3>
            
            <div className="overflow-x-auto border border-zinc-900 rounded-3xl bg-zinc-950/40">
              {roleRequests.length === 0 ? (
                <div className="p-8 text-center text-xs font-mono text-zinc-500 italic">
                  No role upgrade requests logged in the security buffer.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="border-b border-zinc-900 bg-black/60 text-gray-400 font-display text-[9px] tracking-widest">
                      <th className="p-4">REQUEST ID</th>
                      <th className="p-4">USER DETAILS</th>
                      <th className="p-4">REQUESTED LEVEL</th>
                      <th className="p-4">JUSTIFICATION / REASON</th>
                      <th className="p-4">LOGGED AT</th>
                      <th className="p-4">STATUS</th>
                      <th className="p-4 text-right">RESOLVING ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900 text-gray-300">
                    {roleRequests.map(req => (
                      <tr key={req.id} className="hover:bg-zinc-950/80 transition-colors">
                        <td className="p-4 text-cyber-cyan">#NX_REQ_{req.id}</td>
                        <td className="p-4">
                          <div className="text-white font-sans font-medium">{req.user?.name}</div>
                          <div className="text-[10px] text-zinc-500">{req.user?.email}</div>
                          <div className="text-[9px] text-zinc-600">Current: {req.user?.role?.toUpperCase()}</div>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyber-gold/10 text-cyber-gold border border-cyber-gold/25 font-display uppercase">
                            {req.requestedRole === 'seller' ? 'SELLER' : 'ORDER MANAGER'}
                          </span>
                        </td>
                        <td className="p-4 max-w-xs truncate text-[11px]" title={req.reason}>
                          {req.reason}
                        </td>
                        <td className="p-4 text-gray-500">{new Date(req.createdAt).toLocaleString()}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            req.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 animate-pulse' :
                            req.status === 'approved' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                            'bg-red-500/10 text-red-500 border border-red-500/20'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {req.status === 'pending' ? (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleResolveRequest(req.id, 'approved')}
                                className="px-2.5 py-1 text-[9px] font-display text-green-400 border border-green-500/20 hover:border-green-500 hover:bg-green-500/10 rounded transition-colors"
                              >
                                APPROVE
                              </button>
                              <button
                                onClick={() => handleResolveRequest(req.id, 'rejected')}
                                className="px-2.5 py-1 text-[9px] font-display text-red-400 border border-red-500/20 hover:border-red-500 hover:bg-red-500/10 rounded transition-colors"
                              >
                                REJECT
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-zinc-600 italic">RESOLVED</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Coupon / Promotion Management Panel */}
          <div className="p-6 rounded-3xl bg-zinc-950/70 border border-zinc-900 space-y-4">
            <div className="text-xs font-display text-cyber-gold tracking-widest font-bold uppercase">
              ✦ SYSTEM PROMOTION REBATE CODES ✦
            </div>
            
            {/* List active coupons */}
            {coupons.length === 0 ? (
              <div className="text-[10px] text-zinc-600 font-mono italic py-2">
                No active promotional codes found in the registry database.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {coupons.map((coupon) => (
                  <div key={coupon.code} className="p-4 rounded-2xl bg-black/60 border border-zinc-900 flex justify-between items-center font-mono text-xs">
                    <div>
                      <span className="text-white font-bold block">{coupon.code}</span>
                      <span className="text-cyber-cyan text-[10px]">{coupon.discount}% Discount</span>
                    </div>
                    <button
                      onClick={() => handleDeleteCoupon(coupon.code)}
                      className="text-[9px] font-display text-red-500 hover:text-red-400 tracking-wider"
                    >
                      [DELETE]
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Create new coupon form */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const code = e.target.elements.code.value.trim().toUpperCase();
                const discount = parseInt(e.target.elements.discount.value);
                if (!code || isNaN(discount) || discount < 1 || discount > 100) {
                  toast.error('Invalid code input or discount range.');
                  return;
                }
                handleAddCoupon(code, discount);
                e.target.reset();
              }}
              className="flex flex-col sm:flex-row gap-3 pt-2"
            >
              <input 
                name="code" type="text" placeholder="NEW PROMO CODE..." required
                className="flex-1 bg-black border border-zinc-800 text-xs font-mono rounded-xl p-3 focus:outline-none placeholder-zinc-500 text-white"
              />
              <input 
                name="discount" type="number" min="1" max="100" placeholder="DISCOUNT %..." required
                className="w-full sm:w-32 bg-black border border-zinc-800 text-xs font-mono rounded-xl p-3 focus:outline-none placeholder-zinc-500 text-white"
              />
              <button 
                type="submit"
                className="px-5 py-3 bg-cyber-gold hover:bg-yellow-650 text-black font-display font-extrabold text-[10px] tracking-widest rounded-xl transition-all"
              >
                GENERATE PROMO
              </button>
            </form>
          </div>

          {/* Maintenance Actions Panel */}
          <div className="p-6 rounded-3xl bg-red-950/10 border border-red-500/20 space-y-4">
            <div className="text-xs font-display text-red-400 tracking-widest font-bold uppercase">
              ✦ CORE PLATFORM MAINTENANCE PROTOCOLS ✦
            </div>
            <p className="text-[10px] font-mono text-zinc-500 max-w-2xl leading-relaxed">
              WARNING: Executing a platform reset synchronizes the database schemas, flushes active orders, clears cart tokens, and restores all seeded relics. This action is irreversible.
            </p>
            <button
              type="button"
              onClick={async () => {
                if (!window.confirm('CRITICAL ACTION: Reset the entire platform database?')) return;
                try {
                  const res = await fetch(`${API_BASE}/api/admin/reset-db`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${user.token}` }
                  });
                  const data = await res.json();
                  if (res.ok) {
                    toast.success('Database successfully reset. Re-sync completed.');
                    fetchAdminData();
                  } else {
                    toast.error(data.message);
                  }
                } catch(e) {
                  toast.error('Failed to dispatch command to maintenance portal.');
                }
              }}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-black font-display font-extrabold text-[10px] tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(220,38,38,0.3)]"
            >
              [RESET SYSTEM DATABASE TO SEED DEFAULTS]
            </button>
          </div>
        </>
      )}
    </div>
  );
}
