export interface Certificate {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  category?: string;
  date?: string;
  file_url: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCertificateData {
  title: string;
  description?: string;
  category?: string;
  date?: string;
  file_url: string;
}

export interface UpdateCertificateData {
  title?: string;
  description?: string;
  category?: string;
  date?: string;
  file_url?: string;
}
