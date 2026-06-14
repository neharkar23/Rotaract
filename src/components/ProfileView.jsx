import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { paymentService } from '../data/mockDb';
import { Upload, CheckCircle2, Sun, Moon, Shield, MapPin, Activity, Info, Edit3, Mail, LogOut, Calendar, Droplet, Phone, Heart, Award, Star, Tag, User } from 'lucide-react';
import InitialsAvatar from './InitialsAvatar';

const ProfileView = () => {
  const { 
    currentUser,
    currentProfile, 
    payments, 
    myAttendance,
    events,
    triggerUpdate, 
    accentColor, 
    changeAccent, 
    theme, 
    toggleTheme,
    profiles,
    activeRole,
    swapRole,
    updateProfile
  } = useApp();

  const [screenshot, setScreenshot] = useState('');
  const [upiRef, setUpiRef] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);

  // Calculate Attendance dynamically
  const pastEvents = events.filter(e => new Date(e.startTime) < new Date());
  const attendedCount = myAttendance ? myAttendance.length : 0;
  const totalPastEvents = pastEvents.length;
  const attendancePercentage = totalPastEvents > 0 ? Math.round((attendedCount / totalPastEvents) * 100) : 0;
  
  const ringRadius = 26;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (attendancePercentage / 100) * ringCircumference;

  // Using actual data if available, otherwise fallbacks
  const [editData, setEditData] = useState({ 
    name: currentProfile.name || '',
    phone: currentUser?.phone || '+91 98765 43210', 
    email: currentUser?.email || 'user@example.com', 
    avatarUrl: currentProfile.avatarUrl || '' 
  });

  // Find dues for current profile
  const dues = payments.find(p => p.profileId === currentProfile.id) || {
    amountDue: 1500,
    status: 'UNPAID',
    remarks: ''
  };

  const handleScreenshotChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshot(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshot(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!screenshot || !upiRef) {
      alert("Please provide both UPI Reference and Screenshot.");
      return;
    }
    
    setLoading(true);
    try {
      await paymentService.submitPaymentProof(currentProfile.id, upiRef, screenshot);
      setUploadMessage('Receipt uploaded! Awaiting Treasurer verification.');
      setUpiRef('');
      setScreenshot('');
      triggerUpdate();
    } catch(err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    updateProfile(currentProfile.id, currentUser.id, editData);
    setShowEditModal(false);
  };

  const accentsList = [
    { color: '#d91c5c', name: 'Cranberry' },
    { color: '#007aff', name: 'Blue' },
    { color: '#34c759', name: 'Green' },
    { color: '#af52de', name: 'Purple' },
    { color: '#ff9500', name: 'Orange' },
    { color: '#a2a2a2', name: 'Silver' }
  ];

  const verifierName = dues.verifiedBy 
    ? profiles.find(p => p.id === dues.verifiedBy)?.name || 'Treasurer'
    : 'Treasurer';

  return (
    <div className="view-container fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-0.03em' }}>My Profile</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Manage credentials and check club subscriptions</p>
      </div>

      {/* Profile Avatar Card */}
      <div className="dashboard-card profile-card-large liquid-glass-card" style={{ marginBottom: '24px', position: 'relative' }}>
        <button 
          className="btn-secondary" 
          style={{ position: 'absolute', top: '24px', right: '24px', padding: '6px 12px', fontSize: '12px' }}
          onClick={() => setShowEditModal(true)}
        >
          <Edit3 size={14} /> Edit
        </button>
        <InitialsAvatar name={currentProfile.name} size={80} style={{ marginBottom: '16px' }} />
        <div className="profile-details">
          <h3>{currentProfile.name}</h3>
          <p style={{ fontWeight: '600', color: 'var(--accent-color)', fontSize: '14px' }}>{currentProfile.rotaractId}</p>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Club: {currentProfile.clubName} ({currentProfile.clubId})
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Rotary Parent: {currentProfile.parentRotary} • {currentProfile.district}
          </p>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="dashboard-grid">
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="dashboard-card liquid-glass-card">
            <h3>Personal Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '20px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(var(--accent-rgb), 0.1)' }}>
                  <Droplet size={16} style={{ color: 'var(--accent-color)' }} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Blood Group</div>
                  <div style={{ fontSize: '14px', fontWeight: '500', marginTop: '2px' }}>O+ Positive</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(var(--accent-rgb), 0.1)' }}>
                  <Calendar size={16} style={{ color: 'var(--accent-color)' }} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Date of Birth</div>
                  <div style={{ fontSize: '14px', fontWeight: '500', marginTop: '2px' }}>15 Aug 1998</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(var(--accent-rgb), 0.1)' }}>
                  <Phone size={16} style={{ color: 'var(--accent-color)' }} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Phone</div>
                  <div style={{ fontSize: '14px', fontWeight: '500', marginTop: '2px' }}>{editData.phone}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(var(--accent-rgb), 0.1)' }}>
                  <Mail size={16} style={{ color: 'var(--accent-color)' }} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Email</div>
                  <div style={{ fontSize: '14px', fontWeight: '500', marginTop: '2px', wordBreak: 'break-all' }}>{editData.email}</div>
                </div>
              </div>
            </div>
            
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px dashed var(--border-color)' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(255, 59, 48, 0.1)' }}>
                  <Heart size={16} style={{ color: 'var(--error-color)' }} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Emergency Contact</div>
                  <div style={{ fontSize: '14px', fontWeight: '500', marginTop: '2px' }}>Rahul (Brother)</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>+91 98765 12345</div>
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-card liquid-glass-card">
            <h3>Club Information</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0 16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(var(--accent-rgb), 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Info size={20} style={{ color: 'var(--accent-color)' }} />
              </div>
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '600' }}>{currentProfile.clubName}</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>ID: {currentProfile.clubId}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '16px 0' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(var(--accent-rgb), 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MapPin size={20} style={{ color: 'var(--accent-color)' }} />
              </div>
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '600' }}>Rotary Parent</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{currentProfile.parentRotary}</p>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '16px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase' }}>Board of Directors</h4>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <InitialsAvatar name="Ananya Singh" size={32} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Rtr. Ananya Singh</div>
                    <div style={{ fontSize: '11px', color: 'var(--accent-color)', fontWeight: '600' }}>President</div>
                  </div>
                </div>
                <a href="mailto:president@example.com" className="btn-secondary" style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '99px', textDecoration: 'none' }}>
                  Contact
                </a>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <InitialsAvatar name="Rahul Dev" size={32} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Rtr. Rahul Dev</div>
                    <div style={{ fontSize: '11px', color: 'var(--accent-color)', fontWeight: '600' }}>Secretary</div>
                  </div>
                </div>
                <a href="mailto:secretary@example.com" className="btn-secondary" style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '99px', textDecoration: 'none' }}>
                  Contact
                </a>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <InitialsAvatar name="Priya Patel" size={32} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Rtr. Priya Patel</div>
                    <div style={{ fontSize: '11px', color: 'var(--accent-color)', fontWeight: '600' }}>Vice President</div>
                  </div>
                </div>
                <a href="mailto:vp@example.com" className="btn-secondary" style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '99px', textDecoration: 'none' }}>
                  Contact
                </a>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <InitialsAvatar name="Vikram Sharma" size={32} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Rtr. Vikram Sharma</div>
                    <div style={{ fontSize: '11px', color: 'var(--accent-color)', fontWeight: '600' }}>Treasurer</div>
                  </div>
                </div>
                <a href="mailto:treasurer@example.com" className="btn-secondary" style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '99px', textDecoration: 'none' }}>
                  Contact
                </a>
              </div>
            </div>
          </div>

          <div className="dashboard-card">
            <h3>Attendance Record</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '20px' }}>
              <div style={{ position: 'relative', width: '60px', height: '60px' }}>
                <svg width="60" height="60" viewBox="0 0 60 60">
                  <circle cx="30" cy="30" r="26" fill="none" stroke="var(--border-color)" strokeWidth="6" />
                  <circle cx="30" cy="30" r="26" fill="none" stroke="var(--accent-color)" strokeWidth="6" strokeDasharray={ringCircumference} strokeDashoffset={ringOffset} strokeLinecap="round" transform="rotate(-90 30 30)" />
                </svg>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700' }}>
                  {attendancePercentage}%
                </div>
              </div>
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '600' }}>Events Attended</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>You've attended {attendedCount} out of {totalPastEvents} recent events.</p>
              </div>
            </div>
          </div>

          <div className="dashboard-card">
            <h3>Attendance History</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              {myAttendance && myAttendance.length > 0 ? (
                myAttendance.map(att => {
                  const ev = events.find(e => e.id === (att.eventId || att.event_id));
                  return (
                    <div key={att.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(52, 199, 89, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success-color)' }}>
                          <CheckCircle2 size={16} />
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{ev ? ev.title : 'Unknown Event'}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{ev ? new Date(ev.startTime).toLocaleDateString() : 'Unknown Date'}</div>
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '99px', background: 'var(--success-color)', color: 'white', fontWeight: '600' }}>Verified</span>
                    </div>
                  );
                })
              ) : (
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', padding: '16px 0' }}>No attendance records found.</p>
              )}
            </div>
          </div>
          
          <div className="dashboard-card">
            <h3>Skills & Interests</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px' }}>
              {['Public Speaking', 'Event Management', 'Photography', 'Social Media', 'Fundraising', 'Design'].map((skill, i) => (
                <span key={i} style={{ 
                  padding: '6px 12px', 
                  borderRadius: '99px', 
                  fontSize: '12px', 
                  fontWeight: '500', 
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Tag size={12} style={{ color: 'var(--text-secondary)' }} />
                  {skill}
                </span>
              ))}
            </div>
          </div>
          
          <div className="dashboard-card" style={{ border: '1px dashed var(--accent-color)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={18} style={{ color: 'var(--accent-color)' }} />
              <span>Developer Sandbox</span>
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Switch profile personas instantly for testing this walkthrough.
            </p>
            
            <div className="tab-bar-container" style={{ margin: '8px 0 0' }}>
              <div 
                className={`tab-bar-item ${activeRole === 'MEMBER' ? 'active' : ''}`} 
                onClick={() => swapRole('MEMBER')}
              >
                <span>Normal User</span>
              </div>
              <div 
                className={`tab-bar-item ${activeRole === 'TREASURER' ? 'active' : ''}`} 
                onClick={() => swapRole('TREASURER')}
              >
                <span>Treasurer</span>
              </div>
              <div 
                className={`tab-bar-item ${activeRole === 'ADMIN' ? 'active' : ''}`} 
                onClick={() => swapRole('ADMIN')}
              >
                <span>Admin</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="dashboard-card">
            <h3>Achievements & Badges</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '12px', borderRadius: '12px', background: 'rgba(255, 149, 0, 0.05)', border: '1px solid rgba(255, 149, 0, 0.2)' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #FFD700, #FFA500)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 10px rgba(255, 165, 0, 0.3)' }}>
                  <Star size={24} fill="currentColor" />
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>Star Rotaractor</h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Awarded for maximum event participation in Q1 2026</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '12px', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #8E2DE2, #4A00E0)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                  <Award size={24} />
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>Fundraising Champion</h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Raised over ₹10,000 for blood donation camp</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '12px', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #11998e, #38ef7d)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                  <User size={24} />
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>Early Bird</h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Joined the club in its founding year</p>
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-card">
            <h3>Club Membership Dues</h3>
            
            <div className="dues-card-modern">
              <div className="dues-header">
                <h4>Annual Subscription</h4>
                <span className="badge" style={{
                  background: dues.status === 'PAID' ? 'rgba(52, 199, 89, 0.1)' : dues.status === 'PENDING_VERIFICATION' ? 'rgba(255, 149, 0, 0.1)' : 'rgba(255, 59, 48, 0.1)',
                  color: dues.status === 'PAID' ? 'var(--success-color)' : dues.status === 'PENDING_VERIFICATION' ? 'var(--warning-color)' : 'var(--error-color)'
                }}>
                  {dues.status === 'PAID' ? 'Fully Paid' : dues.status === 'PENDING_VERIFICATION' ? 'Pending Approval' : 'Dues Outstanding'}
                </span>
              </div>
              
              <div className="dues-amount">
                {dues.status === 'PAID' ? '₹0' : '₹1500'}
              </div>
              
              {dues.status === 'UNPAID' && (
                <div className="dues-action">
                  <button 
                    className="pay-btn"
                    onClick={() => {
                      const upiUrl = 'upi://pay?pa=midtownrotaract@okaxis&pn=RotaractMidtown&am=1500&cu=INR';
                      window.open(upiUrl, '_self');
                      setTimeout(() => {
                        alert('UPI payment initiated: transfer ₹1500 to midtownrotaract@okaxis, copy transaction ref, and upload screenshot below.');
                      }, 400);
                    }}
                  >
                    Pay Dues via UPI
                  </button>
                </div>
              )}
            </div>

            {dues.status === 'UNPAID' && (
              <form className="upload-section-modern" onSubmit={handlePaymentSubmit} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
                <h5>Submit Payment Proof Screenshot</h5>
                
                {uploadMessage && <div style={{ color: 'var(--success-color)', fontSize: '13px', marginBottom: '16px' }}>{uploadMessage}</div>}
                
                <div>
                  <label>UPI Transaction Reference ID *</label>
                  <input 
                    type="text" 
                    className="input-modern" 
                    placeholder="UPI-9876543210 or reference ID" 
                    value={upiRef}
                    onChange={(e) => setUpiRef(e.target.value)}
                    required 
                  />
                </div>

                <div>
                  <label>Payment Screenshot / Receipt</label>
                  <div 
                    className="upload-area"
                    style={{ border: '2px dashed var(--border-color)', borderRadius: '12px', padding: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                    onClick={() => document.getElementById('screenshot-file').click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                  >
                    {screenshot ? (
                      <img src={screenshot} alt="Screenshot Preview" className="preview-img" style={{ margin: 0 }} />
                    ) : (
                      <>
                        <Upload size={32} style={{ color: 'var(--text-secondary)' }} />
                        <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Click or drop to upload payment screenshot</span>
                      </>
                    )}
                    <input 
                      id="screenshot-file" 
                      type="file" 
                      accept="image/*" 
                      style={{ display: 'none' }} 
                      onChange={handleScreenshotChange}
                    />
                  </div>
                </div>

                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? 'Submitting proof...' : 'Send Verification Request'}
                </button>
              </form>
            )}

            {dues.status === 'PENDING_VERIFICATION' && (
              <div style={{ background: 'var(--bg-primary)', padding: '20px', borderRadius: '16px', marginTop: '16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <CheckCircle2 size={20} style={{ color: 'var(--warning-color)', flexShrink: '0' }} />
                <div>
                  <h5 style={{ fontSize: '14px', fontWeight: '600' }}>Proof Uploaded - Awaiting Validation</h5>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Ref ID: {dues.upiTransactionRef}. The Club Treasurer is currently validating your screenshot.
                  </p>
                </div>
              </div>
            )}

            {dues.status === 'PAID' && (
              <div style={{ background: 'var(--bg-primary)', padding: '20px', borderRadius: '16px', marginTop: '16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <CheckCircle2 size={20} style={{ color: 'var(--success-color)', flexShrink: '0' }} />
                <div>
                  <h5 style={{ fontSize: '14px', fontWeight: '600' }}>Verification Confirmed</h5>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Verified by **{verifierName}** on {dues.verifiedAt ? new Date(dues.verifiedAt).toLocaleDateString() : 'Auto System'}.
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                    Remarks: "{dues.remarks}"
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="dashboard-card">
            <h3>App Customization</h3>
            
            <div className="settings-section">
              <div className="settings-row">
                <div>
                  <h4>Accent Highlight</h4>
                  <p style={{ marginTop: '2px' }}>Choose brand highlight color</p>
                </div>
                <div className="color-circles">
                  {accentsList.map(item => (
                    <div 
                      key={item.color}
                      className={`color-circle ${accentColor === item.color ? 'active' : ''}`}
                      style={{ backgroundColor: item.color }}
                      onClick={() => changeAccent(item.color)}
                      title={item.name}
                    />
                  ))}
                </div>
              </div>

              <div className="settings-row">
                <div>
                  <h4>Theme Mode</h4>
                  <p style={{ marginTop: '2px' }}>Switch between Light and Dark interface</p>
                </div>
                <div style={{ display: 'flex', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', padding: '4px', borderRadius: '99px', gap: '4px' }}>
                  <button 
                    onClick={() => toggleTheme('light')}
                    style={{ background: theme === 'light' ? 'var(--bg-secondary)' : 'none', padding: '6px 12px', borderRadius: '99px', display: 'flex', alignItems: 'center', cursor: 'pointer', border: 'none' }}
                  >
                    <Sun size={14} style={{ color: theme === 'light' ? 'var(--warning-color)' : 'var(--text-secondary)' }} />
                  </button>
                  <button 
                    onClick={() => toggleTheme('dark')}
                    style={{ background: theme === 'dark' ? 'var(--bg-secondary)' : 'none', padding: '6px 12px', borderRadius: '99px', display: 'flex', alignItems: 'center', cursor: 'pointer', border: 'none' }}
                  >
                    <Moon size={14} style={{ color: theme === 'dark' ? 'var(--accent-color)' : 'var(--text-secondary)' }} />
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <div className="mobile-only" style={{ marginTop: '32px', textAlign: 'center', paddingBottom: '24px' }}>
        <button 
          className="btn-secondary" 
          style={{ padding: '12px 24px', color: 'var(--error-color)', borderColor: 'rgba(255,59,48,0.2)', background: 'rgba(255,59,48,0.05)', borderRadius: '99px', fontSize: '15px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          onClick={() => {
            alert('Logging out...');
          }}
        >
          <LogOut size={18} />
          Log Out
        </button>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content liquid-glass-card slide-up" onClick={e => e.stopPropagation()}>
            <div className="modal-close-btn" onClick={() => setShowEditModal(false)}>✕</div>
            <h3 style={{ marginBottom: '16px', fontSize: '20px', fontWeight: '800' }}>Edit Personal Info</h3>
            
            <form onSubmit={handleEditSubmit} className="onboarding-form">
              <div className="form-group" style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                   <InitialsAvatar name={editData.name || currentProfile.name} size={80} style={{ margin: '0 auto' }} avatarUrl={editData.avatarUrl} />
                   <div 
                     style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--accent-color)', borderRadius: '50%', padding: '6px', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }} 
                     onClick={() => document.getElementById('avatar-upload').click()}
                   >
                     <Edit3 size={12} color="white" />
                   </div>
                   <input type="file" id="avatar-upload" accept="image/*" style={{display: 'none'}} onChange={(e) => {
                     const file = e.target.files[0];
                     if (file) {
                       const reader = new FileReader();
                       reader.onloadend = () => setEditData({...editData, avatarUrl: reader.result});
                       reader.readAsDataURL(file);
                     }
                   }} />
                </div>
              </div>
              <div className="form-group">
                <label>FULL NAME</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={editData.name} 
                  onChange={e => setEditData({...editData, name: e.target.value})}
                  placeholder="Enter your name"
                  required
                />
              </div>
              <div className="form-group">
                <label>PHONE NUMBER</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={editData.phone} 
                  onChange={e => setEditData({...editData, phone: e.target.value})}
                  placeholder="Enter phone"
                  required
                />
              </div>
              <div className="form-group">
                <label>EMAIL ADDRESS</label>
                <input 
                  type="email" 
                  className="form-input"
                  value={editData.email} 
                  onChange={e => setEditData({...editData, email: e.target.value})}
                  placeholder="Enter email"
                  required
                />
              </div>
              
              <button type="submit" className="btn-primary" style={{ marginTop: '24px', width: '100%' }}>Save Changes</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileView;
