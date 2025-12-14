import { NavigateFunction } from 'react-router-dom';

export const navigateWithHistory = (
  navigate: NavigateFunction,
  to: string,
  currentTab?: string
) => {
  if (currentTab) {
    sessionStorage.setItem('lastProfileTab', currentTab);
  }
  navigate(to);
};

export const getLastProfileTab = (): string => {
  return sessionStorage.getItem('lastProfileTab') || 'general';
};

export const clearLastProfileTab = () => {
  sessionStorage.removeItem('lastProfileTab');
};
