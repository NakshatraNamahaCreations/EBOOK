import api from './api';
import { storage } from '../utils/storage';
import { AuthResponse } from '../types';

export const authService = {
  async login(identifier: string, password: string): Promise<AuthResponse> {
    const response = await api.post('/auth/login', { identifier, password });
    const data = response.data as AuthResponse;
    await storage.setItem('auth_token', data.access_token);
    await storage.setItem('user_id', data.user.id);
    await storage.setItem('login_time', Date.now().toString());
    return data;
  },

  async register(name: string, phone: string, email: string, password: string, referralCode?: string): Promise<AuthResponse> {
    const response = await api.post('/auth/register', { name, phone, email, password, ...(referralCode ? { referralCode: referralCode.toUpperCase() } : {}) });
    const data = response.data as AuthResponse;
    await storage.setItem('auth_token', data.access_token);
    await storage.setItem('user_id', data.user.id);
    await storage.setItem('login_time', Date.now().toString());
    return data;
  },

  async sendOTP(mobileNumber: string, countryCode: string = '+91') {
    const response = await api.post('/auth/send-otp', {
      mobile_number: mobileNumber,
      country_code: countryCode,
    });
    return response.data;
  },

  async verifyOTP(mobileNumber: string, otp: string, countryCode: string = '+91'): Promise<AuthResponse> {
    const response = await api.post('/auth/verify-otp', {
      mobile_number: mobileNumber,
      country_code: countryCode,
      otp,
    });
    const data = response.data as AuthResponse;
    await storage.setItem('auth_token', data.access_token);
    await storage.setItem('user_id', data.user.id);
    await storage.setItem('login_time', Date.now().toString());
    return data;
  },

  async fetchCurrentUser() {
    const response = await api.get('/reader/profile');
    return response.data as import('../types').User;
  },

  async forgotPasswordOTP(email: string): Promise<{ message: string; expiresIn: number; otp?: string }> {
    const response = await api.post('/auth/forgot-password-otp', { email });
    return response.data;
  },

  async verifyForgotPasswordOTP(email: string, otp: string): Promise<{ message: string; resetToken: string }> {
    const response = await api.post('/auth/verify-forgot-password-otp', { email, otp });
    return response.data;
  },

  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    const response = await api.post('/auth/reset-password', { token, password });
    return response.data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.post('/auth/change-password', { currentPassword, newPassword });
  },

  async logout() {
    await storage.removeItem('auth_token');
    await storage.removeItem('user_id');
    await storage.removeItem('login_time');
  },

  async getStoredToken() {
    return await storage.getItem('auth_token');
  },

  async isSessionValid() {
    const token = await storage.getItem('auth_token');
    return !!token;
  },

  async getStoredUserId() {
    return await storage.getItem('user_id');
  },
};
