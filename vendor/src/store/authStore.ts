import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  login: (token: string, role: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  const isClient = typeof window !== 'undefined';
  const initialToken = isClient ? localStorage.getItem('jwt_token') : null;
  const initialRole = isClient ? localStorage.getItem('user_role') : null;

  return {
    user: initialRole ? { id: '', email: '', firstName: '', lastName: '', role: initialRole } : null,
    token: initialToken,
    login: (token, role) => {
      localStorage.setItem('jwt_token', token);
      localStorage.setItem('user_role', role);
      set({ user: { id: '', email: '', firstName: '', lastName: '', role }, token });
    },
    logout: () => {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user_role');
      set({ user: null, token: null });
      window.location.href = (process.env.NEXT_PUBLIC_CUSTOMER_URL || 'https://nationmarket.eghedev.com') + '/login'; // Global portal
    },
  };
});
