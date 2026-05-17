import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Copy, Edit, Trash2, X, Check } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import Navbar from '../Navbar';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const { getToken, isSignedIn } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    duration: 30,
    description: '',
    isActive: true
  });

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
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [isSignedIn]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = await getToken();
      if (editingEvent) {
        await axios.patch(`${API_URL}/events/${editingEvent._id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_URL}/events`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setIsModalOpen(false);
      setEditingEvent(null);
      setFormData({ name: '', duration: 30, description: '', isActive: true });
      fetchEvents();
    } catch (error) {
      console.error("Failed to save event:", error);
    }
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setFormData({
      name: event.name,
      duration: event.duration,
      description: event.description || '',
      isActive: event.isActive
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      const token = await getToken();
      await axios.delete(`${API_URL}/events/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchEvents();
    } catch (error) {
      console.error("Failed to delete event:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      <Navbar />
      
      <main className="flex-1 max-w-7xl mx-auto w-full p-8">
        <div className="flex items-center justify-between mb-12">
          <h1 className="text-5xl font-black text-gray-900 tracking-tight">Events</h1>
          <button 
            onClick={() => {
              setEditingEvent(null);
              setFormData({ name: '', duration: 30, description: '', isActive: true });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-[#1e4eb8] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
          >
            <Plus className="w-6 h-6" />
            Create Event
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center mb-6 border-2 border-gray-200">
              <Calendar className="w-12 h-12 text-gray-400" />
            </div>
            <p className="text-xl text-gray-500 font-medium mb-8 max-w-sm">
              You do not have any events yet. Create your first event to get started!
            </p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-[#1e4eb8] text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
            >
              <Plus className="w-6 h-6" />
              New Event
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event) => (
              <div key={event._id} className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                {!event.isActive && (
                  <div className="absolute top-0 left-0 w-full h-1 bg-gray-300"></div>
                )}
                <div className="flex flex-col gap-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">{event.name}</h3>
                    <p className="text-gray-500 font-medium">{event.duration} mins</p>
                  </div>
                  
                  <p className="text-gray-600 line-clamp-3 min-h-[4.5rem]">
                    {event.description || "No description provided."}
                  </p>

                  <div className="flex items-center gap-3 mt-4">
                    <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 text-gray-700 rounded-xl font-bold border border-gray-200 hover:bg-gray-100 transition-colors">
                      <Copy className="w-4 h-4" />
                      Copy Link
                    </button>
                    <button 
                      onClick={() => handleEdit(event)}
                      className="px-4 py-3 bg-blue-50 text-blue-700 rounded-xl font-bold border border-blue-100 hover:bg-blue-100 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(event._id)}
                      className="px-4 py-3 bg-red-50 text-red-600 rounded-xl font-bold border border-red-100 hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* New Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl animate-in fade-in zoom-in duration-200 relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-8 right-8 p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-3xl font-black text-gray-900 mb-8">{editingEvent ? 'Edit Event' : 'New Event'}</h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-8">
              <div className="flex flex-col gap-2">
                <label className="text-lg font-bold text-gray-800">Event Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all text-gray-800 font-medium"
                  placeholder="e.g. 15 Minute Meeting"
                />
                <p className="text-gray-400 font-medium text-sm">The name users will see when booking</p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-lg font-bold text-gray-800">Duration</label>
                <input 
                  type="number" 
                  required
                  value={formData.duration}
                  onChange={e => setFormData({...formData, duration: parseInt(e.target.value)})}
                  className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all text-gray-800 font-medium"
                />
                <p className="text-gray-400 font-medium text-sm">In minutes</p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-lg font-bold text-gray-800">Description</label>
                <textarea 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all text-gray-800 font-medium min-h-[120px] resize-none"
                  placeholder="Optional description of the event"
                />
              </div>

              <div className="flex items-center gap-4">
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                  className={`w-14 h-8 rounded-full relative transition-colors ${formData.isActive ? 'bg-[#1a1a1a]' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${formData.isActive ? 'translate-x-6' : ''}`}></div>
                </button>
                <div>
                  <p className="text-lg font-bold text-gray-800 leading-none mb-1">Active</p>
                  <p className="text-gray-400 font-medium text-sm">Inactive events will not be visible for users to book</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-4 mt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-8 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-[#1e4eb8] text-white px-10 py-4 rounded-2xl font-bold shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsPage;
