import api from './api';
import { storage } from '../utils/storage';
import { AuthResponse } from '../types';

export const authService = {
  async sendOTP(mobileNumber: string, countryCode: string = '+91') {
    console.log('authService.sendOTP called with:', { mobileNumber, countryCode });
    const response = await api.post('/auth/send-otp', {
      mobile_number: mobileNumber,
      country_code: countryCode,
    });
    console.log('authService.sendOTP response:', response.data);
    return response.data;
  },

  async verifyOTP(mobileNumber: string, otp: string, countryCode: string = '+91'): Promise<AuthResponse> {
    const response = await api.post('/auth/verify-otp', {
      mobile_number: mobileNumber,
      country_code: countryCode,
      otp,
    });

    // After interceptor, response.data = { access_token, refresh_token, is_new_user, user }
    const data = response.data as AuthResponse;

    await storage.setItem('auth_token', data.access_token);
    await storage.setItem('user_id', data.user.id);
    await storage.setItem('login_time', Date.now().toString());

    return data;
  },

  async resendOTP(mobileNumber: string, countryCode: string = '+91') {
    const response = await api.post('/auth/resend-otp', {
      mobile_number: mobileNumber,
      country_code: countryCode,
    });
    return response.data;
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
    if (!token) return false;
    const loginTime = await storage.getItem('login_time');
    if (!loginTime) return false;
    const ONE_DAY = 24 * 60 * 60 * 1000;
    return Date.now() - parseInt(loginTime) < ONE_DAY;
  },

  async getStoredUserId() {
    return await storage.getItem('user_id');
  },
};
