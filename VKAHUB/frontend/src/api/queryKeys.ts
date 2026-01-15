/**
 * Centralized Query Key Factory
 *
 * This file provides a single source of truth for all React Query keys.
 * Using a factory pattern ensures consistency between queries and invalidations.
 *
 * Usage:
 *   import { queryKeys } from '@/api/queryKeys';
 *
 *   // In a query:
 *   useQuery({ queryKey: queryKeys.teams.detail(teamId), ... })
 *
 *   // In invalidation:
 *   queryClient.invalidateQueries({ queryKey: queryKeys.teams.all })
 */

export const queryKeys = {
  // ============================================
  // TEAMS
  // ============================================
  teams: {
    all: ['teams'] as const,
    lists: () => [...queryKeys.teams.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.teams.lists(), filters] as const,
    details: () => [...queryKeys.teams.all, 'detail'] as const,
    detail: (id: number | string) => [...queryKeys.teams.details(), id] as const,
    statistics: (id: number | string) =>
      [...queryKeys.teams.all, 'statistics', id] as const,
    requests: (id: number | string) =>
      [...queryKeys.teams.all, 'requests', id] as const,
    reports: (id: number | string) =>
      [...queryKeys.teams.all, 'reports', id] as const,
    myTeam: (userId?: number) =>
      [...queryKeys.teams.all, 'my-team', userId] as const,
    members: (id: number | string) =>
      [...queryKeys.teams.all, 'members', id] as const,
  },

  // ============================================
  // COMPETITIONS
  // ============================================
  competitions: {
    all: ['competitions'] as const,
    lists: () => [...queryKeys.competitions.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.competitions.lists(), filters] as const,
    details: () => [...queryKeys.competitions.all, 'detail'] as const,
    detail: (id: number | string) =>
      [...queryKeys.competitions.details(), id] as const,
    registrations: (id: number | string) =>
      [...queryKeys.competitions.all, 'registrations', id] as const,
    reports: (id: number | string) =>
      [...queryKeys.competitions.all, 'reports', id] as const,
    myReports: () => [...queryKeys.competitions.all, 'my-reports'] as const,
    participations: (userId?: number) =>
      [...queryKeys.competitions.all, 'participations', userId] as const,
    completedCompetitions: (userId?: number) =>
      [...queryKeys.competitions.all, 'completed', userId] as const,
  },

  // ============================================
  // USERS
  // ============================================
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: number | string) => [...queryKeys.users.details(), id] as const,
    current: () => [...queryKeys.users.all, 'current'] as const,
    profile: () => [...queryKeys.users.all, 'profile'] as const,
    rolesSkills: (id?: number) =>
      [...queryKeys.users.all, 'roles-skills', id] as const,
    activity: (id?: number) => [...queryKeys.users.all, 'activity', id] as const,
    teamRequests: () => [...queryKeys.users.all, 'team-requests'] as const,
  },

  // ============================================
  // CERTIFICATES
  // ============================================
  certificates: {
    all: ['certificates'] as const,
    list: (userId?: number) =>
      [...queryKeys.certificates.all, 'list', userId] as const,
  },

  // ============================================
  // COMPLAINTS
  // ============================================
  complaints: {
    all: ['complaints'] as const,
    user: {
      all: ['user-complaints'] as const,
      list: () => [...queryKeys.complaints.user.all, 'list'] as const,
    },
    platform: {
      all: ['platform-complaints'] as const,
      list: () => [...queryKeys.complaints.platform.all, 'list'] as const,
      unread: () => [...queryKeys.complaints.platform.all, 'unread'] as const,
      my: () => [...queryKeys.complaints.platform.all, 'my'] as const,
    },
  },

  // ============================================
  // MODERATOR
  // ============================================
  moderator: {
    all: ['moderator'] as const,
    users: (filters?: Record<string, unknown>) =>
      [...queryKeys.moderator.all, 'users', filters] as const,
    teams: (filters?: Record<string, unknown>) =>
      [...queryKeys.moderator.all, 'teams', filters] as const,
    competitions: (filters?: Record<string, unknown>) =>
      [...queryKeys.moderator.all, 'competitions', filters] as const,
    reports: () => [...queryKeys.moderator.all, 'reports'] as const,
    platformComplaints: (filters?: Record<string, unknown>) =>
      [...queryKeys.moderator.all, 'platform-complaints', filters] as const,
    stats: () => [...queryKeys.moderator.all, 'stats'] as const,
    analytics: () => [...queryKeys.moderator.all, 'analytics'] as const,
    moderators: () => [...queryKeys.moderator.all, 'moderators'] as const,
  },

  // ============================================
  // PUBLIC
  // ============================================
  public: {
    stats: () => ['public', 'stats'] as const,
  },

  // ============================================
  // ROLES & SKILLS (Reference data)
  // ============================================
  roles: {
    all: ['roles'] as const,
    list: () => [...queryKeys.roles.all, 'list'] as const,
  },

  skills: {
    all: ['skills'] as const,
    list: () => [...queryKeys.skills.all, 'list'] as const,
  },
} as const;

// Type helpers for query key inference
export type QueryKeys = typeof queryKeys;
