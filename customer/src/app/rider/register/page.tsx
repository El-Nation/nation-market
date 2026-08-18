'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, MapPin, ShieldCheck, FileText, CheckCircle2, ChevronRight, ChevronLeft, UploadCloud, Bike } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';

export default function RiderRegistration() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  
  // Form State
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '',
    birthday: '', address: '', city: '', vehicleType: 'Motorcycle', plateNumber: '',
    idType: 'Driver License', idNumber: '', termsAccepted: false
  });

  const nextStep = () => {
    if (step === 1 && formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    setStep(prev => prev + 1);
  };
  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = async () => {
    if (!formData.termsAccepted) { alert("You must accept the Rider Rules & Agreement"); return; }
    setLoading(true);
    
    try {
      const res = await fetch('http://localhost:5000/api/auth/rider/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          country: 'NG', 
          address: formData.address,
          city: formData.city,
          vehicleType: formData.vehicleType,
          plateNumber: formData.plateNumber,
          idType: formData.idType,
          idNumber: formData.idNumber,
          termsAccepted: formData.termsAccepted,
          // Cloudinary place holders
          idDocumentUrl: 'cloudinary_placeholder_123',
          profilePhotoUrl: 'cloudinary_placeholder_456'
        })
      });
      
      const data = await res.json();
      if (data.success && data.data) {
        login(data.data, data.data.token);
        window.location.href = '/rider/dashboard';
      } else {
        alert(data.message || 'Registration dropped');
      }
    } catch (err) {
      alert('Network Error mapping to backend Node payload');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="registration-container">
      <div className="registration-card">
        
        <div className="brand-header">
          <img src="/logo.png" alt="NATION MARKET" className="brand-logo" />
        </div>

        <div className="steps-indicator">
          {[1, 2, 3, 4, 5].map(s => (
            <div key={s} className={`step-dot ${step >= s ? 'active' : ''}`}>
              {s === 1 && <User size={16} />}
              {s === 2 && <MapPin size={16} />}
              {s === 3 && <ShieldCheck size={16} />}
              {s === 4 && <FileText size={16} />}
              {s === 5 && <CheckCircle2 size={16} />}
            </div>
          ))}
          <div className="progress-line" style={{ width: `${((step - 1) / 4) * 100}%` }} />
        </div>

        <div className="form-content">
          {step === 1 && (
            <div className="step-panel fade-in">
              <h3>Basic Account</h3>
              <p className="step-desc">Enter your essential details to secure access.</p>
              
              <div className="input-group-row">
                <div className="form-group">
                  <label>First Name</label><input type="text" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} placeholder="John" />
                </div>
                <div className="form-group">
                  <label>Last Name</label><input type="text" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} placeholder="Doe" />
                </div>
              </div>
              
              <div className="form-group mt"><label>Email Address</label><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="rider@example.com" /></div>
              <div className="form-group mt"><label>Phone Number</label><input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+234..." /></div>
              
              <div className="input-group-row mt">
                <div className="form-group"><label>Password</label><input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} /></div>
                <div className="form-group"><label>Confirm Password</label><input type="password" value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} /></div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="step-panel fade-in">
              <h3>Rider Information</h3>
              <p className="step-desc">Locations and vehicle targeting for structural dispatch.</p>
              
              <div className="form-group"><label>Date of Birth</label><input type="date" value={formData.birthday} onChange={e => setFormData({...formData, birthday: e.target.value})} /></div>
              <div className="form-group mt"><label>Residential Address</label><input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="123 Example Street" /></div>
              <div className="form-group mt"><label>City / Area</label><input type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} placeholder="Lagos, Ikeja" /></div>
              
              <div className="input-group-row mt">
                <div className="form-group">
                  <label>Vehicle Type</label>
                  <select value={formData.vehicleType} onChange={e => setFormData({...formData, vehicleType: e.target.value})}>
                    <option>Motorcycle</option><option>Bicycle</option><option>Car</option><option>Van / Truck</option>
                  </select>
                </div>
                <div className="form-group"><label>Plate Number</label><input type="text" value={formData.plateNumber} onChange={e => setFormData({...formData, plateNumber: e.target.value})} placeholder="ABC-123-XY" /></div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="step-panel fade-in">
              <h3>Identity Verification</h3>
              <p className="step-desc">Secure physical validation per operational guidelines.</p>
              
              <div className="input-group-row">
                 <div className="form-group">
                  <label>ID Type</label>
                  <select value={formData.idType} onChange={e => setFormData({...formData, idType: e.target.value})}>
                    <option>Driver License</option><option>National ID</option><option>International Passport</option>
                  </select>
                </div>
                <div className="form-group"><label>ID Number</label><input type="text" value={formData.idNumber} onChange={e => setFormData({...formData, idNumber: e.target.value})} placeholder="NIN / License Number" /></div>
              </div>

              <div className="upload-container">
                <UploadCloud size={24} color="#005b9f" />
                <span>Upload ID Document (Cloudinary Secure Box)</span>
                <small>Auto-resizing integrated. JPEG, PNG, PDF up to 5MB.</small>
              </div>

              <div className="upload-container">
                <UploadCloud size={24} color="#005b9f" />
                <span>Upload Profile Photo</span>
                <small>Professional headshot required for Customer visibility.</small>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="step-panel fade-in">
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <span style={{ background: '#e6f4ea', color: '#1b5e20', padding: '0.35rem 1rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700 }}>
                  FINAL STEP
                </span>
                <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Rider Rules &amp; Agreement</h3>
                <p className="step-desc" style={{ marginBottom: 0 }}>Please read the following terms carefully before activating your rider account.</p>
              </div>
              
              <div className="agreement-scroll-box" style={{ height: '350px' }}>
                <h4>1. Eligibility &amp; Verification</h4>
                <p>You must possess a valid driver's license matching your vehicle type and provide state-recognized identification. Proxy riders are strictly prohibited and will result in immediate permanent suspension (Code: RM-403).</p>

                <h4>2. Order Handling &amp; Professionalism</h4>
                <p>Riders must handle all vendor products with care. Tampering with packages, breaking seals, or mishandling food items is a zero-tolerance offense resulting in immediate dismissal.</p>

                <h4>3. Timeliness &amp; Availability</h4>
                <p>You are expected to honor dispatch times. If you are unavailable to continuously receive orders, you must log off the dashboard properly rather than declining assigned dispatches.</p>

                <h4>4. Conduct &amp; Safety</h4>
                <p>Riders must adhere to all local traffic laws. Professional, respectful communication with both customers and vendors is required at all times.</p>

                <h4>5. Payments &amp; Settlement</h4>
                <p>Delivery fees are calculated dynamically based on distance. Payouts are remitted to your configured bank account on the platform's scheduled settlement cycle.</p>

                <h4>6. Account Active Status</h4>
                <p>Upon accepting this agreement, your Rider Account will become immediately ACTIVE. NATION MARKET retains full administrative rights to suspend or deactivate active accounts that violate these terms.</p>

                <h4 style={{ marginTop: '1.5rem' }}>Agreement Version</h4>
                <p>This agreement is Version <strong>RM-1.0.0</strong> | Dynamic Record Binding via UID</p>
              </div>

              <div className="checkbox-group" style={{ background: '#e6f4ea', borderColor: '#b7e1cd' }}>
                <input type="checkbox" id="terms" checked={formData.termsAccepted} onChange={e => setFormData({...formData, termsAccepted: e.target.checked})} style={{ accentColor: '#1b5e20' }} />
                <label htmlFor="terms" style={{ color: '#111827', fontWeight: 500, fontSize: '0.95rem' }}>I have read and agree to the <strong>NATION MARKET Rider Rules &amp; Agreement (RM-1.0.0)</strong></label>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="step-panel step-success fade-in">
              <CheckCircle2 size={64} color="#16a34a" className="success-icon" />
              <h3>Verification Stored!</h3>
              <p className="step-desc">Your NATION MARKET profile is initialized and structurally active.</p>
              <div className="post-action-box">
                 <p>Proceed organically to the unified login portal to access your <strong>Rider Dashboard Hub</strong>.</p>
              </div>
            </div>
          )}
        </div>

        <div className="form-actions">
          {step > 1 && step < 5 && <button className="btn-secondary" onClick={prevStep}><ChevronLeft size={18} /> Back</button>}
          {step === 1 && <div></div>}
          
          {step < 4 && <button className="btn-primary" onClick={nextStep}>Continue <ChevronRight size={18} /></button>}
          {step === 4 && <button className="btn-primary" onClick={handleSubmit} disabled={loading}>{loading ? 'Transmitting...' : 'Accept & Register'}</button>}
          {step === 5 && <button className="btn-primary" onClick={() => window.location.href = 'http://localhost:3000/login'}>Enter Ecosystem</button>}
        </div>

      </div>

      <style>{`
        .registration-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f4f7f6; padding: 2rem 1rem; font-family: -apple-system, sans-serif; }
        .registration-card { background: white; padding: 2.5rem; border-radius: 20px; box-shadow: 0 15px 40px rgba(0,0,0,0.06); width: 100%; max-width: 580px; position: relative; overflow: hidden; }
        
        .brand-header { overflow: hidden; height: 110px; display: flex; align-items: center; justify-content: center; margin-bottom: 2rem; }
        .brand-logo { height: 320px; width: auto; object-fit: contain; }

        .steps-indicator { display: flex; justify-content: space-between; position: relative; margin-bottom: 2.5rem; padding: 0 1rem; }
        .progress-line { position: absolute; top: 50%; left: 1rem; right: 1rem; height: 3px; background: #005b9f; transform: translateY(-50%); z-index: 1; transition: width 0.4s ease; }
        .steps-indicator::after { content: ''; position: absolute; top: 50%; left: 1rem; right: 1rem; height: 3px; background: #e5e7eb; transform: translateY(-50%); z-index: 0; }
        .step-dot { width: 36px; height: 36px; border-radius: 50%; background: #e5e7eb; color: #9ca3af; display: flex; align-items: center; justify-content: center; z-index: 2; transition: all 0.3s; }
        .step-dot.active { background: #005b9f; color: white; box-shadow: 0 0 0 4px rgba(0,91,159,0.15); }
        
        .step-panel h3 { font-size: 1.6rem; color: #111827; margin: 0 0 0.5rem 0; font-weight: 700; letter-spacing: -0.5px; }
        .step-desc { color: #6b7280; font-size: 0.95rem; margin-bottom: 2rem; }
        
        .input-group-row { display: flex; gap: 1rem; }
        .input-group-row .form-group { flex: 1; }
        .mt { margin-top: 1.25rem; }
        
        .form-group label { display: block; font-size: 0.9rem; font-weight: 600; color: #374151; margin-bottom: 0.5rem; }
        .form-group input, .form-group select { width: 100%; padding: 0.8rem 1rem; border: 1px solid #d1d5db; border-radius: 8px; font-size: 1rem; outline: none; transition: border-color 0.2s; background: #fff; }
        .form-group input:focus, .form-group select:focus { border-color: #005b9f; box-shadow: 0 0 0 3px rgba(0,91,159,0.1); }
        
        .upload-container { border: 2px dashed #005b9f; border-radius: 12px; padding: 2rem; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem; background: #f8fbff; margin-top: 1.25rem; cursor: pointer; transition: background 0.2s; text-align: center; }
        .upload-container:hover { background: #eff6ff; }
        .upload-container span { font-weight: 600; color: #111827; font-size: 0.95rem; }
        .upload-container small { color: #6b7280; font-size: 0.85rem; }

        .agreement-scroll-box { border: 1px solid #e5e7eb; border-radius: 8px; padding: 1.5rem; height: 240px; overflow-y: auto; background: #f9fafb; font-size: 0.9rem; color: #374151; line-height: 1.5; margin-bottom: 1.5rem; }
        .agreement-scroll-box h4 { margin: 0 0 1rem 0; color: #111827; font-size: 1.05rem; }
        
        .checkbox-group { display: flex; align-items: flex-start; gap: 0.75rem; background: #fecaca; padding: 1rem; border-radius: 8px; border: 1px solid #f87171; }
        .checkbox-group input { margin-top: 0.2rem; width: 18px; height: 18px; }
        .checkbox-group label { font-size: 0.95rem; font-weight: 500; color: #991b1b; line-height: 1.4; cursor: pointer; }

        .form-actions { display: flex; justify-content: space-between; margin-top: 2.5rem; padding-top: 1.5rem; border-top: 1px solid #f3f4f6; }
        
        .btn-primary { background: #005b9f; color: white; border: none; padding: 0.8rem 1.5rem; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: background 0.2s; }
        .btn-primary:hover:not(:disabled) { background: #00467a; }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        
        .btn-secondary { background: white; color: #374151; border: 1px solid #d1d5db; padding: 0.8rem 1.5rem; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s; }
        .btn-secondary:hover { background: #f3f4f6; }

        .step-success { text-align: center; padding: 2rem 0; }
        .success-icon { margin-bottom: 1rem; animation: pop 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
        .post-action-box { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 1.5rem; border-radius: 12px; margin-top: 1.5rem; color: #166534; font-size: 0.95rem; }
        
        .fade-in { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pop { 0% { transform: scale(0.8); opacity: 0; } 50% { transform: scale(1.1); } 100% { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}
