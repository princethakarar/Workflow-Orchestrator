import axios from 'axios';
import { handleError } from '../utils/errorHandler';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_URL = `${API_BASE_URL.replace(/\/$/, '')}/api/v1/auth`;

// Create axios instance with credentials to handle cookies
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Register user
export const register = async (userData) => {
  try {
    const response = await api.post('/register', userData);
    // Backend returns user in response.data.data.user
    // Do not set user in localStorage until verified and logged in.
    return response.data;
  } catch (error) {
    throw new Error(handleError(error, 'Registration failed. Please try again.'));
  }
};

// Login user
export const login = async (credentials) => {
  try {
    const response = await api.post('/login', credentials);
    // Backend sets cookies automatically, we just need to store user data
    if (response.data?.data?.user) {
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
      // Store tokens in localStorage as backup (backend uses cookies)
      if (response.data.data.accessToken) {
        localStorage.setItem('accessToken', response.data.data.accessToken);
      }
      if (response.data.data.refreshToken) {
        localStorage.setItem('refreshToken', response.data.data.refreshToken);
      }
    }
    return response.data;
  } catch (error) {
    throw new Error(handleError(error, 'Login failed. Please try again.'));
  }
};

// Logout user
export const logout = async () => {
  try {
    await api.post('/logout');
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
};

// Get current user
export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// Get token
export const getToken = () => {
  return localStorage.getItem('accessToken');
};

// Verify Email OTP
export const verifyEmailOTP = async (data) => {
  // data = { email, otp }
  const response = await api.post('/verify-email', data);
  return response.data;
};

// Resend OTP
// Resend OTP
export const resendOTP = async (email) => {
  const response = await api.post('/resend-email-verification', { email });
  return response.data;
};

// Forgot Password (Send OTP)
export const forgotPassword = async (email) => {
  const response = await api.post('/forgot-password', { email });
  return response.data;
};

// Verify Forgot Password OTP
export const verifyForgotOTP = async (email, otp) => {
  const response = await api.post('/verify-forgot-otp', { email, otp });
  // Returns { resetToken }
  return response.data;
};

// Reset Password
export const resetPassword = async (resetToken, newPassword) => {
  const response = await api.post('/reset-password', { resetToken, newPassword });
  return response.data;
};

export default api;