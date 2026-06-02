import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const api = axios.create({ baseURL: BASE_URL });

// Request interceptor — tambahkan JWT token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
          const newToken = res.data.data.accessToken;
          localStorage.setItem('accessToken', newToken);
          error.config.headers.Authorization = `Bearer ${newToken}`;
          return api(error.config);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      } else {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ─── Typed API Calls ──────────────────────────────────────────────────────────
export const authApi = {
  login:    (email: string, password: string) => api.post('/auth/login', { email, password }),
  me:       () => api.get('/auth/me'),
  logout:   () => api.post('/auth/logout'),
};

export const dashboardApi = {
  stats:    () => api.get('/dashboard/stats'),
  trend:    (period = 'daily', days = 30) => api.get(`/dashboard/trend?period=${period}&days=${days}`),
  revenue:  (days = 30) => api.get(`/dashboard/revenue?days=${days}`),
  heatmap:  () => api.get('/dashboard/heatmap'),
  publicStats: () => api.get('/dashboard/public'),
};

export const officersApi = {
  list:     (params?: Record<string, any>) => api.get('/officers', { params }),
  get:      (id: string) => api.get(`/officers/${id}`),
  create:   (data: any) => api.post('/officers', data),
  update:   (id: string, data: any) => api.put(`/officers/${id}`, data),
  toggle:   (id: string) => api.patch(`/officers/${id}/toggle`),
};

export const qrApi = {
  generate: (officerId: string) => api.post('/qr/generate', { officerId }),
  revoke:   (id: string) => api.delete(`/qr/${id}/revoke`),
};

export const reportsApi = {
  list:         (params?: Record<string, any>) => api.get('/reports', { params }),
  get:          (id: string) => api.get(`/reports/${id}`),
  updateStatus: (id: string, status: string, catatan?: string) =>
    api.patch(`/reports/${id}/status`, { status, catatan }),
};

export const transactionsApi = {
  list:   (params?: Record<string, any>) => api.get('/transactions', { params }),
};

export const zonesApi = {
  list:   () => api.get('/zones'),
  create: (data: any) => api.post('/zones', data),
  update: (id: string, data: any) => api.put(`/zones/${id}`, data),
};

export const adminApi = {
  audit:        (params?: Record<string, any>) => api.get('/admin/audit', { params }),
  users:        () => api.get('/admin/users'),
  updateRole:   (id: string, role: string) => api.patch(`/admin/users/${id}/role`, { role }),
  toggleUser:   (id: string) => api.patch(`/admin/users/${id}/toggle`),
  createUser:   (data: any) => api.post('/admin/users', data),
};

export const notificationsApi = {
  list:       () => api.get('/notifications'),
  markRead:   (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};
