import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Ensure we safely map the JWT when the window natively hydrates
  const isClient = typeof window !== 'undefined';
  const initialToken = isClient ? localStorage.getItem('jwt_token') : null;
  const initialUser = isClient && localStorage.getItem('user_data') ? JSON.parse(localStorage.getItem('user_data') as string) : null;

  return {
    user: initialUser,
    token: initialToken,
    login: (user, token) => {
      localStorage.setItem('jwt_token', token);
      localStorage.setItem('user_data', JSON.stringify(user));
      set({ user, token });
    },
    logout: () => {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user_data');
      set({ user: null, token: null });
    },
  };
});
