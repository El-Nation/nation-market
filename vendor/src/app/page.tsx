'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '../store/authStore';
import { Store, Package, ListOrdered, DollarSign, Settings, LogOut, TrendingUp, Star, Box, Search, Plus, X } from 'lucide-react';

const SUBCATEGORIES: Record<string, string[]> = {
  'Supermarket': ['Beverages', 'Snacks', 'Toiletries', 'Fresh Produce', 'Grains & Pasta', 'Canned Goods', 'Cleaning Supplies'],
  'Fashion': ['Men\'s Wear', 'Women\'s Wear', 'Footwear', 'Accessories', 'Skincare', 'Makeup', 'Haircare'],
  'Electronics': ['Smartphones', 'Computers', 'Audio & Speakers', 'Home Appliances', 'Gaming', 'Wearables'],
  'Restaurant': ['Fast Food', 'Local Dishes', 'Intercontinental', 'Pastries & Desserts', 'Drinks & Smoothies', 'Grills & BBQ'],
  'Agriculture': ['Livestock', 'Poultry', 'Fish & Seafood', 'Farm Produce', 'Animal Feed', 'Seeds & Seedlings'],
  'Pharmacy': ['Prescription Drugs', 'Over-The-Counter', 'Supplements', 'First Aid', 'Medical Devices', 'Personal Care'],
  'Books': ['Educational Textbooks', 'Novels & Fiction', 'Children\'s Books', 'Stationery', 'Journals', 'Study Guides']
};

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token, login, logout } = useAuthStore();
  const [authorized, setAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');
  const [isMounted, setIsMounted] = useState(false);
  const [vendorProfile, setVendorProfile] = useState<{ storeName: string, businessType: string } | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeOrderFilter, setActiveOrderFilter] = useState('All Orders');
  
  const [activeProductFilter, setActiveProductFilter] = useState('All Products');
  const [productSubcategory, setProductSubcategory] = useState('');
  
  const currentCategory = vendorProfile?.businessType?.split(' - ')[0] || '';
  const availableSubcategories = SUBCATEGORIES[currentCategory] || [];

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

  useEffect(() => {
    if (user?.firstName || user?.lastName || user?.email) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setEmail(user.email || '');
    }
  }, [user?.firstName, user?.lastName, user?.email]);

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
        if (endpoint === 'update-password') {
          setCurrentPassword('');
          setNewPassword('');
        }
      } else {
        alert(data.message || 'Operation failed');
      }
    } catch (e) {
      alert('Network Error');
    }
  };

  const generate2FA = async () => {
    if (is2FAEnabled) {
      alert('2FA is already enabled on your account.');
      return;
    }
    const res = await fetch(`http://localhost:5000/api/auth/2fa/generate`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      setQrCode(data.data.qrCodeUrl);
      setSetupSecret(data.data.secret);
    }
  };

  const confirm2FA = async () => {
    const res = await fetch(`http://localhost:5000/api/auth/2fa/enable`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ token: otpToken })
    });
    const data = await res.json();
    if (data.success) {
      alert('Two-Factor Authentication Successfully Secured!');
      setIs2FAEnabled(true);
      setQrCode('');
      setOtpToken('');
    } else {
      alert(data.message || 'Invalid Code');
    }
  };

  const disable2FA = async () => {
    if (!window.confirm("Are you sure you want to disable Two-Factor Authentication? Your account will be less secure.")) return;
    
    const res = await fetch(`http://localhost:5000/api/auth/2fa/disable`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      alert(data.message);
      setIs2FAEnabled(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    const urlToken = searchParams.get('token');
    const urlRole = searchParams.get('role');
    if (urlToken && urlRole) {
      login(urlToken, urlRole);
      router.replace('/');
      return;
    }
    
    if (!token || user?.role !== 'VENDOR') {
      window.location.href = 'http://localhost:3000/login';
    } else {
      setAuthorized(true);
      fetch('http://localhost:5000/api/vendor/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setVendorProfile(data.data);
        }
      })
      .catch(e => console.error("Profile fetch error", e));
    }
  }, [searchParams, token, user, login, router]);

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
             <div className="store-avatar"><Store size={24} color="#005b9f" /></div>
             <div className="store-meta">
               <span className="store-name">{vendorProfile?.storeName || 'Your Nation Store'}</span>
               <span className="status-badge online">🟢 Accepting Orders</span>
             </div>
          </div>
        </header>

        {activeTab === 'Overview' && (
          <div className="tab-pane fade-in">
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-icon bg-blue-100 text-blue-600"><DollarSign size={24} /></div>
                <div><h4>Total Revenue</h4><div className="metric-val">₦ 0.00</div></div>
              </div>
              <div className="metric-card">
                <div className="metric-icon bg-green-100 text-green-600"><ListOrdered size={24} /></div>
                <div><h4>Pending Orders</h4><div className="metric-val">0</div></div>
              </div>
              <div className="metric-card">
                <div className="metric-icon bg-purple-100 text-purple-600"><Package size={24} /></div>
                <div><h4>Active Products</h4><div className="metric-val">0</div></div>
              </div>
              <div className="metric-card">
                <div className="metric-icon bg-yellow-100 text-yellow-600"><Star size={24} /></div>
                <div><h4>Store Rating</h4><div className="metric-val">N/A</div></div>
              </div>
            </div>

            <h3 className="section-title mt-4">Recent Order Activity</h3>
            <div className="empty-state">
               <Box size={48} color="#d1d5db" className="mx-auto block mb-2" />
               <p>Your store is freshly launched.</p>
               <span className="text-sm">When customers place orders on the core Nation Market platform, they will securely sync here.</span>
            </div>
          </div>
        )}

        {activeTab === 'Products' && (
          <div className="tab-pane fade-in">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h2>Product Catalog</h2>
                {vendorProfile && <span className="cat-badge">{currentCategory.toUpperCase()}</span>}
              </div>
              <button className="primary-btn" onClick={() => setIsProductModalOpen(true)}><Plus size={18} /> Add New Product</button>
            </div>
            
            {availableSubcategories.length > 0 && (
              <div className="order-filters mt-2 mb-3" style={{ overflowX: 'auto', whiteSpace: 'nowrap', paddingBottom: '0.5rem' }}>
                <button 
                  className={`filter-chip ${activeProductFilter === 'All Products' ? 'active' : ''}`}
                  onClick={() => setActiveProductFilter('All Products')}
                >
                  All Products
                </button>
                {availableSubcategories.map((sub: string) => (
                  <button 
                    key={sub}
                    className={`filter-chip ${activeProductFilter === sub ? 'active' : ''}`}
                    onClick={() => setActiveProductFilter(sub)}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            )}

            <div className="search-bar">
               <Search size={18} color="#9ca3af" />
               <input type="text" placeholder="Search your catalog by name or SKU..." />
            </div>
            
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={6} className="table-empty">
                    You have not uploaded any products yet. Click "Add New Product" to populate your digital shelves!
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'Orders' && (
          <div className="tab-pane fade-in">
            <h2>Order Fulfillment</h2>
            <div className="order-filters mt-2">
              {['All Orders', 'Pending', 'Processing', 'Ready for Pickup', 'Completed'].map(filter => (
                <button 
                  key={filter}
                  className={`filter-chip ${activeOrderFilter === filter ? 'active' : ''}`}
                  onClick={() => setActiveOrderFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>
            <table className="data-table mt-2">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={6} className="table-empty">
                    {activeOrderFilter === 'All Orders' 
                      ? 'No order queue currently active.'
                      : `No ${activeOrderFilter.toLowerCase()} orders at the moment.`}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'Payments' && (
          <div className="tab-pane fade-in">
            <h2>Earnings & Payouts</h2>
            <p className="text-sm">Track your commercial influx and withdrawal history.</p>
            <div className="empty-state mt-2">No earning history recorded yet.</div>
          </div>
        )}

        {activeTab === 'StoreFront' && (
          <div className="tab-pane fade-in">
            <h2>Store Operations Profile</h2>
            <p className="text-sm">Customize how your store appears organically to consumers on the main marketplace.</p>
            
            <div className="settings-grid mt-2">
               <div className="settings-box">
                  <h4>Store Identity</h4>
                  <div className="form-group pb-1">
                    <label>Store/Business Name</label>
                    <input type="text" defaultValue={vendorProfile?.storeName || "Your Nation Store"} />
                  </div>
                  <div className="form-group pb-1">
                    <label>Store Description</label>
                    <textarea rows={3} placeholder="Briefly describe what you sell to customers..."></textarea>
                  </div>
                  <button className="primary-btn mt-1">Save Profile</button>
               </div>
               
               <div className="settings-box">
                  <h4>Business Cover Asset</h4>
                  <div className="cover-uploader">
                     <Store size={48} color="#d1d5db" />
                     <p className="mt-1 font-bold text-gray-500">Upload Store Banner</p>
                     <p className="text-sm">1200 x 400px recommended (JPG or PNG)</p>
                     <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" />
                     <button className="outline-btn mt-1" onClick={() => fileInputRef.current?.click()}>Select File</button>
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'Security Settings' && (
          <div className="tab-pane fade-in">
            <h2>Security & Account</h2>
            <p className="text-sm">Manage your account credentials, notifications, and structural security.</p>
            
            <div className="settings-grid mt-2">
               <div className="settings-box">
                  <h4>Personal Details</h4>
                  <div className="form-group pb-1">
                    <label>First Name</label>
                    <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} />
                  </div>
                  <div className="form-group pb-1">
                    <label>Last Name</label>
                    <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} />
                  </div>
                  <button className="outline-btn mt-1 w-full" style={{ justifyContent: 'center' }} onClick={() => handleUpdate('update-details', { firstName, lastName }, 'Profile updated successfully!')}>Update Details</button>
               </div>

               <div className="settings-box">
                  <h4>Contact Info</h4>
                  <div className="form-group pb-1">
                    <label>Email Address</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                  <div className="form-group pb-1">
                    <label>Phone Number</label>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
                  </div>
                  <button className="outline-btn mt-1 w-full" style={{ justifyContent: 'center' }} onClick={() => handleUpdate('update-contact', { email, phone }, 'Contact info updated successfully!')}>Update Contact</button>
               </div>

               <div className="settings-box">
                  <h4>Change Password</h4>
                  <div className="form-group pb-1">
                    <label>Current Password</label>
                    <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="••••••••" />
                  </div>
                  <div className="form-group pb-1">
                    <label>New Password</label>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" />
                  </div>
                  <button className="outline-btn mt-1 w-full" style={{ justifyContent: 'center' }} onClick={() => handleUpdate('update-password', { currentPassword, newPassword }, 'Password changed securely!')}>Update Password</button>
               </div>

               <div className="settings-box">
                  <h4>Two-Factor Authentication (2FA)</h4>
                  <p className="text-sm">Add an extra layer of security to your vendor node requiring a confirmation code.</p>
                  
                  {!qrCode && !is2FAEnabled && (
                    <div className="mt-2" style={{ display: 'flex', alignItems: 'center' }}>
                      <label className="toggle-switch">
                        <input type="checkbox" onChange={generate2FA} checked={is2FAEnabled} />
                        <span className="slider"></span>
                      </label>
                      <span className="font-bold" style={{ marginLeft: '10px' }}>{is2FAEnabled ? 'Enabled' : 'Disabled'}</span>
                    </div>
                  )}

                  {is2FAEnabled && (
                     <div className="security-alert active mt-2">
                        <span>2FA is Actively Secured 🛡️</span>
                        <button onClick={disable2FA} className="disable-btn">Disable</button>
                     </div>
                  )}

                  {qrCode && (
                    <div className="qr-container mt-2">
                      <p className="font-bold text-sm mb-1 text-center">Scan this QR Code in Google Authenticator</p>
                      <img src={qrCode} alt="2FA QR Code" className="mx-auto block border rounded p-1 mb-2 bg-white qr-code-img" />
                      
                      <div className="text-center mb-3">
                        <p className="text-sm font-bold text-gray-500">OR ENTER MANUAL KEY:</p>
                        <code className="bg-gray-100 p-2 rounded block tracking-widest text-primary font-bold mt-1 text-lg">
                          {setupSecret}
                        </code>
                      </div>

                      <input 
                        type="text" 
                        value={otpToken} 
                        onChange={e => setOtpToken(e.target.value)} 
                        placeholder="Enter 6-digit code" 
                        className="w-full text-center tracking-widest text-lg py-2 border rounded"
                        maxLength={6}
                      />
                      <button className="outline-btn mt-2 w-full" onClick={confirm2FA}>Verify & Enable</button>
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
                <input type="text" placeholder="e.g. Fresh Tomatoes, Samsung S24" />
              </div>
              {availableSubcategories.length > 0 && (
                <div className="form-group pb-1">
                  <label>Store Subcategory</label>
                  <select value={productSubcategory} onChange={e => setProductSubcategory(e.target.value)} style={{ padding: '0.75rem 1rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.95rem', outline: 'none', background: '#fff' }}>
                    <option value="" disabled hidden>Select specific subcategory...</option>
                    {availableSubcategories.map((sub: string) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="form-group pb-1">
                <label>Price (₦)</label>
                <input type="number" placeholder="0.00" />
              </div>
              <div className="form-group pb-1">
                 <label>Main Product Image</label>
                 <input type="file" accept="image/*" style={{ border: '1px solid #d1d5db', padding: '0.65rem', borderRadius: '6px' }} />
              </div>
              <button className="primary-btn mt-2" style={{ width: '100%', justifyContent: 'center' }} onClick={() => {
                alert("The Cloudinary Upload Engine API integration is coming securely in the next iteration of Stage 4!");
                setIsProductModalOpen(false);
              }}>Publish Inventory Item</button>
           </div>
         </div>
      )}

      <style>{`
        .layout-app { display: flex; min-height: 100vh; background: #f9fafb; font-family: -apple-system, sans-serif; }
        
        .side-nav { width: 280px; background: white; border-right: 1px solid #e5e7eb; display: flex; flex-direction: column; }
        .nav-header { padding: 1.5rem; border-bottom: 1px solid #e5e7eb; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
        .dashboard-logo { height: 90px; object-fit: contain; margin: -20px 0; }
        .portal-badge { background: #005b9f; color: white; padding: 0.25rem 0.75rem; border-radius: 4px; font-size: 0.75rem; font-weight: 800; letter-spacing: 0.5px; }
        
        .scrollable-menu { flex: 1; padding: 1.5rem 1rem; display: flex; flex-direction: column; gap: 0.5rem; overflow-y: auto; }
        .nav-item { display: flex; align-items: center; gap: 0.85rem; padding: 0.85rem 1rem; color: #4b5563; text-decoration: none; border-radius: 8px; font-weight: 600; transition: all 0.2s; border: none; background: transparent; cursor: pointer; width: 100%; text-align: left; font-size: 0.95rem; font-family: inherit; }
        .nav-item:hover { background: #f3f4f6; color: #111827; }
        .nav-item.active { background: #eff6ff; color: #005b9f; }
        
        .nav-footer { padding: 1.5rem; border-top: 1px solid #e5e7eb; }
        .logout-button { display: flex; align-items: center; justify-content: center; gap: 0.75rem; width: 100%; border: 1px solid #fecaca; background: #fef2f2; color: #dc2626; padding: 0.85rem; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
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

        .section-title { font-size: 1.3rem; color: #111827; font-weight: 700; margin-bottom: 1rem; }
        .flex { display: flex; } .justify-between { justify-content: space-between; } .items-center { align-items: center; }
        .mb-3 { margin-bottom: 1rem; } .mb-2 { margin-bottom: 0.75rem; } .mt-4 { margin-top: 2rem; } .mt-2 { margin-top: 1rem; } .mt-1 { margin-top: 0.5rem; } .pb-1 { padding-bottom: 0.75rem; }
        
        .search-bar { display: flex; align-items: center; gap: 0.75rem; background: white; padding: 0.75rem 1rem; border: 1px solid #d1d5db; border-radius: 8px; margin-bottom: 1.5rem; }
        .search-bar input { border: none; outline: none; width: 100%; font-size: 0.95rem; color: #111827; }
        
        .data-table { width: 100%; border-collapse: separate; border-spacing: 0; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background: white; }
        .data-table th { background: #f9fafb; padding: 1rem; text-align: left; font-size: 0.85rem; font-weight: 700; color: #4b5563; text-transform: uppercase; border-bottom: 1px solid #e5e7eb; }
        .data-table td { padding: 1rem; border-bottom: 1px solid #e5e7eb; color: #111827; font-size: 0.95rem; }
        .data-table tr:last-child td { border-bottom: none; }
        .table-empty { text-align: center !important; color: #6b7280 !important; padding: 3rem 1rem !important; font-weight: 500; }

        .order-filters { display: flex; gap: 0.5rem; }
        .filter-chip { padding: 0.5rem 1rem; background: white; border: 1px solid #d1d5db; border-radius: 20px; font-size: 0.85rem; font-weight: 600; color: #4b5563; cursor: pointer; transition: 0.2s; }
        .filter-chip:hover { border-color: #005b9f; }
        .filter-chip.active { background: #005b9f; color: white; border-color: #005b9f; }

        .primary-btn { display: flex; align-items: center; gap: 0.5rem; background: #005b9f; color: white; border: none; padding: 0.75rem 1.25rem; border-radius: 6px; font-weight: 600; cursor: pointer; transition: 0.2s; font-size: 0.95rem; }
        .primary-btn:hover { background: #00467a; }
        .outline-btn { background: white; border: 1px solid #005b9f; color: #005b9f; font-weight: 600; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; transition: 0.2s; }
        .outline-btn:hover { background: #005b9f; color: white; }

        .settings-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 2rem; }
        .settings-box { background: white; padding: 1.5rem; border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
        .settings-box h4 { margin: 0 0 1rem 0; font-size: 1.1rem; color: #111827; border-bottom: 2px solid #f3f4f6; padding-bottom: 0.5rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.35rem; }
        .form-group label { font-size: 0.85rem; font-weight: 700; color: #4b5563; text-transform: uppercase; }
        .form-group input, .form-group textarea { padding: 0.75rem 1rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.95rem; outline: none; font-family: inherit; }
        .form-group input:focus, .form-group textarea:focus { border-color: #005b9f; }
        .cover-uploader { border: 2px dashed #d1d5db; border-radius: 8px; padding: 2rem; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; background: #f9fafb; margin-top: 1rem; }

        .tab-pane { padding: 0; }
        .tab-pane h2 { margin: 0 0 0.5rem 0; color: #111827; font-size: 1.8rem; font-weight: 800; }
        .cat-badge { display: inline-block; background: #e0e7ff; color: #4338ca; padding: 0.25rem 0.6rem; border-radius: 4px; font-size: 0.75rem; font-weight: 800; letter-spacing: 0.5px; margin-top: 0.25rem; border: 1px solid #c7d2fe; }
        .empty-state { padding: 4rem 2rem; text-align: center; color: #6b7280; background: white; border-radius: 12px; border: 1px dashed #d1d5db; font-weight: 500; font-size: 1.05rem; }
        .fade-in { animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .text-sm { font-size: 0.95rem; color: #6b7280; }
        .font-bold { font-weight: 700; }
        .text-gray-500 { color: #6b7280; }
        .mx-auto { margin-left: auto; margin-right: auto; }
        .block { display: block; }
        
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(17, 24, 39, 0.7); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 1.5rem; }
        .modal-content { background: white; padding: 2.5rem; border-radius: 16px; width: 100%; max-width: 500px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); }

        /* Toggle Switch */
        .toggle-switch { position: relative; display: inline-block; width: 44px; height: 24px; cursor: pointer; }
        .toggle-switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: #d1d5db; border-radius: 24px; transition: .3s; }
        .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; border-radius: 50%; transition: .3s; }
        input:checked + .slider { background-color: #16a34a; }
        input:checked + .slider:before { transform: translateX(20px); }

        .security-alert { padding: 0.75rem 1rem; border-radius: 8px; font-weight: 700; display: flex; justify-content: space-between; align-items: center; border: 1px solid #e5e7eb; }
        .security-alert.active { background: #f0fdf4; color: #16a34a; border-color: #bbf7d0; }
        .disable-btn { background: transparent; border: none; color: #ef4444; font-weight: 600; text-decoration: underline; cursor: pointer; font-size: 0.9rem; }
        
        .qr-code-img { width: 180px; height: 180px; }
        .bg-gray-100 { background: #f3f4f6; }
        .text-primary { color: #f5b70d; }
        .tracking-widest { letter-spacing: 0.1em; }
        .text-center { text-align: center; }
        .p-2 { padding: 0.5rem; }
        .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
        .border { border: 1px solid #e5e7eb; }
        .rounded { border-radius: 0.375rem; }
        .w-full { width: 100%; }

        @media (max-width: 1024px) { 
           .metrics-grid { grid-template-columns: repeat(2, 1fr); } 
           .settings-grid { grid-template-columns: 1fr; } 
           .top-header { flex-direction: column; align-items: flex-start; gap: 1.5rem; }
        }
      `}</style>
    </div>
  );
}
