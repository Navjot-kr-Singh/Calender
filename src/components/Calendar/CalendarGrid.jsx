import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, CalendarDays, AlertTriangle, Clock } from 'lucide-react';
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
  isSunday
} from 'date-fns';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getHoliday } from '../../data/holidays';
import { useTasks } from '../../context/TaskContext';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const PRIORITY_COLORS = {
  Urgent: { dot: 'bg-rose-600', ring: 'ring-rose-500/30' },
  High: { dot: 'bg-red-500', ring: 'ring-red-400/30' },
  Medium: { dot: 'bg-amber-500', ring: 'ring-amber-400/30' },
  Low: { dot: 'bg-emerald-500', ring: 'ring-emerald-400/30' }
};

export default function CalendarGrid({ 
  currentDate, 
  setCurrentDate, 
  startDate, 
  setStartDate, 
  endDate, 
  setEndDate,
  events = []
}) {
  const [displayDate, setDisplayDate] = useState(currentDate);
  const [animClass, setAnimClass] = useState('');
  const isAnimating = useRef(false);

  // Add-event/task modal state
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventName, setNewEventName] = useState('');
  const [newEventPriority, setNewEventPriority] = useState('Medium');
  const [newEventTag, setNewEventTag] = useState('Event');

  const { tasks, addTask, fetchTasks } = useTasks();

  // ─── Fixed tooltip (immune to overflow:hidden) ────────────────────────
  const [tooltip, setTooltip] = useState(null); // { text, x, y }

  const showTooltip = useCallback((e, text) => {
    if (!text) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({ text, x: rect.left + rect.width / 2, y: rect.top });
  }, []);

  const hideTooltip = useCallback(() => setTooltip(null), []);

  // ─── Month Transition ────────────────────────────────────────────────
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

  // ─── Fetch Tasks for Visible Grid Range ──────────────────────────────
  const monthStart = startOfMonth(displayDate);
  const monthEnd   = endOfMonth(monthStart);
  const daysInMonth = eachDayOfInterval({
    start: startOfWeek(monthStart),
    end:   endOfWeek(monthEnd),
  });

  useEffect(() => {
    if (daysInMonth.length > 0) {
      const startStr = format(daysInMonth[0], 'yyyy-MM-dd');
      const endStr = format(daysInMonth[daysInMonth.length - 1], 'yyyy-MM-dd');
      fetchTasks(startStr, endStr);
    }
  }, [displayDate, fetchTasks]);

  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!newEventName.trim() || !newEventDate) return;
    
    await addTask({
      title: newEventName.trim(),
      date: newEventDate,
      priority: newEventPriority,
      tags: [newEventTag]
    });

    setNewEventName('');
    setNewEventDate('');
    setNewEventPriority('Medium');
    setShowAddEvent(false);
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayStr = format(new Date(), 'yyyy-MM-dd');

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
            padding: '6px 10px',
            borderRadius: '6px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.08)'
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
              className="p-2 rounded-full hover:bg-pine-100 dark:hover:bg-pine-900/40 transition-colors text-pine-600 dark:text-pine-400 active:scale-95 animate-in fade-in"
              title="Add task/event"
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
          <div className="mb-4 p-4 rounded-xl border border-pine-200 dark:border-pine-800 bg-pine-50 dark:bg-pine-950/30 flex flex-col gap-2 animate-in fade-in slide-in-from-top-3 duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-pine-700 dark:text-pine-300 flex items-center gap-1.5 font-sans">
                <CalendarDays className="w-3.5 h-3.5" /> Quick Schedule Task
              </span>
              <button onClick={() => setShowAddEvent(false)} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddEvent} className="flex flex-col gap-3">
              <input
                type="text"
                value={newEventName}
                onChange={e => setNewEventName(e.target.value)}
                placeholder="Task title..."
                required
                className="px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-md focus:outline-none focus:ring-1 focus:ring-pine-400 text-stone-700 dark:text-stone-300"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={newEventDate}
                  onChange={e => setNewEventDate(e.target.value)}
                  required
                  className="px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-md focus:outline-none focus:ring-1 focus:ring-pine-400 text-stone-700 dark:text-stone-300"
                />
                <select
                  value={newEventPriority}
                  onChange={e => setNewEventPriority(e.target.value)}
                  className="px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-md focus:outline-none focus:ring-1 focus:ring-pine-400 text-stone-700 dark:text-stone-300"
                >
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                  <option value="Urgent">Urgent Priority</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Tag (e.g. Work, Personal)"
                  value={newEventTag}
                  onChange={e => setNewEventTag(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-md focus:outline-none focus:ring-1 focus:ring-pine-400 text-stone-700 dark:text-stone-300 w-44"
                />
                <button
                  type="submit"
                  disabled={!newEventName.trim() || !newEventDate}
                  className="ml-auto px-4 py-2 text-xs font-semibold bg-pine-600 text-white rounded-md hover:bg-pine-700 transition-colors disabled:opacity-50"
                >
                  Schedule
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Legend ── */}
        <div className="flex items-center gap-4 mb-5 flex-wrap font-sans">
          <span className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> Urgent/High
          </span>
          <span className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Medium
          </span>
          <span className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Low
          </span>
          <span className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" /> Overdue
          </span>
          <span className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
            <Clock className="w-3.5 h-3.5 text-blue-500" /> Deadline
          </span>
        </div>

        {/* ── Week day headers ── */}
        <div className="grid grid-cols-7 mb-2 font-sans">
          {weekDays.map((day, i) => (
            <div key={day} className={cn(
              "text-center text-xs font-bold uppercase tracking-wider py-1 text-stone-400 dark:text-stone-500"
            )}>
              {day}
            </div>
          ))}
        </div>

        {/* ── Animated Grid ── */}
        <div className="calendar-grid-wrap flex-1">
          <div className={`calendar-grid grid grid-cols-7 gap-y-1 gap-x-0 relative ${animClass}`}>
            {daysInMonth.map((day) => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const isSelectedStart = startDate && isSameDay(day, startDate);
              const isSelectedEnd   = endDate   && isSameDay(day, endDate);
              const isSelected = isSelectedStart || isSelectedEnd;
              const isBetween  = startDate && endDate && isWithinInterval(day, { start: startDate, end: endDate }) && !isSelectedStart && !isSelectedEnd;
              
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isWeekend  = isSaturday(day) || isSunday(day);
              
              // Get tasks and events for this date
              const dayTasks = isCurrentMonth ? tasks.filter(t => t.date === dayStr) : [];
              const dayEvents = isCurrentMonth ? events.filter(e => e.date === dayStr && e.isActive) : [];
              const holiday = isCurrentMonth ? getHoliday(day) : null;
              
              const overdueTasks = dayTasks.filter(t => !t.completed && isBefore(day, new Date(todayStr + 'T00:00:00')));
              const hasOverdue = overdueTasks.length > 0;
              const hasUpcomingDeadline = dayTasks.some(t => !t.completed && t.deadline && isSameDay(new Date(t.deadline), day));

              // Compile tooltip parts
              const tooltipParts = [];
              if (holiday) tooltipParts.push(`Holiday: ${holiday.name}`);
              dayEvents.forEach(ev => {
                tooltipParts.push(`[Event] ${ev.name} (${ev.time || '12:00'}, ${ev.duration}m)`);
              });
              dayTasks.forEach(t => {
                const priorityPrefix = t.priority ? `[${t.priority}] ` : '';
                const statusSuffix = t.completed ? ' (Done)' : '';
                tooltipParts.push(`${priorityPrefix}${t.title}${statusSuffix}`);
              });
              const tooltipText = tooltipParts.join(' \n ');

              return (
                <div
                  key={day.toString()}
                  className={cn(
                    "relative flex flex-col items-center py-1 rounded-md min-h-[50px] transition-all",
                    isWeekend && isCurrentMonth && !isSelected && "bg-stone-50/80 dark:bg-stone-800/30",
                    isCurrentMonth && !isSelected && hasOverdue && "border border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/5"
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
                        "relative h-8 w-8 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-200 z-10",
                        !isCurrentMonth && "text-stone-300 dark:text-stone-700",
                        isCurrentMonth && !isSelected && !isBetween && !isWeekend && "text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100",
                        isCurrentMonth && !isSelected && !isBetween && isWeekend && "text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800",
                        isBetween && "text-pine-850 dark:text-pine-300 font-bold",
                        isSelected && "bg-pine-600 text-white shadow-md shadow-pine-200 dark:shadow-pine-900 scale-105",
                        isToday(day) && !isSelected && "text-pine-600 dark:text-pine-400 font-bold border border-pine-200 dark:border-pine-750",
                        holiday?.type === 'national' && !isSelected && isCurrentMonth && "text-red-600 dark:text-red-400 font-bold",
                      )}
                    >
                      {format(day, 'd')}
                    </button>

                    {/* Task icons: Top right overdue indicator, top left deadline clock */}
                    {isCurrentMonth && hasOverdue && (
                      <div className="absolute -top-1.5 -right-1.5 z-20" title="Overdue tasks present">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500 fill-white dark:fill-stone-900" />
                      </div>
                    )}
                    {isCurrentMonth && hasUpcomingDeadline && (
                      <div className="absolute -top-1.5 -left-1.5 z-20" title="Has task deadline today">
                        <Clock className="w-3.5 h-3.5 text-blue-500 fill-white dark:fill-stone-900" />
                      </div>
                    )}
                  </div>

                  {/* Task priority/Event dots row */}
                  {isCurrentMonth && (holiday || dayTasks.length > 0 || dayEvents.length > 0) && (
                    <div className="flex items-center justify-center gap-1 mt-1 z-10 w-full px-1 overflow-hidden h-4">
                      {holiday && (
                        <span className={cn(
                          "w-1.5 h-1.5 rounded-full flex-shrink-0",
                          holiday.type === 'national' ? 'bg-red-500' : 'bg-amber-400'
                        )} title={holiday.name} />
                      )}
                      
                      {dayEvents.map(event => (
                        <span
                          key={event._id}
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-blue-600 dark:bg-blue-450 transition-transform hover:scale-125"
                          title={`Event: ${event.name}`}
                        />
                      ))}
                      
                      {dayTasks.slice(0, Math.max(0, 3 - dayEvents.length)).map(task => {
                        const colors = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.Medium;
                        return (
                          <span
                            key={task._id}
                            className={cn(
                              "w-1.5 h-1.5 rounded-full flex-shrink-0 transition-transform hover:scale-125",
                              task.completed ? "bg-stone-300 dark:bg-stone-600" : colors.dot
                            )}
                            title={task.title}
                          />
                        );
                      })}
                      
                      {dayTasks.length + dayEvents.length > 3 && (
                        <span className="text-[8px] font-bold text-stone-400 leading-none">+{dayTasks.length + dayEvents.length - 3}</span>
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
