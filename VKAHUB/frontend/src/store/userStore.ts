import { create } from 'zustand';
import { User } from '@/types';

interface UserState {
  users: User[];
  currentUser: User | null;
  setUsers: (users: User[]) => void;
  setCurrentUser: (user: User | null) => void;
  addUser: (user: User) => void;
  updateUser: (userId: number, userData: Partial<User>) => void;
}

export const useUserStore = create<UserState>((set) => ({
  users: [],
  currentUser: null,

  setUsers: (users) => set({ users }),

  setCurrentUser: (user) => set({ currentUser: user }),

  addUser: (user) =>
    set((state) => ({
      users: [...state.users, user],
    })),

  updateUser: (userId, userData) =>
    set((state) => ({
      users: state.users.map((user) =>
        user.id === userId ? { ...user, ...userData } : user
      ),
      currentUser:
        state.currentUser?.id === userId
          ? { ...state.currentUser, ...userData }
          : state.currentUser,
    })),
}));
