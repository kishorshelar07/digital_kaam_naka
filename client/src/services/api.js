/**
 * services/api.js — Axios Instance
 * Fixed: No infinite retry loop on 401
 * Author: Digital Kaam Naka Dev Team
 */

import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request Interceptor — attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('kamnaka_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor — NO infinite loop
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || 'Something went wrong. Please try again.';
    const url = error.config?.url || '';

    // refresh-token fail → clear and go to login (NO retry)
    if (url.includes('/auth/refresh-token')) {
      localStorage.removeItem('kamnaka_token');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // 401 → clear token and redirect
    if (status === 401) {
      localStorage.removeItem('kamnaka_token');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Other errors → show toast
    if (status >= 400 && status !== 401) {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default api;