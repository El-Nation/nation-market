'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '../store/authStore';
import {
  LayoutDashboard, Store, Users, Bike, ShoppingBag, Package, List,
  CreditCard, FileText, Bell, MessageSquare, History, Settings, LogOut,
  ChevronRight, Search, Activity, DollarSign, CheckCircle2, AlertTriangle, Menu, X
} from 'lucide-react';

export default function AdminDashboard() {
  return (
    <Suspense fallback={<div className="loader" style={{ padding: '2rem', textAlign: 'center' }}>Loading secure admin session...</div>}>
      <AdminDashboardContent />
    </Suspense>
  );
}

function AdminDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token, login, logout } = useAuthStore();
  const [authorized, setAuthorized] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // States for backend data
  const [stats, setStats] = useState<any>(null);
  const [vendors, setVendors] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [riders, setRiders] = useState([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [allPayments, setAllPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Settings State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [setupSecret, setSetupSecret] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const urlToken = searchParams.get('token');
    const urlRole = searchParams.get('role');
    
    // First, process new login from URL if present
    if (urlToken && urlRole && urlRole === 'ADMIN') {
      if (token !== urlToken) {
        login(urlToken, urlRole);
        router.replace('/');
      }
      return; 
    }
    
    // After URL params are cleared or if none exist, enforce protection
    if (!token || user?.role !== 'ADMIN') {
      window.location.href = 'https://nationmarket.eghedev.com/login';
    } else {
      setAuthorized(true);
      // Only fetch once
      if (!stats && loading) {
        fetchAdminData();
      }
    }
  }, [searchParams, token, user, login, router, stats, loading]);

  const fetchAdminData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      const meRes = await fetch((process.env.NEXT_PUBLIC_API_URL || '') + '/api/auth/me', { headers });
      if (meRes.ok) {
        const data = await meRes.json();
        if (data.success) {
          setFirstName(data.data.firstName || '');
          setLastName(data.data.lastName || '');
          setEmail(data.data.email || '');
          setPhone(data.data.phone || '');
          setIs2FAEnabled(data.data.isTwoFactorEnabled || false);
        }
      }

      const statsRes = await fetch((process.env.NEXT_PUBLIC_API_URL || '') + '/api/admin/stats', { headers });
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.data);
      }

      const vendorsRes = await fetch((process.env.NEXT_PUBLIC_API_URL || '') + '/api/admin/vendors', { headers });
      if (vendorsRes.ok) {
        const data = await vendorsRes.json();
        setVendors(data.data);
      }

      const customersRes = await fetch((process.env.NEXT_PUBLIC_API_URL || '') + '/api/admin/customers', { headers });
      if (customersRes.ok) {
        const data = await customersRes.json();
        setCustomers(data.data);
      }

      const ridersRes = await fetch((process.env.NEXT_PUBLIC_API_URL || '') + '/api/admin/riders', { headers });
      if (ridersRes.ok) {
        const data = await ridersRes.json();
        setRiders(data.data);
      }
      
      const prodRes = await fetch((process.env.NEXT_PUBLIC_API_URL || '') + '/api/admin/products', { headers });
      if (prodRes.ok) setProducts((await prodRes.json()).data);

      const catRes = await fetch((process.env.NEXT_PUBLIC_API_URL || '') + '/api/admin/categories', { headers });
      if (catRes.ok) setCategories((await catRes.json()).data);

      const ordersRes = await fetch((process.env.NEXT_PUBLIC_API_URL || '') + '/api/admin/orders', { headers });
      if (ordersRes.ok) setAllOrders((await ordersRes.json()).data);

      const payRes = await fetch((process.env.NEXT_PUBLIC_API_URL || '') + '/api/admin/payments', { headers });
      if (payRes.ok) setAllPayments((await payRes.json()).data);

      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch admin data', err);
      setLoading(false);
    }
  };

  const handleAddSubcategory = async (categoryId: string, name: string, inputNode: any) => {
    if (!name.trim()) return;
    try {
      const res = await fetch(`${API}/api/admin/subcategories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ categoryId, name })
      });
      if ((await res.json()).success) { inputNode.value = ''; fetchAdminData(); }
    } catch { alert('Subcategory creation failed'); }
  };

  const handleDeleteSubcategory = async (id: string) => {
    if (!window.confirm("Delete this Platform Subcategory globally?")) return;
    try {
      const res = await fetch(`${API}/api/admin/subcategories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if ((await res.json()).success) fetchAdminData();
    } catch { alert('Failed to delete subcategory'); }
  };

  const handleLogout = () => {
    logout();
    window.location.replace((process.env.NEXT_PUBLIC_CUSTOMER_URL || 'https://nationmarket.eghedev.com') + '/login');
  };

  const API = (process.env.NEXT_PUBLIC_API_URL || '');

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
        if (endpoint === 'update-password') { setCurrentPassword(''); setNewPassword(''); }
      } else alert(data.message || 'Update failed');
    } catch { alert('Network error'); }
  };

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
    if (data.success) { alert('2FA Enabled Successfully! Highly Secure.'); setIs2FAEnabled(true); setQrCode(''); setOtpToken(''); }
    else alert(data.message || 'Invalid code. Enter the 6-digit code from your Authenticator app.');
  };
  const disable2FA = async () => {
    if (!confirm('Disable Two-Factor Authentication? Your Root Admin account will be highly vulnerable.')) return;
    const res = await fetch(`${API}/api/auth/2fa/disable`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.success) { alert(data.message); setIs2FAEnabled(false); }
  };

  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [selectedRider, setSelectedRider] = useState<any>(null);

  const navItems = [
    { id: 'Dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'Vendors', icon: Store, label: 'Vendors' },
    { id: 'Customers', icon: Users, label: 'Customers' },
    { id: 'Riders', icon: Bike, label: 'Riders' },
    { id: 'Orders', icon: ShoppingBag, label: 'Orders' },
    { id: 'Products', icon: Package, label: 'Products' },
    { id: 'Categories', icon: List, label: 'Categories' },
    { id: 'Payments', icon: CreditCard, label: 'Payments' },
    { id: 'Receipts', icon: FileText, label: 'Receipts' },
    { id: 'Notifications', icon: Bell, label: 'Notifications' },
    { id: 'Enquiries', icon: MessageSquare, label: 'Enquiries / Contact' },
    { id: 'Logs', icon: History, label: 'Audit Logs' },
    { id: 'Settings', icon: Settings, label: 'Settings' }
  ];

  if (!isMounted || !authorized) return null;

  return (
    <div className="layout">
      {/* Mobile Header Bar */}
      <div className="mobile-header">
        <div className="mobile-header-left">
          <button className="icon-btn" onClick={() => setIsSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <img src="/logo.png" alt="NATION MARKET" className="mobile-logo" />
          <span className="admin-badge">ADMIN</span>
        </div>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <img src="/logo.png" alt="NATION MARKET" className="desktop-logo" />
          <span className="admin-badge">ADMIN</span>
          <button className="mobile-close-btn" onClick={() => setIsSidebarOpen(false)}><X size={24} /></button>
        </div>
        
        <nav className="sidebar-nav">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`nav-btn ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
        
        <div className="sidebar-footer">
          <button className="nav-btn logout" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        
        {loading ? (
          <div className="loader">Loading secure admin data...</div>
        ) : (
          <>
            {/* 1. DASHBOARD */}
            {activeTab === 'Dashboard' && (
              <div className="tab-pane fade-in">
                <div className="page-header">
                  <h2>Platform Overview</h2>
                  <p className="subtitle">Real-time marketplace metrics.</p>
                </div>
                
                <div className="metrics-grid">
                  <div className="metric-card clickable" onClick={() => setActiveTab('Customers')}>
                    <div className="metric-icon users-bg"><Users size={24} color="#005b9f" /></div>
                    <div className="metric-info">
                      <p>Total Customers</p><h3>{stats?.totalCustomers || 0}</h3>
                    </div>
                  </div>
                  <div className="metric-card clickable" onClick={() => setActiveTab('Vendors')}>
                    <div className="metric-icon vendor-bg"><Store size={24} color="#d97706" /></div>
                    <div className="metric-info">
                      <p>Total Vendors</p><h3>{stats?.totalVendors || 0}</h3>
                    </div>
                  </div>
                  <div className="metric-card clickable" onClick={() => setActiveTab('Riders')}>
                    <div className="metric-icon rider-bg"><Bike size={24} color="#16a34a" /></div>
                    <div className="metric-info">
                      <p>Total Riders</p><h3>{stats?.totalRiders || 0}</h3>
                    </div>
                  </div>
                  <div className="metric-card clickable" onClick={() => setActiveTab('Orders')}>
                    <div className="metric-icon order-bg"><ShoppingBag size={24} color="#6366f1" /></div>
                    <div className="metric-info">
                      <p>Total Orders</p><h3>{stats?.totalOrders || 0}</h3>
                    </div>
                  </div>
                  <div className="metric-card clickable" onClick={() => setActiveTab('Orders')}>
                    <div className="metric-icon active-bg"><Activity size={24} color="#0d9488" /></div>
                    <div className="metric-info">
                      <p>Active Orders</p><h3>{stats?.activeOrders || 0}</h3>
                    </div>
                  </div>
                  <div className="metric-card clickable" onClick={() => setActiveTab('Payments')}>
                    <div className="metric-icon revenue-bg"><DollarSign size={24} color="#15803d" /></div>
                    <div className="metric-info">
                      <p>Gross Revenue</p><h3>₦ {stats?.totalRevenue?.toLocaleString() || 0}</h3>
                    </div>
                  </div>
                  <div className="metric-card clickable" onClick={() => setActiveTab('Payments')}>
                    <div className="metric-icon platform-bg"><CreditCard size={24} color="#e11d48" /></div>
                    <div className="metric-info">
                      <p>Platform Charges</p><h3>₦ {stats?.platformCharges?.toLocaleString() || 0}</h3>
                    </div>
                  </div>
                </div>

                <div className="recent-activity-section" style={{ marginTop: '3rem' }}>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#111827' }}>Recent Registrations</h3>
                  {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                    <div className="table-responsive">
                      <table className="admin-table">
                        <thead>
                          <tr><th>User</th><th>Email</th><th>Role</th><th>Registered On</th></tr>
                        </thead>
                        <tbody>
                          {stats.recentActivity.map((user: any) => (
                            <tr key={user.id}>
                              <td><strong>{user.firstName} {user.lastName}</strong></td>
                              <td>{user.email}</td>
                              <td><span className={`role-badge ${user.role.toLowerCase()}`}>{user.role}</span></td>
                              <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="empty-state" style={{ padding: '3rem 1.5rem' }}>
                       <AlertTriangle size={36} className="empty-icon" />
                       <h3 style={{ margin: '0.5rem 0', fontSize: '1.1rem' }}>No Data Available</h3>
                       <p style={{ margin: 0, fontSize: '0.9rem' }}>No users have registered on the platform yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. VENDORS */}
            {activeTab === 'Vendors' && (
              <div className="tab-pane fade-in">
                <div className="page-header">
                  <h2>Vendors Management</h2>
                  <p className="subtitle">View and manage all registered stores on the platform.</p>
                </div>
                {vendors.length === 0 ? (
                  <div className="empty-state">No vendors registered yet.</div>
                ) : (
                  <div className="table-responsive">
                    <table className="admin-table">
                      <thead>
                        <tr><th>Store Name</th><th>Owner Name</th><th>Email</th><th>Phone</th><th>Category</th><th>Status</th><th>Actions</th></tr>
                      </thead>
                      <tbody>
                        {vendors.map((v: any) => (
                          <tr key={v.id}>
                            <td><strong>{v.vendorProfile?.storeName || 'N/A'}</strong></td>
                            <td>{v.firstName} {v.lastName}</td>
                            <td>{v.email}</td>
                            <td>{v.phone}</td>
                            <td>{v.vendorProfile?.businessType || 'N/A'}</td>
                            <td><span className={`status-badge ${v.vendorProfile?.status.toLowerCase()}`}>{v.vendorProfile?.status}</span></td>
                            <td>
                              <button className="outline-btn-sm" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }} onClick={() => setSelectedVendor(v)}>View Store</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* 3. CUSTOMERS */}
            {activeTab === 'Customers' && (
              <div className="tab-pane fade-in">
                <div className="page-header">
                  <h2>Customers Management</h2>
                  <p className="subtitle">View all registered customers.</p>
                </div>
                {customers.length === 0 ? (
                  <div className="empty-state">No customers registered yet.</div>
                ) : (
                  <div className="table-responsive">
                    <table className="admin-table">
                      <thead>
                        <tr><th>Name</th><th>Email</th><th>Phone</th><th>Registration Date</th></tr>
                      </thead>
                      <tbody>
                        {customers.map((c: any) => (
                          <tr key={c.id}>
                            <td><strong>{c.firstName} {c.lastName}</strong></td>
                            <td>{c.email}</td>
                            <td>{c.phone || 'N/A'}</td>
                            <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* 4. RIDERS */}
            {activeTab === 'Riders' && (
              <div className="tab-pane fade-in">
                <div className="page-header">
                  <h2>Riders Management</h2>
                  <p className="subtitle">View all dispatch riders.</p>
                </div>
                {riders.length === 0 ? (
                  <div className="empty-state">No riders registered yet.</div>
                ) : (
                  <div className="table-responsive">
                    <table className="admin-table">
                      <thead>
                        <tr><th>Rider Name</th><th>Email</th><th>Phone</th><th>Vehicle</th><th>Status</th><th>Actions</th></tr>
                      </thead>
                      <tbody>
                        {riders.map((r: any) => (
                          <tr key={r.id}>
                            <td><strong>{r.firstName} {r.lastName}</strong></td>
                            <td>{r.email}</td>
                            <td>{r.phone}</td>
                            <td>{r.riderProfile?.vehicleType || 'N/A'} - {r.riderProfile?.licenseNumber || 'N/A'}</td>
                            <td><span className={`status-badge ${r.riderProfile?.status?.toLowerCase()}`}>{r.riderProfile?.status}</span></td>
                            <td>
                              <button className="outline-btn-sm" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }} onClick={() => setSelectedRider(r)}>View Rider</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* 5. ORDERS */}
            {activeTab === 'Orders' && (
              <div className="tab-pane fade-in">
                <div className="page-header"><h2>Orders</h2><p className="subtitle">Global marketplace order ledger.</p></div>
                {allOrders.length === 0 ? (
                  <div className="empty-state">
                    <ShoppingBag size={52} className="empty-icon" />
                    <h3>No Orders Found</h3>
                    <p>Order records will appear here once transactions are initiated.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="admin-table">
                      <thead>
                        <tr><th>Order ID</th><th>Customer</th><th>Store</th><th>Items</th><th>Total</th><th>Status</th><th>Type</th><th>Date</th></tr>
                      </thead>
                      <tbody>
                        {allOrders.map((o: any) => {
                          const sc: Record<string, { bg: string; color: string }> = {
                            PENDING:    { bg: '#fef3c7', color: '#92400e' },
                            ACCEPTED:   { bg: '#dbeafe', color: '#1e40af' },
                            IN_TRANSIT: { bg: '#ede9fe', color: '#5b21b6' },
                            DELIVERED:  { bg: '#dcfce7', color: '#15803d' },
                            CANCELLED:  { bg: '#fee2e2', color: '#991b1b' },
                          };
                          const badge = sc[o.status] || { bg: '#f3f4f6', color: '#374151' };
                          return (
                            <tr key={o.id}>
                              <td><code style={{ fontSize: '0.78rem', color: '#6b7280' }}>#{o.id.slice(0, 8)}</code></td>
                              <td><strong>{o.customer?.firstName} {o.customer?.lastName}</strong><br /><span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>{o.customer?.email}</span></td>
                              <td>{o.vendor?.storeName || 'N/A'}</td>
                              <td>{o.items?.length || 0}</td>
                              <td><strong>₦{o.total?.toLocaleString()}</strong></td>
                              <td><span style={{ padding: '0.25rem 0.65rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700, background: badge.bg, color: badge.color }}>{o.status === 'IN_TRANSIT' ? 'In Transit' : o.status.charAt(0) + o.status.slice(1).toLowerCase()}</span></td>
                              <td><span className="status-badge" style={{ background: o.type === 'DELIVERY' ? '#e0f2fe' : '#fef9c3', color: o.type === 'DELIVERY' ? '#0284c7' : '#92400e' }}>{o.type}</span></td>
                              <td>{new Date(o.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* 6. PRODUCTS */}
            {activeTab === 'Products' && (
              <div className="tab-pane fade-in">
                <div className="page-header"><h2>Products</h2><p className="subtitle">Global product overview.</p></div>
                {products.length === 0 ? (
                  <div className="empty-state">
                    <Package size={52} className="empty-icon" />
                    <h3>No Products Available</h3>
                    <p>Vendors have not populated products yet.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="admin-table">
                      <thead>
                        <tr><th>Product Name</th><th>Vendor Store</th><th>Global Category</th><th>Subcategory</th><th>Price</th><th>Stock</th><th>Status</th></tr>
                      </thead>
                      <tbody>
                        {products.map((p: any) => (
                          <tr key={p.id}>
                            <td><strong>{p.name}</strong></td>
                            <td>{p.vendor?.storeName || 'N/A'}</td>
                            <td><span className="status-badge" style={{ background: '#e0e7ff', color: '#4338ca' }}>{p.category?.name || 'Unassigned'}</span></td>
                            <td>{p.subcategory?.name || '-'}</td>
                            <td>₦ {p.price.toLocaleString()}</td>
                            <td>{p.inventory}</td>
                            <td><span className={`status-badge ${p.isAvailable ? 'active' : 'suspended'}`}>{p.isAvailable ? 'Listed' : 'Unlisted'}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
            {/* 7. CATEGORIES & TAXONOMY */}
            {activeTab === 'Categories' && (
              <div className="tab-pane fade-in">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h2>Platform Taxonomy</h2>
                    <p className="subtitle">Core Official Categories & Subcategories.</p>
                  </div>
                </div>
                
                <div className="taxonomy-grid" style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
                  {categories.map((cat: any) => (
                    <div key={cat.id} className="settings-box" style={{ padding: '1.25rem' }}>
                      <h4 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {cat.name}
                        <span style={{ fontSize: '0.8rem', background: '#e0e7ff', color: '#4338ca', padding: '0.2rem 0.5rem', borderRadius: '12px' }}>{cat.subcategories?.length || 0} Subs</span>
                      </h4>
                      <ul style={{ listStyle: 'none', margin: '1rem 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {cat.subcategories?.map((sub: any) => (
                          <li key={sub.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                            <span style={{ fontSize: '0.9rem', color: '#374151', fontWeight: 500 }}>{sub.name}</span>
                            <button onClick={() => handleDeleteSubcategory(sub.id)} style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><X size={16} /></button>
                          </li>
                        ))}
                      </ul>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                        <input type="text" placeholder="Add subcategory... (Press Enter to save)" 
                          style={{ flex: 1, padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.85rem' }} 
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddSubcategory(cat.id, e.currentTarget.value, e.currentTarget);
                          }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 8. PAYMENTS & 9. RECEIPTS */}
            {(activeTab === 'Payments' || activeTab === 'Receipts') && (
              <div className="tab-pane fade-in">
                <div className="page-header">
                  <h2>{activeTab}</h2><p className="subtitle">Platform {activeTab.toLowerCase()} ledgers.</p>
                </div>
                {activeTab === 'Payments' && allPayments.length > 0 ? (
                  <div className="table-responsive">
                    <table className="admin-table">
                      <thead>
                        <tr><th>Reference</th><th>Customer</th><th>Store</th><th>Subtotal</th><th>Delivery</th><th>Platform 2%</th><th>Grand Total</th><th>Status</th><th>Date</th></tr>
                      </thead>
                      <tbody>
                        {allPayments.map((p: any) => (
                          <tr key={p.id}>
                            <td><code style={{ fontSize: '0.75rem', color: '#6b7280' }}>{p.reference?.slice(0, 18)}…</code></td>
                            <td>{p.order?.customer?.firstName} {p.order?.customer?.lastName}</td>
                            <td>{p.order?.vendor?.storeName || 'N/A'}</td>
                            <td>₦{p.order?.subtotal?.toLocaleString()}</td>
                            <td>₦{p.order?.deliveryFee?.toLocaleString()}</td>
                            <td><strong style={{ color: '#e11d48' }}>₦{p.order?.platformFee?.toLocaleString()}</strong></td>
                            <td><strong>₦{p.amount?.toLocaleString()}</strong></td>
                            <td><span className={`status-badge ${p.status === 'SUCCESS' ? 'active' : p.status === 'PENDING' ? 'pending' : 'suspended'}`}>{p.status}</span></td>
                            <td>{new Date(p.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-state">
                    <CreditCard size={52} className="empty-icon" />
                    <h3>No {activeTab} Records</h3>
                    <p>Transactions will appear here when properly initiated by gateways.</p>
                  </div>
                )}
              </div>
            )}

            {/* 10. NOTIFICATIONS & 11. ENQUIRIES */}
            {['Notifications', 'Enquiries'].includes(activeTab) && (
              <div className="tab-pane fade-in">
                <div className="page-header">
                  <h2>{activeTab === 'Enquiries' ? 'Enquiries / Contact' : activeTab }</h2>
                  <p className="subtitle">System {activeTab.toLowerCase()} management.</p>
                </div>
                <div className="empty-state">
                  {activeTab === 'Notifications' ? <Bell size={52} className="empty-icon" /> : <MessageSquare size={52} className="empty-icon" />}
                  <h3>No {activeTab}</h3>
                  <p>Check back later for incoming platform updates.</p>
                </div>
              </div>
            )}

            {/* 12. LOGS */}
            {activeTab === 'Logs' && (
              <div className="tab-pane fade-in">
                <div className="page-header">
                  <h2>System Audit Logs</h2>
                  <p className="subtitle">Immutable record of platform activity and operational events.</p>
                </div>
                
                {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                  <div className="table-responsive" style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', padding: '1rem' }}>
                    <table className="admin-table">
                      <thead>
                        <tr><th>Timestamp</th><th>Event Type</th><th>Description</th><th>Target</th><th>Status</th></tr>
                      </thead>
                      <tbody>
                        {/* Static Seed Log for context */}
                        <tr style={{ background: '#f8fafc' }}>
                          <td>{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</td>
                          <td><span className="status-badge" style={{ background: '#e0e7ff', color: '#4338ca' }}>SYSTEM_BOOT</span></td>
                          <td>Superadmin root authentication established.</td>
                          <td>ADMIN</td>
                          <td><span className="status-badge active">SUCCESS</span></td>
                        </tr>
                        {/* Map recent registrations as audit actions */}
                        {stats.recentActivity.map((user: any) => (
                          <tr key={user.id}>
                            <td>{new Date(user.createdAt).toLocaleDateString()} {new Date(user.createdAt).toLocaleTimeString()}</td>
                            <td><span className="status-badge" style={{ background: '#fce7f3', color: '#be185d' }}>ACCOUNT_PROVISION</span></td>
                            <td>System provisioned new {user.role.toLowerCase()} profile.</td>
                            <td><strong>{user.email}</strong></td>
                            <td><span className="status-badge active">SUCCESS</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-state">
                    <History size={52} className="empty-icon" />
                    <h3>No Records Output</h3>
                    <p>No actionable items present in this secure log stream.</p>
                  </div>
                )}
              </div>
            )}

            {/* 13. SETTINGS */}
            {activeTab === 'Settings' && (
              <div className="tab-pane fade-in">
                <div className="page-header"><h2>Security &amp; Account</h2><p className="subtitle">Manage your account credentials, notifications, and structural security.</p></div>
                
                <div className="settings-grid">
                  <div className="settings-box">
                    <h4>Personal Details</h4>
                    <div className="form-group"><label>FIRST NAME</label><input type="text" value={firstName} onChange={e=>setFirstName(e.target.value)} /></div>
                    <div className="form-group"><label>LAST NAME</label><input type="text" value={lastName} onChange={e=>setLastName(e.target.value)} /></div>
                    <button className="outline-btn w-full mt-2" onClick={() => handleUpdate('update-details', { firstName, lastName }, 'Name updated!')}>Update Details</button>
                  </div>

                  <div className="settings-box">
                    <h4>Contact Info</h4>
                    <div className="form-group"><label>EMAIL ADDRESS</label><input type="text" value={email} onChange={e=>setEmail(e.target.value)} /></div>
                    <div className="form-group"><label>PHONE NUMBER</label><input type="text" value={phone} onChange={e=>setPhone(e.target.value)} /></div>
                    <button className="outline-btn w-full mt-2" onClick={() => handleUpdate('update-contact', { email, phone }, 'Contact details updated!')}>Update Contact</button>
                  </div>
                  
                  <div className="settings-box">
                    <h4>Change Password</h4>
                    <div className="form-group"><label>CURRENT PASSWORD</label><input type="password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} placeholder="••••••••" /></div>
                    <div className="form-group"><label>NEW PASSWORD</label><input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="••••••••" /></div>
                    <button className="outline-btn w-full mt-2" disabled={!currentPassword || !newPassword} onClick={() => handleUpdate('update-password', { currentPassword, newPassword }, 'Password changed securely!')}>Update Password</button>
                  </div>

                  <div className="settings-box">
                    <h4>Two-Factor Authentication (2FA)</h4>
                    <p className="form-hint">Add an extra layer of security to your account requiring a confirmation code.</p>
                    
                    {!qrCode && !is2FAEnabled && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem' }}>
                        <label className="toggle-switch">
                          <input type="checkbox" onChange={generate2FA} checked={false} />
                          <span className="slider" />
                        </label>
                        <span style={{ fontWeight: 600, color: '#374151' }}>Disabled</span>
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
                        <img src={qrCode} alt="2FA QR" className="qr-img" />
                        <p className="qr-hint">SCAN IN GOOGLE AUTHENTICATOR, OR ENTER MANUAL KEY:</p>
                        <code className="manual-key">{setupSecret}</code>
                        <input
                          type="text" value={otpToken} onChange={e => setOtpToken(e.target.value)}
                          placeholder="Enter 6-digit code" maxLength={6}
                          className="otp-input"
                        />
                        <button className="primary-btn w-full mt-1" onClick={confirm2FA}>Verify &amp; Enable</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* ── MODALS ── */}
      {(selectedVendor || selectedRider) && (
        <div className="modal-overlay" onClick={() => { setSelectedVendor(null); setSelectedRider(null); }}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedVendor ? 'Vendor Details' : 'Rider Details'}</h3>
              <button className="modal-close" onClick={() => { setSelectedVendor(null); setSelectedRider(null); }}>&times;</button>
            </div>
            <div className="modal-body">
              {selectedVendor && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#0f172a' }}>Store Information</h4>
                    <p><strong>Store Name:</strong> {selectedVendor.vendorProfile?.storeName}</p>
                    <p><strong>Business Type:</strong> {selectedVendor.vendorProfile?.businessType}</p>
                    <p><strong>Address:</strong> {selectedVendor.vendorProfile?.businessAddress}</p>
                    <p><strong>Description:</strong> {selectedVendor.vendorProfile?.description || 'No description provided.'}</p>
                  </div>
                  <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#0f172a' }}>Owner Information</h4>
                    <p><strong>Name:</strong> {selectedVendor.firstName} {selectedVendor.lastName}</p>
                    <p><strong>Email:</strong> {selectedVendor.email}</p>
                    <p><strong>Phone:</strong> {selectedVendor.phone}</p>
                    <p><strong>Joined:</strong> {new Date(selectedVendor.createdAt).toLocaleString()}</p>
                  </div>
                  <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#0f172a' }}>Registration Agreement</h4>
                    <p><strong>Status:</strong> <span className={`status-badge ${selectedVendor.vendorProfile?.status.toLowerCase()}`}>{selectedVendor.vendorProfile?.status}</span></p>
                    <p><strong>Terms Accepted:</strong> {selectedVendor.vendorProfile?.termsAccepted ? 'Yes ✅' : 'No ❌'}</p>
                    <p><strong>Agreement Version:</strong> {selectedVendor.vendorProfile?.agreementVersion || 'N/A'}</p>
                    {selectedVendor.vendorProfile?.agreementTimestamp && (
                      <p><strong>Accepted On:</strong> {new Date(selectedVendor.vendorProfile.agreementTimestamp).toLocaleString()}</p>
                    )}
                  </div>
                </div>
              )}
              {selectedRider && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#0f172a' }}>Rider Information</h4>
                    <p><strong>Name:</strong> {selectedRider.firstName} {selectedRider.lastName}</p>
                    <p><strong>Email:</strong> {selectedRider.email}</p>
                    <p><strong>Phone:</strong> {selectedRider.phone}</p>
                    <p><strong>Joined:</strong> {new Date(selectedRider.createdAt).toLocaleString()}</p>
                  </div>
                  <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#0f172a' }}>Vehicle Details</h4>
                    <p><strong>Type:</strong> {selectedRider.riderProfile?.vehicleType}</p>
                    <p><strong>License Number:</strong> {selectedRider.riderProfile?.licenseNumber || 'None provided'}</p>
                  </div>
                  <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#0f172a' }}>Registration Agreement</h4>
                    <p><strong>Status:</strong> <span className={`status-badge ${selectedRider.riderProfile?.status?.toLowerCase()}`}>{selectedRider.riderProfile?.status}</span></p>
                    <p><strong>Terms Accepted:</strong> {selectedRider.riderProfile?.termsAccepted ? 'Yes ✅' : 'No ❌'}</p>
                    <p><strong>Agreement Version:</strong> {selectedRider.riderProfile?.agreementVersion || 'N/A'}</p>
                    {selectedRider.riderProfile?.agreementTimestamp && (
                      <p><strong>Accepted On:</strong> {new Date(selectedRider.riderProfile.agreementTimestamp).toLocaleString()}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ borderTop: '1px solid #e5e7eb', padding: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="primary-btn" onClick={() => { setSelectedVendor(null); setSelectedRider(null); }}>Close</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* Core Reset & Fonts */
        * { box-sizing: border-box; }
        .layout { display: flex; min-height: 100vh; background: #fafcb; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #111827; }
        
        /* Mobile Header */
        .mobile-header { display: none; background: white; padding: 1rem; border-bottom: 1px solid #e5e7eb; position: sticky; top: 0; z-index: 40; justify-content: space-between; align-items: center; }
        .mobile-header-left { display: flex; align-items: center; gap: 1rem; }
        .mobile-logo { height: 180px; width: auto; object-fit: contain; margin-top: -60px; margin-bottom: -60px; margin-left: -50px; }
        .icon-btn { background: none; border: none; cursor: pointer; color: #374151; padding: 0.25rem; }
        .admin-badge { background: #b91c1c; color: white; padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.8rem; font-weight: 800; letter-spacing: 1px; }

        /* Sidebar Overlay */
        .sidebar-overlay { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 45; }

        /* Sidebar Styles */
        .sidebar { width: 280px; background: white; border-right: 1px solid #e5e7eb; display: flex; flex-direction: column; position: fixed; height: 100vh; left: 0; top: 0; z-index: 50; transition: transform 0.3s ease; }
        .sidebar-header { padding: 1rem 1.5rem; border-bottom: 1px solid #f3f4f6; display: flex; align-items: center; justify-content: space-between; overflow: hidden; height: 80px; }
        .desktop-logo { height: 260px; width: auto; object-fit: contain; margin-left: -40px; margin-right: -20px; }
        .mobile-close-btn { display: none; background: none; border: none; cursor: pointer; color: #6b7280; }

        .sidebar-nav { flex: 1; overflow-y: auto; padding: 1.5rem 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
        .sidebar-nav::-webkit-scrollbar { width: 4px; }
        .sidebar-nav::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
        
        .nav-btn { display: flex; align-items: center; gap: 1rem; padding: 0.85rem 1rem; width: 100%; border: none; background: transparent; border-radius: 8px; color: #4b5563; font-size: 0.95rem; font-weight: 500; cursor: pointer; text-align: left; transition: all 0.2s; }
        .nav-btn:hover { background: #f3f4f6; color: #111827; }
        .nav-btn.active { background: #fee2e2; color: #b91c1c; font-weight: 600; }
        
        .sidebar-footer { padding: 1.5rem 1rem; border-top: 1px solid #f3f4f6; }
        .nav-btn.logout { color: #dc2626; }
        .nav-btn.logout:hover { background: #fef2f2; }

        /* Main Content */
        .main-content { margin-left: 280px; flex: 1; background: #fafafa; min-height: 100vh; display: flex; flex-direction: column; }
        .tab-pane { padding: 2.5rem; max-width: 1400px; width: 100%; }
        
        .page-header { margin-bottom: 2.5rem; }
        .page-header h2 { font-size: 1.8rem; font-weight: 700; color: #111827; margin: 0 0 0.5rem 0; letter-spacing: -0.5px; }
        .subtitle { color: #6b7280; font-size: 1rem; margin: 0; }
        
        .loader { padding: 4rem; text-align: center; color: #6b7280; font-size: 1.1rem; font-weight: 500; }

        /* Metrics Grid */
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; margin-bottom: 3rem; }
        .metric-card { background: white; border-radius: 12px; padding: 1.5rem; border: 1px solid #e5e7eb; display: flex; align-items: center; gap: 1.25rem; transition: transform 0.2s, box-shadow 0.2s; }
        .metric-card:hover { transform: translateY(-3px); box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); }
        .metric-icon { width: 52px; height: 52px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .users-bg { background: #dbeafe; } .vendor-bg { background: #fef3c7; } .rider-bg { background: #dcfce7; } .order-bg { background: #e0e7ff; } .active-bg { background: #ccfbf1; } .revenue-bg { background: #dcfce7; } .platform-bg { background: #ffe4e6; }
        .metric-info p { margin: 0 0 0.25rem 0; font-size: 0.9rem; color: #6b7280; font-weight: 500; }
        .metric-info h3 { margin: 0; font-size: 1.5rem; color: #111827; font-weight: 700; }

        /* Tables & Lists */
        .table-responsive { overflow-x: auto; -webkit-overflow-scrolling: touch; background: white; border: 1px solid #e5e7eb; border-radius: 12px; }
        .admin-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem; }
        .admin-table th { background: #f9fafb; padding: 1rem 1.5rem; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb; white-space: nowrap; }
        .admin-table td { padding: 1rem 1.5rem; border-bottom: 1px solid #e5e7eb; color: #4b5563; }
        .admin-table tr:last-child td { border-bottom: none; }
        .admin-table tr:hover td { background: #f9fafb; }
        
        .status-badge { padding: 0.35rem 0.75rem; border-radius: 20px; font-size: 0.8rem; font-weight: 600; }
        .status-badge.active { background: #dcfce7; color: #166534; }
        .status-badge.pending { background: #fef3c7; color: #92400e; }
        .status-badge.suspended { background: #fee2e2; color: #b91c1c; }

        /* Categories Grid */
        .categories-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem; }
        .cat-card { background: white; padding: 1.5rem; border-radius: 12px; border: 1px solid #e5e7eb; display: flex; align-items: center; gap: 1rem; font-weight: 600; color: #111827; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .cat-bullet { width: 12px; height: 12px; border-radius: 50%; background: #005b9f; }

        /* Modals */
        .modal-overlay { position: fixed; inset: 0; background: rgba(17,24,39,0.7); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 1rem; }
        .modal-box { background: #fff; border-radius: 16px; width: 100%; max-width: 580px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); overflow: hidden; max-height: 90vh; overflow-y: auto; display: flex; flex-direction: column; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-bottom: 1px solid #f3f4f6; background: #fff; position: sticky; top: 0; z-index: 10; }
        .modal-header h3 { font-size: 1.15rem; font-weight: 700; color: #111827; margin: 0; }
        .modal-close { background: #f3f4f6; border: none; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #6b7280; transition: 0.2s; font-size: 1.25rem; font-weight: bold; }
        .modal-close:hover { background: #e5e7eb; color: #111827; }
        .modal-body { padding: 1.5rem; flex: 1; overflow-y: auto; background: #fafafa; }
        .modal-footer { padding: 1.25rem 1.5rem; border-top: 1px solid #f3f4f6; display: flex; justify-content: flex-end; gap: 0.75rem; background: #fff; position: sticky; bottom: 0; z-index: 10; }
        
        .modal-body p { margin: 0.4rem 0; font-size: 0.95rem; color: #4b5563; }
        .modal-body strong { color: #111827; margin-right: 0.5rem; }

        /* Settings Grid */
        .settings-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 2rem; }
        .settings-box { background: white; padding: 2rem; border-radius: 8px; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .settings-box h4 { margin: 0 0 1.5rem 0; font-size: 1.15rem; color: #111827; font-weight: 700; border-bottom: 2px solid #f3f4f6; padding-bottom: 0.75rem; }
        .form-group { margin-bottom: 1.25rem; }
        .form-group label { display: block; font-size: 0.75rem; font-weight: 700; margin-bottom: 0.4rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
        .form-group input { width: 100%; padding: 0.8rem 1rem; border: 1px solid #d1d5db; border-radius: 8px; outline: none; transition: all 0.2s; font-size: 0.95rem; color: #111827; }
        .form-group input:focus { border-color: #005b9f; box-shadow: 0 0 0 3px rgba(0,91,159,0.1); }
        .form-hint { font-size: 0.9rem; color: #6b7280; margin: 0 0 1rem 0; line-height: 1.5; }

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
        .qr-hint { font-size: 0.78rem; font-weight: 700; color: #9ca3af; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; text-align: center; }
        .manual-key { display: block; background: #f3f4f6; padding: 0.5rem 1rem; border-radius: 6px; font-size: 0.85rem; color: #f59e0b; font-weight: 700; word-break: break-all; text-align: center; width: 100%; }
        .otp-input { width: 100%; text-align: center; letter-spacing: 0.3em; font-size: 1.3rem; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 8px; outline: none; font-family: monospace; }
        .otp-input:focus { border-color: #005b9f; }

        /* Empty State */
        .empty-state { text-align: center; padding: 4rem 2rem; background: white; border-radius: 16px; border: 1px dashed #d1d5db; }
        .empty-icon { color: #d1d5db; margin-bottom: 1rem; }
        .empty-state h3 { font-size: 1.3rem; color: #111827; margin: 0 0 0.5rem 0; }
        .empty-state p { color: #6b7280; font-size: 0.95rem; margin: 0; max-width: 400px; margin: 0 auto; }

        /* Buttons */
        .primary-btn { background: #005b9f; color: white; border: none; padding: 0.85rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: background 0.2s; }
        .primary-btn:hover { background: #00467a; }
        .outline-btn { background: transparent; color: #005b9f; border: 1.5px solid #005b9f; padding: 0.85rem 1.5rem; border-radius: 8px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .outline-btn:hover { background: #f0f9ff; }
        .outline-btn:disabled { border-color: #9ca3af; color: #9ca3af; cursor: not-allowed; background: transparent; }
        .outline-btn-sm { background: transparent; color: #005b9f; border: 1px solid #e0f2fe; padding: 0.5rem 1rem; border-radius: 6px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .outline-btn-sm:hover { background: #f0f9ff; border-color: #005b9f; }
        .w-full { width: 100%; } .mt-1 { margin-top: 1rem; } .mt-2 { margin-top: 2rem; }

        /* Animations */
        .fade-in { animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        /* Responsive */
        @media (max-width: 1024px) {
          .mobile-header { display: flex; }
          .sidebar-overlay { display: block; }
          .sidebar { transform: translateX(-100%); }
          .sidebar.open { transform: translateX(0); }
          .main-content { margin-left: 0; }
          .tab-pane { padding: 1.5rem; }
          .mobile-close-btn { display: block; }
        }
      `}</style>
    </div>
  );
}
