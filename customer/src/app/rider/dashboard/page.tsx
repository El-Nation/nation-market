'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/authStore';
import {
  Package, DollarSign, Power, RefreshCw, LogOut, Truck, Activity, Settings
} from 'lucide-react';

export default function RiderDashboard() {
  const router = useRouter();
  const { user, token, logout, initialized, initAuth } = useAuthStore();
  const [authorized, setAuthorized] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('Hub');

  // Rider status
  const [isOnline, setIsOnline] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  // Available deliveries (ACCEPTED orders with no rider yet)
  const [available, setAvailable] = useState<any[]>([]);
  const [availableLoading, setAvailableLoading] = useState(false);

  // Active assignment
  const [activeDelivery, setActiveDelivery] = useState<any>(null);
  const [activeLoading, setActiveLoading] = useState(false);

  // Delivery history (Earnings)
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Settings & 2FA state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [qrCode, setQrCode] = useState('');
  const [setupSecret, setSetupSecret] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  const API = (process.env.NEXT_PUBLIC_API_URL && !(process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('localhost') ? process.env.NEXT_PUBLIC_API_URL : 'https://api.eghedev.com').includes('localhost') ? (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('localhost') ? process.env.NEXT_PUBLIC_API_URL : 'https://api.eghedev.com') : 'https://api.eghedev.com');

  useEffect(() => {
    setIsMounted(true);
    if (!initialized) {
      initAuth();
      return;
    }
    
    if (!token || user?.role !== 'RIDER') {
      window.location.href = '/login';
    } else {
      setAuthorized(true);
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setEmail(user.email || '');
      setPhone((user as any).phone || '');
      fetchRiderProfile(); // Check online status
    }
  }, [initialized, token, user, initAuth]);

  const fetchRiderProfile = async () => {
    // Basic fetch to sync online status if needed, otherwise rely on the updates
  };

  const fetchAvailable = useCallback(async () => {
    setAvailableLoading(true);
    try {
      const res = await fetch(`${API}/api/rider/deliveries/available`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const d = await res.json();
      if (d.success) setAvailable(d.data);
    } finally { setAvailableLoading(false); }
  }, [token]);

  const fetchActive = useCallback(async () => {
    setActiveLoading(true);
    try {
      const res = await fetch(`${API}/api/rider/deliveries/active`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const d = await res.json();
      if (d.success) setActiveDelivery(d.data);
    } finally { setActiveLoading(false); }
  }, [token]);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`${API}/api/rider/deliveries/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const d = await res.json();
      if (d.success) setHistory(d.data);
    } finally { setHistoryLoading(false); }
  }, [token]);

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

  useEffect(() => {
    if (!authorized) return;
    if (activeTab === 'Hub') { fetchAvailable(); }
    if (activeTab === 'Deliveries') { fetchActive(); }
    if (activeTab === 'Earnings') { fetchHistory(); }
  }, [activeTab, authorized, fetchAvailable, fetchActive, fetchHistory]);

  const toggleOnline = async () => {
    setStatusLoading(true);
    try {
      const newStatus = !isOnline;
      const res = await fetch(`${API}/api/rider/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isOnline: newStatus })
      });
      const d = await res.json();
      if (d.success) setIsOnline(d.data.isOnline);
      else alert(d.message || 'Status update failed');
    } finally { setStatusLoading(false); }
  };

  const claimDelivery = async (orderId: string) => {
    const res = await fetch(`${API}/api/rider/deliveries/${orderId}/claim`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    });
    const d = await res.json();
    if (d.success) {
      alert('Delivery claimed! Check your Deliveries tab.');
      setActiveTab('Deliveries');
      fetchActive();
    } else {
      alert(d.message || 'Could not claim delivery');
    }
  };

  const updateDeliveryStatus = async (orderId: string, status: string) => {
    const res = await fetch(`${API}/api/rider/deliveries/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status })
    });
    const d = await res.json();
    if (d.success) {
      fetchActive();
      if (status === 'DELIVERED') {
        alert('🎉 Delivery completed! Great work.');
        if (activeTab === 'Earnings') fetchHistory(); // Keep history up to date if they switch
      }
    } else {
      alert(d.message || 'Status update failed');
    }
  };

  if (!isMounted || !authorized) return null;

  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || 'R';

  const parseAddr = (str: string) => {
    try { return JSON.parse(str || '{}'); } catch { return {}; }
  };

  const tabs = [
    { id: 'Hub', icon: Package, label: 'Available Deliveries' },
    { id: 'Deliveries', icon: Truck, label: 'Active Delivery' },
    { id: 'Earnings', icon: DollarSign, label: 'Earnings & History' },
    { id: 'Settings', icon: Settings, label: 'Account Settings' },
  ];

  return (
    <div className="layout-app">
      <nav className="side-nav">
        <div className="nav-header">
          <img src="/logo.png" alt="NATION MARKET" className="dashboard-logo" />
          <span className="portal-badge">RIDER PORTAL</span>
        </div>
        <div className="scrollable-menu">
          {tabs.map(({ id, icon: Icon, label }) => (
            <button key={id} className={`nav-item ${activeTab === id ? 'active' : ''}`} onClick={() => setActiveTab(id)}>
              <Icon size={20} /> {label}
            </button>
          ))}
        </div>
        <div className="nav-footer">
          <button className="logout-button" onClick={() => logout()}><LogOut size={20} /> Logout</button>
        </div>
      </nav>

      <main className="main-zone">
        <header className="top-header">
          <div>
            <h1>{user?.firstName ? `Welcome back, ${user.firstName}` : 'Rider Dashboard'}</h1>
            <p className="subtitle" style={{ fontSize: '0.9rem', color: '#6b7280', margin: 0 }}>Discover active requests and manage your deliveries</p>
          </div>
          
          <div className="store-status-box">
             <div className="rider-avatar-large">{initials}</div>
             <div className="store-meta">
               <span className="store-name">Online Status</span>
               <button
                 className={`status-chip ${isOnline ? 'online' : 'offline'}`}
                 onClick={toggleOnline}
                 disabled={statusLoading}
                 style={{ border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
               >
                 <Power size={14} />
                 {statusLoading ? 'Updating...' : isOnline ? 'Online — Active' : 'Offline — Paused'}
               </button>
             </div>
          </div>
        </header>

        {/* ── HUB: Available Deliveries ── */}
        {activeTab === 'Hub' && (
          <div className="tab-pane fade-in">
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <h2>Delivery Hub</h2>
                <p className="subtitle" style={{ fontSize: '0.9rem', color: '#6b7280' }}>Accepted orders in your area waiting for a rider.</p>
              </div>
              <button className="icon-text-btn" onClick={fetchAvailable} disabled={availableLoading}>
                <RefreshCw size={15} /> Refresh
              </button>
            </div>

            {!isOnline && (
              <div className="info-card amber" style={{ display: 'flex', gap: '0.75rem', padding: '1rem', background: '#fffbeb', color: '#92400e', borderRadius: '12px', border: '1px solid #fde68a', marginBottom: '1.5rem', fontWeight: 500, alignItems: 'center' }}>
                <Power size={20} />
                <span>Go <strong>online</strong> at the top right to start claiming deliveries.</span>
              </div>
            )}

            {availableLoading && <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Finding deliveries near you...</div>}

            {!availableLoading && available.length === 0 && (
              <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                <Package size={48} color="#d1d5db" style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ color: '#111827', margin: '0 0 0.5rem' }}>No Available Deliveries</h3>
                <p style={{ color: '#6b7280', margin: 0, fontSize: '0.95rem' }}>There are no accepted orders ready for pickup right now.</p>
              </div>
            )}

            {!availableLoading && available.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
                {available.map(order => {
                  const dropAddr = parseAddr(order.deliveryAddress);
                  const itemNames = order.items?.map((i: any) => i.product?.name).join(', ');
                  return (
                    <div key={order.id} className="delivery-card" style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div>
                          <strong style={{ fontSize: '1.05rem', color: '#111827' }}>{order.vendor?.storeName}</strong>
                          <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>#{order.id.slice(0, 8)} · ₦{order.total?.toLocaleString()}</div>
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, background: '#dbeafe', color: '#1e40af', padding: '0.3rem 0.6rem', borderRadius: '20px', height: 'fit-content' }}>ACCEPTED</span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                        <div style={{ padding: '0.75rem', borderRadius: '8px', background: '#f0fdf4', fontSize: '0.85rem' }}>
                          <div style={{ fontWeight: 700, color: '#166534', marginBottom: '0.1rem', fontSize: '0.72rem', textTransform: 'uppercase' }}>📦 Pickup Store</div>
                          <div style={{ color: '#14532d' }}>{order.vendor?.address || 'Store Address on file'}</div>
                        </div>
                        {dropAddr?.line1 && (
                          <div style={{ padding: '0.75rem', borderRadius: '8px', background: '#faf5ff', fontSize: '0.85rem' }}>
                            <div style={{ fontWeight: 700, color: '#6b21a8', marginBottom: '0.1rem', fontSize: '0.72rem', textTransform: 'uppercase' }}>📍 Drop-off Location</div>
                            <div style={{ color: '#581c87' }}>{dropAddr.line1}, {dropAddr.city}</div>
                          </div>
                        )}
                      </div>

                      {itemNames && <p style={{ fontSize: '0.82rem', color: '#6b7280', fontStyle: 'italic', marginBottom: '1rem' }}>Items: {itemNames}</p>}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid #f3f4f6' }}>
                        <span style={{ fontWeight: 800, color: '#15803d', fontSize: '0.9rem' }}>+₦{(order.deliveryFee || 500).toLocaleString()} <span style={{ fontWeight: 500, fontSize: '0.75rem' }}>fee</span></span>
                        <button
                          className="primary-btn"
                          disabled={!isOnline}
                          onClick={() => claimDelivery(order.id)}
                          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', opacity: isOnline ? 1 : 0.5, cursor: isOnline ? 'pointer' : 'not-allowed' }}
                        >
                          Claim Delivery
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── DELIVERIES: Active Assignment ── */}
        {activeTab === 'Deliveries' && (
          <div className="tab-pane fade-in">
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <h2>Active Assignment</h2>
                <p className="subtitle" style={{ fontSize: '0.9rem', color: '#6b7280' }}>Manage the delivery currently assigned to you.</p>
              </div>
              <button className="icon-text-btn" onClick={fetchActive} disabled={activeLoading}>
                <RefreshCw size={15} /> Refresh
              </button>
            </div>

            {activeLoading && <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Loading your assignment...</div>}

            {!activeLoading && !activeDelivery && (
              <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                <Truck size={48} color="#d1d5db" style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ color: '#111827', margin: '0 0 0.5rem' }}>No Active Delivery</h3>
                <p style={{ color: '#6b7280', margin: '0 0 1.5rem', fontSize: '0.95rem' }}>You don't have any active package assignment.</p>
                <button className="primary-btn" onClick={() => setActiveTab('Hub')}>Browse Hub</button>
              </div>
            )}

            {!activeLoading && activeDelivery && (() => {
              const dropAddr = parseAddr(activeDelivery.deliveryAddress);
              const stages = [
                { key: 'ACCEPTED', label: 'Picked Up', icon: '📦', action: 'Mark Picked Up', next: 'IN_TRANSIT', color: '#7c3aed' },
                { key: 'IN_TRANSIT', label: 'In Transit', icon: '🛵', action: 'Mark Delivered', next: 'DELIVERED', color: '#16a34a' },
                { key: 'DELIVERED', label: 'Delivered!', icon: '✅', action: null, next: null, color: '#15803d' },
              ];
              const currentStage = stages.find(s => s.key === activeDelivery.status);
              const stageIdx = stages.findIndex(s => s.key === activeDelivery.status);

              return (
                <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                    <div>
                      <strong style={{ fontSize: '1.25rem', color: '#111827' }}>{activeDelivery.vendor?.storeName}</strong>
                      <span style={{ display: 'block', fontSize: '0.85rem', color: '#6b7280', marginTop: '0.2rem' }}>
                        #{activeDelivery.id.slice(0, 8)} · {activeDelivery.items?.length} item(s) · ₦{activeDelivery.total?.toLocaleString()}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '0.4rem 0.8rem', borderRadius: '20px', background: activeDelivery.status === 'IN_TRANSIT' ? '#ede9fe' : (activeDelivery.status === 'DELIVERED' ? '#dcfce7' : '#dbeafe'), color: activeDelivery.status === 'IN_TRANSIT' ? '#5b21b6' : (activeDelivery.status === 'DELIVERED' ? '#15803d' : '#1e40af') }}>
                      {activeDelivery.status === 'IN_TRANSIT' ? 'IN TRANSIT' : activeDelivery.status}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', marginBottom: '2rem' }}>
                    {stages.map((s, i) => (
                      <div key={s.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 2 }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', border: '3px solid', borderColor: i <= stageIdx ? '#7c3aed' : '#e5e7eb', background: i === stageIdx ? '#7c3aed' : (i < stageIdx ? '#f3e8ff' : '#f9fafb'), color: i === stageIdx ? '#fff' : 'inherit', zIndex: 2, transition: '0.3s' }}>
                          {s.icon}
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: i <= stageIdx ? '#7c3aed' : '#9ca3af', marginTop: '0.5rem' }}>{s.label}</span>
                      </div>
                    ))}
                    {/* Background Tracks */}
                    <div style={{ position: 'absolute', top: '22px', left: '16%', right: '16%', height: '3px', background: '#e5e7eb', zIndex: 1 }}>
                       <div style={{ height: '100%', background: '#7c3aed', width: stageIdx === 0 ? '0%' : (stageIdx === 1 ? '50%' : '100%'), transition: '0.4s' }} />
                    </div>
                  </div>

                  {/* Addresses */}
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, padding: '1rem', background: '#f0fdf4', borderRadius: '12px' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.75rem', color: '#166534', textTransform: 'uppercase', marginBottom: '0.2rem' }}>📦 Pickup Store</div>
                      <div style={{ color: '#14532d', fontSize: '0.9rem' }}>{activeDelivery.vendor?.address || 'On file at store'}</div>
                    </div>
                    {dropAddr?.line1 && (
                      <div style={{ flex: 1, padding: '1rem', background: '#faf5ff', borderRadius: '12px' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.75rem', color: '#6b21a8', textTransform: 'uppercase', marginBottom: '0.2rem' }}>📍 Deliver To</div>
                        <div style={{ color: '#581c87', fontSize: '0.9rem' }}>{dropAddr.line1}{dropAddr.line2 ? `, ${dropAddr.line2}` : ''}, {dropAddr.city}</div>
                      </div>
                    )}
                  </div>

                  {/* Customer Info */}
                  {activeDelivery.customer && (
                    <div style={{ display: 'flex', gap: '1.5rem', padding: '1rem', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '1.5rem', alignItems: 'center' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#111827' }}>👤 {activeDelivery.customer.firstName} {activeDelivery.customer.lastName}</div>
                      {activeDelivery.customer.phone && <div style={{ fontSize: '0.95rem', color: '#374151' }}>📞 {activeDelivery.customer.phone}</div>}
                    </div>
                  )}

                  {/* Action Button */}
                  {currentStage?.action && currentStage.next && (
                    <button
                      style={{ width: '100%', padding: '1rem', borderRadius: '12px', background: currentStage.color, color: 'white', fontWeight: 800, fontSize: '1.05rem', border: 'none', cursor: 'pointer', transition: '0.2s', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      onClick={() => updateDeliveryStatus(activeDelivery.id, currentStage.next!)}
                    >
                      {currentStage.action}
                    </button>
                  )}

                  {activeDelivery.status === 'DELIVERED' && (
                    <div style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '1.25rem', textAlign: 'center', fontWeight: 700, fontSize: '1rem' }}>
                      🎉 Delivery completed securely! Verify your balance in Earnings & History, then visit the Hub for new requests.
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* ── EARNINGS ── */}
        {activeTab === 'Earnings' && (
          <div className="tab-pane fade-in">
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <h2>Earnings & History</h2>
                <p className="subtitle" style={{ fontSize: '0.9rem', color: '#6b7280' }}>Your eligible delivery payouts restricted securely to successfully fulfilled (DELIVERED) assignments.</p>
              </div>
              <button className="icon-text-btn" onClick={fetchHistory} disabled={historyLoading}>
                 <RefreshCw size={15} /> Refresh
              </button>
            </div>

            <div style={{ background: '#fff', padding: '1.75rem', borderRadius: '16px', border: '1px solid #e5e7eb', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DollarSign size={32} />
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', color: '#6b7280', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>Eligible Payout Balance</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>
                  ₦ {history.reduce((acc, order) => acc + (order.riderEarnings || order.deliveryFee || 0), 0).toLocaleString()}
                </div>
              </div>
            </div>

            {historyLoading && <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Loading earning history...</div>}

            {!historyLoading && history.length === 0 && (
              <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                <DollarSign size={48} color="#d1d5db" style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ color: '#111827', margin: '0 0 0.5rem' }}>No Eligible Earnings Yet</h3>
                <p style={{ color: '#6b7280', margin: '0 0 1.5rem', fontSize: '0.95rem' }}>Complete deliveries successfully to authorize ledger earnings.</p>
                <button className="primary-btn" onClick={() => setActiveTab('Hub')}>Find Deliveries</button>
              </div>
            )}

            {!historyLoading && history.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <h4 style={{ margin: '0.5rem 0', color: '#111827', fontSize: '1.1rem', fontWeight: 800 }}>Ledger History ({history.length})</h4>
                {history.map(order => (
                  <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e5e7eb', transition: 'box-shadow 0.2s', cursor: 'pointer' }} className="history-card">
                    <div>
                      <div style={{ fontWeight: 700, color: '#111827', marginBottom: '0.3rem', fontSize: '1.05rem' }}>Order #{order.id.slice(0, 8)}</div>
                      <div style={{ fontSize: '0.85rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Truck size={14} /> Completed on {new Date(order.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ fontWeight: 800, color: '#15803d', fontSize: '1.15rem' }}>
                      + ₦{(order.riderEarnings || order.deliveryFee || 0).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ACCOUNT SETTINGS ── */}
        {activeTab === 'Settings' && (
          <div className="tab-pane fade-in">
            <div className="section-header" style={{ marginBottom: '1.5rem' }}>
              <h2>Account Settings</h2>
              <p className="subtitle" style={{ fontSize: '0.9rem', color: '#6b7280' }}>Manage your rider credentials, contact details, and security.</p>
            </div>
            
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
                <p className="form-hint" style={{ fontSize: '0.88rem', color: '#6b7280', margin: '0 0 0.5rem 0' }}>Add an extra layer of security strictly requiring a confirmation code on login.</p>
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
                  <div style={{ padding: '1rem', background: '#f0fdf4', color: '#15803d', borderRadius: '8px', border: '1px solid #bbf7d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                    <span style={{ fontWeight: 700 }}>2FA is Active 🛡️</span>
                    <button onClick={disable2FA} style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '0.35rem 0.85rem', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}>Disable</button>
                  </div>
                )}
                {qrCode && (
                  <div style={{ marginTop: '1.25rem', padding: '1.25rem', background: '#f9fafb', borderRadius: '10px', border: '1px dashed #d1d5db', textAlign: 'center' }}>
                    <p style={{ margin: '0 0 1rem', fontWeight: 600, color: '#374151' }}>Scan in Google Authenticator</p>
                    <img src={qrCode} alt="2FA QR" style={{ width: '150px', height: '150px', margin: '0 auto 1rem', display: 'block', borderRadius: '8px' }} />
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', marginBottom: '0.4rem' }}>OR ENTER MANUAL KEY:</p>
                    <code style={{ display: 'block', padding: '0.5rem', background: '#e5e7eb', borderRadius: '6px', fontSize: '0.82rem', marginBottom: '1rem', wordBreak: 'break-all' }}>{setupSecret}</code>
                    <input
                      type="text" value={otpToken} onChange={e => setOtpToken(e.target.value)}
                      placeholder="Enter 6-digit code" maxLength={6}
                      style={{ width: '100%', padding: '0.75rem', textAlign: 'center', fontSize: '1.2rem', letterSpacing: '4px', borderRadius: '8px', border: '1px solid #d1d5db', marginBottom: '1rem' }}
                    />
                    <button className="primary-btn w-full" onClick={confirm2FA} style={{ width: '100%' }}>Verify &amp; Enable</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f9fafb; }
        
        .layout-app { display: flex; min-height: 100vh; }
        
        /* Sidebar Navigation */
        .side-nav { width: 270px; min-width: 270px; background: #fff; border-right: 1px solid #e5e7eb; display: flex; flex-direction: column; flex-shrink: 0; position: sticky; top: 0; height: 100vh; overflow-y: auto; z-index: 50; transition: transform 0.3s ease; }
        .nav-header { padding: 1.5rem; display: flex; flex-direction: column; align-items: flex-start; gap: 0.75rem; border-bottom: 1px solid #e5e7eb; }
        .dashboard-logo { height: 40px; object-fit: contain; }
        .portal-badge { background: #4f46e5; color: #fff; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.7rem; font-weight: 700; letter-spacing: 1px; display: inline-block; }
        
        .scrollable-menu { flex: 1; padding: 1.5rem 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
        .nav-item { display: flex; align-items: center; gap: 0.85rem; padding: 0.75rem 1rem; color: #4b5563; border-radius: 10px; font-weight: 600; font-size: 0.95rem; border: none; background: transparent; cursor: pointer; width: 100%; text-align: left; transition: all 0.2s; font-family: inherit; }
        .nav-item:hover { background: #f3f4f6; color: #111827; }
        .nav-item.active { background: #eef2ff; color: #4f46e5; }
        
        .nav-footer { padding: 1rem; border-top: 1px solid #e5e7eb; }
        .logout-button { display: flex; align-items: center; justify-content: center; gap: 0.75rem; width: 100%; border: 1px solid #fecaca; background: #fef2f2; color: #dc2626; padding: 0.85rem; border-radius: 10px; font-weight: 700; cursor: pointer; transition: all 0.2s; font-size: 0.95rem; font-family: inherit; }
        .logout-button:hover { background: #fee2e2; }

        /* Main Content Area */
        .main-zone { flex: 1; min-width: 0; display: flex; flex-direction: column; }
        .top-header { background: #fff; padding: 2rem; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; }
        .top-header h1 { margin: 0 0 0.25rem 0; font-size: 1.75rem; font-weight: 800; color: #111827; }
        
        .store-status-box { display: flex; align-items: center; gap: 1rem; background: #f9fafb; padding: 0.75rem 1rem; border-radius: 12px; border: 1px solid #e5e7eb; }
        .rider-avatar-large { width: 44px; height: 44px; border-radius: 50%; background: #4f46e5; color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.1rem; }
        .store-meta { display: flex; flex-direction: column; gap: 0.25rem; }
        .store-name { font-weight: 700; font-size: 0.95rem; color: #111827; }
        .status-chip { display: flex; align-items: center; gap: 0.4rem; padding: 0.25rem 0.6rem; border-radius: 20px; font-weight: 700; font-size: 0.75rem; text-transform: uppercase; }
        .status-chip.online { background: #dcfce7; color: #166534; }
        .status-chip.offline { background: #fee2e2; color: #991b1b; }
        
        /* Tabs area */
        .tab-pane { padding: 2.5rem; max-width: 1000px; }
        
        .primary-btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.85rem 1.75rem; background: #1d4ed8; color: white; font-weight: 700; font-size: 0.95rem; border: none; border-radius: 10px; cursor: pointer; transition: 0.2s; font-family: inherit; }
        .primary-btn:hover { background: #1e40af; }

        .icon-text-btn { display: flex; align-items: center; gap: 0.4rem; padding: 0.6rem 1rem; border: 1px solid #e5e7eb; border-radius: 8px; background: white; cursor: pointer; font-size: 0.85rem; font-weight: 600; color: #374151; transition: 0.2s; font-family: inherit; }
        .icon-text-btn:hover { background: #f9fafb; }

        .history-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.05); transform: translateY(-1px); }

        /* Settings Styles */
        .settings-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem; }
        .settings-box { background: #fff; padding: 1.75rem; border-radius: 14px; border: 1px solid #e5e7eb; box-shadow: 0 1px 4px rgba(0,0,0,0.03); }
        .settings-box h4 { margin: 0 0 1.25rem 0; font-size: 1.05rem; font-weight: 800; color: #111827; border-bottom: 2px solid #f3f4f6; padding-bottom: 0.75rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.35rem; margin-bottom: 0.85rem; }
        .form-group label { font-size: 0.78rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
        .form-group input { padding: 0.75rem 1rem; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.95rem; outline: none; font-family: inherit; color: #111827; transition: border-color 0.15s; }
        .form-group input:focus { border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); }
        .outline-btn { display: inline-flex; align-items: center; justify-content: center; background: #fff; border: 1.5px solid #4f46e5; color: #4f46e5; font-weight: 700; padding: 0.65rem 1.25rem; border-radius: 8px; cursor: pointer; transition: 0.2s; font-size: 0.9rem; font-family: inherit; }
        .outline-btn:hover { background: #eef2ff; }
        .w-full { width: 100%; }
        .mt-1 { margin-top: 0.5rem; }
        
        .toggle-switch { position: relative; display: inline-block; width: 44px; height: 24px; cursor: pointer; }
        .toggle-switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: #d1d5db; border-radius: 24px; transition: .3s; }
        .slider:before { position: absolute; content: ''; height: 18px; width: 18px; left: 3px; bottom: 3px; background: white; border-radius: 50%; transition: .3s; }

        .fade-in { animation: fadeIn 0.35s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

        @media (max-width: 900px) {
          .layout-app { flex-direction: column; }
          .side-nav { width: 100%; height: auto; position: static; flex-direction: row; flex-wrap: wrap; justify-content: space-between; }
          .scrollable-menu { flex-direction: row; overflow-x: auto; padding: 1rem; }
          .nav-item { padding: 0.6rem 1rem; }
          .nav-footer { border-top: none; border-left: 1px solid #e5e7eb; display: flex; align-items: center; }
          .logout-button { background: transparent; }
          .top-header { flex-direction: column; align-items: flex-start; }
          .tab-pane { padding: 1.5rem; }
        }
      `}</style>
    </div>
  );
}
