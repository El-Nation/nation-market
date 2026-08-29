'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCartStore } from '../../../store/cartStore';

const API = (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('localhost') ? process.env.NEXT_PUBLIC_API_URL.replace(/:\d+$/, '').replace(/^http:\/\//i, 'https://') : 'https://api.eghedev.com').replace(/\/api\/?$/, '')).includes('localhost') ? ((process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('localhost') ? process.env.NEXT_PUBLIC_API_URL.replace(/:\d+$/, '').replace(/^http:\/\//i, 'https://') : 'https://api.eghedev.com').replace(/\/api\/?$/, '')) : 'https://api.eghedev.com') + '/api/storefront';

interface Product { id: string; name: string; price: number; discount: number; images: string; unit?: string; isAvailable: boolean; subcategory?: { name: string; }; }
interface Vendor { id: string; storeName: string; logoUrl?: string; coverUrl?: string; businessType: string; address?: string; openingHours?: string; description?: string; subcategories?: { name: string }[]; }
interface StoreData { vendor: Vendor; products: Product[]; total: number; pages: number; }

function optimizeImg(url: string, w = 400) {
  if (!url) return url;
  if (url.includes('cloudinary.com')) {
    return url.replace('/upload/', `/upload/w_${w},c_limit,f_auto,q_auto/`);
  }
  if (url.includes('loremflickr.com')) {
    // Preserve 1.5 ratio -> 1200/800 prevents Flickr from aggressive panorama cropping that causes pixelated zooms
    return url.replace(/\/\d+\/\d+\//, `/${w}/${Math.floor(w * 0.66)}/`);
  }
  if (url.includes('unsplash.com')) {
    return url.replace(/w=\d+/, `w=${w}`);
  }
  return url;
}

function parseHours(raw?: string) {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export default function VendorStorePage() {
  const params = useParams<{ vendorId: string }>();
  const router = useRouter();
  const { addItem, totalItems } = useCartStore();
  const [storeData, setStoreData] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchStore();
  }, [params.vendorId, page]);

  async function fetchStore() {
    setLoading(true);
    const res = await fetch(`${API}/vendors/${params.vendorId}?page=${page}`);
    const data = await res.json();
    if (data.success) setStoreData(data.data);
    setLoading(false);
  }

  function handleAddToCart(p: Product) {
    if (!storeData) return;
    addItem({ productId: p.id, vendorId: storeData.vendor.id, vendorName: storeData.vendor.storeName, name: p.name, price: p.price, discount: p.discount, image: p.images, unit: p.unit });
    setAddedId(p.id);
    setTimeout(() => setAddedId(null), 1500);
  }

  const hours = storeData ? parseHours(storeData.vendor.openingHours) : null;
  const cartCount = totalItems();

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Inter,sans-serif'}}>
      <p style={{color:'#9ca3af'}}>Loading store...</p>
    </div>
  );

  if (!storeData) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Inter,sans-serif',flexDirection:'column',gap:'1rem'}}>
      <p style={{fontSize:'2rem'}}>🔍</p>
      <p style={{color:'#9ca3af'}}>Store not found.</p>
      <a href="/" style={{color:'#005b9f'}}>Back to marketplace</a>
    </div>
  );

  const { vendor, products } = storeData;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; background: #f8f9fa; }
        .store-topbar { background: #fff; border-bottom: 1px solid #f0f0f0; padding: 0 1.5rem; height: 60px; display: flex; align-items: center; gap: 1rem; position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        .store-back { font-size: 0.88rem; color: #005b9f; font-weight: 600; text-decoration: none; }
        .store-topbar-logo { height: 42px; object-fit: contain; cursor: pointer; }
        .store-cart-btn { margin-left: auto; background: #005b9f; color: #fff; border: none; border-radius: 8px; padding: 0.45rem 1rem; cursor: pointer; font-weight: 600; font-size: 0.85rem; position: relative; font-family: inherit; }
        .store-cart-badge { position: absolute; top: -5px; right: -5px; background: #ef4444; color: #fff; border-radius: 99px; width: 16px; height: 16px; font-size: 0.6rem; font-weight: 700; display: flex; align-items: center; justify-content: center; }
        .store-cover { width: 100%; height: 240px; object-fit: cover; background: linear-gradient(135deg, #003d6b, #005b9f); display: block; }
        .store-cover-ph { width: 100%; height: 240px; background: linear-gradient(135deg, #003d6b, #005b9f); display: flex; align-items: center; justify-content: center; font-size: 4rem; }
        .store-profile { max-width: 1280px; margin: 0 auto; padding: 0 1.5rem; }
        .store-profile-box { background: #fff; border-radius: 16px; margin-top: -40px; padding: 1.5rem; display: flex; gap: 1.5rem; align-items: center; box-shadow: 0 4px 20px rgba(0,0,0,0.08); flex-wrap: wrap; }
        .store-logo { width: 80px; height: 80px; border-radius: 16px; object-fit: cover; border: 3px solid #fff; box-shadow: 0 2px 12px rgba(0,0,0,0.12); flex-shrink: 0; background: #e5e7eb; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 2rem; color: #555; overflow: hidden; }
        .store-info h1 { font-size: 1.4rem; font-weight: 800; color: #111; margin-bottom: 0.3rem; }
        .store-cat-badge { background: #eff6ff; color: #1d4ed8; border-radius: 8px; padding: 0.2rem 0.6rem; font-size: 0.78rem; font-weight: 600; display: inline-block; margin-bottom: 0.5rem; }
        .store-meta { display: flex; gap: 1rem; flex-wrap: wrap; font-size: 0.82rem; color: #6b7280; }
        .store-hours-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 0.5rem; }
        .store-hours-row { background: #f8f9fa; border-radius: 8px; padding: 0.4rem 0.75rem; font-size: 0.8rem; }
        .store-products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(145px, 100%), 1fr)); gap: 1.25rem; }
        .store-product-card { background: #fff; border: 1px solid #f0f0f0; border-radius: 14px; overflow: hidden; display: flex; flex-direction: column; transition: all 0.2s; }
        .store-product-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.1); transform: translateY(-2px); }
        .store-product-img { width: 100%; height: 160px; object-fit: cover; cursor: pointer; background: #f0f0f0; display: block; }
        .store-product-ph { width: 100%; height: 160px; background: linear-gradient(135deg, #f0f4f8, #e2e8f0); display: flex; align-items: center; justify-content: center; font-size: 2.5rem; }
        .store-product-body { padding: 0.8rem; flex: 1; display: flex; flex-direction: column; }
        .store-product-name { font-size: 0.87rem; font-weight: 600; margin-bottom: 0.25rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .store-sub-badge { font-size: 0.72rem; color: #059669; background: #ecfdf5; border-radius: 5px; padding: 0.1rem 0.4rem; display: inline-block; margin-bottom: 0.4rem; }
        .store-product-price { font-size: 0.95rem; font-weight: 800; color: #005b9f; }
        .store-add-btn { margin-top: auto; padding-top: 0.6rem; background: #005b9f; color: #fff; border: none; border-radius: 7px; padding: 0.5rem; font-size: 0.83rem; font-weight: 600; cursor: pointer; width: 100%; font-family: inherit; transition: background 0.2s; }
        .store-add-btn:hover { background: #004a82; }
        .store-add-btn.added { background: #16a34a; }
        .store-pagination { display: flex; gap: 0.5rem; justify-content: center; margin-top: 2rem; }
        .store-page-btn { padding: 0.5rem 1rem; border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; cursor: pointer; font-size: 0.88rem; font-family: inherit; }
        .store-page-btn.active { background: #005b9f; color: #fff; border-color: #005b9f; }
        .store-empty { text-align: center; padding: 4rem 2rem; color: #9ca3af; }
      `}</style>

      {/* Top bar */}
      <header className="store-topbar">
        <a href="/" className="store-back">← Marketplace</a>
        <img src="/logo.png" alt="NATION MARKET" className="store-topbar-logo" onClick={() => router.push('/')} />
        <button className="store-cart-btn" onClick={() => router.push('/cart')}>
          🛒 Cart {cartCount > 0 && <span className="store-cart-badge">{cartCount}</span>}
        </button>
      </header>

      {/* Cover */}
      {vendor.coverUrl
        ? <img src={optimizeImg(vendor.coverUrl, 1200)} className="store-cover" alt={vendor.storeName} loading="lazy" />
        : <div className="store-cover-ph">🏪</div>
      }

      {/* Profile box */}
      <div className="store-profile">
        <div className="store-profile-box">
          <div className="store-logo">
            {vendor.logoUrl
              ? <img src={optimizeImg(vendor.logoUrl, 160)} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} loading="lazy" />
              : vendor.storeName.charAt(0).toUpperCase()
            }
          </div>
          <div className="store-info" style={{flex:1,minWidth:0}}>
            <h1>{vendor.storeName}</h1>
            <span className="store-cat-badge">{vendor.businessType}</span>
            {vendor.description && <p style={{fontSize:'0.85rem',color:'#555',marginBottom:'0.5rem'}}>{vendor.description}</p>}
            <div className="store-meta">
              {vendor.address && <span>📍 {vendor.address}</span>}
              {vendor.subcategories?.map(s => <span key={s.name} style={{background:'#f0fdf4',color:'#15803d',borderRadius:'5px',padding:'0.1rem 0.4rem'}}>{s.name}</span>)}
            </div>
          </div>
        </div>

        {/* Opening Hours */}
        {hours && (
          <div style={{background:'#fff',borderRadius:'14px',border:'1px solid #f0f0f0',padding:'1.25rem',marginTop:'1.5rem'}}>
            <h3 style={{fontWeight:700,marginBottom:'0.75rem',fontSize:'0.95rem'}}>🕐 Opening Hours</h3>
            <div className="store-hours-grid">
              {Object.entries(hours).map(([day, info]: any) => (
                <div key={day} className="store-hours-row">
                  <div style={{fontWeight:600,fontSize:'0.78rem',marginBottom:'0.1rem'}}>{day}</div>
                  <div style={{color: info?.closed ? '#ef4444' : '#16a34a'}}>
                    {info?.closed ? 'Closed' : `${info?.open || ''} – ${info?.close || ''}`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Products */}
        <div style={{marginTop:'2rem',paddingBottom:'3rem'}}>
          <h2 style={{fontWeight:800,marginBottom:'1.25rem',fontSize:'1.1rem'}}>Products from {vendor.storeName}</h2>
          {products.length === 0 ? (
            <div className="store-empty"><div style={{fontSize:'2.5rem',marginBottom:'0.75rem'}}>📦</div><p>No products yet</p></div>
          ) : (
            <>
              <div className="store-products-grid">
                {products.map(p => (
                  <div key={p.id} className="store-product-card">
                    {p.images
                      ? <img src={optimizeImg(p.images, 400)} className="store-product-img" loading="lazy" alt={p.name} onClick={() => router.push(`/product/${p.id}`)} />
                      : <div className="store-product-ph">🛍️</div>
                    }
                    <div className="store-product-body">
                      <div className="store-product-name">{p.name}</div>
                      {p.subcategory && <span className="store-sub-badge">{p.subcategory.name}</span>}
                      <div className="store-product-price">
                        ₦{p.discount > 0 ? (p.price*(1-p.discount/100)).toLocaleString(undefined,{maximumFractionDigits:0}) : p.price.toLocaleString()}
                        {p.discount > 0 && <span style={{color:'#9ca3af',textDecoration:'line-through',fontSize:'0.75rem',marginLeft:'0.3rem'}}>₦{p.price.toLocaleString()}</span>}
                      </div>
                      <button
                        className={`store-add-btn ${addedId === p.id ? 'added' : ''}`}
                        style={{marginTop:'0.75rem'}}
                        onClick={() => handleAddToCart(p)}
                      >
                        {addedId === p.id ? '✓ Added!' : '+ Add to Cart'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {storeData.pages > 1 && (
                <div className="store-pagination">
                  {Array.from({length: storeData.pages}, (_, i) => i + 1).map(n => (
                    <button key={n} className={`store-page-btn ${page === n ? 'active' : ''}`} onClick={() => setPage(n)}>{n}</button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
