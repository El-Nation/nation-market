'use client';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { LogOut, Bike, Map, Clock, PackageCheck, Box, Bell, Shield, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function RiderDashboard() {
  const { user, token, logout } = useAuthStore();
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(false);
  const [activeTab, setActiveTab] = useState('Security Settings');

  // Security Form States
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('+234 800 000 0000');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [qrCode, setQrCode] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [setupSecret, setSetupSecret] = useState('');
  const [is2FAEnabled, setIs2FAEnabled] = useState(false); // Can be pulled from backend natively in next stage
  const [isMounted, setIsMounted] = useState(false);

  const handleUpdate = async (endpoint: string, payload: any, successMessage: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/auth/${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        alert(successMessage);
        if (endpoint === 'update-password') {
          setCurrentPassword('');
          setNewPassword('');
        }
      } else {
        alert(data.message || 'Operation failed');
      }
    } catch (e) {
      alert('Network Error');
    }
  };

  const generate2FA = async () => {
    if (is2FAEnabled) {
      alert('2FA is already enabled on your account.');
      return;
    }
    const res = await fetch(`http://localhost:5000/api/auth/2fa/generate`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      setQrCode(data.data.qrCodeUrl);
      setSetupSecret(data.data.secret);
    }
  };

  const confirm2FA = async () => {
    const res = await fetch(`http://localhost:5000/api/auth/2fa/enable`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ token: otpToken })
    });
    const data = await res.json();
    if (data.success) {
      alert('Two-Factor Authentication Successfully Secured!');
      setIs2FAEnabled(true);
      setQrCode('');
      setOtpToken('');
    } else {
      alert(data.message || 'Invalid Code');
    }
  };

  const disable2FA = async () => {
    if (!window.confirm("Are you sure you want to disable Two-Factor Authentication? Your account will be less secure.")) return;
    
    const res = await fetch(`http://localhost:5000/api/auth/2fa/disable`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      alert(data.message);
      setIs2FAEnabled(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    if (!token || user?.role !== 'RIDER') {
      window.location.href = '/login';
    }
  }, [token, user]);

  if (!isMounted) return null;
  if (!token || user?.role !== 'RIDER') return null;

  return (
    <div className="layout-app">
      <nav className="side-nav">
        <div className="nav-header">
          <img src="/logo.png" alt="NATION MARKET" className="dashboard-logo" />
        </div>
        <div className="nav-menu">
          <button className={`nav-item ${activeTab === 'Hub' ? 'active' : ''}`} onClick={() => setActiveTab('Hub')}><Bike size={20} /> Hub</button>
          <button className={`nav-item ${activeTab === 'Earnings' ? 'active' : ''}`} onClick={() => setActiveTab('Earnings')}><Wallet size={20} /> Earnings</button>
          <button className={`nav-item ${activeTab === 'Deliveries' ? 'active' : ''}`} onClick={() => setActiveTab('Deliveries')}><PackageCheck size={20} /> Deliveries</button>
          <button className={`nav-item ${activeTab === 'Notifications' ? 'active' : ''}`} onClick={() => setActiveTab('Notifications')}><Bell size={20} /> Notifications</button>
          <button className={`nav-item ${activeTab === 'Security Settings' ? 'active' : ''}`} onClick={() => setActiveTab('Security Settings')}><Shield size={20} /> Security Settings</button>
        </div>
        <div className="nav-footer">
          <button className="logout-button" onClick={logout}><LogOut size={20} /> Logout</button>
        </div>
      </nav>

      <main className="main-zone">
        <header className="top-header">
          <div>
            <h1>Welcome, {user.firstName || 'Rider'} 👋🏽</h1>
            <p className="subtitle">Lagos Delivery Sector</p>
          </div>
          
          <div className="availability-box">
             <span className="availability-text">Availability:</span>
             <label className="toggle-switch">
               <input type="checkbox" checked={isOnline} onChange={e => setIsOnline(e.target.checked)} />
               <span className="slider"></span>
             </label>
             <span className={`status-badge ${isOnline ? 'online' : 'offline'}`}>{isOnline ? '🟢 Online' : '🔴 Offline'}</span>
          </div>
        </header>

        {activeTab === 'Hub' && (
          <div className="fade-in">
            <section className="stage-9-alert">
               <Map size={32} color="#005b9f" />
               <div className="alert-content">
                  <h3>Live Dispatch Node Standby</h3>
                  <p>Stage 9 & 11 integrations will permanently bind this hub to the physical physical GPS delivery map architectures connecting Customer orders natively here.</p>
               </div>
            </section>

            <div className="metrics-grid">
              <div className="metric-card"><h4>Today's Earnings</h4><div className="metric-val">₦ 0.00</div></div>
              <div className="metric-card"><h4>Live Assignments</h4><div className="metric-val">0</div></div>
              <div className="metric-card"><h4>Completed Hand-offs</h4><div className="metric-val">0</div></div>
              <div className="metric-card"><h4>Hours Online</h4><div className="metric-val">0.0<small>h</small></div></div>
            </div>
          </div>
        )}

        {activeTab === 'Earnings' && (
          <div className="tab-pane fade-in">
            <h2>Your Earnings</h2>
            <p>Full breakdown of your delivery commissions will appear here.</p>
            <div className="metrics-grid mt-2">
              <div className="metric-card"><h4>Wallet Balance</h4><div className="metric-val">₦ 0.00</div></div>
              <div className="metric-card"><h4>Pending Clearance</h4><div className="metric-val">₦ 0.00</div></div>
            </div>
          </div>
        )}

        {activeTab === 'Deliveries' && (
          <div className="tab-pane fade-in">
            <h2>Delivery History</h2>
            <div className="empty-state">No deliveries completed yet. Go online to receive assignments!</div>
          </div>
        )}

        {activeTab === 'Notifications' && (
          <div className="tab-pane fade-in">
            <h2>System Notifications</h2>
            <div className="empty-state">You are all caught up. No new alerts.</div>
          </div>
        )}

        {activeTab === 'Security Settings' && (
          <div className="tab-pane fade-in">
            <h2>Security & Account</h2>
            <p>Manage your account credentials, notifications, and structural security.</p>
            
            <div className="settings-grid">
               <div className="settings-box">
                  <h4>Personal Details</h4>
                  <div className="form-group">
                    <label>First Name</label>
                    <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} />
                  </div>
                  <div className="form-group mt-2">
                    <label>Last Name</label>
                    <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} />
                  </div>
                  <button className="settings-btn mt-2 border-primary" onClick={() => handleUpdate('update-details', { firstName, lastName }, 'Profile updated successfully!')}>Update Details</button>
               </div>

               <div className="settings-box">
                  <h4>Contact Info</h4>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                  <div className="form-group mt-2">
                    <label>Phone Number</label>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Enter phone" />
                  </div>
                  <button className="settings-btn mt-2 border-primary" onClick={() => handleUpdate('update-contact', { email, phone }, 'Contact info updated successfully!')}>Update Contact</button>
               </div>

               <div className="settings-box">
                  <h4>Change Password</h4>
                  <div className="form-group">
                    <label>Current Password</label>
                    <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="••••••••" />
                  </div>
                  <div className="form-group mt-2">
                    <label>New Password</label>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" />
                  </div>
                  <button className="settings-btn mt-2 border-primary" onClick={() => handleUpdate('update-password', { currentPassword, newPassword }, 'Password changed securely!')}>Update Password</button>
               </div>

               <div className="settings-box">
                  <h4>Two-Factor Authentication (2FA)</h4>
                  <p className="text-sm">Add an extra layer of security to your account requiring a confirmation code.</p>
                  
                  {!qrCode && !is2FAEnabled && (
                    <>
                      <label className="toggle-switch mt-2">
                        <input type="checkbox" onChange={generate2FA} checked={is2FAEnabled} />
                        <span className="slider"></span>
                      </label>
                      <span className="ml-2 font-bold">{is2FAEnabled ? 'Enabled' : 'Disabled'}</span>
                    </>
                  )}

                  {is2FAEnabled && (
                     <div className="p-3 bg-green-50 text-green-700 font-bold border rounded mt-2 flex justify-between items-center">
                        <span>2FA is Actively Secured 🛡️</span>
                        <button onClick={disable2FA} className="text-red-500 text-sm underline cursor-pointer bg-transparent border-none">Disable</button>
                     </div>
                  )}

                  {qrCode && (
                    <div className="qr-container mt-2">
                      <p className="font-bold text-sm mb-1 text-center">Scan this QR Code in Google Authenticator</p>
                      <img src={qrCode} alt="2FA QR Code" className="mx-auto block border rounded p-1 mb-2 bg-white" />
                      
                      <div className="text-center mb-3">
                        <p className="text-sm font-bold text-gray-500">OR ENTER MANUAL KEY:</p>
                        <code className="bg-gray-100 p-2 rounded block tracking-widest text-primary font-bold mt-1 text-lg">
                          {setupSecret}
                        </code>
                      </div>

                      <input 
                        type="text" 
                        value={otpToken} 
                        onChange={e => setOtpToken(e.target.value)} 
                        placeholder="Enter 6-digit code" 
                        className="w-full text-center tracking-widest text-lg py-2 border rounded"
                        maxLength={6}
                      />
                      <button className="settings-btn border-primary mt-2 w-full" onClick={confirm2FA}>Verify & Enable</button>
                    </div>
                  )}
               </div>
            </div>
          </div>
        )}
      </main>

      <style>{`
        .layout-app { display: flex; min-height: 100vh; background: #f3f4f6; font-family: -apple-system, sans-serif; }
        
        .side-nav { width: 280px; background: white; border-right: 1px solid #e5e7eb; display: flex; flex-direction: column; }
        .nav-header { padding: 1.5rem; border-bottom: 1px solid #e5e7eb; text-align: center; }
        .dashboard-logo { height: 90px; object-fit: contain; margin: -30px 0; }
        
        .nav-menu { flex: 1; padding: 1.5rem 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
        .nav-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.85rem 1rem; color: #4b5563; text-decoration: none; border-radius: 8px; font-weight: 500; transition: all 0.2s; border: none; background: transparent; cursor: pointer; width: 100%; text-align: left; font-size: 1rem; font-family: inherit; }
        .nav-item:hover { background: #f3f4f6; color: #111827; }
        .nav-item.active { background: #eff6ff; color: #005b9f; }
        
        .nav-footer { padding: 1.5rem; padding-bottom: 3.5rem; border-top: 1px solid #e5e7eb; }
        .logout-button { display: flex; align-items: center; justify-content: center; gap: 0.75rem; width: 100%; border: 1px solid #fecaca; background: #fef2f2; color: #dc2626; padding: 0.85rem; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .logout-button:hover { background: #fee2e2; }

        .main-zone { flex: 1; padding: 2.5rem 3rem; overflow-y: auto; }
        
        .top-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2rem; }
        .top-header h1 { font-size: 2rem; margin: 0 0 0.25rem 0; color: #111827; font-weight: 700; letter-spacing: -0.5px; }
        .subtitle { margin: 0; color: #6b7280; font-size: 1.05rem; }
        
        .availability-box { background: white; padding: 1rem 1.5rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); display: flex; align-items: center; gap: 1rem; border: 1px solid #e5e7eb; }
        .availability-text { font-weight: 600; color: #374151; font-size: 0.95rem; }
        .status-badge { font-size: 0.85rem; font-weight: 700; padding: 0.35rem 0.75rem; border-radius: 20px; }
        .status-badge.online { background: #dcfce7; color: #166534; }
        .status-badge.offline { background: #f3f4f6; color: #4b5563; }
        
        /* Toggle Switch */
        .toggle-switch { position: relative; display: inline-block; width: 44px; height: 24px; cursor: pointer; }
        .toggle-switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: #d1d5db; border-radius: 24px; transition: .3s; }
        .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; border-radius: 50%; transition: .3s; }
        input:checked + .slider { background-color: #16a34a; }
        input:checked + .slider:before { transform: translateX(20px); }

        .stage-9-alert { background: #eff6ff; border: 1px dashed #93c5fd; padding: 2rem; border-radius: 12px; display: flex; gap: 1.5rem; align-items: flex-start; margin-bottom: 2.5rem; }
        .alert-content h3 { margin: 0 0 0.5rem 0; color: #1e3a8a; font-size: 1.15rem; }
        .alert-content p { margin: 0; color: #1e40af; font-size: 0.95rem; line-height: 1.5; }

        .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; }
        .metric-card { background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); border: 1px solid #e5e7eb; transition: transform 0.2s; }
        .metric-card:hover { transform: translateY(-3px); box-shadow: 0 10px 15px rgba(0,0,0,0.05); }
        .metric-card h4 { margin: 0 0 0.75rem 0; font-size: 0.9rem; color: #6b7280; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
        .metric-val { font-size: 2rem; font-weight: 700; color: #111827; letter-spacing: -0.5px; }
        .metric-val small { font-size: 1.1rem; color: #9ca3af; margin-left: 0.25rem; font-weight: 500; }
        
        .tab-pane { padding: 1rem 0; }
        .tab-pane h2 { margin-top: 0; color: #111827; }
        .empty-state { padding: 3rem; text-align: center; color: #6b7280; background: white; border-radius: 12px; border: 1px dashed #d1d5db; margin-top: 1rem; font-weight: 500; }
        .mt-2 { margin-top: 1.5rem; }
        .settings-btn { padding: 0.75rem 1.5rem; background: white; border: 1px solid #d1d5db; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s; }
        .settings-btn:hover { background: #f3f4f6; color: #005b9f; border-color: #005b9f; }
        .fade-in { animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }

        .settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-top: 2rem; }
        .settings-box { background: white; padding: 2rem; border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
        .settings-box h4 { margin: 0 0 1.5rem 0; font-size: 1.1rem; color: #111827; border-bottom: 2px solid #f3f4f6; padding-bottom: 0.5rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .form-group label { font-size: 0.85rem; font-weight: 700; color: #4b5563; text-transform: uppercase; letter-spacing: 0.5px; }
        .form-group input { padding: 0.85rem 1rem; border: 1px solid #d1d5db; border-radius: 8px; font-size: 1rem; outline: none; transition: border-color 0.2s; }
        .form-group input:focus { border-color: #005b9f; box-shadow: 0 0 0 3px rgba(0,91,159,0.1); }
        .border-primary { border: 1px solid #005b9f; color: #005b9f; width: 100%; transition: all 0.2s; }
        .border-primary:hover { background: #005b9f; color: white; }
        .text-sm { font-size: 0.95rem; line-height: 1.5; color: #6b7280; }
        .ml-2 { margin-left: 0.75rem; vertical-align: super; }
        .font-bold { font-weight: 600; color: #374151; }
        .text-center { text-align: center; }
        .mx-auto { margin-left: auto; margin-right: auto; }
        .block { display: block; }
        .mb-2 { margin-bottom: 0.5rem; }
        .mb-3 { margin-bottom: 0.75rem; }
        .mb-1 { margin-bottom: 0.25rem; }
        .mt-1 { margin-top: 0.25rem; }
        .w-full { width: 100%; }
        .tracking-widest { letter-spacing: 0.1em; }
        .text-lg { font-size: 1.125rem; }
        .text-primary { color: #f5b70d; }
        .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
        .p-2 { padding: 0.5rem; }
        .bg-white { background-color: #fff; }
        .bg-gray-100 { background-color: #f3f4f6; }
        .text-gray-500 { color: #6b7280; }
        .p-1 { padding: 0.25rem; }
        .p-3 { padding: 0.75rem; }
        .rounded { border-radius: 0.25rem; }
        .border { border-width: 1px; border-style: solid; border-color: #e5e7eb; }
        .border-none { border: none; }
        .bg-transparent { background: transparent; }
        .cursor-pointer { cursor: pointer; }
        .underline { text-decoration: underline; }
        .text-red-500 { color: #ef4444; }
        .flex { display: flex; }
        .justify-between { justify-content: space-between; }
        .items-center { align-items: center; }
        .bg-green-50 { background-color: #f0fdf4; }
        .text-green-700 { color: #15803d; }

        @media (max-width: 1024px) { 
           .metrics-grid { grid-template-columns: repeat(2, 1fr); } 
           .settings-grid { grid-template-columns: 1fr; } 
        }
      `}</style>
    </div>
  );
}
