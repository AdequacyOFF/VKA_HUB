export interface User {
  id: number;
  login: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  study_group?: string;
  position?: string;
  rank?: string;
  avatar_url?: string;
  avatar?: string; // Alternative field name for avatar
  control_question?: string;
  control_answer?: string;
  roles?: string[];
  skills?: string[];
  is_moderator?: boolean;
  is_admin?: boolean;
  is_banned?: boolean;
  created_at: string;
  updated_at: string;
  // Extended fields for detailed user profile
  certificates?: Array<{
    id: number;
    title: string;
    category?: string;
    issued_date?: string;
  }>;
  teams?: Array<{
    id: number;
    name: string;
  }>;
  competitions?: Array<{
    id: number;
    name: string;
  }>;
}

export interface LoginCredentials {
  login: string;
  password: string;
}

export interface RegisterData {
  login: string;
  password: string;
  password_confirm: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface RecoverPasswordData {
  login: string;
  control_answer: string;
  new_password: string;
  new_password_confirm: string;
}
