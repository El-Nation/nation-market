'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { User, Store, Bike, Eye, EyeOff, X } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();
  const loginAction = useAuthStore((state) => state.login);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    if (isModalOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || '') + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        loginAction(data.data, data.data.token);
        if (data.data.role === 'ADMIN') window.location.href = `https://admin.eghedev.com/?token=${data.data.token}&role=ADMIN`;
        else if (data.data.role === 'VENDOR') window.location.href = `https://vendor.eghedev.com/?token=${data.data.token}&role=VENDOR`;
        else if (data.data.role === 'RIDER') window.location.href = '/rider/dashboard';
        else router.push('/dashboard');
      } else {
        alert(data.message || 'Login failed securely');
      }
    } catch (err) {
      alert('Backend connection failed - Server offline');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        
        <div className="brand-header">
          <img src="/logo.png" alt="NATION MARKET" className="brand-logo" />
        </div>

        <div className="auth-header">
          <h2>Welcome back</h2>
          <p>Sign in to your NATION MARKET account</p>
        </div>
        
        <form onSubmit={handleLogin} className="auth-form">
          <div className="form-group">
            <label>Email address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="name@example.com" />
          </div>
          
          <div className="form-group password-group">
            <label>Password</label>
            <div className="password-input-wrapper">
              <input 
                type={showPassword ? 'text' : 'password'} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                placeholder="••••••••" 
              />
              <button 
                type="button" 
                className="toggle-password" 
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          
          <div className="auth-footer-login">
            <a href="/forgot-password">Forgot password?</a>
          </div>
          
          <button type="submit" className="auth-btn">Sign In</button>
        </form>
        
        <div className="divider-container">
          <span className="divider-text">OR</span>
        </div>

        <div className="registration-section">
          <p className="no-account-text">Don’t have an account?</p>
          <button type="button" className="create-account-btn" onClick={() => setIsModalOpen(true)}>
            Create an account on NATION MARKET
          </button>
        </div>

      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create an account on NATION MARKET</h3>
              <button className="close-modal-btn" onClick={() => setIsModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            
            <div className="role-cards">
              <div className="role-card" onClick={() => router.push('/register')}>
                <div className="role-icon customer-icon"><User size={22} /></div>
                <div className="role-info">
                  <h4>Customer</h4>
                  <p>Shop and order products</p>
                </div>
              </div>
              
              <div className="role-card" onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_VENDOR_URL || 'https://vendor.eghedev.com'}/register`}>
                <div className="role-icon vendor-icon"><Store size={22} /></div>
                <div className="role-info">
                  <h4>Vendor</h4>
                  <p>Sell your products and earn</p>
                </div>
              </div>
              
              <div className="role-card" onClick={() => router.push('/rider/register')}>
                <div className="role-icon rider-icon"><Bike size={22} /></div>
                <div className="role-info">
                  <h4>Rider</h4>
                  <p>Deliver orders and earn</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        .auth-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f9fafb; padding: 2.5rem 1rem; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        .auth-card { background: white; padding: 1rem 3rem 2.5rem 3rem; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.04); width: 100%; max-width: 500px; }
        
        .brand-header { display: flex; justify-content: center; align-items: center; overflow: hidden; height: 110px; margin-top: 0.5rem; margin-bottom: 1rem; }
        .brand-logo { height: 350px; width: 100%; max-width: 480px; object-fit: contain; }

        .auth-header { text-align: center; margin-bottom: 2rem; }
        .auth-header h2 { font-size: 1.6rem; color: #111827; margin-bottom: 0.5rem; font-weight: 700; letter-spacing: -0.5px; }
        .auth-header p { color: #6b7280; font-size: 0.95rem; }
        
        .auth-form { display: flex; flex-direction: column; gap: 1.25rem; }
        
        .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .form-group label { font-size: 0.9rem; font-weight: 600; color: #374151; }
        
        .password-input-wrapper { display: flex; align-items: center; position: relative; }
        .password-input-wrapper input { width: 100%; padding: 0.75rem 1rem; padding-right: 2.5rem; border: 1px solid #d1d5db; border-radius: 8px; font-size: 1rem; outline: none; transition: all 0.2s; }
        .password-input-wrapper input:focus, .form-group input:focus { border-color: #005b9f; box-shadow: 0 0 0 3px rgba(0,91,159,0.1); }
        .form-group input { padding: 0.75rem 1rem; border: 1px solid #d1d5db; border-radius: 8px; font-size: 1rem; outline: none; transition: all 0.2s; }
        
        .toggle-password { position: absolute; right: 0.75rem; background: transparent; border: none; color: #6b7280; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .toggle-password:hover { color: #374151; }
        
        .auth-footer-login { display: flex; justify-content: flex-end; margin-top: -0.25rem; }
        .auth-footer-login a { color: #005b9f; text-decoration: none; font-size: 0.85rem; font-weight: 600; }
        .auth-footer-login a:hover { text-decoration: underline; }
        
        .auth-btn { background: #005b9f; color: white; border: none; padding: 0.85rem; border-radius: 8px; font-size: 1.05rem; font-weight: 600; cursor: pointer; transition: all 0.2s; margin-top: 0.5rem; }
        @media (hover: hover) { .auth-btn:hover { background: #00467a; transform: translateY(-1px); } }
        
        .divider-container { position: relative; display: flex; align-items: center; justify-content: center; margin: 2rem 0; text-align: center; }
        .divider-container::before { content: ''; position: absolute; top: 50%; left: 0; right: 0; border-top: 1px solid #e5e7eb; z-index: 1; }
        .divider-text { position: relative; z-index: 2; background: white; padding: 0 1rem; color: #9ca3af; font-size: 0.85rem; font-weight: 600; letter-spacing: 1px; }

        .registration-section { text-align: center; margin-bottom: 0.5rem; }
        .no-account-text { margin: 0 0 1rem 0; color: #6b7280; font-size: 0.95rem; }
        .create-account-btn { background: transparent; border: 2px solid #e5e7eb; color: #374151; font-weight: 600; width: 100%; padding: 0.85rem; border-radius: 8px; font-size: 1rem; cursor: pointer; transition: all 0.2s; }
        @media (hover: hover) { .create-account-btn:hover { border-color: #005b9f; color: #005b9f; background: #f8fbff; } }
        
        /* Modal Styles */
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(17, 24, 39, 0.7); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 50; padding: 1.5rem; animation: fadeIn 0.15s ease-out; }
        .modal-content { background: white; border-radius: 20px; padding: 2.5rem; width: 100%; max-width: 520px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .modal-header h3 { font-size: 1.3rem; color: #111827; margin: 0; font-weight: 800; letter-spacing: -0.5px; }
        .close-modal-btn { background: #f3f4f6; border: none; color: #6b7280; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
        .close-modal-btn:hover { background: #e5e7eb; color: #111827; transform: rotate(90deg); }

        .role-cards { display: flex; flex-direction: column; gap: 1.25rem; text-align: left; }
        .role-card { display: flex; align-items: center; padding: 1.25rem 1.75rem; border: 1px solid #e5e7eb; border-radius: 16px; cursor: pointer; transition: all 0.2s ease; background: white; }
        @media (hover: hover) { .role-card:hover { border-color: #005b9f; box-shadow: 0 10px 25px rgba(0,91,159,0.1); transform: translateY(-3px); background: #f8fbff; } }
        
        .role-icon { width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; margin-right: 1.5rem; flex-shrink: 0; }
        .customer-icon { background: #e0f2fe; color: #0284c7; }
        .vendor-icon { background: #fef3c7; color: #d97706; }
        .rider-icon { background: #dcfce7; color: #16a34a; }
        
        .role-info h4 { margin: 0 0 0.35rem 0; font-size: 1.1rem; color: #111827; font-weight: 700; }
        .role-info p { margin: 0; font-size: 0.95rem; color: #6b7280; font-weight: 500; }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        
        @media (max-width: 480px) {
          .auth-card { padding: 1.5rem 1.25rem 2.5rem; }
          .modal-content { padding: 1.5rem 1.25rem; }
        }
      `}</style>
    </div>
  );
}
