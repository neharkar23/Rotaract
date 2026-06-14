import { apiClient } from './apiClient.js';

export const initDb = () => {
  // No-op: API replaces local DB initialization
};

export const authService = {
  login: async (emailOrRid, password) => {
    const data = await apiClient.post('/auth/login', { emailOrRid, password });
    localStorage.setItem('hr_session', JSON.stringify(data));
    return data;
  },
  getCurrentSession: () => {
    try {
      const sessionStr = localStorage.getItem('hr_session');
      if (!sessionStr) return null;
      const data = JSON.parse(sessionStr);
      // Validate structure to prevent crashes from old data
      if (!data || !data.user) {
        localStorage.removeItem('hr_session');
        return null;
      }
      return data;
    } catch (e) {
      localStorage.removeItem('hr_session');
      return null;
    }
  },
  logout: () => {
    localStorage.removeItem('hr_session');
  },
  submitRegisterDetails: async (regData) => {
    return await apiClient.post('/auth/register', regData);
  },
  getPendingApprovals: async () => {
    const data = await apiClient.get('/auth/admin/approvals');
    return (data.pendingApprovals || []).map(a => ({
      id: a.profile.id,
      name: a.profile.name,
      email: a.user.email,
      rotaractId: a.profile.rotaract_id
    }));
  },
  approveUser: async (userId, action) => {
    return await apiClient.post('/auth/admin/approve', { userId, action });
  },
  updateProfile: async (profileId, userId, { name, phone, avatarUrl }) => {
    return await apiClient.patch('/auth/profile', { name, phone, avatarUrl });
  }
};

export const paymentService = {
  getMemberDues: async () => {
    const data = await apiClient.get('/payments/me');
    return data.payments && data.payments.length > 0 ? data.payments[0] : null;
  },
  submitPaymentProof: async (profileId, transactionRef, screenshotUrl) => {
    return await apiClient.post('/payments/submit', { transactionRef, screenshotUrl });
  },
  getPendingPayments: async () => {
    const data = await apiClient.get('/payments/pending');
    // Map to expected structure { payment, profile }
    return data.pendingPayments.map(p => {
      const { hr_profiles, ...paymentData } = p;
      return { payment: paymentData, profile: hr_profiles };
    });
  },
  verifyPayment: async (paymentId, isApproved, rejectionRemarks = '') => {
    return await apiClient.post('/payments/verify', { paymentId, isApproved, rejectionRemarks });
  }
};

export const eventService = {
  createEvent: async (eventData) => {
    return await apiClient.post('/events', eventData);
  },
  markAttendance: async (eventId, profileId) => {
    return await apiClient.post(`/events/${eventId}/attendance`, { profileId });
  },
  unmarkAttendance: async (eventId, profileId) => {
    return await apiClient.delete(`/events/${eventId}/attendance/${profileId}`);
  },
  getAttendanceForEvent: async (eventId) => {
    const data = await apiClient.get(`/events/${eventId}/attendance`);
    return data.attendance;
  },
  applyForAttendance: async (eventId, profileId, proofImage) => {
    return await apiClient.post(`/events/${eventId}/attendance/apply`, { profileId, proofImage });
  },
  getPendingAttendanceRequests: async () => {
    const data = await apiClient.get('/events/attendance/pending');
    return data.requests;
  },
  verifyAttendanceRequest: async (requestId, isApproved) => {
    return await apiClient.post(`/events/attendance/verify/${requestId}`, { isApproved });
  }
};

export const taskService = {
  createTask: async (taskData) => {
    return await apiClient.post('/tasks', taskData);
  },
  updateTaskStatus: async (taskId, newStatus) => {
    return await apiClient.patch(`/tasks/${taskId}/status`, { status: newStatus });
  },
  deleteTask: async (taskId) => {
    return await apiClient.delete(`/tasks/${taskId}`);
  }
};

export const noticeService = {
  createNotice: async (noticeData) => {
    return await apiClient.post('/notices', noticeData);
  }
};

export const notificationService = {
  markAllAsRead: async () => {
    return await apiClient.patch('/notifications/read');
  }
};

// Async Getters
export const fetchEvents = async () => {
  const data = await apiClient.get('/events');
  return data.events;
};
export const fetchMyAttendance = async () => {
  const data = await apiClient.get('/events/attendance/me');
  return data.attendance;
};
export const fetchAllAttendance = async () => {
  const data = await apiClient.get('/events/attendance/all');
  return data.attendance;
};
export const fetchTasks = async () => {
  const data = await apiClient.get('/tasks');
  return (data.tasks || []).map(t => ({
    ...t,
    assignedTo: t.assigned_to,
    createdBy: t.created_by,
    startDate: t.start_date,
    endDate: t.end_date
  }));
};
export const fetchNotices = async () => {
  const data = await apiClient.get('/notices');
  return data.notices;
};
export const fetchNotifications = async () => {
  const data = await apiClient.get('/notifications');
  return data.notifications;
};

// Fallback dummy sync getters to prevent immediate crash during refactor
export const getEvents = () => [];
export const getTasks = () => [];
export const getNotices = () => [];
export const getAttendance = () => [];
export const getPayments = () => [];
export const getUsers = () => [];
export const getProfiles = () => [];
export const getPreApprovedList = () => [];
export const getNotifications = () => [];
