import axios from 'axios';

const api = axios.create({
  baseURL: 'https://ebook-xacu.onrender.com/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bv_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // For FormData, remove Content-Type so the browser sets it with the correct multipart boundary
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

// Response interceptor — handle auth errors
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('bv_admin_token');
      localStorage.removeItem('bv_admin_user');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error);
  }
);

export default api;
