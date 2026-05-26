import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { taskService } from '../services/taskService';
import { format, isBefore, parseISO } from 'date-fns';

const TaskContext = createContext();

export function useTasks() {
  return useContext(TaskContext);
}

const STORAGE_NOTIFIED_KEY = 'calendar-notified-tasks';

export function TaskProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [notifications, setNotifications] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('calendar-inapp-notifications')) || [];
    } catch {
      return [];
    }
  });
  const [unreadCount, setUnreadCount] = useState(0);

  // Keep track of notified task IDs to prevent duplicate alerts
  const notifiedIdsRef = useRef(new Set());

  const { getToken, isSignedIn } = useAuth();

  // Load notified IDs from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_NOTIFIED_KEY);
      if (stored) {
        const arr = JSON.parse(stored);
        notifiedIdsRef.current = new Set(arr);
      }
    } catch (e) {
      console.error('Failed to parse notified task IDs', e);
    }
  }, []);

  // Save in-app notifications to localStorage
  useEffect(() => {
    localStorage.setItem('calendar-inapp-notifications', JSON.stringify(notifications));
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

  // Request browser notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch (err) {
        console.error('Error requesting notification permission:', err);
      }
    }
  }, []);

  // Show a glassmorphic floating toast notification
  const showToast = useCallback((title, type = 'info', description = '') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, title, type, description }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  // Fetch tasks for a given date range
  const fetchTasks = useCallback(async (startDate, endDate) => {
    if (!isSignedIn) return;
    setLoading(true);
    try {
      const token = await getToken();
      const params = {};
      if (startDate) params.startDate = typeof startDate === 'string' ? startDate : format(startDate, 'yyyy-MM-dd');
      if (endDate) params.endDate = typeof endDate === 'string' ? endDate : format(endDate, 'yyyy-MM-dd');
      
      const data = await taskService.getTasks(token, params);
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      showToast('Error', 'error', 'Could not load tasks.');
    } finally {
      setLoading(false);
    }
  }, [isSignedIn, getToken, showToast]);

  // Add a task
  const addTask = useCallback(async (taskData) => {
    if (!isSignedIn) return null;
    try {
      const token = await getToken();
      const newTask = await taskService.createTask(token, taskData);
      setTasks(prev => [...prev, newTask].sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return (b.priorityWeight || 0) - (a.priorityWeight || 0);
      }));
      showToast('Task Created', 'success', `"${newTask.title}" has been scheduled.`);
      return newTask;
    } catch (error) {
      console.error('Failed to create task:', error);
      showToast('Error', 'error', 'Failed to create task.');
      return null;
    }
  }, [isSignedIn, getToken, showToast]);

  // Update a task (with optimistic updates)
  const updateTask = useCallback(async (id, updates) => {
    if (!isSignedIn) return null;
    
    // Save original state for rolling back if API fails
    let originalTasks = [];
    setTasks(prev => {
      originalTasks = [...prev];
      return prev.map(t => t._id === id ? { ...t, ...updates } : t);
    });

    try {
      const token = await getToken();
      const updated = await taskService.updateTask(token, id, updates);
      
      // If the task was recurring and completed, it will trigger spawning of next recurrence.
      // We should re-fetch to capture the newly generated task!
      if (updates.completed && updated.recurring === 'none') {
        // Fetch tasks again to pull the new scheduled recurrence task
        // We can do this slightly deferred so database finishes write
        setTimeout(() => {
          // If we have range context, we would fetch that. For now, fetch tasks around current tasks range
          const dates = tasks.map(t => t.date).sort();
          if (dates.length > 0) {
            fetchTasks(dates[0], dates[dates.length - 1]);
          } else {
            fetchTasks();
          }
        }, 500);
      } else {
        setTasks(prev => prev.map(t => t._id === id ? updated : t));
      }

      showToast('Task Updated', 'success', `Changes saved.`);
      return updated;
    } catch (error) {
      console.error('Failed to update task:', error);
      setTasks(originalTasks);
      showToast('Error', 'error', 'Failed to update task.');
      return null;
    }
  }, [isSignedIn, getToken, tasks, fetchTasks, showToast]);

  // Delete a task (with optimistic updates)
  const deleteTask = useCallback(async (id) => {
    if (!isSignedIn) return false;

    let originalTasks = [];
    setTasks(prev => {
      originalTasks = [...prev];
      return prev.filter(t => t._id !== id);
    });

    try {
      const token = await getToken();
      await taskService.deleteTask(token, id);
      showToast('Task Deleted', 'info', 'Task has been removed.');
      return true;
    } catch (error) {
      console.error('Failed to delete task:', error);
      setTasks(originalTasks);
      showToast('Error', 'error', 'Failed to delete task.');
      return false;
    }
  }, [isSignedIn, getToken, showToast]);

  // Handle in-app notifications
  const markNotificationAsRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Reminder checking effect (polling)
  useEffect(() => {
    if (!isSignedIn || tasks.length === 0) return;

    const checkReminders = () => {
      const now = new Date();

      tasks.forEach(task => {
        if (task.completed || !task.reminderTime || notifiedIdsRef.current.has(task._id)) return;

        const reminderDate = new Date(task.reminderTime);

        // If reminderTime is past or now (within a 5 minute tolerance window to avoid old reminders spamming on login)
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
        if (isBefore(reminderDate, now) && reminderDate > fiveMinutesAgo) {
          // Trigger reminder!
          notifiedIdsRef.current.add(task._id);
          localStorage.setItem(STORAGE_NOTIFIED_KEY, JSON.stringify(Array.from(notifiedIdsRef.current)));

          const notificationTitle = `Reminder: ${task.title}`;
          const notificationBody = task.description || `Task scheduled for date: ${task.date}`;

          // 1. Browser Notification
          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification(notificationTitle, {
                body: notificationBody,
                tag: task._id
              });
            } catch (err) {
              console.error('Browser Notification error:', err);
            }
          }

          // 2. In-App Notification Center
          const newNotification = {
            id: Date.now().toString() + Math.random().toString().substr(2, 5),
            taskId: task._id,
            title: notificationTitle,
            body: notificationBody,
            date: task.date,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: false
          };
          setNotifications(prev => [newNotification, ...prev]);

          // 3. In-App Toast
          showToast(notificationTitle, 'warning', notificationBody);
        }
      });
    };

    // Run check immediately and then every 20 seconds
    checkReminders();
    const interval = setInterval(checkReminders, 20000);

    return () => clearInterval(interval);
  }, [isSignedIn, tasks, showToast]);

  return (
    <TaskContext.Provider
      value={{
        tasks,
        loading,
        toasts,
        notifications,
        unreadCount,
        fetchTasks,
        addTask,
        updateTask,
        deleteTask,
        showToast,
        markNotificationAsRead,
        clearNotifications,
        requestNotificationPermission
      }}
    >
      {children}

      {/* Floating Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto p-4 rounded-xl shadow-lg border backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-5 flex flex-col gap-0.5
              ${t.type === 'success' ? 'bg-emerald-500/90 border-emerald-500 text-white shadow-emerald-500/20' : ''}
              ${t.type === 'error' ? 'bg-rose-500/90 border-rose-500 text-white shadow-rose-500/20' : ''}
              ${t.type === 'warning' ? 'bg-amber-500/90 border-amber-500 text-white shadow-amber-500/20' : ''}
              ${t.type === 'info' ? 'bg-stone-900/90 border-stone-800 text-stone-100 shadow-black/30' : ''}
            `}
          >
            <h4 className="font-bold text-sm leading-tight">{t.title}</h4>
            {t.description && <p className="text-xs opacity-90 leading-tight mt-0.5">{t.description}</p>}
          </div>
        ))}
      </div>
    </TaskContext.Provider>
  );
}
