import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  initialized: boolean;
  initAuth: () => void;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  initialized: false,

  initAuth: () => {
    if (typeof window !== 'undefined') {
      try {
        const token = localStorage.getItem('jwt_token');
        const userStr = localStorage.getItem('user_data');
        const user = userStr ? JSON.parse(userStr) : null;
        set({ token, user, initialized: true });
      } catch {
        set({ initialized: true });
      }
    }
  },

  login: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('jwt_token', token);
      localStorage.setItem('user_data', JSON.stringify(user));
    }
    set({ user, token, initialized: true });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user_data');
    }
    set({ user: null, token: null, initialized: true });
  },
}));

