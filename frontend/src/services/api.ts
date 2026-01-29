import axios from 'axios';

// Create Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api', // Default to localhost if not set
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Add Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle Errors (e.g., 401 logging out)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear local storage and redirect to login if unauthorized
      // Note: We can't use useNavigate here directly outside a component.
      // Ideally, we handle this in the UI or by dispatching a logout action if we had access to the store.
      // For now, we'll just clear the token.
      localStorage.removeItem('token');
      // optional: window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
