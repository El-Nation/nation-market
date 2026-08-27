'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/authStore';

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { token } = useAuthStore();
  
  const reference = searchParams.get('reference');
  const orderId = searchParams.get('orderId');

  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function verifyAndFetch() {
      if (!reference && !orderId) {
        setLoading(false);
        return;
      }

      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

        // First verify payment status
        if (reference) {
          await fetch(`${API_URL}/payments/verify/${reference}`).catch(() => {});
        }

        // Fetch order details if logged in
        if (orderId && token) {
          const res = await fetch(`${API_URL}/customer/orders/${orderId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const json = await res.json();
          if (json.success) {
            setOrderData(json.data);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to retrieve order confirmation details.');
      } finally {
        setLoading(false);
      }
    }

    verifyAndFetch();
  }, [reference, orderId, token]);

  return (
    <div style={{ maxWidth: '640px', margin: '4rem auto', padding: '0 1.5rem', fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        .success-card { background: #fff; border-radius: 20px; border: 1px solid #e5e7eb; box-shadow: 0 10px 30px rgba(0,0,0,0.06); padding: 2.5rem; text-align: center; }
        .icon-circle { width: 80px; height: 80px; background: #ecfdf5; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; font-size: 2.5rem; color: #10b981; }
        .title { font-size: 1.6rem; font-weight: 800; color: #111827; margin-bottom: 0.5rem; }
        .subtitle { font-size: 0.95rem; color: #6b7280; margin-bottom: 2rem; line-height: 1.5; }
        .order-box { background: #f9fafb; border: 1px solid #f3f4f6; border-radius: 12px; padding: 1.25rem; text-align: left; margin-bottom: 2rem; }
        .order-row { display: flex; justify-content: space-between; font-size: 0.88rem; margin-bottom: 0.5rem; color: #4b5563; }
        .order-row strong { color: #111827; }
        .order-items-list { border-top: 1px dashed #e5e7eb; margin-top: 0.75rem; padding-top: 0.75rem; }
        .item-line { display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.4rem; color: #374151; }
        .btn-group { display: flex; gap: 1rem; }
        .btn-primary { flex: 1; background: #005b9f; color: #fff; border: none; padding: 0.85rem; border-radius: 10px; font-weight: 700; cursor: pointer; text-decoration: none; font-size: 0.95rem; }
        .btn-secondary { flex: 1; background: #f3f4f6; color: #374151; border: none; padding: 0.85rem; border-radius: 10px; font-weight: 600; cursor: pointer; text-decoration: none; font-size: 0.95rem; }
        .btn-primary:hover { background: #004a82; }
        .btn-secondary:hover { background: #e5e7eb; }
        @media (max-width: 480px) {
          .success-card { padding: 1.5rem 1rem; }
          .btn-group { flex-direction: column; }
        }
      `}</style>

      <div className="success-card">
        <div className="icon-circle">✅</div>
        <h1 className="title">Order Confirmed!</h1>
        <p className="subtitle">
          Thank you for shopping on <strong>Nation Market</strong>. Your payment was processed successfully and your vendor is preparing your order.
        </p>

        {loading ? (
          <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Retrieving order receipt details...</p>
        ) : orderData ? (
          <div className="order-box">
            <div className="order-row"><span>Order Reference</span><strong>{reference || orderData.id.slice(0, 8)}</strong></div>
            <div className="order-row"><span>Store</span><strong>{orderData.vendor?.storeName}</strong></div>
            <div className="order-row"><span>Status</span><strong style={{ color: '#10b981' }}>{orderData.status}</strong></div>
            <div className="order-row"><span>Total Amount</span><strong>₦{orderData.total?.toLocaleString()}</strong></div>

            {orderData.items && orderData.items.length > 0 && (
              <div className="order-items-list">
                <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem', color: '#111827' }}>Ordered Items:</div>
                {orderData.items.map((item: any) => (
                  <div key={item.id} className="item-line">
                    <span>{item.quantity}x {item.product?.name}</span>
                    <span>₦{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : reference ? (
          <div className="order-box">
            <div className="order-row"><span>Transaction Reference</span><strong>{reference}</strong></div>
            <div className="order-row"><span>Payment Status</span><strong style={{ color: '#10b981' }}>PAID</strong></div>
          </div>
        ) : null}

        <div className="btn-group">
          {token ? (
            <button className="btn-primary" onClick={() => router.push('/dashboard')}>View My Orders</button>
          ) : (
            <button className="btn-primary" onClick={() => router.push(`/receipt/${reference}`)}>View Digital Receipt</button>
          )}
          <button className="btn-secondary" onClick={() => router.push('/')}>Continue Shopping</button>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '4rem' }}>Loading checkout confirmation...</div>}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
