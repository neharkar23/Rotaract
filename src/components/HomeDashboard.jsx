import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { taskService } from '../data/mockDb';
import NotificationTray from './NotificationTray';
import { Bell, MapPin, Calendar, Clock, Check, ExternalLink, BookOpen, MessageSquare, Video, Settings } from 'lucide-react';
import InitialsAvatar from './InitialsAvatar';

const HomeDashboard = ({ setSelectedEvent }) => {
  const { 
    currentProfile, 
    events, 
    tasks, 
    setTasks,
    userNotifications, 
    triggerUpdate, 
    setActiveTab 
  } = useApp();

  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [showNotifications, setShowNotifications] = useState(false);

  // Filter tasks assigned to current member
  const memberTasks = tasks.filter(t => t.assignedTo === currentProfile?.id || t.createdBy === currentProfile?.id);
  const pendingTasks = memberTasks.filter(t => t.status !== 'COMPLETED');

  // Filter upcoming events (future startTimes)
  const upcomingEvents = events.filter(e => new Date(e.startTime) >= new Date())
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

  // Toggle task completion
  const handleToggleTask = async (taskId, currentStatus) => {
    const nextStatus = currentStatus === 'PENDING' ? 'IN_PROGRESS' : currentStatus === 'IN_PROGRESS' ? 'COMPLETED' : 'PENDING';
    
    // Optimistic update
    setTasks(prevTasks => prevTasks.map(t => t.id === taskId ? { ...t, status: nextStatus } : t));

    try {
      await taskService.updateTaskStatus(taskId, nextStatus);
      // We don't necessarily need to trigger a full refresh now, but doing so keeps it synced.
      // triggerUpdate(); // Optional, but removing it avoids unnecessary network requests if it's already updated.
    } catch(err) { 
      // Revert on error
      setTasks(prevTasks => prevTasks.map(t => t.id === taskId ? { ...t, status: currentStatus } : t));
      alert(err.message); 
    }
  };

  // Helper: Generates list of next 7 days starting from today
  const getNext7Days = () => {
    const list = [];
    const daysName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      
      const hasEvent = events.some(e => {
        const evDate = new Date(e.startTime);
        return evDate.getDate() === d.getDate() && evDate.getMonth() === d.getMonth();
      });

      list.push({
        dayName: daysName[d.getDay()],
        dayNumber: d.getDate(),
        hasEvent,
        fullDate: d
      });
    }
    return list;
  };

  const next7Days = getNext7Days();

  // Quick links actions
  const quickLinks = [
    { title: 'Google Rulebook', icon: BookOpen, action: () => window.open('https://example.com/rulebook', '_blank') },
    { title: 'Noticeboard', icon: MessageSquare, action: () => setActiveTab('analytics') },
    { title: 'Zoom Meet Links', icon: Video, action: () => window.open('https://zoom.us', '_blank') },
    { title: 'Personal Settings', icon: Settings, action: () => setActiveTab('profile') }
  ];

  // Unread notifications count
  const unreadCount = userNotifications.filter(n => !n.read).length;

  const renderTasksCard = (className = '') => (
    <div className={`dashboard-card ${className}`}>
      <h3>My Tasks ({pendingTasks.length})</h3>
      <div className="tasks-list">
        {memberTasks.length > 0 ? (
          memberTasks.slice(0, 4).map(task => (
            <div key={task.id} className="task-item">
              <div 
                className={`task-checkbox ${task.status === 'COMPLETED' ? 'completed' : ''}`}
                onClick={() => handleToggleTask(task.id, task.status)}
              >
                {task.status === 'COMPLETED' && <Check size={12} />}
              </div>
              
              <div className="task-details">
                <h5 className={task.status === 'COMPLETED' ? 'completed' : ''}>{task.title}</h5>
                <p>{task.description.substring(0, 40)}...</p>
              </div>
            </div>
          ))
        ) : (
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', padding: '12px' }}>
            No tasks assigned.
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div>
      {/* Dashboard Header Banner */}
      <header className="dashboard-header">
        <div className="welcome-section">
          <h2>Hello, {currentProfile?.name.split(' ')[0]}</h2>
          <p>{currentProfile?.clubName} • {currentProfile?.district}</p>
        </div>
        
        <div className="header-actions">
          <div className="bell-icon-container" onClick={() => setShowNotifications(true)}>
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="bell-badge">{unreadCount}</span>
            )}
          </div>
          <InitialsAvatar 
            name={currentProfile?.name} 
            size={40} 
            onClick={() => setActiveTab('profile')} 
            style={{ cursor: 'pointer' }}
          />
        </div>
      </header>

      {/* Grid Layout: Main Feed & Sidebar */}
      <div className="dashboard-grid">
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* 7-Day Preview Card */}
          <div className="dashboard-card">
            <h3>7-Day Schedule</h3>
            <div className="seven-day-list">
              {next7Days.map((day, idx) => (
                <div 
                  key={idx}
                  className={`day-bubble ${selectedDay === day.dayNumber ? 'active' : ''} ${day.hasEvent ? 'has-event' : ''}`}
                  onClick={() => setSelectedDay(day.dayNumber)}
                >
                  <span className="day-name">{day.dayName}</span>
                  <span className="day-number">{day.dayNumber}</span>
                </div>
              ))}
            </div>
            
            {/* Displaying events for selected day */}
            <div style={{ marginTop: '16px' }}>
              {events.filter(e => new Date(e.startTime).getDate() === selectedDay).length > 0 ? (
                events.filter(e => new Date(e.startTime).getDate() === selectedDay).map(ev => (
                  <div 
                    key={ev.id} 
                    onClick={() => setSelectedEvent(ev)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-primary)', borderRadius: '12px', cursor: 'pointer', marginBottom: '8px' }}
                  >
                    <div>
                      <h5 style={{ fontSize: '14px', fontWeight: '600' }}>{ev.title}</h5>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {new Date(ev.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {ev.venue}
                      </span>
                    </div>
                    <ExternalLink size={14} style={{ color: 'var(--text-secondary)' }} />
                  </div>
                ))
              ) : (
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', padding: '8px' }}>
                  No events scheduled for this day.
                </p>
              )}
            </div>
          </div>

          {/* Tasks checklist card for Mobile ONLY (Appears right after calendar, before upcoming events) */}
          {renderTasksCard('mobile-only')}

          {/* Upcoming Events Carousel */}
          <div className="dashboard-card">
            <h3 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Upcoming Events</span>
              <button 
                onClick={() => setActiveTab('events')} 
                style={{ background: 'none', color: 'var(--accent-color)', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
              >
                See All
              </button>
            </h3>
            
            <div className="events-carousel no-scrollbar">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map(event => (
                  <div 
                    key={event.id}
                    className="event-slide-card"
                    onClick={() => setSelectedEvent(event)}
                  >
                    <span className={`event-tag ${event.tag === 'Ceremony' ? 'tag-ceremony' : event.tag === 'Community Service' ? 'tag-community' : 'tag-professional'}`}>
                      {event.tag}
                    </span>
                    <h4>{event.title}</h4>
                    
                    <div className="event-meta-row" style={{ marginTop: '12px' }}>
                      <Calendar size={14} />
                      <span>{new Date(event.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div className="event-meta-row">
                      <Clock size={14} />
                      <span>{new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="event-meta-row">
                      <MapPin size={14} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.venue}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', padding: '16px' }}>No upcoming events.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Attendance Ring */}
          <div className="dashboard-card liquid-glass-card">
            <h3>Attendance Tracking</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '20px' }}>
              <div style={{ position: 'relative', width: '60px', height: '60px' }}>
                <svg width="60" height="60" viewBox="0 0 60 60">
                  <circle cx="30" cy="30" r="26" fill="none" stroke="var(--border-color)" strokeWidth="6" />
                  <circle cx="30" cy="30" r="26" fill="none" stroke="var(--accent-color)" strokeWidth="6" strokeDasharray="163" strokeDashoffset="40" strokeLinecap="round" transform="rotate(-90 30 30)" />
                </svg>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700' }}>
                  75%
                </div>
              </div>
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '600' }}>Overall Standing</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>You've attended 3 out of 4 recent events. Keep it up!</p>
              </div>
            </div>
          </div>

          {/* Tasks checklist card */}
          {renderTasksCard('desktop-only')}

        </div>
      </div>

      {/* Notifications Drawer Bottom Sheet overlay */}
      {showNotifications && (
        <NotificationTray onClose={() => setShowNotifications(false)} />
      )}
    </div>
  );
};

export default HomeDashboard;
