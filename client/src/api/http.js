import axios from 'axios';
import { ElMessage } from 'element-plus';

const TOKEN_KEY = 'xprl_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  timeout: 15000,
});

http.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || '网络异常，请稍后重试';
    const code = error.response?.data?.code;

    if (status === 401) {
      clearToken();
      window.dispatchEvent(new CustomEvent('xprl:unauthorized'));
    } else {
      ElMessage.error(message);
    }

    return Promise.reject({ status, message, code });
  },
);

export default http;
