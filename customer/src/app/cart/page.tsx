'use client';
import { useState, useEffect } from 'react';
import { useCartStore } from '../../store/cartStore';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';

export default function CartPage() {
  const { items, removeItem, updateQty, clearCart, subtotal } = useCartStore();
  const { token } = useAuthStore();
  const router = useRouter();

  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState('');

  // New Address inline form
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: 'Home', line1: '', line2: '', city: 'Lagos', state: 'Lagos' });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  const DELIVERY_FEE = 500;
  const PLATFORM_FEE = Math.round(subtotal() * 0.02);
  const total = subtotal() + DELIVERY_FEE + PLATFORM_FEE;

  // Fetch saved customer addresses
  useEffect(() => {
    if (!token) return;
    async function fetchAddresses() {
      setLoadingAddresses(true);
      try {
        const res = await fetch(`${API_URL}/customer/addresses`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.data) {
          setAddresses(data.data);
          const defaultAddr = data.data.find((a: any) => a.isDefault) || data.data[0];
          if (defaultAddr) setSelectedAddressId(defaultAddr.id);
        }
      } catch (err) {
        console.error('Failed to fetch addresses:', err);
      } finally {
        setLoadingAddresses(false);
      }
    }
    fetchAddresses();
  }, [token]);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress.line1 || !newAddress.city) return;
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
        setNewAddress({ label: 'Home', line1: '', line2: '', city: 'Lagos', state: 'Lagos' });
      }
    } catch (err) {
      console.error('Add address error:', err);
    }
  };

  const handleProceedToCheckout = async () => {
    if (!token) {
      router.push('/login');
      return;
    }
    if (items.length === 0) return;
    if (addresses.length === 0 && !showAddressForm) {
      setShowAddressForm(true);
      setOrderError('Please provide a delivery address before proceeding.');
      return;
    }

    setPlacingOrder(true);
    setOrderError('');

    try {
      const payload = {
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
        deliveryAddressId: selectedAddressId || undefined,
        deliveryAddress: !selectedAddressId ? newAddress : undefined,
        type: 'DELIVERY'
      };

      const res = await fetch(`${API_URL}/customer/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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
        setOrderError(data.message || 'Failed to place order.');
      }
    } catch (err: any) {
      setOrderError(err.message || 'Network error during checkout.');
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; background: #f8f9fa; }
        .cart-header { background: #fff; border-bottom: 1px solid #f0f0f0; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        .cart-header-inner { max-width: 1280px; margin: 0 auto; padding: 0 1.5rem; height: 64px; display: flex; align-items: center; justify-content: space-between; }
        .cart-back { font-size: 0.88rem; color: #005b9f; font-weight: 600; text-decoration: none; }
        .cart-logo { height: 44px; object-fit: contain; cursor: pointer; }
        .cart-layout { max-width: 1060px; margin: 2rem auto; padding: 0 1.5rem; display: grid; grid-template-columns: 1fr 360px; gap: 1.5rem; }
        .cart-items { background: #fff; border-radius: 16px; border: 1px solid #f0f0f0; overflow: hidden; }
        .cart-items-header { padding: 1.25rem 1.5rem; border-bottom: 1px solid #f5f5f5; font-weight: 800; font-size: 1rem; }
        .cart-item { display: flex; gap: 1rem; padding: 1.25rem 1.5rem; border-bottom: 1px solid #f5f5f5; align-items: center; }
        .cart-item:last-child { border-bottom: none; }
        .cart-item-img { width: 64px; height: 64px; border-radius: 10px; object-fit: cover; background: #f0f0f0; flex-shrink: 0; }
        .cart-item-img-ph { width: 64px; height: 64px; border-radius: 10px; background: linear-gradient(135deg, #e0e7f0, #c7d2e5); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; flex-shrink: 0; }
        .cart-item-info { flex: 1; min-width: 0; }
        .cart-item-name { font-weight: 600; font-size: 0.92rem; margin-bottom: 0.2rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .cart-item-vendor { font-size: 0.78rem; color: #6b7280; margin-bottom: 0.5rem; }
        .cart-qty-row { display: flex; align-items: center; gap: 0.5rem; }
        .cart-qty-btn { width: 28px; height: 28px; border-radius: 6px; border: 1px solid #e5e7eb; background: #f4f6f8; cursor: pointer; font-size: 1rem; font-weight: 700; display: flex; align-items: center; justify-content: center; transition: background 0.15s; font-family: inherit; }
        .cart-qty-btn:hover { background: #e5e7eb; }
        .cart-qty { min-width: 2rem; text-align: center; font-weight: 600; font-size: 0.9rem; }
        .cart-item-price { font-weight: 800; font-size: 0.95rem; color: #005b9f; white-space: nowrap; }
        .cart-remove-btn { background: none; border: none; color: #ef4444; font-size: 0.8rem; cursor: pointer; font-family: inherit; margin-top: 0.25rem; }
        
        .address-box { background: #fff; border-radius: 16px; border: 1px solid #f0f0f0; padding: 1.25rem 1.5rem; margin-bottom: 1.5rem; }
        .address-box h3 { font-size: 0.95rem; font-weight: 800; margin-bottom: 0.75rem; color: #111827; }
        .addr-card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 0.75rem 1rem; margin-bottom: 0.5rem; cursor: pointer; display: flex; align-items: center; gap: 0.75rem; transition: border 0.15s; }
        .addr-card.selected { border-color: #005b9f; background: #f0f7ff; }
        .addr-radio { accent-color: #005b9f; }
        .addr-details { font-size: 0.85rem; color: #374151; }

        .cart-summary { background: #fff; border-radius: 16px; border: 1px solid #f0f0f0; padding: 1.5rem; height: fit-content; position: sticky; top: 80px; }
        .cart-summary h3 { font-weight: 800; margin-bottom: 1.25rem; font-size: 1rem; }
        .cart-summary-row { display: flex; justify-content: space-between; font-size: 0.88rem; margin-bottom: 0.75rem; color: #4b5563; }
        .cart-summary-row.total { font-weight: 800; font-size: 1.05rem; color: #111827; padding-top: 0.75rem; border-top: 1px solid #f0f0f0; }
        .cart-checkout-btn { width: 100%; background: #005b9f; color: #fff; border: none; border-radius: 10px; padding: 0.9rem; font-size: 1rem; font-weight: 700; cursor: pointer; margin-top: 1.25rem; transition: background 0.2s; font-family: inherit; }
        .cart-checkout-btn:disabled { background: #94a3b8; cursor: not-allowed; }
        .cart-checkout-btn:hover:not(:disabled) { background: #004a82; }
        .cart-empty { text-align: center; padding: 5rem 2rem; }
        .cart-empty-icon { font-size: 4rem; margin-bottom: 1rem; }
        .cart-empty p { font-size: 1rem; color: #9ca3af; margin-bottom: 1.5rem; }
        .cart-shop-btn { background: #005b9f; color: #fff; border: none; border-radius: 10px; padding: 0.8rem 2rem; font-size: 0.95rem; font-weight: 700; cursor: pointer; font-family: inherit; }
        @media (max-width: 800px) {
          .cart-layout { grid-template-columns: 1fr; }
          .cart-summary { position: static; }
        }
      `}</style>

      <header className="cart-header">
        <div className="cart-header-inner">
          <a href="/" className="cart-back">← Back to Marketplace</a>
          <img src="/logo.png" alt="NATION MARKET" className="cart-logo" onClick={() => router.push('/')} />
        </div>
      </header>

      <div style={{ maxWidth: '1060px', margin: '2rem auto 0', padding: '0 1.5rem' }}>
        <h1 style={{ fontFamily: 'Inter,sans-serif', fontWeight: 800, fontSize: '1.5rem', marginBottom: '1.5rem' }}>🛒 Shopping Cart</h1>
      </div>

      {items.length === 0 ? (
        <div className="cart-empty" style={{ fontFamily: 'Inter,sans-serif' }}>
          <div className="cart-empty-icon">🛒</div>
          <p>Your cart is empty. Discover products across every category.</p>
          <button className="cart-shop-btn" onClick={() => router.push('/')}>Browse Marketplace</button>
        </div>
      ) : (
        <div className="cart-layout">
          <div>
            {/* Delivery Address Selection (for authenticated users) */}
            {token && (
              <div className="address-box">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h3>📍 Delivery Address</h3>
                  <button
                    onClick={() => setShowAddressForm(!showAddressForm)}
                    style={{ background: 'none', border: 'none', color: '#005b9f', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}
                  >
                    {showAddressForm ? 'Cancel' : '+ Add Address'}
                  </button>
                </div>

                {loadingAddresses ? (
                  <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>Loading saved addresses...</p>
                ) : addresses.length > 0 ? (
                  addresses.map(addr => (
                    <div
                      key={addr.id}
                      className={`addr-card ${selectedAddressId === addr.id ? 'selected' : ''}`}
                      onClick={() => setSelectedAddressId(addr.id)}
                    >
                      <input
                        type="radio"
                        name="deliveryAddress"
                        checked={selectedAddressId === addr.id}
                        onChange={() => setSelectedAddressId(addr.id)}
                        className="addr-radio"
                      />
                      <div className="addr-details">
                        <strong>{addr.label}</strong>: {addr.line1}, {addr.city}, {addr.state}
                      </div>
                    </div>
                  ))
                ) : !showAddressForm ? (
                  <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>No saved addresses found. Please add a delivery address.</p>
                ) : null}

                {/* Inline Address Form */}
                {showAddressForm && (
                  <form onSubmit={handleAddAddress} style={{ background: '#f9fafb', padding: '1rem', borderRadius: '10px', marginTop: '0.75rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <input
                        type="text"
                        placeholder="Address Line (e.g. 12 Marina Road)"
                        value={newAddress.line1}
                        onChange={e => setNewAddress({ ...newAddress, line1: e.target.value })}
                        required
                        style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                      />
                      <input
                        type="text"
                        placeholder="City (e.g. Ikeja)"
                        value={newAddress.city}
                        onChange={e => setNewAddress({ ...newAddress, city: e.target.value })}
                        required
                        style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                      />
                    </div>
                    <button
                      type="submit"
                      style={{ background: '#005b9f', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Save & Use Address
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Cart Items */}
            <div className="cart-items">
              <div className="cart-items-header">Items in Cart ({items.length})</div>
              {items.map(item => {
                const effectivePrice = item.discount > 0 ? item.price * (1 - item.discount / 100) : item.price;
                return (
                  <div key={item.productId} className="cart-item">
                    {item.image?.includes('cloudinary.com')
                      ? <img src={item.image.replace('/upload/', '/upload/w_120,c_fill,f_auto,q_auto/')} className="cart-item-img" alt="" loading="lazy" />
                      : <div className="cart-item-img-ph">🛍️</div>
                    }
                    <div className="cart-item-info">
                      <div className="cart-item-name">{item.name}</div>
                      <div className="cart-item-vendor">from {item.vendorName}</div>
                      <div className="cart-qty-row">
                        <button className="cart-qty-btn" onClick={() => updateQty(item.productId, item.quantity - 1)}>−</button>
                        <span className="cart-qty">{item.quantity}</span>
                        <button className="cart-qty-btn" onClick={() => updateQty(item.productId, item.quantity + 1)}>+</button>
                      </div>
                      <button className="cart-remove-btn" onClick={() => removeItem(item.productId)}>Remove</button>
                    </div>
                    <div className="cart-item-price">₦{(effectivePrice * item.quantity).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="cart-summary" style={{ fontFamily: 'Inter,sans-serif' }}>
            <h3>Order Summary</h3>
            <div className="cart-summary-row"><span>Subtotal</span><span>₦{subtotal().toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>
            <div className="cart-summary-row"><span>Delivery Fee</span><span>₦{DELIVERY_FEE.toLocaleString()}</span></div>
            <div className="cart-summary-row"><span>Platform Fee (2%)</span><span>₦{PLATFORM_FEE.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>
            <div className="cart-summary-row total"><span>Total</span><span>₦{total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>

            {orderError && (
              <p style={{ color: '#ef4444', fontSize: '0.82rem', marginTop: '0.75rem', textAlign: 'center' }}>
                {orderError}
              </p>
            )}

            {!token ? (
              <>
                <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '1rem', textAlign: 'center' }}>Sign in to complete your checkout</p>
                <button className="cart-checkout-btn" onClick={() => router.push('/login')}>Sign In to Checkout</button>
              </>
            ) : (
              <button
                className="cart-checkout-btn"
                onClick={handleProceedToCheckout}
                disabled={placingOrder}
              >
                {placingOrder ? 'Processing Order...' : 'Pay with Paystack'}
              </button>
            )}

            <button
              onClick={clearCart}
              style={{ width: '100%', background: 'none', border: 'none', color: '#ef4444', fontSize: '0.82rem', marginTop: '0.75rem', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}
            >
              Clear Cart
            </button>
          </div>
        </div>
      )}
    </>
  );
}
