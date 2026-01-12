import { QueryClient } from '@tanstack/react-query';

/**
 * Centralized cache invalidation utility
 *
 * This utility provides consistent cache invalidation patterns across the app.
 * When a mutation occurs, it ensures all related queries are properly invalidated
 * to prevent stale data from being displayed.
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
  teamId?: number
) => {
  // Invalidate teams list
  queryClient.invalidateQueries({ queryKey: ['teams'] });

  // Invalidate specific team if ID provided
  if (teamId !== undefined) {
    queryClient.invalidateQueries({ queryKey: ['team', teamId] });
    queryClient.invalidateQueries({ queryKey: ['team-statistics', teamId] });
  }

  // Invalidate current user's team
  queryClient.invalidateQueries({ queryKey: ['my-team'] });
};

/**
 * Invalidate all competition-related queries
 * Call this after: creating, updating, deleting competitions, or changing registrations
 */
export const invalidateCompetitionQueries = (
  { queryClient }: InvalidationOptions,
  competitionId?: number
) => {
  // Invalidate competitions list
  queryClient.invalidateQueries({ queryKey: ['competitions'] });

  // Invalidate specific competition if ID provided
  if (competitionId !== undefined) {
    queryClient.invalidateQueries({ queryKey: ['competition', competitionId] });
    queryClient.invalidateQueries({ queryKey: ['competition-registrations', competitionId] });
  }
};

/**
 * Invalidate user-related queries
 * Call this after: updating user profile, changing user teams, etc.
 */
export const invalidateUserQueries = (
  { queryClient }: InvalidationOptions,
  userId?: number
) => {
  // Invalidate current user
  queryClient.invalidateQueries({ queryKey: ['user'] });

  // Invalidate specific user if ID provided
  if (userId !== undefined) {
    queryClient.invalidateQueries({ queryKey: ['user', userId] });
  }
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
  { teamId, competitionId }: { teamId?: number; competitionId?: number }
) => {
  // Invalidate both team and competition data
  if (teamId !== undefined) {
    invalidateTeamQueries({ queryClient }, teamId);
  }
  if (competitionId !== undefined) {
    invalidateCompetitionQueries({ queryClient }, competitionId);
  }
};
