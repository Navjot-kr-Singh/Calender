import React, { useState, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, CalendarDays } from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay,
  isToday,
  isWithinInterval,
  isBefore,
  startOfWeek,
  endOfWeek,
  isSaturday,
  isSunday,
} from 'date-fns';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getHoliday } from '../../data/holidays';
import { useCustomEvents } from '../../hooks/useCustomEvents';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const EVENT_COLORS = {
  pine:   { dot: 'bg-pine-500',   badge: 'bg-pine-100 dark:bg-pine-900/40 text-pine-700 dark:text-pine-300' },
  blue:   { dot: 'bg-blue-500',   badge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' },
  purple: { dot: 'bg-purple-500', badge: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300' },
  orange: { dot: 'bg-orange-500', badge: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300' },
};

export default function CalendarGrid({ 
  currentDate, 
  setCurrentDate, 
  startDate, 
  setStartDate, 
  endDate, 
  setEndDate 
}) {
  const [displayDate, setDisplayDate] = useState(currentDate);
  const [animClass, setAnimClass] = useState('');
  const isAnimating = useRef(false);

  // Add-event modal state
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventName, setNewEventName] = useState('');
  const [newEventColor, setNewEventColor] = useState('pine');

  const { addEvent, removeEvent, getEventsForDate } = useCustomEvents();

  // ─── Fixed tooltip (immune to overflow:hidden) ────────────────────────
  const [tooltip, setTooltip] = useState(null); // { text, x, y }

  const showTooltip = useCallback((e, text) => {
    if (!text) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({ text, x: rect.left + rect.width / 2, y: rect.top });
  }, []);

  const hideTooltip = useCallback(() => setTooltip(null), []);

  // ─── Flip animation ───────────────────────────────────────────────────
  const triggerTransition = (newDate, dir) => {
    if (isAnimating.current) return;
    isAnimating.current = true;
    setAnimClass(dir > 0 ? 'grid-exit-left' : 'grid-exit-right');
    setTimeout(() => {
      setDisplayDate(newDate);
      setAnimClass(dir > 0 ? 'grid-enter-right' : 'grid-enter-left');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimClass('grid-active');
          setTimeout(() => { setAnimClass(''); isAnimating.current = false; }, 350);
        });
      });
    }, 250);
  };

  const nextMonth = () => { const d = addMonths(currentDate, 1); setCurrentDate(d); triggerTransition(d, 1); };
  const prevMonth = () => { const d = subMonths(currentDate, 1); setCurrentDate(d); triggerTransition(d, -1); };

  const handleDateClick = (e, day) => {
    if (e.shiftKey && startDate) {
      if (isBefore(day, startDate)) { setEndDate(startDate); setStartDate(day); }
      else setEndDate(day);
    } else {
      setStartDate(day); setEndDate(null);
    }
  };

  const handleAddEvent = (e) => {
    e.preventDefault();
    if (!newEventName.trim() || !newEventDate) return;
    addEvent({ date: new Date(newEventDate + 'T00:00:00'), name: newEventName.trim(), color: newEventColor });
    setNewEventName('');
    setNewEventDate('');
    setNewEventColor('pine');
    setShowAddEvent(false);
  };

  // ─── Calendar data ────────────────────────────────────────────────────
  const monthStart = startOfMonth(displayDate);
  const monthEnd   = endOfMonth(monthStart);
  const daysInMonth = eachDayOfInterval({
    start: startOfWeek(monthStart),
    end:   endOfWeek(monthEnd),
  });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <>
      <style>{`
        .calendar-grid-wrap { perspective: 1000px; overflow: hidden; }
        .calendar-grid {
          transition: transform 0.28s cubic-bezier(0.4,0,0.2,1), opacity 0.28s cubic-bezier(0.4,0,0.2,1);
          transform-origin: center center;
          transform: rotateY(0deg) scale(1); opacity: 1; will-change: transform,opacity;
        }
        .grid-exit-left  { transform: rotateY(-30deg) scale(0.92) translateX(-8%); opacity: 0; }
        .grid-exit-right { transform: rotateY( 30deg) scale(0.92) translateX( 8%); opacity: 0; }
        .grid-enter-right { transition: none !important; transform: rotateY(30deg) scale(0.92) translateX(8%); opacity: 0; }
        .grid-enter-left  { transition: none !important; transform: rotateY(-30deg) scale(0.92) translateX(-8%); opacity: 0; }
        .grid-active { transform: rotateY(0deg) scale(1) translateX(0); opacity: 1; }
      `}</style>

      {/* ── Fixed tooltip portal (never clipped) ── */}
      {tooltip && (
        <div
          style={{
            position: 'fixed',
            left: tooltip.x,
            top: tooltip.y - 8,
            transform: 'translate(-50%, -100%)',
            zIndex: 9999,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            background: '#1c1917',
            color: '#f5f5f4',
            fontSize: '11px',
            fontWeight: 500,
            padding: '4px 10px',
            borderRadius: '6px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          }}
        >
          {tooltip.text}
        </div>
      )}

      <div className="p-6 md:p-8 flex flex-col h-full bg-white dark:bg-stone-900 z-10 w-full relative drop-shadow-sm min-h-[400px]">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-serif font-semibold text-stone-800 dark:text-stone-100">
              {format(displayDate, 'MMMM yyyy')}
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => { setShowAddEvent(v => !v); setNewEventDate(format(startDate || new Date(), 'yyyy-MM-dd')); }}
              className="p-2 rounded-full hover:bg-pine-100 dark:hover:bg-pine-900/40 transition-colors text-pine-600 dark:text-pine-400 active:scale-95"
              title="Add custom event"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button onClick={prevMonth} className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 active:scale-95" aria-label="Previous month">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={nextMonth} className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 active:scale-95" aria-label="Next month">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Add Event Panel ── */}
        {showAddEvent && (
          <div className="mb-4 p-3 rounded-xl border border-pine-200 dark:border-pine-800 bg-pine-50 dark:bg-pine-950/30 flex flex-col gap-2 animate-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-pine-700 dark:text-pine-300 flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" /> Add Event
              </span>
              <button onClick={() => setShowAddEvent(false)} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddEvent} className="flex flex-col gap-2">
              <input
                type="text"
                value={newEventName}
                onChange={e => setNewEventName(e.target.value)}
                placeholder="Event name..."
                className="px-3 py-1.5 text-sm bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-md focus:outline-none focus:ring-1 focus:ring-pine-400 text-stone-700 dark:text-stone-300"
              />
              <input
                type="date"
                value={newEventDate}
                onChange={e => setNewEventDate(e.target.value)}
                className="px-3 py-1.5 text-sm bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-md focus:outline-none focus:ring-1 focus:ring-pine-400 text-stone-700 dark:text-stone-300"
              />
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-500 dark:text-stone-400">Color:</span>
                {Object.entries(EVENT_COLORS).map(([key, val]) => (
                  <button
                    key={key} type="button"
                    onClick={() => setNewEventColor(key)}
                    className={`w-5 h-5 rounded-full ${val.dot} ring-2 transition-all ${newEventColor === key ? 'ring-stone-400 dark:ring-stone-300 scale-110' : 'ring-transparent'}`}
                  />
                ))}
                <button
                  type="submit"
                  disabled={!newEventName.trim() || !newEventDate}
                  className="ml-auto px-3 py-1 text-xs font-medium bg-pine-600 text-white rounded-md hover:bg-pine-700 transition-colors disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Legend ── */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <span className="flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span> National
          </span>
          <span className="flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span> Holiday
          </span>
          <span className="flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400">
            <span className="w-2 h-2 rounded-full bg-pine-500 inline-block"></span> Event
          </span>
          <span className="flex items-center gap-1 text-xs text-stone-400 dark:text-stone-500">
            <span className="w-2 h-2 rounded-full bg-stone-300 dark:bg-stone-600 inline-block"></span> Weekend
          </span>
        </div>

        {/* ── Week day headers ── */}
        <div className="grid grid-cols-7 mb-2">
          {weekDays.map((day, i) => (
            <div key={day} className={cn(
              "text-center text-xs font-semibold uppercase tracking-wider py-1 rounded",
              (i === 0 || i === 6) ? "text-stone-400 dark:text-stone-500" : "text-stone-400 dark:text-stone-500"
            )}>
              {day}
            </div>
          ))}
        </div>

        {/* ── Animated Grid ── */}
        <div className="calendar-grid-wrap flex-1">
          <div className={`calendar-grid grid grid-cols-7 gap-y-1 gap-x-0 relative ${animClass}`}>
            {daysInMonth.map((day) => {
              const isSelectedStart = startDate && isSameDay(day, startDate);
              const isSelectedEnd   = endDate   && isSameDay(day, endDate);
              const isSelected = isSelectedStart || isSelectedEnd;
              const isBetween  = startDate && endDate && isWithinInterval(day, { start: startDate, end: endDate }) && !isSelectedStart && !isSelectedEnd;
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isWeekend  = isSaturday(day) || isSunday(day);
              const holiday    = isCurrentMonth ? getHoliday(day) : null;
              const customEvts = isCurrentMonth ? getEventsForDate(day) : [];
              const hasEvents  = holiday || customEvts.length > 0;

              // Tooltip text
              const tooltipParts = [];
              if (holiday) tooltipParts.push(holiday.name);
              customEvts.forEach(e => tooltipParts.push(e.name));
              const tooltipText = tooltipParts.join(' • ');

              return (
                <div
                  key={day.toString()}
                  className={cn(
                    "relative flex flex-col items-center py-0.5 rounded-sm",
                    isWeekend && isCurrentMonth && !isSelected && "bg-stone-50/80 dark:bg-stone-800/30",
                  )}
                >
                  {/* Range highlight bg */}
                  {isBetween && <div className="absolute inset-0 bg-pine-50 dark:bg-pine-950/40 pointer-events-none" />}
                  {isSelectedStart && endDate && !isSelectedEnd && <div className="absolute inset-y-0 right-0 left-1/2 bg-pine-50 dark:bg-pine-950/40 pointer-events-none" />}
                  {isSelectedEnd && startDate && !isSelectedStart && <div className="absolute inset-y-0 left-0 right-1/2 bg-pine-50 dark:bg-pine-950/40 pointer-events-none" />}

                  {/* Date button – triggers fixed tooltip on hover */}
                  <div className="relative">
                    <button
                      onClick={(e) => handleDateClick(e, day)}
                      onMouseEnter={tooltipText ? (e) => showTooltip(e, tooltipText) : undefined}
                      onMouseLeave={tooltipText ? hideTooltip : undefined}
                      className={cn(
                        "relative h-9 w-9 rounded-full flex items-center justify-center font-medium text-sm transition-all duration-200 z-10",
                        !isCurrentMonth && "text-stone-300 dark:text-stone-700",
                        isCurrentMonth && !isSelected && !isBetween && !isWeekend && "text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100",
                        isCurrentMonth && !isSelected && !isBetween && isWeekend && "text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800",
                        isBetween && "text-pine-800 dark:text-pine-300 font-semibold",
                        isSelected && "bg-pine-600 text-white shadow-md shadow-pine-200 dark:shadow-pine-900 scale-105",
                        isToday(day) && !isSelected && "text-pine-600 dark:text-pine-400 font-bold border border-pine-200 dark:border-pine-700",
                        holiday?.type === 'national' && !isSelected && isCurrentMonth && "text-red-600 dark:text-red-400 font-bold",
                      )}
                    >
                      {format(day, 'd')}
                    </button>
                  </div>

                  {/* Event dots row */}
                  {isCurrentMonth && (holiday || customEvts.length > 0) && (
                    <div className="flex items-center gap-0.5 mt-0.5 z-10">
                      {holiday && (
                        <span className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          holiday.type === 'national' ? 'bg-red-500' : 'bg-amber-400'
                        )} />
                      )}
                      {customEvts.slice(0, 2).map(ev => (
                        <span
                          key={ev.id}
                          className={`w-1.5 h-1.5 rounded-full ${EVENT_COLORS[ev.color]?.dot || 'bg-pine-500'}`}
                        />
                      ))}
                      {customEvts.length > 2 && (
                        <span className="text-[8px] text-stone-400 leading-none">+{customEvts.length - 2}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </>
  );
}
