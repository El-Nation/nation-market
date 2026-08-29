'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '../../store/cartStore';

const API = (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('localhost') ? process.env.NEXT_PUBLIC_API_URL.replace(/:\d+$/, '').replace(/^http:\/\//i, 'https://') : 'https://api.eghedev.com').replace(/\/api\/?$/, '')).includes('localhost') ? ((process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('localhost') ? process.env.NEXT_PUBLIC_API_URL.replace(/:\d+$/, '').replace(/^http:\/\//i, 'https://') : 'https://api.eghedev.com').replace(/\/api\/?$/, '')) : 'https://api.eghedev.com') + '/api/storefront';

interface Product {
  id: string;
  name: string;
  price: number;
  discount: number;
  images: string;
  unit?: string;
  isAvailable: boolean;
  vendor: { id: string; storeName: string };
  category?: { name: string; slug: string };
}

const CATEGORIES = [
  'All Products',
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

function optimizeImg(url: string, w = 400) {
  if (!url || !url.includes('cloudinary.com')) return url;
  return url.replace('/upload/', `/upload/w_${w},c_limit,f_auto,q_auto/`);
}

export default function AllProductsPage() {
  const router = useRouter();
  const { addItem, totalItems, initCart } = useCartStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All Products');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    initCart();
  }, [initCart]);

  useEffect(() => {
    fetchProducts();
  }, [page, selectedCategory]);

  async function fetchProducts() {
    setLoading(true);
    try {
      const url = new URL(`${API}/products`);
      url.searchParams.set('page', String(page));
      url.searchParams.set('limit', '24');
      if (selectedCategory !== 'All Products') {
        url.searchParams.set('category', selectedCategory);
      }
      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
        setTotalPages(data.pages || 1);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleAddToCart(p: Product) {
    addItem({
      productId: p.id,
      vendorId: p.vendor.id,
      vendorName: p.vendor.storeName,
      name: p.name,
      price: p.price,
      discount: p.discount,
      image: p.images,
      unit: p.unit,
    });
    setAddedId(p.id);
    setTimeout(() => setAddedId(null), 1500);
  }

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.vendor.storeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

        /* FILTER & SEARCH CONTROLS */
        .nm-controls { max-width: 1280px; margin: 2rem auto 0; padding: 0 1.5rem; display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
        .nm-search-box { flex: 1; min-width: 260px; position: relative; }
        .nm-search-input { width: 100%; padding: 0.75rem 1rem 0.75rem 2.5rem; border: 1px solid #cbd5e1; border-radius: 12px; font-size: 0.9rem; font-family: inherit; outline: none; transition: border 0.2s; }
        .nm-search-input:focus { border-color: #059669; box-shadow: 0 0 0 3px rgba(5,150,105,0.1); }
        .nm-search-icon { position: absolute; left: 0.85rem; top: 50%; transform: translateY(-50%); color: #94a3b8; }
        .nm-cat-select { padding: 0.75rem 1.25rem; border: 1px solid #cbd5e1; border-radius: 12px; font-size: 0.9rem; font-weight: 600; background: #fff; color: #0f172a; outline: none; cursor: pointer; font-family: inherit; }

        /* PRODUCTS GRID */
        .nm-grid-container { max-width: 1280px; margin: 2rem auto 3rem; padding: 0 1.5rem; }
        .nm-prods-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1.25rem; }
        .nm-prod-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; transition: all 0.25s; display: flex; flex-direction: column; }
        .nm-prod-card:hover { transform: translateY(-4px); box-shadow: 0 14px 30px rgba(0,0,0,0.08); border-color: #cbd5e1; }
        .nm-img-wrap { position: relative; height: 180px; background: #f8fafc; cursor: pointer; }
        .nm-prod-img { width: 100%; height: 100%; object-fit: cover; }
        .nm-prod-ph { width: 100%; height: 100%; background: linear-gradient(135deg, #f1f5f9, #e2e8f0); display: flex; align-items: center; justify-content: center; font-size: 3rem; }
        .nm-discount-tag { position: absolute; top: 10px; left: 10px; background: #ef4444; color: #fff; border-radius: 8px; padding: 0.2rem 0.55rem; font-size: 0.72rem; font-weight: 800; }
        
        .nm-card-body { padding: 1.1rem; flex: 1; display: flex; flex-direction: column; }
        .nm-prod-title { font-size: 0.92rem; font-weight: 700; color: #0f172a; margin-bottom: 0.25rem; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .nm-prod-vendor { font-size: 0.78rem; color: #64748b; margin-bottom: 0.75rem; }
        .nm-price-row { display: flex; align-items: center; gap: 0.4rem; margin-top: auto; margin-bottom: 0.85rem; }
        .nm-price { font-size: 1.05rem; font-weight: 800; color: #059669; }
        .nm-orig-price { font-size: 0.78rem; color: #94a3b8; text-decoration: line-through; }
        
        .nm-add-btn { background: #059669; color: #fff; border: none; border-radius: 12px; padding: 0.65rem; font-size: 0.85rem; font-weight: 700; cursor: pointer; width: 100%; transition: background 0.2s; font-family: inherit; }
        .nm-add-btn:hover { background: #047857; }
        .nm-add-btn.added { background: #16a34a; }

        .nm-pagination { display: flex; gap: 0.5rem; justify-content: center; margin-top: 2.5rem; }
        .nm-page-btn { padding: 0.55rem 1.1rem; border: 1px solid #cbd5e1; border-radius: 10px; background: #fff; cursor: pointer; font-size: 0.88rem; font-weight: 600; transition: all 0.15s; font-family: inherit; }
        .nm-page-btn.active { background: #059669; color: #fff; border-color: #059669; }

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
        <h1>🛍️ All Marketplace Products</h1>
        <p>Explore thousands of items from verified vendors across Nigeria — with fast delivery.</p>
      </div>

      {/* CONTROLS */}
      <div className="nm-controls">
        <div className="nm-search-box">
          <span className="nm-search-icon">🔍</span>
          <input
            className="nm-search-input"
            placeholder="Search products by title or store..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="nm-cat-select"
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setPage(1);
          }}
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* PRODUCTS GRID */}
      <div className="nm-grid-container">
        {loading ? (
          <div className="nm-empty">
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📦</div>
            <p>Loading marketplace products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="nm-empty">
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔍</div>
            <p>No products match your search query or category selection.</p>
          </div>
        ) : (
          <>
            <div className="nm-prods-grid">
              {filteredProducts.map((p) => (
                <div key={p.id} className="nm-prod-card">
                  <div className="nm-img-wrap" onClick={() => router.push(`/product/${p.id}`)}>
                    {p.images ? (
                      <img src={optimizeImg(p.images, 400)} alt={p.name} className="nm-prod-img" loading="lazy" />
                    ) : (
                      <div className="nm-prod-ph">🛍️</div>
                    )}
                    {p.discount > 0 && <span className="nm-discount-tag">-{p.discount}%</span>}
                  </div>
                  <div className="nm-card-body">
                    <div className="nm-prod-title">{p.name}</div>
                    <div className="nm-prod-vendor">from {p.vendor.storeName}</div>
                    <div className="nm-price-row">
                      <span className="nm-price">
                        ₦
                        {p.discount > 0
                          ? (p.price * (1 - p.discount / 100)).toLocaleString(undefined, { maximumFractionDigits: 0 })
                          : p.price.toLocaleString()}
                      </span>
                      {p.discount > 0 && <span className="nm-orig-price">₦{p.price.toLocaleString()}</span>}
                    </div>
                    <button
                      className={`nm-add-btn ${addedId === p.id ? 'added' : ''}`}
                      onClick={() => handleAddToCart(p)}
                    >
                      {addedId === p.id ? '✓ Added!' : '+ Add to Cart'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="nm-pagination">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    className={`nm-page-btn ${page === n ? 'active' : ''}`}
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
