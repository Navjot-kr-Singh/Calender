import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const getHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

export const taskService = {
  async getTasks(token, params = {}) {
    const response = await axios.get(`${API_URL}/tasks`, {
      ...getHeaders(token),
      params
    });
    return response.data;
  },

  async getTaskById(token, id) {
    const response = await axios.get(`${API_URL}/tasks/${id}`, getHeaders(token));
    return response.data;
  },

  async getTasksByDate(token, date) {
    const response = await axios.get(`${API_URL}/tasks/date/${date}`, getHeaders(token));
    return response.data;
  },

  async createTask(token, taskData) {
    const response = await axios.post(`${API_URL}/tasks`, taskData, getHeaders(token));
    return response.data;
  },

  async updateTask(token, id, updates) {
    const response = await axios.patch(`${API_URL}/tasks/${id}`, updates, getHeaders(token));
    return response.data;
  },

  async deleteTask(token, id) {
    const response = await axios.delete(`${API_URL}/tasks/${id}`, getHeaders(token));
    return response.data;
  }
};
