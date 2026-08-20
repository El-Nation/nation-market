'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Store, ShoppingCart, Shirt, Monitor, Utensils, Eye, EyeOff, Leaf, Pill, BookOpen } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function VendorRegister() {
  const router = useRouter();
  const setAuth = useAuthStore(state => state.login);
  
  // Step State
  const [step, setStep] = useState(1);
  const [businessType, setBusinessType] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [country, setCountry] = useState('Nigeria');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [notOwner, setNotOwner] = useState(false);
  const [ownerName, setOwnerName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isRegistered, setIsRegistered] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleCategorySelection = (type: string) => {
    setBusinessType(type);
    setStep(2);
  };

  // Step 2 → Step 3: validate form then show agreement
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { alert('Passwords do not match'); return; }
    if (!firstName || !lastName || !email || !password || !businessName) { alert('Please fill in all required fields'); return; }
    setStep(3);
  };

  // Step 3 → API: only called after explicit agreement acceptance
  const confirmRegistration = async () => {
    if (!termsAccepted) { alert('You must read and accept the NATION MARKET Vendor Rules & Agreement to continue.'); return; }
    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/vendor/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName, lastName, email, password,
          storeName: businessName, businessType,
          isRegistered: isRegistered === 'Yes',
          phone, country, termsAccepted
        })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setAuth(data.data.token, data.data.role);
        window.location.href = `http://localhost:3001/?token=${data.data.token}`;
      } else {
        alert(data.message || 'Registration failed');
      }
    } catch (err) {
      alert('Backend connection failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 1: Category Selection
  if (step === 1) {
    return (
      <div className="step-container">
        <header className="step-header">
          <div className="brand">
            <img src="/logo.png" alt="NATION MARKET" className="nav-logo" />
          </div>
          <div className="login-link">
            <span>Have an account?</span> <a href="http://localhost:3000/login">Log in</a>
          </div>
        </header>
        
        <div className="step-content">
          <h1>WHAT TYPE OF BUSINESS DO YOU RUN?</h1>
          
          <div className="business-cards">
            
            <div className="biz-card" onClick={() => handleCategorySelection('Supermarket & Groceries')}>
              <h3>Supermarket & Groceries</h3>
              <p>Groceries, mini marts, beverages, general retail..</p>
              <div className="biz-icon shopping"><ShoppingCart size={48} /></div>
            </div>

            <div className="biz-card" onClick={() => handleCategorySelection('Fashion & Beauty')}>
              <h3>Fashion & Beauty</h3>
              <p>Clothing, cosmetics, salons, jewelry, boutiques..</p>
              <div className="biz-icon fashion"><Shirt size={48} /></div>
            </div>

            <div className="biz-card" onClick={() => handleCategorySelection('Electronics & Gadgets')}>
              <h3>Electronics & Gadgets</h3>
              <p>Phones, computers, appliances, tech accessories..</p>
              <div className="biz-icon tech"><Monitor size={48} /></div>
            </div>

            <div className="biz-card" onClick={() => handleCategorySelection('Restaurants & Food')}>
              <h3>Restaurants & Food</h3>
              <p>Restaurants, cafés, food trucks, cloud kitchens..</p>
              <div className="biz-icon food"><Utensils size={48} /></div>
            </div>

            <div className="biz-card" onClick={() => handleCategorySelection('Agriculture & Farming')}>
              <h3>Agriculture & Farming</h3>
              <p>Farm produce, livestock, seeds, farming tools, fertilizers..</p>
              <div className="biz-icon agric"><Leaf size={48} /></div>
            </div>

            <div className="biz-card" onClick={() => handleCategorySelection('Pharmacy & Health')}>
              <h3>Pharmacy & Health</h3>
              <p>Drugs, skin care, medicine, health equipment, supplements..</p>
              <div className="biz-icon health"><Pill size={48} /></div>
            </div>

            <div className="biz-card" onClick={() => handleCategorySelection('Books & Education')}>
              <h3>Books & Education</h3>
              <p>Books, educational materials, stationery, study kits..</p>
              <div className="biz-icon edu"><BookOpen size={48} /></div>
            </div>
            
            <div className="biz-card" onClick={() => handleCategorySelection('Home, Kitchen & Furniture')}>
              <h3>Home, Kitchen & Furniture</h3>
              <p>Furniture, decor, tools, home improvement..</p>
              <div className="biz-icon tech"><Store size={48} /></div>
            </div>
            
            <div className="biz-card" onClick={() => handleCategorySelection('Automotive & Industrial')}>
              <h3>Automotive & Industrial</h3>
              <p>Car parts, oil, heavy machinery, generators..</p>
              <div className="biz-icon agric"><Monitor size={48} /></div>
            </div>
            
            <div className="biz-card" onClick={() => handleCategorySelection('Toys, Kids & Babies')}>
              <h3>Toys, Kids & Babies</h3>
              <p>Toys, baby care, maternity, toddlers..</p>
              <div className="biz-icon shopping"><ShoppingCart size={48} /></div>
            </div>

          </div>
        </div>

        <style>{`
          .step-container { min-height: 100vh; background: #004d40; color: white; font-family: -apple-system, sans-serif; position: relative; overflow-x: hidden; overflow-y: auto; padding-bottom: 4rem; }
          .step-container::before {
            content: ''; position: fixed; top: 0; left: 0; right: 0; bottom: 0; opacity: 0.1; pointer-events: none;
            background-image: linear-gradient(60deg, #ffffff 1px, transparent 1px), linear-gradient(-60deg, #ffffff 1px, transparent 1px);
            background-size: 100px 173px; z-index: 0;
          }
          
          .step-header { padding: 1.5rem 2rem; display: flex; justify-content: space-between; align-items: flex-start; position: relative; z-index: 10; max-width: 1400px; margin: 0 auto; }
          .login-link { font-size: 1rem; font-weight: 500; margin-top: 1rem; }
          .login-link a { color: #80cbc4; text-decoration: none; margin-left: 0.5rem; transition: color 0.2s; font-weight: 700; }
          .login-link a:hover { color: #fff; text-decoration: underline; }
          
          .step-content { position: relative; z-index: 10; padding: 2rem 2rem; max-width: 1200px; margin: 0 auto; text-align: center; }
          .step-content h1 { font-size: 2rem; font-weight: 900; margin-bottom: 3rem; text-transform: uppercase; font-style: italic; letter-spacing: 1px; }
          
          .business-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; max-width: 1000px; margin: 0 auto; }
          .biz-card { background: white; color: #111827; border-radius: 12px; padding: 2rem 1.5rem; text-align: left; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; position: relative; overflow: hidden; }
          .biz-card:hover { transform: translateY(-5px); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2); }
          
          .biz-card h3 { font-size: 1.3rem; margin: 0 0 0.5rem 0; font-weight: 700; color: #111827; }
          .biz-card p { font-size: 0.95rem; color: #6b7280; margin: 0 0 4rem 0; line-height: 1.4; }
          
          .biz-icon { position: absolute; bottom: 1.5rem; left: 1.5rem; }
          .shopping { color: #f59e0b; }
          .fashion { color: #ec4899; }
          .tech { color: #3b82f6; }
          .food { color: #10b981; }
          .agric { color: #65a30d; }
          .health { color: #14b8a6; }
          .edu { color: #8b5cf6; }
          
          /* Huge floating logo with clipping */
          .brand { overflow: hidden; height: 110px; display: flex; align-items: center; justify-content: flex-start; margin-left: -2rem; margin-top: -1rem; margin-bottom: -1rem; }
          .nav-logo { height: 320px; width: auto; object-fit: contain; }
        `}</style>
      </div>
    );
  }

  // Step 2: Form Registration
  return (
    <div className="step-container">
      
      <header className="step-header">
        <div className="brand">
          <img src="/logo.png" alt="NATION MARKET" className="nav-logo" />
        </div>
        <div className="login-link">
          <span>Have an account?</span> <a href="/login">Log in</a>
        </div>
      </header>
      
      <div className="step-content-form">
        <div className="form-wrapper">
          <h1>LET'S GET YOU STARTED</h1>
          
          <form className="vendor-form" onSubmit={handleSubmit}>
            
            <div className="form-group">
              <label>Country</label>
              <select value={country} onChange={(e) => setCountry(e.target.value)} required>
                <option value="Nigeria">Nigeria</option>
                <option value="Ghana">Ghana</option>
                <option value="South Africa">South Africa</option>
              </select>
            </div>

            <div className="form-group">
              <label>Business address</label>
              <input type="text" value={businessAddress} onChange={(e)=>setBusinessAddress(e.target.value)} placeholder="Enter business address" required />
            </div>

            <div className="form-group">
              <label>Business name</label>
              <input type="text" value={businessName} onChange={(e)=>setBusinessName(e.target.value)} placeholder="Enter business name" required />
            </div>

            <div className="form-checkbox">
              <label>
                <input type="checkbox" checked={notOwner} onChange={(e) => setNotOwner(e.target.checked)} />
                <span>I do not own this business</span>
              </label>
            </div>

            {notOwner && (
              <div className="form-group animated-fade">
                <label>Provide the business owner's name</label>
                <input type="text" value={ownerName} onChange={(e)=>setOwnerName(e.target.value)} placeholder="Enter owner's name" required />
                <span className="helper-text">ⓘ We need this for business documentation</span>
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label>First name</label>
                <input type="text" value={firstName} onChange={(e)=>setFirstName(e.target.value)} placeholder="Enter first name" required />
              </div>
              <div className="form-group">
                <label>Last name</label>
                <input type="text" value={lastName} onChange={(e)=>setLastName(e.target.value)} placeholder="Enter last name" required />
              </div>
            </div>

            <div className="form-group">
              <label>Email address</label>
              <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Enter email address" required />
            </div>

            <div className="form-group">
              <label>Phone number</label>
              <div className="phone-input">
                <select className="phone-prefix-select">
                  <option>NG +234</option>
                </select>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="8000000000" required className="flex-1" />
              </div>
            </div>

            <div className="form-group">
              <label>Is your business registered?</label>
              <select value={isRegistered} onChange={(e) => setIsRegistered(e.target.value)} required>
                <option value="" disabled hidden>Select option</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
              {isRegistered === '' && <span className="error-text">Is your business registered? is invalid</span>}
            </div>

            <div className="form-group relative">
              <label>Password</label>
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Enter password (min. of 8 characters)" required minLength={8} />
              <button type="button" className="pw-toggle" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
              <span className="helper-text">Password must contain one uppercase, one lowercase, one symbol, one number, and be at least 8 characters long.</span>
            </div>

            <div className="form-group relative">
              <label>Confirm password</label>
              <input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} placeholder="Enter password (min. of 8 characters)" required minLength={8} />
              <button type="button" className="pw-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <button type="submit" className="submit-account-btn">Review & Continue</button>
            <button type="button" className="go-back-btn" onClick={() => setStep(1)}>Go back</button>
          </form>
        </div>
      </div>

      {/* ── STEP 3: AGREEMENT ── */}
      {step === 3 && (
        <div className="step-container">
          <header className="step-header">
            <div className="brand">
              <img src="/logo.png" alt="NATION MARKET" className="nav-logo" />
            </div>
            <div className="login-link">
              <span>Have an account?</span> <a href="http://localhost:3000/login">Log in</a>
            </div>
          </header>

          <div className="step-content-form" style={{ maxWidth: '720px' }}>
            <div className="form-wrapper">
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <span style={{ background: '#e6f4ea', color: '#1b5e20', padding: '0.35rem 1rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700 }}>
                  FINAL STEP
                </span>
                <h1 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>NATION MARKET</h1>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#374151', margin: 0 }}>Vendor Rules &amp; Agreement</h2>
                <p style={{ color: '#6b7280', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                  Please read the following terms carefully before activating your vendor account.
                </p>
              </div>

              <div className="agreement-scroll-box">
                <h4>1. Eligibility</h4>
                <p>You must be at least 18 years of age and legally permitted to trade in your jurisdiction. By registering, you confirm that your business information is accurate and complete.</p>

                <h4>2. Product Listings</h4>
                <p>All products listed on NATION MARKET must be legal, authentic, and accurately described. Misleading titles, counterfeit products, or prohibited items will result in immediate account suspension.</p>

                <h4>3. Pricing & Availability</h4>
                <p>You are responsible for maintaining accurate prices and inventory levels. NATION MARKET reserves the right to remove listings that are consistently misleading or unavailable.</p>

                <h4>4. Order Fulfilment</h4>
                <p>Vendors must process and fulfil accepted orders promptly. Failure to fulfil orders without valid reason may result in account penalties or suspension.</p>

                <h4>5. Customer Service</h4>
                <p>You agree to respond to customer enquiries and complaints in a professional and timely manner. Disputes that cannot be resolved directly may be escalated to NATION MARKET for arbitration.</p>

                <h4>6. Platform Commission</h4>
                <p>NATION MARKET charges a platform service commission on each completed transaction. The applicable commission rate will be communicated through your Vendor Dashboard.</p>

                <h4>7. Prohibited Conduct</h4>
                <p>Vendors are prohibited from: directing customers off-platform, manipulating reviews, creating duplicate accounts, or engaging in any form of fraudulent activity.</p>

                <h4>8. Content Standards</h4>
                <p>Product images, descriptions, and promotional content must meet NATION MARKET quality standards. Offensive, adult-only, or illegal content is strictly prohibited.</p>

                <h4>9. Compliance</h4>
                <p>You are responsible for complying with all applicable local laws, tax regulations, and business licensing requirements. NATION MARKET does not assume legal liability for vendor non-compliance.</p>

                <h4>10. Account Suspension</h4>
                <p>NATION MARKET reserves the right to suspend or permanently deactivate vendor accounts that violate these rules. Suspension decisions may be appealed through the support channel.</p>

                <h4>11. Data Privacy</h4>
                <p>Customer data accessed through your vendor account may only be used for order fulfilment purposes. Sharing, selling, or misusing customer data is a serious violation and grounds for immediate deactivation.</p>

                <h4>12. Agreement Version</h4>
                <p>This agreement is Version <strong>VM-1.0</strong>, effective from <strong>August 2026</strong>. NATION MARKET will notify vendors of any material changes to these terms.</p>
              </div>

              <div className="agree-checkbox-row">
                <label>
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={e => setTermsAccepted(e.target.checked)}
                  />
                  <span>
                    I have read and agree to the <strong>NATION MARKET Vendor Rules &amp; Agreement (VM-1.0)</strong>
                  </span>
                </label>
              </div>

              <button
                className="submit-account-btn"
                style={{ opacity: termsAccepted ? 1 : 0.45, cursor: termsAccepted ? 'pointer' : 'not-allowed', marginTop: '1rem' }}
                onClick={confirmRegistration}
                disabled={!termsAccepted || isSubmitting}
              >
                {isSubmitting ? 'Creating your account...' : 'Accept & Activate My Vendor Account'}
              </button>
              <button className="go-back-btn" onClick={() => { setStep(2); setTermsAccepted(false); }}>
                ← Go back
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .step-container { min-height: 100vh; background: #004d40; color: white; font-family: -apple-system, sans-serif; position: relative; overflow-y: auto; overflow-x: hidden; padding-bottom: 4rem; }
        .step-container::before {
          content: ''; position: fixed; top: 0; left: 0; right: 0; bottom: 0; opacity: 0.1; pointer-events: none;
          background-image: linear-gradient(60deg, #ffffff 1px, transparent 1px), linear-gradient(-60deg, #ffffff 1px, transparent 1px);
          background-size: 100px 173px; z-index: 0;
        }

        .step-header { padding: 1.5rem 2rem; display: flex; justify-content: space-between; align-items: flex-start; position: relative; z-index: 10; max-width: 1400px; margin: 0 auto; }
        .login-link { font-size: 1rem; font-weight: 500; margin-top: 1rem; }
        .login-link a { color: #80cbc4; text-decoration: none; margin-left: 0.5rem; transition: color 0.2s; font-weight: 700; }
        .login-link a:hover { color: #fff; text-decoration: underline; }

        .brand { overflow: hidden; height: 110px; display: flex; align-items: center; justify-content: flex-start; margin-left: -2rem; margin-top: -1rem; margin-bottom: -1rem; }
        .nav-logo { height: 320px; width: auto; object-fit: contain; }

        .step-content-form { position: relative; z-index: 10; padding: 1rem 2rem; max-width: 600px; margin: 0 auto; display: flex; justify-content: center; }
        
        .form-wrapper { background: white; border-radius: 20px; padding: 3rem; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.3); color: #111827; width: 100%; margin-top: -1rem; }
        .form-wrapper h1 { font-size: 1.8rem; font-weight: 900; color: #111827; margin-bottom: 2.5rem; font-style: italic; letter-spacing: 0.5px; }

        .vendor-form { display: flex; flex-direction: column; gap: 1.5rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        
        .form-group label { font-size: 0.85rem; font-weight: 700; color: #111827; }
        .form-group input, .form-group select { width: 100%; padding: 0.85rem 1rem; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.95rem; outline: none; transition: all 0.2s; }
        .form-group input:focus, .form-group select:focus { border-color: #004d40; box-shadow: 0 0 0 3px rgba(0,77,64,0.1); }
        .form-group select { cursor: pointer; appearance: none; background: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%236b7280%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E") no-repeat right 1rem center; background-size: 0.65rem auto; }

        .form-checkbox { margin: 0.5rem 0; }
        .form-checkbox label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 0.95rem; font-weight: 500; color: #111827; }
        .form-checkbox input { width: 1.1rem; height: 1.1rem; accent-color: #004d40; }
        
        .animated-fade { animation: fadeIn 0.3s ease-out; }
        
        .helper-text { font-size: 0.8rem; color: #6b7280; display: block; margin-top: 0.25rem; }
        .error-text { font-size: 0.85rem; color: #ef4444; font-weight: 500; margin-top: 0.25rem; display: block; }
        
        .phone-input { display: flex; align-items: center; gap: 0.5rem; }
        .phone-prefix-select { width: 140px !important; }
        .flex-1 { flex: 1; }

        .relative { position: relative; }
        .pw-toggle { position: absolute; right: 1rem; top: 2.2rem; background: transparent; border: none; color: #9ca3af; cursor: pointer; padding: 0; outline: none; }
        .pw-toggle:hover { color: #4b5563; }

        .terms-agreement { margin: 1rem 0; font-size: 0.95rem; color: #4b5563; line-height: 1.4; }
        .terms-agreement a { color: #2563eb; text-decoration: none; font-weight: 600; }
        .terms-agreement a:hover { text-decoration: underline; }

        .agreement-scroll-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; height: 350px; overflow-y: auto; padding: 1.5rem; text-align: left; margin: 1.5rem 0; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02); }
        .agreement-scroll-box h4 { margin: 1.5rem 0 0.5rem 0; font-size: 1.05rem; color: #111827; font-weight: 700; }
        .agreement-scroll-box h4:first-child { margin-top: 0; }
        .agreement-scroll-box p { margin: 0; font-size: 0.95rem; color: #4b5563; line-height: 1.6; }

        .agree-checkbox-row { margin-bottom: 2rem; background: #e6f4ea; padding: 1.25rem; border-radius: 12px; border: 1px solid #b7e1cd; text-align: left; }
        .agree-checkbox-row label { display: flex; align-items: flex-start; gap: 1rem; cursor: pointer; }
        .agree-checkbox-row input[type="checkbox"] { flex-shrink: 0; width: 1.25rem; height: 1.25rem; margin-top: 0.15rem; accent-color: #1b5e20; cursor: pointer; border-radius: 4px; }
        .agree-checkbox-row span { font-size: 0.95rem; color: #111827; line-height: 1.5; font-weight: 500; }

        .submit-account-btn { background: #004d40; color: white; border: none; padding: 1.1rem; border-radius: 8px; font-size: 1.05rem; font-weight: 700; cursor: pointer; transition: all 0.2s; width: 100%; margin-bottom: 0.5rem; }
        .submit-account-btn:hover { background: #00332a; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,77,64,0.15); }

        .go-back-btn { background: transparent; color: #111827; border: none; padding: 1rem; font-size: 1rem; font-weight: 700; cursor: pointer; transition: color 0.2s; width: 100%; }
        .go-back-btn:hover { color: #004d40; text-decoration: underline; }

        @media (max-width: 900px) {
          .step-header { padding: 1rem 1.5rem; flex-direction: column; gap: 0.5rem; }
          .step-content-form { padding: 0 1rem; }
          .form-wrapper { padding: 1.5rem; }
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
