import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://lohparkir-production.up.railway.app/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — tambahkan token
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401 auto-refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        const newToken = res.data.data.accessToken;
        await AsyncStorage.setItem('accessToken', newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ─── API Methods ──────────────────────────────────────────────────────────────

export const qrApi = {
  validate: (kode: string, gpsLat?: number, gpsLng?: number) =>
    api.post('/qr/validate', { kode, gpsLat, gpsLng }),
};

export const reportApi = {
  submit: (formData: FormData) =>
    api.post('/reports', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  track: (ticketNo: string) => api.get(`/reports/track/${ticketNo}`),
};

export const transactionApi = {
  create: (data: {
    officerId: string;
    zonaId?: string;
    nominal: number;
    metode: 'qris' | 'tunai';
    idempotencyKey?: string;
  }) => api.post('/transactions', data),
  myHistory: (page = 1) => api.get(`/transactions/my?page=${page}`),
};

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
  updateFcmToken: (fcmToken: string) =>
    api.put('/auth/fcm-token', { fcmToken }),
};

export const dashboardApi = {
  publicStats: () => api.get('/dashboard/public'),
};

export const notificationApi = {
  list: () => api.get('/notifications'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
};

export const emergencyApi = {
  panic: (gpsLat: number, gpsLng: number) =>
    api.post('/admin/emergency', { gpsLat, gpsLng }),
};
