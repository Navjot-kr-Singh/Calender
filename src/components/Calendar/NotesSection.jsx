import React, { useState, useEffect, useRef } from 'react';
import { StickyNote, Save, CheckCircle2, ListTodo, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';

export default function NotesSection({ currentDate, startDate, endDate }) {
  const [note, setNote] = useState('');
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { getToken, isSignedIn } = useAuth();

  const API_URL = import.meta.env.VITE_API_URL || '/api';

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
      return `${format(startDate, 'MMM d')} Notes`;
    }
    return `${format(currentDate, 'MMMM')} Notes`;
  };

  useEffect(() => {
    const fetchNote = async () => {
      if (!isSignedIn) return;
      setIsLoading(true);
      try {
        const token = await getToken();
        const key = getStorageKey();
        const response = await axios.get(`${API_URL}/notes/${key}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNote(response.data.content || '');
        setTasks(response.data.tasks || []);
      } catch (error) {
        console.error("Failed to fetch note:", error);
      } finally {
        setIsLoading(false);
        setIsSaved(false);
        setActiveTaskId(null);
      }
    };
    fetchNote();
  }, [currentDate, startDate, endDate, isSignedIn, getToken, API_URL]);

  const handleSave = async () => {
    if (!isSignedIn) return;
    try {
      const token = await getToken();
      const key = getStorageKey();
      await axios.post(`${API_URL}/notes/${key}`, { content: note, tasks }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (error) {
      console.error("Failed to save note:", error);
    }
  };

  const addTask = (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    setTasks([...tasks, { id: Date.now().toString(), text: newTask.trim(), completed: false, description: '' }]);
    setNewTask('');
    setIsSaved(false);
  };

  const updateTaskDescription = (id, description) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, description } : t));
    setIsSaved(false);
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    setIsSaved(false);
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
    setIsSaved(false);
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const activeTask = tasks.find(t => t.id === activeTaskId);

  return (
    <div className="flex flex-col h-full bg-stone-50 dark:bg-stone-900 border-t md:border-t-0 md:border-l border-stone-200 dark:border-stone-700">
      <div className="p-4 md:p-6 border-b border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 flex items-center justify-between transition-colors">
        {activeTask ? (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => { setActiveTaskId(null); handleSave(); }} 
              className="p-1 -ml-1 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 transition-colors rounded hover:bg-stone-200 dark:hover:bg-stone-700"
              title="Back to tasks"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h3 className="font-serif text-lg font-semibold text-stone-800 dark:text-stone-100 truncate max-w-[200px] sm:max-w-xs">
              Task Details
            </h3>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <StickyNote className="w-5 h-5 text-pine-600 dark:text-pine-400" />
            <h3 className="font-serif text-lg font-semibold text-stone-800 dark:text-stone-100">
              {currentContextTitle()}
            </h3>
          </div>
        )}
        <button 
          onClick={handleSave}
          className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md transition-colors text-pine-700 dark:text-pine-300 bg-pine-100 dark:bg-pine-900/40 hover:bg-pine-200 dark:hover:bg-pine-900/60"
        >
          {isSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span>{isSaved ? 'Saved' : 'Save'}</span>
        </button>
      </div>
      
      <div className="flex-1 p-4 md:p-6 bg-stone-50 dark:bg-stone-900 relative overflow-y-auto flex flex-col gap-6">
        
        {activeTask ? (
          <div className="flex flex-col h-full gap-4 relative z-10">
             <div className="flex items-start gap-3 bg-white dark:bg-stone-800 p-4 rounded-xl border border-stone-200 dark:border-stone-700 shadow-sm">
                <button 
                   onClick={() => toggleTask(activeTask.id)} 
                   className={`w-5 h-5 mt-0.5 rounded flex-shrink-0 border flex items-center justify-center transition-colors ${activeTask.completed ? 'bg-pine-500 border-pine-500 text-white' : 'border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-700'}`}
                >
                  {activeTask.completed && <CheckCircle2 className="w-4 h-4" />}
                </button>
                <div className={`text-base font-medium flex-1 ${activeTask.completed ? 'text-stone-400 line-through' : 'text-stone-800 dark:text-stone-100'}`}>
                  {activeTask.text}
                </div>
             </div>

             <div className="flex-1 flex flex-col relative w-full border-t border-stone-200/80 dark:border-stone-700/80 pt-4">
                <div className="flex items-center gap-2 mb-2 relative z-10 px-1">
                   <span className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">Description / Details</span>
                </div>
                <textarea
                  value={activeTask.description || ''}
                  onChange={(e) => updateTaskDescription(activeTask.id, e.target.value)}
                  placeholder="Add details, subtasks, or links related to this task..."
                  className="w-full h-full min-h-[250px] bg-transparent resize-none outline-none leading-relaxed text-sm text-stone-700 dark:text-stone-300 placeholder:text-stone-400 dark:placeholder:text-stone-600 font-sans z-10 relative pt-1"
                />
             </div>
          </div>
        ) : (
          <>
            {/* Tasks Section */}
            <div className="flex flex-col gap-3 relative z-10 w-full shrink-0">
               {tasks.length > 0 && (
                 <div className="w-full mb-1">
                   <div className="flex justify-between text-xs text-stone-500 dark:text-stone-400 mb-1.5 font-medium">
                     <span>Today's Progress</span>
                     <span>{progressPercent}% ({completedCount}/{tasks.length})</span>
                   </div>
                   <div className="w-full bg-stone-200 dark:bg-stone-700 rounded-full h-1.5 overflow-hidden">
                     <div className="bg-pine-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }}></div>
                   </div>
                 </div>
               )}
               
               <form onSubmit={addTask} className="flex gap-2">
                 <input 
                   type="text" 
                   value={newTask} 
                   onChange={e => setNewTask(e.target.value)} 
                   placeholder="Add a new task..." 
                   className="flex-1 px-3 py-1.5 text-sm bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-md focus:outline-none focus:border-pine-400 focus:ring-1 focus:ring-pine-400 text-stone-700 dark:text-stone-300 placeholder-stone-400 dark:placeholder-stone-600 transition-colors"
                 />
                 <button type="submit" disabled={!newTask.trim()} className="p-1.5 bg-pine-100 dark:bg-pine-900/40 text-pine-700 dark:text-pine-300 rounded-md hover:bg-pine-200 dark:hover:bg-pine-900/60 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed">
                   <Plus className="w-4 h-4" />
                 </button>
               </form>

               {tasks.length > 0 && (
                 <div className="flex flex-col gap-1.5 mt-1 border border-stone-100 dark:border-stone-700 bg-white dark:bg-stone-800 p-3 rounded-xl shadow-sm">
                   {tasks.map((t, idx) => (
                     <div key={t.id} className={`flex items-center gap-3 group p-1.5 rounded-lg transition-colors hover:bg-stone-50 dark:hover:bg-stone-700/50 ${idx !== tasks.length -1 ? 'border-b border-stone-50/50 dark:border-stone-700/30' : ''}`}>
                       <button 
                          onClick={() => toggleTask(t.id)} 
                          className={`w-4 h-4 rounded flex-shrink-0 border flex items-center justify-center transition-colors ${t.completed ? 'bg-pine-500 border-pine-500 text-white' : 'border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-700'}`}
                       >
                         {t.completed && <CheckCircle2 className="w-3 h-3" />}
                       </button>
                       <span 
                         onClick={() => setActiveTaskId(t.id)}
                         className={`text-sm flex-1 transition-colors cursor-pointer hover:text-pine-600 dark:hover:text-pine-400 ${t.completed ? 'text-stone-400 dark:text-stone-500 font-medium line-through' : 'text-stone-700 dark:text-stone-200 font-medium'}`}
                         title="Click to add details"
                       >
                         {t.text}
                       </span>
                       <button 
                         onClick={() => deleteTask(t.id)} 
                         className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 dark:text-stone-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all focus:opacity-100"
                         aria-label="Delete task"
                       >
                         <Trash2 className="w-3.5 h-3.5" />
                       </button>
                     </div>
                   ))}
                 </div>
               )}
            </div>

            {/* Notes Section */}
            <div className="flex-1 relative min-h-[200px] w-full border-t border-stone-200/80 dark:border-stone-700/80 pt-6">
              <div className="flex items-center gap-2 mb-2 relative z-10 px-1">
                 <span className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">Notes & Reflections</span>
              </div>
              {/* Lined notebook effect */}
              <div className="absolute top-12 bottom-0 left-0 right-0 pointer-events-none opacity-20 dark:opacity-10" 
                   style={{ backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #a8a29e 31px, #a8a29e 32px)', marginTop: '4px' }}>
              </div>
              <textarea
                value={note}
                onChange={(e) => {
                  setNote(e.target.value);
                  setIsSaved(false);
                }}
                placeholder="Jot down notes, goals, or important events here..."
                className="w-full h-[calc(100%-2rem)] min-h-[150px] bg-transparent resize-none outline-none leading-[32px] text-stone-700 dark:text-stone-300 placeholder:text-stone-400 dark:placeholder:text-stone-600 font-sans z-10 relative pt-1"
                style={{ 
                  lineHeight: '32px'
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
