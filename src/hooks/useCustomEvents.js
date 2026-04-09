import { useState, useEffect } from 'react';

const STORAGE_KEY = 'calendar-custom-events';

function dateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function useCustomEvents() {
  const [events, setEvents] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  }, [events]);

  const addEvent = ({ date, name, color = 'pine' }) => {
    const id = Date.now().toString();
    setEvents(prev => [...prev, { id, date: dateKey(date), name, color }]);
  };

  const removeEvent = (id) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const getEventsForDate = (date) => {
    const key = dateKey(date);
    return events.filter(e => e.date === key);
  };

  return { events, addEvent, removeEvent, getEventsForDate };
}
