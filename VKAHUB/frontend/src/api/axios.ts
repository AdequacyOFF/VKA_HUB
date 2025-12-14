import axios from 'axios';
import { useAuthStore } from '@/store';

// In production (Docker/NGINX), use empty string to make requests relative
// In development, use VITE_API_URL or fallback to empty string (Vite proxy handles /api)
const API_URL = import.meta.env.VITE_API_URL || '';

export const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't attempt token refresh for auth endpoints
    const isAuthEndpoint = originalRequest.url?.includes('/api/auth/login') ||
                           originalRequest.url?.includes('/api/auth/register') ||
                           originalRequest.url?.includes('/api/auth/refresh');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      const { refreshToken, logout } = useAuthStore.getState();

      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/api/auth/refresh`, {
            refresh_token: refreshToken,
          });

          const { access_token, refresh_token, user } = response.data;

          useAuthStore.getState().setAuth(user, access_token, refresh_token);

          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          logout();
          window.location.href = '/auth/login';
          return Promise.reject(refreshError);
        }
      } else {
        logout();
        window.location.href = '/auth/login';
      }
    }

    return Promise.reject(error);
  }
);
