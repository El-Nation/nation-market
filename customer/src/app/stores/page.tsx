'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '../../store/cartStore';

const API = (process.env.NEXT_PUBLIC_API_URL && !(process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('localhost') ? process.env.NEXT_PUBLIC_API_URL : 'https://api.eghedev.com').includes('localhost') ? (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('localhost') ? process.env.NEXT_PUBLIC_API_URL : 'https://api.eghedev.com') : 'https://api.eghedev.com') + '/api/storefront';

interface Vendor {
  id: string;
  storeName: string;
  logoUrl?: string;
  coverUrl?: string;
  businessType: string;
  address?: string;
  openingHours?: string;
  description?: string;
}

const CATEGORIES = [
  'All Stores',
  'Supermarket & Groceries',
  'Restaurants & Food',
  'Fashion & Beauty',
  'Electronics & Gadgets',
  'Agriculture & Farming',
  'Pharmacy & Health',
  'Home, Kitchen & Furniture',
  'Automotive, Tools & Industrial',
  'Books & Education',
  'Toys, Kids & Babies',
];

function optimizeImg(url: string, w = 500) {
  if (!url || !url.includes('cloudinary.com')) return url;
  return url.replace('/upload/', `/upload/w_${w},c_limit,f_auto,q_auto/`);
}

export default function AllStoresPage() {
  const router = useRouter();
  const { totalItems, initCart } = useCartStore();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All Stores');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    initCart();
    fetchVendors();
  }, [initCart]);

  async function fetchVendors() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/vendors?limit=50`);
      const data = await res.json();
      if (data.success) setVendors(data.data);
    } catch (err) {
      console.error('Error fetching vendors:', err);
    } finally {
      setLoading(false);
    }
  }

  const filteredVendors = vendors.filter((v) => {
    const matchesCat =
      selectedCategory === 'All Stores' ||
      v.businessType?.toLowerCase().includes(selectedCategory.toLowerCase()) ||
      selectedCategory.toLowerCase().includes(v.businessType?.toLowerCase() || '');
    const matchesQuery =
      v.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.description && v.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesQuery;
  });

  const cartCount = isMounted ? totalItems() : 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; background: #f8fafc; color: #0f172a; }

        /* HEADER */
        .nm-header { position: sticky; top: 0; z-index: 100; background: #fff; border-bottom: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.03); }
        .nm-header-inner { max-width: 1280px; margin: 0 auto; padding: 0.75rem 1.5rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
        .nm-logo-wrap { display: flex; align-items: center; gap: 1rem; }
        .nm-back-link { text-decoration: none; color: #059669; font-weight: 700; font-size: 0.88rem; display: flex; align-items: center; gap: 0.3rem; }
        .nm-logo { height: 52px; width: auto; object-fit: contain; cursor: pointer; }
        .nm-cart-btn { position: relative; background: #059669; color: #fff; border: none; border-radius: 99px; padding: 0.5rem 1.25rem; font-size: 0.85rem; font-weight: 700; cursor: pointer; }
        .nm-cart-badge { position: absolute; top: -5px; right: -5px; background: #ef4444; color: #fff; border-radius: 99px; width: 18px; height: 18px; font-size: 0.65rem; font-weight: 800; display: flex; align-items: center; justify-content: center; }

        /* HERO */
        .nm-hero { background: linear-gradient(135deg, #064e3b 0%, #047857 100%); color: #fff; padding: 3rem 1.5rem; text-align: center; }
        .nm-hero h1 { font-size: clamp(1.8rem, 4vw, 2.6rem); font-weight: 800; margin-bottom: 0.5rem; }
        .nm-hero p { opacity: 0.9; font-size: 1rem; }

        /* FILTER & SEARCH BAR */
        .nm-controls { max-width: 1280px; margin: 2rem auto 0; padding: 0 1.5rem; display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
        .nm-search-box { flex: 1; min-width: 260px; position: relative; }
        .nm-search-input { width: 100%; padding: 0.75rem 1rem 0.75rem 2.5rem; border: 1px solid #cbd5e1; border-radius: 12px; font-size: 0.9rem; font-family: inherit; outline: none; transition: border 0.2s; }
        .nm-search-input:focus { border-color: #059669; box-shadow: 0 0 0 3px rgba(5,150,105,0.1); }
        .nm-search-icon { position: absolute; left: 0.85rem; top: 50%; transform: translateY(-50%); color: #94a3b8; }
        .nm-cat-select { padding: 0.75rem 1.25rem; border: 1px solid #cbd5e1; border-radius: 12px; font-size: 0.9rem; font-weight: 600; background: #fff; color: #0f172a; outline: none; cursor: pointer; font-family: inherit; }

        /* STORES GRID */
        .nm-grid-container { max-width: 1280px; margin: 2rem auto 3rem; padding: 0 1.5rem; }
        .nm-stores-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); gap: 1.5rem; }
        .nm-store-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; text-decoration: none; color: inherit; transition: all 0.25s; display: flex; flex-direction: column; }
        .nm-store-card:hover { transform: translateY(-4px); box-shadow: 0 14px 30px rgba(0,0,0,0.08); border-color: #cbd5e1; }
        .nm-cover-wrap { position: relative; height: 140px; background: #cbd5e1; }
        .nm-cover-img { width: 100%; height: 100%; object-fit: cover; }
        .nm-cover-ph { width: 100%; height: 100%; background: linear-gradient(135deg, #dbeafe, #bfdbfe); display: flex; align-items: center; justify-content: center; font-size: 2.5rem; }
        .nm-logo-overlay { position: absolute; bottom: -18px; left: 18px; width: 48px; height: 48px; border-radius: 14px; border: 2px solid #fff; background: #fff; overflow: hidden; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.2rem; color: #059669; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        
        .nm-card-body { padding: 1.6rem 1.25rem 1.25rem; flex: 1; display: flex; flex-direction: column; }
        .nm-store-title { font-size: 1.05rem; font-weight: 800; color: #0f172a; margin-bottom: 0.25rem; display: flex; align-items: center; gap: 0.35rem; }
        .nm-verified { color: #059669; font-size: 0.95rem; }
        .nm-store-type { font-size: 0.8rem; color: #64748b; font-weight: 600; margin-bottom: 0.75rem; }
        .nm-store-tags { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-top: auto; font-size: 0.78rem; color: #475569; }
        .nm-tag { background: #f1f5f9; padding: 0.2rem 0.6rem; border-radius: 8px; font-weight: 600; }

        .nm-empty { text-align: center; padding: 4rem 1.5rem; color: #94a3b8; }
      `}</style>

      {/* HEADER */}
      <header className="nm-header">
        <div className="nm-header-inner">
          <div className="nm-logo-wrap">
            <a href="/" className="nm-back-link">← Home</a>
            <img src="/logo.png" alt="NATION MARKET" className="nm-logo" onClick={() => router.push('/')} />
          </div>
          <button className="nm-cart-btn" onClick={() => router.push('/cart')}>
            🛒 Cart
            {cartCount > 0 && <span className="nm-cart-badge">{cartCount}</span>}
          </button>
        </div>
      </header>

      {/* HERO */}
      <div className="nm-hero">
        <h1>🏪 Verified Marketplace Stores</h1>
        <p>Browse verified vendors across Nigeria — order fresh food, groceries, electronics, and fashion.</p>
      </div>

      {/* SEARCH & FILTER CONTROLS */}
      <div className="nm-controls">
        <div className="nm-search-box">
          <span className="nm-search-icon">🔍</span>
          <input
            className="nm-search-input"
            placeholder="Search store name or products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="nm-cat-select"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* STORES GRID */}
      <div className="nm-grid-container">
        {loading ? (
          <div className="nm-empty">
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏪</div>
            <p>Loading verified stores...</p>
          </div>
        ) : filteredVendors.length === 0 ? (
          <div className="nm-empty">
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔍</div>
            <p>No stores match your search query or category filter.</p>
          </div>
        ) : (
          <div className="nm-stores-grid">
            {filteredVendors.map((v) => (
              <a key={v.id} href={`/store/${v.id}`} className="nm-store-card">
                <div className="nm-cover-wrap">
                  {v.coverUrl ? (
                    <img src={optimizeImg(v.coverUrl, 500)} alt={v.storeName} className="nm-cover-img" loading="lazy" />
                  ) : (
                    <div className="nm-cover-ph">🏪</div>
                  )}
                  <div className="nm-logo-overlay">
                    {v.logoUrl ? (
                      <img src={optimizeImg(v.logoUrl, 80)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      v.storeName.charAt(0).toUpperCase()
                    )}
                  </div>
                </div>
                <div className="nm-card-body">
                  <div className="nm-store-title">
                    {v.storeName}
                    <span className="nm-verified">✓</span>
                  </div>
                  <div className="nm-store-type">{v.businessType || 'Marketplace Vendor'}</div>
                  <div className="nm-store-tags">
                    <span className="nm-tag">🚚 15 - 25 min</span>
                    <span className="nm-tag">From ₦500</span>
                    <span style={{ color: '#eab308', fontWeight: 700, marginLeft: 'auto' }}>⭐ 5.0</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
