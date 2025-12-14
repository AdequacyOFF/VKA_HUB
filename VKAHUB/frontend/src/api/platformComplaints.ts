import { axiosInstance } from './axios';

export type PlatformComplaintCategory = 'bug' | 'feature_request' | 'performance' | 'ui_ux' | 'security' | 'other';
export type ComplaintPriority = 'low' | 'medium' | 'high' | 'critical';
export type ComplaintStatus = 'pending' | 'resolved' | 'rejected';

export interface CreatePlatformComplaintRequest {
  category: PlatformComplaintCategory;
  priority: ComplaintPriority;
  title: string;
  description: string;
}

export interface CreatePlatformComplaintResponse {
  message: string;
  complaint_id: number;
  status: string;
}

export interface PlatformComplaintResponse {
  id: number;
  user_id: number;
  user: string;
  category: PlatformComplaintCategory;
  priority: ComplaintPriority;
  title: string;
  description: string;
  status: ComplaintStatus;
  moderator_response: string | null;
  response_read: boolean;
  resolved_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface UnreadResponsesResponse {
  items: PlatformComplaintResponse[];
  count: number;
}

export const platformComplaintsApi = {
  createComplaint: async (data: CreatePlatformComplaintRequest): Promise<CreatePlatformComplaintResponse> => {
    const response = await axiosInstance.post('/api/users/platform-complaints', data);
    return response.data;
  },

  getUnreadResponses: async (): Promise<UnreadResponsesResponse> => {
    const response = await axiosInstance.get('/api/users/platform-complaints/unread');
    return response.data;
  },

  markAsRead: async (complaintId: number): Promise<{ message: string }> => {
    const response = await axiosInstance.post(`/api/users/platform-complaints/${complaintId}/mark-read`);
    return response.data;
  },
};
