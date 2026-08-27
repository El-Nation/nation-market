'use client';
import { useState, useEffect } from 'react';
import { useCartStore } from '../../store/cartStore';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function MobileGroupedCartPage() {
  const { items, removeItem, updateQty, clearCart } = useCartStore();
  const { token } = useAuthStore();
  const router = useRouter();

  // Active Bottom Nav Tab for layout parity
  const [activeTab, setActiveTab] = useState('Cart');

  // Address State
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: 'Home', line1: '', line2: '', city: 'Lagos', state: 'Lagos' });

  // Guest State
  const [guestEmail, setGuestEmail] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [geoStatus, setGeoStatus] = useState('');

  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [loadingVendorId, setLoadingVendorId] = useState<string | null>(null);
  const [orderError, setOrderError] = useState('');
  
  // Hardcoded fees per block
  const DELIVERY_FEE = 1500;
  const PLATFORM_FEE = 500;

  useEffect(() => {
    if (!token) return;
    async function fetchAddresses() {
      try {
        const res = await fetch(`${API_URL}/customer/addresses`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data.success && data.data) {
          setAddresses(data.data);
          const defaultAddr = data.data.find((a: any) => a.isDefault) || data.data[0];
          if (defaultAddr) setSelectedAddressId(defaultAddr.id);
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchAddresses();
  }, [token]);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setGeoStatus('Geolocation not supported.');
      return;
    }
    setGeoStatus('Locating...');
    navigator.geolocation.getCurrentPosition(
      pos => {
        setGeoStatus('Found!');
        setNewAddress(p => ({ ...p, line1: `${pos.coords.latitude}, ${pos.coords.longitude} (GPS)` }));
        setShowAddressForm(true);
      },
      () => setGeoStatus('Denied.'),
      { timeout: 10000 }
    );
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress.line1 || !newAddress.city || !token) return;
    try {
      const res = await fetch(`${API_URL}/customer/addresses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...newAddress, isDefault: true })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setAddresses([data.data, ...addresses]);
        setSelectedAddressId(data.data.id);
        setShowAddressForm(false);
      }
    } catch(e) {}
  };

  // Group Items by Vendor
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.vendorId]) acc[item.vendorId] = { vendorName: item.vendorName, items: [] };
    acc[item.vendorId].items.push(item);
    return acc;
  }, {} as Record<string, { vendorName: string, items: any[] }>);

  const vendorGroups = Object.entries(groupedItems);

  const calculateSubtotal = (vendorItems: any[]) => {
    return vendorItems.reduce((acc, i) => acc + (i.price * (1 - i.discount/100)) * i.quantity, 0);
  };

  const handleCheckoutAll = async () => {
    if (!token && (!guestEmail || !guestName || !newAddress.line1)) {
      setOrderError('Please provide all guest details and delivery address at the top of the page.');
      window.scrollTo(0,0);
      return;
    }
    if (token && addresses.length === 0 && !showAddressForm && !newAddress.line1) {
      setShowAddressForm(true);
      setOrderError('Please add a delivery address before checkout.');
      window.scrollTo(0,0);
      return;
    }

    setOrderError('');
    setLoadingCheckout(true);

    try {
      const payload = {
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
        deliveryAddressId: selectedAddressId || undefined,
        deliveryAddress: (!selectedAddressId || !token) ? newAddress : undefined,
        guestEmail: !token ? guestEmail : undefined,
        guestName: !token ? guestName : undefined,
        guestPhone: !token ? guestPhone : undefined,
        type: 'DELIVERY'
      };

      const res = await fetch(`${API_URL}/customer/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success && data.data) {
        clearCart();
        if (data.data.paystackUrl) {
          window.location.href = data.data.paystackUrl;
        } else {
          router.push(`/checkout/success?reference=${data.data.reference}`);
        }
      } else {
        setOrderError(data.message || 'Failed to checkout your cart.');
      }
    } catch (err: any) {
      setOrderError(err.message || 'Network error.');
    } finally {
      setLoadingCheckout(false);
    }
  };
  
  const handleCheckoutByVendor = async (vendorId: string, vendorItems: any[]) => {
    if (!token && (!guestEmail || !guestName || !newAddress.line1)) {
      setOrderError('Please provide all guest details and delivery address at the top of the page.');
      window.scrollTo(0,0);
      return;
    }
    if (token && addresses.length === 0 && !showAddressForm && !newAddress.line1) {
      setShowAddressForm(true);
      setOrderError('Please add a delivery address before checkout.');
      window.scrollTo(0,0);
      return;
    }

    setOrderError('');
    setLoadingVendorId(vendorId);

    try {
      const payload = {
        items: vendorItems.map(i => ({ productId: i.productId, quantity: i.quantity })),
        deliveryAddressId: selectedAddressId || undefined,
        deliveryAddress: (!selectedAddressId || !token) ? newAddress : undefined,
        guestEmail: !token ? guestEmail : undefined,
        guestName: !token ? guestName : undefined,
        guestPhone: !token ? guestPhone : undefined,
        type: 'DELIVERY'
      };

      const res = await fetch(`${API_URL}/customer/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success && data.data) {
        vendorItems.forEach(i => removeItem(i.productId));
        if (data.data.paystackUrl) {
          window.location.href = data.data.paystackUrl;
        } else {
          router.push(`/checkout/success?reference=${data.data.reference}`);
        }
      } else {
        setOrderError(data.message || 'Failed to checkout vendor.');
      }
    } catch (err: any) {
      setOrderError(err.message || 'Network error.');
    } finally {
      setLoadingVendorId(null);
    }
  };

  const handleClearVendor = (vendorItems: any[]) => {
    vendorItems.forEach(i => removeItem(i.productId));
  };

  const totalCartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; background: #f8fafc; color: #0f172a; padding-bottom: 90px; }
        
        .cart-app-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; background: #fff; position: sticky; top: 0; z-index: 100; border-bottom: 1px solid #f1f5f9; }
        .cart-header-left { display: flex; align-items: center; gap: 0.75rem; }
        .cart-title { font-size: 1.15rem; font-weight: 800; color: #111; }
        .clear-cart-btn { background: #e0f2fe; color: #0369a1; border: none; padding: 0.4rem 0.8rem; border-radius: 99px; font-size: 0.8rem; font-weight: 700; cursor: pointer; transition: background 0.15s; font-family: inherit; }
        
        .cart-tabs { display: flex; background: #fff; padding: 0.5rem 1.25rem; margin-bottom: 1rem; }
        .tab-box { display: flex; width: 100%; background: #f1f5f9; border-radius: 12px; padding: 0.35rem; }
        .tab-btn { flex: 1; text-align: center; padding: 0.5rem; font-size: 0.85rem; font-weight: 700; border-radius: 8px; cursor: pointer; border: none; background: transparent; color: #64748b; font-family: inherit; transition: all 0.2s; }
        .tab-btn.active { background: #000; color: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        
        .main-content { padding: 0 1.25rem; max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.25rem; }
        
        .global-address-pane { background: #fff; padding: 1.25rem; border-radius: 16px; border: 1px solid #f1f5f9; box-shadow: 0 2px 10px rgba(0,0,0,0.02); }
        .input-grid { display: grid; grid-template-columns: 1fr; gap: 0.6rem; margin-top: 0.75rem; }
        .input-base { padding: 0.75rem 1rem; border: 1.5px solid #e2e8f0; border-radius: 8px; font-family: inherit; font-size: 0.9rem; outline: none; transition: border 0.15s; width: 100%; }
        .input-base:focus { border-color: #10b981; }

        .vendor-block { background: #fff; border-radius: 16px; border: 1px solid #f1f5f9; padding: 1.25rem; box-shadow: 0 4px 16px rgba(0,0,0,0.03); display: flex; flex-direction: column; gap: 1rem; }
        .vendor-block-header { display: flex; align-items: flex-start; gap: 0.8rem; border-bottom: 1px dashed #e2e8f0; padding-bottom: 1rem; }
        .v-logo { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; background: #f8fafc; }
        .v-header-info { flex: 1; }
        .v-name { font-size: 1rem; font-weight: 800; color: #111; margin-bottom: 0.25rem; }
        .v-meta { font-size: 0.8rem; color: #64748b; font-weight: 600; display: flex; align-items: center; gap: 0.4rem; }
        .v-meta-dot { font-size: 0.5rem; color: #cbd5e1; }
        .v-view-btn { font-size: 0.8rem; font-weight: 700; color: #111; display: flex; align-items: center; gap: 0.35rem; cursor: pointer; text-decoration: none; }
        
        .v-item { display: flex; align-items: center; gap: 0.85rem; padding: 0.75rem 0; }
        .v-item-img { width: 50px; height: 50px; border-radius: 8px; object-fit: cover; background: #f1f5f9; }
        .v-item-details { flex: 1; min-width: 0; }
        .v-item-name { font-size: 0.85rem; font-weight: 700; color: #1e293b; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .v-item-price { font-size: 0.95rem; font-weight: 800; color: #0f172a; margin-top: 0.2rem; }
        
        .v-qty-wrap { display: flex; align-items: center; gap: 0.65rem; background: #f8fafc; padding: 0.25rem; border-radius: 99px; }
        .v-qty-btn { width: 26px; height: 26px; border-radius: 50%; background: #fff; border: 1px solid #e2e8f0; color: #333; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        
        .v-deliver-wrap { display: flex; align-items: flex-start; gap: 0.65rem; background: #f8fafc; padding: 0.85rem; border-radius: 12px; margin-top: 0.5rem; }
        .v-del-icon { font-size: 1.25rem; }
        .v-del-text { font-size: 0.8rem; color: #334155; line-height: 1.4; font-weight: 500; }
        
        .v-checkout-btn { width: 100%; background: #064e3b; color: #fff; font-size: 0.95rem; font-weight: 800; padding: 1rem; border-radius: 12px; border: none; cursor: pointer; transition: opacity 0.2s; font-family: inherit; margin-top: 0.5rem; }
        .v-checkout-btn:hover { opacity: 0.9; }
        .v-checkout-btn:disabled { background: #94a3b8; cursor: not-allowed; }
        .v-clear-btn { width: 100%; background: transparent; color: #059669; font-size: 0.88rem; font-weight: 700; border: none; cursor: pointer; padding: 0.5rem; font-family: inherit; margin-top: 0.25rem; }

        .err-label { background: #fee2e2; color: #b91c1c; padding: 0.75rem; border-radius: 8px; font-size: 0.85rem; font-weight: 600; text-align: center; margin-bottom: 1rem; border: 1px solid #fecaca; }

        .dock-bar { position: fixed; bottom: 0; left: 0; right: 0; background: #f8fafc; padding: 0.5rem 1rem; z-index: 1000; display: flex; justify-content: center; }
        .dock-inner { background: #fff; border-radius: 99px; display: flex; width: 100%; max-width: 480px; justify-content: space-around; padding: 0.4rem 0.5rem; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #f1f5f9; }
        .dock-btn { display: flex; flex-direction: column; align-items: center; gap: 0.35rem; background: none; border: none; cursor: pointer; padding: 0.5rem 1rem; border-radius: 99px; transition: all 0.2s; position: relative; text-decoration: none; }
        .dock-btn:hover { background: #f1f5f9; }
        .dock-btn.active { background: #059669; }
        .dock-icon { font-size: 1.25rem; }
        .dock-btn.active .dock-icon { display: none; }
        .dock-label { font-size: 0.72rem; font-weight: 700; color: #94a3b8; }
        .dock-btn.active .dock-label { color: #fff; font-size: 0.8rem; }
        .dock-badge { position: absolute; top: 0px; right: 6px; background: #fbbf24; color: #111; font-size: 0.65rem; font-weight: 800; height: 20px; width: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        
        @media (max-width: 500px) {
          .main-content { padding: 0 0.5rem; }
          .vendor-block { padding: 1rem; }
          .v-item { flex-wrap: wrap; gap: 0.5rem; }
          .v-item-img { width: 44px; height: 44px; }
          .v-qty-wrap { margin-left: auto; width: 100%; justify-content: flex-end; padding: 0.25rem 0.5rem; }
          .v-deliver-wrap { flex-direction: column; }
          .global-address-pane { padding: 1rem; }
        }
      `}</style>
      
      <header className="cart-app-header">
        <div className="cart-header-left">
          <button onClick={() => router.push('/')} style={{ background:'none',border:'none',fontSize:'1.2rem',cursor:'pointer' }}>←</button>
          <div className="cart-title">Orders</div>
        </div>
        {items.length > 0 && (
          <button className="clear-cart-btn" onClick={clearCart}>Clear Cart</button>
        )}
      </header>

      <div className="cart-tabs">
        <div className="tab-box">
          <button className="tab-btn active">My Cart</button>
          <button className="tab-btn">Ongoing</button>
          <button className="tab-btn">Completed</button>
        </div>
      </div>

      <main className="main-content">
        {orderError && <div className="err-label">{orderError}</div>}

        {vendorGroups.length === 0 ? (
          <div style={{ textAlign:'center', padding:'4rem 1rem', color:'#64748b' }}>
            <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>🛍️</div>
            <p style={{ fontWeight:600 }}>Your cart is empty.</p>
          </div>
        ) : (
          <>
            <div className="global-address-pane">
              <h3 style={{ fontSize:'0.9rem', fontWeight:800, marginBottom:'0.5rem', display:'flex', alignItems:'center', gap:'0.4rem' }}>
                <span style={{ fontSize:'1.2rem' }}>📍</span> Delivery Destination
              </h3>
              
              {!token && (
                <div className="input-grid">
                  <input type="text" className="input-base" placeholder="Guest Full Name" value={guestName} onChange={e => setGuestName(e.target.value)} />
                  <input type="email" className="input-base" placeholder="Guest Email (For receipt)" value={guestEmail} onChange={e => setGuestEmail(e.target.value)} />
                  <input type="tel" className="input-base" placeholder="Guest Phone Number" value={guestPhone} onChange={e => setGuestPhone(e.target.value)} />
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:'0.5rem' }}>
                    <span style={{ fontSize:'0.8rem', fontWeight:600 }}>Address</span>
                    <button type="button" onClick={handleLocateMe} style={{ background:'none',border:'none',color:'#059669',fontSize:'0.75rem',fontWeight:700,cursor:'pointer' }}>📍 Locate Me</button>
                  </div>
                  {geoStatus && <div style={{ fontSize:'0.75rem', color:'#10b981' }}>{geoStatus}</div>}
                  <input type="text" className="input-base" placeholder="e.g. 29 Imatitikua, Uselu" value={newAddress.line1} onChange={e => setNewAddress({...newAddress, line1: e.target.value})} />
                </div>
              )}

              {token && (
                <>
                  {!showAddressForm ? (
                     <>
                     <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.75rem' }}>
                        <span style={{ fontSize:'0.85rem' }}>Select an address:</span>
                        <button type="button" onClick={() => setShowAddressForm(true)} style={{ background:'none',border:'none',color:'#059669',fontSize:'0.8rem',fontWeight:700,cursor:'pointer' }}>+ Add New</button>
                     </div>
                     {addresses.length === 0 && <span style={{ fontSize:'0.8rem', color:'#ef4444' }}>No addresses found.</span>}
                     {addresses.map(addr => (
                       <div key={addr.id} onClick={() => setSelectedAddressId(addr.id)} style={{ padding: '0.85rem', border: `1.5px solid ${selectedAddressId === addr.id ? '#10b981' : '#e2e8f0'}`, borderRadius: '8px', cursor: 'pointer', background: selectedAddressId === addr.id ? '#f0fdf4' : 'transparent', marginBottom: '0.5rem' }}>
                         <div style={{ fontSize:'0.85rem', fontWeight:700 }}>{addr.line1}</div>
                         <div style={{ fontSize:'0.75rem', color:'#64748b' }}>{addr.city}, {addr.state}</div>
                       </div>
                     ))}
                     </>
                  ) : (
                    <form onSubmit={handleAddAddress}>
                      <div className="input-grid">
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                          <label style={{ fontSize:'0.8rem', fontWeight:600 }}>Street Address</label>
                          <button type="button" onClick={handleLocateMe} style={{ background:'none',border:'none',color:'#059669',fontSize:'0.75rem',fontWeight:700,cursor:'pointer' }}>📍 Locate Me</button>
                        </div>
                        {geoStatus && <div style={{ fontSize:'0.75rem', color:'#10b981' }}>{geoStatus}</div>}
                        <input className="input-base" required value={newAddress.line1} onChange={e => setNewAddress({...newAddress, line1: e.target.value})} placeholder="12 Freedom Way" />
                        <input className="input-base" required value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} placeholder="City" />
                        <input className="input-base" required value={newAddress.state} onChange={e => setNewAddress({...newAddress, state: e.target.value})} placeholder="State" />
                        <div style={{ display:'flex', gap:'0.5rem' }}>
                           <button type="submit" style={{ flex:1, padding:'0.75rem', background:'#111', color:'#fff', borderRadius:'8px', fontWeight:600, border:'none', cursor:'pointer' }}>Save</button>
                           <button type="button" onClick={() => setShowAddressForm(false)} style={{ flex:1, padding:'0.75rem', background:'#f1f5f9', color:'#333', borderRadius:'8px', fontWeight:600, border:'none', cursor:'pointer' }}>Cancel</button>
                        </div>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>

            {vendorGroups.map(([vendorId, { vendorName, items: vendorItems }]) => {
              const vendorTotal = calculateSubtotal(vendorItems);
              const vendorGrandTotal = vendorTotal + DELIVERY_FEE + PLATFORM_FEE;
              
              return (
                <div key={vendorId} className="vendor-block">
                  <div className="vendor-block-header">
                    <img src="/logo.png" alt="Vendor" className="v-logo" style={{ objectFit:'contain' }} />
                    <div className="v-header-info">
                      <div className="v-name">{vendorName}</div>
                      <div className="v-meta">
                        {vendorItems.reduce((acc, i) => acc + i.quantity, 0)} Item{vendorItems.length>1?'s':''} 
                        <span className="v-meta-dot">•</span> 
                        ₦{(vendorTotal).toLocaleString()}
                      </div>
                    </div>
                    <a href={`/store/${vendorId}`} className="v-view-btn">View Selection <span>⌄</span></a>
                  </div>

                  <div className="vendor-items">
                    {vendorItems.map(item => (
                      <div key={item.productId} className="v-item">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="v-item-img" />
                        ) : (
                          <div className="v-item-img" style={{ display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem' }}>🛒</div>
                        )}
                        <div className="v-item-details">
                          <div className="v-item-name">{item.name}</div>
                          <div className="v-item-price">₦{(item.price * (1 - item.discount / 100)).toLocaleString()}</div>
                        </div>
                        <div className="v-qty-wrap">
                          <button className="v-qty-btn" onClick={() => updateQty(item.productId, item.quantity - 1)}>-</button>
                          <span style={{ fontSize:'0.85rem', fontWeight:800 }}>{item.quantity}</span>
                          <button className="v-qty-btn" onClick={() => updateQty(item.productId, item.quantity + 1)}>+</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="v-deliver-wrap">
                    <span className="v-del-icon">🛵</span>
                    <div className="v-del-text">
                      Delivering to <strong>{token ? (addresses.find(a => a.id === selectedAddressId)?.line1 || 'Saved Address') : (newAddress.line1 || 'Entered Address, City')}</strong><br/>
                      Total w/fees: ₦{vendorGrandTotal.toLocaleString()}
                    </div>
                  </div>

                  <button 
                    className="v-checkout-btn" 
                    onClick={() => handleCheckoutByVendor(vendorId, vendorItems)}
                    disabled={loadingVendorId === vendorId || loadingCheckout}
                  >
                    {loadingVendorId === vendorId ? 'Processing...' : 'Checkout just this store'}
                  </button>
                  <button className="v-clear-btn" onClick={() => handleClearVendor(vendorItems)}>
                    Clear Selection
                  </button>
                </div>
              );
            })}

            {(() => {
              let grandTotal = 0;
              vendorGroups.forEach(([vId, vObj]) => {
                const vTotal = calculateSubtotal(vObj.items);
                grandTotal += vTotal + DELIVERY_FEE + PLATFORM_FEE;
              });
              return (
                 <div className="global-checkout-pane" style={{ background: '#fff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #f1f5f9', marginTop: '1.5rem', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontWeight: 800, fontSize: '1.25rem' }}>
                      <span>Multi-Store Grand Total:</span>
                      <span>₦{grandTotal.toLocaleString()}</span>
                    </div>
                    <button 
                      className="v-checkout-btn" 
                      onClick={handleCheckoutAll}
                      disabled={loadingCheckout}
                      style={{ background: '#059669', fontSize: '1.05rem', padding: '1.25rem' }}
                    >
                      {loadingCheckout ? 'Processing Multiple Orders...' : `Checkout Entire Cart (₦${grandTotal.toLocaleString()})`}
                    </button>
                 </div>
              );
            })()}
          </>
        )}
      </main>

      {/* App Dock */}
      <div className="dock-bar">
        <div className="dock-inner">
          <a href="/" className={`dock-btn ${activeTab === 'Home' ? 'active' : ''}`} onClick={(e) => {e.preventDefault(); router.push('/');}}>
            <span className="dock-icon">🛋️</span>
            <span className="dock-label">Home</span>
          </a>
          <button className={`dock-btn ${activeTab === 'Search' ? 'active' : ''}`} onClick={() => router.push('/?search=focus')}>
            <span className="dock-icon">🔭</span>
            <span className="dock-label">Search</span>
          </button>
          <a href="/cart" className={`dock-btn ${activeTab === 'Cart' ? 'active' : ''}`}>
            <span className="dock-icon">🛒</span>
            {totalCartCount > 0 && <div className="dock-badge">{totalCartCount}</div>}
            <span className="dock-label">Cart</span>
          </a>
          <button className={`dock-btn ${activeTab === 'Support' ? 'active' : ''}`}>
            <span className="dock-icon">🎧</span>
            <span className="dock-label">Support</span>
          </button>
          <a href="/dashboard" className={`dock-btn ${activeTab === 'Profile' ? 'active' : ''}`}>
            <span className="dock-icon">🤡</span>
            <span className="dock-label">Profile</span>
          </a>
        </div>
      </div>
    </>
  );
}
