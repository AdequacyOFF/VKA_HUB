import { axiosInstance } from './axios';
import { Team, CreateTeamData, UpdateTeamData, ListResponse } from '@/types';

export const teamsApi = {
  getTeams: async (params?: { skip?: number; limit?: number; search?: string }): Promise<ListResponse<Team>> => {
    const response = await axiosInstance.get<ListResponse<Team>>('/api/teams', { params });
    return response.data;
  },

  getTeam: async (teamId: number): Promise<Team> => {
    const response = await axiosInstance.get(`/api/teams/${teamId}`);
    return response.data;
  },

  createTeam: async (data: CreateTeamData): Promise<Team> => {
    const response = await axiosInstance.post('/api/teams', data);
    return response.data;
  },

  updateTeam: async (teamId: number, data: UpdateTeamData): Promise<Team> => {
    const response = await axiosInstance.put(`/api/teams/${teamId}`, data);
    return response.data;
  },

  deleteTeam: async (teamId: number) => {
    const response = await axiosInstance.delete(`/api/teams/${teamId}`);
    return response.data;
  },

  joinTeam: async (teamId: number) => {
    const response = await axiosInstance.post(`/api/teams/${teamId}/join`);
    return response.data;
  },

  getTeamMembers: async (teamId: number) => {
    const response = await axiosInstance.get(`/api/teams/${teamId}/members`);
    return response.data;
  },

  getMyTeams: async (): Promise<Team[]> => {
    const response = await axiosInstance.get('/api/users/my-team');
    // Backend returns a single team object with members, wrap in array for compatibility
    const data = response.data;
    if (!data || !data.team) {
      return [];
    }
    return [data.team];
  },
};
