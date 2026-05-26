import React, { useState, useRef, useEffect } from 'react';
import { UserButton } from '@clerk/clerk-react';
import { Calendar, LayoutGrid, UserRound, Bell, BarChart3, Trash2, Check } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useTasks } from '../context/TaskContext';
import calendarImg from '../assets/calendar.png';

const Navbar = () => {
  const [showNotif, setShowNotif] = useState(false);
  const { 
    notifications, 
    unreadCount, 
    markNotificationAsRead, 
    clearNotifications, 
    requestNotificationPermission 
  } = useTasks();
  const notifRef = useRef(null);

  // Close notifications panel when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotif(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="w-full bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 px-6 py-2 flex items-center justify-between z-40 relative transition-colors">
      {/* Left: Logo Section */}
      <NavLink to="/" className="flex flex-col items-start leading-none group">
        <h1 className="text-xl font-bold text-[#1e4eb8] dark:text-blue-400 mb-0" style={{ fontFamily: 'Fredoka, sans-serif' }}>
          Calendra
        </h1>
        <img 
          src={calendarImg} 
          alt="Calendra Logo" 
          className="h-8 w-auto -mt-1 transition-transform group-hover:scale-110"
        />
      </NavLink>

      {/* Middle: Navigation Items */}
      <div className="flex items-center gap-1 sm:gap-2">
        <NavItem 
          to="/schedule"
          icon={<LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />} 
          label="My Schedule" 
        />
        <NavItem 
          to="/events"
          icon={<Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />} 
          label="My Events" 
        />
        <NavItem 
          to="/dashboard"
          icon={<BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" />} 
          label="Dashboard" 
        />
      </div>

      {/* Right: User Profile & Notification Bell */}
      <div className="flex items-center gap-4 relative" ref={notifRef}>
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotif(!showNotif)}
            className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 relative transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotif && (
            <div className="absolute right-0 mt-2 w-80 bg-white/95 dark:bg-stone-900/95 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xl backdrop-blur-md overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
                <h4 className="font-serif font-bold text-stone-800 dark:text-stone-100">Notifications</h4>
                <div className="flex gap-2">
                  {notifications.length > 0 && (
                    <button
                      onClick={clearNotifications}
                      className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded text-stone-400 hover:text-red-500 transition-colors"
                      title="Clear all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Notification list */}
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 px-4 text-center text-xs text-stone-400 dark:text-stone-500">
                    No new notifications.
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationAsRead(n.id)}
                        className={`p-3 border-b border-stone-50 dark:border-stone-800/40 last:border-none flex items-start gap-2.5 cursor-pointer transition-colors hover:bg-stone-50 dark:hover:bg-stone-800/40
                          ${!n.read ? 'bg-blue-50/50 dark:bg-blue-950/10' : ''}
                        `}
                      >
                        <div className="flex-1 flex flex-col gap-0.5">
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-semibold ${!n.read ? 'text-blue-600 dark:text-blue-400' : 'text-stone-500'}`}>
                              {n.title}
                            </span>
                            <span className="text-[10px] text-stone-400">{n.time}</span>
                          </div>
                          <p className="text-xs text-stone-600 dark:text-stone-300 leading-tight">
                            {n.body}
                          </p>
                        </div>
                        {!n.read && (
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5"></div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer / Enable desktop notifications */}
              <div className="p-3 bg-stone-50 dark:bg-stone-800/40 border-t border-stone-100 dark:border-stone-800 text-center">
                {'Notification' in window && Notification.permission !== 'granted' ? (
                  <button
                    onClick={() => {
                      requestNotificationPermission();
                      setShowNotif(false);
                    }}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Enable Desktop Notifications
                  </button>
                ) : (
                  <span className="text-[10px] text-stone-400">Desktop Notifications Enabled</span>
                )}
              </div>
            </div>
          )}
        </div>

        <UserButton 
          afterSignOutUrl="/login"
          appearance={{
            elements: {
              avatarBox: "w-9 h-9 border-2 border-white dark:border-stone-800 shadow-sm"
            }
          }}
        />
      </div>
    </nav>
  );
};

const NavItem = ({ to, icon, label }) => {
  return (
    <NavLink 
      to={to}
      className={({ isActive }) => `
        flex items-center gap-2 px-3 sm:px-5 py-2 rounded-full transition-all cursor-pointer
        ${isActive ? 'bg-blue-50 dark:bg-blue-950/40 shadow-sm' : 'hover:bg-stone-50 dark:hover:bg-stone-800'}
      `}
    >
      {({ isActive }) => (
        <>
          <div className="flex-shrink-0">
            {icon}
          </div>
          <span className={`text-xs sm:text-sm font-bold ${isActive ? 'text-black dark:text-white' : 'text-stone-600 dark:text-stone-400'}`}>
            {label}
          </span>
        </>
      )}
    </NavLink>
  );
};

export default Navbar;
