import { axiosInstance } from './axios';

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface NotificationsResponse {
  total: number;
  unread_count: number;
  notifications: Notification[];
}

export const notificationsApi = {
  getNotifications: async (params?: {
    skip?: number;
    limit?: number;
    unread_only?: boolean;
  }): Promise<NotificationsResponse> => {
    const response = await axiosInstance.get('/api/notifications', { params });
    return response.data;
  },

  markAsRead: async (notificationId: number) => {
    const response = await axiosInstance.patch(`/api/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await axiosInstance.post('/api/notifications/read-all');
    return response.data;
  },
};
