import { useMutation, useQueryClient } from '@tanstack/react-query';
import { competitionsApi } from '../competitions';
import {
  invalidateCompetitionQueries,
  invalidateTeamCompetitionRelation,
} from '../../utils/cacheInvalidation';
import { CreateCompetitionData, Application } from '@/types';

/**
 * Hook for creating a new competition
 */
export const useCreateCompetition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCompetitionData) => competitionsApi.createCompetition(data),
    onSuccess: (data) => {
      invalidateCompetitionQueries({ queryClient }, data.id);
    },
  });
};

/**
 * Hook for updating a competition
 */
export const useUpdateCompetition = (competitionId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<CreateCompetitionData>) =>
      competitionsApi.updateCompetition(competitionId, data),
    onSuccess: () => {
      invalidateCompetitionQueries({ queryClient }, competitionId);
    },
  });
};

/**
 * Hook for applying to a competition (team registration)
 */
export const useApplyToCompetition = (competitionId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (application: Application) =>
      competitionsApi.applyToCompetition(competitionId, application),
    onSuccess: (_data, application) => {
      invalidateTeamCompetitionRelation(
        { queryClient },
        { teamId: application.team_id, competitionId }
      );
    },
  });
};

/**
 * Hook for removing a team from competition
 */
export const useRemoveTeamFromCompetition = (competitionId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (registrationId: number) =>
      competitionsApi.removeTeamFromCompetition(competitionId, registrationId),
    onSuccess: () => {
      invalidateCompetitionQueries({ queryClient }, competitionId);
    },
  });
};

/**
 * Hook for submitting a competition report
 */
export const useSubmitCompetitionReport = (competitionId: number, registrationId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reportData: {
      result: string;
      git_link: string;
      project_url?: string;
      presentation_url: string;
      brief_summary: string;
      technologies_used?: string;
      individual_contributions?: string;
      team_evaluation?: string;
      problems_faced?: string;
    }) => competitionsApi.submitCompetitionReport(competitionId, registrationId, reportData),
    onSuccess: () => {
      invalidateCompetitionQueries({ queryClient }, competitionId);
    },
  });
};

/**
 * Hook for uploading a presentation file
 */
export const useUploadPresentation = () => {
  return useMutation({
    mutationFn: (file: File) => competitionsApi.uploadPresentation(file),
  });
};
