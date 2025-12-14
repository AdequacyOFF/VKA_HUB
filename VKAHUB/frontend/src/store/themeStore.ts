import { create } from 'zustand';

type ColorScheme = 'dark';

interface ThemeState {
  colorScheme: ColorScheme;
}

export const useThemeStore = create<ThemeState>()((set) => ({
  colorScheme: 'dark',
}));
