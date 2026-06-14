import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { eventService } from '../data/mockDb';
import { Plus, Calendar, Clock, MapPin, ArrowRight } from 'lucide-react';

const EventsView = ({ setSelectedEvent }) => {
  const { events, activeRole, currentProfile, triggerUpdate, profiles } = useApp();
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Event creation form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [venue, setVenue] = useState('');
  const [tag, setTag] = useState('Ceremony');
  const [rulebookUrl, setRulebookUrl] = useState('');
  const [meetLink, setMeetLink] = useState('');
  const [selectedCoordinators, setSelectedCoordinators] = useState([currentProfile?.id]);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!title || !startTime || !endTime || !venue) {
      setError('Please fill in all required fields.');
      return;
    }
    
    if (selectedCoordinators.length === 0) {
      setError('Please assign at least one event leader.');
      return;
    }
    
    try {
      await eventService.createEvent({
        title,
        description,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        venue,
        tag,
        googleRulebookUrl: rulebookUrl || 'https://example.com/rules-book',
        meetLink: meetLink || 'https://meet.google.com',
        coordinators: selectedCoordinators
      });
      
      // Reset state
      setTitle('');
      setDescription('');
      setStartTime('');
      setEndTime('');
      setVenue('');
      setRulebookUrl('');
      setMeetLink('');
      setSelectedCoordinators([currentProfile.id]);
      setShowCreateForm(false);
      showToast("Event created successfully!");
      triggerUpdate();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCoordinatorToggle = (profileId) => {
    if (selectedCoordinators.includes(profileId)) {
      // Keep at least one
      if (selectedCoordinators.length > 1) {
        setSelectedCoordinators(selectedCoordinators.filter(id => id !== profileId));
      }
    } else {
      setSelectedCoordinators([...selectedCoordinators, profileId]);
    }
  };

  const handleOpenCreateForm = () => {
    // Pre-select current profile and any ADMIN profiles as default coordinators
    const defaultIds = profiles
      .filter(p => p.role === 'ADMIN' || p.id === currentProfile?.id)
      .map(p => p.id);
    setSelectedCoordinators([...new Set(defaultIds)]);
    setShowCreateForm(true);
  };

  return (
    <div>
      <div className="events-header">
        <div>
          <h2 style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-0.03em' }}>Club Events</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Monthly calendar of actions and services</p>
        </div>
        
        {activeRole === 'ADMIN' && (
          <button className="btn-primary" onClick={handleOpenCreateForm}>
            <Plus size={16} />
            <span>Create Event</span>
          </button>
        )}
      </div>

      {/* Main events listing */}
      <div className="event-list-container">
        {events.length > 0 ? (
          events.map(event => (
            <div 
              key={event.id}
              className="event-card-wide"
              onClick={() => setSelectedEvent(event)}
            >
              <div className="event-card-main">
                <span className={`event-tag ${event.tag === 'Ceremony' ? 'tag-ceremony' : event.tag === 'Community Service' ? 'tag-community' : 'tag-professional'}`}>
                  {event.tag}
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginTop: '8px', color: 'var(--text-primary)' }}>
                  {event.title}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '8px 0 16px' }}>
                  {event.description.length > 120 ? `${event.description.substring(0, 120)}...` : event.description}
                </p>
                
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  <div className="event-meta-row">
                    <Calendar size={14} />
                    <span>{new Date(event.startTime).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  </div>
                  <div className="event-meta-row">
                    <Clock size={14} />
                    <span>
                      {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(event.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="event-meta-row">
                    <MapPin size={14} />
                    <span>{event.venue}</span>
                  </div>
                </div>
              </div>
              
              <div className="btn-secondary" style={{ borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
                <ArrowRight size={16} />
              </div>
            </div>
          ))
        ) : (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '32px' }}>No events logged.</p>
        )}
      </div>

      {/* Create Event Modal Form */}
      {showCreateForm && (
        <div className="modal-overlay">
          <div className="modal-content liquid-glass-card slide-up">
            <div className="modal-close-btn" onClick={() => setShowCreateForm(false)}>✕</div>
            
            <h3 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '20px' }}>Create Club Event</h3>
            
            {error && <div style={{ color: 'var(--error-color)', fontSize: '13px', marginBottom: '12px' }}>{error}</div>}
            
            <form onSubmit={handleCreateEvent} className="onboarding-form">
              <div className="form-group">
                <label>EVENT TITLE *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Beach Cleanup Drive" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group">
                <label>DESCRIPTION</label>
                <textarea 
                  className="form-input" 
                  style={{ minHeight: '80px', resize: 'vertical' }}
                  placeholder="Provide detail schedules..." 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label>START TIME *</label>
                  <input 
                    type="datetime-local" 
                    className="form-input" 
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>END TIME *</label>
                  <input 
                    type="datetime-local" 
                    className="form-input" 
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label>VENUE *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Versova beach gate 2" 
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group">
                <label>EVENT CATEGORY</label>
                <select 
                  className="form-input" 
                  value={tag} 
                  onChange={(e) => setTag(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="Ceremony">Ceremony</option>
                  <option value="Community Service">Community Service</option>
                  <option value="Professional Dev">Professional Dev</option>
                </select>
              </div>

              {/* Multi-select Event Leaders (Coordinators) */}
              <div className="form-group">
                <label>ASSIGN LEADERS / COORDINATORS *</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'var(--bg-primary)', padding: '12px', borderRadius: '12px', maxHeight: '120px', overflowY: 'auto', border: '1px solid var(--border-color)' }}>
                  {profiles.map(p => (
                    <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedCoordinators.includes(p.id)}
                        onChange={() => handleCoordinatorToggle(p.id)}
                        style={{ accentColor: 'var(--accent-color)' }}
                      />
                      <span>{p.name} ({p.rotaractId})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>GOOGLE RULEBOOK LINK</label>
                <input 
                  type="url" 
                  className="form-input" 
                  placeholder="https://drive.google.com/..." 
                  value={rulebookUrl}
                  onChange={(e) => setRulebookUrl(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>ONLINE MEET LINK</label>
                <input 
                  type="url" 
                  className="form-input" 
                  placeholder="https://meet.google.com/..." 
                  value={meetLink}
                  onChange={(e) => setMeetLink(e.target.value)}
                />
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: '16px' }}>
                Create Event
              </button>
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

export default EventsView;
