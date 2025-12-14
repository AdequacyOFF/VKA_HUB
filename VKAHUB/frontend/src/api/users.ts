import { axiosInstance } from './axios';
import { User, UpdateProfileData, UpdateRolesSkillsData, PaginatedResponse } from '@/types';

export const usersApi = {
  getCurrentUser: async (): Promise<User> => {
    const response = await axiosInstance.get('/api/users/me');
    return response.data;
  },

  getUsers: async (params?: {
    skip?: number;
    limit?: number;
    search?: string;
    study_group?: string;
    rank?: string;
  }): Promise<PaginatedResponse<User>> => {
    const response = await axiosInstance.get('/api/users', { params });
    return response.data;
  },

  getUser: async (userId: number): Promise<User> => {
    const response = await axiosInstance.get(`/api/users/${userId}`);
    return response.data;
  },

  updateProfile: async (data: UpdateProfileData): Promise<User> => {
    const response = await axiosInstance.put('/api/users/profile', data);
    return response.data;
  },

  updateRolesSkills: async (userId: number, data: UpdateRolesSkillsData) => {
    const response = await axiosInstance.put(`/api/users/${userId}/roles-skills`, data);
    return response.data;
  },
};
