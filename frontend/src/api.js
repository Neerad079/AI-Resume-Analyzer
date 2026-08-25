import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hireiq_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('hireiq_token');
      localStorage.removeItem('hireiq_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  googleLogin: (data) => api.post('/auth/google', data),
};

// Resumes (Multi-Resume Profile)
export const resumeAPI = {
  list: () => api.get('/resumes'),
  create: (data) => api.post('/resumes', data),
  update: (id, data) => api.put(`/resumes/${id}`, data),
  delete: (id) => api.delete(`/resumes/${id}`),
  parse: (formData) => api.post('/resumes/parse', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  upload: (formData) => api.post('/resumes/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

// Analysis
export const analysisAPI = {
  match: (data) => api.post('/analysis/match', data),
};

// Outreach
export const outreachAPI = {
  generate: (data) => api.post('/outreach/generate', data),
};

// History
export const historyAPI = {
  list: (page = 0, size = 10) => api.get(`/history?page=${page}&size=${size}`),
  save: (data) => api.post('/history', data),
  delete: (id) => api.delete(`/history/${id}`),
};

export default api;
