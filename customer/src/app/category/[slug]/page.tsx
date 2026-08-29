'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCartStore } from '../../../store/cartStore';
import { useAuthStore } from '../../../store/authStore';
import { useLocationStore } from '../../../store/locationStore';

const API = ((process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('localhost') ? process.env.NEXT_PUBLIC_API_URL : 'https://api.eghedev.com').replace(/\/api\/?$/, ''));

interface Subcategory { id: string; name: string; slug: string; image?: string; }
interface Category { id: string; name: string; slug: string; subcategories: Subcategory[]; }
interface Vendor { id: string; storeName: string; logoUrl?: string; coverUrl?: string; businessType: string; address?: string; rating?: number; deliveryFee?: number; deliveryTime?: string; }

function optimizeImg(url: string, w = 400) {
  if (!url || !url.includes('cloudinary.com')) return url;
  return url.replace('/upload/', `/upload/w_${w},c_limit,f_auto,q_auto/`);
}

export default function MobileCategoryPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { totalItems, items, addItem } = useCartStore();
  const searchRef = useRef<HTMLInputElement>(null);
  const focusSearch = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => { searchRef.current?.focus(); }, 300);
  };
  const { location, initLocation } = useLocationStore();

  const [category, setCategory] = useState<Category | null>(null);
  const [activeSub, setActiveSub] = useState<string>('');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Floating Nav Dock
  const [activeTab, setActiveTab] = useState('Home');

  useEffect(() => {
    fetchCategory();
    initLocation();
  }, [params.slug, initLocation]);

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

  async function fetchVendorsAndProducts() {
    if (!category) return;
    setLoading(true);
    let vUrl = `${API}/storefront/vendors?category=${encodeURIComponent(category.name)}&limit=20`;
    let pUrl = `${API}/storefront/products?category=${encodeURIComponent(category.name)}&limit=40`;
    
    if (activeSub) {
       vUrl += `&subcategory=${encodeURIComponent(activeSub)}`;
       pUrl += `&subcategory=${encodeURIComponent(activeSub)}`;
    }
    
    try {
      const [vRes, pRes] = await Promise.all([ fetch(vUrl), fetch(pUrl) ]);
      const vData = await vRes.json();
      const pData = await pRes.json();
      
      if (vData.success) {
        let v = vData.data as Vendor[];
        v = v.map(vx => ({
          ...vx,
          rating: vx.rating || 5.0,
          deliveryFee: vx.deliveryFee || 1000,
          deliveryTime: vx.deliveryTime || '9 - 19 min'
        }));
        setVendors(v);
      }
      if (pData.success) {
        setProducts(pData.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (category) fetchVendorsAndProducts();
  }, [category, activeSub]);

  const filteredVendors = vendors.filter(v => v.storeName.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
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

        /* 2. Subcategory Visual Track */
        .subcat-track { display: flex; gap: 1rem; overflow-x: auto; padding: 0.5rem 1.25rem 1.5rem; scrollbar-width: none; align-items: stretch; }
        .subcat-track::-webkit-scrollbar { display: none; }
        .subcat-pill { 
           flex: 0 0 auto; width: 110px; background: #fff; border: 2px solid transparent; 
           border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; 
           cursor: pointer; text-decoration: none; transition: all 0.2s; box-shadow: 0 4px 12px rgba(0,0,0,0.05); /* Soft shadow */
        }
        .subcat-pill.active { border-color: #059669; box-shadow: 0 6px 16px rgba(5,150,105,0.2); transform: scale(1.02); }
        .subcat-pill-img-wrap { width: 100%; height: 90px; background: #f1f5f9; position: relative; }
        .subcat-pill-img { width: 100%; height: 100%; object-fit: cover; }
        .subcat-pill-body { padding: 0.5rem; text-align: center; display: flex; align-items: center; justify-content: center; min-height: 44px; }
        .subcat-pill-name { font-size: 0.75rem; font-weight: 800; color: #0f172a; line-height: 1.1; }

        /* 3. Search Bar */
        .search-container { padding: 0 1.25rem 1.25rem; }
        .search-box { display: flex; align-items: center; background: #f8fafc; border-radius: 12px; padding: 0.85rem 1rem; gap: 0.5rem; }
        .search-icon { color: #94a3b8; font-size: 1.1rem; }
        .search-input { border: none; background: transparent; font-size: 0.9rem; outline: none; width: 100%; font-family: inherit; color: #333; }

        /* 4. Main Vendor & Product List */
        .main-content { padding: 0 1.25rem; max-width: 1200px; margin: 0 auto; }
        .section-title { font-size: 1.1rem; font-weight: 800; margin-bottom: 1.25rem; color: #111; }
        
        .cd-prods-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(145px, 100%), 1fr)); gap: 1rem; }
        @media (min-width: 768px) { .cd-prods-grid { gap: 1.25rem; } }
        @media (min-width: 1024px) { .cd-prods-grid { gap: 1.5rem; } }
        
        .cd-prod-card { background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.04); text-decoration: none; color: inherit; display: flex; flex-direction: column; transition: all 0.25s; cursor: pointer; border: 1px solid #f1f5f9; }
        .cd-prod-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.08); border-color: #e2e8f0; }
        .cd-prod-img { width: 100%; height: 160px; object-fit: cover; background: #f8fafc; }
        .cd-prod-body { padding: 1rem; display: flex; flex-direction: column; gap: 0.25rem; flex: 1; }
        .cd-prod-title { font-size: 0.95rem; font-weight: 800; line-height: 1.3; color: #0f172a; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .cd-prod-vendor { font-size: 0.75rem; font-weight: 600; color: #64748b; margin-bottom: 0.5rem; }
        .cd-prod-price-row { display: flex; justify-content: space-between; align-items: center; margin-top: auto; }
        .cd-prod-price { font-size: 1.05rem; font-weight: 800; color: #059669; }
        .cd-prod-add { background: #f0fdf4; color: #059669; border: none; width: 32px; height: 32px; border-radius: 50%; font-size: 1.2rem; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
        .cd-prod-add:hover { background: #059669; color: #fff; }

        .vendor-list { display: flex; flex-direction: column; gap: 2rem; margin-bottom: 3rem; }

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
        <div className="location-pill" onClick={() => router.push('/')}>
          <span className="loc-icon">📍</span> {location} <span>⌄</span>
        </div>
      </header>

      {/* 2. Subcategory Visual Track */}
      {category && (
        <div className="subcat-track">
          <button className={`subcat-pill ${activeSub === '' ? 'active' : ''}`} onClick={() => setActiveSub('')}>
            <div className="subcat-pill-img-wrap">
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)' }}>🏠</div>
            </div>
            <div className="subcat-pill-body"><div className="subcat-pill-name">All</div></div>
          </button>
          
          {category?.subcategories.map(sub => (
            <button key={sub.id} className={`subcat-pill ${activeSub === sub.slug ? 'active' : ''}`} onClick={() => setActiveSub(sub.slug)}>
              <div className="subcat-pill-img-wrap">
                {sub.image ? (
                  <img src={optimizeImg(sub.image, 200)} alt={sub.name} className="subcat-pill-img" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(sub.name)}&background=f8fafc&color=94a3b8&size=200`; }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', background: 'linear-gradient(135deg, #e2e8f0, #cbd5e1)' }}>🖼️</div>
                )}
              </div>
              <div className="subcat-pill-body"><div className="subcat-pill-name">{sub.name}</div></div>
            </button>
          ))}
        </div>
      )}

      {/* 3. Search */}
      <div className="search-container">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input 
            ref={searchRef}
            type="text" 
            className="search-input" 
            placeholder={category?.name === 'Pharmacy & Health' ? 'Painkillers, Cough syrup etc.' : 'Clothing, electronics, groceries, etc'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* 4. Main Content (Vendors & Subcategories & Products) */}
      <main className="main-content">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>Loading ...</div>
        ) : (
          <>
            {/* Products Row */}
            {filteredProducts.length > 0 && (
              <div style={{ marginBottom: '3rem' }}>
                <h2 className="section-title">Products in {activeSub ? category?.subcategories.find(s => s.slug === activeSub)?.name : category?.name}</h2>
                <div className="cd-prods-grid">
                  {filteredProducts.map(p => (
                    <a key={p.id} href={`/product/${p.id}`} className="cd-prod-card">
                      <img src={optimizeImg(p.images, 400)} alt={p.name} className="cd-prod-img" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=f8fafc&color=94a3b8&size=400`; }} />
                      <div className="cd-prod-body">
                        <div className="cd-prod-title">{p.name}</div>
                        <div className="cd-prod-vendor">from {p.vendor?.storeName || 'Nation Market'}</div>
                        <div className="cd-prod-price-row">
                          <span className="cd-prod-price">₦{p.price.toLocaleString()}</span>
                          <button 
                            className={`cd-prod-add ${items.some(i => i.productId === p.id) ? 'added' : ''}`} 
                            style={{ background: items.some(i => i.productId === p.id) ? '#059669' : '#f0fdf4', color: items.some(i => i.productId === p.id) ? '#fff' : '#059669' }}
                            onClick={(e) => { 
                               e.preventDefault(); 
                               e.stopPropagation(); 
                               if (!items.some(i => i.productId === p.id)) {
                                 addItem({ productId: p.id, name: p.name, price: p.price, discount: p.discount || 0, vendorId: p.vendorId, vendorName: p.vendor?.storeName || 'Nation Market', image: p.images ? p.images.split(',')[0] : '' });
                               }
                            }}
                          >
                             {items.some(i => i.productId === p.id) ? '✓' : '+'}
                          </button>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Vendors Row */}
            <h2 className="section-title">{activeSub ? 'Stores in this Subcategory' : `All ${category?.name || 'Vendors'} Stores`}</h2>
            
            {filteredVendors.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8', fontSize: '0.95rem' }}>No stores found.</div>
            ) : (
              <div className="vendor-list">
                {filteredVendors.map(vendor => (
                  <a key={vendor.id} href={`/store/${vendor.id}`} className="vendor-card">
                    <div className="vendor-cover-wrap">
                      {vendor.coverUrl ? (
                        <img src={optimizeImg(vendor.coverUrl, 800)} alt={vendor.storeName} className="vendor-cover" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(vendor.storeName)}&background=f8fafc&color=94a3b8&size=800`; }} />
                      ) : (
                        <div className="vendor-cover-ph">
                          {vendor.logoUrl ? (
                            <img src={optimizeImg(vendor.logoUrl, 200)} alt={vendor.storeName} className="ph-logo" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(vendor.storeName)}&background=0f172a&color=fff&size=200`; }} />
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
          </>
        )}
      </main>

      {/* 5. App Dock */}
      <div className="dock-bar">
        <div className="dock-inner">
          <a href="/" className={`dock-btn ${activeTab === 'Home' ? 'active' : ''}`} onClick={(e) => {e.preventDefault(); router.push('/');}}>
            <span className="dock-icon">🛋️</span>
            <span className="dock-label">Home</span>
          </a>
          <button className={`dock-btn ${activeTab === 'Search' ? 'active' : ''}`} onClick={focusSearch}>
            <span className="dock-icon">🔭</span>
            <span className="dock-label">Search</span>
          </button>
          <a href="/cart" className={`dock-btn ${activeTab === 'Cart' ? 'active' : ''}`}>
            <span className="dock-icon">🛒</span>
            {cartCount > 0 && <div className="dock-badge">{cartCount}</div>}
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
