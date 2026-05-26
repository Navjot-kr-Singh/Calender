import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import CalendarGrid from './CalendarGrid';
import NotesSection from './NotesSection';
import HeroImage from './HeroImage';
import Navbar from '../Navbar';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function WallCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(null);
  const [events, setEvents] = useState([]);
  const { getToken, isSignedIn } = useAuth();

  const fetchEvents = async () => {
    if (!isSignedIn) return;
    try {
      const token = await getToken();
      const response = await axios.get(`${API_URL}/events`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEvents(response.data);
    } catch (error) {
      console.error("Failed to fetch events:", error);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [isSignedIn]);

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col font-sans tracking-normal">
      <Navbar />
      
      <div className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex items-start justify-center">
        <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-calendar w-full max-w-6xl flex flex-col md:flex-row overflow-hidden border border-stone-200/60 dark:border-stone-700/60 ring-1 ring-black/5 dark:ring-white/5">
          
          {/* Left pane: Hero Image & Monthly Context */}
          <div className="w-full md:w-1/3 lg:w-[35%] flex-shrink-0 bg-stone-50 dark:bg-stone-800 border-r border-stone-200 dark:border-stone-700">
            <HeroImage currentMonth={currentDate} />
            
            <div className="hidden md:block p-8">
              <h3 className="text-xl font-serif text-stone-800 dark:text-stone-100 mb-2">Moments & Memories</h3>
              <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed">
                Capture your month. Select dates on the calendar to pinpoint specific moments, or write general thoughts in your notes section.
              </p>
            </div>
          </div>

          {/* Right pane: Calendar Grid + Notes */}
          <div className="w-full md:w-2/3 lg:w-[65%] flex flex-col lg:flex-row">
            
            {/* Calendar Grid Area */}
            <div className="w-full lg:w-3/5">
              <CalendarGrid 
                currentDate={currentDate} 
                setCurrentDate={setCurrentDate}
                startDate={startDate}
                setStartDate={setStartDate}
                endDate={endDate}
                setEndDate={setEndDate}
                events={events}
              />
            </div>

            {/* Notes Area */}
            <div className="w-full lg:w-2/5">
               <NotesSection 
                  currentDate={currentDate}
                  startDate={startDate}
                  endDate={endDate}
                  events={events}
               />
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
