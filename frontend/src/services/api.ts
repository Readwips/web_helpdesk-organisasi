import axios from 'axios';
import { useAuthStore } from '../store/authStore';

export const API_URL = import.meta.env.VITE_API_URL || '/api';
const api = axios.create({ baseURL: API_URL, withCredentials: true });
api.interceptors.request.use((config) => {
  if (config.method && !['get', 'head', 'options'].includes(config.method)) {
    const token = useAuthStore.getState().csrfToken;
    if (token) config.headers['X-CSRF-Token'] = token;
  }
  return config;
});
api.interceptors.response.use((response) => response, (error) => {
  if (error.response?.status === 401 && !String(error.config?.url).includes('/auth/login')) useAuthStore.getState().logout();
  return Promise.reject(error);
});
export default api;
