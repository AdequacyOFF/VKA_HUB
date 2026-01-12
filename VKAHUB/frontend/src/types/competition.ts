export type CompetitionType = 'hackathon' | 'CTF' | 'other';

export interface CompetitionStage {
  id: number;
  competition_id: number;
  stage_number: number;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
}

export interface CompetitionCase {
  id: number;
  competition_id: number;
  case_number: number;
  title: string;
  description: string;
  knowledge_stack: string[];
  created_at: string;
  updated_at: string;
}

export interface Competition {
  id: number;
  type: CompetitionType;
  name: string;
  link?: string;
  image_url?: string;
  start_date: string;
  end_date: string;
  registration_deadline: string;
  description?: string;
  other_type_description?: string;
  min_team_size: number;
  max_team_size: number;
  case_file_url?: string;
  tasks_file_url?: string;
  created_by?: number;
  created_at: string;
  updated_at: string;
  stages: CompetitionStage[];
  cases: CompetitionCase[];
  status?: string;
  location?: string;
  max_participants?: number;
  prize_fund?: string;
  organizer?: string;
  website_url?: string;
  participants?: any[];
  results?: any[];
  registrations?: Registration[];
}

export interface Application {
  team_id: number;
  member_ids: number[];
  case_id?: number | null;
}

export interface Registration {
  id: number;
  competition_id: number;
  team_id: number;
  status: string;
  result?: string;
  applied_at: string;
  has_report?: boolean;
  team?: {
    id: number;
    name: string;
    captain_id: number;
  };
}

export interface CreateCompetitionStageData {
  stage_number: number;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
}

export interface CreateCompetitionCaseData {
  case_number: number;
  title: string;
  description: string;
  knowledge_stack: string[];
}

export interface CreateCompetitionData {
  type: CompetitionType;
  name: string;
  link?: string;
  image_url?: string;
  start_date: string;
  end_date: string;
  registration_deadline: string;
  description?: string;
  other_type_description?: string;
  min_team_size: number;
  max_team_size: number;
  case_file_url?: string;
  tasks_file_url?: string;
  stages: CreateCompetitionStageData[];
  cases: CreateCompetitionCaseData[];
}
