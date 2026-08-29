'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';

export default function Register() {
  const [country, setCountry] = useState('NG');
  const [phone, setPhone] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [birthday, setBirthday] = useState('');
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const router = useRouter();
  const loginAction = useAuthStore((state) => state.login);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL && !((process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('localhost') ? process.env.NEXT_PUBLIC_API_URL : 'https://api.eghedev.com').replace(/\/api\/?$/, '')).includes('localhost') ? ((process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('localhost') ? process.env.NEXT_PUBLIC_API_URL : 'https://api.eghedev.com').replace(/\/api\/?$/, '')) : 'https://api.eghedev.com') + '/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, password, firstName, lastName, role: 'CUSTOMER', 
          phone, country, birthday, marketingOptIn, termsAccepted: true 
        }),
      });
      const data = await res.json();
      if (data.success) {
        loginAction(data.data, data.data.token);
        router.push('/');
      } else {
        alert(data.message || 'Registration failed');
      }
    } catch (err) {
      alert('Backend connection failed - Server offline');
    }
  };

  return (
    <div className="chowdeck-container">
      <div className="chowdeck-card">
        <div className="chowdeck-header">
          <h2>Welcome to Nation Market</h2>
          <p>Enter your details to start ordering from your favorite vendors.</p>
        </div>
        
        <form onSubmit={handleRegister} className="chowdeck-form">
          <div className="form-row country-phone-row">
            <div className="form-group grid-country">
              <label>COUNTRY *</label>
              <select value={country} onChange={(e) => setCountry(e.target.value)} required>
                <option value="NG">NG 🇳🇬</option>
                <option value="GH">GH 🇬🇭</option>
                <option value="SA">SA 🇿🇦</option>
                <option value="US">US 🇺🇸</option>
              </select>
            </div>
            <div className="form-group grid-phone">
              <label>PHONE NUMBER *</label>
              <div className="phone-input-wrapper">
                <span className="phone-prefix">+234</span>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="08000000000" />
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>FIRST NAME *</label>
              <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required placeholder="e.g John" />
            </div>
            <div className="form-group">
              <label>LAST NAME *</label>
              <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required placeholder="e.g Doe" />
            </div>
          </div>
          
          <div className="form-group">
            <label>EMAIL ADDRESS *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="sample@gmail.com" />
          </div>

          <div className="form-group">
            <label>BIRTHDAY</label>
            <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
            <span className="helper-text">🎉 Celebrate your birthday with free delivery and discounts.</span>
          </div>

          <div className="form-group">
            <label>HAVE A REFERRAL CODE?</label>
            <input type="text" placeholder="Enter referral code here" />
          </div>

          <div className="form-group">
            <label>SECURE PASSWORD *</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input type="checkbox" checked={marketingOptIn} onChange={(e) => setMarketingOptIn(e.target.checked)} />
              <span className="checkbox-text">I want to receive emails and other marketing and promotional communications from Nation Market</span>
            </label>
          </div>

          <div className="terms-agreement">
            By clicking continue, you acknowledge that you have read and agreed to our <span>Terms of Use</span> and <span>Privacy Policy</span>.
          </div>
          
          <button type="submit" className="chowdeck-btn-primary">Continue</button>
        </form>
        
        <div className="chowdeck-footer-divider">
          <span>Have an account?</span>
        </div>
        
        <button type="button" className="chowdeck-btn-secondary" onClick={() => router.push('/login')}>Login</button>

      </div>
      
      <style>{`
        .chowdeck-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f0fdf4; padding: 2.5rem 1rem; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        .chowdeck-card { background: white; padding: 3rem 2.5rem; border-radius: 20px; box-shadow: 0 15px 35px rgba(0,0,0,0.03); width: 100%; max-width: 580px; }
        .chowdeck-header { text-align: center; margin-bottom: 2.5rem; }
        .chowdeck-header h2 { font-size: 2rem; color: #111827; margin-bottom: 0.5rem; font-weight: 800; letter-spacing: -0.5px; }
        .chowdeck-header p { color: #4b5563; font-size: 1rem; line-height: 1.5; padding: 0 1rem; }
        
        .chowdeck-form { display: flex; flex-direction: column; gap: 1.5rem; }
        
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
        .country-phone-row { grid-template-columns: 120px 1fr; }
        
        .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .form-group label { font-size: 0.8rem; font-weight: 700; color: #1f2937; letter-spacing: 1px; text-transform: uppercase; }
        .form-group input, .form-group select { padding: 1rem; border: 1px solid #f3f4f6; background: #f9fafb; border-radius: 12px; font-size: 1rem; outline: none; transition: all 0.2s; font-weight: 500; color: #1f2937; }
        .form-group input:focus, .form-group select:focus { border-color: #10b981; background: white; box-shadow: 0 0 0 4px rgba(16,185,129,0.1); }
        
        .phone-input-wrapper { display: flex; align-items: center; background: #f9fafb; border-radius: 12px; overflow: hidden; border: 1px solid #f3f4f6; transition: all 0.2s; }
        .phone-input-wrapper:focus-within { border-color: #10b981; background: white; box-shadow: 0 0 0 4px rgba(16,185,129,0.1); }
        .phone-prefix { padding: 1rem 0.5rem 1rem 1rem; font-weight: 600; color: #1f2937; border-right: none; }
        .phone-input-wrapper input { border: none !important; background: transparent !important; flex: 1; padding-left: 0.5rem !important; box-shadow: none !important; }
        
        .helper-text { font-size: 0.85rem; color: #059669; font-weight: 500; display: flex; align-items: center; gap: 0.5rem; margin-top: 0.25rem; }
        
        .checkbox-group { margin-top: 0.5rem; }
        .checkbox-label { display: flex; gap: 1rem; align-items: flex-start; cursor: pointer; text-transform: none !important; letter-spacing: normal !important; }
        .checkbox-label input[type="checkbox"] { width: 1.25rem; height: 1.25rem; margin-top: 0.1rem; accent-color: #10b981; cursor: pointer; }
        .checkbox-text { font-size: 0.95rem; color: #4b5563; font-weight: 500; line-height: 1.5; }
        
        .terms-agreement { text-align: center; font-size: 0.9rem; color: #6b7280; line-height: 1.5; padding: 0 1rem; margin: 0.5rem 0 1rem 0; }
        .terms-agreement span { color: #10b981; font-weight: 600; cursor: pointer; }
        .terms-agreement span:hover { text-decoration: underline; }
        
        .chowdeck-btn-primary { background: #f3f4f6; color: #9ca3af; border: none; padding: 1.25rem; border-radius: 12px; font-size: 1.1rem; font-weight: 700; cursor: pointer; transition: all 0.2s; margin-top: 0.5rem; }
        .chowdeck-form:valid .chowdeck-btn-primary { background: #10b981; color: white; }
        .chowdeck-form:valid .chowdeck-btn-primary:hover { background: #059669; transform: translateY(-1px); box-shadow: 0 6px 15px rgba(16,185,129,0.25); }
        
        .chowdeck-footer-divider { display: flex; align-items: center; text-align: center; margin: 2rem 0; position: relative; }
        .chowdeck-footer-divider::before, .chowdeck-footer-divider::after { content: ''; flex: 1; border-bottom: 1px solid #f3f4f6; }
        .chowdeck-footer-divider span { padding: 0 1rem; color: #6b7280; font-size: 0.95rem; font-weight: 500; }
        
        .chowdeck-btn-secondary { background: white; color: #10b981; border: 2px solid #10b981; padding: 1.25rem; border-radius: 12px; font-size: 1.1rem; font-weight: 700; cursor: pointer; transition: all 0.2s; width: 100%; display: block; text-align: center; }
        .chowdeck-btn-secondary:hover { background: #f0fdf4; }
        @media (max-width: 480px) {
          .chowdeck-card { padding: 2rem 1.25rem; }
          .form-row { grid-template-columns: 1fr; gap: 1rem; }
          .country-phone-row { grid-template-columns: 100px 1fr; }
        }
      `}</style>
    </div>
  );
}
