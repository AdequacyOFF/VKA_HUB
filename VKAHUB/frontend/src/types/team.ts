export interface TeamMember {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  middle_name?: string;
  avatar?: string;
  position?: string;
  joined_at: string;
  left_at?: string;
}

export interface Team {
  id: number;
  name: string;
  description?: string;
  image_url?: string;
  image?: string;
  direction?: string;
  captain_id?: number;
  captain_name?: string;
  members_count?: number;
  members?: TeamMember[];
  join_requests?: JoinRequest[];
  created_at: string;
  updated_at: string;
}

export interface JoinRequest {
  id: number;
  team_id: number;
  user_id: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface CreateTeamData {
  name: string;
  description?: string;
  image_url?: string;
  direction: string;
}

export interface UpdateTeamData {
  name?: string;
  description?: string;
  image_url?: string;
  direction?: string;
}

export interface TeamStatistics {
  team_id: number;
  competitions_participated: number;
  prizes_won: number;
}
