import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  initDb, 
  authService, 
  paymentService, 
  eventService, 
  taskService, 
  noticeService, 
  notificationService,
  fetchEvents,
  fetchMyAttendance,
  fetchAllAttendance,
  fetchTasks,
  fetchNotices,
  fetchNotifications,
  getUsers,
  getProfiles,
  getAttendance,
  getPreApprovedList
} from '../data/mockDb.js';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [activeRole, setActiveRole] = useState('MEMBER'); 
  const [activeTab, setActiveTab] = useState('home'); 
  
  const [accentColor, setAccentColor] = useState('#d91c5c');
  const [theme, setTheme] = useState('light');
  
  const [dbTrigger, setDbTrigger] = useState(0);

  // Async DB States
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [notices, setNotices] = useState([]);
  const [userNotifications, setUserNotifications] = useState([]);
  const [payments, setPayments] = useState([]);
  const [myAttendance, setMyAttendance] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [pendingAttendance, setPendingAttendance] = useState([]);
  const [users, setUsers] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [preApprovedList, setPreApprovedList] = useState([]);

  useEffect(() => {
    initDb();
    const session = authService.getCurrentSession();
    if (session) {
      setCurrentUser(session.user);
      setCurrentProfile(session.profile);
      setActiveRole(session.user.role);
    }
    
    const storedAccent = localStorage.getItem('hr_accent');
    if (storedAccent) setAccentColor(storedAccent);
    
    const storedTheme = localStorage.getItem('hr_theme') || 'light';
    setTheme(storedTheme);
    document.documentElement.setAttribute('data-theme', storedTheme);
  }, []);

  // Fetch data asynchronously when user logs in or trigger fires
  useEffect(() => {
    const loadData = async () => {
      if (!currentUser) return;
      try {
        const ev = await fetchEvents();
        setEvents(ev || []);
        
        const att = await fetchMyAttendance();
        setMyAttendance(att || []);
        
        const ts = await fetchTasks();
        setTasks(ts || []);
        
        const nt = await fetchNotices();
        setNotices(nt || []);
        
        const notifs = await fetchNotifications();
        setUserNotifications(notifs || []);
        
        if (activeRole === 'TREASURER' || activeRole === 'ADMIN') {
          const pending = await paymentService.getPendingPayments();
          setPayments(pending || []);
          
          const allAtt = await fetchAllAttendance();
          setAttendance(allAtt || []);

          if (activeRole === 'ADMIN') {
            const pendingAtt = await eventService.getPendingAttendanceRequests();
            setPendingAttendance(pendingAtt || []);
          }
        } else {
          const dues = await paymentService.getMemberDues();
          setPayments(dues ? [dues] : []);
        }
        
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };
    loadData();
  }, [currentUser, dbTrigger, activeRole]);

  const triggerUpdate = () => {
    setDbTrigger(prev => prev + 1);
  };

  const login = async (emailOrRid, password) => {
    try {
      const session = await authService.login(emailOrRid, password);
      setCurrentUser(session.user);
      setCurrentProfile(session.profile);
      setActiveRole(session.user.role);
      setActiveTab('home');
      return session;
    } catch (err) {
      throw err;
    }
  };

  const logout = () => {
    authService.logout();
    setCurrentUser(null);
    setCurrentProfile(null);
    setActiveTab('home');
  };

  const registerMember = async (regData) => {
    try {
      return await authService.submitRegisterDetails(regData);
    } catch (err) {
      throw err;
    }
  };

  const getPendingApprovals = async () => {
    return await authService.getPendingApprovals();
  };

  const approveUser = async (userId, action) => {
    await authService.approveUser(userId, action);
    triggerUpdate();
  };

  const updateProfile = async (profileId, userId, data) => {
    await authService.updateProfile(profileId, userId, data);
    triggerUpdate();
  };

  const swapRole = async (role) => {
    try {
      if (role === 'ADMIN') {
        await login('admin@rotaract.org', 'password123');
      } else if (role === 'TREASURER') {
        await login('treasurer@rotaract.org', 'password123');
      } else {
        await login('member@rotaract.org', 'password123');
      }
      triggerUpdate();
    } catch (err) {
      alert('Failed to switch sandbox role. Make sure the database is seeded.');
    }
  };

  const changeAccent = (color) => {
    setAccentColor(color);
    localStorage.setItem('hr_accent', color);
    
    let hex = color.replace('#', '');
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
    
    document.documentElement.style.setProperty('--accent-color', color);
    document.documentElement.style.setProperty('--accent-rgb', `${r}, ${g}, ${b}`);
  };

  const toggleTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('hr_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const deleteTask = async (taskId) => {
    try {
      await taskService.deleteTask(taskId);
      triggerUpdate();
    } catch (err) {
      alert(err.message);
    }
  };

  const markNotificationsAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      triggerUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      currentProfile,
      activeRole,
      activeTab,
      setActiveTab,
      accentColor,
      changeAccent,
      theme,
      toggleTheme,
      swapRole,
      login,
      logout,
      registerMember,
      deleteTask,
      markNotificationsAsRead,
      userNotifications,
      dbTrigger,
      triggerUpdate,
      events,
      myAttendance,
      tasks,
      notices,
      attendance,
      pendingAttendance,
      payments,
      users,
      profiles,
      preApprovedList,
      setTasks,
      getPendingApprovals,
      approveUser,
      updateProfile
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
