import { useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../axios';
import { invalidateUserQueries, invalidateTeamQueries } from '../../utils/cacheInvalidation';
import { queryKeys } from '../queryKeys';

interface UpdateRolesSkillsData {
  roles: number[];
  skills: number[];
}

interface UpdateProfileData {
  login?: string;
  full_name?: string;
  group?: string;
  [key: string]: unknown;
}

/**
 * Hook for updating user roles and skills
 */
export const useUpdateRolesSkills = (userId?: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateRolesSkillsData) => {
      const response = await axiosInstance.put('/api/users/me/roles-skills', data);
      return response.data;
    },
    onSuccess: () => {
      invalidateUserQueries({ queryClient }, userId);
      queryClient.invalidateQueries({ queryKey: queryKeys.users.rolesSkills(userId) });
    },
  });
};

/**
 * Hook for updating user profile
 */
export const useUpdateProfile = (userId?: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      const response = await axiosInstance.put('/api/users/me', data);
      return response.data;
    },
    onSuccess: () => {
      invalidateUserQueries({ queryClient }, userId);
      queryClient.invalidateQueries({ queryKey: queryKeys.users.profile() });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.current() });
    },
  });
};

/**
 * Hook for leaving a team
 */
export const useLeaveTeam = (teamId: number, userId?: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await axiosInstance.post(`/api/teams/${teamId}/leave`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate BOTH team data AND user's team view
      invalidateTeamQueries({ queryClient }, teamId);
      invalidateUserQueries({ queryClient }, userId);
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.myTeam(userId) });
    },
  });
};

/**
 * Hook for approving a team join request
 */
export const useApproveTeamRequest = (teamId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: number) => {
      const response = await axiosInstance.post(`/api/teams/${teamId}/requests/${requestId}/approve`);
      return response.data;
    },
    onSuccess: () => {
      invalidateTeamQueries({ queryClient }, teamId);
    },
  });
};

/**
 * Hook for rejecting a team join request
 */
export const useRejectTeamRequest = (teamId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: number) => {
      const response = await axiosInstance.post(`/api/teams/${teamId}/requests/${requestId}/reject`);
      return response.data;
    },
    onSuccess: () => {
      invalidateTeamQueries({ queryClient }, teamId);
    },
  });
};

/**
 * Hook for removing a team member
 */
export const useRemoveTeamMember = (teamId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberId: number) => {
      const response = await axiosInstance.delete(`/api/teams/${teamId}/members/${memberId}`);
      return response.data;
    },
    onSuccess: () => {
      invalidateTeamQueries({ queryClient }, teamId);
    },
  });
};

/**
 * Hook for transferring team captaincy
 */
export const useTransferCaptaincy = (teamId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newCaptainId: number) => {
      const response = await axiosInstance.post(`/api/teams/${teamId}/transfer-captain`, {
        new_captain_id: newCaptainId,
      });
      return response.data;
    },
    onSuccess: () => {
      invalidateTeamQueries({ queryClient }, teamId);
      invalidateUserQueries({ queryClient });
    },
  });
};
