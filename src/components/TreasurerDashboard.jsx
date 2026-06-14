import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { paymentService } from '../data/mockDb';
import { Check, X, ShieldAlert, AlertCircle, FileText, CheckCircle2, XCircle, Users, Bell } from 'lucide-react';
import InitialsAvatar from './InitialsAvatar';

const TreasurerDashboard = () => {
  const { currentProfile, triggerUpdate, profiles, payments } = useApp();
  
  // Section toggle: 'validations' vs 'directory'
  const [section, setSection] = useState('validations');
  const [rejectId, setRejectId] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Get pending payment validations
  const pendingRequests = payments || [];

  const handleApprove = async (paymentId) => {
    if (window.confirm('Approve this membership payment? This will update their dues status to PAID.')) {
      try {
        await paymentService.verifyPayment(paymentId, true);
        showToast('Payment approved. The member has been notified.');
        triggerUpdate();
      } catch(err) { alert(err.message); }
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!remarks) {
      alert('Please provide rejection remarks.');
      return;
    }
    try {
      await paymentService.verifyPayment(rejectId, false, remarks);
      setRejectId(null);
      setRemarks('');
      showToast('Payment rejected. The member has been notified to re-upload.');
      triggerUpdate();
    } catch(err) { alert(err.message); }
  };

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-0.03em' }}>Treasury Dashboard</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Verify manual subscriptions payments and manage club directory dues statuses</p>
      </div>

      <div className="dashboard-card" style={{ marginBottom: '24px' }}>
        <h3>Quick Actions</h3>
        <div className="quick-links-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
          <div className="quick-link-button" onClick={() => showToast('Dues reminders have been sent to all unpaid members.')}>
            <Bell size={20} style={{ color: 'var(--accent-color)' }} />
            <span>Send Reminders to All</span>
          </div>
        </div>
      </div>

      {/* Roster tab bar */}
      <div className="tab-bar-container" style={{ maxWidth: '400px', marginBottom: '24px' }}>
        <div 
          className={`tab-bar-item ${section === 'validations' ? 'active' : ''}`}
          onClick={() => setSection('validations')}
        >
          <FileText size={16} />
          <span>Payment Approvals</span>
        </div>
        <div 
          className={`tab-bar-item ${section === 'directory' ? 'active' : ''}`}
          onClick={() => setSection('directory')}
        >
          <Users size={16} />
          <span>Members Directory</span>
        </div>
      </div>

      {/* SECTION 1: Payment screenshot auditing */}
      {section === 'validations' && (
        <div className="dashboard-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={20} style={{ color: 'var(--accent-color)' }} />
            <span>Pending Validations ({pendingRequests.length})</span>
          </h3>
          
          {pendingRequests.length > 0 ? (
            <div className="approval-list" style={{ marginTop: '20px' }}>
              {pendingRequests.map(req => {
                const paymentObj = req.payment || req;
                const profileObj = req.profile || {};
                const screenshotUrl = paymentObj.receipt_screenshot_url || paymentObj.receiptScreenshotUrl;
                const upiRef = paymentObj.upi_transaction_ref || paymentObj.upiTransactionRef;
                
                return (
                <div key={paymentObj.id} className="approval-card">
                  {screenshotUrl ? (
                    <img 
                      src={screenshotUrl} 
                      alt="Receipt Screenshot" 
                      className="approval-image"
                      onClick={() => setSelectedImage(screenshotUrl)}
                      title="Click to zoom screenshot"
                    />
                  ) : (
                    <div className="approval-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
                      <AlertCircle size={24} style={{ color: 'var(--text-secondary)' }} />
                    </div>
                  )}

                  <div className="approval-info">
                    <div>
                      <h4 style={{ fontSize: '16px', fontWeight: '700' }}>{profileObj.name || 'Unknown Member'}</h4>
                      <span style={{ fontSize: '11px', color: 'var(--accent-color)', fontWeight: '600', textTransform: 'uppercase' }}>
                        {profileObj.rotaract_id || profileObj.rotaractId} • {profileObj.club_name || profileObj.clubName}
                      </span>
                      
                      <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: '10px', marginTop: '12px', border: '1px solid var(--border-color)' }}>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>UPI Reference ID:</p>
                        <code style={{ fontSize: '13px', fontWeight: '700', wordBreak: 'break-all', display: 'block', marginTop: '2px' }}>
                          {upiRef || 'N/A'}
                        </code>
                      </div>
                    </div>

                    {rejectId === paymentObj.id ? (
                      <form onSubmit={handleRejectSubmit} style={{ marginTop: '12px' }}>
                        <div className="form-group">
                          <label>REJECTION REASON</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="e.g. Blurry receipt or wrong amount" 
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            required
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                          <button type="submit" className="btn-primary" style={{ padding: '8px 16px', fontSize: '12px' }}>
                            Confirm Reject
                          </button>
                          <button type="button" className="btn-secondary" style={{ padding: '8px 16px', fontSize: '12px', border: '1px solid var(--border-color)' }} onClick={() => setRejectId(null)}>
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="approval-actions" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button 
                          className="btn-primary" 
                          onClick={() => handleApprove(paymentObj.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', fontSize: '13px' }}
                        >
                          <Check size={16} />
                          <span>Verify & Approve</span>
                        </button>
                        
                        <button 
                          className="btn-secondary" 
                          onClick={() => setRejectId(paymentObj.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid var(--error-color)', color: 'var(--error-color)', padding: '10px 16px', fontSize: '13px' }}
                        >
                          <X size={16} />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                );
              })}
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px 0', fontSize: '14px' }}>
              No payments pending verification. All member accounts are fully audited.
            </p>
          )}
        </div>
      )}

      {/* SECTION 2: Members Directory Status Sheet */}
      {section === 'directory' && (
        <div className="dashboard-card">
          <h3>Club Active Members Directory</h3>
          
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '12px 8px', fontWeight: '600' }}>MEMBER NAME</th>
                  <th style={{ padding: '12px 8px', fontWeight: '600' }}>ROTARACT ID</th>
                  <th style={{ padding: '12px 8px', fontWeight: '600', textAlign: 'center' }}>PAYMENT STATUS</th>
                  <th style={{ padding: '12px 8px', fontWeight: '600', textAlign: 'right' }}>OUTSTANDING</th>
                  <th style={{ padding: '12px 8px', fontWeight: '600', textAlign: 'center' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map(p => {
                  // Find matching dues record
                  const dueRecord = payments.find(pay => {
                    const paymentObj = pay.payment || pay;
                    return paymentObj.profile_id === p.id || paymentObj.profileId === p.id;
                  }) || {
                    amountDue: 1500,
                    status: 'UNPAID'
                  };
                  
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '16px 8px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <InitialsAvatar name={p.name} size={28} />
                        <span>{p.name}</span>
                      </td>
                      <td style={{ padding: '16px 8px', color: 'var(--text-secondary)' }}>{p.rotaractId}</td>
                      <td style={{ padding: '16px 8px', textAlign: 'center' }}>
                        <span 
                          style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '4px',
                            fontSize: '11px',
                            fontWeight: '700',
                            padding: '3px 10px',
                            borderRadius: '99px',
                            background: dueRecord.status === 'PAID' ? 'rgba(52, 199, 89, 0.1)' : dueRecord.status === 'PENDING_VERIFICATION' ? 'rgba(255, 149, 0, 0.1)' : 'rgba(255, 59, 48, 0.1)',
                            color: dueRecord.status === 'PAID' ? 'var(--success-color)' : dueRecord.status === 'PENDING_VERIFICATION' ? 'var(--warning-color)' : 'var(--error-color)'
                          }}
                        >
                          {dueRecord.status === 'PAID' ? (
                            <><CheckCircle2 size={12} /> Paid</>
                          ) : dueRecord.status === 'PENDING_VERIFICATION' ? (
                            <><AlertCircle size={12} /> Pending</>
                          ) : (
                            <><XCircle size={12} /> Unpaid</>
                          )}
                        </span>
                      </td>
                      <td style={{ padding: '16px 8px', textAlign: 'right', fontWeight: '700', color: dueRecord.status === 'PAID' ? 'var(--text-secondary)' : 'var(--error-color)' }}>
                        ₹{dueRecord.amountDue}
                      </td>
                      <td style={{ padding: '16px 8px', textAlign: 'center' }}>
                        <button 
                          className="btn-secondary" 
                          style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '8px' }}
                          onClick={() => showToast(`Reminder sent to ${p.name}`)}
                        >
                          Send Reminder
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Zoom screenshot overlay */}
      {selectedImage && (
        <div className="modal-overlay" onClick={() => setSelectedImage(null)} style={{ background: 'rgba(0,0,0,0.85)' }}>
          <div style={{ maxWidth: '90%', maxHeight: '90%', position: 'relative' }}>
            <div className="modal-close-btn" style={{ top: '-40px', right: '0', background: 'white', color: 'black' }} onClick={() => setSelectedImage(null)}>✕</div>
            <img src={selectedImage} alt="Receipt" style={{ width: '100%', height: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: '8px' }} />
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div style={{ position: 'fixed', bottom: '100px', left: '50%', transform: 'translateX(-50%)', background: 'var(--text-primary)', color: 'var(--bg-primary)', padding: '12px 24px', borderRadius: '99px', fontSize: '14px', fontWeight: '600', boxShadow: 'var(--shadow-lg)', zIndex: 9999, transition: 'var(--transition-spring)' }}>
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default TreasurerDashboard;
