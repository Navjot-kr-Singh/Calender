import React from 'react';
import { UserButton } from '@clerk/clerk-react';
import { Calendar, LayoutGrid, UserRound } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import calendarImg from '../assets/calendar.png';

const Navbar = () => {
  return (
    <nav className="w-full bg-[#f0f2f5] border-b border-gray-200 px-6 py-2 flex items-center justify-between">
      {/* Left: Logo Section */}
      <NavLink to="/" className="flex flex-col items-start leading-none group">
        <h1 className="text-xl font-bold text-[#1e4eb8] mb-0" style={{ fontFamily: 'Fredoka, sans-serif' }}>
          Calendra
        </h1>
        <img 
          src={calendarImg} 
          alt="Calendra Logo" 
          className="h-8 w-auto -mt-1 transition-transform group-hover:scale-110"
        />
      </NavLink>

      {/* Middle: Navigation Items */}
      <div className="flex items-center gap-2">
        <NavItem 
          to="/events"
          icon={<Calendar className="w-5 h-5 text-blue-600" />} 
          label="My Events" 
        />
        <NavItem 
          to="/schedule"
          icon={<LayoutGrid className="w-5 h-5 text-orange-500" />} 
          label="My Schedule" 
        />
        <NavItem 
          to="/profile"
          icon={<UserRound className="w-5 h-5 text-emerald-500" />} 
          label="Public Profile" 
        />
      </div>

      {/* Right: User Profile */}
      <div className="flex items-center gap-4">
        <UserButton 
          afterSignOutUrl="/login"
          appearance={{
            elements: {
              avatarBox: "w-9 h-9 border-2 border-white shadow-sm"
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
        flex items-center gap-3 px-6 py-2.5 rounded-full transition-all cursor-pointer
        ${isActive ? 'bg-[#e8f0fe] shadow-sm' : 'hover:bg-gray-100'}
      `}
    >
      {({ isActive }) => (
        <>
          <div className="flex-shrink-0">
            {icon}
          </div>
          <span className={`text-sm font-bold ${isActive ? 'text-black' : 'text-gray-700'}`}>
            {label}
          </span>
        </>
      )}
    </NavLink>
  );
};

export default Navbar;
