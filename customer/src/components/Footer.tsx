'use client';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={{
      background: '#111827',
      color: '#f9fafb',
      padding: '3rem 1.5rem',
      marginTop: '4rem',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '2.5rem'
      }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 1rem 0', color: '#fff', letterSpacing: '-0.5px' }}>
            NATION MARKET
          </h2>
          <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: '#9ca3af', margin: 0, maxWidth: '400px' }}>
            Shop online, pay securely, and choose delivery or pickup. Nation Market brings you a convenient marketplace experience with a wide range of products and trusted vendors, making it easy to discover, shop, and receive what you need.
          </p>
        </div>

        <div>
           <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1rem 0', color: '#fff' }}>Contact Information</h3>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
             <div>
               <span style={{ fontSize: '0.85rem', color: '#9ca3af', display: 'block', marginBottom: '0.2rem' }}>Email:</span>
               <a href="mailto:eghedestiny10@gmail.com" style={{ textDecoration: 'none', color: '#38bdf8', fontWeight: 600, fontSize: '1rem', wordBreak: 'break-all' }}>eghedestiny10@gmail.com</a>
             </div>
             <div>
               <span style={{ fontSize: '0.85rem', color: '#9ca3af', display: 'block', marginBottom: '0.2rem' }}>Phone:</span>
               <a href="tel:07066784058" style={{ textDecoration: 'none', color: '#38bdf8', fontWeight: 600, fontSize: '1rem' }}>07066784058</a>
             </div>
           </div>
        </div>
      </div>
      
      <div style={{ 
        maxWidth: '1280px', 
        margin: '3rem auto 0', 
        paddingTop: '1.5rem', 
        borderTop: '1px solid #374151', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        textAlign: 'center',
        gap: '0.5rem'
      }}>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f3f4f6' }}>
          NATION MARKET @2026
        </div>
        <div style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
          © 2026 Nation Market. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
