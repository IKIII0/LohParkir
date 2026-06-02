import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../services/api';

interface User {
  id: string;
  nama: string;
  email: string;
  role: 'public' | 'officer' | 'admin' | 'superadmin';
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isLoggedIn: boolean;

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isLoggedIn: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const res = await authApi.login(email, password);
      const { accessToken, refreshToken, user } = res.data.data;
      await AsyncStorage.multiSet([
        ['accessToken', accessToken],
        ['refreshToken', refreshToken],
        ['user', JSON.stringify(user)],
      ]);
      set({ user, isLoggedIn: true });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
    set({ user: null, isLoggedIn: false });
  },

  loadUser: async () => {
    const userJson = await AsyncStorage.getItem('user');
    const token = await AsyncStorage.getItem('accessToken');
    if (userJson && token) {
      set({ user: JSON.parse(userJson), isLoggedIn: true });
    }
  },
}));
