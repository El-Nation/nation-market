'use client';
import { useState } from 'react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMsg('');
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL && !(process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('localhost') ? process.env.NEXT_PUBLIC_API_URL : 'https://api.eghedev.com').includes('localhost') ? (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('localhost') ? process.env.NEXT_PUBLIC_API_URL : 'https://api.eghedev.com') : 'https://api.eghedev.com') + '/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg('A secure password reset link has been emailed to you.');
      } else {
        alert(data.message || 'Failed to trigger reset');
      }
    } catch (err) {
      alert('Backend connection failed - Server offline');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Forgot Password</h2>
          <p>We'll send you a secure link to reset it</p>
        </div>
        
        {statusMsg && <div className="success-msg">{statusMsg}</div>}

        <form onSubmit={handleReset} className="auth-form">
          <div className="form-group">
            <label>Registered Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="name@example.com" disabled={isLoading} />
          </div>
          
          <button type="submit" className="auth-btn" disabled={isLoading}>
             {isLoading ? 'Sending...' : 'Send Recovery Link'}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>Remembered your password? <a href="/login">Sign in</a></p>
        </div>
      </div>
      
      <style>{`
        .auth-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #fbfbfb; padding: 2rem; }
        .auth-card { background: white; padding: 2.5rem; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); width: 100%; max-width: 440px; }
        .auth-header { text-align: center; margin-bottom: 2rem; }
        .auth-header h2 { font-size: 1.8rem; color: #111827; margin-bottom: 0.5rem; }
        .auth-header p { color: #6b7280; font-size: 0.95rem; }
        .auth-form { display: flex; flex-direction: column; gap: 1.25rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .form-group label { font-size: 0.9rem; font-weight: 500; color: #374151; }
        .form-group input { padding: 0.75rem 1rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 1rem; outline: none; transition: border-color 0.2s; }
        .form-group input:focus { border-color: #005b9f; }
        .auth-btn { background: #005b9f; color: white; border: none; padding: 0.85rem; border-radius: 6px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: background 0.2s; }
        .auth-btn:hover { background: #00467a; }
        .auth-footer { margin-top: 1.5rem; text-align: center; font-size: 0.9rem; color: #6b7280; }
        .auth-footer a { color: #005b9f; text-decoration: none; font-weight: 500; }
        .success-msg { background: #dcfce7; padding: 1rem; color: #166534; font-weight: 500; border-radius: 6px; text-align: center; margin-bottom: 1.5rem; }
      `}</style>
    </div>
  );
}
