import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  checkAuth: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) => {
        console.log('[AuthStore] Setting auth - User:', user.username, 'Moderator:', user.is_moderator);
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        });
      },

      setUser: (user) => {
        console.log('[AuthStore] Updating user - User:', user.username, 'Moderator:', user.is_moderator);
        set({ user });
      },

      logout: () => {
        console.log('[AuthStore] Logging out');
        // Clear auth state
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });

        // Clear all stores from localStorage
        localStorage.removeItem('auth-storage');
        localStorage.removeItem('theme-storage');

        // Reset team store if it exists
        try {
          const { useTeamStore } = require('./teamStore');
          useTeamStore.setState({
            teams: [],
            currentTeam: null,
            userTeams: [],
          });
        } catch (e) {
          // Team store not loaded yet
        }

        // Clear React Query cache by dispatching a custom event
        window.dispatchEvent(new CustomEvent('auth:logout'));
      },

      checkAuth: () => {
        const { accessToken } = get();
        return !!accessToken;
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      version: 1,
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log('[AuthStore] Rehydrated - User:', state.user?.username, 'Moderator:', state.user?.is_moderator, 'Token exists:', !!state.accessToken);
        } else {
          console.log('[AuthStore] Rehydration failed');
        }
      },
    }
  )
);
