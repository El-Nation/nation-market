'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import {
  User, ShoppingBag, Heart, FileText, MapPin, Bell,
  Settings, LogOut, Package, Star, Plus, X, Edit2, Trash2,
  CheckCircle, Clock, XCircle, ChevronRight, Home, Briefcase
} from 'lucide-react';

type Address = { id: string; label: string; line1: string; line2?: string; city: string; state?: string; country: string; isDefault: boolean; };
type AddressForm = { id?: string; label: string; line1: string; line2: string; city: string; state: string; country: string; isDefault: boolean; };

const EMPTY_FORM: AddressForm = { label: 'Home', line1: '', line2: '', city: '', state: '', country: 'Nigeria', isDefault: false };

export default function CustomerDashboard() {
  const router = useRouter();
  const { user, token, logout, initialized, initAuth } = useAuthStore();
  const [authorized, setAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState('Profile');
  const [isMounted, setIsMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Profile / Settings state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 2FA state
  const [qrCode, setQrCode] = useState('');
  const [setupSecret, setSetupSecret] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  // Orders state
  const [orderFilter, setOrderFilter] = useState<'Ongoing' | 'Completed' | 'Cancelled'>('Ongoing');
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // Notifications state
  const [notifFilter, setNotifFilter] = useState<'All' | 'Orders' | 'Payments' | 'Delivery' | 'Account'>('All');

  // Addresses state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressForm, setAddressForm] = useState<AddressForm>(EMPTY_FORM);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  const API = (process.env.NEXT_PUBLIC_API_URL || '');
  const memberSince = user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : 'Nation Market Customer';

  // ── Auth guard
  useEffect(() => {
    setIsMounted(true);
    
    if (!initialized) {
      initAuth();
      return;
    }

    if (!token || user?.role !== 'CUSTOMER') {
      window.location.href = '/login';
    } else {
      setAuthorized(true);
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setEmail(user.email || '');
    }
  }, [token, user, initialized, initAuth]);

  // ── Fetch addresses on tab switch
  useEffect(() => {
    if (activeTab === 'Addresses' && authorized) fetchAddresses();
    if (activeTab === 'Orders' && authorized) fetchOrders();
  }, [activeTab, authorized]);

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await fetch(`${API}/api/customer/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setOrders(data.data);
    } finally { setOrdersLoading(false); }
  };

  const fetchAddresses = async () => {
    setAddressLoading(true);
    try {
      const res = await fetch(`${API}/api/customer/addresses`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setAddresses(data.data);
    } finally { setAddressLoading(false); }
  };

  // ── Logout (clears session + prevents back nav)
  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  // ── Profile update
  const handleUpdate = async (endpoint: string, payload: any, successMsg: string) => {
    try {
      const res = await fetch(`${API}/api/auth/${endpoint}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        alert(successMsg);
        if (endpoint === 'update-password') { setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }
      } else alert(data.message || 'Update failed');
    } catch { alert('Network error'); }
  };

  // ── 2FA
  const generate2FA = async () => {
    if (is2FAEnabled) { alert('2FA is already enabled.'); return; }
    const res = await fetch(`${API}/api/auth/2fa/generate`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.success) { setQrCode(data.data.qrCodeUrl); setSetupSecret(data.data.secret); }
  };
  const confirm2FA = async () => {
    const res = await fetch(`${API}/api/auth/2fa/enable`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ token: otpToken })
    });
    const data = await res.json();
    if (data.success) { alert('2FA Enabled Successfully!'); setIs2FAEnabled(true); setQrCode(''); setOtpToken(''); }
    else alert(data.message || 'Invalid code. Enter the 6-digit code from your Authenticator app.');
  };
  const disable2FA = async () => {
    if (!confirm('Disable Two-Factor Authentication? Your account will be less secure.')) return;
    const res = await fetch(`${API}/api/auth/2fa/disable`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.success) { alert(data.message); setIs2FAEnabled(false); }
  };

  // ── Address CRUD
  const openAddModal = () => { setAddressForm(EMPTY_FORM); setEditingAddressId(null); setShowAddressModal(true); };
  const openEditModal = (addr: Address) => {
    setAddressForm({ id: addr.id, label: addr.label, line1: addr.line1, line2: addr.line2 || '', city: addr.city, state: addr.state || '', country: addr.country, isDefault: addr.isDefault });
    setEditingAddressId(addr.id);
    setShowAddressModal(true);
  };
  const saveAddress = async () => {
    if (!addressForm.line1 || !addressForm.city) { alert('Address line and city are required.'); return; }
    const method = editingAddressId ? 'PUT' : 'POST';
    const url = editingAddressId ? `${API}/api/customer/addresses/${editingAddressId}` : `${API}/api/customer/addresses`;
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(addressForm) });
    const data = await res.json();
    if (data.success) { setShowAddressModal(false); fetchAddresses(); }
    else alert(data.message || 'Failed to save address');
  };
  const deleteAddress = async (id: string) => {
    if (!confirm('Delete this address?')) return;
    const res = await fetch(`${API}/api/customer/addresses/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.success) fetchAddresses();
  };
  const setDefaultAddress = async (addr: Address) => {
    await fetch(`${API}/api/customer/addresses/${addr.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...addr, isDefault: true })
    });
    fetchAddresses();
  };

  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'C';

  const navItems = [
    { id: 'Profile', icon: User, label: 'My Profile' },
    { id: 'Orders', icon: ShoppingBag, label: 'Orders' },
    { id: 'Saved', icon: Heart, label: 'Saved Items' },
    { id: 'Receipts', icon: FileText, label: 'Receipts' },
    { id: 'Addresses', icon: MapPin, label: 'Saved Addresses' },
    { id: 'Notifications', icon: Bell, label: 'Notifications' },
    { id: 'Settings', icon: Settings, label: 'Account Settings' },
  ];

  if (!isMounted || !authorized) return null;

  return (
    <div className="layout-app">
      {/* Mobile Header */}
      <div className="mobile-header">
        <button className="hamburger" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          <span /><span /><span />
        </button>
        <img src="/logo.png" alt="Nation Market" className="mobile-logo" />
        <div className="mobile-avatar" onClick={() => setActiveTab('Profile')}>{initials}</div>
      </div>

      {/* Sidebar Overlay on Mobile */}
      {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />}

      {/* Sidebar */}
      <nav className={`side-nav ${isSidebarOpen ? 'open' : ''}`}>
        <div className="nav-header">
          <img src="/logo.png" alt="Nation Market" className="dashboard-logo" />
          <span className="portal-badge">CUSTOMER</span>
        </div>
        <div className="nav-user-card">
          <div className="nav-avatar">{initials}</div>
          <div className="nav-user-info">
            <span className="nav-user-name">{firstName} {lastName}</span>
            <span className="nav-user-email">{email}</span>
          </div>
        </div>
        <div className="scrollable-menu">
          {navItems.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              className={`nav-item ${activeTab === id ? 'active' : ''}`}
              onClick={() => { setActiveTab(id); setIsSidebarOpen(false); }}
            >
              <Icon size={20} />
              {label}
            </button>
          ))}
        </div>
        <div className="nav-footer">
          <button className="nav-item secondary-link" onClick={() => router.push('/')}>
            <ChevronRight size={20} /> Marketplace
          </button>
          <button className="logout-button" onClick={handleLogout}>
            <LogOut size={20} /> Sign Out
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-zone">

        {/* ── MY PROFILE ── */}
        {activeTab === 'Profile' && (
          <div className="tab-pane fade-in">
            <div className="page-header"><h2>My Profile</h2><p className="subtitle">Your public and personal details.</p></div>
            <div className="profile-hero">
              <div className="profile-avatar-lg">{initials}</div>
              <div className="profile-info">
                <h1 className="profile-fullname">{firstName} {lastName}</h1>
                <p className="profile-email-text">{email}</p>
                {phone && <p className="profile-phone-text">{phone}</p>}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                  <span className="role-badge">Customer Account</span>
                  <span className="member-badge">Member since {memberSince}</span>
                </div>
              </div>
              <button className="outline-btn" onClick={() => setActiveTab('Settings')}>
                <Edit2 size={15} /> Edit Profile
              </button>
            </div>

            <div className="metrics-grid">
              {[
                { icon: ShoppingBag, label: 'Total Orders', val: orders.length.toString(), color: 'blue', tab: 'Orders' },
                { icon: Package, label: 'Active Deliveries', val: orders.filter((o: any) => o.status === 'IN_TRANSIT').length.toString(), color: 'green', tab: 'Orders' },
                { icon: Heart, label: 'Saved Items', val: '0', color: 'rose', tab: 'Saved Items' },
                { icon: FileText, label: 'Receipts', val: Array.from(new Set(orders.map((o: any) => o.parentOrder?.payment?.reference).filter(Boolean))).length.toString(), color: 'amber', tab: 'Receipts' },
              ].map(({ icon: Icon, label, val, color, tab }) => (
                <div key={label} className="metric-card" style={{ cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }} onClick={() => setActiveTab(tab)} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  <div className={`metric-icon ic-${color}`}><Icon size={22} /></div>
                  <div><p className="metric-label">{label}</p><p className="metric-val">{val}</p></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ORDERS ── */}
        {activeTab === 'Orders' && (
          <div className="tab-pane fade-in">
            <div className="page-header"><h2>My Orders</h2><p className="subtitle">Track, manage and reorder your purchases.</p></div>
            <div className="chip-row">
              {(['Ongoing', 'Completed', 'Cancelled'] as const).map(f => (
                <button key={f} className={`chip ${orderFilter === f ? 'active' : ''}`} onClick={() => setOrderFilter(f)}>
                  {f === 'Ongoing' && <Clock size={14} />}
                  {f === 'Completed' && <CheckCircle size={14} />}
                  {f === 'Cancelled' && <XCircle size={14} />}
                  {f}
                </button>
              ))}
            </div>

            {ordersLoading && <div className="loading-text">Loading your orders...</div>}

            {!ordersLoading && (() => {
              const filtered = orders.filter(o => {
                if (orderFilter === 'Ongoing') return ['PENDING', 'PAID', 'ACCEPTED', 'IN_TRANSIT'].includes(o.status);
                if (orderFilter === 'Completed') return o.status === 'DELIVERED';
                return o.status === 'CANCELLED';
              });

              if (filtered.length === 0) return (
                <div className="empty-state">
                  <ShoppingBag size={52} className="empty-icon" />
                  <h3>No {orderFilter.toLowerCase()} orders</h3>
                  <p>{orderFilter === 'Ongoing' ? 'You have no active orders right now.' : orderFilter === 'Completed' ? 'Your completed orders will appear here.' : 'No cancelled orders on record.'}</p>
                  {orderFilter === 'Ongoing' && <button className="primary-btn mt-2" onClick={() => router.push('/')}><ShoppingBag size={16} /> Start Shopping</button>}
                </div>
              );

              const timelineStages = [
                { key: 'PENDING', label: 'Order Placed', icon: '📋' },
                { key: 'ACCEPTED', label: 'Preparing', icon: '👨‍🍳' },
                { key: 'IN_TRANSIT', label: 'Dispatched', icon: '🛵' },
                { key: 'DELIVERED', label: 'Delivered', icon: '✅' },
              ];
              const statusOrder = ['PENDING', 'ACCEPTED', 'IN_TRANSIT', 'DELIVERED'];

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {filtered.map(order => {
                    const currentStageIdx = statusOrder.indexOf(order.status);
                    const isExpanded = expandedOrder === order.id;
                    const deliveryAddr = (() => { try { return JSON.parse(order.deliveryAddress || '{}'); } catch { return {}; } })();
                    const sc: Record<string, { bg: string; color: string }> = {
                      PENDING:    { bg: '#fef3c7', color: '#92400e' },
                      ACCEPTED:   { bg: '#dbeafe', color: '#1e40af' },
                      IN_TRANSIT: { bg: '#ede9fe', color: '#5b21b6' },
                      DELIVERED:  { bg: '#dcfce7', color: '#15803d' },
                      CANCELLED:  { bg: '#fee2e2', color: '#991b1b' },
                    };
                    const badge = sc[order.status] || { bg: '#f3f4f6', color: '#374151' };

                    return (
                      <div key={order.id} style={{ background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        {/* Order Header */}
                        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', cursor: 'pointer', borderBottom: isExpanded ? '1px solid #f3f4f6' : 'none' }} onClick={() => setExpandedOrder(isExpanded ? null : order.id)}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                              <strong style={{ color: '#111827', fontSize: '1rem' }}>{order.vendor?.storeName}</strong>
                              <span style={{ padding: '0.2rem 0.65rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700, background: badge.bg, color: badge.color }}>
                                {order.status === 'IN_TRANSIT' ? 'In Transit' : order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                              </span>
                            </div>
                            <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>{order.items?.length} item(s) · ₦{order.total?.toLocaleString()} · {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </div>
                          <ChevronRight size={18} style={{ color: '#9ca3af', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }} />
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                            {/* Progress Timeline (not shown for CANCELLED) */}
                            {order.status !== 'CANCELLED' && (
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0' }}>
                                {timelineStages.map((stage, i) => {
                                  const done = i <= currentStageIdx;
                                  const active = i === currentStageIdx;
                                  return (
                                    <div key={stage.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                                      {/* Connector line */}
                                      {i < timelineStages.length - 1 && (
                                        <div style={{ position: 'absolute', top: '18px', left: '50%', width: '100%', height: '3px', background: i < currentStageIdx ? '#16a34a' : '#e5e7eb', zIndex: 0 }} />
                                      )}
                                      {/* Stage dot */}
                                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: active ? '#16a34a' : done ? '#dcfce7' : '#f3f4f6', border: `3px solid ${active ? '#16a34a' : done ? '#16a34a' : '#e5e7eb'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', zIndex: 1, transition: 'all 0.3s' }}>
                                        {stage.icon}
                                      </div>
                                      <span style={{ fontSize: '0.72rem', fontWeight: active ? 700 : 500, color: active ? '#16a34a' : done ? '#374151' : '#9ca3af', marginTop: '0.4rem', textAlign: 'center', lineHeight: 1.2 }}>{stage.label}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Items List */}
                            <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                              <strong style={{ fontSize: '0.85rem', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '0.25rem' }}>Order Items</strong>
                              {order.items?.map((item: any) => (
                                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    {item.product?.images ? (
                                      <img src={item.product?.images.split(',')[0].includes('cloudinary') ? item.product?.images.split(',')[0].replace('/upload/', '/upload/w_60,h_60,c_fill,q_auto/') : item.product?.images.split(',')[0]} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px', background: '#e5e7eb' }} alt="" />
                                    ) : (
                                      <div style={{ width: '40px', height: '40px', borderRadius: '6px', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>📦</div>
                                    )}
                                    <span style={{ color: '#374151' }}>{item.product?.name} × {item.quantity}</span>
                                  </div>
                                  <span style={{ fontWeight: 600, color: '#111827' }}>₦{(item.price * item.quantity).toLocaleString()}</span>
                                </div>
                              ))}
                            </div>

                            {/* Price Breakdown */}
                            <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.88rem', color: '#6b7280' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal</span><span>₦{order.subtotal?.toLocaleString()}</span></div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Delivery Fee</span><span>₦{order.deliveryFee?.toLocaleString()}</span></div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Platform Fee</span><span>₦{order.platformFee?.toLocaleString()}</span></div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#111827', fontSize: '0.95rem', marginTop: '0.25rem' }}><span>Total</span><span>₦{order.total?.toLocaleString()}</span></div>
                            </div>

                            {/* Delivery Address & Rider */}
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                              {deliveryAddr?.line1 && (
                                <div style={{ flex: 1, minWidth: '200px', background: '#f0fdf4', borderRadius: '10px', padding: '0.85rem 1rem' }}>
                                  <p style={{ margin: '0 0 0.3rem', fontWeight: 700, fontSize: '0.8rem', color: '#15803d', textTransform: 'uppercase' }}>📍 Delivery To</p>
                                  <p style={{ margin: 0, fontSize: '0.88rem', color: '#374151' }}>{deliveryAddr.line1}{deliveryAddr.line2 ? `, ${deliveryAddr.line2}` : ''}, {deliveryAddr.city}</p>
                                </div>
                              )}
                              {order.rider && (
                                <div style={{ flex: 1, minWidth: '200px', background: '#faf5ff', borderRadius: '10px', padding: '0.85rem 1rem' }}>
                                  <p style={{ margin: '0 0 0.3rem', fontWeight: 700, fontSize: '0.8rem', color: '#7c3aed', textTransform: 'uppercase' }}>🛵 Your Rider</p>
                                  <p style={{ margin: 0, fontSize: '0.88rem', color: '#374151' }}>{order.rider.vehicleType}</p>
                                </div>
                              )}
                            </div>

                            {/* Payment Reference */}
                            {order.payment?.reference && (
                              <p style={{ margin: 0, fontSize: '0.78rem', color: '#9ca3af', padding: '0.5rem 0.75rem', background: '#f9fafb', borderRadius: '6px', fontFamily: 'monospace' }}>
                                Ref: {order.payment.reference}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* ── SAVED ITEMS ── */}
        {activeTab === 'Saved' && (
          <div className="tab-pane fade-in">
            <div className="page-header"><h2>Saved Items</h2><p className="subtitle">Products you've saved for later.</p></div>
            <div className="empty-state">
              <Heart size={52} className="empty-icon" />
              <h3>Your wishlist is empty</h3>
              <p>Browse the marketplace and tap the heart icon to save items you love.</p>
              <button className="primary-btn mt-2" onClick={() => router.push('/')}>
                <ShoppingBag size={16} /> Browse Marketplace
              </button>
            </div>
          </div>
        )}

        {/* ── RECEIPTS ── */}
        {activeTab === 'Receipts' && (
          <div className="tab-pane fade-in">
            <div className="page-header"><h2>Receipts</h2><p className="subtitle">View and download your digital payment receipts.</p></div>
            {(() => {
              const uniqueReceipts = Array.from(new Map(
                orders.filter((o: any) => o.parentOrder?.payment && o.status !== 'CANCELLED').map((o: any) => [o.parentOrder.payment.reference, o.parentOrder.payment])
              ).values());
              
              if (uniqueReceipts.length === 0) return (
                <div className="empty-state">
                  <FileText size={52} className="empty-icon" />
                  <h3>No receipts yet</h3>
                  <p>Your payment receipts will appear here once you complete a purchase.</p>
                </div>
              );

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {uniqueReceipts.map((payment: any) => (
                    <div key={payment.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                      <div>
                        <h4 style={{ margin: '0 0 0.35rem', color: '#111827', fontSize: '1.05rem', fontWeight: 800 }}>Digital Receipt</h4>
                        <p style={{ margin: '0 0 0.25rem', fontSize: '0.82rem', color: '#6b7280', fontFamily: 'monospace' }}>Ref: {payment.reference}</p>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>
                          {new Date(payment.createdAt).toLocaleDateString()} · <span style={{ color: payment.status === 'SUCCESS' ? '#059669' : '#d97706', fontWeight: 700, padding: '0.1rem 0.5rem', background: payment.status === 'SUCCESS' ? '#ecfdf5' : '#fffbeb', borderRadius: '4px' }}>{payment.status}</span>
                        </p>
                      </div>
                      <button onClick={() => window.open(`/receipt/${payment.reference}`, '_blank')} style={{ background: '#075985', color: '#fff', border: 'none', padding: '0.65rem 1.25rem', fontSize: '0.85rem', fontWeight: 700, borderRadius: '8px', cursor: 'pointer' }}>View Receipt →</button>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* ── SAVED ADDRESSES ── */}
        {activeTab === 'Addresses' && (
          <div className="tab-pane fade-in">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div><h2>Saved Addresses</h2><p className="subtitle">These will auto-fill at checkout.</p></div>
              <button className="primary-btn" onClick={openAddModal}><Plus size={16} /> Add Address</button>
            </div>

            {addressLoading && <div className="loading-text">Loading addresses...</div>}

            {!addressLoading && addresses.length === 0 && (
              <div className="empty-state">
                <MapPin size={52} className="empty-icon" />
                <h3>No saved addresses</h3>
                <p>Add a delivery address to speed up checkout.</p>
                <button className="primary-btn mt-2" onClick={openAddModal}><Plus size={16} /> Add Your First Address</button>
              </div>
            )}

            {!addressLoading && addresses.length > 0 && (
              <div className="address-grid">
                {addresses.map(addr => (
                  <div key={addr.id} className={`address-card ${addr.isDefault ? 'default' : ''}`}>
                    <div className="address-card-header">
                      <div className="address-label-row">
                        {addr.label === 'Home' ? <Home size={16} /> : addr.label === 'Work' ? <Briefcase size={16} /> : <MapPin size={16} />}
                        <span className="address-label">{addr.label}</span>
                        {addr.isDefault && <span className="default-badge">Default</span>}
                      </div>
                      <div className="address-actions">
                        <button className="icon-btn" title="Edit" onClick={() => openEditModal(addr)}><Edit2 size={15} /></button>
                        <button className="icon-btn danger" title="Delete" onClick={() => deleteAddress(addr.id)}><Trash2 size={15} /></button>
                      </div>
                    </div>
                    <p className="address-line">{addr.line1}</p>
                    {addr.line2 && <p className="address-line">{addr.line2}</p>}
                    <p className="address-line">{addr.city}{addr.state ? `, ${addr.state}` : ''}</p>
                    <p className="address-line">{addr.country}</p>
                    {!addr.isDefault && (
                      <button className="set-default-btn" onClick={() => setDefaultAddress(addr)}>Set as Default</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── NOTIFICATIONS ── */}
        {activeTab === 'Notifications' && (
          <div className="tab-pane fade-in">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div><h2>Notifications</h2><p className="subtitle">Stay updated on your orders, account, and offers.</p></div>
              <button className="outline-btn">Mark All as Read</button>
            </div>
            <div className="notif-tabs">
              {([
                { id: 'All',      icon: Bell,          label: 'All' },
                { id: 'Orders',   icon: ShoppingBag,   label: 'Orders' },
                { id: 'Payments', icon: FileText,       label: 'Payments' },
                { id: 'Delivery', icon: Package,        label: 'Delivery' },
                { id: 'Account',  icon: User,           label: 'Account' },
              ] as const).map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  className={`chip ${notifFilter === id ? 'active' : ''}`}
                  onClick={() => setNotifFilter(id)}
                >
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>

            {notifFilter === 'All' && (
              <div className="empty-state">
                <Bell size={52} className="empty-icon" />
                <h3>No notifications yet</h3>
                <p>Order updates, payments, deliveries, and account alerts will all appear here.</p>
              </div>
            )}
            {notifFilter === 'Orders' && (
              <div className="empty-state">
                <ShoppingBag size={52} className="empty-icon" />
                <h3>No order notifications</h3>
                <p>You'll be notified here when an order is placed, confirmed, or ready for pickup.</p>
                <button className="primary-btn mt-2" onClick={() => setActiveTab('Orders')}>
                  <ShoppingBag size={15} /> View My Orders
                </button>
              </div>
            )}
            {notifFilter === 'Payments' && (
              <div className="empty-state">
                <FileText size={52} className="empty-icon" />
                <h3>No payment notifications</h3>
                <p>Payment confirmations, refunds, and billing alerts will appear here.</p>
                <button className="primary-btn mt-2" onClick={() => setActiveTab('Receipts')}>
                  <FileText size={15} /> View Receipts
                </button>
              </div>
            )}
            {notifFilter === 'Delivery' && (
              <div className="empty-state">
                <Package size={52} className="empty-icon" />
                <h3>No delivery notifications</h3>
                <p>Real-time delivery tracking updates and rider alerts will appear here.</p>
                <button className="primary-btn mt-2" onClick={() => setActiveTab('Orders')}>
                  <Package size={15} /> Track Orders
                </button>
              </div>
            )}
            {notifFilter === 'Account' && (
              <div className="empty-state">
                <User size={52} className="empty-icon" />
                <h3>No account notifications</h3>
                <p>Login alerts, password changes, and 2FA activity will be reported here.</p>
                <button className="primary-btn mt-2" onClick={() => setActiveTab('Settings')}>
                  <Settings size={15} /> Account Settings
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── ACCOUNT SETTINGS ── */}
        {activeTab === 'Settings' && (
          <div className="tab-pane fade-in">
            <div className="page-header"><h2>Account Settings</h2><p className="subtitle">Manage your credentials, contact details, and security.</p></div>
            <div className="settings-grid">

              <div className="settings-box">
                <h4>Personal Details</h4>
                <div className="form-group"><label>First Name</label><input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} /></div>
                <div className="form-group"><label>Last Name</label><input type="text" value={lastName} onChange={e => setLastName(e.target.value)} /></div>
                <button className="outline-btn w-full mt-1" onClick={() => handleUpdate('update-details', { firstName, lastName }, 'Name updated!')}>Save Details</button>
              </div>

              <div className="settings-box">
                <h4>Contact Info</h4>
                <div className="form-group"><label>Email Address</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
                <div className="form-group"><label>Phone Number</label><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+234 800 000 0000" /></div>
                <button className="outline-btn w-full mt-1" onClick={() => handleUpdate('update-contact', { email, phone }, 'Contact info updated!')}>Update Contact</button>
              </div>

              <div className="settings-box">
                <h4>Change Password</h4>
                <div className="form-group"><label>Current Password</label><input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="••••••••" /></div>
                <div className="form-group"><label>New Password</label><input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" /></div>
                <div className="form-group"><label>Confirm New Password</label><input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" /></div>
                <button className="outline-btn w-full mt-1" onClick={() => {
                  if (newPassword !== confirmPassword) { alert('Passwords do not match.'); return; }
                  if (newPassword.length < 6) { alert('New password must be at least 6 characters.'); return; }
                  handleUpdate('update-password', { currentPassword, newPassword }, 'Password changed securely!');
                }}>Update Password</button>
              </div>

              <div className="settings-box">
                <h4>Two-Factor Authentication (2FA)</h4>
                <p className="form-hint">Add an extra layer of security requiring a confirmation code on login.</p>
                {!qrCode && !is2FAEnabled && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem' }}>
                    <label className="toggle-switch">
                      <input type="checkbox" onChange={generate2FA} checked={false} />
                      <span className="slider" />
                    </label>
                    <span style={{ fontWeight: 600, color: '#6b7280' }}>Disabled</span>
                  </div>
                )}
                {is2FAEnabled && (
                  <div className="security-alert active">
                    <span>2FA is Active 🛡️</span>
                    <button onClick={disable2FA} className="disable-btn">Disable</button>
                  </div>
                )}
                {qrCode && (
                  <div className="qr-container">
                    <p className="qr-label">Scan in Google Authenticator</p>
                    <img src={qrCode} alt="2FA QR" className="qr-img" />
                    <p className="qr-hint">OR ENTER MANUAL KEY:</p>
                    <code className="manual-key">{setupSecret}</code>
                    <input
                      type="text" value={otpToken} onChange={e => setOtpToken(e.target.value)}
                      placeholder="Enter 6-digit code" maxLength={6}
                      className="otp-input"
                    />
                    <button className="outline-btn w-full" onClick={confirm2FA}>Verify &amp; Enable</button>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}
      </main>

      {/* ── ADDRESS MODAL ── */}
      {showAddressModal && (
        <div className="modal-overlay" onClick={() => setShowAddressModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingAddressId ? 'Edit Address' : 'Add New Address'}</h3>
              <button className="modal-close" onClick={() => setShowAddressModal(false)}><X size={22} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Label</label>
                <div className="label-selector">
                  {['Home', 'Work', 'Other'].map(l => (
                    <button key={l} className={`label-btn ${addressForm.label === l ? 'active' : ''}`} onClick={() => setAddressForm(f => ({ ...f, label: l }))}>
                      {l === 'Home' ? <Home size={14} /> : l === 'Work' ? <Briefcase size={14} /> : <MapPin size={14} />} {l}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group"><label>Address Line 1 *</label><input type="text" value={addressForm.line1} onChange={e => setAddressForm(f => ({ ...f, line1: e.target.value }))} placeholder="Street number & name" /></div>
              <div className="form-group"><label>Address Line 2</label><input type="text" value={addressForm.line2} onChange={e => setAddressForm(f => ({ ...f, line2: e.target.value }))} placeholder="Apartment, suite, landmark (optional)" /></div>
              <div className="form-row">
                <div className="form-group"><label>City *</label><input type="text" value={addressForm.city} onChange={e => setAddressForm(f => ({ ...f, city: e.target.value }))} placeholder="e.g. Lagos" /></div>
                <div className="form-group"><label>State</label><input type="text" value={addressForm.state} onChange={e => setAddressForm(f => ({ ...f, state: e.target.value }))} placeholder="e.g. Lagos State" /></div>
              </div>
              <div className="form-group"><label>Country</label><input type="text" value={addressForm.country} onChange={e => setAddressForm(f => ({ ...f, country: e.target.value }))} /></div>
              <label className="checkbox-row">
                <input type="checkbox" checked={addressForm.isDefault} onChange={e => setAddressForm(f => ({ ...f, isDefault: e.target.checked }))} />
                Set as default delivery address
              </label>
            </div>
            <div className="modal-footer">
              <button className="outline-btn" onClick={() => setShowAddressModal(false)}>Cancel</button>
              <button className="primary-btn" onClick={saveAddress}>{editingAddressId ? 'Save Changes' : 'Add Address'}</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        *, *::before, *::after { box-sizing: border-box; }

        .layout-app { display: flex; min-height: 100vh; background: #f5f7fa; font-family: -apple-system, 'Segoe UI', sans-serif; }

        /* ── Side Nav ── */
        .side-nav { width: 270px; min-width: 270px; background: #fff; border-right: 1px solid #e5e7eb; display: flex; flex-direction: column; position: sticky; top: 0; height: 100vh; overflow-y: auto; z-index: 50; transition: transform 0.3s ease; }
        .nav-header { padding: 1.25rem 1.5rem; border-bottom: 1px solid #e5e7eb; display: flex; flex-direction: column; align-items: center; gap: 0.4rem; }
        .dashboard-logo { height: 80px; object-fit: contain; margin: -18px 0; }
        .portal-badge { background: #0284c7; color: #fff; padding: 0.2rem 0.75rem; border-radius: 4px; font-size: 0.7rem; font-weight: 800; letter-spacing: 1px; }
        .nav-user-card { display: flex; align-items: center; gap: 0.75rem; padding: 1rem 1.25rem; border-bottom: 1px solid #f3f4f6; }
        .nav-avatar { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #0284c7, #0ea5e9); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.9rem; flex-shrink: 0; }
        .nav-user-info { overflow: hidden; }
        .nav-user-name { display: block; font-weight: 700; font-size: 0.9rem; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .nav-user-email { display: block; font-size: 0.78rem; color: #9ca3af; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .scrollable-menu { flex: 1; padding: 1rem; display: flex; flex-direction: column; gap: 0.25rem; overflow-y: auto; }
        .nav-item { display: flex; align-items: center; gap: 0.85rem; padding: 0.75rem 1rem; color: #4b5563; border-radius: 10px; font-weight: 600; font-size: 0.9rem; border: none; background: transparent; cursor: pointer; width: 100%; text-align: left; transition: all 0.2s; font-family: inherit; }
        .nav-item:hover { background: #f3f4f6; color: #111827; }
        .nav-item.active { background: #eff6ff; color: #0284c7; }
        .nav-item.secondary-link { color: #9ca3af; font-size: 0.85rem; }
        .nav-footer { padding: 1rem; border-top: 1px solid #e5e7eb; display: flex; flex-direction: column; gap: 0.5rem; }
        .logout-button { display: flex; align-items: center; justify-content: center; gap: 0.75rem; width: 100%; border: 1px solid #fecaca; background: #fef2f2; color: #dc2626; padding: 0.8rem; border-radius: 10px; font-weight: 700; cursor: pointer; transition: all 0.2s; font-size: 0.9rem; }
        .logout-button:hover { background: #fee2e2; }

        /* ── Mobile Header ── */
        .mobile-header { display: none; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; background: #fff; border-bottom: 1px solid #e5e7eb; position: sticky; top: 0; z-index: 60; }
        .hamburger { background: none; border: none; cursor: pointer; display: flex; flex-direction: column; gap: 4px; padding: 4px; }
        .hamburger span { display: block; width: 22px; height: 2px; background: #374151; border-radius: 2px; }
        .mobile-logo { height: 44px; object-fit: contain; }
        .mobile-avatar { width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, #0284c7, #0ea5e9); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.8rem; cursor: pointer; }
        .sidebar-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 45; }

        /* ── Main Zone ── */
        .main-zone { flex: 1; padding: 2.5rem 3rem; overflow-x: hidden; max-width: 1100px; min-width: 0; box-sizing: border-box; }
        .tab-pane { }
        .fade-in { animation: fadeIn 0.3s ease; }
        .page-header { margin-bottom: 2rem; }
        .page-header h2 { font-size: 1.9rem; font-weight: 800; color: #111827; margin: 0 0 0.25rem 0; letter-spacing: -0.5px; }
        .subtitle { color: #6b7280; font-size: 0.95rem; margin: 0; }

        /* ── Profile Hero ── */
        .profile-hero { background: #fff; border-radius: 16px; border: 1px solid #e5e7eb; padding: 2rem; display: flex; align-items: center; gap: 2rem; margin-bottom: 2rem; box-shadow: 0 1px 4px rgba(0,0,0,0.04); flex-wrap: wrap; }
        .profile-avatar-lg { width: 100px; height: 100px; border-radius: 50%; background: linear-gradient(135deg, #0284c7, #0ea5e9); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 2.2rem; font-weight: 800; flex-shrink: 0; }
        .profile-info { flex: 1; min-width: 200px; }
        .profile-fullname { font-size: 1.7rem; font-weight: 800; color: #111827; margin: 0 0 0.3rem 0; }
        .profile-email-text { color: #6b7280; margin: 0 0 0.15rem 0; font-size: 0.95rem; }
        .profile-phone-text { color: #6b7280; margin: 0; font-size: 0.95rem; }
        .role-badge { background: #dbeafe; color: #1d4ed8; padding: 0.2rem 0.7rem; border-radius: 12px; font-size: 0.75rem; font-weight: 700; }
        .member-badge { background: #f0fdf4; color: #15803d; padding: 0.2rem 0.7rem; border-radius: 12px; font-size: 0.75rem; font-weight: 700; }

        /* ── Metrics ── */
        .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.25rem; }
        .metric-card { background: #fff; padding: 1.5rem; border-radius: 14px; border: 1px solid #e5e7eb; display: flex; align-items: center; gap: 1rem; box-shadow: 0 1px 4px rgba(0,0,0,0.03); }
        .metric-icon { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .ic-blue { background: #dbeafe; color: #2563eb; }
        .ic-green { background: #dcfce7; color: #16a34a; }
        .ic-rose { background: #ffe4e6; color: #e11d48; }
        .ic-amber { background: #fef9c3; color: #ca8a04; }
        .metric-label { font-size: 0.82rem; color: #6b7280; font-weight: 600; margin: 0 0 0.2rem 0; }
        .metric-val { font-size: 1.8rem; font-weight: 800; color: #111827; margin: 0; line-height: 1; }

        /* ── Chips ── */
        .chip-row, .notif-tabs { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
        .chip { display: flex; align-items: center; gap: 0.4rem; padding: 0.45rem 1rem; border: 1px solid #d1d5db; border-radius: 20px; font-size: 0.85rem; font-weight: 600; color: #4b5563; background: #fff; cursor: pointer; transition: 0.15s; }
        .chip:hover { border-color: #0284c7; }
        .chip.active { background: #0284c7; color: #fff; border-color: #0284c7; }

        /* ── Empty State ── */
        .empty-state { padding: 4rem 2rem; text-align: center; background: #fff; border-radius: 14px; border: 1px dashed #d1d5db; }
        .empty-icon { color: #d1d5db; margin: 0 auto 1.25rem auto; display: block; }
        .empty-state h3 { font-size: 1.2rem; font-weight: 700; color: #374151; margin: 0 0 0.5rem 0; }
        .empty-state p { color: #6b7280; font-size: 0.95rem; margin: 0; }

        /* ── Address Cards ── */
        .address-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.25rem; }
        .address-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; padding: 1.25rem; box-shadow: 0 1px 4px rgba(0,0,0,0.03); }
        .address-card.default { border-color: #0284c7; box-shadow: 0 0 0 3px rgba(2,132,199,0.1); }
        .address-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
        .address-label-row { display: flex; align-items: center; gap: 0.5rem; color: #374151; }
        .address-label { font-weight: 700; font-size: 0.95rem; }
        .default-badge { background: #dbeafe; color: #0284c7; font-size: 0.7rem; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: 8px; }
        .address-actions { display: flex; gap: 0.5rem; }
        .icon-btn { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 0.35rem; cursor: pointer; display: flex; color: #4b5563; transition: 0.15s; }
        .icon-btn:hover { background: #f3f4f6; }
        .icon-btn.danger:hover { background: #fef2f2; color: #dc2626; border-color: #fecaca; }
        .address-line { color: #4b5563; font-size: 0.9rem; margin: 0 0 0.15rem 0; }
        .set-default-btn { margin-top: 0.75rem; width: 100%; text-align: center; font-size: 0.82rem; font-weight: 600; color: #0284c7; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 0.4rem; cursor: pointer; transition: 0.15s; }
        .set-default-btn:hover { background: #dbeafe; }
        .loading-text { text-align: center; color: #6b7280; padding: 2rem; font-weight: 500; }

        /* ── Settings ── */
        .settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        .settings-box { background: #fff; padding: 1.75rem; border-radius: 14px; border: 1px solid #e5e7eb; box-shadow: 0 1px 4px rgba(0,0,0,0.03); }
        .settings-box h4 { margin: 0 0 1.25rem 0; font-size: 1rem; font-weight: 700; color: #111827; border-bottom: 2px solid #f3f4f6; padding-bottom: 0.75rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.35rem; margin-bottom: 0.85rem; }
        .form-group label { font-size: 0.78rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
        .form-group input { padding: 0.75rem 1rem; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.95rem; outline: none; font-family: inherit; color: #111827; transition: border-color 0.15s; }
        .form-group input:focus { border-color: #0284c7; box-shadow: 0 0 0 3px rgba(2,132,199,0.1); }
        .form-hint { font-size: 0.88rem; color: #6b7280; margin: 0 0 0.5rem 0; }

        /* ── Buttons ── */
        .primary-btn { display: inline-flex; align-items: center; gap: 0.5rem; background: #0284c7; color: #fff; border: none; padding: 0.7rem 1.25rem; border-radius: 8px; font-weight: 700; cursor: pointer; transition: 0.2s; font-size: 0.9rem; font-family: inherit; }
        .primary-btn:hover { background: #0369a1; }
        .outline-btn { display: inline-flex; align-items: center; gap: 0.5rem; background: #fff; border: 1.5px solid #0284c7; color: #0284c7; font-weight: 700; padding: 0.65rem 1.25rem; border-radius: 8px; cursor: pointer; transition: 0.2s; font-size: 0.9rem; font-family: inherit; }
        .outline-btn:hover { background: #eff6ff; }
        .w-full { width: 100%; justify-content: center; }
        .mt-1 { margin-top: 0.5rem; }
        .mt-2 { margin-top: 1rem; }

        /* ── 2FA ── */
        .toggle-switch { position: relative; display: inline-block; width: 44px; height: 24px; cursor: pointer; }
        .toggle-switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: #d1d5db; border-radius: 24px; transition: .3s; }
        .slider:before { position: absolute; content: ''; height: 18px; width: 18px; left: 3px; bottom: 3px; background: white; border-radius: 50%; transition: .3s; }
        input:checked + .slider { background: #16a34a; }
        input:checked + .slider:before { transform: translateX(20px); }
        .security-alert { padding: 0.75rem 1rem; border-radius: 8px; font-weight: 700; display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; }
        .security-alert.active { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
        .disable-btn { background: transparent; border: none; color: #ef4444; font-weight: 600; text-decoration: underline; cursor: pointer; }
        .qr-container { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; margin-top: 1rem; }
        .qr-label { font-weight: 700; font-size: 0.9rem; color: #374151; margin: 0; }
        .qr-img { width: 170px; height: 170px; border-radius: 8px; border: 1px solid #e5e7eb; padding: 4px; background: #fff; }
        .qr-hint { font-size: 0.78rem; font-weight: 700; color: #9ca3af; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; }
        .manual-key { display: block; background: #f3f4f6; padding: 0.5rem 1rem; border-radius: 6px; font-size: 0.85rem; color: #f59e0b; font-weight: 700; word-break: break-all; text-align: center; width: 100%; }
        .otp-input { width: 100%; text-align: center; letter-spacing: 0.3em; font-size: 1.3rem; padding: 0.75rem; border: 1.5px solid #d1d5db; border-radius: 8px; outline: none; font-family: monospace; }
        .otp-input:focus { border-color: #0284c7; }

        /* ── Address Modal ── */
        .modal-overlay { position: fixed; inset: 0; background: rgba(17,24,39,0.65); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 1rem; }
        .modal-box { background: #fff; border-radius: 18px; width: 100%; max-width: 520px; box-shadow: 0 25px 50px rgba(0,0,0,0.2); overflow: hidden; max-height: 90vh; overflow-y: auto; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem 1.75rem; border-bottom: 1px solid #f3f4f6; }
        .modal-header h3 { font-size: 1.15rem; font-weight: 800; color: #111827; margin: 0; }
        .modal-close { background: #f3f4f6; border: none; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #6b7280; transition: 0.2s; }
        .modal-close:hover { background: #e5e7eb; }
        .modal-body { padding: 1.5rem 1.75rem; display: flex; flex-direction: column; gap: 0.5rem; }
        .modal-footer { padding: 1.25rem 1.75rem; border-top: 1px solid #f3f4f6; display: flex; justify-content: flex-end; gap: 0.75rem; }
        .label-selector { display: flex; gap: 0.5rem; }
        .label-btn { display: flex; align-items: center; gap: 0.4rem; padding: 0.45rem 0.9rem; border: 1.5px solid #d1d5db; border-radius: 8px; font-weight: 600; font-size: 0.85rem; background: #fff; color: #4b5563; cursor: pointer; transition: 0.15s; }
        .label-btn.active { border-color: #0284c7; background: #eff6ff; color: #0284c7; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        .checkbox-row { display: flex; align-items: center; gap: 0.5rem; font-size: 0.88rem; font-weight: 600; color: #374151; cursor: pointer; margin-top: 0.25rem; }
        .checkbox-row input { width: 16px; height: 16px; accent-color: #0284c7; }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        /* ── Responsive ── */
        @media (max-width: 1024px) {
          .layout-app { flex-direction: column; }
          .side-nav { position: fixed; left: 0; top: 0; height: 100vh; transform: translateX(-100%); box-shadow: 4px 0 20px rgba(0,0,0,0.1); }
          .side-nav.open { transform: translateX(0); }
          .mobile-header { display: flex; }
          .main-zone { padding: 1.25rem; }
          .profile-hero { flex-direction: column; text-align: center; }
          .metrics-grid { grid-template-columns: repeat(2, 1fr); gap: 1rem; }
          .address-grid { grid-template-columns: 1fr; }
          .form-row { grid-template-columns: 1fr; }
          .settings-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .metrics-grid { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
        }
        @media (max-width: 480px) {
          .metrics-grid { grid-template-columns: 1fr 1fr; gap: 0.5rem; }
          .metric-card { padding: 1rem; flex-direction: column; text-align: center; gap: 0.5rem; }
          .profile-avatar-lg { width: 72px; height: 72px; font-size: 1.6rem; }
          .profile-fullname { font-size: 1.3rem; }
        }
      `}</style>
    </div>
  );
}
