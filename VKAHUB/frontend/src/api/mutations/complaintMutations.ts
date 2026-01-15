import { useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../axios';
import { invalidateComplaintQueries } from '../../utils/cacheInvalidation';

interface CreateUserComplaintData {
  target_id: number;
  reason: string;
  description: string;
}

interface CreatePlatformComplaintData {
  category: string;
  priority: string;
  title: string;
  description: string;
}

interface RespondToComplaintData {
  response: string;
  status: 'resolved' | 'rejected';
}

/**
 * Hook for creating a user complaint
 */
export const useCreateUserComplaint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUserComplaintData) => {
      const response = await axiosInstance.post('/api/complaints', data);
      return response.data;
    },
    onSuccess: () => {
      invalidateComplaintQueries({ queryClient });
    },
  });
};

/**
 * Hook for creating a platform complaint
 */
export const useCreatePlatformComplaint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePlatformComplaintData) => {
      const response = await axiosInstance.post('/api/platform-complaints', data);
      return response.data;
    },
    onSuccess: () => {
      invalidateComplaintQueries({ queryClient });
    },
  });
};

/**
 * Hook for approving a user complaint (moderator)
 */
export const useApproveUserComplaint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (complaintId: number) => {
      const response = await axiosInstance.post(`/api/moderator/reports/${complaintId}/approve`);
      return response.data;
    },
    onSuccess: () => {
      invalidateComplaintQueries({ queryClient });
    },
  });
};

/**
 * Hook for rejecting a user complaint (moderator)
 */
export const useRejectUserComplaint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (complaintId: number) => {
      const response = await axiosInstance.post(`/api/moderator/reports/${complaintId}/reject`);
      return response.data;
    },
    onSuccess: () => {
      invalidateComplaintQueries({ queryClient });
    },
  });
};

/**
 * Hook for responding to a platform complaint (moderator)
 */
export const useRespondToPlatformComplaint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      complaintId,
      data,
    }: {
      complaintId: number;
      data: RespondToComplaintData;
    }) => {
      const response = await axiosInstance.post(
        `/api/moderator/platform-complaints/${complaintId}/respond`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      invalidateComplaintQueries({ queryClient });
    },
  });
};

/**
 * Hook for marking platform complaint response as read
 */
export const useMarkComplaintResponseRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (complaintId: number) => {
      const response = await axiosInstance.post(
        `/api/platform-complaints/${complaintId}/mark-read`
      );
      return response.data;
    },
    onSuccess: () => {
      invalidateComplaintQueries({ queryClient });
    },
  });
};
