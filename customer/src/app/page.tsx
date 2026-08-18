'use client';
import { useAuthStore } from '../store/authStore';

export default function Home() {
  const { user, token, logout } = useAuthStore();

  return (
    <div className="layout-container">
      <header className="navbar">
        <div className="logo-container">
          <img src="/logo.png" alt="Nation-Market Logo" className="main-logo" />
        </div>
        <nav className="nav-links">
          <a href="#" className="nav-link active">Marketplace</a>
          {token ? (
            <>
              {user?.role === 'CUSTOMER' && <a href="/dashboard" className="nav-link" style={{color: '#0284c7'}}>My Account</a>}
              {user?.role === 'RIDER' && <a href="/rider/dashboard" className="nav-link" style={{color: '#16a34a'}}>Rider Hub</a>}
              {user?.role === 'VENDOR' && <a href="http://localhost:3001" className="nav-link" style={{color: '#d97706'}}>Vendor Hub</a>}
              {user?.role === 'ADMIN' && <a href="http://localhost:3002" className="nav-link" style={{color: '#111827'}}>Admin Console</a>}
              <button onClick={logout} className="nav-link logout-btn">Logout</button>
            </>
          ) : (
            <a href="/login" className="nav-link">Sign In</a>
          )}
        </nav>
      </header>
      <main className="main-content">
        <h1>Welcome to Nation-Market</h1>
        <p>Discover vendors, browse products, and order securely across any legitimate category.</p>
      </main>

      <style>{`
        .layout-container { min-height: 100vh; display: flex; flex-direction: column; background: #fff; }
        .navbar { display: flex; align-items: center; justify-content: space-between; padding: 0.2rem 2.5rem; border-bottom: 1px solid #f0f0f0; background: #fff; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
        .logo-container { display: flex; align-items: center; margin-left: -1.5rem; }
        .main-logo { height: 220px; width: auto; object-fit: contain; margin-top: -60px; margin-bottom: -60px; }
        .nav-links { display: flex; gap: 2rem; align-items: center; }
        .nav-link { text-decoration: none; color: #444; font-weight: 500; font-size: 1rem; transition: color 0.2s; }
        .nav-link:hover, .nav-link.active { color: #005b9f; }
        .logout-btn { background: none; border: none; cursor: pointer; color: #dc2626; font-weight: 700; padding: 0.4rem 1rem; border-radius: 6px; }
        .logout-btn:hover { background: #fee2e2; color: #b91c1c; }
        .main-content { padding: 4rem 2rem; max-width: 1200px; margin: 0 auto; width: 100%; flex: 1; text-align: center; }
        .main-content h1 { font-size: 3rem; color: #111; margin-bottom: 1rem; font-weight: 700; }
        .main-content p { font-size: 1.25rem; color: #666; }
      `}</style>
    </div>
  );
}
