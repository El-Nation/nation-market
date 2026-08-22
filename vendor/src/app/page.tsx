'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '../store/authStore';
import { Store, Package, ListOrdered, DollarSign, Settings, LogOut, TrendingUp, Star, Box, Search, Plus, X, Layers } from 'lucide-react';
import { optimizeCloudinaryUrl } from '../utils/cloudinary';

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token, login, logout } = useAuthStore();
  const [authorized, setAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');
  const [isMounted, setIsMounted] = useState(false);
  const [vendorProfile, setVendorProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Store Front Settings Form
  const [storeNameForm, setStoreNameForm] = useState('');
  const [storeDescForm, setStoreDescForm] = useState('');
  const [storeAddressForm, setStoreAddressForm] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [coverFileName, setCoverFileName] = useState('');
  const [logoFileName, setLogoFileName] = useState('');
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [selectedCoverFile, setSelectedCoverFile] = useState<File | null>(null);


  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
    const h = Math.floor(i / 2);
    const m = i % 2 === 0 ? '00' : '30';
    const label = h === 0 ? `12:${m} AM` : h < 12 ? `${h}:${m} AM` : h === 12 ? `12:${m} PM` : `${h - 12}:${m} PM`;
    return { value: `${String(h).padStart(2, '0')}:${m}`, label };
  });
  const defaultSchedule = DAYS.map(day => ({ day, isOpen: day !== 'Sunday', open: '08:00', close: '20:00' }));
  const [scheduleForm, setScheduleForm] = useState(defaultSchedule);
  const updateScheduleDay = (index: number, field: string, value: any) => {
    setScheduleForm(prev => prev.map((d, i) => i === index ? { ...d, [field]: value } : d));
  };

  // Subcategories
  const [vendorSubcategories, setVendorSubcategories] = useState<any[]>([]);
  const [availableSubcategories, setAvailableSubcategories] = useState<any[]>([]);
  const [selectedSubIds, setSelectedSubIds] = useState<string[]>([]);

  // Products
  const [vendorProducts, setVendorProducts] = useState<any[]>([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productDesc, setProductDesc] = useState('');
  const [productStock, setProductStock] = useState('0');
  const [productSubId, setProductSubId] = useState('');
  const productImgRef = useRef<HTMLInputElement>(null);
  const [activeProductFilter, setActiveProductFilter] = useState('All Products');
  const [vendorOrders, setVendorOrders] = useState<any[]>([]);
  const [activeOrderFilter, setActiveOrderFilter] = useState('All Orders');

  // Edit Product State
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('0');
  const [editSubId, setEditSubId] = useState('');
  const editImgRef = useRef<HTMLInputElement>(null);

  const openEditModal = (p: any) => {
    setEditingProduct(p);
    setEditName(p.name || '');
    setEditDesc(p.description || '');
    setEditPrice(String(p.price || ''));
    setEditStock(String(p.inventory || '0'));
    setEditSubId(p.subcategoryId || '');
  };

  const updateProduct = async () => {
    if (!editingProduct) return;
    const formData = new FormData();
    formData.append('name', editName);
    formData.append('description', editDesc);
    formData.append('price', editPrice);
    formData.append('inventory', editStock);
    if (editSubId) formData.append('subcategoryId', editSubId);
    if (editImgRef.current?.files?.[0]) formData.append('image', editImgRef.current.files[0]);
    try {
      const res = await fetch(`http://localhost:5000/api/vendor/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        alert('Product updated successfully!');
        setEditingProduct(null);
        if (editImgRef.current) editImgRef.current.value = '';
        fetchVendorData();
      } else { alert(data.message || 'Update failed'); }
    } catch (e) { alert('Network error during update'); }
  };

  // Security Form States
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+234 800 000 0000');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [setupSecret, setSetupSecret] = useState('');
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  const fetchVendorData = async () => {
    if (!token) return;
    try {
      // Fetch real user identity (firstName, lastName, email, phone)
      const meRes = await fetch('http://localhost:5000/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } });
      const meData = await meRes.json();
      if (meData.success) {
        setFirstName(meData.data.firstName || '');
        setLastName(meData.data.lastName || '');
        setEmail(meData.data.email || '');
        if (meData.data.phone) setPhone(meData.data.phone);
      }

      // Fetch Vendor Store Profile
      const profRes = await fetch('http://localhost:5000/api/vendor/profile', { headers: { 'Authorization': `Bearer ${token}` } });
      const profData = await profRes.json();
      if (profData.success) {
        setVendorProfile(profData.data);
        setStoreNameForm(profData.data.storeName || '');
        setStoreDescForm(profData.data.description || '');
        setStoreAddressForm(profData.data.address || '');
        if (profData.data.openingHours) {
          try {
            const parsed = JSON.parse(profData.data.openingHours);
            if (Array.isArray(parsed)) setScheduleForm(parsed);
          } catch { /* keep default */ }
        }
      }
      
      // Fetch Subcategories
      const subRes = await fetch('http://localhost:5000/api/vendor/subcategories', { headers: { 'Authorization': `Bearer ${token}` } });
      const subData = await subRes.json();
      if (subData.success) {
        setVendorSubcategories(subData.data);
        setSelectedSubIds(subData.data.map((s: any) => s.id));
      }

      const availRes = await fetch('http://localhost:5000/api/vendor/subcategories/available', { headers: { 'Authorization': `Bearer ${token}` } });
      const availData = await availRes.json();
      if (availData.success) setAvailableSubcategories(availData.data);

      // Fetch Products
      const prodRes = await fetch('http://localhost:5000/api/vendor/products', { headers: { 'Authorization': `Bearer ${token}` } });
      const prodData = await prodRes.json();
      if (prodData.success) setVendorProducts(prodData.data);

      // Fetch Orders
      const ordRes = await fetch('http://localhost:5000/api/vendor/orders', { headers: { 'Authorization': `Bearer ${token}` } });
      const ordData = await ordRes.json();
      if (ordData.success) setVendorOrders(ordData.data);

    } catch (e) {
      console.error("Dashboard fetch error", e);
    }
  };

  useEffect(() => {
    if (user?.firstName || user?.lastName || user?.email || user?.phone) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setEmail(user.email || '');
      if (user.phone) setPhone(user.phone);
    }
  }, [user]);

  useEffect(() => {
    setIsMounted(true);
    const urlToken = searchParams.get('token');
    const urlRole = searchParams.get('role');
    
    if (urlToken && urlRole) {
      if (token !== urlToken) {
        login(urlToken, urlRole);
        router.replace('/');
      }
      return;
    }
    
    if (!token || user?.role !== 'VENDOR') {
      window.location.href = 'http://localhost:3000/login';
    } else {
      setAuthorized(true);
      if (loading) {
        fetchVendorData();
        setLoading(false);
      }
    }
  }, [searchParams, token, user, login, router, loading]);

  const handleUpdate = async (endpoint: string, payload: any, successMessage: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/auth/${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        alert(successMessage);
        // Sync local state with returned data so fields stay populated
        if (endpoint === 'update-details' && data.data) {
          setFirstName(data.data.firstName || '');
          setLastName(data.data.lastName || '');
        }
        if (endpoint === 'update-contact' && data.data) {
          setEmail(data.data.email || '');
          if (data.data.phone) setPhone(data.data.phone);
        }
        if (endpoint === 'update-password') {
          setCurrentPassword('');
          setNewPassword('');
        }
      } else { alert(data.message || 'Operation failed'); }
    } catch (e) { alert('Network Error'); }
  };

  // Instant image upload — fires as soon as a file is selected, no need to click Save
  const uploadStoreImage = async (field: 'logoUpload' | 'coverUpload', file: File) => {
    const isLogo = field === 'logoUpload';
    if (isLogo) setLogoFileName('Uploading...');
    else setCoverFileName('Uploading...');

    const formData = new FormData();
    // Must include required text fields to pass Prisma update (backend uses existing values as fallback)
    formData.append('storeName', storeNameForm || 'Store');
    formData.append(field, file);

    try {
      const res = await fetch('http://localhost:5000/api/vendor/store', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        if (isLogo) { setLogoFileName(''); setSelectedLogoFile(null); }
        else { setCoverFileName(''); setSelectedCoverFile(null); }
        await fetchVendorData(); // Reload to get Cloudinary URL from DB
      } else {
        alert(`Image upload failed: ${data.message}`);
        if (isLogo) setLogoFileName('');
        else setCoverFileName('');
      }
    } catch (e: any) {
      alert(`Upload error: ${e.message}`);
      if (isLogo) setLogoFileName('');
      else setCoverFileName('');
    }
  };

  const handleUpdateStore = async () => {
    const formData = new FormData();
    formData.append('storeName', storeNameForm);
    formData.append('description', storeDescForm);
    formData.append('address', storeAddressForm);
    formData.append('openingHours', JSON.stringify(scheduleForm));

    try {
      const res = await fetch('http://localhost:5000/api/vendor/store', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        await fetchVendorData();
        alert('Store Profile updated!');
      } else {
        alert(`Save failed: ${data.message}`);
      }
    } catch (e: any) { alert(`Network Error: ${e.message}`); }
  };

  const toggleSubcategory = (id: string) => {
    setSelectedSubIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleLinkSubcategories = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/vendor/subcategories/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ subcategoryIds: selectedSubIds })
      });
      const data = await res.json();
      if (data.success) {
        alert("Categories updated successfully!");
        fetchVendorData();
      } else { alert(data.message || 'Operation failed'); }
    } catch (e) { alert('Failed to link subcategories'); }
  };

  const createProduct = async () => {
    if (!productName || !productPrice) return alert("Name and Price are strictly required.");
    
    const formData = new FormData();
    if (productSubId) formData.append('subcategoryId', productSubId);
    formData.append('name', productName);
    formData.append('price', productPrice);
    formData.append('description', productDesc);
    formData.append('inventory', productStock);
    
    if (productImgRef.current?.files?.[0]) formData.append('image', productImgRef.current.files[0]);

    try {
      const res = await fetch(`http://localhost:5000/api/vendor/products`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        alert('Product securely published!');
        setIsProductModalOpen(false);
        setProductName(''); setProductPrice(''); setProductDesc(''); setProductStock('0'); setProductSubId('');
        if (productImgRef.current) productImgRef.current.value = '';
        fetchVendorData();
      } else {
        alert(data.message);
      }
    } catch (e) { alert('Failed to upload product.'); }
  };

  const deleteProduct = async (id: string) => {
    if (!window.confirm("Delete this product permanently?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/vendor/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if ((await res.json()).success) fetchVendorData();
    } catch (e) { alert('Failed to delete product'); }
  };

  const toggleAvailability = async (id: string, current: boolean) => {
    try {
      const formData = new FormData();
      formData.append('isAvailable', String(!current));
      const res = await fetch(`http://localhost:5000/api/vendor/products/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (data.success) fetchVendorData();
      else alert(data.message || 'Toggle failed');
    } catch (e) { alert('Network error'); }
  };

  const generate2FA = async () => {
    if (is2FAEnabled) { alert('2FA is already enabled.'); return; }
    const res = await fetch(`http://localhost:5000/api/auth/2fa/generate`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.success) { setQrCode(data.data.qrCodeUrl); setSetupSecret(data.data.secret); }
  };
  const confirm2FA = async () => {
    const res = await fetch(`http://localhost:5000/api/auth/2fa/enable`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ token: otpToken })
    });
    const data = await res.json();
    if (data.success) { alert('2FA Enabled Successfully! Highly Secure.'); setIs2FAEnabled(true); setQrCode(''); setOtpToken(''); }
    else alert(data.message || 'Invalid code. Enter the 6-digit code from your Authenticator app.');
  };
  const disable2FA = async () => {
    if (!confirm('Disable Two-Factor Authentication? Your Vendor account will be highly vulnerable.')) return;
    const res = await fetch(`http://localhost:5000/api/auth/2fa/disable`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.success) { alert(data.message); setIs2FAEnabled(false); }
  };

  if (!isMounted || !authorized) return null;

  return (
    <div className="layout-app">
      <nav className="side-nav">
        <div className="nav-header">
          <img src="/logo.png" alt="NATION MARKET" className="dashboard-logo" />
          <span className="portal-badge">VENDOR PORTAL</span>
        </div>
        <div className="scrollable-menu">
          <button className={`nav-item ${activeTab === 'Overview' ? 'active' : ''}`} onClick={() => setActiveTab('Overview')}><TrendingUp size={20} /> Dashboard</button>
          <button className={`nav-item ${activeTab === 'Products' ? 'active' : ''}`} onClick={() => setActiveTab('Products')}><Package size={20} /> Products Catalog</button>
          <button className={`nav-item ${activeTab === 'Subcategories' ? 'active' : ''}`} onClick={() => setActiveTab('Subcategories')}><Layers size={20} /> Subcategories</button>
          <button className={`nav-item ${activeTab === 'Orders' ? 'active' : ''}`} onClick={() => setActiveTab('Orders')}><ListOrdered size={20} /> Orders & Fulfillment</button>
          <button className={`nav-item ${activeTab === 'Payments' ? 'active' : ''}`} onClick={() => setActiveTab('Payments')}><DollarSign size={20} /> Earnings & Payouts</button>
          <button className={`nav-item ${activeTab === 'StoreFront' ? 'active' : ''}`} onClick={() => setActiveTab('StoreFront')}><Store size={20} /> Store Settings</button>
          <button className={`nav-item ${activeTab === 'Security Settings' ? 'active' : ''}`} onClick={() => setActiveTab('Security Settings')}><Settings size={20} /> Security & 2FA</button>
        </div>
        <div className="nav-footer">
          <button className="logout-button" onClick={logout}><LogOut size={20} /> Logout</button>
        </div>
      </nav>

      <main className="main-zone">
        <header className="top-header">
          <div>
            <h1>{user?.firstName ? `Welcome back, ${user.firstName}` : 'Vendor Dashboard'}</h1>
            <p className="subtitle">Manage your inventory, process orders, and scale your business.</p>
          </div>
          
          <div className="store-status-box">
             {vendorProfile?.logoUrl ? (
                <img src={optimizeCloudinaryUrl(vendorProfile.logoUrl, 100, 'fill')} alt="Logo" className="store-avatar" style={{ objectFit: 'cover' }} />
             ) : (
                <div className="store-avatar"><Store size={24} color="#005b9f" /></div>
             )}
             <div className="store-meta">
               <span className="store-name">{vendorProfile?.storeName || 'Your Nation Store'}</span>
               <span className="status-badge online">🟢 Accepting Orders</span>
             </div>
          </div>
        </header>

        {activeTab === 'Overview' && (
          <div className="tab-pane fade-in">
            {/* Same metrics grid */}
            <div className="metrics-grid">
              <div className="metric-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('Payments')} title="View Earnings & Payouts">
                <div className="metric-icon bg-blue-100 text-blue-600"><DollarSign size={24} /></div>
                <div><h4>Total Revenue</h4><div className="metric-val">₦ 0.00</div></div>
              </div>
              <div className="metric-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('Orders')} title="View Orders & Fulfillment">
                <div className="metric-icon bg-green-100 text-green-600"><ListOrdered size={24} /></div>
                <div><h4>Pending Orders</h4><div className="metric-val">0</div></div>
              </div>
              <div className="metric-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('Products')} title="View Products Catalog">
                <div className="metric-icon bg-purple-100 text-purple-600"><Package size={24} /></div>
                <div><h4>Active Products</h4><div className="metric-val">{vendorProducts.length}</div></div>
              </div>
              <div className="metric-card">
                <div className="metric-icon bg-yellow-100 text-yellow-600"><Star size={24} /></div>
                <div><h4>Store Rating</h4><div className="metric-val">N/A</div></div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Subcategories' && (
          <div className="tab-pane fade-in">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h2>My Categories (Business Categories)</h2>
                <p className="subtitle text-sm">Select the official platform subcategories that apply to your store.</p>
              </div>
            </div>

            <div className="category-selection-card" style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <h3 style={{ marginBottom: '1rem', color: '#374151' }}>Available Subcategories for {vendorProfile?.businessType}</h3>
              
              {availableSubcategories.length === 0 ? (
                <p style={{ color: '#6b7280' }}>No official subcategories found for your primary category yet.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                  {availableSubcategories.map(sub => (
                    <label key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '6px', background: selectedSubIds.includes(sub.id) ? '#f0fdf4' : '#fff', transition: 'all 0.2s' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedSubIds.includes(sub.id)}
                        onChange={() => toggleSubcategory(sub.id)}
                        style={{ width: '18px', height: '18px', accentColor: '#16a34a' }}
                      />
                      <span style={{ fontSize: '0.95rem', fontWeight: selectedSubIds.includes(sub.id) ? '600' : '400', color: '#1f2937' }}>{sub.name}</span>
                    </label>
                  ))}
                </div>
              )}
              
              <button className="primary-btn" onClick={handleLinkSubcategories} disabled={availableSubcategories.length === 0}>Save Category Selections</button>
            </div>
          </div>
        )}

        {activeTab === 'Products' && (
          <div className="tab-pane fade-in">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h2>Product Catalog</h2>
                {vendorProfile && <span className="cat-badge">{vendorProfile.businessType?.toUpperCase()}</span>}
              </div>
              <button className="primary-btn" onClick={() => setIsProductModalOpen(true)}><Plus size={18} /> Add New Product</button>
            </div>
            
            {vendorSubcategories.length > 0 && (
              <div className="order-filters mt-2 mb-3" style={{ overflowX: 'auto', whiteSpace: 'nowrap', paddingBottom: '0.5rem' }}>
                <button 
                  className={`filter-chip ${activeProductFilter === 'All Products' ? 'active' : ''}`}
                  onClick={() => setActiveProductFilter('All Products')}
                >
                  All Products
                </button>
                {vendorSubcategories.map(sub => (
                  <button 
                    key={sub.id}
                    className={`filter-chip ${activeProductFilter === sub.id ? 'active' : ''}`}
                    onClick={() => setActiveProductFilter(sub.id)}
                  >
                    {sub.name}
                  </button>
                ))}
              </div>
            )}

            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vendorProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="table-empty">
                      You have not uploaded any products yet. Click "Add New Product" to populate your digital shelves!
                    </td>
                  </tr>
                ) : vendorProducts.filter(p => activeProductFilter === 'All Products' || p.subcategoryId === activeProductFilter).map(p => (
                  <tr key={p.id}>
                    <td style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      {p.images && <img src={optimizeCloudinaryUrl(p.images, 150, 'fill')} alt="prod" loading="lazy" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px' }} />}
                      <div>
                        <div className="font-bold">{p.name}</div>
                        <div className="text-sm">{p.subcategory?.name || 'Uncategorized'}</div>
                      </div>
                    </td>
                    <td className="font-bold">₦ {p.price.toLocaleString()}</td>
                    <td>{p.inventory} units</td>
                    <td>
                      <button
                        onClick={() => toggleAvailability(p.id, p.isAvailable)}
                        style={{
                          padding: '0.3rem 0.85rem',
                          borderRadius: '20px',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          border: 'none',
                          background: p.isAvailable ? '#dcfce7' : '#fee2e2',
                          color: p.isAvailable ? '#166534' : '#dc2626',
                          transition: 'all 0.2s'
                        }}
                      >
                        {p.isAvailable ? '🟢 In Stock' : '🔴 Out of Stock'}
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button
                          style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', fontWeight: 600, padding: '0.35rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem' }}
                          onClick={() => openEditModal(p)}
                        >Edit</button>
                        <button className="disable-btn" onClick={() => deleteProduct(p.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Existing active tabs simplified for StoreFront */}
        {activeTab === 'StoreFront' && (
          <div className="tab-pane fade-in">
            <h2>Store Operations Profile</h2>
            <p className="text-sm">Customize how your store appears organically to consumers on the main marketplace.</p>
            
            {vendorProfile?.coverUrl && (
               <img src={optimizeCloudinaryUrl(vendorProfile.coverUrl, 1200, 'fill')} alt="Store Cover" style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '12px', marginTop: '1rem' }} loading="lazy" />
            )}

            <div className="settings-grid mt-2">
               <div className="settings-box">
                  <h4>Store Identity</h4>
                  <div className="form-group pb-1">
                    <label>Store Name</label>
                    <input type="text" value={storeNameForm} onChange={e => setStoreNameForm(e.target.value)} />
                  </div>
                  <div className="form-group pb-1">
                    <label>Store Description</label>
                    <textarea rows={3} value={storeDescForm} onChange={e => setStoreDescForm(e.target.value)}></textarea>
                  </div>
                  <div className="form-group pb-1">
                    <label>Physical Address</label>
                    <input type="text" value={storeAddressForm} onChange={e => setStoreAddressForm(e.target.value)} />
                  </div>
                   <div className="form-group pb-1">
                     <label>Opening Hours</label>
                     <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', marginTop: '0.4rem' }}>
                       {scheduleForm.map((day, i) => (
                         <div key={day.day} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 1rem', borderBottom: i < 6 ? '1px solid #f3f4f6' : 'none', background: day.isOpen ? '#fff' : '#f9fafb' }}>
                           <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: '38px', cursor: 'pointer' }}>
                             <input type="checkbox" checked={day.isOpen} onChange={e => updateScheduleDay(i, 'isOpen', e.target.checked)}
                               style={{ width: '16px', height: '16px', accentColor: '#1d4ed8', cursor: 'pointer' }} />
                           </label>
                           <span style={{ minWidth: '90px', fontWeight: 600, fontSize: '0.82rem', color: day.isOpen ? '#111827' : '#9ca3af' }}>{day.day}</span>
                           {day.isOpen ? (
                             <>
                               <select value={day.open} onChange={e => updateScheduleDay(i, 'open', e.target.value)}
                                 style={{ flex: 1, padding: '0.35rem 0.5rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.8rem', background: '#fff' }}>
                                 {TIME_SLOTS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                               </select>
                               <span style={{ color: '#6b7280', fontSize: '0.8rem', fontWeight: 500 }}>to</span>
                               <select value={day.close} onChange={e => updateScheduleDay(i, 'close', e.target.value)}
                                 style={{ flex: 1, padding: '0.35rem 0.5rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.8rem', background: '#fff' }}>
                                 {TIME_SLOTS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                               </select>
                             </>
                           ) : (
                             <span style={{ flex: 1, fontSize: '0.8rem', color: '#9ca3af', fontStyle: 'italic' }}>Closed</span>
                           )}
                         </div>
                       ))}
                     </div>
                   </div>
                  <button className="primary-btn mt-1" onClick={handleUpdateStore}>Save Entire Profile</button>
               </div>
               
               <div className="settings-box">
                  <h4>Business Cover Asset</h4>

                  {/* Cover — current or local preview */}
                  {(coverPreview || vendorProfile?.coverUrl) && (
                    <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                      <img
                        src={coverPreview || optimizeCloudinaryUrl(vendorProfile!.coverUrl, 800, 'fill')}
                        alt="Store Cover"
                        loading="lazy"
                        style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '10px', display: 'block' }}
                      />
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    <label htmlFor="coverUploadInput" style={{ cursor: 'pointer' }}>
                      <span className="outline-btn" style={{ display: 'inline-block', cursor: 'pointer' }}>
                        {vendorProfile?.coverUrl || coverPreview ? '🔄 Change Banner' : '📷 Select Banner'}
                      </span>
                    </label>
                    {(vendorProfile?.coverUrl || coverPreview) && (
                      <button
                        type="button"
                        style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontWeight: 600, padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem' }}
                        onClick={async () => {
                          if (!window.confirm('Delete the store banner permanently?')) return;
                          const fd = new FormData();
                          fd.append('storeName', storeNameForm);
                          fd.append('description', storeDescForm);
                          fd.append('address', storeAddressForm);
                          fd.append('openingHours', JSON.stringify(scheduleForm));
                          fd.append('clearCover', 'true');
                          const res = await fetch('http://localhost:5000/api/vendor/store', { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: fd });
                          const d = await res.json();
                          if (d.success) { setCoverPreview(''); setCoverFileName(''); if (coverInputRef.current) coverInputRef.current.value = ''; fetchVendorData(); } else alert(d.message);
                        }}
                      >🗑 Delete Banner</button>
                    )}
                  </div>
                  <input
                    id="coverUploadInput"
                    type="file"
                    ref={coverInputRef}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setCoverPreview(URL.createObjectURL(file));
                        uploadStoreImage('coverUpload', file);
                      }
                    }}
                  />


                  <h4 style={{ marginTop: '2rem' }}>Store Logo (Square)</h4>

                  {/* Logo — current or local preview */}
                  {(logoPreview || vendorProfile?.logoUrl) && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <img
                        src={logoPreview || optimizeCloudinaryUrl(vendorProfile!.logoUrl, 200, 'fill')}
                        alt="Store Logo"
                        loading="lazy"
                        style={{ width: '90px', height: '90px', objectFit: 'cover', borderRadius: '50%', border: '3px solid #e5e7eb', display: 'block' }}
                      />
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    <label htmlFor="logoUploadInput" style={{ cursor: 'pointer' }}>
                      <span className="outline-btn" style={{ display: 'inline-block', cursor: 'pointer' }}>
                        {vendorProfile?.logoUrl || logoPreview ? '🔄 Change Logo' : '📷 Select Logo'}
                      </span>
                    </label>
                    {(vendorProfile?.logoUrl || logoPreview) && (
                      <button
                        type="button"
                        style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontWeight: 600, padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem' }}
                        onClick={async () => {
                          if (!window.confirm('Delete the store logo permanently?')) return;
                          const fd = new FormData();
                          fd.append('storeName', storeNameForm);
                          fd.append('description', storeDescForm);
                          fd.append('address', storeAddressForm);
                          fd.append('openingHours', JSON.stringify(scheduleForm));
                          fd.append('clearLogo', 'true');
                          const res = await fetch('http://localhost:5000/api/vendor/store', { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: fd });
                          const d = await res.json();
                          if (d.success) { setLogoPreview(''); setLogoFileName(''); if (logoInputRef.current) logoInputRef.current.value = ''; fetchVendorData(); } else alert(d.message);
                        }}
                      >🗑 Delete Logo</button>
                    )}
                  </div>
                  <input
                    id="logoUploadInput"
                    type="file"
                    ref={logoInputRef}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setLogoPreview(URL.createObjectURL(file));
                        uploadStoreImage('logoUpload', file);
                      }
                    }}
                  />

               </div>
            </div>
          </div>
        )}

        {activeTab === 'Orders' && (
          <div className="tab-pane fade-in">
            <h2>Orders & Fulfillment</h2>
            <p className="text-sm">Manage and fulfill customer orders placed at your store.</p>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', margin: '1.5rem 0 1rem', flexWrap: 'wrap' }}>
              {['All Orders', 'PENDING', 'ACCEPTED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'].map(f => (
                <button key={f} onClick={() => setActiveOrderFilter(f)}
                  style={{ padding: '0.4rem 1rem', borderRadius: '20px', border: '1px solid #e5e7eb', background: activeOrderFilter === f ? '#1d4ed8' : '#fff', color: activeOrderFilter === f ? '#fff' : '#374151', fontWeight: 600, cursor: 'pointer', fontSize: '0.82rem' }}>
                  {f === 'IN_TRANSIT' ? 'In Transit' : f.charAt(0) + f.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            {(() => {
              const filtered = vendorOrders.filter(o => activeOrderFilter === 'All Orders' || o.status === activeOrderFilter);
              if (filtered.length === 0) return (
                <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                  <ListOrdered size={48} color="#9ca3af" style={{ margin: '0 auto 1rem' }} />
                  <h3 style={{ color: '#111827', margin: '0 0 0.5rem' }}>No {activeOrderFilter === 'All Orders' ? '' : activeOrderFilter.toLowerCase()} orders yet</h3>
                  <p style={{ color: '#6b7280', margin: 0 }}>Orders from customers will appear here.</p>
                </div>
              );
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {filtered.map((order: any) => {
                    const statusColors: Record<string, { bg: string; color: string }> = {
                      PENDING:    { bg: '#fef3c7', color: '#92400e' },
                      ACCEPTED:   { bg: '#dbeafe', color: '#1e40af' },
                      IN_TRANSIT: { bg: '#ede9fe', color: '#5b21b6' },
                      DELIVERED:  { bg: '#dcfce7', color: '#15803d' },
                      CANCELLED:  { bg: '#fee2e2', color: '#991b1b' },
                    };
                    const sc = statusColors[order.status] || { bg: '#f3f4f6', color: '#374151' };
                    const nextActions: Record<string, { label: string; status: string; color: string }[]> = {
                      PENDING:    [{ label: 'Accept Order', status: 'ACCEPTED', color: '#1d4ed8' }, { label: 'Cancel', status: 'CANCELLED', color: '#dc2626' }],
                      ACCEPTED:   [{ label: 'Mark In Transit', status: 'IN_TRANSIT', color: '#7c3aed' }, { label: 'Cancel', status: 'CANCELLED', color: '#dc2626' }],
                      IN_TRANSIT: [{ label: 'Mark Delivered', status: 'DELIVERED', color: '#16a34a' }],
                      DELIVERED:  [],
                      CANCELLED:  [],
                    };
                    const actions = nextActions[order.status] || [];

                    const changeStatus = async (status: string) => {
                      const res = await fetch(`http://localhost:5000/api/vendor/orders/${order.id}/status`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ status })
                      });
                      const d = await res.json();
                      if (d.success) fetchVendorData();
                      else alert(d.message);
                    };

                    return (
                      <div key={order.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                          <div>
                            <p style={{ fontWeight: 700, fontSize: '0.95rem', margin: '0 0 0.2rem', color: '#111827' }}>
                              {order.customer.firstName} {order.customer.lastName}
                            </p>
                            <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: 0 }}>{order.customer.email} · {order.customer.phone || 'No phone'}</p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <span style={{ background: sc.bg, color: sc.color, padding: '0.3rem 0.85rem', borderRadius: '20px', fontWeight: 700, fontSize: '0.8rem' }}>
                              {order.status === 'IN_TRANSIT' ? 'In Transit' : order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                            </span>
                            <span style={{ fontWeight: 700, color: '#111827', fontSize: '0.95rem' }}>₦{order.total?.toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Items */}
                        <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '0.75rem', marginBottom: '0.75rem' }}>
                          {order.items.map((item: any) => (
                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#374151', padding: '0.2rem 0' }}>
                              <span>× {item.quantity} &nbsp; {item.product.name}</span>
                              <span style={{ fontWeight: 600 }}>₦{(item.price * item.quantity).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>

                        {/* Payment & Type */}
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#6b7280', marginBottom: actions.length > 0 ? '0.75rem' : 0 }}>
                          <span>Type: <strong style={{ color: '#374151' }}>{order.type}</strong></span>
                          <span>Payment: <strong style={{ color: order.payment?.status === 'SUCCESS' ? '#16a34a' : '#92400e' }}>{order.payment?.status || 'N/A'}</strong></span>
                          <span>Ref: <strong style={{ color: '#374151' }}>{order.payment?.reference?.slice(0, 10) || '—'}…</strong></span>
                        </div>

                        {/* Action Buttons */}
                        {actions.length > 0 && (
                          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                            {actions.map(a => (
                              <button key={a.status} onClick={() => changeStatus(a.status)}
                                style={{ padding: '0.45rem 1.1rem', background: a.color, color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
                                {a.label}
                              </button>
                            ))}
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
        
        {activeTab === 'Payments' && (
          <div className="tab-pane fade-in">
            <h2>Earnings & Payouts</h2>
            <p className="text-sm">Store Revenue Ledgers & Gateway reconciliations.</p>
            <div className="empty-state" style={{ textAlign: 'center', padding: '4rem 1rem', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', marginTop: '2rem' }}>
              <DollarSign size={48} color="#9ca3af" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ color: '#111827', margin: '0 0 0.5rem' }}>No Payment Records</h3>
              <p style={{ color: '#6b7280', margin: 0 }}>Revenue ledgers will structurally populate when transactions scale.</p>
            </div>
          </div>
        )}

        {/* 11. SECURITY SETTINGS */}
        {activeTab === 'Security Settings' && (
          <div className="tab-pane fade-in">
            <div className="page-header"><h2>Security & Account</h2><p className="subtitle">Manage your account credentials, notifications, and structural security.</p></div>

            <div className="settings-grid mt-2">
              <div className="settings-box">
                <h4>Personal Details</h4>
                <div className="form-group"><label>FIRST NAME</label><input type="text" value={firstName} onChange={e=>setFirstName(e.target.value)} /></div>
                <div className="form-group"><label>LAST NAME</label><input type="text" value={lastName} onChange={e=>setLastName(e.target.value)} /></div>
                <button className="outline-btn w-full mt-2" onClick={() => handleUpdate('update-details', { firstName, lastName }, 'Name globally updated!')}>Update Details</button>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginTop: '1.5rem' }}>
                    <label className="toggle-switch">
                      <input type="checkbox" checked={false} onChange={generate2FA} />
                      <span className="slider"></span>
                    </label>
                    <span style={{ fontWeight: 600, color: '#4b5563' }}>Disabled</span>
                  </div>
                )}
                
                {qrCode && !is2FAEnabled && (
                  <div className="qr-container fade-in">
                    <img src={qrCode} alt="2FA QR" style={{ width: 140, height: 140, borderRadius: '8px', border: '1px solid #e5e7eb', padding: '0.5rem' }} />
                    <code style={{ background: '#f3f4f6', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: '800', letterSpacing: '2px', color: '#111827' }}>{setupSecret}</code>
                    <p className="form-hint" style={{ textAlign: 'center' }}>Scan QR or enter secret, then verify code below.</p>
                    <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                      <input type="text" value={otpToken} onChange={e=>setOtpToken(e.target.value)} placeholder="123456" maxLength={6} style={{ flex: 1, padding: '0.8rem', border: '1px solid #d1d5db', borderRadius: '8px', textAlign: 'center', letterSpacing: '4px', fontWeight: 'bold' }} />
                      <button className="primary-btn" onClick={confirm2FA}>Verify</button>
                    </div>
                  </div>
                )}
                
                {is2FAEnabled && (
                  <div className="security-alert active">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Store size={18} /> <span>Security Parameter Active. Account locked.</span>
                    </div>
                    <button className="disable-btn" onClick={disable2FA}>Disable MFA</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
      </main>

      {isProductModalOpen && (
         <div className="modal-overlay" onClick={() => setIsProductModalOpen(false)}>
           <div className="modal-content fade-in" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-3">
                 <h2 style={{ fontSize: '1.4rem', margin: 0, color: '#111827' }}>Publish New Product</h2>
                 <button onClick={() => setIsProductModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6b7280' }}><X size={24} /></button>
              </div>
              <div className="form-group pb-1">
                <label>Product Name</label>
                <input type="text" placeholder="e.g. Fresh Tomatoes, Samsung S24" value={productName} onChange={e => setProductName(e.target.value)} />
              </div>
              <div className="form-group pb-1">
                <label>Description</label>
                <textarea rows={2} value={productDesc} onChange={e => setProductDesc(e.target.value)}></textarea>
              </div>
              
              {vendorSubcategories.length > 0 && (
                <div className="form-group pb-1">
                  <label>Store Subcategory</label>
                  <select value={productSubId} onChange={e => setProductSubId(e.target.value)} style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.95rem' }}>
                    <option value="" disabled hidden>Select subcategory...</option>
                    {vendorSubcategories.map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group pb-1" style={{ flex: 1 }}>
                  <label>Price (₦)</label>
                  <input type="number" placeholder="0.00" value={productPrice} onChange={e => setProductPrice(e.target.value)} />
                </div>
                <div className="form-group pb-1" style={{ flex: 1 }}>
                  <label>Inventory Stock</label>
                  <input type="number" placeholder="0" value={productStock} onChange={e => setProductStock(e.target.value)} />
                </div>
              </div>

              <div className="form-group pb-1">
                 <label>Main Product Image</label>
                 <div style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '0.65rem', background: '#f9fafb' }}>
                   <input
                     type="file"
                     ref={productImgRef}
                     accept="image/*"
                     style={{ width: '100%', fontSize: '0.9rem' }}
                   />
                 </div>
              </div>
              
              <button className="primary-btn mt-2" style={{ width: '100%', justifyContent: 'center' }} onClick={createProduct}>
                Publish Inventory Item 🚀
              </button>
           </div>
         </div>
      )}

      {/* EDIT PRODUCT MODAL */}
      {editingProduct && (
        <div className="modal-overlay" onClick={() => setEditingProduct(null)}>
          <div className="modal-content fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h2 style={{ fontSize: '1.4rem', margin: 0, color: '#111827' }}>Edit Product</h2>
              <button onClick={() => setEditingProduct(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6b7280' }}><X size={24} /></button>
            </div>
            <div className="form-group pb-1">
              <label>Product Name</label>
              <input type="text" value={editName} onChange={e => setEditName(e.target.value)} />
            </div>
            <div className="form-group pb-1">
              <label>Description</label>
              <textarea rows={2} value={editDesc} onChange={e => setEditDesc(e.target.value)}></textarea>
            </div>
            {vendorSubcategories.length > 0 && (
              <div className="form-group pb-1">
                <label>Store Subcategory</label>
                <select value={editSubId} onChange={e => setEditSubId(e.target.value)} style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.95rem' }}>
                  <option value="">No subcategory</option>
                  {vendorSubcategories.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div className="form-group pb-1" style={{ flex: 1 }}>
                <label>Price (₦)</label>
                <input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)} />
              </div>
              <div className="form-group pb-1" style={{ flex: 1 }}>
                <label>Inventory Stock</label>
                <input type="number" value={editStock} onChange={e => setEditStock(e.target.value)} />
              </div>
            </div>
            <div className="form-group pb-1">
              <label>Replace Image (optional)</label>
              <div style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '0.65rem', background: '#f9fafb' }}>
                {editingProduct.images && (
                  <img src={optimizeCloudinaryUrl(editingProduct.images, 100, 'fill')} alt="current" loading="lazy" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', marginBottom: '0.5rem', display: 'block' }} />
                )}
                <input type="file" ref={editImgRef} accept="image/*" style={{ width: '100%', fontSize: '0.9rem' }} />
              </div>
            </div>
            <button className="primary-btn mt-2" style={{ width: '100%', justifyContent: 'center' }} onClick={updateProduct}>
              Save Changes ✓
            </button>
          </div>
        </div>
      )}

      {/* KEEP STYLES FROM ORIGINAL PLUS MINOR ADDITIONS */}
      <style>{`
        .layout-app { display: flex; min-height: 100vh; background: #f9fafb; font-family: -apple-system, sans-serif; }
        .side-nav { width: 280px; background: white; border-right: 1px solid #e5e7eb; display: flex; flex-direction: column; }
        .nav-header { padding: 1.5rem; border-bottom: 1px solid #e5e7eb; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
        .dashboard-logo { height: 90px; object-fit: contain; margin: -20px 0; }
        .portal-badge { background: #005b9f; color: white; padding: 0.25rem 0.75rem; border-radius: 4px; font-size: 0.75rem; font-weight: 800; letter-spacing: 0.5px; }
        
        .scrollable-menu { flex: 1; padding: 1.5rem 1rem; display: flex; flex-direction: column; gap: 0.5rem; overflow-y: auto; }
        .nav-item { display: flex; align-items: center; gap: 0.85rem; padding: 0.85rem 1rem; color: #4b5563; text-decoration: none; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; background: transparent; width: 100%; text-align: left; font-size: 0.95rem; }
        .nav-item:hover { background: #f3f4f6; color: #111827; }
        .nav-item.active { background: #eff6ff; color: #005b9f; }
        
        .nav-footer { padding: 1.5rem; border-top: 1px solid #e5e7eb; }
        .logout-button { display: flex; align-items: center; justify-content: center; gap: 0.75rem; width: 100%; border: 1px solid #fecaca; background: #fef2f2; color: #dc2626; padding: 0.85rem; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s; }
        .logout-button:hover { background: #fee2e2; }

        .main-zone { flex: 1; padding: 2.5rem 3rem; overflow-y: auto; }
        
        .top-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .top-header h1 { font-size: 2rem; margin: 0 0 0.25rem 0; color: #111827; font-weight: 800; letter-spacing: -0.5px; }
        .subtitle { margin: 0; color: #6b7280; font-size: 1.05rem; }
        
        .store-status-box { background: white; padding: 0.75rem 1.25rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); display: flex; align-items: center; gap: 1rem; border: 1px solid #e5e7eb; }
        .store-avatar { width: 44px; height: 44px; background: #eff6ff; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .store-meta { display: flex; flex-direction: column; gap: 0.15rem; }
        .store-name { font-weight: 700; color: #111827; font-size: 0.95rem; }
        .status-badge { font-size: 0.75rem; font-weight: 700; padding: 0.2rem 0.5rem; border-radius: 12px; display: inline-block; width: max-content; }
        .status-badge.online { background: #dcfce7; color: #166534; }

        .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; }
        .metric-card { background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); border: 1px solid #e5e7eb; display: flex; align-items: center; gap: 1.25rem; }
        .metric-icon { width: 56px; height: 56px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .bg-blue-100 { background: #dbeafe; } .text-blue-600 { color: #2563eb; }
        .bg-green-100 { background: #dcfce7; } .text-green-600 { color: #16a34a; }
        .bg-purple-100 { background: #f3e8ff; } .text-purple-600 { color: #9333ea; }
        .bg-yellow-100 { background: #fef9c3; } .text-yellow-600 { color: #ca8a04; }
        .metric-card h4 { margin: 0 0 0.25rem 0; font-size: 0.9rem; color: #6b7280; font-weight: 600; }
        .metric-val { font-size: 1.7rem; font-weight: 800; color: #111827; letter-spacing: -0.5px; }

        .flex { display: flex; } .justify-between { justify-content: space-between; } .items-center { align-items: center; }
        .mb-3 { margin-bottom: 1rem; } .mb-2 { margin-bottom: 0.75rem; } .mt-4 { margin-top: 2rem; } .mt-2 { margin-top: 1rem; } .mt-1 { margin-top: 0.5rem; } .pb-1 { padding-bottom: 0.75rem; }
        
        .data-table { width: 100%; border-collapse: separate; border-spacing: 0; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background: white; }
        .data-table th { background: #f9fafb; padding: 1rem; text-align: left; font-size: 0.85rem; font-weight: 700; color: #4b5563; text-transform: uppercase; border-bottom: 1px solid #e5e7eb; }
        .data-table td { padding: 1rem; border-bottom: 1px solid #e5e7eb; color: #111827; font-size: 0.95rem; }
        .table-empty { text-align: center !important; color: #6b7280 !important; padding: 3rem 1rem !important; font-weight: 500; }

        .order-filters { display: flex; gap: 0.5rem; }
        .filter-chip { padding: 0.5rem 1rem; background: white; border: 1px solid #d1d5db; border-radius: 20px; font-size: 0.85rem; font-weight: 600; color: #4b5563; cursor: pointer; transition: 0.2s; }
        .filter-chip.active { background: #005b9f; color: white; border-color: #005b9f; }

        .primary-btn { display: flex; align-items: center; gap: 0.5rem; background: #005b9f; color: white; border: none; padding: 0.75rem 1.25rem; border-radius: 6px; font-weight: 600; cursor: pointer; transition: 0.2s; font-size: 0.95rem; }
        .primary-btn:hover { background: #00467a; }
        .outline-btn { background: white; border: 1px solid #005b9f; color: #005b9f; font-weight: 600; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; transition: 0.2s; }
        .disable-btn { background: transparent; border: none; color: #ef4444; font-weight: 600; text-decoration: underline; cursor: pointer; font-size: 0.9rem; }

        .settings-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 2rem; }
        .settings-box { background: white; padding: 2rem; border-radius: 8px; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .settings-box h4 { margin: 0 0 1.5rem 0; font-size: 1.15rem; color: #111827; font-weight: 700; border-bottom: 2px solid #f3f4f6; padding-bottom: 0.75rem; }
        .form-group { margin-bottom: 1.25rem; }
        .form-group label { display: block; font-size: 0.75rem; font-weight: 700; margin-bottom: 0.4rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
        .form-group input, .form-group textarea { width: 100%; padding: 0.8rem 1rem; border: 1px solid #d1d5db; border-radius: 8px; outline: none; transition: all 0.2s; font-size: 0.95rem; color: #111827; font-family: inherit; }
        .form-group input:focus, .form-group textarea:focus { border-color: #005b9f; box-shadow: 0 0 0 3px rgba(0,91,159,0.1); }
        .form-hint { font-size: 0.9rem; color: #6b7280; margin: 0 0 1rem 0; line-height: 1.5; }
        .cover-uploader { border: 2px dashed #d1d5db; border-radius: 8px; padding: 2rem; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; background: #f9fafb; margin-top: 1rem; }

        /* ── 2FA ── */
        .toggle-switch { position: relative; display: inline-block; width: 44px; height: 24px; cursor: pointer; }
        .toggle-switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: #d1d5db; border-radius: 24px; transition: .3s; }
        .slider:before { position: absolute; content: ''; height: 18px; width: 18px; left: 3px; bottom: 3px; background: white; border-radius: 50%; transition: .3s; }
        input:checked + .slider { background: #16a34a; }
        input:checked + .slider:before { transform: translateX(20px); }
        .security-alert { padding: 0.75rem 1rem; border-radius: 8px; font-weight: 700; display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; }
        .security-alert.active { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
        .disable-btn { background: transparent; border: none; color: #ef4444; font-weight: 600; text-decoration: underline; cursor: pointer; font-size: 0.9rem; }
        .qr-container { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; margin-top: 1rem; }
        .w-full { width: 100%; }

        .tab-pane { padding: 0; }
        .tab-pane h2 { margin: 0 0 0.5rem 0; color: #111827; font-size: 1.8rem; font-weight: 800; }
        .cat-badge { display: inline-block; background: #e0e7ff; color: #4338ca; padding: 0.25rem 0.6rem; border-radius: 4px; font-size: 0.75rem; font-weight: 800; }
        
        .fade-in { animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .text-sm { font-size: 0.95rem; color: #6b7280; }
        .font-bold { font-weight: 700; }
        
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(17, 24, 39, 0.7); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 1.5rem; }
        .modal-content { background: white; padding: 2.5rem; border-radius: 16px; width: 100%; max-width: 500px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); }
      `}</style>
    </div>
  );
}
