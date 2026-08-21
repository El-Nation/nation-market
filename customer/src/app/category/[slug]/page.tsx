'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCartStore } from '../../../store/cartStore';

const API = 'http://localhost:5000/api/storefront';

interface Subcategory { id: string; name: string; slug: string; }
interface Category { id: string; name: string; slug: string; subcategories: Subcategory[]; }
interface Product { id: string; name: string; price: number; discount: number; images: string; unit?: string; isAvailable: boolean; vendor: { id: string; storeName: string }; }
interface Vendor { id: string; storeName: string; logoUrl?: string; coverUrl?: string; businessType: string; address?: string; }

const CATEGORY_ICONS: Record<string, string> = {
  'Supermarket & Groceries': '🛒', 'Fashion & Beauty': '👗', 'Electronics & Gadgets': '📱',
  'Restaurants & Food': '🍽️', 'Agriculture & Farming': '🌾', 'Pharmacy & Health': '💊',
  'Books & Education': '📚', 'Home, Kitchen & Furniture': '🏠', 'Automotive, Tools & Industrial': '🔧', 'Toys, Kids & Babies': '🧸',
};

function optimizeImg(url: string, w = 400) {
  if (!url || !url.includes('cloudinary.com')) return url;
  return url.replace('/upload/', `/upload/w_${w},c_limit,f_auto,q_auto/`);
}

export default function CategoryPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { addItem, totalItems, initCart } = useCartStore();

  const [category, setCategory] = useState<Category | null>(null);
  const [activeSub, setActiveSub] = useState<string>('');
  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    initCart();
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const sub = urlParams.get('sub');
      if (sub) setActiveSub(sub);
    }
  }, [initCart]);

  useEffect(() => {
    fetchCategory();
  }, [params.slug]);

  useEffect(() => {
    if (category) {
      fetchResults();
      fetchVendors();
    }
  }, [category, activeSub, page]);

  async function fetchCategory() {
    const res = await fetch(`${API}/categories`);
    const data = await res.json();
    if (data.success) {
      const found = data.data.find((c: Category) => c.slug === params.slug);
      setCategory(found || null);
    }
    setLoading(false);
  }

  async function fetchResults() {
    setLoading(true);
    const url = new URL(`${API}/products`);
    url.searchParams.set('category', params.slug);
    if (activeSub) url.searchParams.set('subcategory', activeSub);
    url.searchParams.set('page', String(page));
    url.searchParams.set('limit', '24');
    const res = await fetch(url.toString());
    const data = await res.json();
    if (data.success) {
      setProducts(data.data);
      setTotalPages(data.pages || 1);
    }
    setLoading(false);
  }

  async function fetchVendors() {
    const res = await fetch(`${API}/vendors?category=${encodeURIComponent(category!.name)}&limit=8`);
    const data = await res.json();
    if (data.success) setVendors(data.data);
  }

  function handleAddToCart(p: Product) {
    addItem({ productId: p.id, vendorId: p.vendor.id, vendorName: p.vendor.storeName, name: p.name, price: p.price, discount: p.discount, image: p.images, unit: p.unit });
    setAddedId(p.id);
    setTimeout(() => setAddedId(null), 1500);
  }

  const cartCount = totalItems();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; background: #f8f9fa; }
        .cat-header { background: #fff; border-bottom: 1px solid #f0f0f0; box-shadow: 0 2px 8px rgba(0,0,0,0.05); position: sticky; top: 0; z-index: 100; }
        .cat-header-inner { max-width: 1280px; margin: 0 auto; padding: 0.5rem 1.5rem; min-height: 66px; display: flex; align-items: center; gap: 1rem; }
        .cat-back { font-size: 0.9rem; color: #005b9f; text-decoration: none; font-weight: 600; }
        .cat-logo { height: 52px; width: auto; max-width: 220px; object-fit: contain; cursor: pointer; }
        .cat-cart { margin-left: auto; background: #005b9f; color: #fff; border: none; border-radius: 8px; padding: 0.45rem 1rem; cursor: pointer; font-weight: 600; font-size: 0.85rem; position: relative; }
        .cat-cart-badge { position: absolute; top: -5px; right: -5px; background: #ef4444; color: #fff; border-radius: 99px; width: 16px; height: 16px; font-size: 0.6rem; font-weight: 700; display: flex; align-items: center; justify-content: center; }
        .cat-hero { background: linear-gradient(135deg, #003d6b, #005b9f); color: #fff; padding: 2.5rem 1.5rem; }
        .cat-hero-inner { max-width: 1280px; margin: 0 auto; }
        .cat-hero h1 { font-size: clamp(1.6rem, 4vw, 2.5rem); font-weight: 800; margin-bottom: 0.5rem; }
        .cat-hero p { opacity: 0.8; font-size: 0.95rem; }
        .cat-layout { max-width: 1280px; margin: 0 auto; padding: 2rem 1.5rem; display: grid; grid-template-columns: 220px 1fr; gap: 2rem; }
        .cat-sidebar { background: #fff; border-radius: 14px; border: 1px solid #f0f0f0; padding: 1.25rem; height: fit-content; position: sticky; top: 80px; }
        .cat-sidebar h3 { font-size: 0.85rem; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.75rem; }
        .cat-sub-btn { width: 100%; text-align: left; background: none; border: none; padding: 0.55rem 0.75rem; border-radius: 8px; font-size: 0.88rem; color: #333; cursor: pointer; transition: all 0.15s; font-family: inherit; }
        .cat-sub-btn:hover { background: #f0f4f8; }
        .cat-sub-btn.active { background: #eff6ff; color: #1d4ed8; font-weight: 600; }
        .cat-main { flex: 1; min-width: 0; }
        .cat-vendors-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
        .cat-vendor-card { background: #fff; border: 1px solid #f0f0f0; border-radius: 12px; overflow: hidden; cursor: pointer; text-decoration: none; transition: all 0.2s; }
        .cat-vendor-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.1); transform: translateY(-1px); }
        .cat-vendor-cover { width: 100%; height: 80px; object-fit: cover; background: linear-gradient(135deg, #dbeafe, #bfdbfe); }
        .cat-vendor-cover-ph { width: 100%; height: 80px; background: linear-gradient(135deg, #eff6ff, #dbeafe); display: flex; align-items: center; justify-content: center; font-size: 2rem; }
        .cat-vendor-name { padding: 0.5rem 0.75rem; font-size: 0.85rem; font-weight: 600; color: #111; }
        .cat-products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.25rem; }
        .cat-product-card { background: #fff; border: 1px solid #f0f0f0; border-radius: 14px; overflow: hidden; display: flex; flex-direction: column; transition: all 0.2s; }
        .cat-product-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.1); transform: translateY(-2px); }
        .cat-product-img { width: 100%; height: 160px; object-fit: cover; cursor: pointer; background: #f0f0f0; display: block; }
        .cat-product-ph { width: 100%; height: 160px; background: linear-gradient(135deg, #f0f4f8, #e2e8f0); display: flex; align-items: center; justify-content: center; font-size: 2.5rem; }
        .cat-product-body { padding: 0.8rem; flex: 1; display: flex; flex-direction: column; }
        .cat-product-name { font-size: 0.87rem; font-weight: 600; margin-bottom: 0.25rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .cat-product-vendor { font-size: 0.75rem; color: #6b7280; margin-bottom: 0.5rem; }
        .cat-product-price { font-size: 0.95rem; font-weight: 800; color: #005b9f; }
        .cat-add-btn { margin-top: auto; padding-top: 0.6rem; background: #005b9f; color: #fff; border: none; border-radius: 7px; padding: 0.5rem; font-size: 0.83rem; font-weight: 600; cursor: pointer; width: 100%; transition: background 0.2s; font-family: inherit; }
        .cat-add-btn:hover { background: #004a82; }
        .cat-add-btn.added { background: #16a34a; }
        .cat-pagination { display: flex; gap: 0.5rem; justify-content: center; margin-top: 2rem; }
        .cat-page-btn { padding: 0.5rem 1rem; border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; cursor: pointer; font-size: 0.88rem; transition: all 0.15s; font-family: inherit; }
        .cat-page-btn.active { background: #005b9f; color: #fff; border-color: #005b9f; }
        .cat-page-btn:hover:not(.active) { background: #f4f6f8; }
        .cat-empty { text-align: center; padding: 4rem 2rem; color: #9ca3af; }
        @media (max-width: 768px) {
          .cat-layout { grid-template-columns: 1fr; }
          .cat-sidebar { position: static; }
          .cat-sub-list { display: flex; flex-wrap: wrap; gap: 0.5rem; }
          .cat-sub-btn { width: auto; }
        }
      `}</style>

      {/* Header */}
      <header className="cat-header">
        <div className="cat-header-inner">
          <a href="/" className="cat-back">← Back</a>
          <img src="/logo.png" alt="NATION MARKET" className="cat-logo" onClick={() => router.push('/')} style={{cursor:'pointer'}} />
          <button className="cat-cart" onClick={() => router.push('/cart')}>
            🛒 Cart {cartCount > 0 && <span className="cat-cart-badge">{cartCount}</span>}
          </button>
        </div>
      </header>

      {/* Hero */}
      {category && (
        <div className="cat-hero">
          <div className="cat-hero-inner">
            <h1>{CATEGORY_ICONS[category.name] || '🏪'} {category.name}</h1>
            <p>{category.subcategories.length} subcategories · Browse and discover from trusted vendors</p>
          </div>
        </div>
      )}

      <div className="cat-layout">
        {/* Sidebar */}
        <aside className="cat-sidebar">
          <h3>Subcategories</h3>
          <div className="cat-sub-list">
            <button className={`cat-sub-btn ${activeSub === '' ? 'active' : ''}`} onClick={() => { setActiveSub(''); setPage(1); }}>
              All Products
            </button>
            {category?.subcategories.map(sub => (
              <button
                key={sub.id}
                className={`cat-sub-btn ${activeSub === sub.slug ? 'active' : ''}`}
                onClick={() => { setActiveSub(sub.slug); setPage(1); }}
              >
                {sub.name}
              </button>
            ))}
          </div>
        </aside>

        {/* Main */}
        <main className="cat-main">
          {/* Vendors in this category */}
          {vendors.length > 0 && (
            <>
              <h2 style={{fontSize:'1rem',fontWeight:700,marginBottom:'0.75rem',color:'#111'}}>Stores in {category?.name}</h2>
              <div className="cat-vendors-row">
                {vendors.map(v => (
                  <a key={v.id} href={`/store/${v.id}`} className="cat-vendor-card">
                    {v.coverUrl
                      ? <img src={optimizeImg(v.coverUrl, 400)} className="cat-vendor-cover" loading="lazy" alt="" />
                      : <div className="cat-vendor-cover-ph">{CATEGORY_ICONS[v.businessType] || '🏪'}</div>
                    }
                    <div className="cat-vendor-name">{v.storeName}</div>
                  </a>
                ))}
              </div>
            </>
          )}

          {/* Products */}
          <h2 style={{fontSize:'1rem',fontWeight:700,marginBottom:'0.75rem',color:'#111'}}>
            Products {activeSub && category && `· ${category.subcategories.find(s => s.slug === activeSub)?.name}`}
          </h2>
          {loading ? (
            <div className="cat-empty"><p>Loading products...</p></div>
          ) : products.length === 0 ? (
            <div className="cat-empty">
              <div style={{fontSize:'2.5rem',marginBottom:'0.75rem'}}>📦</div>
              <p>No products available yet in this {activeSub ? 'subcategory' : 'category'}.</p>
            </div>
          ) : (
            <>
              <div className="cat-products-grid">
                {products.map(p => (
                  <div key={p.id} className="cat-product-card">
                    {p.images
                      ? <img src={optimizeImg(p.images, 400)} className="cat-product-img" loading="lazy" alt={p.name} onClick={() => router.push(`/product/${p.id}`)} />
                      : <div className="cat-product-ph">🛍️</div>
                    }
                    <div className="cat-product-body">
                      <div className="cat-product-name">{p.name}</div>
                      <div className="cat-product-vendor">from {p.vendor.storeName}</div>
                      <div className="cat-product-price">
                        ₦{p.discount > 0 ? (p.price * (1 - p.discount/100)).toLocaleString(undefined,{maximumFractionDigits:0}) : p.price.toLocaleString()}
                        {p.discount > 0 && <span style={{color:'#9ca3af',textDecoration:'line-through',fontSize:'0.75rem',marginLeft:'0.35rem'}}>₦{p.price.toLocaleString()}</span>}
                      </div>
                      <button
                        className={`cat-add-btn ${addedId === p.id ? 'added' : ''}`}
                        style={{marginTop:'0.75rem'}}
                        onClick={() => handleAddToCart(p)}
                      >
                        {addedId === p.id ? '✓ Added!' : '+ Add to Cart'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="cat-pagination">
                  {Array.from({length: totalPages}, (_, i) => i + 1).map(n => (
                    <button key={n} className={`cat-page-btn ${page === n ? 'active' : ''}`} onClick={() => setPage(n)}>{n}</button>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </>
  );
}
