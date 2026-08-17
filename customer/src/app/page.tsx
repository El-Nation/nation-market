

export default function Home() {
  return (
    <div className="layout-container">
      <header className="navbar">
        <div className="logo-container">
          <img src="/logo.png" alt="Nation-Market Logo" className="main-logo" />
        </div>
        <nav className="nav-links">
          <a href="#" className="nav-link active">Marketplace</a>
          <a href="#" className="nav-link">Sign In</a>
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
        .main-content { padding: 4rem 2rem; max-width: 1200px; margin: 0 auto; width: 100%; flex: 1; text-align: center; }
        .main-content h1 { font-size: 3rem; color: #111; margin-bottom: 1rem; font-weight: 700; }
        .main-content p { font-size: 1.25rem; color: #666; }
      `}</style>
    </div>
  );
}
