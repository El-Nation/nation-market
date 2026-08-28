'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function ResetPasswordForm() {
  const [newPassword, setNewPassword] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return alert('Invalid or missing security token directly in your URL string.');
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL && !(process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('localhost') ? process.env.NEXT_PUBLIC_API_URL : 'https://api.eghedev.com').includes('localhost') ? (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('localhost') ? process.env.NEXT_PUBLIC_API_URL : 'https://api.eghedev.com') : 'https://api.eghedev.com') + '/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg('Password completely restored securely. Redirecting to login...');
        setTimeout(() => router.push('/login'), 2000);
      } else {
        alert(data.message || 'Failed to update password correctly');
      }
    } catch (err) {
      alert('Backend connection failed - Server offline');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Create New Password</h2>
          <p>Please enter your newly desired security key</p>
        </div>
        
        {statusMsg && <div className="success-msg">{statusMsg}</div>}

        <form onSubmit={handleUpdate} className="auth-form">
          <div className="form-group">
            <label>New Secured Password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
          </div>
          
          <button type="submit" className="auth-btn">Confirm Reset</button>
        </form>
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
        .success-msg { background: #dcfce7; padding: 1rem; color: #166534; font-weight: 500; border-radius: 6px; text-align: center; margin-bottom: 1.5rem; }
      `}</style>
    </div>
  );
}

export default function ResetPassword() {
  return (
    <Suspense fallback={<div>Loading verification...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
