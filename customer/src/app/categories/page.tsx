'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '../../store/cartStore';

const API = (process.env.NEXT_PUBLIC_API_URL && !((process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('localhost') ? process.env.NEXT_PUBLIC_API_URL : 'https://api.eghedev.com').replace(/\/api\/?$/, '')).includes('localhost') ? ((process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('localhost') ? process.env.NEXT_PUBLIC_API_URL : 'https://api.eghedev.com').replace(/\/api\/?$/, '')) : 'https://api.eghedev.com') + '/api/storefront';

const CATEGORY_ICONS: Record<string, string> = {
  'Supermarket & Groceries': '🛒',
  'Fashion & Beauty': '👗',
  'Electronics & Gadgets': '📱',
  'Restaurants & Food': '🍽️',
  'Agriculture & Farming': '🌾',
  'Pharmacy & Health': '💊',
  'Books & Education': '📚',
  'Home, Kitchen & Furniture': '🏠',
  'Automotive, Tools & Industrial': '🔧',
  'Toys, Kids & Babies': '🧸',
};

const CATEGORY_COLORS: Record<string, string> = {
  'Supermarket & Groceries': '#dcfce7',
  'Fashion & Beauty': '#fce7f3',
  'Electronics & Gadgets': '#dbeafe',
  'Restaurants & Food': '#fef3c7',
  'Agriculture & Farming': '#d1fae5',
  'Pharmacy & Health': '#ede9fe',
  'Books & Education': '#ffedd5',
  'Home, Kitchen & Furniture': '#f0fdf4',
  'Automotive, Tools & Industrial': '#f3f4f6',
  'Toys, Kids & Babies': '#fef9c3',
};

interface Subcategory {
  id: string;
  name: string;
  slug: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  subcategories: Subcategory[];
}

export default function CategoriesPage() {
  const router = useRouter();
  const { totalItems, initCart } = useCartStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsMounted(true);
    initCart();
    fetch(`${API}/categories`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCategories(d.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading categories:', err);
        setLoading(false);
      });
  }, [initCart]);

  const cartCount = isMounted ? totalItems() : 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; background: #f8f9fa; color: #1a1a1a; }

        /* HEADER */
        .nm-cats-header { position: sticky; top: 0; z-index: 100; background: #fff; border-bottom: 1px solid #f0f0f0; box-shadow: 0 2px 10px rgba(0,0,0,0.04); }
        .nm-cats-header-inner { max-width: 1280px; margin: 0 auto; padding: 0.5rem 1.5rem; min-height: 66px; display: flex; align-items: center; justify-content: space-between; }
        .nm-cats-logo-wrap { display: flex; align-items: center; gap: 1rem; }
        .nm-cats-back { text-decoration: none; color: #005b9f; font-weight: 600; font-size: 0.88rem; display: flex; align-items: center; gap: 0.3rem; transition: color 0.2s; }
        .nm-cats-back:hover { color: #003d6b; }
        .nm-cats-logo { height: 52px; width: auto; max-width: 220px; object-fit: contain; cursor: pointer; }
        .nm-cats-cart { background: #005b9f; color: #fff; border: none; border-radius: 9px; padding: 0.5rem 1rem; cursor: pointer; font-weight: 600; font-size: 0.85rem; position: relative; transition: background 0.2s; }
        .nm-cats-cart:hover { background: #004a82; }
        .nm-cats-cart-badge { position: absolute; top: -6px; right: -6px; background: #ef4444; color: #fff; border-radius: 99px; width: 18px; height: 18px; font-size: 0.65rem; font-weight: 700; display: flex; align-items: center; justify-content: center; }

        /* HERO */
        .nm-cats-hero { background: linear-gradient(135deg, #003d6b 0%, #005b9f 100%); color: #fff; padding: 3rem 1.5rem; text-align: center; }
        .nm-cats-hero-inner { max-width: 750px; margin: 0 auto; }
        .nm-cats-hero h1 { font-size: clamp(1.7rem, 4vw, 2.6rem); font-weight: 800; margin-bottom: 0.6rem; }
        .nm-cats-hero p { opacity: 0.88; font-size: 1rem; line-height: 1.5; }

        /* CATEGORIES CONTAINER */
        .nm-cats-container { max-width: 1280px; margin: 2.5rem auto; padding: 0 1.5rem; }
        .nm-cats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }

        /* CATEGORY CARD */
        .nm-primary-card { background: #fff; border: 1px solid #eef2f6; border-radius: 20px; padding: 1.6rem; cursor: pointer; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); display: flex; align-items: center; gap: 1.25rem; box-shadow: 0 4px 12px rgba(0,0,0,0.03); position: relative; }
        .nm-primary-card:hover { border-color: #005b9f; transform: translateY(-3px); box-shadow: 0 12px 28px rgba(0,91,159,0.12); }
        .nm-primary-icon { width: 62px; height: 62px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 2rem; flex-shrink: 0; }
        .nm-primary-info { flex: 1; }
        .nm-primary-title { font-size: 1.05rem; font-weight: 800; color: #111; margin-bottom: 0.35rem; line-height: 1.3; }
        .nm-primary-subcount { font-size: 0.8rem; color: #005b9f; font-weight: 600; display: flex; align-items: center; gap: 0.25rem; }
        .nm-primary-arrow { color: #9ca3af; font-size: 1.1rem; transition: transform 0.2s, color 0.2s; }
        .nm-primary-card:hover .nm-primary-arrow { transform: translateX(3px); color: #005b9f; }

        /* POPOUT MODAL */
        .nm-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.55); backdrop-filter: blur(4px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1.5rem; animation: fadeIn 0.2s ease-out; }
        .nm-modal-content { background: #fff; border-radius: 24px; width: 100%; max-width: 680px; max-height: 85vh; overflow-y: auto; padding: 2rem; box-shadow: 0 20px 50px rgba(0,0,0,0.2); position: relative; animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
        .nm-modal-close { position: absolute; top: 1.25rem; right: 1.25rem; width: 36px; height: 36px; border-radius: 50%; border: none; background: #f3f4f6; color: #4b5563; font-size: 1.2rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s; }
        .nm-modal-close:hover { background: #e5e7eb; color: #111; }
        
        .nm-modal-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid #f0f0f0; }
        .nm-modal-icon { width: 54px; height: 54px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; }
        .nm-modal-title h2 { font-size: 1.35rem; font-weight: 800; color: #111; }
        .nm-modal-title p { font-size: 0.85rem; color: #6b7280; margin-top: 0.15rem; }

        .nm-subcats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.85rem; margin-bottom: 1.75rem; }
        .nm-subcat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 0.85rem 1.1rem; text-decoration: none; color: #334155; font-size: 0.9rem; font-weight: 600; display: flex; align-items: center; justify-content: space-between; transition: all 0.2s; }
        .nm-subcat-card:hover { background: #eff6ff; border-color: #3b82f6; color: #1d4ed8; transform: translateY(-1px); }
        .nm-subcat-arrow { font-size: 0.8rem; opacity: 0.6; }
        .nm-subcat-card:hover .nm-subcat-arrow { opacity: 1; transform: translateX(2px); }

        .nm-modal-action { background: #005b9f; color: #fff; border: none; border-radius: 12px; padding: 0.85rem; width: 100%; font-weight: 700; font-size: 0.95rem; cursor: pointer; text-align: center; transition: background 0.2s; }
        .nm-modal-action:hover { background: #004a82; }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

        @media (max-width: 640px) {
          .nm-subcats-grid { grid-template-columns: 1fr; }
          .nm-cats-grid { grid-template-columns: 1fr; }
          .nm-modal-content { padding: 1.5rem; }
        }
      `}</style>

      {/* HEADER */}
      <header className="nm-cats-header">
        <div className="nm-cats-header-inner">
          <div className="nm-cats-logo-wrap">
            <a href="/" className="nm-cats-back">← Home</a>
            <img src="/logo.png" alt="NATION MARKET" className="nm-cats-logo" onClick={() => router.push('/')} />
          </div>
          <button className="nm-cats-cart" onClick={() => router.push('/cart')}>
            🛒 Cart
            {cartCount > 0 && <span className="nm-cats-cart-badge">{cartCount}</span>}
          </button>
        </div>
      </header>

      {/* HERO BANNER */}
      <div className="nm-cats-hero">
        <div className="nm-cats-hero-inner">
          <h1>🏪 Marketplace Categories</h1>
          <p>Select a category to view all its specialized subcategories and browse products from verified vendors.</p>
        </div>
      </div>

      {/* PRIMARY CATEGORIES LIST (10 Primary Categories Only) */}
      <div className="nm-cats-container">
        {loading ? (
          <div style={{ padding: '4rem', color: '#9ca3af', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🏪</div>
            <p>Loading marketplace categories...</p>
          </div>
        ) : (
          <div className="nm-cats-grid">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="nm-primary-card"
                onClick={() => setSelectedCat(cat)}
              >
                <div
                  className="nm-primary-icon"
                  style={{ background: CATEGORY_COLORS[cat.name] || '#f4f6f8' }}
                >
                  {CATEGORY_ICONS[cat.name] || '🏪'}
                </div>
                <div className="nm-primary-info">
                  <div className="nm-primary-title">{cat.name}</div>
                  <div className="nm-primary-subcount">
                    {cat.subcategories.length} subcategories
                  </div>
                </div>
                <div className="nm-primary-arrow">→</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SUBCATEGORY POPOUT MODAL */}
      {selectedCat && (
        <div className="nm-modal-overlay" onClick={() => setSelectedCat(null)}>
          <div className="nm-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="nm-modal-close" onClick={() => setSelectedCat(null)}>
              ✕
            </button>

            <div className="nm-modal-header">
              <div
                className="nm-modal-icon"
                style={{ background: CATEGORY_COLORS[selectedCat.name] || '#f4f6f8' }}
              >
                {CATEGORY_ICONS[selectedCat.name] || '🏪'}
              </div>
              <div className="nm-modal-title">
                <h2>{selectedCat.name}</h2>
                <p>Select a subcategory or browse all items in this section</p>
              </div>
            </div>

            <div className="nm-subcats-grid">
              {selectedCat.subcategories.map((sub) => (
                <a
                  key={sub.id}
                  href={`/category/${selectedCat.slug}?sub=${sub.slug}`}
                  className="nm-subcat-card"
                >
                  <span>{sub.name}</span>
                  <span className="nm-subcat-arrow">→</span>
                </a>
              ))}
            </div>

            <button
              className="nm-modal-action"
              onClick={() => router.push(`/category/${selectedCat.slug}`)}
            >
              Browse All {selectedCat.name} Products ({selectedCat.subcategories.length} subcategories) →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
