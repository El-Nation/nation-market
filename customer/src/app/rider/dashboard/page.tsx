'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/authStore';
import {
  Bike, Package, DollarSign, Power, RefreshCw,
  MapPin, ChevronRight, LogOut, Clock, CheckCircle, Truck
} from 'lucide-react';

export default function RiderDashboard() {
  const router = useRouter();
  const { user, token, logout } = useAuthStore();
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

  const API = 'http://localhost:5000';

  useEffect(() => {
    setIsMounted(true);
    if (!token || user?.role !== 'RIDER') {
      window.location.href = '/login';
    } else {
      setAuthorized(true);
    }
  }, [token, user]);

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

  useEffect(() => {
    if (!authorized) return;
    if (activeTab === 'Hub') { fetchAvailable(); }
    if (activeTab === 'Deliveries') { fetchActive(); }
  }, [activeTab, authorized, fetchAvailable, fetchActive]);

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
      if (status === 'DELIVERED') alert('🎉 Delivery completed! Great work.');
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
    { id: 'Hub', icon: Package, label: 'Hub' },
    { id: 'Deliveries', icon: Truck, label: 'Deliveries' },
    { id: 'Earnings', icon: DollarSign, label: 'Earnings' },
  ];

  return (
    <div className="rider-layout">
      {/* Header */}
      <header className="rider-header">
        <img src="/logo.png" alt="Nation Market" className="rider-logo" />
        <div className="header-right">
          {/* Online Toggle */}
          <button
            className={`status-toggle ${isOnline ? 'online' : 'offline'}`}
            onClick={toggleOnline}
            disabled={statusLoading}
          >
            <Power size={16} />
            {statusLoading ? 'Updating...' : isOnline ? 'Online' : 'Offline'}
          </button>
          <div className="rider-avatar" onClick={() => logout()}>{initials}</div>
        </div>
      </header>

      {/* Status Banner */}
      <div className={`status-banner ${isOnline ? 'online' : 'offline'}`}>
        {isOnline
          ? '🟢 You are ONLINE — Available orders in your zone will appear below.'
          : '🔴 You are OFFLINE — Go online to start receiving delivery assignments.'}
      </div>

      {/* Tab Navigation */}
      <nav className="rider-tabs">
        {tabs.map(({ id, icon: Icon, label }) => (
          <button key={id} className={`rider-tab ${activeTab === id ? 'active' : ''}`} onClick={() => setActiveTab(id)}>
            <Icon size={18} />
            {label}
          </button>
        ))}
      </nav>

      <main className="rider-main">

        {/* ── HUB: Available Deliveries ── */}
        {activeTab === 'Hub' && (
          <div className="tab-section fade-in">
            <div className="section-header">
              <div>
                <h2>Available Deliveries</h2>
                <p className="subtitle">Accepted orders in your area waiting for a rider.</p>
              </div>
              <button className="icon-text-btn" onClick={fetchAvailable} disabled={availableLoading}>
                <RefreshCw size={15} /> Refresh
              </button>
            </div>

            {!isOnline && (
              <div className="info-card amber">
                <Power size={20} />
                <span>Go <strong>online</strong> first to claim deliveries.</span>
              </div>
            )}

            {availableLoading && <div className="loading-text">Finding deliveries near you...</div>}

            {!availableLoading && available.length === 0 && (
              <div className="empty-state">
                <Package size={48} className="empty-icon" />
                <h3>No Available Deliveries</h3>
                <p>There are no accepted orders ready for pickup right now. Check back shortly.</p>
              </div>
            )}

            {!availableLoading && available.map(order => {
              const dropAddr = parseAddr(order.deliveryAddress);
              const itemNames = order.items?.map((i: any) => i.product?.name).join(', ');
              return (
                <div key={order.id} className="delivery-card">
                  <div className="delivery-card-header">
                    <div>
                      <strong>{order.vendor?.storeName}</strong>
                      <span className="delivery-meta">#{order.id.slice(0, 8)} · ₦{order.total?.toLocaleString()}</span>
                    </div>
                    <span className="badge accepted">ACCEPTED</span>
                  </div>

                  <div className="addr-row">
                    <div className="addr-block pickup">
                      <span className="addr-label">📦 Pickup (Store)</span>
                      <span>{order.vendor?.address || 'Store Address on file'}</span>
                    </div>
                    {dropAddr?.line1 && (
                      <div className="addr-block drop">
                        <span className="addr-label">📍 Drop-off</span>
                        <span>{dropAddr.line1}, {dropAddr.city}</span>
                      </div>
                    )}
                  </div>

                  {itemNames && <p className="items-summary">Items: {itemNames}</p>}

                  <div className="delivery-card-footer">
                    <span className="earnings-chip">+₦{(order.deliveryFee || 500).toLocaleString()} delivery fee</span>
                    <button
                      className="claim-btn"
                      disabled={!isOnline}
                      onClick={() => claimDelivery(order.id)}
                    >
                      Claim Delivery <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── DELIVERIES: Active Assignment ── */}
        {activeTab === 'Deliveries' && (
          <div className="tab-section fade-in">
            <div className="section-header">
              <div>
                <h2>Active Delivery</h2>
                <p className="subtitle">Your current assignment. Update the status as you progress.</p>
              </div>
              <button className="icon-text-btn" onClick={fetchActive} disabled={activeLoading}>
                <RefreshCw size={15} /> Refresh
              </button>
            </div>

            {activeLoading && <div className="loading-text">Loading your assignment...</div>}

            {!activeLoading && !activeDelivery && (
              <div className="empty-state">
                <Truck size={48} className="empty-icon" />
                <h3>No Active Delivery</h3>
                <p>You don't have any active package assignment. Claim one from the Hub tab.</p>
                <button className="primary-btn" onClick={() => setActiveTab('Hub')}><Package size={16} /> Browse Hub</button>
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
                <div className="active-delivery-card">
                  {/* Store Info */}
                  <div className="active-card-header">
                    <div>
                      <strong style={{ fontSize: '1.15rem', color: '#111827' }}>{activeDelivery.vendor?.storeName}</strong>
                      <span style={{ display: 'block', fontSize: '0.82rem', color: '#6b7280', marginTop: '0.15rem' }}>
                        #{activeDelivery.id.slice(0, 8)} · {activeDelivery.items?.length} item(s) · ₦{activeDelivery.total?.toLocaleString()}
                      </span>
                    </div>
                    <span className={`badge ${activeDelivery.status === 'IN_TRANSIT' ? 'transit' : activeDelivery.status === 'DELIVERED' ? 'delivered' : 'accepted'}`}>
                      {activeDelivery.status === 'IN_TRANSIT' ? 'In Transit' : activeDelivery.status === 'ACCEPTED' ? 'Accepted' : 'Delivered'}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="progress-track">
                    {stages.map((s, i) => (
                      <div key={s.key} className="progress-step">
                        <div className={`progress-dot ${i <= stageIdx ? 'done' : ''} ${i === stageIdx ? 'active' : ''}`}>
                          {s.icon}
                        </div>
                        <span className={`progress-label ${i === stageIdx ? 'active' : ''}`}>{s.label}</span>
                        {i < stages.length - 1 && (
                          <div className={`progress-line ${i < stageIdx ? 'done' : ''}`} />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Addresses */}
                  <div className="addr-row">
                    <div className="addr-block pickup">
                      <span className="addr-label">📦 Pickup Store</span>
                      <span>{activeDelivery.vendor?.address || 'On file at store'}</span>
                    </div>
                    {dropAddr?.line1 && (
                      <div className="addr-block drop">
                        <span className="addr-label">📍 Deliver To</span>
                        <span>{dropAddr.line1}{dropAddr.line2 ? `, ${dropAddr.line2}` : ''}, {dropAddr.city}</span>
                      </div>
                    )}
                  </div>

                  {/* Customer Info */}
                  {activeDelivery.customer && (
                    <div className="customer-info-row">
                      <span>👤 {activeDelivery.customer.firstName} {activeDelivery.customer.lastName}</span>
                      {activeDelivery.customer.phone && <span>📞 {activeDelivery.customer.phone}</span>}
                    </div>
                  )}

                  {/* Items */}
                  <div className="items-list">
                    {activeDelivery.items?.map((item: any) => (
                      <div key={item.id} className="item-row">
                        <span>{item.product?.name} × {item.quantity}</span>
                        <span>₦{(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action Button */}
                  {currentStage?.action && currentStage.next && (
                    <button
                      className="action-btn"
                      style={{ background: currentStage.color }}
                      onClick={() => updateDeliveryStatus(activeDelivery.id, currentStage.next!)}
                    >
                      {currentStage.action}
                    </button>
                  )}

                  {activeDelivery.status === 'DELIVERED' && (
                    <div className="success-banner">
                      🎉 Delivery completed! Visit the Hub to pick up your next assignment.
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* ── EARNINGS ── */}
        {activeTab === 'Earnings' && (
          <div className="tab-section fade-in">
            <div className="section-header">
              <div>
                <h2>Earnings</h2>
                <p className="subtitle">Your delivery earnings summary.</p>
              </div>
            </div>
            <div className="empty-state">
              <DollarSign size={48} className="empty-icon" />
              <h3>No Earnings Yet</h3>
              <p>Complete deliveries to build your earning history.</p>
              <button className="primary-btn" onClick={() => setActiveTab('Hub')}><Package size={16} /> Find Deliveries</button>
            </div>
          </div>
        )}

      </main>

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f9fafb; }
        .rider-layout { display: flex; flex-direction: column; min-height: 100vh; }

        /* Header */
        .rider-header { background: white; padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e5e7eb; position: sticky; top: 0; z-index: 40; }
        .rider-logo { height: 50px; object-fit: contain; }
        .header-right { display: flex; align-items: center; gap: 1rem; }
        .rider-avatar { width: 36px; height: 36px; border-radius: 50%; background: #7c3aed; color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.9rem; cursor: pointer; }

        /* Status toggle */
        .status-toggle { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border-radius: 20px; border: none; font-weight: 700; font-size: 0.88rem; cursor: pointer; transition: all 0.25s; }
        .status-toggle.online { background: #dcfce7; color: #15803d; }
        .status-toggle.offline { background: #fee2e2; color: #b91c1c; }
        .status-toggle:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Status banner */
        .status-banner { padding: 0.65rem 1.5rem; font-size: 0.88rem; font-weight: 600; text-align: center; }
        .status-banner.online { background: #f0fdf4; color: #15803d; border-bottom: 1px solid #bbf7d0; }
        .status-banner.offline { background: #fef2f2; color: #991b1b; border-bottom: 1px solid #fecaca; }

        /* Tabs */
        .rider-tabs { display: flex; background: white; border-bottom: 1px solid #e5e7eb; }
        .rider-tab { flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 1rem; border: none; background: transparent; color: #6b7280; font-size: 0.9rem; font-weight: 600; cursor: pointer; border-bottom: 3px solid transparent; transition: all 0.2s; }
        .rider-tab.active { color: #7c3aed; border-bottom-color: #7c3aed; background: #faf5ff; }
        .rider-tab:hover { background: #f9fafb; color: #374151; }

        /* Main */
        .rider-main { flex: 1; max-width: 720px; margin: 0 auto; width: 100%; }
        .tab-section { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; }

        .section-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.75rem; }
        .section-header h2 { margin: 0 0 0.25rem; font-size: 1.4rem; font-weight: 700; color: #111827; }
        .subtitle { margin: 0; font-size: 0.9rem; color: #6b7280; }

        .icon-text-btn { display: flex; align-items: center; gap: 0.4rem; padding: 0.5rem 0.9rem; border: 1px solid #e5e7eb; border-radius: 8px; background: white; cursor: pointer; font-size: 0.85rem; font-weight: 600; color: #374151; transition: 0.2s; }
        .icon-text-btn:hover { background: #f9fafb; }
        .icon-text-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .loading-text { text-align: center; padding: 2rem; color: #6b7280; font-size: 0.95rem; }
        .empty-state { text-align: center; padding: 3rem 1.5rem; background: white; border-radius: 16px; border: 1px dashed #d1d5db; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
        .empty-icon { color: #d1d5db; margin-bottom: 0.5rem; }
        .empty-state h3 { margin: 0; font-size: 1.2rem; color: #111827; }
        .empty-state p { margin: 0; font-size: 0.9rem; color: #6b7280; max-width: 300px; }

        .info-card { display: flex; align-items: center; gap: 0.75rem; padding: 1rem 1.25rem; border-radius: 12px; font-size: 0.9rem; }
        .info-card.amber { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }

        /* Delivery Card (Hub) */
        .delivery-card { background: white; border-radius: 16px; border: 1px solid #e5e7eb; padding: 1.25rem; display: flex; flex-direction: column; gap: 0.85rem; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
        .delivery-card-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.5rem; }
        .delivery-card-header strong { font-size: 1rem; color: #111827; display: block; margin-bottom: 0.2rem; }
        .delivery-meta { font-size: 0.8rem; color: #6b7280; }
        .addr-row { display: flex; gap: 0.75rem; flex-wrap: wrap; }
        .addr-block { flex: 1; min-width: 160px; padding: 0.65rem 0.9rem; border-radius: 10px; display: flex; flex-direction: column; gap: 0.2rem; font-size: 0.85rem; }
        .addr-block.pickup { background: #f0fdf4; color: #374151; }
        .addr-block.drop { background: #faf5ff; color: #374151; }
        .addr-label { font-weight: 700; font-size: 0.77rem; text-transform: uppercase; letter-spacing: 0.3px; color: #6b7280; }
        .items-summary { margin: 0; font-size: 0.82rem; color: #6b7280; font-style: italic; }
        .delivery-card-footer { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; padding-top: 0.5rem; border-top: 1px solid #f3f4f6; }
        .earnings-chip { background: #f0fdf4; color: #15803d; padding: 0.3rem 0.75rem; border-radius: 20px; font-size: 0.8rem; font-weight: 700; }
        .claim-btn { display: flex; align-items: center; gap: 0.3rem; background: #7c3aed; color: white; border: none; padding: 0.6rem 1.1rem; border-radius: 10px; font-weight: 700; font-size: 0.88rem; cursor: pointer; transition: 0.2s; }
        .claim-btn:hover { background: #6d28d9; }
        .claim-btn:disabled { background: #d1d5db; color: #9ca3af; cursor: not-allowed; }

        /* Active Delivery Card */
        .active-delivery-card { background: white; border-radius: 16px; border: 1px solid #e5e7eb; padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
        .active-card-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.5rem; }

        /* Badges */
        .badge { padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.78rem; font-weight: 700; }
        .badge.accepted { background: #dbeafe; color: #1e40af; }
        .badge.transit { background: #ede9fe; color: #5b21b6; }
        .badge.delivered { background: #dcfce7; color: #15803d; }

        /* Progress Track */
        .progress-track { display: flex; align-items: flex-start; justify-content: space-between; position: relative; }
        .progress-step { flex: 1; display: flex; flex-direction: column; align-items: center; position: relative; }
        .progress-dot { width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; border: 3px solid #e5e7eb; background: #f3f4f6; z-index: 1; transition: all 0.3s; }
        .progress-dot.done { border-color: #7c3aed; background: #f3e8ff; }
        .progress-dot.active { border-color: #7c3aed; background: #7c3aed; }
        .progress-line { position: absolute; top: 19px; left: 50%; width: 100%; height: 3px; background: #e5e7eb; z-index: 0; }
        .progress-line.done { background: #7c3aed; }
        .progress-label { font-size: 0.72rem; font-weight: 600; color: #9ca3af; margin-top: 0.4rem; text-align: center; }
        .progress-label.active { color: #7c3aed; }

        .customer-info-row { display: flex; gap: 1.25rem; font-size: 0.88rem; color: #374151; flex-wrap: wrap; }
        .items-list { display: flex; flex-direction: column; gap: 0.4rem; padding: 0.85rem 1rem; background: #f9fafb; border-radius: 10px; }
        .item-row { display: flex; justify-content: space-between; font-size: 0.88rem; color: #374151; }
        .item-row span:last-child { font-weight: 600; color: #111827; }
        .action-btn { width: 100%; padding: 0.9rem; border: none; border-radius: 12px; color: white; font-weight: 700; font-size: 1rem; cursor: pointer; transition: opacity 0.2s; }
        .action-btn:hover { opacity: 0.9; }
        .success-banner { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; border-radius: 12px; padding: 1rem 1.25rem; text-align: center; font-weight: 600; font-size: 0.92rem; }

        /* Buttons */
        .primary-btn { display: flex; align-items: center; justify-content: center; gap: 0.5rem; background: #7c3aed; color: white; border: none; padding: 0.8rem 1.5rem; border-radius: 10px; font-weight: 700; font-size: 0.95rem; cursor: pointer; margin-top: 1rem; transition: 0.2s; }
        .primary-btn:hover { background: #6d28d9; }

        /* Animations */
        .fade-in { animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

        @media (max-width: 640px) {
          .tab-section { padding: 1rem; }
          .progress-label { display: none; }
          .addr-row { flex-direction: column; }
        }
      `}</style>
    </div>
  );
}
