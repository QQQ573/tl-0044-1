import { create } from 'zustand';
import { User, UserRole } from '@/types';
import { login as apiLogin, getProfile } from '@/api/auth';

interface UserStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  hasRole: (roles: UserRole[]) => boolean;
}

export const useUserStore = create<UserStore>((set, get) => {
  const storedToken = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');

  return {
    user: storedUser ? JSON.parse(storedUser) : null,
    token: storedToken,
    isAuthenticated: !!storedToken,

    login: async (username: string, password: string) => {
      const response = await apiLogin(username, password);
      localStorage.setItem('token', response.accessToken);
      localStorage.setItem('user', JSON.stringify(response.user));
      set({ user: response.user, token: response.accessToken, isAuthenticated: true });
    },

    logout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({ user: null, token: null, isAuthenticated: false });
    },

    fetchProfile: async () => {
      try {
        const user = await getProfile();
        localStorage.setItem('user', JSON.stringify(user));
        set({ user });
      } catch (error) {
        get().logout();
      }
    },

    hasRole: (roles: UserRole[]) => {
      const user = get().user;
      if (!user) return false;
      return roles.includes(user.role);
    },
  };
});
