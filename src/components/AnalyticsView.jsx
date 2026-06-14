import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { taskService, noticeService } from '../data/mockDb';
import { BarChart as BarChartIcon, CheckSquare, BellRing, Plus, Check, Trash2, Calendar, Share2, Clipboard, PlusSquare } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const AnalyticsView = () => {
  const {
    currentProfile,
    events,
    myAttendance,
    attendance: allAttendance,
    tasks,
    setTasks,
    notices,
    activeRole,
    triggerUpdate,
    profiles,
    deleteTask
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState('analytics'); // 'analytics', 'tasks', 'notices'
  const [viewMode, setViewMode] = useState('club'); // 'club' or 'personal'
  const [taskFilter, setTaskFilter] = useState('all'); // 'all', 'assigned', 'self'
  const [showSelfTaskForm, setShowSelfTaskForm] = useState(false);
  const [showNoticeForm, setShowNoticeForm] = useState(false);

  // Self-Task Form states
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskEnd, setTaskEnd] = useState('');

  // Notice Form states
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticeDate, setNoticeDate] = useState('');

  // Calculate analytics
  const getChatsAnalytics = (mode) => {
    const pastEvents = (events || []).filter(e => new Date(e.startTime || e.start_time) < new Date());

    let targetAttendance = myAttendance || [];
    let totalPossibleAttendance = pastEvents.length;

    if (mode === 'club' && activeRole === 'ADMIN') {
      targetAttendance = allAttendance || [];
      totalPossibleAttendance = pastEvents.length * (profiles?.length || 1);
    }

    if (pastEvents.length === 0) {
      return {
        eventRingPercentage: 0,
        attendedCount: 0,
        totalPastEvents: 0,
        distribution: { Ceremony: 0, 'Community Service': 0, 'Professional Dev': 0 },
        insights: ['No past events available for analytics yet.']
      };
    }

    const eventRingPercentage = totalPossibleAttendance > 0 ? Math.round((targetAttendance.length / totalPossibleAttendance) * 100) : 0;

    const distribution = { Ceremony: 0, 'Community Service': 0, 'Professional Dev': 0 };
    targetAttendance.forEach(att => {
      const ev = pastEvents.find(e => e.id === (att.eventId || att.event_id));
      if (ev && distribution[ev.tag] !== undefined) {
        distribution[ev.tag]++;
      }
    });

    const activeSector = Object.keys(distribution).reduce((a, b) => distribution[a] > distribution[b] ? a : b);

    return {
      eventRingPercentage,
      attendedCount: targetAttendance.length,
      totalPastEvents: pastEvents.length,
      distribution,
      insights: mode === 'club'
        ? [
          `The club has maintained ${eventRingPercentage}% overall attendance at past actions.`,
          eventRingPercentage > 60 ? 'Great club engagement overall!' : 'Focus on member retention and outreach.',
          `Most active club sector: ${activeSector}.`
        ]
        : [
          `You have logged ${eventRingPercentage}% attendance at past club actions.`,
          eventRingPercentage > 60 ? 'Stunning commitment to the community!' : 'Participate in upcoming cleanups to raise your metrics.',
          `Most active sector of involvement: ${activeSector}.`
        ]
    };
  };

  const currentMode = (activeRole === 'ADMIN' && viewMode === 'club') ? 'club' : 'personal';
  const analytics = getChatsAnalytics(currentMode);

  // Pie Chart Data Processors
  const eventPieData = [
    { name: 'Ceremony', value: analytics.distribution.Ceremony, color: '#d91c5c' },
    { name: 'Community', value: analytics.distribution['Community Service'], color: '#ff4d85' },
    { name: 'Professional', value: analytics.distribution['Professional Dev'], color: '#a60a3d' }
  ].filter(d => d.value > 0);

  const getTasksAnalytics = () => {
    let targetTasks = tasks;
    if (currentMode === 'personal') {
      targetTasks = tasks.filter(t => t.assignedTo === currentProfile.id || t.assigned_to === currentProfile.id);
    }
    const completed = targetTasks.filter(t => t.status === 'COMPLETED').length;
    const pending = targetTasks.length - completed;
    return [
      { name: 'Completed', value: completed, color: '#d91c5c' },
      { name: 'Pending', value: pending, color: '#ffb3c6' }
    ].filter(d => d.value > 0);
  };
  const taskPieData = getTasksAnalytics();

  // Filter Tasks
  const allMyTasks = tasks.filter(t => t.assignedTo === currentProfile.id || (t.createdBy === currentProfile.id && t.assignedTo === currentProfile.id));
  const selfTasks = allMyTasks.filter(t => t.createdBy === currentProfile.id);
  const assignedTasks = allMyTasks.filter(t => t.createdBy !== currentProfile.id);

  const displayedTasks = taskFilter === 'all'
    ? allMyTasks
    : taskFilter === 'assigned'
      ? assignedTasks
      : selfTasks;

  const handleToggleTask = async (taskId, currentStatus) => {
    const nextStatus = currentStatus === 'COMPLETED' ? 'IN_PROGRESS' : 'COMPLETED';

    // Optimistic update
    setTasks(prevTasks => prevTasks.map(t => t.id === taskId ? { ...t, status: nextStatus } : t));

    try {
      await taskService.updateTaskStatus(taskId, nextStatus);
    } catch (err) {
      // Revert on error
      setTasks(prevTasks => prevTasks.map(t => t.id === taskId ? { ...t, status: currentStatus } : t));
      alert(err.message);
    }
  };

  const handleCreateSelfTask = (e) => {
    e.preventDefault();
    if (!taskTitle) return;

    taskService.createTask({
      title: taskTitle,
      description: taskDesc || 'No details provided.',
      assignedTo: currentProfile.id,
      endDate: taskEnd ? new Date(taskEnd).toISOString() : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
    }, currentProfile.id);

    setTaskTitle('');
    setTaskDesc('');
    setTaskEnd('');
    setShowSelfTaskForm(false);
    triggerUpdate();
  };

  const handleCreateNotice = (e) => {
    e.preventDefault();
    if (!noticeTitle || !noticeContent) return;

    noticeService.createNotice({
      title: noticeTitle,
      content: noticeContent,
      effectiveDate: noticeDate || new Date().toISOString()
    }, currentProfile.id);

    setNoticeTitle('');
    setNoticeContent('');
    setNoticeDate('');
    setShowNoticeForm(false);
    triggerUpdate();
  };

  const handleAddNoticeToTask = (notice) => {
    taskService.createTask({
      title: `Notice Follow-up: ${notice.title}`,
      description: `Action items from notice: ${notice.content}`,
      assignedTo: currentProfile.id,
      endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
    }, currentProfile.id);

    alert('Notice added to your task list!');
    triggerUpdate();
  };

  const handleCopyNotice = (text) => {
    navigator.clipboard.writeText(text);
    alert('Notice text copied to clipboard!');
  };

  const handleShareNotice = (notice) => {
    if (navigator.share) {
      navigator.share({
        title: notice.title,
        text: notice.content
      }).catch(console.error);
    } else {
      handleCopyNotice(`${notice.title}\n\n${notice.content}`);
    }
  };

  const handleDeleteTask = (taskId) => {
    if (window.confirm('Delete this task?')) {
      deleteTask(taskId);
    }
  };

  // SVG parameters for Analytics Progress Ring
  const radius = 70;
  const stroke = 10;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (analytics.eventRingPercentage / 100) * circumference;

  return (
    <div>
      {/* Top tab switcher */}
      <div className="tab-bar-container">
        <div
          className={`tab-bar-item ${activeSubTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('analytics')}
        >
          <BarChartIcon size={16} />
          <span>Analytics</span>
        </div>
        <div
          className={`tab-bar-item ${activeSubTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('tasks')}
        >
          <CheckSquare size={16} />
          <span>My Tasks</span>
        </div>
        <div
          className={`tab-bar-item ${activeSubTab === 'notices' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('notices')}
        >
          <BellRing size={16} />
          <span>Noticeboard</span>
        </div>
      </div>

      {/* SUB-VIEW 1: Analytics Dashboard */}
      {activeSubTab === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Admin Toggle */}
          {activeRole === 'ADMIN' && (
            <div className="tab-bar-container" style={{ display: 'inline-flex', marginBottom: '8px' }}>
              <div className={`tab-bar-item ${viewMode === 'club' ? 'active' : ''}`} onClick={() => setViewMode('club')}>Club Analytics</div>
              <div className={`tab-bar-item ${viewMode === 'personal' ? 'active' : ''}`} onClick={() => setViewMode('personal')}>My Analytics</div>
            </div>
          )}

          <div className="dashboard-grid">
            {currentMode === 'personal' && (
              <div className="dashboard-card analytics-card">
                <h3>My Attendance</h3>

                <div className="progress-ring-container">
                  <svg height={radius * 2} width={radius * 2}>
                    <circle
                      stroke="var(--border-color)"
                      fill="transparent"
                      strokeWidth={stroke}
                      r={normalizedRadius}
                      cx={radius}
                      cy={radius}
                    />
                    <circle
                      stroke="var(--accent-color)"
                      fill="transparent"
                      strokeWidth={stroke}
                      strokeDasharray={circumference + ' ' + circumference}
                      style={{ strokeDashoffset }}
                      strokeLinecap="round"
                      className="progress-ring-circle"
                      r={normalizedRadius}
                      cx={radius}
                      cy={radius}
                    />
                  </svg>
                  <div className="progress-ring-label">
                    <span className="progress-ring-percentage">{analytics.eventRingPercentage}%</span>
                    <span className="progress-ring-text">ATTENDED</span>
                  </div>
                </div>

                <div className="analytics-stats-grid">
                  <div className="stat-box">
                    <div className="number">{analytics.attendedCount}</div>
                    <div className="label">ATTENDED</div>
                  </div>
                  <div className="stat-box">
                    <div className="number">{analytics.totalPastEvents}</div>
                    <div className="label">TOTAL EVENTS</div>
                  </div>
                  <div className="stat-box">
                    <div className="number">{Math.round(analytics.attendedCount * 1.5)}</div>
                    <div className="label">HOURS LOGGED</div>
                  </div>
                </div>
              </div>
            )}

            <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h3>Category Distribution</h3>
                <div style={{ height: '200px', width: '100%', marginTop: '16px' }}>
                  {eventPieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={eventPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {eventPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>No events logged yet</div>
                  )}
                </div>

                {eventPieData.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', marginTop: '8px' }}>
                    {eventPieData.map(d => (
                      <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: d.color }}></div>
                        {d.name} ({d.value})
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
                <h3>Task Completion</h3>
                <div style={{ height: '200px', width: '100%', marginTop: '16px' }}>
                  {taskPieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={taskPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {taskPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>No tasks assigned yet</div>
                  )}
                </div>

                {taskPieData.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', marginTop: '8px' }}>
                    {taskPieData.map(d => (
                      <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: d.color }}></div>
                        {d.name} ({d.value})
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <h5 style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '8px' }}>TIPS & INSIGHTS</h5>
                <ul style={{ paddingLeft: '16px', fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {analytics.insights.map((insight, idx) => (
                    <li key={idx}>{insight}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: Tasks Section (With completion and deletions) */}
      {activeSubTab === 'tasks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          <div className="events-header">
            <div>
              <h3>Task Management</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Toggle completions and delete self logged tasks</p>
            </div>
            <button className="btn-primary" onClick={() => setShowSelfTaskForm(true)}>
              <Plus size={16} />
              <span>Log Self Task</span>
            </button>
          </div>

          <div className="tab-bar-container" style={{ display: 'inline-flex', marginBottom: '8px' }}>
            <div className={`tab-bar-item ${taskFilter === 'all' ? 'active' : ''}`} onClick={() => setTaskFilter('all')}>All Tasks</div>
            <div className={`tab-bar-item ${taskFilter === 'assigned' ? 'active' : ''}`} onClick={() => setTaskFilter('assigned')}>Assigned to Me</div>
            <div className={`tab-bar-item ${taskFilter === 'self' ? 'active' : ''}`} onClick={() => setTaskFilter('self')}>Created by Self</div>
          </div>

          <div className="dashboard-card liquid-glass-card">
            <div className="tasks-list">
              {displayedTasks.length > 0 ? (
                displayedTasks.map(task => {
                  const isSelf = task.createdBy === currentProfile.id;
                  const canDelete = isSelf || activeRole === 'ADMIN';
                  return (
                    <div key={task.id} className="task-item" style={{ borderLeft: `4px solid ${isSelf ? 'var(--accent-color)' : 'var(--warning-color)'}` }}>
                      <div
                        className={`task-checkbox ${task.status === 'COMPLETED' ? 'completed' : ''}`}
                        onClick={() => handleToggleTask(task.id, task.status)}
                      >
                        {task.status === 'COMPLETED' && <Check size={12} />}
                      </div>

                      <div className="task-details">
                        <h5 className={task.status === 'COMPLETED' ? 'completed' : ''}>{task.title}</h5>
                        <p>{task.description}</p>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '6px', alignItems: 'center' }}>
                          <span className="badge" style={{ background: isSelf ? 'rgba(var(--accent-rgb), 0.1)' : 'rgba(255, 149, 0, 0.1)', color: isSelf ? 'var(--accent-color)' : 'var(--warning-color)', fontSize: '10px', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>
                            {isSelf ? 'Self' : 'Assigned'}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            Due by {new Date(task.endDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {canDelete && (
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="btn-secondary"
                          style={{ border: 'none', padding: '6px', color: 'var(--error-color)', cursor: 'pointer', alignSelf: 'center', background: 'transparent' }}
                          title="Delete Task"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>
                  No tasks found in this view.
                </p>
              )}
            </div>
          </div>

          {/* Self Task Modal Creation */}
          {showSelfTaskForm && (
            <div className="modal-overlay">
              <div className="modal-content liquid-glass-card slide-up">
                <div className="modal-close-btn" onClick={() => setShowSelfTaskForm(false)}>✕</div>
                <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '20px' }}>Log Self Task</h3>

                <form onSubmit={handleCreateSelfTask} className="onboarding-form">
                  <div className="form-group">
                    <label>TASK NAME *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Prepare budget report"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>DESCRIPTION</label>
                    <textarea
                      className="form-input"
                      style={{ minHeight: '60px' }}
                      placeholder="Details of the work..."
                      value={taskDesc}
                      onChange={(e) => setTaskDesc(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>DUE DATE</label>
                    <input
                      type="date"
                      className="form-input"
                      value={taskEnd}
                      onChange={(e) => setTaskEnd(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="btn-primary" style={{ marginTop: '12px' }}>
                    Log Task
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 3: Noticeboard (Announcements list) */}
      {activeSubTab === 'notices' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          <div className="events-header">
            <div>
              <h3>Announcements Board</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Official notifications from administrative directors</p>
            </div>

            {activeRole === 'ADMIN' && (
              <button className="btn-primary" onClick={() => setShowNoticeForm(true)}>
                <Plus size={16} />
                <span>Write Notice</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {notices.length > 0 ? (
              notices.map(notice => {
                const adminName = profiles.find(p => p.id === notice.createdBy)?.name || 'Admin';
                return (
                  <div key={notice.id} className="notice-card">
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4>{notice.title}</h4>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {new Date(notice.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--accent-color)', fontWeight: '600', marginTop: '2px', display: 'block' }}>
                        By {adminName}
                      </span>
                    </div>

                    <p>{notice.content}</p>

                    <div className="notice-actions">
                      <div className="notice-btn" onClick={() => handleAddNoticeToTask(notice)}>
                        <PlusSquare size={14} />
                        <span>Add to Task</span>
                      </div>
                      <div className="notice-btn" onClick={() => handleShareNotice(notice)}>
                        <Share2 size={14} />
                        <span>Share</span>
                      </div>
                      <div className="notice-btn" onClick={() => handleCopyNotice(notice.content)}>
                        <Clipboard size={14} />
                        <span>Copy</span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '32px' }}>No notices published.</p>
            )}
          </div>

          {/* Write Notice Modal Form */}
          {showNoticeForm && (
            <div className="modal-overlay">
              <div className="modal-content liquid-glass-card slide-up">
                <div className="modal-close-btn" onClick={() => setShowNoticeForm(false)}>✕</div>
                <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '20px' }}>Publish Notice</h3>

                <form onSubmit={handleCreateNotice} className="onboarding-form">
                  <div className="form-group">
                    <label>NOTICE TITLE *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Installation Prep BOD Meeting"
                      value={noticeTitle}
                      onChange={(e) => setNoticeTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>CONTENT *</label>
                    <textarea
                      className="form-input"
                      style={{ minHeight: '120px' }}
                      placeholder="Write announcement content details..."
                      value={noticeContent}
                      onChange={(e) => setNoticeContent(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>EFFECTIVE DATE</label>
                    <input
                      type="date"
                      className="form-input"
                      value={noticeDate}
                      onChange={(e) => setNoticeDate(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="btn-primary" style={{ marginTop: '12px' }}>
                    Publish Announcement
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalyticsView;
