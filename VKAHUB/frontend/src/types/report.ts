export interface CaptainReport {
  id: number;
  registration_id: number;
  summary: string;
  technologies_used?: string;
  individual_contributions?: string;
  team_evaluation?: string;
  problems_faced?: string;
  attachments?: Record<string, any>;
  submitted_by?: number;
  submitted_at: string;
}

export interface CreateReportData {
  registration_id: number;
  summary: string;
  technologies_used?: string;
  individual_contributions?: string;
  team_evaluation?: string;
  problems_faced?: string;
  attachments?: Record<string, any>;
}

export interface ModeratorReport {
  id: number;
  competition_id: number;
  file_url: string;
  generated_by?: number;
  generated_at: string;
}

// User complaint/report types for moderator review
export interface UserComplaint {
  id: number;
  reporter: string;
  target: string;
  reason: string;
  description: string;
  status: 'pending' | 'resolved' | 'rejected';
  created_at: string;
  updated_at?: string;
}

// Analytics types
export interface UserGrowthData {
  month: string;
  users: number;
}

export interface TeamStatsData {
  month: string;
  teams: number;
}

export interface CompetitionTypeData {
  name: string;
  value: number;
}

export interface AnalyticsData {
  userGrowth: UserGrowthData[];
  teamStats: TeamStatsData[];
  competitionTypes: CompetitionTypeData[];
}

// Activity log types
export interface ActivityMetadata {
  [key: string]: string | number | boolean;
}

export interface ActivityLog {
  id: number;
  action_type: string;
  description: string;
  created_at: string;
  metadata?: ActivityMetadata;
}
