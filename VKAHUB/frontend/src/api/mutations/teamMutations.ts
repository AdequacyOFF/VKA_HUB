import { useMutation, useQueryClient } from '@tanstack/react-query';
import { teamsApi } from '../teams';
import {
  invalidateTeamQueries,
  invalidateUserQueries,
} from '../../utils/cacheInvalidation';
import { CreateTeamData, UpdateTeamData } from '@/types';

/**
 * Hook for creating a new team
 */
export const useCreateTeam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTeamData) => teamsApi.createTeam(data),
    onSuccess: (data) => {
      invalidateTeamQueries({ queryClient }, data.id);
      invalidateUserQueries({ queryClient });
    },
  });
};

/**
 * Hook for updating a team
 */
export const useUpdateTeam = (teamId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateTeamData) => teamsApi.updateTeam(teamId, data),
    onSuccess: () => {
      invalidateTeamQueries({ queryClient }, teamId);
    },
  });
};

/**
 * Hook for deleting a team
 */
export const useDeleteTeam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (teamId: number) => teamsApi.deleteTeam(teamId),
    onSuccess: (_data, teamId) => {
      invalidateTeamQueries({ queryClient }, teamId);
      invalidateUserQueries({ queryClient });
    },
  });
};

/**
 * Hook for joining a team (sending join request)
 */
export const useJoinTeam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (teamId: number) => teamsApi.joinTeam(teamId),
    onSuccess: (_data, teamId) => {
      invalidateTeamQueries({ queryClient }, teamId);
      invalidateUserQueries({ queryClient });
    },
  });
};
