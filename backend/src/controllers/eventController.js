import { supabase } from '../config/supabase.js';

// In-memory store for pending attendance proofs since we cannot alter the supabase schema directly
let pendingAttendanceRequests = [];

export const getAllEvents = async (req, res, next) => {
  try {
    const { data: events, error } = await supabase
      .from('hr_events')
      .select('*')
      .order('start_time', { ascending: true });

    if (error) throw error;
    
    const mappedEvents = events.map(e => ({
      id: e.id,
      title: e.title,
      description: e.description,
      startTime: e.start_time,
      endTime: e.end_time,
      venue: e.venue,
      tag: e.tag,
      googleRulebookUrl: e.google_rulebook_url,
      meetLink: e.meet_link,
      coordinators: e.coordinators,
      createdBy: e.created_by,
      createdAt: e.created_at
    }));

    res.status(200).json({ events: mappedEvents });
  } catch (err) {
    next(err);
  }
};

export const createEvent = async (req, res, next) => {
  try {
    const { title, description, startTime, endTime, venue, tag, googleRulebookUrl, meetLink, coordinators } = req.body;

    if (!title || !startTime || !endTime || !venue) {
      return res.status(400).json({ error: 'Title, Start Time, End Time, and Venue are required' });
    }

    const { data: newEvent, error } = await supabase
      .from('hr_events')
      .insert({
        title,
        description,
        start_time: startTime,
        end_time: endTime,
        venue,
        tag,
        google_rulebook_url: googleRulebookUrl,
        meet_link: meetLink,
        coordinators: coordinators || [req.user.id],
        created_by: req.user.id
      })
      .select()
      .single();

    if (error) throw error;

    const mappedEvent = {
      id: newEvent.id,
      title: newEvent.title,
      description: newEvent.description,
      startTime: newEvent.start_time,
      endTime: newEvent.end_time,
      venue: newEvent.venue,
      tag: newEvent.tag,
      googleRulebookUrl: newEvent.google_rulebook_url,
      meetLink: newEvent.meet_link,
      coordinators: newEvent.coordinators,
      createdBy: newEvent.created_by,
      createdAt: newEvent.created_at
    };

    res.status(201).json({ message: 'Event created successfully', event: mappedEvent });
  } catch (err) {
    next(err);
  }
};

export const markAttendance = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { profileId } = req.body;

    if (!profileId) {
      return res.status(400).json({ error: 'Profile ID is required' });
    }

    const { data: attendance, error } = await supabase
      .from('hr_attendance')
      .insert({
        event_id: eventId,
        profile_id: profileId,
        attended_by_admin_id: req.user.id
      })
      .select()
      .single();

    if (error) {
      // Postgres unique constraint violation
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Attendance already marked for this user.' });
      }
      throw error;
    }

    // Send notification
    const { data: ev } = await supabase.from('hr_events').select('title').eq('id', eventId).single();
    await supabase.from('hr_notifications').insert({
      profile_id: profileId,
      title: 'Attendance Confirmed',
      content: `Your attendance at "${ev?.title || 'Event'}" has been successfully logged by admin.`
    });

    res.status(200).json({ message: 'Attendance marked', attendance });
  } catch (err) {
    next(err);
  }
};

export const removeAttendance = async (req, res, next) => {
  try {
    const { eventId, profileId } = req.params;

    const { error } = await supabase
      .from('hr_attendance')
      .delete()
      .match({ event_id: eventId, profile_id: profileId });

    if (error) throw error;
    res.status(200).json({ message: 'Attendance removed successfully' });
  } catch (err) {
    next(err);
  }
};

export const getEventAttendance = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    const { data: attendance, error } = await supabase
      .from('hr_attendance')
      .select('*, hr_profiles(name, rotaract_id, avatar_url)')
      .eq('event_id', eventId);

    if (error) throw error;
    res.status(200).json({ attendance });
  } catch (err) {
    next(err);
  }
};

export const getMyAttendance = async (req, res, next) => {
  try {
    const { data: attendance, error } = await supabase
      .from('hr_attendance')
      .select('*')
      .eq('profile_id', req.user.id);

    if (error) throw error;
    res.status(200).json({ attendance });
  } catch (err) {
    next(err);
  }
};

export const getAllAttendance = async (req, res, next) => {
  try {
    const { data: attendance, error } = await supabase
      .from('hr_attendance')
      .select('*');

    if (error) throw error;
    res.status(200).json({ attendance });
  } catch (err) {
    next(err);
  }
};

export const applyForAttendance = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { profileId, proofImage } = req.body;

    if (!profileId || !proofImage) {
      return res.status(400).json({ error: 'Profile ID and proof image are required' });
    }

    // Check if already marked in DB
    const { data: existing } = await supabase
      .from('hr_attendance')
      .select('id')
      .match({ event_id: eventId, profile_id: profileId })
      .single();
    
    if (existing) {
      return res.status(400).json({ error: 'Attendance already verified.' });
    }

    const newRequest = {
      id: `req_${Date.now()}_${Math.floor(Math.random()*1000)}`,
      eventId,
      profileId,
      proofImage,
      submittedAt: new Date().toISOString()
    };

    pendingAttendanceRequests.push(newRequest);

    res.status(201).json({ message: 'Attendance verification request submitted', request: newRequest });
  } catch (err) {
    next(err);
  }
};

export const getPendingAttendanceRequests = async (req, res, next) => {
  try {
    res.status(200).json({ requests: pendingAttendanceRequests });
  } catch (err) {
    next(err);
  }
};

export const verifyAttendanceRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { isApproved } = req.body;

    const requestIndex = pendingAttendanceRequests.findIndex(r => r.id === requestId);
    if (requestIndex === -1) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const request = pendingAttendanceRequests[requestIndex];

    if (isApproved) {
      const { data: attendance, error } = await supabase
        .from('hr_attendance')
        .insert({
          event_id: request.eventId,
          profile_id: request.profileId,
          attended_by_admin_id: req.user.id
        })
        .select()
        .single();

      if (error && error.code !== '23505') {
        throw error;
      }

      // Notification
      const { data: ev } = await supabase.from('hr_events').select('title').eq('id', request.eventId).single();
      await supabase.from('hr_notifications').insert({
        profile_id: request.profileId,
        title: 'Attendance Approved',
        content: `Your attendance proof for "${ev?.title || 'Event'}" was approved by an admin.`
      });
    } else {
      // Rejected
      const { data: ev } = await supabase.from('hr_events').select('title').eq('id', request.eventId).single();
      await supabase.from('hr_notifications').insert({
        profile_id: request.profileId,
        title: 'Attendance Rejected',
        content: `Your attendance proof for "${ev?.title || 'Event'}" was rejected. Please contact an admin if you believe this is an error.`
      });
    }

    // Remove from pending
    pendingAttendanceRequests.splice(requestIndex, 1);

    res.status(200).json({ message: `Attendance request ${isApproved ? 'approved' : 'rejected'}.` });
  } catch (err) {
    next(err);
  }
};
