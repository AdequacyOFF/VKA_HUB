import { axiosInstance } from './axios';

export type PlatformComplaintCategory = 'bug' | 'feature_request' | 'performance' | 'ui_ux' | 'security' | 'other';

export interface CreatePlatformComplaintRequest {
  category: PlatformComplaintCategory;
  title: string;
  description: string;
}

export interface CreatePlatformComplaintResponse {
  message: string;
  complaint_id: number;
  status: string;
}

export const platformComplaintsApi = {
  createComplaint: async (data: CreatePlatformComplaintRequest): Promise<CreatePlatformComplaintResponse> => {
    const response = await axiosInstance.post('/api/users/platform-complaints', data);
    return response.data;
  },
};
