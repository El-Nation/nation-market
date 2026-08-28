'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function DigitalReceiptPage() {
  const router = useRouter();
  const params = useParams();
  const reference = (params?.reference as string) || '';

  const [loading, setLoading] = useState(true);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadReceipt() {
      if (!reference) {
        setLoading(false);
        return;
      }
      try {
        const API_URL = (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('localhost') ? process.env.NEXT_PUBLIC_API_URL : 'https://api.eghedev.com');
        const res = await fetch(`${API_URL}/api/payments/verify/${reference}`);
        const json = await res.json();
        
        if (json.success && json.data?.parentOrder) {
          setReceiptData(json.data.parentOrder);
        } else {
          setError('Receipt not found or invalid reference.');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load digital receipt.');
      } finally {
        setLoading(false);
      }
    }
    loadReceipt();
  }, [reference]);

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: '#6b7280' }}>Loading receipt securely...</div>;
  if (error) return <div style={{ textAlign: 'center', padding: '4rem', color: '#ef4444' }}>{error}</div>;
  if (!receiptData) return <div style={{ textAlign: 'center', padding: '4rem' }}>Receipt could not be loaded.</div>;

  const isGuest = !receiptData.customerId;
  const name = isGuest ? receiptData.guestName : `${receiptData.customer?.firstName || ''} ${receiptData.customer?.lastName || ''}`;
  const email = isGuest ? receiptData.guestEmail : receiptData.customer?.email;

  return (
    <div style={{ maxWidth: '700px', margin: '0.5rem auto 3rem', padding: '0 1rem', fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        .receipt-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); overflow: hidden; }
        .receipt-header { background: #111827; padding: 1.5rem; color: #fff; text-align: center; }
        .receipt-body { padding: 1.5rem; }
        .flex-between { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 0.75rem; font-size: 0.9rem; flex-wrap: wrap; }
        .label { color: #6b7280; flex-shrink: 0; }
        .value { color: #111827; font-weight: 600; text-align: right; word-break: break-all; }
        .vendor-block { margin-top: 1.5rem; border: 1px solid #f3f4f6; border-radius: 10px; overflow: hidden; }
        .vendor-header { background: #f9fafb; padding: 1rem; border-bottom: 1px solid #f3f4f6; font-weight: 700; color: #374151; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; }
        .item-row { display: flex; justify-content: space-between; padding: 0.8rem 1rem; border-bottom: 1px solid #f9fafb; font-size: 0.85rem; color: #4b5563; flex-wrap: wrap; gap: 1rem; }
        .item-row:last-child { border-bottom: none; }
        .total-section { margin-top: 1.5rem; padding-top: 1.5rem; border-top: 2px dashed #e5e7eb; }
        .total-row { display: flex; justify-content: space-between; align-items: center; font-size: 1.1rem; font-weight: 800; color: #111827; flex-wrap: wrap; }
        .action-bars { margin-top: 2rem; display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center; }
        .btn { padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; text-decoration: none; text-align: center; flex: 1 1 200px; cursor: pointer; }
        .btn-primary { background: #005b9f; color: #fff; border: none; }
        .btn-outline { background: #fff; color: #374151; border: 1px solid #d1d5db; }
        @media (max-width: 480px) {
          .value { text-align: left; }
          .receipt-body { padding: 1rem; }
          .vendor-block { border-radius: 6px; }
        }
      `}</style>
      
      <div style={{ textAlign: 'center', marginBottom: '0.2rem' }}>
        <img src="/logo.png" alt="Nation Market" style={{ height: '135px', display: 'inline-block' }} />
      </div>
      <div className="receipt-card">
        <div className="receipt-header">
          <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>Digital Receipt</h1>
          <p style={{ margin: '0.4rem 0 0', color: '#9ca3af', fontSize: '0.9rem' }}>Nation Market Transaction</p>
        </div>
        
        <div className="receipt-body">
          <div style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
            <div className="flex-between">
              <span className="label">Date</span>
              <span className="value">{new Date(receiptData.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex-between">
              <span className="label">Transaction Ref</span>
              <span className="value" style={{ fontFamily: 'monospace' }}>{reference}</span>
            </div>
            <div className="flex-between">
              <span className="label">Billed To</span>
              <span className="value">{name} <br/> <span style={{ fontSize: '0.8rem', fontWeight: 400, color: '#6b7280' }}>{email}</span></span>
            </div>
            <div className="flex-between">
              <span className="label">Status</span>
              <span className="value" style={{ color: '#10b981', background: '#ecfdf5', padding: '0.1rem 0.6rem', borderRadius: '4px' }}>PAID</span>
            </div>
          </div>

          {receiptData.orders?.map((vendorOrder: any) => (
            <div key={vendorOrder.id} className="vendor-block">
              <div className="vendor-header">
                <span>{vendorOrder.vendor?.storeName || 'Vendor Store'}</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#6b7280' }}>#{vendorOrder.id.slice(0,8).toUpperCase()}</span>
              </div>
              {vendorOrder.items?.map((item: any) => (
                <div key={item.id} className="item-row" style={{ alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {item.product?.images ? (
                      <img src={item.product?.images.split(',')[0].includes('cloudinary') ? item.product?.images.split(',')[0].replace('/upload/', '/upload/w_60,h_60,c_fill,q_auto/') : item.product?.images.split(',')[0]} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#e5e7eb' }} alt="" />
                    ) : (
                      <div style={{ width: '40px', height: '40px', borderRadius: '6px', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', border: '1px solid #e5e7eb' }}>📦</div>
                    )}
                    <div>
                      <span style={{ fontWeight: 600 }}>{item.quantity}×</span> {item.product?.name}
                    </div>
                  </div>
                  <div style={{ fontWeight: 600 }}>₦{(item.price * item.quantity).toLocaleString()}</div>
                </div>
              ))}
              <div style={{ padding: '0.8rem 1rem', background: '#fafaf9', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span className="label">Vendor Subtotal (inc. fees)</span>
                <span className="value">₦{vendorOrder.total?.toLocaleString()}</span>
              </div>
            </div>
          ))}

          <div className="total-section">
            <div className="total-row">
              <span>Total Paid</span>
              <span>₦{receiptData.totalAmount?.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="action-bars">
            <button className="btn btn-outline" onClick={() => window.print()}>Print Receipt</button>
            <Link href="/" className="btn btn-primary">Return to Marketplace</Link>
          </div>
        </div>
      </div>
      
      <div style={{ textAlign: 'center', marginTop: '2.5rem', marginBottom: '2rem', fontSize: '0.85rem', color: '#6b7280', lineHeight: '1.6' }}>
        <p style={{ margin: '0 0 0.25rem', fontWeight: 600, color: '#374151' }}>NATION MARKET © {new Date().getFullYear()}</p>
        <p style={{ margin: 0 }}>This receipt is dynamically generated and securely signed.<br/>All rights reserved.</p>
      </div>
    </div>
  );
}
