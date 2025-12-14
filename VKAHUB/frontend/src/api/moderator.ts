import { axiosInstance } from './axios';
import { PlatformComplaintResponse } from './platformComplaints';

export interface RespondToPlatformComplaintRequest {
  response: string;
  status: 'resolved' | 'rejected';
}

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

  getPlatformComplaints: async (params?: { skip?: number; limit?: number; status?: string; category?: string }): Promise<{ items: PlatformComplaintResponse[]; total: number }> => {
    const response = await axiosInstance.get('/api/moderator/platform-complaints', { params });
    return response.data;
  },

  respondToPlatformComplaint: async (complaintId: number, data: RespondToPlatformComplaintRequest) => {
    const response = await axiosInstance.post(`/api/moderator/platform-complaints/${complaintId}/respond`, data);
    return response.data;
  },
};
