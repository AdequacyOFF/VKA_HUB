import { axiosInstance } from './axios';

export const moderatorApi = {
  assignModerator: async (userId: number) => {
    const response = await axiosInstance.post('/api/moderator/assign', { user_id: userId });
    return response.data;
  },

  removeModerator: async (userId: number) => {
    const response = await axiosInstance.post('/api/moderator/remove', { user_id: userId });
    return response.data;
  },

  getModerators: async () => {
    const response = await axiosInstance.get('/api/moderator/list');
    return response.data;
  },

  generateReport: async (competitionId: number) => {
    const response = await axiosInstance.post('/api/moderator/reports/generate', {
      competition_id: competitionId,
    });
    return response.data;
  },
  getUserSecurityInfo: async (userId: number) => {
    const response = await axiosInstance.get(`/api/moderator/users/${userId}/security`);
    return response.data;
  },

  getStats: async () => {
    const response = await axiosInstance.get('/api/moderator/stats');
    return response.data;
  },

  getAnalytics: async () => {
    const response = await axiosInstance.get('/api/moderator/analytics');
    return response.data;
  },
};
