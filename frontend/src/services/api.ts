import axios from 'axios';
import { router } from '../router';

// Create Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // 1. Attempt to refresh
        await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/refresh`, {}, { withCredentials: true });

        // 2. Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // 3. Refresh failed? Session is dead. Force Logout.
        const isAuthCheck = originalRequest.url?.includes('/auth/me');
        if (!isAuthCheck && window.location.pathname !== '/login') {
          router.navigate('/login');
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
