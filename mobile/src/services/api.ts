import axios from 'axios';
import { storage } from '../utils/storage';

// Get backend URL — validate it's a proper absolute URL
const rawUrl = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const BACKEND_URL = rawUrl.startsWith('http') ? rawUrl : 'http://localhost:5001';

console.log('API Base URL:', BACKEND_URL);

const api = axios.create({
  baseURL: `${BACKEND_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await storage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Unwrap backend's { success, data, message } envelope and handle errors
api.interceptors.response.use(
  (response) => {
    // If response has { success, data } shape, unwrap the data field
    if (
      response.data &&
      typeof response.data === 'object' &&
      'success' in response.data &&
      'data' in response.data
    ) {
      response.data = response.data.data;
    }
    return response;
  },
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    return Promise.reject(error);
  }
);

export default api;
