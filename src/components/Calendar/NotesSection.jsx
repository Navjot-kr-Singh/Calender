import React, { useState, useEffect } from 'react';
import { 
  StickyNote, Save, CheckCircle2, ListTodo, Plus, Trash2, ArrowLeft, 
  AlertTriangle, Calendar, Clock, RotateCw, Tag, ChevronDown, ChevronRight, Edit3, X 
} from 'lucide-react';
import { format, isBefore, isSameDay } from 'date-fns';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import { useTasks } from '../../context/TaskContext';

const PRIORITY_BADGES = {
  Urgent: 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-350 border border-rose-200 dark:border-rose-900',
  High: 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-350 border border-red-200 dark:border-red-900',
  Medium: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-350 border border-amber-200 dark:border-amber-900',
  Low: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-350 border border-emerald-200 dark:border-emerald-900'
};

export default function NotesSection({ currentDate, startDate, endDate, events = [] }) {
  const [note, setNote] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isNoteLoading, setIsNoteLoading] = useState(false);
  const { getToken, isSignedIn } = useAuth();
  
  const API_URL = import.meta.env.VITE_API_URL || '/api';
  const { tasks, loading, addTask, updateTask, deleteTask } = useTasks();

  // Task creation form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskDeadline, setTaskDeadline] = useState('');
  const [taskReminder, setTaskReminder] = useState('');
  const [taskRecurring, setTaskRecurring] = useState('none');
  const [taskTags, setTaskTags] = useState('');

  // Active task details editing state
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [activeTaskTitle, setActiveTaskTitle] = useState('');
  const [activeTaskDesc, setActiveTaskDesc] = useState('');
  const [activeTaskPriority, setActiveTaskPriority] = useState('Medium');
  const [activeTaskDeadline, setActiveTaskDeadline] = useState('');
  const [activeTaskReminder, setActiveTaskReminder] = useState('');
  const [activeTaskRecurring, setActiveTaskRecurring] = useState('none');
  const [activeTaskTags, setActiveTaskTags] = useState('');

  // Accordion collapse states
  const [collapsedSections, setCollapsedSections] = useState({
    overdue: false,
    today: false,
    upcoming: false,
    completed: false
  });

  const getStorageKey = () => {
    if (startDate && endDate) {
      return `calendar-notes-${format(startDate, 'yyyy-MM-dd')}-to-${format(endDate, 'yyyy-MM-dd')}`;
    } else if (startDate) {
      return `calendar-notes-${format(startDate, 'yyyy-MM-dd')}`;
    }
    return `calendar-notes-${format(currentDate, 'yyyy-MM')}`;
  };

  const currentContextTitle = () => {
    if (startDate && endDate) {
      return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d')}`;
    } else if (startDate) {
      return `${format(startDate, 'MMM d')}`;
    }
    return `${format(currentDate, 'MMMM')}`;
  };

  // Fetch Text Notes from backend note persistence
  useEffect(() => {
    const fetchNote = async () => {
      if (!isSignedIn) return;
      setIsNoteLoading(true);
      try {
        const token = await getToken();
        const key = getStorageKey();
        const response = await axios.get(`${API_URL}/notes/${key}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNote(response.data.content || '');
      } catch (error) {
        console.error("Failed to fetch note:", error);
      } finally {
        setIsNoteLoading(false);
        setIsSaved(false);
      }
    };
    fetchNote();
  }, [currentDate, startDate, endDate, isSignedIn, getToken, API_URL]);

  // Save Text Notes to backend note persistence
  const handleSaveNote = async () => {
    if (!isSignedIn) return;
    try {
      const token = await getToken();
      const key = getStorageKey();
      await axios.post(`${API_URL}/notes/${key}`, { content: note }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (error) {
      console.error("Failed to save note:", error);
    }
  };

  // ─── Task Grouping ───
  const selectedDateStr = format(startDate || new Date(), 'yyyy-MM-dd');
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  
  // Filter events in memory for selected day
  const selectedDayEvents = events.filter(e => e.date === selectedDateStr && e.isActive);

  // Filter tasks in memory for display segments
  const selectedDayTasks = tasks.filter(t => t.date === selectedDateStr);
  const activeSelectedTasks = selectedDayTasks.filter(t => !t.completed);
  const completedSelectedTasks = selectedDayTasks.filter(t => t.completed);
  
  const overdueTasks = tasks.filter(t => t.date < todayStr && !t.completed && t.date !== selectedDateStr);
  const upcomingTasks = tasks.filter(t => t.date > selectedDateStr && !t.completed);

  // Statistics
  const completedCount = completedSelectedTasks.length;
  const totalCount = selectedDayTasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Active editing task mapping
  const activeTask = tasks.find(t => t._id === activeTaskId);

  useEffect(() => {
    if (activeTask) {
      setActiveTaskTitle(activeTask.title || '');
      setActiveTaskDesc(activeTask.description || '');
      setActiveTaskPriority(activeTask.priority || 'Medium');
      setActiveTaskDeadline(activeTask.deadline ? format(new Date(activeTask.deadline), 'yyyy-MM-dd') : '');
      setActiveTaskReminder(activeTask.reminderTime ? format(new Date(activeTask.reminderTime), "yyyy-MM-dd'T'HH:mm") : '');
      setActiveTaskRecurring(activeTask.recurring || 'none');
      setActiveTaskTags(activeTask.tags ? activeTask.tags.join(', ') : '');
    }
  }, [activeTaskId, activeTask]);

  // ─── CRUD Actions ───
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    await addTask({
      title: taskTitle.trim(),
      description: taskDesc.trim(),
      priority: taskPriority,
      deadline: taskDeadline ? new Date(taskDeadline) : undefined,
      reminderTime: taskReminder ? new Date(taskReminder) : undefined,
      recurring: taskRecurring,
      tags: taskTags ? taskTags.split(',').map(t => t.trim()).filter(t => t.length > 0) : [],
      date: selectedDateStr
    });

    // Reset Form
    setTaskTitle('');
    setTaskDesc('');
    setTaskPriority('Medium');
    setTaskDeadline('');
    setTaskReminder('');
    setTaskRecurring('none');
    setTaskTags('');
    setShowAddForm(false);
  };

  const handleUpdateActiveTask = async () => {
    if (!activeTask) return;
    
    await updateTask(activeTask._id, {
      title: activeTaskTitle.trim(),
      description: activeTaskDesc.trim(),
      priority: activeTaskPriority,
      deadline: activeTaskDeadline ? new Date(activeTaskDeadline) : null,
      reminderTime: activeTaskReminder ? new Date(activeTaskReminder) : null,
      recurring: activeTaskRecurring,
      tags: activeTaskTags ? activeTaskTags.split(',').map(t => t.trim()).filter(t => t.length > 0) : []
    });

    setActiveTaskId(null);
  };

  const toggleTaskStatus = async (taskItem) => {
    await updateTask(taskItem._id, { completed: !taskItem.completed });
  };

  // ─── Drag and Drop Handlers ───
  const handleDragStart = (e, id) => {
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, section) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (!id) return;

    if (section === 'completed') {
      await updateTask(id, { completed: true });
    } else if (section === 'today') {
      await updateTask(id, { date: selectedDateStr, completed: false });
    } else if (section === 'upcoming') {
      // Shift to next day from current selection
      const nextDay = new Date((startDate || new Date()).getTime() + 24 * 60 * 60 * 1000);
      await updateTask(id, { date: format(nextDay, 'yyyy-MM-dd'), completed: false });
    }
  };

  const toggleSection = (sec) => {
    setCollapsedSections(prev => ({ ...prev, [sec]: !prev[sec] }));
  };

  return (
    <div className="flex flex-col h-full bg-stone-50 dark:bg-stone-900 border-t lg:border-t-0 lg:border-l border-stone-200 dark:border-stone-850">
      
      {/* ── Header ── */}
      <div className="p-4 md:p-6 border-b border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-800 flex items-center justify-between transition-colors">
        {activeTask ? (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setActiveTaskId(null)} 
              className="p-1 -ml-1 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 transition-colors rounded hover:bg-stone-200 dark:hover:bg-stone-700"
              title="Back to list"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h3 className="font-serif text-base font-semibold text-stone-850 dark:text-stone-100 truncate max-w-[150px] sm:max-w-xs">
              Task Editor
            </h3>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-pine-600 dark:text-pine-455" />
            <h3 className="font-serif text-lg font-semibold text-stone-800 dark:text-stone-100">
              {currentContextTitle()}
            </h3>
          </div>
        )}
        
        {activeTask ? (
          <button 
            onClick={handleUpdateActiveTask}
            className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-md transition-colors text-pine-700 dark:text-pine-300 bg-pine-100 dark:bg-pine-900/40 hover:bg-pine-200 dark:hover:bg-pine-900/60"
          >
            <Save className="w-4 h-4" />
            <span>Save</span>
          </button>
        ) : (
          <button 
            onClick={handleSaveNote}
            className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-md transition-colors text-pine-700 dark:text-pine-300 bg-pine-100 dark:bg-pine-900/40 hover:bg-pine-200 dark:hover:bg-pine-900/60"
          >
            {isSaved ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Save className="w-4 h-4" />}
            <span>{isSaved ? 'Saved' : 'Save Notes'}</span>
          </button>
        )}
      </div>

      <div className="flex-1 p-4 md:p-6 bg-stone-50 dark:bg-stone-900 relative overflow-y-auto flex flex-col gap-6">
        {activeTask ? (
          /* ──────────────────────────────────────────────────────────
             Task Detail Editor Panel
             ────────────────────────────────────────────────────────── */
          <div className="flex flex-col gap-4 relative z-10 animate-in fade-in duration-200">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase text-stone-400 dark:text-stone-500">Title</label>
              <input
                type="text"
                value={activeTaskTitle}
                onChange={e => setActiveTaskTitle(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-sm text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-pine-500 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase text-stone-400 dark:text-stone-500 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Priority</label>
                <select
                  value={activeTaskPriority}
                  onChange={e => setActiveTaskPriority(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-xs text-stone-850 dark:text-stone-100 focus:outline-none"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase text-stone-400 dark:text-stone-500 flex items-center gap-1"><RotateCw className="w-3.5 h-3.5" /> Recurrence</label>
                <select
                  value={activeTaskRecurring}
                  onChange={e => setActiveTaskRecurring(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-xs text-stone-850 dark:text-stone-100 focus:outline-none"
                >
                  <option value="none">No Repeat</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase text-stone-400 dark:text-stone-500 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Deadline</label>
                <input
                  type="date"
                  value={activeTaskDeadline}
                  onChange={e => setActiveTaskDeadline(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-xs text-stone-850 dark:text-stone-100 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase text-stone-400 dark:text-stone-500 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Reminder</label>
                <input
                  type="datetime-local"
                  value={activeTaskReminder}
                  onChange={e => setActiveTaskReminder(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-xs text-stone-850 dark:text-stone-100 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase text-stone-400 dark:text-stone-500 flex items-center gap-1"><Tag className="w-3.5 h-3.5" /> Tags (Comma separated)</label>
              <input
                type="text"
                placeholder="Work, urgent, planning"
                value={activeTaskTags}
                onChange={e => setActiveTaskTags(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-xs text-stone-800 dark:text-stone-100 focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase text-stone-400 dark:text-stone-500">Details / Description</label>
              <textarea
                value={activeTaskDesc}
                onChange={e => setActiveTaskDesc(e.target.value)}
                placeholder="Add subtasks details, notes, links..."
                className="w-full h-32 px-4 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-xs text-stone-800 dark:text-stone-100 focus:outline-none resize-none"
              />
            </div>

            <div className="flex gap-2 mt-2">
              <button
                onClick={handleUpdateActiveTask}
                className="flex-1 py-2 text-center text-xs font-bold bg-pine-600 text-white rounded-lg hover:bg-pine-700 active:scale-95 transition-all"
              >
                Save Details
              </button>
              <button
                onClick={async () => {
                  if (window.confirm('Delete this task permanently?')) {
                    await deleteTask(activeTask._id);
                    setActiveTaskId(null);
                  }
                }}
                className="px-4 py-2 text-center text-xs font-bold bg-red-50 dark:bg-red-950/20 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>
        ) : (
          /* ──────────────────────────────────────────────────────────
             Standard Tasks & Notes Section
             ────────────────────────────────────────────────────────── */
          <>
            {/* Progress Analytics */}
            {totalCount > 0 && (
              <div className="w-full mb-1 bg-white dark:bg-stone-850 p-4 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm animate-in fade-in duration-200">
                <div className="flex justify-between text-xs text-stone-500 dark:text-stone-400 mb-1.5 font-bold">
                  <span>Day's Completion Rate</span>
                  <span>{progressPercent}% ({completedCount}/{totalCount})</span>
                </div>
                <div className="w-full bg-stone-200 dark:bg-stone-700 rounded-full h-2 overflow-hidden shadow-inner">
                  <div 
                    className="bg-pine-500 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Quick Add Button */}
            {!showAddForm ? (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full py-2.5 px-4 rounded-xl border-2 border-dashed border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-450 hover:text-pine-600 dark:hover:text-pine-400 hover:border-pine-300 dark:hover:border-pine-800 flex items-center justify-center gap-1.5 text-xs font-bold transition-all hover:bg-white dark:hover:bg-stone-800 active:scale-98"
              >
                <Plus className="w-4 h-4" /> Add Scheduled Task
              </button>
            ) : (
              /* Add Task Form Drawer */
              <form onSubmit={handleCreateTask} className="p-4 bg-white dark:bg-stone-850 border border-pine-200 dark:border-pine-900 rounded-2xl flex flex-col gap-3 shadow-md animate-in slide-in-from-top-4 duration-300">
                <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-1.5">
                  <span className="text-xs font-bold uppercase text-pine-700 dark:text-pine-400 flex items-center gap-1"><ListTodo className="w-3.5 h-3.5" /> Schedule New Task</span>
                  <button type="button" onClick={() => setShowAddForm(false)} className="text-stone-400 hover:text-stone-600"><X className="w-3.5 h-3.5" /></button>
                </div>
                <input 
                  type="text" 
                  value={taskTitle} 
                  required
                  onChange={e => setTaskTitle(e.target.value)} 
                  placeholder="Task title..." 
                  className="px-3 py-2 text-xs bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-750 rounded-lg focus:outline-none focus:ring-1 focus:ring-pine-500 text-stone-800 dark:text-stone-200 font-medium"
                />
                
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={taskPriority}
                    onChange={e => setTaskPriority(e.target.value)}
                    className="px-2 py-1.5 text-xs bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-750 rounded-lg focus:outline-none text-stone-700 dark:text-stone-300"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>

                  <select
                    value={taskRecurring}
                    onChange={e => setTaskRecurring(e.target.value)}
                    className="px-2 py-1.5 text-xs bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-750 rounded-lg focus:outline-none text-stone-700 dark:text-stone-300"
                  >
                    <option value="none">No Repeat</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={taskDeadline}
                    onChange={e => setTaskDeadline(e.target.value)}
                    placeholder="Deadline"
                    title="Deadline Date"
                    className="px-2 py-1.5 text-[10px] sm:text-xs bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-750 rounded-lg text-stone-700 dark:text-stone-300"
                  />
                  <input
                    type="datetime-local"
                    value={taskReminder}
                    onChange={e => setTaskReminder(e.target.value)}
                    placeholder="Reminder"
                    title="Reminder Date and Time"
                    className="px-2 py-1.5 text-[10px] sm:text-xs bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-750 rounded-lg text-stone-700 dark:text-stone-300"
                  />
                </div>

                <input 
                  type="text" 
                  value={taskTags} 
                  onChange={e => setTaskTags(e.target.value)} 
                  placeholder="Tags (comma separated e.g. Work, personal)" 
                  className="px-3 py-1.5 text-[10px] sm:text-xs bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-750 rounded-lg focus:outline-none text-stone-850 dark:text-stone-200"
                />

                <textarea
                  value={taskDesc}
                  onChange={e => setTaskDesc(e.target.value)}
                  placeholder="Description / details (optional)..."
                  className="px-3 py-1.5 h-16 text-xs bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-750 rounded-lg focus:outline-none resize-none text-stone-800 dark:text-stone-200"
                />

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3 py-1.5 rounded-lg text-xs text-stone-500 hover:bg-stone-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg text-xs font-bold bg-pine-600 hover:bg-pine-700 text-white active:scale-95 transition-all shadow-md shadow-pine-300/10"
                  >
                    Schedule Task
                  </button>
                </div>
              </form>
            )}

            {/* loading state skeleton */}
            {loading ? (
              <div className="flex flex-col gap-2.5 py-4">
                <div className="h-6 bg-stone-200 dark:bg-stone-800 rounded animate-pulse w-1/3" />
                <div className="h-10 bg-stone-100 dark:bg-stone-850 rounded-xl animate-pulse" />
                <div className="h-10 bg-stone-100 dark:bg-stone-850 rounded-xl animate-pulse" />
              </div>
            ) : (
              /* ──────────────────────────────────────────────────────────
                 Task Lists (Today, Overdue, Upcoming, Completed)
                 ────────────────────────────────────────────────────────── */
              <div className="flex flex-col gap-2.5">
                
                {/* 1. OVERDUE SECTION */}
                {overdueTasks.length > 0 && (
                  <div className="flex flex-col" onDragOver={handleDragOver} onDrop={e => handleDrop(e, 'today')}>
                    <button
                      onClick={() => toggleSection('overdue')}
                      className="flex items-center gap-1 px-1.5 py-1 text-xs font-bold text-red-500 hover:text-red-650 w-full justify-between"
                    >
                      <span className="flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" /> Overdue Tasks ({overdueTasks.length})
                      </span>
                      {collapsedSections.overdue ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    
                    {!collapsedSections.overdue && (
                      <div className="flex flex-col gap-1.5 mt-1 bg-rose-500/5 dark:bg-rose-500/5 p-2 rounded-xl border border-red-550/10">
                        {overdueTasks.map(t => (
                          <TaskRow 
                            key={t._id} 
                            task={t} 
                            toggleStatus={() => toggleTaskStatus(t)}
                            onEdit={() => setActiveTaskId(t._id)}
                            onDragStart={(e) => handleDragStart(e, t._id)}
                            isOverdue
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* SELECTED DATE EVENTS SECTION */}
                {selectedDayEvents.length > 0 && (
                  <div className="flex flex-col mb-4">
                    <div className="flex items-center gap-1.5 px-1.5 py-1 text-xs font-bold text-blue-600 dark:text-blue-400 w-full">
                      <Calendar className="w-3.5 h-3.5" /> Selected Date Events ({selectedDayEvents.length})
                    </div>
                    <div className="flex flex-col gap-1.5 mt-1 bg-blue-50/50 dark:bg-blue-950/10 p-3 rounded-xl border border-blue-200/50 dark:border-blue-900/30 shadow-sm">
                      {selectedDayEvents.map(ev => (
                        <div key={ev._id} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white dark:bg-stone-850 border border-stone-200/40 dark:border-stone-800 shadow-sm">
                          <Clock className="w-3.5 h-3.5 text-blue-550 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 flex flex-col min-w-0">
                            <span className="text-xs font-bold text-stone-800 dark:text-stone-200 truncate">
                              {ev.name}
                            </span>
                            <span className="text-[9px] text-stone-500 dark:text-stone-400 font-bold mt-0.5">
                              Time: {ev.time || '12:00'} | Duration: {ev.duration} mins
                            </span>
                            {ev.description && (
                              <p className="text-[10px] text-stone-600 dark:text-stone-400 mt-1 leading-relaxed border-t border-stone-100 dark:border-stone-800 pt-1">
                                {ev.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. TODAY / SELECTED DATE SECTION */}
                <div 
                  className="flex flex-col" 
                  onDragOver={handleDragOver} 
                  onDrop={e => handleDrop(e, 'today')}
                >
                  <button
                    onClick={() => toggleSection('today')}
                    className="flex items-center gap-1 px-1.5 py-1 text-xs font-bold text-stone-400 dark:text-stone-550 w-full justify-between"
                  >
                    <span>Selected Date Tasks ({activeSelectedTasks.length})</span>
                    {collapsedSections.today ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {!collapsedSections.today && (
                    <div className="flex flex-col gap-1.5 mt-1 bg-white dark:bg-stone-850 p-3 rounded-xl border border-stone-200/50 dark:border-stone-800 shadow-sm min-h-[60px]">
                      {activeSelectedTasks.length === 0 ? (
                        <div className="text-center py-4 text-xs text-stone-400 dark:text-stone-500">
                          Drag tasks here, or use schedule to plan.
                        </div>
                      ) : (
                        activeSelectedTasks.map(t => (
                          <TaskRow 
                            key={t._id} 
                            task={t} 
                            toggleStatus={() => toggleTaskStatus(t)}
                            onEdit={() => setActiveTaskId(t._id)}
                            onDragStart={(e) => handleDragStart(e, t._id)}
                          />
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* 3. UPCOMING SECTION */}
                {upcomingTasks.length > 0 && (
                  <div className="flex flex-col" onDragOver={handleDragOver} onDrop={e => handleDrop(e, 'upcoming')}>
                    <button
                      onClick={() => toggleSection('upcoming')}
                      className="flex items-center gap-1 px-1.5 py-1 text-xs font-bold text-stone-400 dark:text-stone-555 w-full justify-between"
                    >
                      <span>Upcoming Future Tasks ({upcomingTasks.length})</span>
                      {collapsedSections.upcoming ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {!collapsedSections.upcoming && (
                      <div className="flex flex-col gap-1.5 mt-1 bg-stone-100/50 dark:bg-stone-850/40 p-2 rounded-xl border border-stone-200/30 dark:border-stone-800">
                        {upcomingTasks.map(t => (
                          <TaskRow 
                            key={t._id} 
                            task={t} 
                            toggleStatus={() => toggleTaskStatus(t)}
                            onEdit={() => setActiveTaskId(t._id)}
                            onDragStart={(e) => handleDragStart(e, t._id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. COMPLETED SECTION */}
                {completedSelectedTasks.length > 0 && (
                  <div className="flex flex-col" onDragOver={handleDragOver} onDrop={e => handleDrop(e, 'completed')}>
                    <button
                      onClick={() => toggleSection('completed')}
                      className="flex items-center gap-1 px-1.5 py-1 text-xs font-bold text-stone-400 dark:text-stone-555 w-full justify-between"
                    >
                      <span>Completed Tasks ({completedSelectedTasks.length})</span>
                      {collapsedSections.completed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {!collapsedSections.completed && (
                      <div className="flex flex-col gap-1.5 mt-1 bg-white/40 dark:bg-stone-850/30 p-2 rounded-xl border border-stone-200/20 dark:border-stone-800">
                        {completedSelectedTasks.map(t => (
                          <TaskRow 
                            key={t._id} 
                            task={t} 
                            toggleStatus={() => toggleTaskStatus(t)}
                            onEdit={() => setActiveTaskId(t._id)}
                            onDragStart={(e) => handleDragStart(e, t._id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Notes & Reflections area connected to notes API */}
            <div className="flex-1 relative min-h-[220px] w-full border-t border-stone-200/80 dark:border-stone-800 pt-5 mt-2">
              <div className="flex items-center gap-2 mb-2 relative z-10 px-1 justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">Notes & Reflections</span>
                {isNoteLoading && <span className="text-[10px] text-stone-400 animate-pulse">Loading note...</span>}
              </div>
              
              {/* Notebook rule lines */}
              <div className="absolute top-12 bottom-0 left-0 right-0 pointer-events-none opacity-20 dark:opacity-10" 
                   style={{ backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #a8a29e 31px, #a8a29e 32px)', marginTop: '4px' }}>
              </div>
              <textarea
                value={note}
                onChange={(e) => {
                  setNote(e.target.value);
                  setIsSaved(false);
                }}
                placeholder="Write summaries, reflections, or notes for the selected date..."
                className="w-full h-[calc(100%-2.5rem)] min-h-[160px] bg-transparent resize-none outline-none leading-[32px] text-stone-700 dark:text-stone-300 placeholder:text-stone-400 dark:placeholder:text-stone-600 font-sans z-10 relative pt-1"
                style={{ lineHeight: '32px' }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Individual Task Row Sub-Component ───
function TaskRow({ task, toggleStatus, onEdit, onDragStart, isOverdue = false }) {
  const priorityBadge = PRIORITY_BADGES[task.priority] || PRIORITY_BADGES.Medium;
  const deadlineDate = task.deadline ? new Date(task.deadline) : null;
  const overdueColor = isOverdue ? 'text-red-500 dark:text-red-400' : 'text-stone-700 dark:text-stone-200';

  return (
    <div 
      draggable
      onDragStart={onDragStart}
      className={`flex items-center gap-2.5 group p-2 rounded-xl transition-all border border-transparent hover:border-stone-200 dark:hover:border-stone-750 hover:bg-stone-50 dark:hover:bg-stone-800 cursor-grab active:cursor-grabbing hover:shadow-sm bg-white dark:bg-stone-800/60
        ${task.completed ? 'opacity-70' : ''}
      `}
    >
      <button 
        onClick={toggleStatus} 
        className={`w-4 h-4 rounded-md flex-shrink-0 border flex items-center justify-center transition-colors cursor-pointer
          ${task.completed ? 'bg-pine-500 border-pine-500 text-white' : 'border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-700'}
        `}
      >
        {task.completed && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
      </button>

      <div className="flex-1 flex flex-col min-w-0" onClick={onEdit}>
        <span 
          className={`text-xs font-bold truncate cursor-pointer group-hover:text-pine-600 dark:group-hover:text-pine-400 transition-colors
            ${task.completed ? 'text-stone-400 dark:text-stone-500 line-through' : overdueColor}
          `}
        >
          {task.title}
        </span>
        
        {/* Badges/Sub-elements for task info */}
        {!task.completed && (task.priority || deadlineDate || task.recurring !== 'none') && (
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${priorityBadge}`}>
              {task.priority}
            </span>
            {deadlineDate && (
              <span className="text-[8px] font-bold flex items-center gap-0.5 text-stone-400">
                <Clock className="w-2.5 h-2.5" /> {format(deadlineDate, 'MMM d')}
              </span>
            )}
            {task.recurring !== 'none' && (
              <span className="text-[8px] font-bold flex items-center gap-0.5 text-stone-400 bg-stone-100 dark:bg-stone-800/80 px-1 py-0.5 rounded">
                <RotateCw className="w-2.5 h-2.5 text-pine-550" /> {task.recurring}
              </span>
            )}
            {task.tags && task.tags.slice(0, 2).map((tg, i) => (
              <span key={i} className="text-[8px] font-bold text-blue-500 bg-blue-50/50 dark:bg-blue-950/20 px-1.5 py-0.5 rounded-full border border-blue-100/50 dark:border-blue-900/30">
                #{tg}
              </span>
            ))}
          </div>
        )}
      </div>

      <button 
        onClick={onEdit}
        className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-all rounded"
        aria-label="Edit task"
      >
        <Edit3 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
