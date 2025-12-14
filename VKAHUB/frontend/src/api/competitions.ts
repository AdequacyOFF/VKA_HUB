import { axiosInstance } from './axios';
import { Competition, CreateCompetitionData, Application } from '@/types';

export const competitionsApi = {
  getCompetitions: async (params?: {
    skip?: number;
    limit?: number;
    search?: string;
    type?: string;
  }) => {
    const response = await axiosInstance.get('/api/competitions', { params });
    return response.data;
  },

  getCompetition: async (competitionId: number): Promise<Competition> => {
    const response = await axiosInstance.get(`/api/competitions/${competitionId}`);
    return response.data;
  },

  createCompetition: async (data: CreateCompetitionData): Promise<Competition> => {
    const response = await axiosInstance.post('/api/competitions', data);
    return response.data;
  },

  updateCompetition: async (competitionId: number, data: Partial<CreateCompetitionData>) => {
    const response = await axiosInstance.put(`/api/competitions/${competitionId}`, data);
    return response.data;
  },

  applyToCompetition: async (competitionId: number, application: Application) => {
    const response = await axiosInstance.post(
      `/api/competitions/${competitionId}/apply`,
      application
    );
    return response.data;
  },

  joinCompetition: async (competitionId: number) => {
    const response = await axiosInstance.post(`/api/competitions/${competitionId}/join`);
    return response.data;
  },
};
