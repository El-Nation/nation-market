'use client';
import { useState } from 'react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    alert('Strict Admin authentication logic pending');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Administrative Terminal</h2>
          <p>Secured Nation-Market operations access</p>
        </div>
        
        <form onSubmit={handleLogin} className="auth-form">
          <div className="form-group">
            <label>Admin Credentials</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="admin@nationmarket.com" />
          </div>
          
          <div className="form-group">
            <label>Master Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          
          <button type="submit" className="auth-btn">Authenticate</button>
        </form>
      </div>
      
      <style>{`
        .auth-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #fafafa; padding: 2rem; }
        .auth-card { background: white; padding: 2.5rem; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); width: 100%; max-width: 420px; }
        .auth-header { text-align: center; margin-bottom: 2rem; }
        .auth-header h2 { font-size: 1.8rem; color: #d00; margin-bottom: 0.5rem; }
        .auth-header p { color: #6b7280; font-size: 0.95rem; }
        .auth-form { display: flex; flex-direction: column; gap: 1.25rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .form-group label { font-size: 0.9rem; font-weight: 500; color: #374151; }
        .form-group input { padding: 0.75rem 1rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 1rem; outline: none; transition: border-color 0.2s; }
        .form-group input:focus { border-color: #d00; }
        .auth-btn { background: #d00; color: white; border: none; padding: 0.85rem; border-radius: 6px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: background 0.2s; letter-spacing: 1px; text-transform: uppercase; }
        .auth-btn:hover { background: #a00; }
      `}</style>
    </div>
  );
}
