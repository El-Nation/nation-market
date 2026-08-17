

export default function Home() {
  return (
    <div className="layout-container">
      <header className="navbar">
        <div className="logo-container">
          <img src="/logo.png" alt="Nation-Market Logo" className="main-logo" />
          <span className="portal-badge">VENDOR PORTAL</span>
        </div>
        <nav className="nav-links">
          <a href="#" className="nav-link active">Dashboard</a>
          <a href="#" className="nav-link">My Store</a>
        </nav>
      </header>
      <main className="main-content">
        <h1>Your Vendor Dashboard</h1>
        <p>Manage your products, view orders, and operate your independent storefront effortlessly.</p>
      </main>

      <style>{`
        .layout-container { min-height: 100vh; display: flex; flex-direction: column; background: #fbfbfb; }
        .navbar { display: flex; align-items: center; justify-content: space-between; padding: 0.2rem 2.5rem; border-bottom: 1px solid #eaeaea; background: #fff; }
        .logo-container { display: flex; align-items: center; gap: 1.5rem; margin-left: -1.5rem; }
        .main-logo { height: 220px; width: auto; object-fit: contain; margin-top: -60px; margin-bottom: -60px; }
        .portal-badge { background: #005b9f; color: #fff; padding: 0.3rem 0.8rem; border-radius: 4px; font-size: 0.8rem; font-weight: bold; }
        .nav-links { display: flex; gap: 2rem; align-items: center; }
        .nav-link { text-decoration: none; color: #555; font-weight: 500; font-size: 1rem; transition: color 0.2s; }
        .nav-link:hover, .nav-link.active { color: #005b9f; }
        .main-content { padding: 4rem 2rem; max-width: 1200px; margin: 0 auto; width: 100%; flex: 1; text-align: left; }
        .main-content h1 { font-size: 2.2rem; color: #111; margin-bottom: 1rem; font-weight: 600; }
        .main-content p { font-size: 1.1rem; color: #555; }
      `}</style>
    </div>
  );
}
