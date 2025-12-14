import { axiosInstance } from './axios';

export interface PublicStats {
  totalUsers: number;
  totalTeams: number;
  totalCompetitions: number;
  activeCompetitions: number;
}

export const publicApi = {
  getStats: async (): Promise<PublicStats> => {
    const response = await axiosInstance.get('/api/public/stats');
    return response.data;
  },
};
