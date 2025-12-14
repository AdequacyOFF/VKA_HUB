import { axiosInstance } from './axios';
import {
  LoginCredentials,
  RegisterData,
  TokenResponse,
  RecoverPasswordData,
} from '@/types';

export const authApi = {
  register: async (data: RegisterData) => {
    const response = await axiosInstance.post('/api/auth/register', data);
    return response.data;
  },

  login: async (credentials: LoginCredentials): Promise<TokenResponse> => {
    const response = await axiosInstance.post('/api/auth/login', credentials);
    return response.data;
  },

  getControlQuestion: async (login: string) => {
    const response = await axiosInstance.get(`/api/auth/control-question/${login}`);
    return response.data;
  },

  recoverPassword: async (data: RecoverPasswordData) => {
    const response = await axiosInstance.post('/api/auth/recover-password', data);
    return response.data;
  },

  logout: async () => {
    const response = await axiosInstance.post('/api/auth/logout');
    return response.data;
  },
};
