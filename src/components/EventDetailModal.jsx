import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Calendar, Clock, MapPin, Share2, BookOpen, Video, FileText, Upload, Download, ArrowLeft, X, CheckCircle } from 'lucide-react';
import InitialsAvatar from './InitialsAvatar';
import ReportGenerator from './ReportGenerator';
import { eventService } from '../data/mockDb';

const EventDetailModal = ({ event, onClose }) => {
  const { profiles, currentProfile, activeRole, myAttendance } = useApp();
  
  const [showReportBuilder, setShowReportBuilder] = useState(false);
  const [showAttendanceProof, setShowAttendanceProof] = useState(false);
  const [images, setImages] = useState([]);
  const [attendanceImage, setAttendanceImage] = useState(null);
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);
  const reportRef = useRef();
  
  if (!event) return null;

  // Resolve coordinators list (assigned leaders profiles)
  const coordinatorsList = profiles.filter(
    p => event.coordinators && event.coordinators.includes(p.id)
  );
  
  // Fallback if none assigned
  const fallbackProfile = profiles.find(p => p.id === event.createdBy) || profiles[0];
  const organizers = coordinatorsList.length > 0 
    ? coordinatorsList 
    : fallbackProfile ? [fallbackProfile] : [];

  // Fetch Attendance when Report Builder opens
  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const att = await eventService.getAttendanceForEvent(event.id);
        if (att) setAttendanceCount(att.length);
      } catch (err) {
        console.error("Failed to fetch attendance", err);
      }
    };
    if (showReportBuilder) {
      fetchAttendance();
    }
  }, [showReportBuilder, event.id]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: event.description,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(`${event.title}\n${event.description}\nVenue: ${event.venue}`);
      alert('Event details copied to clipboard!');
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    // Convert files to base64 data URLs for immediate use
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImages(prev => [...prev, event.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (indexToRemove) => {
    setImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleDownloadReport = async () => {
    if (!reportRef.current) return;
    setIsGenerating(true);
    try {
      await reportRef.current.generatePDF();
    } catch (err) {
      alert("Failed to generate PDF report.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAttendanceProofUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setAttendanceImage(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  const submitAttendanceProof = async () => {
    if (!attendanceImage) return alert('Please upload an image for proof.');
    setIsSubmittingProof(true);
    try {
      await eventService.applyForAttendance(event.id, currentProfile.id, attendanceImage);
      alert('Attendance proof submitted! Waiting for admin verification.');
      setShowAttendanceProof(false);
      setAttendanceImage(null);
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Failed to submit proof.');
    } finally {
      setIsSubmittingProof(false);
    }
  };

  const hasAttended = myAttendance.some(a => a.event_id === event.id || a.eventId === event.id);
  const canApplyAttendance = !hasAttended && activeRole === 'MEMBER';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content liquid-glass-card slide-up" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div className="modal-close-btn" onClick={onClose}>✕</div>
        
        {/* REPORT BUILDER VIEW */}
        {showReportBuilder ? (
          <div className="event-details-popup">
            <button 
              className="btn-secondary" 
              onClick={() => setShowReportBuilder(false)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', border: 'none', background: 'transparent', padding: '0', marginBottom: '20px', color: 'var(--text-secondary)' }}
            >
              <ArrowLeft size={16} /> Back to Event
            </button>
            
            <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '4px' }}>Generate Report</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px' }}>Compile event data into a beautiful PDF.</p>
            
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label>TOTAL ATTENDANCE</label>
              <input 
                type="number" 
                className="form-input" 
                value={attendanceCount} 
                onChange={(e) => setAttendanceCount(parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label>UPLOAD EVENT IMAGES</label>
              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', border: '2px dashed var(--border-color)', borderRadius: '12px', cursor: 'pointer', background: 'var(--bg-primary)' }}>
                <Upload size={24} style={{ color: 'var(--text-secondary)', marginBottom: '8px' }} />
                <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500' }}>Click to upload images</span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>JPG, PNG</span>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  onChange={handleImageUpload}
                />
              </label>
            </div>

            {images.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block', letterSpacing: '0.05em' }}>SELECTED IMAGES ({images.length})</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {images.map((img, i) => (
                    <div key={i} style={{ position: 'relative', paddingTop: '100%', borderRadius: '8px', overflow: 'hidden' }}>
                      <img src={img} alt={`upload-${i}`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button 
                        onClick={() => removeImage(i)}
                        style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button 
              className="btn-primary" 
              onClick={handleDownloadReport}
              disabled={isGenerating}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <Download size={18} />
              {isGenerating ? 'Generating PDF...' : 'Download PDF Report'}
            </button>

            {/* Hidden component that generates the layout for the PDF */}
            <ReportGenerator 
              ref={reportRef} 
              event={event} 
              organizers={organizers} 
              attendanceCount={attendanceCount} 
              images={images} 
            />
          </div>
        ) : (
          /* STANDARD EVENT DETAILS VIEW */
          <div className="event-details-popup">
            <span className={`event-tag ${event.tag === 'Ceremony' ? 'tag-ceremony' : event.tag === 'Community Service' ? 'tag-community' : 'tag-professional'}`}>
              {event.tag}
            </span>
            <h3>{event.title}</h3>
            
            <p className="description">{event.description || 'No description provided.'}</p>
            
            <div className="info-section">
              <div className="info-item">
                <Calendar size={18} />
                <span>{new Date(event.startTime).toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div className="info-item">
                <Clock size={18} />
                <span>
                  {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(event.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="info-item">
                <MapPin size={18} />
                <span>{event.venue}</span>
              </div>
            </div>
            
            {/* Leadership & Contact Section (Multiple coordinator profiles) */}
            <div className="leadership-contact">
              <h5>EVENT LEADERS / COORDINATORS</h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                {organizers.map(organizer => (
                  <div key={organizer.id} className="contact-person" style={{ background: 'var(--bg-primary)', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <InitialsAvatar name={organizer.name} size={40} />
                    <div className="contact-person-info">
                      <h6>{organizer.name}</h6>
                      <p>{organizer.isBOD ? 'Board Member' : 'Club Member'} • {organizer.rotaractId}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick links Grid (Refined alignments, removed Register Now) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
              
              {/* Report Generation Full CTA */}
              {(activeRole === 'ADMIN' || activeRole === 'TREASURER' || organizers.some(o => o.id === currentProfile?.id)) && (
                <button 
                  className="btn-primary" 
                  onClick={() => setShowReportBuilder(true)}
                  style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px', borderRadius: '12px' }}
                >
                  <FileText size={16} />
                  <span>Generate Event Report</span>
                </button>
              )}

              {/* Apply For Attendance */}
              {canApplyAttendance && (
                showAttendanceProof ? (
                  <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', marginTop: '8px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Submit Attendance Proof</h4>
                    
                    {!attendanceImage ? (
                      <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px', border: '2px dashed var(--border-color)', borderRadius: '8px', cursor: 'pointer', background: 'var(--bg-primary)' }}>
                        <Upload size={20} style={{ color: 'var(--text-secondary)', marginBottom: '8px' }} />
                        <span style={{ fontSize: '12px', color: 'var(--text-primary)' }}>Upload Photo Evidence</span>
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAttendanceProofUpload} />
                      </label>
                    ) : (
                      <div style={{ position: 'relative', width: '100%', height: '120px', borderRadius: '8px', overflow: 'hidden', marginBottom: '12px' }}>
                        <img src={attendanceImage} alt="proof" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button 
                          onClick={() => setAttendanceImage(null)}
                          style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <button className="btn-primary" style={{ flex: 1, padding: '8px', fontSize: '12px' }} onClick={submitAttendanceProof} disabled={isSubmittingProof || !attendanceImage}>
                        {isSubmittingProof ? 'Submitting...' : 'Submit Proof'}
                      </button>
                      <button className="btn-secondary" style={{ padding: '8px', fontSize: '12px' }} onClick={() => { setShowAttendanceProof(false); setAttendanceImage(null); }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    className="btn-primary" 
                    onClick={() => setShowAttendanceProof(true)}
                    style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px', borderRadius: '12px', background: 'var(--accent-color)', color: 'white' }}
                  >
                    <CheckCircle size={16} />
                    <span>Apply for Attendance</span>
                  </button>
                )
              )}

              {/* Sibling secondary row */}
              <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                <button 
                  className="btn-secondary" 
                  onClick={handleShare}
                  style={{ flex: 1, border: '1px solid var(--border-color)', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px', borderRadius: '12px' }}
                >
                  <Share2 size={15} />
                  <span>Share Event</span>
                </button>

                {event.googleRulebookUrl && (
                  <button 
                    className="btn-secondary" 
                    onClick={() => window.open(event.googleRulebookUrl, '_blank')}
                    style={{ flex: 1, border: '1px solid var(--border-color)', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px', borderRadius: '12px' }}
                  >
                    <BookOpen size={15} />
                    <span>Rulebook</span>
                  </button>
                )}
              </div>

              {/* Bottom full CTA */}
              {event.meetLink && (
                <button 
                  className="btn-secondary" 
                  onClick={() => window.open(event.meetLink, '_blank')}
                  style={{ width: '100%', border: '1px solid var(--border-color)', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px', borderRadius: '12px' }}
                >
                  <Video size={16} />
                  <span>Join Online Meeting</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventDetailModal;
