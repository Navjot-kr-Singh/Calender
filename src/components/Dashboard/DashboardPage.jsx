import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, AlertTriangle, Calendar, Flame, Zap, 
  TrendingUp, Clock, ChevronRight, BarChart3, Focus 
} from 'lucide-react';
import { 
  format, startOfWeek, endOfWeek, eachDayOfInterval, 
  isSameDay, parseISO, subDays, startOfDay 
} from 'date-fns';
import { useTasks } from '../../context/TaskContext';
import Navbar from '../Navbar';

export default function DashboardPage() {
  const { tasks, fetchTasks, loading, updateTask } = useTasks();
  const [focusMode, setFocusMode] = useState(false);

  // Fetch a 30-day range of tasks to compute dashboard metrics
  useEffect(() => {
    const end = new Date();
    // Add 14 days in future for upcoming deadlines
    const endDate = new Date(end.getTime() + 14 * 24 * 60 * 60 * 1000);
    // Go 30 days back
    const startDate = subDays(end, 30);
    
    fetchTasks(startDate, endDate);
  }, [fetchTasks]);

  // ─── Metrics Calculations ───
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayTasks = tasks.filter(t => t.date === todayStr);
  const completedToday = todayTasks.filter(t => t.completed).length;
  
  // Urgent focus tasks (Urgent or High, not completed, due today or overdue)
  const focusTasks = tasks.filter(t => 
    !t.completed && 
    (t.priority === 'Urgent' || t.priority === 'High') && 
    (t.date <= todayStr)
  );

  // Filter tasks depending on focus mode
  const displayedTodayTasks = focusMode 
    ? todayTasks.filter(t => !t.completed && (t.priority === 'Urgent' || t.priority === 'High')) 
    : todayTasks;

  // Upcoming deadlines (next 5 uncompleted tasks with deadlines, nearest first)
  const upcomingDeadlines = tasks
    .filter(t => !t.completed && t.deadline)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 5);

  // Weekly Completion Rate: current week tasks completed / current week tasks total
  const startOfCurrWeek = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday start
  const endOfCurrWeek = endOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: startOfCurrWeek, end: endOfCurrWeek });
  
  const weekTasks = tasks.filter(t => {
    const taskDate = new Date(t.date + 'T00:00:00');
    return taskDate >= startOfCurrWeek && taskDate <= endOfCurrWeek;
  });
  const weekCompleted = weekTasks.filter(t => t.completed).length;
  const weeklyRate = weekTasks.length > 0 ? Math.round((weekCompleted / weekTasks.length) * 100) : 0;

  // Priority Distribution
  const priorityCounts = tasks.reduce((acc, t) => {
    acc[t.priority] = (acc[t.priority] || 0) + 1;
    return acc;
  }, { Low: 0, Medium: 0, High: 0, Urgent: 0 });

  const totalTasks = tasks.length || 1; // avoid division by 0
  const priorityPercentages = {
    Low: Math.round((priorityCounts.Low / totalTasks) * 100),
    Medium: Math.round((priorityCounts.Medium / totalTasks) * 100),
    High: Math.round((priorityCounts.High / totalTasks) * 100),
    Urgent: Math.round((priorityCounts.Urgent / totalTasks) * 100)
  };

  // Streak calculation (consecutive days in last 30 days with >= 1 task completed)
  const getStreak = () => {
    let streak = 0;
    let checkDate = new Date();
    
    // Set up a lookup set of completed task dates
    const completedDates = new Set(
      tasks.filter(t => t.completed).map(t => t.date)
    );

    // If they completed a task today, start count from today. Otherwise start checking from yesterday
    const todayFormatted = format(checkDate, 'yyyy-MM-dd');
    if (!completedDates.has(todayFormatted)) {
      checkDate = subDays(checkDate, 1);
    }

    // Check backwards for consecutive days
    for (let i = 0; i < 30; i++) {
      const formatted = format(checkDate, 'yyyy-MM-dd');
      if (completedDates.has(formatted)) {
        streak++;
        checkDate = subDays(checkDate, 1);
      } else {
        break; // Streak broken
      }
    }
    return streak;
  };

  const streakCount = getStreak();

  // Weekly activity bar chart data (tasks completed per day of this week)
  const weeklyActivityData = weekDays.map(day => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const dayTasks = tasks.filter(t => t.date === dayStr);
    const completedCount = dayTasks.filter(t => t.completed).length;
    const totalCount = dayTasks.length;
    
    return {
      dayName: format(day, 'EEE'),
      completed: completedCount,
      total: totalCount,
      percentage: totalCount > 0 ? (completedCount / totalCount) * 100 : 0
    };
  });

  const maxCompletedInWeek = Math.max(...weeklyActivityData.map(d => d.completed), 1);

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-stone-950 flex flex-col font-sans text-stone-850 dark:text-stone-100 transition-colors">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex flex-col gap-8 animate-in fade-in duration-300">
        
        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-6">
          <div>
            <h1 className="text-4xl font-serif font-black tracking-tight text-stone-900 dark:text-white">
              Productivity Insights
            </h1>
            <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">
              Analyze your performance, track deadlines, and maintain your completion streak.
            </p>
          </div>

          {/* Focus Mode Toggle */}
          <button
            onClick={() => setFocusMode(!focusMode)}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm shadow-md transition-all active:scale-95 border
              ${focusMode 
                ? 'bg-rose-600 text-white border-rose-600 shadow-rose-600/20' 
                : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:bg-stone-50'
              }
            `}
          >
            <Focus className={`w-4 h-4 ${focusMode ? 'animate-pulse' : ''}`} />
            {focusMode ? 'Focus Mode ON' : 'Trigger Focus Mode'}
          </button>
        </div>

        {/* Focus Mode Warning Banner */}
        {focusMode && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center gap-3 animate-in slide-in-from-top-4 duration-300">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-455" />
            <div className="text-xs sm:text-sm text-rose-700 dark:text-rose-300">
              <strong>Focus Mode Active:</strong> Showing only urgent and high-priority uncompleted tasks due today. Concentrate on these first!
            </div>
          </div>
        )}

        {/* ── Grid 1: Analytics Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1: Completed Today */}
          <div className="bg-white dark:bg-stone-900 p-6 rounded-[1.8rem] border border-stone-200/50 dark:border-stone-850 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-150/15 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase text-stone-400 dark:text-stone-500">Completed Today</span>
              <span className="text-2xl font-bold mt-0.5">{completedToday}</span>
              <span className="text-[10px] text-stone-500 dark:text-stone-450 mt-0.5">from {todayTasks.length} tasks scheduled</span>
            </div>
          </div>

          {/* Card 2: Weekly Completion Rate */}
          <div className="bg-white dark:bg-stone-900 p-6 rounded-[1.8rem] border border-stone-200/50 dark:border-stone-850 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-150/15 dark:bg-indigo-950/20 flex items-center justify-center text-indigo-650 dark:text-indigo-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase text-stone-400 dark:text-stone-500">Weekly Rate</span>
              <span className="text-2xl font-bold mt-0.5">{weeklyRate}%</span>
              <span className="text-[10px] text-stone-500 dark:text-stone-450 mt-0.5">{weekCompleted} of {weekTasks.length} completed</span>
            </div>
          </div>

          {/* Card 3: Streak Counter */}
          <div className="bg-white dark:bg-stone-900 p-6 rounded-[1.8rem] border border-stone-200/50 dark:border-stone-850 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-150/15 dark:bg-orange-950/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <Flame className="w-6 h-6 animate-bounce" style={{ animationDuration: '3s' }} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase text-stone-400 dark:text-stone-500">Active Streak</span>
              <span className="text-2xl font-bold mt-0.5">{streakCount} Days</span>
              <span className="text-[10px] text-stone-500 dark:text-stone-450 mt-0.5">keep completing tasks daily!</span>
            </div>
          </div>

          {/* Card 4: Urgent Tasks Remaining */}
          <div className="bg-white dark:bg-stone-900 p-6 rounded-[1.8rem] border border-stone-200/50 dark:border-stone-850 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-150/15 dark:bg-rose-950/20 flex items-center justify-center text-rose-600 dark:text-rose-455">
              <Zap className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase text-stone-400 dark:text-stone-500">Urgent Focus</span>
              <span className="text-2xl font-bold mt-0.5">{focusTasks.length} Tasks</span>
              <span className="text-[10px] text-stone-500 dark:text-stone-450 mt-0.5">overdue or due today</span>
            </div>
          </div>

        </div>

        {/* ── Grid 2: Charts and Distribution ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Chart Section: Weekly Activity */}
          <div className="bg-white dark:bg-stone-900 p-6 sm:p-8 rounded-[2rem] border border-stone-200/50 dark:border-stone-850 shadow-sm lg:col-span-2 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-serif font-bold text-stone-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-500" /> Weekly Task Activity
              </h3>
              <span className="text-xs text-stone-400 dark:text-stone-550">Monday to Sunday</span>
            </div>

            {/* Custom SVG/CSS Bar Chart */}
            <div className="flex-1 flex items-end justify-between gap-2 sm:gap-4 h-64 pt-6 border-b border-stone-150 dark:border-stone-800 pb-1">
              {weeklyActivityData.map((data, i) => {
                const heightPercentage = Math.max((data.completed / maxCompletedInWeek) * 100, 5);
                const isTodayDay = format(new Date(), 'EEE') === data.dayName;

                return (
                  <div key={i} className="flex-1 flex flex-col items-center h-full group relative">
                    {/* Hover tooltip */}
                    <div className="absolute -top-10 scale-0 group-hover:scale-100 transition-all duration-200 bg-stone-900 text-stone-100 text-[10px] py-1.5 px-3 rounded-lg shadow-md z-35 pointer-events-none whitespace-nowrap">
                      {data.completed} / {data.total} Completed
                    </div>

                    <div className="flex-1 w-full flex items-end justify-center pb-2">
                      <div className="w-6 sm:w-10 bg-stone-100 dark:bg-stone-800/80 rounded-t-lg h-full flex items-end overflow-hidden">
                        <div 
                          className={`w-full rounded-t-lg transition-all duration-700
                            ${isTodayDay 
                              ? 'bg-gradient-to-t from-indigo-600 to-indigo-400 shadow-lg shadow-indigo-500/20' 
                              : 'bg-gradient-to-t from-pine-650 to-pine-500'
                            }
                          `}
                          style={{ height: `${heightPercentage}%` }}
                        />
                      </div>
                    </div>

                    <span className={`text-[10px] sm:text-xs font-bold mt-2
                      ${isTodayDay ? 'text-indigo-650 dark:text-indigo-400' : 'text-stone-500 dark:text-stone-450'}
                    `}>
                      {data.dayName}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Distribution Section: Priorities */}
          <div className="bg-white dark:bg-stone-900 p-6 sm:p-8 rounded-[2rem] border border-stone-200/50 dark:border-stone-850 shadow-sm flex flex-col gap-6">
            <h3 className="text-xl font-serif font-bold text-stone-900 dark:text-white">
              Priority Distribution
            </h3>

            {/* Custom Bar Percentages */}
            <div className="flex-1 flex flex-col justify-center gap-5">
              <PriorityProgressLabel label="Urgent" count={priorityCounts.Urgent} percent={priorityPercentages.Urgent} colorClass="bg-rose-500" />
              <PriorityProgressLabel label="High" count={priorityCounts.High} percent={priorityPercentages.High} colorClass="bg-red-500" />
              <PriorityProgressLabel label="Medium" count={priorityCounts.Medium} percent={priorityPercentages.Medium} colorClass="bg-amber-500" />
              <PriorityProgressLabel label="Low" count={priorityCounts.Low} percent={priorityPercentages.Low} colorClass="bg-emerald-500" />
            </div>

            <div className="p-4 bg-stone-50 dark:bg-stone-800/30 rounded-2xl text-center text-xs text-stone-500 dark:text-stone-400 border border-stone-150 dark:border-stone-850">
              Total logged tasks in database: <strong>{tasks.length}</strong>
            </div>
          </div>

        </div>

        {/* ── Grid 3: Selected Day Tasks & Deadlines ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Today's Focus List */}
          <div className="bg-white dark:bg-stone-900 p-6 sm:p-8 rounded-[2rem] border border-stone-200/50 dark:border-stone-850 shadow-sm flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-serif font-bold text-stone-900 dark:text-white">
                {focusMode ? 'Urgent Action List' : 'Scheduled for Today'}
              </h3>
              <span className="text-xs text-stone-400 dark:text-stone-550">
                {format(new Date(), 'MMM d, yyyy')}
              </span>
            </div>

            <div className="flex-1 flex flex-col gap-3 max-h-80 overflow-y-auto">
              {displayedTodayTasks.length === 0 ? (
                <div className="text-center py-12 text-sm text-stone-400 dark:text-stone-500">
                  {focusMode ? 'No urgent priority tasks remaining for today!' : 'No tasks scheduled for today.'}
                </div>
              ) : (
                displayedTodayTasks.map(task => (
                  <div 
                    key={task._id}
                    className="flex items-center justify-between p-3.5 bg-stone-50 dark:bg-stone-850/50 rounded-2xl border border-stone-200/30 dark:border-stone-800 hover:bg-stone-100/50 dark:hover:bg-stone-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => updateTask(task._id, { completed: !task.completed })}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer
                          ${task.completed ? 'bg-pine-500 border-pine-500 text-white' : 'border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-700'}
                        `}
                      >
                        {task.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </button>
                      <span className={`text-xs font-bold ${task.completed ? 'text-stone-400 line-through' : 'text-stone-850 dark:text-stone-200'}`}>
                        {task.title}
                      </span>
                    </div>

                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border
                      ${task.priority === 'Urgent' ? 'bg-rose-100 border-rose-200 text-rose-700 dark:bg-rose-950/30 dark:text-rose-350 dark:border-rose-900' : ''}
                      ${task.priority === 'High' ? 'bg-red-100 border-red-200 text-red-700 dark:bg-red-950/30 dark:text-red-350 dark:border-red-900' : ''}
                      ${task.priority === 'Medium' ? 'bg-amber-100 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:text-amber-350 dark:border-amber-900' : ''}
                      ${task.priority === 'Low' ? 'bg-emerald-100 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-350 dark:border-emerald-900' : ''}
                    `}>
                      {task.priority}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Upcoming Deadlines List */}
          <div className="bg-white dark:bg-stone-900 p-6 sm:p-8 rounded-[2rem] border border-stone-200/50 dark:border-stone-850 shadow-sm flex flex-col gap-5">
            <h3 className="text-xl font-serif font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" /> Upcoming Deadlines
            </h3>

            <div className="flex-1 flex flex-col gap-3 max-h-80 overflow-y-auto">
              {upcomingDeadlines.length === 0 ? (
                <div className="text-center py-12 text-sm text-stone-400 dark:text-stone-500">
                  No upcoming deadlines on your schedule.
                </div>
              ) : (
                upcomingDeadlines.map(task => {
                  const deadlineDate = new Date(task.deadline);
                  const isOverdue = deadlineDate < startOfDay(new Date());

                  return (
                    <div 
                      key={task._id}
                      className="flex items-center justify-between p-3.5 bg-stone-50 dark:bg-stone-850/50 rounded-2xl border border-stone-200/30 dark:border-stone-800 hover:bg-stone-100/50 dark:hover:bg-stone-800 transition-colors"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold text-stone-850 dark:text-stone-200">
                          {task.title}
                        </span>
                        <span className="text-[10px] text-stone-450 dark:text-stone-500">
                          Due Date: {task.date}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-bold px-2 py-1 rounded-lg flex items-center gap-1
                          ${isOverdue 
                            ? 'bg-rose-50 text-rose-600 dark:bg-rose-955/20 dark:text-rose-400' 
                            : 'bg-blue-50 text-blue-600 dark:bg-blue-955/20 dark:text-blue-400'
                          }
                        `}>
                          <Clock className="w-2.5 h-2.5" />
                          {format(deadlineDate, 'MMM d')}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}

// ─── Progress Label Helper ───
function PriorityProgressLabel({ label, count, percent, colorClass }) {
  return (
    <div className="flex flex-col gap-1.5 font-sans">
      <div className="flex justify-between text-xs font-bold">
        <span className="text-stone-700 dark:text-stone-300">{label} Priority</span>
        <span className="text-stone-400">{count} ({percent}%)</span>
      </div>
      <div className="w-full bg-stone-100 dark:bg-stone-800 h-2 rounded-full overflow-hidden shadow-inner">
        <div 
          className={`h-full rounded-full ${colorClass} transition-all duration-1000`} 
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
