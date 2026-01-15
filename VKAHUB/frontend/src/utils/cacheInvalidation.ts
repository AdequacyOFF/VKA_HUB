import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '../api/queryKeys';

/**
 * Centralized cache invalidation utility
 *
 * This utility provides consistent cache invalidation patterns across the app.
 * Uses the centralized queryKeys factory to ensure consistency between
 * queries and invalidations.
 */

interface InvalidationOptions {
  queryClient: QueryClient;
}

/**
 * Invalidate all team-related queries
 * Call this after: creating, updating, deleting teams, or changing team membership
 */
export const invalidateTeamQueries = (
  { queryClient }: InvalidationOptions,
  teamId?: number | string
) => {
  // Invalidate all team queries (lists, details, etc.)
  queryClient.invalidateQueries({ queryKey: queryKeys.teams.all });

  // Invalidate specific team queries if ID provided
  if (teamId !== undefined) {
    queryClient.invalidateQueries({ queryKey: queryKeys.teams.detail(teamId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.teams.statistics(teamId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.teams.requests(teamId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.teams.reports(teamId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.teams.members(teamId) });
  }

  // Invalidate myTeam queries (for all users - partial match)
  queryClient.invalidateQueries({
    predicate: (query) =>
      Array.isArray(query.queryKey) &&
      query.queryKey[0] === 'teams' &&
      query.queryKey[1] === 'my-team',
  });

  // Invalidate moderator team views
  queryClient.invalidateQueries({ queryKey: queryKeys.moderator.teams() });
};

/**
 * Invalidate all competition-related queries
 * Call this after: creating, updating, deleting competitions, or changing registrations
 */
export const invalidateCompetitionQueries = (
  { queryClient }: InvalidationOptions,
  competitionId?: number | string
) => {
  // Invalidate all competition queries
  queryClient.invalidateQueries({ queryKey: queryKeys.competitions.all });

  // Invalidate specific competition queries if ID provided
  if (competitionId !== undefined) {
    queryClient.invalidateQueries({ queryKey: queryKeys.competitions.detail(competitionId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.competitions.registrations(competitionId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.competitions.reports(competitionId) });
  }

  // Invalidate participations queries (for all users - partial match)
  queryClient.invalidateQueries({
    predicate: (query) =>
      Array.isArray(query.queryKey) &&
      query.queryKey[0] === 'competitions' &&
      query.queryKey[1] === 'participations',
  });

  // Invalidate myReports
  queryClient.invalidateQueries({ queryKey: queryKeys.competitions.myReports() });

  // Invalidate moderator competition views
  queryClient.invalidateQueries({ queryKey: queryKeys.moderator.competitions() });
};

/**
 * Invalidate user-related queries
 * Call this after: updating user profile, changing roles/skills, etc.
 */
export const invalidateUserQueries = (
  { queryClient }: InvalidationOptions,
  userId?: number | string
) => {
  // Invalidate all user queries
  queryClient.invalidateQueries({ queryKey: queryKeys.users.all });

  // Invalidate specific user queries if ID provided
  if (userId !== undefined) {
    queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(userId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.users.rolesSkills(Number(userId)) });
    queryClient.invalidateQueries({ queryKey: queryKeys.users.activity(Number(userId)) });
  }

  // Invalidate current user profile queries
  queryClient.invalidateQueries({ queryKey: queryKeys.users.profile() });
  queryClient.invalidateQueries({ queryKey: queryKeys.users.current() });

  // Invalidate moderator user views
  queryClient.invalidateQueries({ queryKey: queryKeys.moderator.users() });
};

/**
 * Invalidate all complaint-related queries
 * Call this after: creating, updating, resolving complaints
 */
export const invalidateComplaintQueries = ({ queryClient }: InvalidationOptions) => {
  // Invalidate user complaints
  queryClient.invalidateQueries({ queryKey: queryKeys.complaints.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.complaints.user.all });

  // Invalidate platform complaints
  queryClient.invalidateQueries({ queryKey: queryKeys.complaints.platform.all });

  // Invalidate moderator views
  queryClient.invalidateQueries({ queryKey: queryKeys.moderator.reports() });
  queryClient.invalidateQueries({ queryKey: queryKeys.moderator.platformComplaints() });
};

/**
 * Invalidate certificate-related queries
 * Call this after: creating, deleting certificates
 */
export const invalidateCertificateQueries = (
  { queryClient }: InvalidationOptions,
  userId?: number
) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.certificates.all });
  if (userId !== undefined) {
    queryClient.invalidateQueries({ queryKey: queryKeys.certificates.list(userId) });
  }
};

/**
 * Invalidate moderator-related queries
 * Call this after: moderator-specific actions (assign/remove moderator, etc.)
 */
export const invalidateModeratorQueries = ({ queryClient }: InvalidationOptions) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.moderator.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.moderator.stats() });
  queryClient.invalidateQueries({ queryKey: queryKeys.moderator.analytics() });
  queryClient.invalidateQueries({ queryKey: queryKeys.moderator.moderators() });
};

/**
 * Invalidate all queries (nuclear option)
 * Use sparingly - only when many entities are affected
 */
export const invalidateAllQueries = ({ queryClient }: InvalidationOptions) => {
  queryClient.invalidateQueries();
};

/**
 * Helper to invalidate queries after team registration/removal from competition
 */
export const invalidateTeamCompetitionRelation = (
  { queryClient }: InvalidationOptions,
  { teamId, competitionId }: { teamId?: number | string; competitionId?: number | string }
) => {
  // Invalidate both team and competition data
  if (teamId !== undefined) {
    invalidateTeamQueries({ queryClient }, teamId);
  }
  if (competitionId !== undefined) {
    invalidateCompetitionQueries({ queryClient }, competitionId);
  }

  // Also invalidate competition participations for all users
  queryClient.invalidateQueries({
    predicate: (query) =>
      Array.isArray(query.queryKey) &&
      query.queryKey[0] === 'competitions' &&
      (query.queryKey[1] === 'participations' || query.queryKey[1] === 'completed'),
  });

  // Invalidate myReports
  queryClient.invalidateQueries({ queryKey: queryKeys.competitions.myReports() });
};
