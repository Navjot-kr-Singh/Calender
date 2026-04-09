import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
  endOfWeek
} from 'date-fns';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper for tailwind class merging
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function CalendarGrid({ 
  currentDate, 
  setCurrentDate, 
  startDate, 
  setStartDate, 
  endDate, 
  setEndDate 
}) {

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const handleDateClick = (e, day) => {
    if (e.shiftKey && startDate) {
      // Complete the selection range if shift is pressed
      if (isBefore(day, startDate)) {
        setEndDate(startDate);
        setStartDate(day);
      } else {
        setEndDate(day);
      }
    } else {
      // By default, just single-select the date
      setStartDate(day);
      setEndDate(null);
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  
  // We want to show a full grid, including trailing/leading days of other months
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const daysInMonth = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd
  });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="p-6 md:p-8 flex flex-col justify-between h-full bg-white dark:bg-stone-900 z-10 w-full relative drop-shadow-sm min-h-[400px]">
      
      {/* Header controls */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-serif font-semibold text-stone-800 dark:text-stone-100">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex space-x-2">
          <button 
            onClick={prevMonth}
            className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 active:scale-95"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={nextMonth}
            className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 active:scale-95"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Days of the week */}
      <div className="grid grid-cols-7 mb-4">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-y-2 gap-x-0 relative">
        {daysInMonth.map((day, idx) => {
          const isSelectedStart = startDate && isSameDay(day, startDate);
          const isSelectedEnd = endDate && isSameDay(day, endDate);
          const isSelected = isSelectedStart || isSelectedEnd;
          
          const isBetween = startDate && endDate && isWithinInterval(day, { 
            start: startDate, 
            end: endDate 
          }) && !isSelectedStart && !isSelectedEnd;

          const isCurrentMonth = isSameMonth(day, monthStart);

          return (
            <div key={day.toString()} className="relative flex justify-center py-1">
              {/* Range Connection Background */}
              {isBetween && (
                <div className="absolute inset-0 bg-pine-50 dark:bg-pine-950/40" />
              )}
              {isSelectedStart && endDate && !isSelectedEnd && (
                <div className="absolute inset-y-0 right-0 left-1/2 bg-pine-50 dark:bg-pine-950/40" />
              )}
              {isSelectedEnd && startDate && !isSelectedStart && (
                <div className="absolute inset-y-0 left-0 right-1/2 bg-pine-50 dark:bg-pine-950/40" />
              )}
              {isSelectedStart && isSelectedEnd && startDate && endDate && !isSameDay(startDate, endDate) && (
                // Edge case where user selected but the visual is squashed, handled by single selection logic usually
                null
              )}
              
              <button
                onClick={(e) => handleDateClick(e, day)}
                className={cn(
                  "relative h-10 w-10 sm:h-12 w-full sm:w-12 rounded-full flex items-center justify-center font-medium text-sm transition-all duration-200 z-10",
                  !isCurrentMonth && "text-stone-300 dark:text-stone-700",
                  isCurrentMonth && !isSelected && !isBetween && "text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100",
                  isBetween && "text-pine-800 dark:text-pine-300 font-semibold",
                  isSelected && "bg-pine-600 text-white shadow-md shadow-pine-200 dark:shadow-pine-900 scale-105",
                  isToday(day) && !isSelected && "text-pine-600 dark:text-pine-400 font-bold border border-pine-200 dark:border-pine-700",
                )}
              >
                {format(day, 'd')}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
