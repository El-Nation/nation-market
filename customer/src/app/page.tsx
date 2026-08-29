'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useLocationStore } from '../store/locationStore';
import { useRouter } from 'next/navigation';

interface Subcategory { id: string; name: string; slug: string; }
interface Category { id: string; name: string; slug: string; subcategories: Subcategory[]; }
interface Vendor { id: string; storeName: string; logoUrl?: string; coverUrl?: string; businessType: string; address?: string; openingHours?: string; rating?: number; deliveryTime?: string; }
interface Product { id: string; name: string; price: number; discount: number; images: string; unit?: string; isAvailable: boolean; vendor: { id: string; storeName: string; logoUrl?: string; }; category?: { name: string; }; subcategory?: { name: string; }; }

const CATEGORY_TILES: { name: string; icon: string; bg: string; badge?: string }[] = [
  { name: 'Supermarket & Groceries', icon: '🛒', bg: '#dcfce7' },
  { name: 'Restaurants & Food', icon: '🍽️', bg: '#f3e8ff' },
  { name: 'Fashion & Beauty', icon: '👗', bg: '#ffe4e6', badge: '• New' },
  { name: 'Electronics & Gadgets', icon: '📱', bg: '#e0f2fe' },
  { name: 'Agriculture & Farming', icon: '🌾', bg: '#d1fae5' },
  { name: 'Pharmacy & Health', icon: '💊', bg: '#e0f2fe' },
  { name: 'Home & Kitchen', icon: '🏠', bg: '#f0fdf4' },
  { name: 'Automotive & Tools', icon: '🔧', bg: '#f3f4f6' },
  { name: 'Books & Education', icon: '📚', bg: '#ffedd5' },
  { name: 'Toys, Kids & Babies', icon: '🧸', bg: '#fef9c3' },
];

function optimizeImg(url: string, w = 400) {
  if (!url || !url.includes('cloudinary.com')) return url;
  return url.replace('/upload/', `/upload/w_${w},c_limit,f_auto,q_auto/`);
}

export default function MarketplacePage() {
  const { user, token, logout, initAuth } = useAuthStore();
  const { addItem, totalItems, initCart } = useCartStore();
  const { location, setLocation, initLocation, detectLocation, isDetecting } = useLocationStore();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ products: Product[]; vendors: Vendor[]; categories: Category[] } | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const API = (process.env.NEXT_PUBLIC_API_URL && !((process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('localhost') ? process.env.NEXT_PUBLIC_API_URL : 'https://api.eghedev.com').replace(/\/api\/?$/, '')).includes('localhost') ? ((process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('localhost') ? process.env.NEXT_PUBLIC_API_URL : 'https://api.eghedev.com').replace(/\/api\/?$/, '')) : 'https://api.eghedev.com').replace(/\/+$/, '') + '/api/storefront';

  useEffect(() => {
    setIsMounted(true);
    initAuth();
    initCart();
    initLocation();
    fetchAll();
  }, [initAuth, initCart, initLocation]);

  async function fetchAll() {
    try {
      const [catRes, vendorRes, prodRes] = await Promise.all([
        fetch(`${API}/categories`),
        fetch(`${API}/vendors?limit=8`),
        fetch(`${API}/products?limit=12`)
      ]);
      const [catData, vendorData, prodData] = await Promise.all([catRes.json(), vendorRes.json(), prodRes.json()]);
      if (catData?.success) setCategories(catData.data);
      if (vendorData?.success) setVendors(vendorData.data);
      if (prodData?.success) setFeaturedProducts(prodData.data);
    } catch (err: any) {
      console.error('Error fetching marketplace data:', err);
      setFetchError(err.message || 'Failed to fetch');
    }
  }

  const handleSearch = useCallback(async (q: string) => {
    setSearchQuery(q);
    if (q.trim().length < 2) { setSearchResults(null); return; }
    const res = await fetch(`${API}/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    if (data.success) setSearchResults(data.data);
  }, []);

  function handleAddToCart(p: Product) {
    addItem({
      productId: p.id,
      vendorId: p.vendor.id,
      vendorName: p.vendor.storeName,
      name: p.name,
      price: p.price,
      discount: p.discount,
      image: p.images,
      unit: p.unit
    });
    setAddedId(p.id);
    setTimeout(() => setAddedId(null), 1500);
  }



  const focusSearch = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
      setSearchOpen(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const cartCount = isMounted ? totalItems() : 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; background: #f8fafc; color: #0f172a; }

        /* ══ ROW 1: TOP UTILITY HEADER ══ */
        .cd-header {
          position: sticky;
          top: 0;
          z-index: 1000;
          background: #ffffff;
          border-bottom: 2px solid #e2e8f0;
          box-shadow: 0 4px 24px rgba(0,0,0,0.05);
        }

        /* Row 1 — main utility bar */
        .cd-header-main {
          max-width: 1440px;
          margin: 0 auto;
          padding: 0.75rem 2rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        /* Logo */
        .cd-logo-wrap { display: flex; align-items: center; flex-shrink: 0; cursor: pointer; }
        .cd-logo {
          height: 80px;
          width: auto;
          max-width: 240px;
          object-fit: contain;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .cd-logo:hover { transform: scale(1.02); }

        /* Location Pill */
        .cd-location-pill {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 0.35rem;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 99px;
          padding: 0.45rem 0.9rem;
          cursor: pointer;
          font-size: 0.82rem;
          font-weight: 600;
          color: #1e293b;
          white-space: nowrap;
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          transition: background 0.2s;
        }
        .cd-location-pill:hover { background: #e2e8f0; }
        .cd-loc-icon { color: #059669; }
        .cd-loc-arrow { color: #94a3b8; font-size: 0.72rem; flex-shrink: 0; }

        /* Search */
        .cd-search-wrap { flex: 1; min-width: 0; position: relative; }
        .cd-search-input {
          width: 100%;
          padding: 0.65rem 1rem 0.65rem 2.75rem;
          border: 1.5px solid #e2e8f0;
          border-radius: 99px;
          font-size: 0.9rem;
          background: #f8fafc;
          outline: none;
          transition: all 0.2s;
          font-family: inherit;
        }
        .cd-search-input:focus { border-color: #059669; background: #fff; box-shadow: 0 0 0 3px rgba(5,150,105,0.12); }
        .cd-search-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #94a3b8; }

        /* Action group: Filter | Cart | Sign Up */
        .cd-header-actions { display: flex; align-items: center; gap: 0.6rem; flex-shrink: 0; }

        .cd-filter-btn {
          display: flex; align-items: center; gap: 0.35rem;
          background: #064e3b; color: #fff;
          border: none; border-radius: 99px;
          padding: 0.55rem 1.1rem;
          font-size: 0.83rem; font-weight: 700;
          cursor: pointer; white-space: nowrap;
          transition: background 0.2s;
        }
        @media (hover: hover) { .cd-filter-btn:hover { background: #047857; } }

        .cd-cart-btn {
          position: relative;
          background: #f1f5f9; color: #0f172a;
          border: 1.5px solid #e2e8f0;
          border-radius: 99px;
          padding: 0.55rem 1.1rem;
          font-size: 0.83rem; font-weight: 700;
          cursor: pointer;
          display: flex; align-items: center; gap: 0.35rem;
          white-space: nowrap;
          transition: all 0.2s;
        }
        @media (hover: hover) { .cd-cart-btn:hover { background: #e2e8f0; } }
        .cd-cart-badge {
          position: absolute; top: -5px; right: -5px;
          background: #ef4444; color: #fff;
          border-radius: 99px; width: 18px; height: 18px;
          font-size: 0.62rem; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
        }

        /* Sign Up CTA */
        .cd-signup-btn {
          background: #059669; color: #fff;
          border: none; border-radius: 99px;
          padding: 0.55rem 1.25rem;
          font-size: 0.83rem; font-weight: 700;
          cursor: pointer; white-space: nowrap;
          transition: background 0.2s, box-shadow 0.2s;
          font-family: inherit;
        }
        @media (hover: hover) { .cd-signup-btn:hover { background: #047857; box-shadow: 0 4px 14px rgba(5,150,105,0.3); } }

        /* ══ ROW 2: NAVIGATION DOCK ══ */
        .cd-nav-dock-bar {
          background: #f8fafc;
          border-top: 1px solid #f1f5f9;
          padding: 0.5rem 2rem;
        }
        .cd-nav-dock {
          max-width: 680px;
          margin: 0 auto;
          background: #fff;
          border: 1.5px solid #e2e8f0;
          border-radius: 99px;
          padding: 0.3rem 0.5rem;
          display: flex;
          align-items: center;
          justify-content: space-around;
          box-shadow: 0 2px 12px rgba(0,0,0,0.05);
        }
        .cd-dock-item {
          display: flex; align-items: center; gap: 0.35rem;
          padding: 0.45rem 1rem;
          border-radius: 99px; border: none;
          background: transparent; color: #64748b;
          font-size: 0.85rem; font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
          font-family: inherit;
          white-space: nowrap;
        }
        @media (hover: hover) { .cd-dock-item:hover { color: #059669; background: #f1f5f9; } }
        .cd-dock-item.active { background: #059669; color: #fff; font-weight: 700; box-shadow: 0 2px 8px rgba(5,150,105,0.25); }

        /* Search Dropdown */
        .cd-search-dropdown { position: absolute; top: calc(100% + 10px); left: 0; right: 0; background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 12px 36px rgba(0,0,0,0.12); z-index: 200; overflow: hidden; max-height: 420px; overflow-y: auto; }
        .cd-search-section { padding: 0.75rem 1rem 0.4rem; font-size: 0.72rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
        .cd-search-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.65rem 1rem; cursor: pointer; transition: background 0.15s; font-size: 0.88rem; }
        .cd-search-item:hover { background: #f8fafc; }
        .cd-search-thumb { width: 36px; height: 36px; border-radius: 8px; object-fit: cover; background: #f1f5f9; flex-shrink: 0; }

        /* ══ HERO BANNER ══ */
        .cd-hero-banner { max-width: 1280px; margin: 1.5rem auto 1rem; padding: 0 1.5rem; }
        .cd-hero-card { background: linear-gradient(125deg, #064e3b 0%, #047857 50%, #059669 100%); color: #fff; border-radius: 24px; padding: 2rem 2.5rem; display: flex; align-items: center; justify-content: space-between; gap: 2rem; position: relative; overflow: hidden; box-shadow: 0 10px 30px rgba(6,78,59,0.2); }
        .cd-hero-content { max-width: 540px; z-index: 2; }
        .cd-hero-badge { display: inline-flex; align-items: center; gap: 0.35rem; background: #10b981; color: #064e3b; border-radius: 99px; padding: 0.25rem 0.85rem; font-size: 0.8rem; font-weight: 800; margin-bottom: 0.85rem; }
        .cd-hero-card h1 { font-size: clamp(1.6rem, 4vw, 2.5rem); font-weight: 800; line-height: 1.15; margin-bottom: 0.65rem; }
        .cd-hero-card p { font-size: 1rem; opacity: 0.9; margin-bottom: 1.25rem; line-height: 1.5; }
        .cd-hero-btn { background: #ffffff; color: #064e3b; border: none; border-radius: 99px; padding: 0.7rem 1.75rem; font-size: 0.9rem; font-weight: 800; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; }
        .cd-hero-btn:hover { transform: scale(1.03); box-shadow: 0 6px 20px rgba(0,0,0,0.15); }
        .cd-hero-img-wrap { width: 260px; height: 160px; border-radius: 16px; overflow: hidden; flex-shrink: 0; box-shadow: 0 8px 24px rgba(0,0,0,0.2); }
        .cd-hero-img { width: 100%; height: 100%; object-fit: cover; }

        /* ══ CATEGORY GRID ══ */
        .cd-section { max-width: 1280px; margin: 2rem auto; padding: 0 1.5rem; overflow-x: hidden; }
        .cd-cat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(120px, 100%), 1fr)); gap: 1.1rem; }
        .cd-cat-tile { border-radius: 20px; padding: 1.5rem 1rem; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 0.75rem; cursor: pointer; transition: all 0.25s cubic-bezier(0.4,0,0.2,1); border: 1px solid rgba(0,0,0,0.04); position: relative; min-height: 130px; }
        .cd-cat-tile:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0,0,0,0.1); }
        .cd-cat-tile-badge { position: absolute; top: 10px; right: 10px; background: #ef4444; color: #fff; border-radius: 99px; padding: 0.15rem 0.5rem; font-size: 0.65rem; font-weight: 800; }
        .cd-cat-tile-icon { font-size: 2.5rem; line-height: 1; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.06)); }
        .cd-cat-tile-name { font-size: 0.85rem; font-weight: 700; color: #0f172a; line-height: 1.25; }

        /* ══ DEAL BANNER ══ */
        .cd-deal-banner { background: linear-gradient(120deg, #0f172a, #1e293b); color: #fff; border-radius: 20px; padding: 1.25rem 2rem; margin: 2.5rem auto; max-width: 1280px; display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
        .cd-deal-text h3 { font-size: 1.15rem; font-weight: 800; margin-bottom: 0.25rem; }
        .cd-deal-text p { font-size: 0.88rem; color: #94a3b8; }
        .cd-deal-btn { background: #059669; color: #fff; border: none; border-radius: 99px; padding: 0.6rem 1.5rem; font-size: 0.88rem; font-weight: 800; cursor: pointer; transition: background 0.2s; }
        .cd-deal-btn:hover { background: #047857; }

        /* ══ STORES + PRODUCTS SECTIONS ══ */
        .cd-section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; }
        .cd-section-title { font-size: 1.35rem; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 0.4rem; }
        .cd-view-all { font-size: 0.88rem; color: #059669; font-weight: 700; text-decoration: none; }
        .cd-view-all:hover { text-decoration: underline; }

        .cd-stores-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(150px, 100%), 1fr)); gap: 1.25rem; }
        .cd-store-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; cursor: pointer; text-decoration: none; transition: all 0.25s; display: flex; flex-direction: column; }
        .cd-store-card:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(0,0,0,0.08); border-color: #cbd5e1; }
        .cd-store-cover-wrap { position: relative; height: 130px; background: #e2e8f0; }
        .cd-store-cover { width: 100%; height: 100%; object-fit: cover; }
        .cd-store-cover-ph { width: 100%; height: 100%; background: linear-gradient(135deg, #dbeafe, #bfdbfe); display: flex; align-items: center; justify-content: center; font-size: 2.5rem; }
        .cd-store-logo-overlay { position: absolute; bottom: -16px; left: 16px; width: 44px; height: 44px; border-radius: 12px; border: 2px solid #fff; background: #fff; overflow: hidden; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.1rem; color: #059669; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
        .cd-store-body { padding: 1.5rem 1rem 1rem; flex: 1; display: flex; flex-direction: column; }
        .cd-store-name { font-size: 0.95rem; font-weight: 800; color: #0f172a; margin-bottom: 0.25rem; display: flex; align-items: center; gap: 0.3rem; }
        .cd-verified-check { color: #059669; font-size: 0.9rem; }
        .cd-store-meta { display: flex; align-items: center; gap: 0.6rem; font-size: 0.78rem; color: #64748b; margin-top: 0.4rem; flex-wrap: wrap; }
        .cd-meta-tag { background: #f1f5f9; padding: 0.15rem 0.5rem; border-radius: 6px; font-weight: 600; }

        .cd-prods-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(145px, 100%), 1fr)); gap: 1.25rem; }
        .cd-prod-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; transition: all 0.25s; display: flex; flex-direction: column; }
        .cd-prod-card:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(0,0,0,0.08); }
        .cd-prod-img-wrap { position: relative; height: 170px; background: #f8fafc; cursor: pointer; }
        .cd-prod-img { width: 100%; height: 100%; object-fit: cover; }
        .cd-prod-img-ph { width: 100%; height: 100%; background: linear-gradient(135deg, #f1f5f9, #e2e8f0); display: flex; align-items: center; justify-content: center; font-size: 3rem; }
        .cd-discount-tag { position: absolute; top: 10px; left: 10px; background: #ef4444; color: #fff; border-radius: 8px; padding: 0.2rem 0.5rem; font-size: 0.7rem; font-weight: 800; }
        .cd-prod-body { padding: 1rem; flex: 1; display: flex; flex-direction: column; }
        .cd-prod-title { font-size: 0.9rem; font-weight: 700; color: #0f172a; margin-bottom: 0.25rem; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .cd-prod-vendor { font-size: 0.78rem; color: #64748b; margin-bottom: 0.6rem; }
        .cd-prod-price-row { display: flex; align-items: center; gap: 0.4rem; margin-top: auto; margin-bottom: 0.75rem; }
        .cd-prod-price { font-size: 1.05rem; font-weight: 800; color: #059669; }
        .cd-prod-orig { font-size: 0.78rem; color: #94a3b8; text-decoration: line-through; }
        .cd-add-btn { background: #059669; color: #fff; border: none; border-radius: 12px; padding: 0.6rem; font-size: 0.85rem; font-weight: 700; cursor: pointer; width: 100%; transition: background 0.2s; font-family: inherit; }
        .cd-add-btn:hover { background: #047857; }
        .cd-add-btn.added { background: #16a34a; }

        /* ══ MODALS ══ */
        .cd-modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.6); backdrop-filter: blur(4px); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
        .cd-modal-box { background: #fff; border-radius: 24px; width: 100%; max-width: 520px; padding: 2rem; box-shadow: 0 20px 50px rgba(0,0,0,0.2); position: relative; }
        .cd-modal-close { position: absolute; top: 1.25rem; right: 1.25rem; border: none; background: #f1f5f9; border-radius: 50%; width: 32px; height: 32px; cursor: pointer; font-weight: 700; }

        /* ══ RESPONSIVE BREAKPOINTS ══ */

        /* Large desktop: hero image visible, 5-col categories */
        @media (min-width: 1280px) {
          .cd-cat-grid { grid-template-columns: repeat(5, 1fr); }
        }

        /* Medium desktop / large tablet (900–1280px) */
        @media (max-width: 1280px) and (min-width: 900px) {
          .cd-hero-banner { padding: 0 1.25rem; }
        }

        /* Tablet (600–900px) */
        @media (max-width: 900px) {
          .cd-header-main { padding: 0.65rem 1.25rem; gap: 0.75rem; }
          .cd-logo { height: 62px; }
          .cd-location-pill { display: none; }
          .cd-cat-grid { grid-template-columns: repeat(2, 1fr); gap: 1rem; }
          .cd-stores-grid { grid-template-columns: repeat(2, 1fr); }
          .cd-prods-grid { grid-template-columns: repeat(2, 1fr); }
          .cd-hero-card { flex-direction: column; text-align: center; padding: 1.75rem 1.25rem; }
          .cd-hero-img-wrap { width: 100%; height: 200px; max-width: 400px; margin: 0 auto; }
          .cd-signup-btn span { display: none; }
        }

        /* Mobile (< 600px) */
        @media (max-width: 600px) {
          .cd-header-main { padding: 0.55rem 0.5rem; gap: 0.25rem; flex-wrap: wrap; justify-content: space-between; }
          .cd-logo-wrap { flex: 0 0 auto; }
          .cd-logo { height: 40px; max-width: 120px; }
          .cd-search-wrap { order: 4; flex: 0 0 100%; min-width: 100%; margin-top: 0.25rem; }
          .cd-nav-dock-bar { padding: 0.4rem 0.5rem; }
          .cd-dock-item { padding: 0.4rem 0.6rem; font-size: 0.78rem; gap: 0.2rem; }
          .cd-section { padding: 0 1rem; }
          .cd-header-actions { gap: 0.25rem; }
          .cd-signup-btn { padding: 0.45rem 0.65rem; font-size: 0.75rem; }
          .cd-signup-btn span { display: inline; } /* Keep the text visible if possible, but shrink padding */
          .cd-cart-btn { padding: 0.45rem 0.65rem; font-size: 0.75rem; }
          .cd-filter-btn { display: none; }
        }

        /* Very small phones (< 375px) */
        @media (max-width: 375px) {
          .cd-header-main { padding: 0.5rem 0.25rem; gap: 0.25rem; }
          .cd-logo { height: 35px; max-width: 100px; }
          .cd-cart-btn { padding: 0.4rem 0.5rem; font-size: 0.7rem; }
          .cd-signup-btn { padding: 0.4rem 0.5rem; font-size: 0.7rem; }
          .cd-section-title { font-size: 1.15rem; }
        }
      `}</style>

      {/* ══ ROW 1: TOP UTILITY HEADER ══ */}
      <header className="cd-header">
        <div className="cd-header-main">

          {/* Brand Logo */}
          <div className="cd-logo-wrap" onClick={() => router.push('/')}>
            <img src="/logo.png" alt="NATION MARKET" className="cd-logo" />
          </div>

          {/* Delivery Location Pill */}
          <div className="cd-location-pill" onClick={() => setLocationModalOpen(true)} title="Change delivery location">
            <span className="cd-loc-icon">📍</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {location.length > 22 ? location.slice(0, 22) + '…' : location}
            </span>
            <span className="cd-loc-arrow">▼</span>
          </div>

          {/* Search Input */}
          <div className="cd-search-wrap">
            <span className="cd-search-icon">🔍</span>
            <input
              ref={searchInputRef}
              className="cd-search-input"
              placeholder="Search products, stores, categories..."
              value={searchQuery}
              onChange={e => { handleSearch(e.target.value); setSearchOpen(true); }}
              onFocus={() => setSearchOpen(true)}
              onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchResults) {
                  if (searchResults.products.length > 0) router.push(`/product/${searchResults.products[0].id}`);
                  else if (searchResults.vendors.length > 0) router.push(`/store/${searchResults.vendors[0].id}`);
                  else if (searchResults.categories.length > 0) router.push(`/category/${searchResults.categories[0].slug}`);
                }
              }}
            />
            {searchOpen && searchResults && (
              <div className="cd-search-dropdown">
                {searchResults.categories.length > 0 && (
                  <>
                    <div className="cd-search-section">Categories</div>
                    {searchResults.categories.map(c => (
                      <div key={c.id} className="cd-search-item" onMouseDown={(e) => { e.preventDefault(); router.push(`/category/${c.slug}`); }}>
                        <span>🏪</span> {c.name}
                      </div>
                    ))}
                  </>
                )}
                {searchResults.vendors.length > 0 && (
                  <>
                    <div className="cd-search-section">Stores</div>
                    {searchResults.vendors.map(v => (
                      <div key={v.id} className="cd-search-item" onMouseDown={(e) => { e.preventDefault(); router.push(`/store/${v.id}`); }}>
                        {v.logoUrl ? <img src={optimizeImg(v.logoUrl, 40)} className="cd-search-thumb" alt="" /> : <span>🏪</span>}
                        <span>{v.storeName}</span>
                      </div>
                    ))}
                  </>
                )}
                {searchResults.products.length > 0 && (
                  <>
                    <div className="cd-search-section">Products</div>
                    {searchResults.products.map(p => (
                      <div key={p.id} className="cd-search-item" onMouseDown={(e) => { e.preventDefault(); router.push(`/product/${p.id}`); }}>
                        {p.images ? <img src={optimizeImg(p.images, 40)} className="cd-search-thumb" alt="" /> : <span>📦</span>}
                        <div>
                          <div style={{ fontWeight: 700 }}>{p.name}</div>
                          <div style={{ fontSize: '0.78rem', color: '#059669' }}>₦{p.price.toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons: Filter | Cart | Sign Up */}
          <div className="cd-header-actions">
            <button className="cd-filter-btn" onClick={() => router.push('/categories')} title="Browse all categories">
              🎛️ Filter
            </button>
            <button className="cd-cart-btn" onClick={() => router.push('/cart')} title="View cart">
              🛒 Cart
              {cartCount > 0 && <span className="cd-cart-badge">{cartCount}</span>}
            </button>
            {/* Sign Up / Account — routes to existing auth form, never duplicates it */}
            {isMounted && user ? (
              <button
                className="cd-signup-btn"
                onClick={() => setProfileModalOpen(true)}
                title="View your account"
              >
                👤 <span>Account</span>
              </button>
            ) : (
              <button
                className="cd-signup-btn"
                onClick={() => window.location.href = '/login'}
                title="Sign up or log in"
              >
                ✨ <span>Sign Up</span>
              </button>
            )}
          </div>
        </div>

        {/* ══ ROW 2: NAVIGATION DOCK — clearly separated below Row 1 ══ */}
        <div className="cd-nav-dock-bar">
          <nav className="cd-nav-dock">
            <button className="cd-dock-item active" onClick={() => router.push('/')}>
              🏠 <span>Home</span>
            </button>
            <button className="cd-dock-item" onClick={focusSearch}>
              🔍 <span>Search</span>
            </button>
            <button className="cd-dock-item" onClick={() => router.push('/cart')} style={{ position: 'relative' }}>
              🛒 <span>Cart</span>
              {totalItems() > 0 && (
                <div style={{ position: 'absolute', top: '2px', right: '15px', background: '#fbbf24', color: '#111', fontSize: '0.65rem', fontWeight: 800, height: '18px', minWidth: '18px', padding: '0 4px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {totalItems()}
                </div>
              )}
            </button>
            <button className="cd-dock-item" onClick={() => setSupportModalOpen(true)}>
              🎧 <span>Support</span>
            </button>
            <button className="cd-dock-item" onClick={() => setProfileModalOpen(true)}>
              👤 <span>Profile</span>
            </button>
          </nav>
        </div>
      </header>

      {/* ── HERO BANNER (Chowdeck Style) ── */}
      <div className="cd-hero-banner">
        <div className="cd-hero-card">
          <div className="cd-hero-content">
            <div className="cd-hero-badge">
              <span>• Deals from ₦1,500</span>
            </div>
            <h1>Get the Nation Combo Now</h1>
            <p>From fresh groceries to electronics, fashion, farm produce, and fast food — delivered directly to your doorstep across Nigeria.</p>
            <button className="cd-hero-btn" onClick={() => router.push('/categories')}>
              Order Now →
            </button>
          </div>
          <div className="cd-hero-img-wrap">
            <img
              src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80"
              alt="Grocery & Market Promo"
              className="cd-hero-img"
            />
          </div>
        </div>
      </div>

      {/* ── PASTEL CATEGORY GRID (4-Column Layout) ── */}
      <section className="cd-section">
        <div className="cd-cat-grid">
          {CATEGORY_TILES.map(tile => {
            const matchedCat = categories.find(c => c.name === tile.name);
            return (
              <div
                key={tile.name}
                className="cd-cat-tile"
                style={{ background: tile.bg }}
                onClick={() => {
                  if (matchedCat) setSelectedCat(matchedCat);
                  else router.push('/categories');
                }}
              >
                {tile.badge && <span className="cd-cat-tile-badge">{tile.badge}</span>}
                <div className="cd-cat-tile-icon">{tile.icon}</div>
                <div className="cd-cat-tile-name">{tile.name}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── SECONDARY DEAL BANNER ── */}
      <div className="cd-deal-banner">
        <div className="cd-deal-text">
          <h3>Enjoy Exclusive Deals & Promos</h3>
          <p>Get up to 25% discount on verified vendor stores today.</p>
        </div>
        <button className="cd-deal-btn" onClick={() => router.push('/categories')}>
          Order Now
        </button>
      </div>

      {/* ── HANDPICKED STORES ("Handpicked for you 💚") ── */}
      <section className="cd-section">
        <div className="cd-section-header">
          <h2 className="cd-section-title">
            Handpicked for you 💚
          </h2>
          <a href="/stores" className="cd-view-all">View all →</a>
        </div>

        {vendors.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
            <div style={{ fontSize: '2.5rem' }}>🏪</div>
            <p style={{ marginTop: '0.5rem' }}>No stores available yet.</p>
          </div>
        ) : (
          <div className="cd-stores-grid">
            {vendors.map(v => (
              <a key={v.id} href={`/store/${v.id}`} className="cd-store-card">
                <div className="cd-store-cover-wrap">
                  {v.coverUrl
                    ? <img src={optimizeImg(v.coverUrl, 500)} alt={v.storeName} className="cd-store-cover" loading="lazy" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(v.storeName)}&background=f8fafc&color=94a3b8&size=500`; }} />
                    : <div className="cd-store-cover-ph">🏪</div>
                  }
                  <div className="cd-store-logo-overlay">
                    {v.logoUrl ? <img src={optimizeImg(v.logoUrl, 80)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(v.storeName)}&background=0f172a&color=fff&size=80`; }} /> : v.storeName.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="cd-store-body">
                  <div className="cd-store-name">
                    {v.storeName}
                    <span className="cd-verified-check">✓</span>
                  </div>
                  <div className="cd-store-meta">
                    <span className="cd-meta-tag">🚚 15 - 25 min</span>
                    <span className="cd-meta-tag">From ₦500</span>
                    <span style={{ color: '#eab308', fontWeight: 700 }}>⭐ 5.0</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>

      {/* ── FEATURED PRODUCTS ── */}
      <section className="cd-section">
        <div className="cd-section-header">
          <h2 className="cd-section-title">
            Trending Products 🛍️
          </h2>
          <a href="/products" className="cd-view-all">View all →</a>
        </div>

        {fetchError ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#ef4444' }}>
            <div style={{ fontSize: '2.5rem' }}>❌</div>
            <p style={{ marginTop: '0.5rem' }}>Failed to load featured products: {fetchError}</p>
          </div>
        ) : featuredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
            <div style={{ fontSize: '2.5rem' }}>📦</div>
            <p style={{ marginTop: '0.5rem' }}>Loading featured products...</p>
          </div>
        ) : (
          <div className="cd-prods-grid">
            {featuredProducts.map(p => (
              <div key={p.id} className="cd-prod-card">
                <div className="cd-prod-img-wrap" onClick={() => router.push(`/product/${p.id}`)}>
                  {p.images
                    ? <img src={optimizeImg(p.images, 400)} alt={p.name} className="cd-prod-img" loading="lazy" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=f8fafc&color=94a3b8&size=400`; }} />
                    : <div className="cd-prod-img-ph">🛍️</div>
                  }
                  {p.discount > 0 && <span className="cd-discount-tag">-{p.discount}%</span>}
                </div>
                <div className="cd-prod-body">
                  <div className="cd-prod-title">{p.name}</div>
                  <div className="cd-prod-vendor">from {p.vendor.storeName}</div>
                  <div className="cd-prod-price-row">
                    <span className="cd-prod-price">₦{p.discount > 0 ? (p.price * (1 - p.discount/100)).toLocaleString(undefined, { maximumFractionDigits: 0 }) : p.price.toLocaleString()}</span>
                    {p.discount > 0 && <span className="cd-prod-orig">₦{p.price.toLocaleString()}</span>}
                  </div>
                  <button
                    className={`cd-add-btn ${addedId === p.id ? 'added' : ''}`}
                    onClick={() => handleAddToCart(p)}
                  >
                    {addedId === p.id ? '✓ Added' : '+ Add to Cart'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── LOCATION SELECTION MODAL ── */}
      {locationModalOpen && (
        <div className="cd-modal-overlay" onClick={() => setLocationModalOpen(false)}>
          <div className="cd-modal-box" onClick={e => e.stopPropagation()}>
            <button className="cd-modal-close" onClick={() => setLocationModalOpen(false)}>✕</button>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>📍 Delivery Location</h2>
            <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '1.25rem' }}>Select your current delivery address in Nigeria to view nearby vendor stores and delivery estimates.</p>
            
            <button
              onClick={async () => { await detectLocation(); setLocationModalOpen(false); }}
              disabled={isDetecting}
              style={{ width: '100%', background: '#059669', color: '#fff', border: 'none', borderRadius: '12px', padding: '0.85rem', fontWeight: 700, cursor: 'pointer', marginBottom: '1rem', opacity: isDetecting ? 0.7 : 1 }}
            >
              {isDetecting ? '📍 Detecting GPS...' : '📍 Detect Current GPS Location'}
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {['29 Imatitikua, Uselu, Benin City', 'Lekki Phase 1, Lagos', 'Ikeja City Mall, Lagos', 'Wuse 2, Abuja'].map(loc => (
                <button
                  key={loc}
                  onClick={() => { setLocation(loc); setLocationModalOpen(false); }}
                  style={{ textAlign: 'left', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── CUSTOMER SUPPORT MODAL ── */}
      {supportModalOpen && (
        <div className="cd-modal-overlay" onClick={() => setSupportModalOpen(false)}>
          <div className="cd-modal-box" onClick={e => e.stopPropagation()}>
            <button className="cd-modal-close" onClick={() => setSupportModalOpen(false)}>✕</button>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>🎧 Customer Support</h2>
            <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '1.5rem' }}>Need assistance with an order, delivery, or vendor enquiry?</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <a href="https://wa.me/2347066784058" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <span style={{ fontSize: '1.5rem' }}>💬</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#166534' }}>Live Chat Support</div>
                  <div style={{ fontSize: '0.78rem', color: '#15803d' }}>Available 24/7 for instant assistance</div>
                </div>
              </a>
              <a href="tel:07066784058" style={{ textDecoration: 'none', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <span style={{ fontSize: '1.5rem' }}>📞</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#075985' }}>Call Center</div>
                  <div style={{ fontSize: '0.78rem', color: '#0369a1' }}>07066784058</div>
                </div>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── PROFILE MODAL ── */}
      {profileModalOpen && (
        <div className="cd-modal-overlay" onClick={() => setProfileModalOpen(false)}>
          <div className="cd-modal-box" onClick={e => e.stopPropagation()}>
            <button className="cd-modal-close" onClick={() => setProfileModalOpen(false)}>✕</button>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>👤 Account Profile</h2>
            {isMounted && user ? (
              <div>
                <p style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.25rem' }}>{user.firstName} {user.lastName}</p>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>{user.email} · Role: {user.role}</p>
                
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={() => {
                      setProfileModalOpen(false);
                      if (user.role === 'ADMIN') window.location.href = 'https://admin.eghedev.com';
                      else if (user.role === 'VENDOR') window.location.href = 'https://vendor.eghedev.com';
                      else if (user.role === 'RIDER') window.location.href = '/rider/dashboard';
                      else router.push('/dashboard');
                    }}
                    style={{ flex: 2, background: '#059669', color: '#fff', border: 'none', borderRadius: '12px', padding: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Go to Dashboard →
                  </button>
                  <button
                    onClick={() => { logout(); setProfileModalOpen(false); }}
                    style={{ flex: 1, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '12px', padding: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '1.25rem' }}>Sign in to manage your orders, saved addresses, and active carts.</p>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={() => { window.location.href = '/login'; }}
                    style={{ flex: 1, background: '#059669', color: '#fff', border: 'none', borderRadius: '12px', padding: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => { window.location.href = '/register'; }}
                    style={{ flex: 1, background: '#f1f5f9', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Register
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SUBCATEGORY SELECTION MODAL ── */}
      {selectedCat && (
        <div className="cd-modal-overlay" onClick={() => setSelectedCat(null)}>
          <div className="cd-modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <button className="cd-modal-close" onClick={() => setSelectedCat(null)}>✕</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '2rem' }}>{CATEGORY_TILES.find(t => t.name === selectedCat.name)?.icon || '🏪'}</span>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{selectedCat.name}</h2>
                <p style={{ fontSize: '0.82rem', color: '#64748b' }}>Select a subcategory to browse products</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {selectedCat.subcategories.map(sub => (
                <a
                  key={sub.id}
                  href={`/category/${selectedCat.slug}?sub=${sub.slug}`}
                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.75rem 1rem', textDecoration: 'none', color: '#0f172a', fontSize: '0.88rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span>{sub.name}</span>
                  <span style={{ color: '#059669' }}>→</span>
                </a>
              ))}
            </div>
            <button
              onClick={() => router.push(`/category/${selectedCat.slug}`)}
              style={{ width: '100%', background: '#059669', color: '#fff', border: 'none', borderRadius: '12px', padding: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
            >
              View All {selectedCat.name} Products →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
