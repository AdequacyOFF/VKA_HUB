import { axiosInstance } from './axios';

export interface CreateComplaintRequest {
  target_id: number;
  reason: string;
  description: string;
}

export interface CreateComplaintResponse {
  message: string;
  complaint_id: number;
  status: string;
}

export const complaintsApi = {
  createComplaint: async (data: CreateComplaintRequest): Promise<CreateComplaintResponse> => {
    const response = await axiosInstance.post('/api/users/complaints', data);
    return response.data;
  },
};
