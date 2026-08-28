'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCartStore } from '../../../store/cartStore';

const API = (process.env.NEXT_PUBLIC_API_URL && !(process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('localhost') ? process.env.NEXT_PUBLIC_API_URL : 'https://api.eghedev.com').includes('localhost') ? (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('localhost') ? process.env.NEXT_PUBLIC_API_URL : 'https://api.eghedev.com') : 'https://api.eghedev.com') + '/api/storefront';

interface Product {
  id: string; name: string; description: string; price: number; discount: number;
  images: string; unit?: string; inventory: number; isAvailable: boolean; sku?: string; variations?: string;
  category: { name: string; slug: string; };
  subcategory?: { name: string; slug: string; };
  vendor: { id: string; storeName: string; logoUrl?: string; coverUrl?: string; address?: string; openingHours?: string; businessType: string; };
}

function optimizeImg(url: string, w = 800) {
  if (!url || !url.includes('cloudinary.com')) return url;
  return url.replace('/upload/', `/upload/w_${w},c_limit,f_auto,q_auto/`);
}

export default function ProductDetailPage() {
  const params = useParams<{ productId: string }>();
  const router = useRouter();
  const { addItem, totalItems } = useCartStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const cartCount = totalItems();

  useEffect(() => {
    fetch(`${API}/products/${params.productId}`).then(r => r.json()).then(d => {
      if (d.success) setProduct(d.data);
      setLoading(false);
    });
  }, [params.productId]);

  function handleAdd() {
    if (!product) return;
    addItem({
      productId: product.id, vendorId: product.vendor.id, vendorName: product.vendor.storeName,
      name: product.name, price: product.price, discount: product.discount, image: product.images, unit: product.unit
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  if (loading) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Inter,sans-serif',color:'#9ca3af'}}>Loading product...</div>;
  if (!product) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Inter,sans-serif',flexDirection:'column',gap:'1rem',color:'#9ca3af'}}><span style={{fontSize:'2rem'}}>😕</span><p>Product not found</p><a href="/" style={{color:'#005b9f'}}>Back to marketplace</a></div>;

  const effectivePrice = product.discount > 0 ? product.price * (1 - product.discount / 100) : product.price;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; background: #f8f9fa; }
        .pd-header { background: #fff; border-bottom: 1px solid #f0f0f0; padding: 0 1.5rem; height: 64px; display: flex; align-items: center; gap: 1rem; position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        .pd-back { color: #005b9f; text-decoration: none; font-weight: 600; font-size: 0.88rem; }
        .pd-logo { height: 44px; object-fit: contain; cursor: pointer; }
        .pd-cart-btn { margin-left: auto; background: #005b9f; color: #fff; border: none; border-radius: 8px; padding: 0.45rem 1rem; cursor: pointer; font-weight: 600; font-size: 0.85rem; position: relative; font-family: inherit; }
        .pd-cart-badge { position: absolute; top: -5px; right: -5px; background: #ef4444; color: #fff; border-radius: 99px; width: 16px; height: 16px; font-size: 0.6rem; font-weight: 700; display: flex; align-items: center; justify-content: center; }
        .pd-layout { max-width: 1100px; margin: 2rem auto; padding: 0 1.5rem; display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; }
        .pd-img-wrap { border-radius: 18px; overflow: hidden; position: relative; }
        .pd-img { width: 100%; aspect-ratio: 1/1; object-fit: cover; display: block; }
        .pd-img-ph { width: 100%; aspect-ratio: 1/1; background: linear-gradient(135deg, #f0f4f8, #e2e8f0); display: flex; align-items: center; justify-content: center; font-size: 6rem; }
        .pd-discount-badge { position: absolute; top: 14px; left: 14px; background: #ef4444; color: #fff; border-radius: 8px; padding: 0.3rem 0.75rem; font-size: 0.85rem; font-weight: 700; }
        .pd-info { display: flex; flex-direction: column; gap: 1rem; }
        .pd-breadcrumb { display: flex; gap: 0.5rem; font-size: 0.78rem; color: #9ca3af; flex-wrap: wrap; }
        .pd-breadcrumb a { color: #005b9f; text-decoration: none; font-weight: 500; }
        .pd-title { font-size: clamp(1.3rem, 3vw, 1.8rem); font-weight: 800; color: #111; line-height: 1.25; }
        .pd-price { font-size: 1.8rem; font-weight: 800; color: #005b9f; }
        .pd-original { font-size: 1rem; color: #9ca3af; text-decoration: line-through; margin-left: 0.5rem; }
        .pd-meta-row { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .pd-badge { border-radius: 7px; padding: 0.25rem 0.7rem; font-size: 0.78rem; font-weight: 600; }
        .pd-vendor-box { background: #f8f9fa; border: 1px solid #f0f0f0; border-radius: 12px; padding: 0.85rem 1rem; display: flex; align-items: center; gap: 0.75rem; text-decoration: none; transition: background 0.15s; }
        .pd-vendor-box:hover { background: #eff6ff; }
        .pd-vendor-logo { width: 40px; height: 40px; border-radius: 8px; object-fit: cover; background: #e5e7eb; overflow: hidden; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #555; flex-shrink: 0; }
        .pd-vendor-name { font-weight: 700; font-size: 0.9rem; color: #111; }
        .pd-vendor-cat { font-size: 0.75rem; color: #6b7280; }
        .pd-desc { font-size: 0.9rem; color: #555; line-height: 1.65; }
        .pd-add-btn { background: #005b9f; color: #fff; border: none; border-radius: 12px; padding: 1rem 2rem; font-size: 1rem; font-weight: 700; cursor: pointer; transition: background 0.2s; font-family: inherit; }
        .pd-add-btn:hover { background: #004a82; }
        .pd-add-btn.added { background: #16a34a; }
        @media (max-width: 700px) { .pd-layout { grid-template-columns: 1fr; gap: 1.5rem; } }
      `}</style>

      <header className="pd-header">
        <a href="/" className="pd-back">← Marketplace</a>
        <img src="/logo.png" alt="NATION MARKET" className="pd-logo" onClick={() => router.push('/')} />
        <button className="pd-cart-btn" onClick={() => router.push('/cart')}>
          🛒 Cart {cartCount > 0 && <span className="pd-cart-badge">{cartCount}</span>}
        </button>
      </header>

      <div className="pd-layout">
        {/* Image */}
        <div className="pd-img-wrap">
          {product.images
            ? <img src={optimizeImg(product.images, 800)} className="pd-img" alt={product.name} />
            : <div className="pd-img-ph">🛍️</div>
          }
          {product.discount > 0 && <span className="pd-discount-badge">-{product.discount}% OFF</span>}
        </div>

        {/* Info */}
        <div className="pd-info">
          <div className="pd-breadcrumb">
            <a href="/">Home</a> / <a href={`/category/${product.category.slug}`}>{product.category.name}</a>
            {product.subcategory && <> / <span style={{color:'#374151'}}>{product.subcategory.name}</span></>}
          </div>

          <h1 className="pd-title">{product.name}</h1>

          <div>
            <span className="pd-price">₦{effectivePrice.toLocaleString(undefined,{maximumFractionDigits:0})}</span>
            {product.discount > 0 && <span className="pd-original">₦{product.price.toLocaleString()}</span>}
          </div>

          <div className="pd-meta-row">
            <span className="pd-badge" style={{background:'#eff6ff',color:'#1d4ed8'}}>{product.category.name}</span>
            {product.subcategory && <span className="pd-badge" style={{background:'#ecfdf5',color:'#059669'}}>{product.subcategory.name}</span>}
            {product.unit && <span className="pd-badge" style={{background:'#f3f4f6',color:'#374151'}}>per {product.unit}</span>}
            <span className="pd-badge" style={{background: product.inventory > 0 ? '#ecfdf5' : '#fef2f2', color: product.inventory > 0 ? '#059669' : '#dc2626'}}>
              {product.inventory > 0 ? `${product.inventory} in stock` : 'Out of Stock'}
            </span>
          </div>

          <p className="pd-desc">{product.description}</p>

          <a href={`/store/${product.vendor.id}`} className="pd-vendor-box">
            <div className="pd-vendor-logo">
              {product.vendor.logoUrl
                ? <img src={optimizeImg(product.vendor.logoUrl, 80)} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} loading="lazy" />
                : product.vendor.storeName.charAt(0).toUpperCase()
              }
            </div>
            <div>
              <div className="pd-vendor-name">{product.vendor.storeName}</div>
              <div className="pd-vendor-cat">{product.vendor.businessType} · View Store →</div>
            </div>
          </a>

          <button
            className={`pd-add-btn ${added ? 'added' : ''}`}
            onClick={handleAdd}
            disabled={product.inventory === 0}
          >
            {added ? '✓ Added to Cart!' : product.inventory === 0 ? 'Out of Stock' : '+ Add to Cart'}
          </button>

          {product.sku && <p style={{fontSize:'0.78rem',color:'#9ca3af'}}>SKU: {product.sku}</p>}
        </div>
      </div>
    </>
  );
}
