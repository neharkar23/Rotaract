import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { eventService, noticeService, taskService } from '../data/mockDb.js';
import { ShieldAlert, UserCheck, CalendarCheck, Check, X, Send, ClipboardList, BarChart2 } from 'lucide-react';
import InitialsAvatar from './InitialsAvatar';

const AdminDashboard = () => {
  const { currentProfile, profiles, events, attendance, pendingAttendance, tasks, triggerUpdate, getPendingApprovals, approveUser } = useApp();
  
  const [pendingUsers, setPendingUsers] = useState([]);
  
  // Tab/section selection state
  const [adminSection, setAdminSection] = useState('attendance');
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id || '');
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (adminSection === 'approvals') {
      const fetchApprovals = async () => {
        const data = await getPendingApprovals();
        setPendingUsers(data || []);
      };
      fetchApprovals();
    }
  }, [adminSection, getPendingApprovals]);

  const handleApprove = async (userId, action) => {
    await approveUser(userId, action);
    const data = await getPendingApprovals();
    setPendingUsers(data || []);
    triggerUpdate();
  };
  
  // Modal states
  const [noticeModal, setNoticeModal] = useState({ show: false, user: null, title: '', message: '' });
  const [taskModal, setTaskModal] = useState({ show: false, user: null, title: '', description: '', dueDate: '' });
  const [performanceModal, setPerformanceModal] = useState({ show: false, user: null, stats: null });

  const handleViewPerformance = (user) => {
    // Both profileId and profile_id just to be safe depending on casing returned
    const eventsAttended = attendance.filter(a => a.profile_id === user.id || a.profileId === user.id).length;
    const eventsCoordinated = events.filter(e => e.coordinators && e.coordinators.includes(user.id)).length;
    
    const tasksAssigned = tasks.filter(t => t.assignedTo === user.id || t.assigned_to === user.id);
    const tasksCompleted = tasksAssigned.filter(t => t.status === 'COMPLETED').length;
    const tasksPending = tasksAssigned.length - tasksCompleted;

    setPerformanceModal({
      show: true,
      user,
      stats: { eventsAttended, eventsCoordinated, tasksCompleted, tasksPending }
    });
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleSendNotice = async () => {
    if (!noticeModal.title || !noticeModal.message) {
      showToast("Title and message are required");
      return;
    }
    try {
      await noticeService.createNotice({ title: noticeModal.title, content: noticeModal.message });
      showToast(`Notice sent to ${noticeModal.user ? noticeModal.user.name : 'all members'}`);
      setNoticeModal({ show: false, user: null, title: '', message: '' });
      triggerUpdate();
    } catch (err) { alert(err.message); }
  };

  const handleAssignTask = async () => {
    if (!taskModal.title || !taskModal.dueDate) {
      showToast("Title and due date are required");
      return;
    }
    try {
      await taskService.createTask({
        title: taskModal.title,
        description: taskModal.description,
        assignedTo: taskModal.user ? taskModal.user.id : null,
        endDate: new Date(taskModal.dueDate).toISOString()
      });
      showToast(`Task assigned to ${taskModal.user ? taskModal.user.name : 'all members'}`);
      setTaskModal({ show: false, user: null, title: '', description: '', dueDate: '' });
      triggerUpdate();
    } catch (err) { alert(err.message); }
  };

  const handleToggleAttendance = async (profileId, isChecked) => {
    try {
      if (isChecked) {
        await eventService.markAttendance(selectedEventId, profileId);
      } else {
        await eventService.unmarkAttendance(selectedEventId, profileId);
      }
      triggerUpdate();
    } catch (err) { alert(err.message); }
  };

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-0.03em' }}>Admin Control Center</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Authorize member credentials and compile event attendance logs</p>
      </div>

      <div className="dashboard-card" style={{ marginBottom: '24px' }}>
        <h3>Quick Actions</h3>
        <div className="quick-links-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
          <div className="quick-link-button" onClick={() => setNoticeModal({ show: true, user: null, message: '' })}>
            <Send size={20} style={{ color: 'var(--accent-color)' }} />
            <span>Send Notice to All</span>
          </div>
          <div className="quick-link-button" onClick={() => setTaskModal({ show: true, user: null, title: '' })}>
            <ClipboardList size={20} style={{ color: 'var(--accent-color)' }} />
            <span>Assign Global Task</span>
          </div>
        </div>
      </div>

      {/* Admin Tab selection */}
      <div className="tab-bar-container" style={{ maxWidth: '500px', marginBottom: '24px' }}>
        <div 
          className={`tab-bar-item ${adminSection === 'attendance' ? 'active' : ''}`}
          onClick={() => setAdminSection('attendance')}
        >
          <CalendarCheck size={16} />
          <span>Attendance</span>
        </div>
        <div 
          className={`tab-bar-item ${adminSection === 'directory' ? 'active' : ''}`}
          onClick={() => setAdminSection('directory')}
        >
          <UserCheck size={16} />
          <span>Directory</span>
        </div>
        <div 
          className={`tab-bar-item ${adminSection === 'approvals' ? 'active' : ''}`}
          onClick={() => setAdminSection('approvals')}
        >
          <ShieldAlert size={16} />
          {pendingUsers.length > 0 && <span className="badge" style={{ position: 'absolute', top: '-5px', right: '-5px', width: '8px', height: '8px', padding: 0 }} />}
          <span>Approvals</span>
        </div>
        <div 
          className={`tab-bar-item ${adminSection === 'verifications' ? 'active' : ''}`}
          onClick={() => setAdminSection('verifications')}
        >
          <UserCheck size={16} />
          {pendingAttendance.length > 0 && <span className="badge" style={{ position: 'absolute', top: '-5px', right: '-5px', width: '8px', height: '8px', padding: 0 }} />}
          <span>Proofs</span>
        </div>
      </div>

      {/* Toast Notification */}
      {/* SECTION 2: Attendance Sheets */}
      {adminSection === 'attendance' && (
        <div className="dashboard-card">
          <h3>Manual Event Attendance Logging</h3>
          
          <div style={{ margin: '20px 0 24px' }}>
            <div className="form-group">
              <label>SELECT EVENT TO AUDIT</label>
              <select 
                className="form-input" 
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                style={{ width: '100%', marginTop: '4px' }}
              >
                {events.map(ev => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title} ({new Date(ev.startTime).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedEventId ? (
            <div>
              <h5 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                MEMBER ROSTER
              </h5>
              
              <div className="attendance-grid">
                {profiles.map(memberProfile => {
                  const isChecked = attendance.some(a => a.eventId === selectedEventId && a.profileId === memberProfile.id);
                  return (
                    <div key={memberProfile.id} className="attendance-row">
                      <div className="attendance-member">
                        <InitialsAvatar name={memberProfile.name} size={36} />
                        <div>
                          <span>{memberProfile.name}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>
                            {memberProfile.rotaractId}
                          </span>
                        </div>
                      </div>

                      <label className="apple-switch">
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleToggleAttendance(memberProfile.id, e.target.checked)}
                        />
                        <span className="apple-slider"></span>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '24px' }}>
              Create an event first to log member participation.
            </p>
          )}
        </div>
      )}

      {/* SECTION 2B: Attendance Verifications */}
      {adminSection === 'verifications' && (
        <div className="dashboard-card">
          <h3>Pending Attendance Proofs</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>Review and verify member attendance photo uploads.</p>
          
          {pendingAttendance.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '24px' }}>
              No pending attendance proofs to verify.
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {pendingAttendance.map(req => {
                const member = profiles.find(p => p.id === req.profileId);
                const ev = events.find(e => e.id === req.eventId);
                
                return (
                  <div key={req.id} className="liquid-glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <InitialsAvatar name={member?.name || 'Unknown'} size={32} />
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '14px' }}>{member?.name || 'Unknown Member'}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Event: {ev?.title || 'Unknown Event'}</div>
                      </div>
                    </div>
                    
                    <div style={{ width: '100%', height: '140px', borderRadius: '8px', overflow: 'hidden', background: '#000' }}>
                      <img src={req.proofImage} alt="proof" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                      <button 
                        className="btn-primary" 
                        style={{ flex: 1, padding: '8px', fontSize: '12px', background: '#34c759', color: 'white' }}
                        onClick={async () => {
                          try {
                            await eventService.verifyAttendanceRequest(req.id, true);
                            triggerUpdate();
                            showToast('Attendance approved.');
                          } catch (err) { alert(err.message); }
                        }}
                      >
                        <Check size={14} /> Approve
                      </button>
                      <button 
                        className="btn-secondary" 
                        style={{ flex: 1, padding: '8px', fontSize: '12px', color: '#ff3b30' }}
                        onClick={async () => {
                          try {
                            await eventService.verifyAttendanceRequest(req.id, false);
                            triggerUpdate();
                            showToast('Attendance rejected.');
                          } catch (err) { alert(err.message); }
                        }}
                      >
                        <X size={14} /> Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: Members Directory (Admin Quick Actions) */}
      {adminSection === 'directory' && (
        <div className="dashboard-card">
          <h3>Club Active Members Directory</h3>
          
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '12px 8px', fontWeight: '600' }}>MEMBER NAME</th>
                  <th style={{ padding: '12px 8px', fontWeight: '600' }}>ROTARACT ID</th>
                  <th style={{ padding: '12px 8px', fontWeight: '600', textAlign: 'right' }}>QUICK ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '10px 8px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <InitialsAvatar name={p.name} size={28} />
                      <span>{p.name}</span>
                    </td>
                    <td style={{ padding: '10px 8px', color: 'var(--text-secondary)' }}>{p.rotaractId}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button 
                          className="btn-secondary" 
                          style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => setNoticeModal({ show: true, user: p, message: '' })}
                        >
                          <Send size={12} /> Notice
                        </button>
                        <button 
                          className="btn-primary" 
                          style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => setTaskModal({ show: true, user: p, title: '' })}
                        >
                          <ClipboardList size={12} /> Task
                        </button>
                        <button 
                          className="btn-secondary" 
                          style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-secondary)' }}
                          onClick={() => handleViewPerformance(p)}
                        >
                          <BarChart2 size={12} /> Performance
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 4: Pending Approvals */}
      {adminSection === 'approvals' && (
        <div className="dashboard-card">
          <h3>Pending Member Applications</h3>
          
          {pendingUsers.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '24px' }}>
              No pending applications at the moment.
            </p>
          ) : (
            <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '12px 8px', fontWeight: '600' }}>APPLICANT</th>
                    <th style={{ padding: '12px 8px', fontWeight: '600' }}>ROTARACT ID</th>
                    <th style={{ padding: '12px 8px', fontWeight: '600', textAlign: 'right' }}>DECISION</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingUsers.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '10px 8px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <InitialsAvatar name={u.name} size={28} />
                        <div>
                          <span>{u.name}</span>
                          <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)' }}>{u.email}</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 8px', color: 'var(--text-secondary)' }}>{u.rotaractId}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button 
                            className="btn-primary" 
                            style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px', background: '#34c759' }}
                            onClick={() => handleApprove(u.id, 'APPROVED')}
                          >
                            <Check size={12} /> Approve
                          </button>
                          <button 
                            className="btn-secondary" 
                            style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--error-color)' }}
                            onClick={() => handleApprove(u.id, 'REJECTED')}
                          >
                            <X size={12} /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div style={{ position: 'fixed', bottom: '100px', left: '50%', transform: 'translateX(-50%)', background: 'var(--text-primary)', color: 'var(--bg-primary)', padding: '12px 24px', borderRadius: '99px', fontSize: '14px', fontWeight: '600', boxShadow: 'var(--shadow-lg)', zIndex: 9999, transition: 'var(--transition-spring)' }}>
          {toastMessage}
        </div>
      )}

      {noticeModal.show && (
        <div className="modal-overlay" onClick={() => setNoticeModal({ show: false, user: null, title: '', message: '' })}>
          <div className="modal-content liquid-glass-card slide-up" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '16px' }}>Send Notice to {noticeModal.user ? noticeModal.user.name : 'All Members'}</h3>
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label>Notice Title</label>
              <input 
                type="text"
                className="input-modern"
                value={noticeModal.title} 
                onChange={e => setNoticeModal({...noticeModal, title: e.target.value})}
                placeholder="e.g. Urgent Meeting"
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)', marginTop: '8px' }}
              />
            </div>
            <div className="form-group">
              <label>Notice Message</label>
              <textarea 
                rows="4"
                className="input-modern"
                value={noticeModal.message} 
                onChange={e => setNoticeModal({...noticeModal, message: e.target.value})}
                placeholder="Type your notice here..."
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)', marginTop: '8px' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={handleSendNotice}>Dispatch Notice</button>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setNoticeModal({ show: false, user: null, title: '', message: '' })}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {taskModal.show && (
        <div className="modal-overlay" onClick={() => setTaskModal({ show: false, user: null, title: '', description: '', dueDate: '' })}>
          <div className="modal-content liquid-glass-card slide-up" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '16px' }}>Assign Task to {taskModal.user ? taskModal.user.name : 'All Members'}</h3>
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label>Task Title</label>
              <input 
                type="text"
                className="input-modern"
                value={taskModal.title} 
                onChange={e => setTaskModal({...taskModal, title: e.target.value})}
                placeholder="e.g. Complete survey"
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)', marginTop: '8px' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label>Task Description</label>
              <textarea 
                rows="2"
                className="input-modern"
                value={taskModal.description} 
                onChange={e => setTaskModal({...taskModal, description: e.target.value})}
                placeholder="Details about the task..."
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)', marginTop: '8px' }}
              />
            </div>
            <div className="form-group">
              <label>Due Date</label>
              <input 
                type="date"
                className="input-modern"
                value={taskModal.dueDate} 
                onChange={e => setTaskModal({...taskModal, dueDate: e.target.value})}
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)', marginTop: '8px' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={handleAssignTask}>Assign Task</button>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setTaskModal({ show: false, user: null, title: '', description: '', dueDate: '' })}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Performance Modal */}
      {performanceModal.show && performanceModal.user && (
        <div className="modal-overlay" onClick={() => setPerformanceModal({ show: false, user: null, stats: null })}>
          <div className="modal-content liquid-glass-card slide-up" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <InitialsAvatar name={performanceModal.user.name} size={48} />
              <div>
                <h3 style={{ margin: 0 }}>{performanceModal.user.name}</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{performanceModal.user.rotaractId} • {performanceModal.user.role}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--accent-color)' }}>{performanceModal.stats.eventsAttended}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Events Attended</div>
              </div>
              <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--accent-color)' }}>{performanceModal.stats.eventsCoordinated}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Events Coordinated</div>
              </div>
              <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#34c759' }}>{performanceModal.stats.tasksCompleted}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tasks Completed</div>
              </div>
              <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#ff9500' }}>{performanceModal.stats.tasksPending}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tasks Pending</div>
              </div>
            </div>

            <button className="btn-secondary" style={{ width: '100%' }} onClick={() => setPerformanceModal({ show: false, user: null, stats: null })}>
              Close Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
