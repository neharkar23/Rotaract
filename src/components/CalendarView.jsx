import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalIcon, Clock, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { taskService } from '../data/mockDb';

const CalendarView = ({ setSelectedEvent }) => {
  const { events, tasks, currentProfile, triggerUpdate } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeView, setActiveView] = useState('monthly'); // 'monthly', 'daily', 'yearly'
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', date: '', time: '' });
  const [toastMessage, setToastMessage] = useState('');
  
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const handlePrev = () => {
    if (activeView === 'monthly') setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    else if (activeView === 'yearly') setCurrentDate(new Date(currentDate.getFullYear() - 1, 0, 1));
    else setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 1));
  };
  
  const handleNext = () => {
    if (activeView === 'monthly') setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    else if (activeView === 'yearly') setCurrentDate(new Date(currentDate.getFullYear() + 1, 0, 1));
    else setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1));
  };

  const handleDateClick = (year, month, day) => {
    setCurrentDate(new Date(year, month, day));
    setActiveView('daily');
  };

  const handleCreateTask = (e) => {
    e.preventDefault();
    if(!newTask.title) return;
    
    const endDate = new Date(`${newTask.date || new Date().toISOString().split('T')[0]}T${newTask.time || '12:00'}`);
    taskService.createTask({
      title: newTask.title,
      description: newTask.description,
      assignedTo: currentProfile.id,
      endDate: endDate.toISOString()
    }, currentProfile.id);
    
    setShowAddModal(false);
    setNewTask({ title: '', description: '', date: '', time: '' });
    showToast("Task created successfully!");
    triggerUpdate();
  };

  const renderMiniCalendar = (year, month) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const days = [];
    
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} style={{ width: '14%' }}></div>);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const isToday = new Date().getDate() === i && new Date().getMonth() === month && new Date().getFullYear() === year;
      days.push(
        <div key={i} style={{ width: '14%', textAlign: 'center', fontSize: '10px', color: isToday ? 'var(--accent-color)' : 'var(--text-secondary)', fontWeight: isToday ? 'bold' : 'normal' }}>
          {i}
        </div>
      );
    }
    
    return (
      <div 
        key={month} 
        className="dashboard-card liquid-glass-card" 
        style={{ padding: '12px', cursor: 'pointer' }}
        onClick={() => {
          setCurrentDate(new Date(year, month, 1));
          setActiveView('monthly');
        }}
      >
        <h4 style={{ fontSize: '12px', marginBottom: '8px', textAlign: 'center', color: 'var(--text-primary)', fontWeight: '700' }}>{monthNames[month]}</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 0' }}>
          {days}
        </div>
      </div>
    );
  };

  const renderYearly = () => {
    const months = [];
    for(let m=0; m<12; m++) {
      months.push(renderMiniCalendar(currentDate.getFullYear(), m));
    }
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
        {months}
      </div>
    );
  };

  const renderMonthly = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const isToday = new Date().getDate() === i && new Date().getMonth() === month && new Date().getFullYear() === year;
      
      const dayTasks = tasks.filter(t => new Date(t.endDate).getDate() === i && new Date(t.endDate).getMonth() === month && new Date(t.endDate).getFullYear() === year);
      const dayEvents = events.filter(e => {
        const evDate = new Date(e.startTime || e.date);
        return evDate.getDate() === i && evDate.getMonth() === month && evDate.getFullYear() === year;
      });
      
      const hasTask = dayTasks.length > 0;
      const hasEvent = dayEvents.length > 0;

      days.push(
        <div key={i} className={`calendar-day ${isToday ? 'today' : ''} ${hasEvent ? 'has-event warning' : ''}`} style={{ cursor: 'pointer' }} onClick={() => handleDateClick(year, month, i)}>
          <span className="day-number">{i}</span>
          {hasTask && <div className="event-dot"></div>}
        </div>
      );
    }
    
    return (
      <div className="calendar-grid">
        <div className="calendar-weekday">Sun</div>
        <div className="calendar-weekday">Mon</div>
        <div className="calendar-weekday">Tue</div>
        <div className="calendar-weekday">Wed</div>
        <div className="calendar-weekday">Thu</div>
        <div className="calendar-weekday">Fri</div>
        <div className="calendar-weekday">Sat</div>
        {days}
      </div>
    );
  };

  const renderDaily = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const date = currentDate.getDate();
    
    const dayTasks = tasks.filter(t => new Date(t.endDate).getDate() === date && new Date(t.endDate).getMonth() === month && new Date(t.endDate).getFullYear() === year);
    const dayEvents = events.filter(e => {
      const evDate = new Date(e.startTime || e.date);
      return evDate.getDate() === date && evDate.getMonth() === month && evDate.getFullYear() === year;
    });

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {dayEvents.length > 0 && (
          <div className="dashboard-card liquid-glass-card">
            <h4 style={{ marginBottom: '16px', color: 'var(--warning-color)' }}>Scheduled Events</h4>
            {dayEvents.map(ev => (
              <div 
                key={ev.id} 
                onClick={() => setSelectedEvent && setSelectedEvent(ev)}
                style={{ cursor: 'pointer', display: 'flex', gap: '12px', padding: '16px', background: 'var(--bg-primary)', borderRadius: '16px', marginBottom: '8px', border: '1px solid var(--border-color)' }}
              >
                <CalIcon size={20} style={{ color: 'var(--warning-color)' }} />
                <div>
                  <h5 style={{ fontSize: '15px', fontWeight: '700' }}>{ev.title}</h5>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>{ev.time || new Date(ev.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="dashboard-card liquid-glass-card">
          <h4 style={{ marginBottom: '16px', color: 'var(--accent-color)' }}>My Tasks</h4>
          {dayTasks.length > 0 ? dayTasks.map(task => (
            <div key={task.id} className="task-item" style={{ marginBottom: '8px' }}>
              <div className={`task-checkbox ${task.status === 'COMPLETED' ? 'completed' : ''}`}>
                {task.status === 'COMPLETED' && <Check size={12} />}
              </div>
              <div className="task-details">
                <h5 className={task.status === 'COMPLETED' ? 'completed' : ''}>{task.title}</h5>
                <p>{task.description}</p>
              </div>
            </div>
          )) : (
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', padding: '20px 0', textAlign: 'center' }}>No tasks scheduled for this day.</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="view-container fade-in">
      <div className="view-header" style={{ marginBottom: '16px' }}>
        <h2>Calendar</h2>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={18} strokeWidth={3} />
          <span>Add Task</span>
        </button>
      </div>

      <div className="tab-bar-container" style={{ marginBottom: '24px' }}>
        <div className={`tab-bar-item ${activeView === 'yearly' ? 'active' : ''}`} onClick={() => setActiveView('yearly')}>Yearly</div>
        <div className={`tab-bar-item ${activeView === 'monthly' ? 'active' : ''}`} onClick={() => setActiveView('monthly')}>Monthly</div>
        <div className={`tab-bar-item ${activeView === 'daily' ? 'active' : ''}`} onClick={() => setActiveView('daily')}>Daily</div>
      </div>

      <div className="dashboard-card liquid-glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600' }}>
            {activeView === 'yearly' ? currentDate.getFullYear() : 
             activeView === 'monthly' ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}` : 
             currentDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-secondary" style={{ padding: '8px' }} onClick={handlePrev}>
              <ChevronLeft size={20} />
            </button>
            <button className="btn-secondary" style={{ padding: '8px' }} onClick={handleNext}>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {activeView === 'yearly' && renderYearly()}
        {activeView === 'monthly' && renderMonthly()}
        {activeView === 'daily' && renderDaily()}
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content liquid-glass-card slide-up" onClick={e => e.stopPropagation()}>
            <div className="modal-close-btn" onClick={() => setShowAddModal(false)}>✕</div>
            <h3 style={{ marginBottom: '16px', fontSize: '20px', fontWeight: '800' }}>Add Task / Event</h3>
            
            <form onSubmit={handleCreateTask} className="onboarding-form">
              <div className="form-group">
                <label>TITLE *</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={newTask.title} 
                  onChange={e => setNewTask({...newTask, title: e.target.value})}
                  placeholder="E.g. Call vendor"
                  required
                />
              </div>
              <div className="form-group">
                <label>DESCRIPTION</label>
                <textarea 
                  className="form-input"
                  style={{ minHeight: '80px' }}
                  value={newTask.description} 
                  onChange={e => setNewTask({...newTask, description: e.target.value})}
                  placeholder="Details..."
                />
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>DATE</label>
                  <input 
                    type="date" 
                    className="form-input"
                    value={newTask.date}
                    onChange={e => setNewTask({...newTask, date: e.target.value})}
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>TIME</label>
                  <input 
                    type="time" 
                    className="form-input"
                    value={newTask.time}
                    onChange={e => setNewTask({...newTask, time: e.target.value})}
                  />
                </div>
              </div>
              <button type="submit" className="btn-primary" style={{ marginTop: '24px', width: '100%' }}>Create Entry</button>
            </form>
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

export default CalendarView;
