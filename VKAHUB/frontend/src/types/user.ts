import { User } from './auth';

export interface Role {
  id: number;
  name: string;
  is_custom: boolean;
}

export interface Skill {
  id: number;
  name: string;
  is_custom: boolean;
}

export interface UserProfile extends Omit<User, 'roles' | 'skills'> {
  roles?: Role[];
  skills?: Skill[];
}

export interface UpdateProfileData {
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  study_group?: string;
  position?: string;
  rank?: string;
  avatar_url?: string;
  control_question?: string;
  control_answer?: string;
}

export interface UpdateRolesSkillsData {
  role_ids: number[];
  skill_ids: number[];
}
