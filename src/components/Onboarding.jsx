import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { KeyRound, ArrowRight, ShieldCheck, Mail, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

const Onboarding = () => {
  const { login, registerMember, triggerUpdate, preApprovedList } = useApp();
  
  // View states: 'login', 'register-init', 'register-otp', 'register-details', 'verifying-db', 'auto-approved-success', 'pending-status'
  const [view, setView] = useState('login');
  
  // Login input states
  const [loginId, setLoginId] = useState('member@rotaract.org');
  const [loginPassword, setLoginPassword] = useState('password123');
  const [loginError, setLoginError] = useState('');
  
  // Registration data states
  const [regEmail, setRegEmail] = useState('');
  const [regOtp, setRegOtp] = useState(['', '', '', '', '', '']);
  const [regName, setRegName] = useState('');
  const [regRid, setRegRid] = useState('');
  const [regCid, setRegCid] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regError, setRegError] = useState('');
  
  // Loader and auto-approval states
  const [progress, setProgress] = useState(0);
  const [verifyStatus, setVerifyStatus] = useState('Initiating validation...');
  const [isAutoApproved, setIsAutoApproved] = useState(false);
  const [registeredUser, setRegisteredUser] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      await login(loginId, loginPassword);
    } catch (err) {
      if (err.message === 'Awaiting Club Admin approval.') {
        const users = JSON.parse(localStorage.getItem('hr_users') || '[]');
        const u = users.find(x => x.email.toLowerCase() === loginId.toLowerCase() || x.id === loginId);
        if (u) {
          setRegisteredUser(u);
          setRegPassword(loginPassword); // required for auto-login later
          setView('pending-status');
        } else {
          setLoginError(err.message);
        }
      } else {
        setLoginError(err.message);
      }
    }
  };

  const handleRegisterInit = (e) => {
    e.preventDefault();
    setRegError('');
    if (!regEmail) {
      setRegError('Please provide a valid email address.');
      return;
    }
    setView('register-otp');
  };

  const handleOtpSubmit = (e) => {
    e.preventDefault();
    setRegError('');
    const code = regOtp.join('');
    if (code === '123456') {
      setView('register-details');
    } else {
      setRegError('Invalid OTP code. Try entering 123456');
    }
  };

  const handleRegisterDetailsSubmit = (e) => {
    e.preventDefault();
    setRegError('');
    if (!regName || !regPassword || !regRid) {
      setRegError('Name, RID, and Password are required.');
      return;
    }
    
    // Switch to verification loader screen
    setView('verifying-db');
    setProgress(0);
  };

  // Run the progress loader simulation when we enter 'verifying-db' state
  useEffect(() => {
    if (view !== 'verifying-db') return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          checkApprovalAndProceed();
          return 100;
        }
        
        // Update helper statuses based on progress percent
        if (prev < 30) setVerifyStatus('Hashing security protocols...');
        else if (prev < 60) setVerifyStatus('Auditing manual club directory sheets...');
        else if (prev < 90) setVerifyStatus('Checking pre-approved registration RIDs...');
        else setVerifyStatus('Syncing credentials...');
        
        return prev + 5;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [view]);

  const checkApprovalAndProceed = () => {
    // Check if the user qualifies for auto-approval
    const matched = preApprovedList.some(
      m => m.email.toLowerCase() === regEmail.toLowerCase() && 
           m.rotaractId.toLowerCase() === regRid.toLowerCase()
    );

    // Call state register service
    const user = registerMember({
      email: regEmail,
      password: regPassword,
      name: regName,
      rotaractId: regRid,
      clubId: regCid || 'CID-505',
      clubName: 'Rotaract Club of Midtown',
      parentRotary: 'Rotary Club of Midtown Metro',
      district: 'RID 3141'
    });
    setRegisteredUser(user);

    if (matched) {
      setIsAutoApproved(true);
      setView('auto-approved-success');
    } else {
      setIsAutoApproved(false);
      setView('pending-status');
    }
    triggerUpdate();
  };

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...regOtp];
    newOtp[index] = value;
    setRegOtp(newOtp);
    
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleCheckStatus = () => {
    if (registeredUser) {
      const users = JSON.parse(localStorage.getItem('hr_users') || '[]');
      const userObj = users.find(u => u.id === registeredUser.id);
      if (userObj && userObj.status === 'APPROVED') {
        login(userObj.email, regPassword);
      } else if (userObj && userObj.status === 'REJECTED') {
        alert('Your registration request was rejected.');
        setView('login');
      } else {
        alert('Status is still Pending. Switch to the Admin profile to approve yourself.');
      }
    }
  };

  return (
    <div className="onboarding-container">
      {/* View: Login */}
      {view === 'login' && (
        <div className="onboarding-card">
          <div className="onboarding-header">
            <img src="/icon.png" alt="Logo" />
            <h2>Hello Rotaract</h2>
            <p>Welcome back. Log in to your profile.</p>
          </div>
          
          <form className="onboarding-form" onSubmit={handleLogin}>
            {loginError && <div style={{ color: 'var(--error-color)', fontSize: '13px', marginBottom: '8px' }}>{loginError}</div>}
            
            <div className="form-group">
              <label htmlFor="login-id">EMAIL OR ROTARACT ID (RID)</label>
              <input 
                id="login-id" 
                type="text" 
                className="form-input" 
                placeholder="RID-7703 or email" 
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="login-pass">PASSWORD</label>
              <input 
                id="login-pass" 
                type="password" 
                className="form-input" 
                placeholder="••••••••" 
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
            </div>
            
            <button type="submit" className="btn-primary" style={{ marginTop: '16px' }}>
              <span>Log In</span>
              <ArrowRight size={16} />
            </button>
            
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={() => setView('register-init')}
              style={{ marginTop: '8px' }}
            >
              Don't have an account? Sign Up
            </button>
          </form>
          
          <div style={{ marginTop: '20px', padding: '12px', background: 'var(--bg-primary)', borderRadius: '12px', fontSize: '11px', color: 'var(--text-secondary)' }}>
            <p style={{ fontWeight: '600', marginBottom: '4px' }}>Demo accounts password: password123 suffix</p>
            <p>Admin: admin@rotaract.org (pass: admin123)</p>
            <p>Treasurer: treasurer@rotaract.org (pass: treasurer123)</p>
            <p>Member (Pre-approved): member@rotaract.org (pass: member123)</p>
          </div>
        </div>
      )}

      {/* View: Register Initiate (Hello Rotarian - Email Verification) */}
      {view === 'register-init' && (
        <div className="onboarding-card">
          <div className="onboarding-header">
            <h2>Hello Rotarian</h2>
            <p>Enter your email address to receive OTP verification.</p>
          </div>
          
          <form className="onboarding-form" onSubmit={handleRegisterInit}>
            {regError && <div style={{ color: 'var(--error-color)', fontSize: '13px', marginBottom: '8px' }}>{regError}</div>}
            
            <div className="form-group">
              <label>EMAIL ADDRESS</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-secondary)' }} />
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="name@rotaract.org" 
                  style={{ paddingLeft: '48px', width: '100%' }}
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <button type="submit" className="btn-primary" style={{ marginTop: '16px' }}>
              <span>Send OTP Verification</span>
              <ArrowRight size={16} />
            </button>
            
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={() => setView('login')}
              style={{ marginTop: '8px' }}
            >
              Back to Login
            </button>
          </form>
        </div>
      )}

      {/* View: OTP Verification */}
      {view === 'register-otp' && (
        <div className="onboarding-card">
          <div className="onboarding-header">
            <h2>Verify Email</h2>
            <p>Enter the 6-digit code sent to {regEmail}.</p>
          </div>
          
          <form className="onboarding-form" onSubmit={handleOtpSubmit}>
            {regError && <div style={{ color: 'var(--error-color)', fontSize: '13px', marginBottom: '8px' }}>{regError}</div>}
            
            <div className="otp-box-container">
              {regOtp.map((digit, i) => (
                <input 
                  key={i}
                  id={`otp-${i}`}
                  type="text"
                  maxLength="1"
                  className="otp-box"
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !digit && i > 0) {
                      const prevInput = document.getElementById(`otp-${i - 1}`);
                      if (prevInput) prevInput.focus();
                    }
                  }}
                  required
                />
              ))}
            </div>
            
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '16px' }}>
              Tip: Enter code **123456** to proceed.
            </p>
            
            <button type="submit" className="btn-primary">
              <span>Verify Email Address</span>
            </button>
            
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={() => setView('register-init')}
              style={{ marginTop: '8px' }}
            >
              Back
            </button>
          </form>
        </div>
      )}

      {/* View: Register Details (Howdy I am) */}
      {view === 'register-details' && (
        <div className="onboarding-card" style={{ maxWidth: '500px' }}>
          <div className="onboarding-header">
            <h2>Howdy, I am</h2>
            <p>Enter details. Note: auto-approval works if Email & RID match pre-approved club records.</p>
          </div>
          
          <form className="onboarding-form" onSubmit={handleRegisterDetailsSubmit}>
            {regError && <div style={{ color: 'var(--error-color)', fontSize: '13px', marginBottom: '8px' }}>{regError}</div>}
            
            <div className="form-group">
              <label>FULL NAME</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Riya Sharma" 
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                required
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>ROTARACT ID (RID) *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. RID-7703" 
                  value={regRid}
                  onChange={(e) => setRegRid(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>CLUB ID (CID)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="CID-505" 
                  value={regCid}
                  onChange={(e) => setRegCid(e.target.value)}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>CREATE PASSWORD</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="••••••••" 
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                required
              />
            </div>

            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', background: 'var(--bg-primary)', padding: '10px', borderRadius: '8px' }}>
              <p>💡 **Auto-approval demo RIDs**: Set RID to **RID-7703** or **RID-1102** and email matching their records to test auto approvals!</p>
            </div>
            
            <button type="submit" className="btn-primary" style={{ marginTop: '8px' }}>
              <span>Submit Registration</span>
              <ArrowRight size={16} />
            </button>
          </form>
        </div>
      )}

      {/* View: Verifying DB Loader */}
      {view === 'verifying-db' && (
        <div className="onboarding-card">
          <div className="onboarding-header">
            <h2>Auto Verification</h2>
            <p>Matching details against pre-authorized club database sheet...</p>
          </div>
          
          <div style={{ margin: '40px 0' }}>
            <div style={{ width: '100%', height: '8px', background: 'var(--border-color)', borderRadius: '99px', overflow: 'hidden', marginBottom: '16px' }}>
              <div 
                style={{ 
                  height: '100%', 
                  width: `${progress}%`, 
                  background: 'var(--accent-color)', 
                  borderRadius: '99px',
                  transition: 'width 0.1s linear'
                }}
              />
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>
              {verifyStatus} ({progress}%)
            </div>
          </div>
        </div>
      )}

      {/* View: Auto Approved Success */}
      {view === 'auto-approved-success' && (
        <div className="onboarding-card">
          <div className="onboarding-header">
            <CheckCircle size={64} style={{ color: 'var(--success-color)', marginBottom: '20px' }} />
            <h2>Verification Successful!</h2>
            <p>Your credentials matched our club records database.</p>
          </div>
          
          <div style={{ background: 'var(--bg-primary)', padding: '20px', borderRadius: '16px', textAlign: 'left', marginBottom: '24px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Status:</p>
            <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--success-color)' }}>Approved Automatically</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Logged in as active club member. Dues record synchronized.
            </p>
          </div>
          
          <button 
            onClick={() => login(regEmail, regPassword)} 
            className="btn-primary"
            style={{ width: '100%' }}
          >
            <span>Proceed to Dashboard</span>
            <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* View: Manual Pending Status Screen (Fallback) */}
      {view === 'pending-status' && (
        <div className="onboarding-card">
          <div className="onboarding-header">
            <AlertCircle size={64} style={{ color: 'var(--warning-color)', marginBottom: '20px' }} />
            <h2>Auto Verification Failed</h2>
            <p>Your details could not be matched automatically. Awaiting administrator approval.</p>
          </div>
          
          <div style={{ background: 'var(--bg-primary)', padding: '20px', borderRadius: '16px', textAlign: 'left', marginBottom: '24px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Registered Name:</p>
            <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px' }}>{regName}</h4>
            
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Status:</p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 149, 0, 0.1)', color: 'var(--warning-color)', padding: '4px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: '700', marginTop: '4px' }}>
              Pending Manual Verification
            </div>
          </div>
          
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            <p>ℹ️ **Demo Step**: Go to top-right settings (Profile page), switch persona to **Admin**, go to **Admin** tab, approve **{regName}**, then check status below.</p>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button onClick={handleCheckStatus} className="btn-primary">
              <RefreshCw size={16} />
              <span>Check Approval Status</span>
            </button>
            
            <button onClick={() => setView('login')} className="btn-secondary">
              Back to Login Screen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Onboarding;
