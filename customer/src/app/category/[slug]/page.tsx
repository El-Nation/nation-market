'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCartStore } from '../../../store/cartStore';
import { useAuthStore } from '../../../store/authStore';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface Subcategory { id: string; name: string; slug: string; }
interface Category { id: string; name: string; slug: string; subcategories: Subcategory[]; }
interface Vendor { id: string; storeName: string; logoUrl?: string; coverUrl?: string; businessType: string; address?: string; rating?: number; deliveryFee?: number; deliveryTime?: string; }

function optimizeImg(url: string, w = 400) {
  if (!url || !url.includes('cloudinary.com')) return url;
  return url.replace('/upload/', `/upload/w_${w},c_limit,f_auto,q_auto/`);
}

export default function MobileCategoryPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { totalItems } = useCartStore();

  const [category, setCategory] = useState<Category | null>(null);
  const [activeSub, setActiveSub] = useState<string>('');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Floating Nav Dock
  const [activeTab, setActiveTab] = useState('Home');

  useEffect(() => {
    fetchCategory();
  }, [params.slug]);

  useEffect(() => {
    if (category) fetchVendors();
  }, [category, activeSub]);

  async function fetchCategory() {
    try {
      const res = await fetch(`${API}/storefront/categories`);
      const data = await res.json();
      if (data.success) {
        const found = data.data.find((c: Category) => c.slug === params.slug);
        setCategory(found || null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function fetchVendors() {
    if (!category) return;
    setLoading(true);
    let url = `${API}/storefront/vendors?category=${encodeURIComponent(category.name)}&limit=20`;
    if (activeSub) url += `&subcategory=${encodeURIComponent(activeSub)}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        let v = data.data as Vendor[];
        // Mocking metadata if missing to match mockup exactly
        v = v.map(vx => ({
          ...vx,
          rating: vx.rating || 5.0,
          deliveryFee: vx.deliveryFee || 1000,
          deliveryTime: vx.deliveryTime || '9 - 19 min'
        }));
        setVendors(v);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const filteredVendors = vendors.filter(v => v.storeName.toLowerCase().includes(searchQuery.toLowerCase()));
  const cartCount = totalItems();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; background: #ffffff; color: #0f172a; padding-bottom: 90px; }
        
        /* 1. Header Row */
        .cat-app-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; position: sticky; top: 0; background: #fff; z-index: 100; }
        .cat-header-left { display: flex; align-items: center; gap: 0.75rem; }
        .back-btn { font-size: 1.2rem; font-weight: 700; background: none; border: none; cursor: pointer; color: #111; }
        .cat-title { font-size: 1.15rem; font-weight: 800; color: #111; }
        .location-pill { display: flex; align-items: center; gap: 0.35rem; font-size: 0.8rem; font-weight: 600; color: #111; cursor: pointer; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .loc-icon { color: #10b981; }

        /* 2. Subcategory Horizontal Pills */
        .subcat-track { display: flex; gap: 0.5rem; overflow-x: auto; padding: 0.5rem 1.25rem 1rem; scrollbar-width: none; }
        .subcat-track::-webkit-scrollbar { display: none; }
        .subcat-pill { padding: 0.6rem 1rem; border-radius: 8px; font-size: 0.85rem; font-weight: 600; white-space: nowrap; cursor: pointer; border: none; font-family: inherit; transition: all 0.2s; }
        .subcat-pill.active { background: #e6f6f2; color: #059669; border: 1px solid #059669; }
        .subcat-pill:not(.active) { background: #fff; color: #64748b; border: 1px solid #fff; }

        /* 3. Search Bar */
        .search-container { padding: 0 1.25rem 1.25rem; }
        .search-box { display: flex; align-items: center; background: #f8fafc; border-radius: 12px; padding: 0.85rem 1rem; gap: 0.5rem; }
        .search-icon { color: #94a3b8; font-size: 1.1rem; }
        .search-input { border: none; background: transparent; w-full; font-size: 0.9rem; outline: none; width: 100%; font-family: inherit; color: #333; }

        /* 4. Main Vendor List */
        .main-content { padding: 0 1.25rem; max-width: 800px; margin: 0 auto; }
        .section-title { font-size: 1.1rem; font-weight: 800; margin-bottom: 1.25rem; color: #111; }
        
        .vendor-list { display: flex; flex-direction: column; gap: 2rem; }
        .vendor-card { text-decoration: none; display: flex; flex-direction: column; gap: 0.6rem; cursor: pointer; transition: opacity 0.2s; }
        .vendor-card:hover { opacity: 0.9; }
        
        .vendor-cover-wrap { width: 100%; height: 160px; border-radius: 14px; overflow: hidden; background: #f1f5f9; position: relative; }
        .vendor-cover { width: 100%; height: 100%; object-fit: cover; }
        .vendor-cover-ph { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, #f0fdf4, #dcfce7); }
        .ph-logo { height: 60px; width: 60px; object-fit: cover; border-radius: 50%; box-shadow: 0 4px 12px rgba(0,0,0,0.1); margin-bottom: 0.5rem; }
        
        .vendor-meta-row { display: flex; align-items: flex-start; justify-content: space-between; }
        .vendor-name { font-size: 1.05rem; font-weight: 800; color: #111; display: flex; align-items: center; gap: 0.4rem; }
        .verified-badge { color: #10b981; font-size: 1rem; }
        .heart-icon { color: #64748b; font-size: 1.2rem; cursor: pointer; }
        
        .vendor-stats { display: flex; align-items: center; justify-content: space-between; font-size: 0.85rem; color: #475569; font-weight: 600; margin-top: 0.25rem; }
        .stat-left { display: flex; align-items: center; gap: 0.5rem; }
        .scooter-icon { font-size: 1.1rem; }
        .stat-divider { width: 1px; height: 12px; background: #cbd5e1; }
        .stat-right { display: flex; align-items: center; gap: 0.35rem; }
        .star-icon { color: #fbbf24; font-size: 1rem; }

        /* 5. Mobile Global Dock */
        .dock-bar { position: fixed; bottom: 0; left: 0; right: 0; background: #f8fafc; padding: 0.5rem 1rem; z-index: 1000; display: flex; justify-content: center; }
        .dock-inner { background: #fff; border-radius: 99px; display: flex; width: 100%; max-width: 480px; justify-content: space-around; padding: 0.4rem 0.5rem; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #f1f5f9; }
        .dock-btn { display: flex; flex-direction: column; align-items: center; gap: 0.35rem; background: none; border: none; cursor: pointer; padding: 0.5rem 1rem; border-radius: 99px; transition: all 0.2s; position: relative; text-decoration: none; }
        .dock-btn:hover { background: #f1f5f9; }
        .dock-btn.active { background: #059669; }
        .dock-icon { font-size: 1.25rem; }
        .dock-btn.active .dock-icon { display: none; } /* Show something else or change color */
        .dock-label { font-size: 0.72rem; font-weight: 700; color: #94a3b8; }
        .dock-btn.active .dock-label { color: #fff; font-size: 0.8rem; }
        .dock-badge { position: absolute; top: 0px; right: 6px; background: #fbbf24; color: #111; font-size: 0.65rem; font-weight: 800; height: 20px; width: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
      `}</style>

      {/* 1. Header */}
      <header className="cat-app-header">
        <div className="cat-header-left">
          <button className="back-btn" onClick={() => router.push('/')}>←</button>
          <div className="cat-title">{category?.name || 'Loading...'}</div>
        </div>
        <div className="location-pill">
          <span className="loc-icon">📍</span> 29 Imatitikua, Uselu... <span>⌄</span>
        </div>
      </header>

      {/* 2. Subcategory Pills */}
      {category && (
        <div className="subcat-track">
          <button className={`subcat-pill ${activeSub === '' ? 'active' : ''}`} onClick={() => setActiveSub('')}>
            All
          </button>
          {category.subcategories.map(sub => (
            <button key={sub.id} className={`subcat-pill ${activeSub === sub.slug ? 'active' : ''}`} onClick={() => setActiveSub(sub.slug)}>
              {sub.name}
            </button>
          ))}
        </div>
      )}

      {/* 3. Search */}
      <div className="search-container">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input 
            type="text" 
            className="search-input" 
            placeholder={category?.name === 'Pharmacy & Health' ? 'Painkillers, Cough syrup etc.' : 'Clothing, electronics, groceries, etc'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* 4. Main Content (Vendors) */}
      <main className="main-content">
        <h2 className="section-title">All {category?.name || 'Vendors'}</h2>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>Loading stores...</div>
        ) : filteredVendors.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>No stores found.</div>
        ) : (
          <div className="vendor-list">
            {filteredVendors.map(vendor => (
              <a key={vendor.id} href={`/store/${vendor.id}`} className="vendor-card">
                <div className="vendor-cover-wrap">
                  {vendor.coverUrl ? (
                    <img src={optimizeImg(vendor.coverUrl, 800)} alt={vendor.storeName} className="vendor-cover" />
                  ) : (
                    <div className="vendor-cover-ph">
                      {vendor.logoUrl ? (
                        <img src={optimizeImg(vendor.logoUrl, 200)} alt={vendor.storeName} className="ph-logo" />
                      ) : (
                        <span style={{ fontSize: '3rem' }}>🏬</span>
                      )}
                      <h3 style={{ color: '#064e3b', opacity: 0.8 }}>{vendor.storeName}</h3>
                    </div>
                  )}
                </div>
                
                <div className="vendor-info">
                  <div className="vendor-meta-row">
                    <div className="vendor-name">
                      {vendor.storeName}
                      <span className="verified-badge">✿</span>
                    </div>
                    <span className="heart-icon">♡</span>
                  </div>
                  
                  <div className="vendor-stats">
                    <div className="stat-left">
                      <span className="scooter-icon">🛵</span>
                      <span>From ₦{vendor.deliveryFee?.toLocaleString()}</span>
                      <span className="stat-divider"></span>
                      <span>{vendor.deliveryTime}</span>
                    </div>
                    <div className="stat-right">
                      <span className="star-icon">★</span>
                      <span>{vendor.rating?.toFixed(1)} (1)</span>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </main>

      {/* 5. App Dock */}
      <div className="dock-bar">
        <div className="dock-inner">
          <a href="/" className={`dock-btn ${activeTab === 'Home' ? 'active' : ''}`} onClick={(e) => {e.preventDefault(); router.push('/');}}>
            <span className="dock-icon">🛋️</span>
            <span className="dock-label">Home</span>
          </a>
          <button className={`dock-btn ${activeTab === 'Search' ? 'active' : ''}`} onClick={() => document.querySelector('.search-input')?.dispatchEvent(new Event('focus'))}>
            <span className="dock-icon">🔭</span>
            <span className="dock-label">Search</span>
          </button>
          <a href="/cart" className={`dock-btn ${activeTab === 'Orders' ? 'active' : ''}`}>
            <span className="dock-icon">📦</span>
            {cartCount > 0 && <div className="dock-badge">{cartCount}</div>}
            <span className="dock-label">Orders</span>
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
