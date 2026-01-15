import { axiosInstance } from './axios';
import { Competition, CreateCompetitionData, Application } from '@/types';

export const competitionsApi = {
  getCompetitions: async (params?: {
    skip?: number;
    limit?: number;
    search?: string;
    type?: string;
  }) => {
    const response = await axiosInstance.get('/api/competitions', { params });
    return response.data;
  },

  getCompetition: async (competitionId: number): Promise<Competition> => {
    const response = await axiosInstance.get(`/api/competitions/${competitionId}`);
    return response.data;
  },

  createCompetition: async (data: CreateCompetitionData): Promise<Competition> => {
    const response = await axiosInstance.post('/api/competitions', data);
    return response.data;
  },

  updateCompetition: async (competitionId: number, data: Partial<CreateCompetitionData>) => {
    const response = await axiosInstance.put(`/api/competitions/${competitionId}`, data);
    return response.data;
  },

  applyToCompetition: async (competitionId: number, application: Application) => {
    const response = await axiosInstance.post(
      `/api/competitions/${competitionId}/apply`,
      application
    );
    return response.data;
  },

  joinCompetition: async (competitionId: number) => {
    const response = await axiosInstance.post(`/api/competitions/${competitionId}/join`);
    return response.data;
  },

  getCompetitionRegistrations: async (competitionId: number) => {
    const response = await axiosInstance.get(`/api/competitions/${competitionId}/registrations`);
    return response.data;
  },

  removeTeamFromCompetition: async (competitionId: number, registrationId: number) => {
    const response = await axiosInstance.delete(`/api/competitions/${competitionId}/registrations/${registrationId}`);
    return response.data;
  },

  generateCompetitionReport: async (competitionId: number) => {
    const response = await axiosInstance.get(`/api/competitions/${competitionId}/reports/generate`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Competition Reports (Captain submissions)
  getCompletedCompetitionsForMyTeams: async () => {
    const response = await axiosInstance.get('/api/competitions/my-teams/completed-competitions');
    return response.data;
  },

  uploadPresentation: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axiosInstance.post('/api/competitions/reports/upload-presentation', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  uploadScreenshot: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axiosInstance.post('/api/competitions/reports/upload-screenshot', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  submitCompetitionReport: async (competitionId: number, registrationId: number, reportData: {
    result: string;
    git_link: string;
    project_url?: string;
    presentation_url: string;
    brief_summary: string;
    technologies_used?: string;
    individual_contributions?: string;
    team_evaluation?: string;
    problems_faced?: string;
    screenshot_url?: string;
  }) => {
    const response = await axiosInstance.post(
      `/api/competitions/${competitionId}/registrations/${registrationId}/report`,
      reportData
    );
    return response.data;
  },

  updateCompetitionReport: async (reportId: number, reportData: {
    result?: string;
    git_link?: string;
    project_url?: string;
    presentation_url?: string;
    brief_summary?: string;
    technologies_used?: string;
    individual_contributions?: string;
    team_evaluation?: string;
    problems_faced?: string;
    screenshot_url?: string;
  }) => {
    const response = await axiosInstance.put(`/api/competitions/reports/${reportId}`, reportData);
    return response.data;
  },

  deleteCompetitionReport: async (reportId: number) => {
    const response = await axiosInstance.delete(`/api/competitions/reports/${reportId}`);
    return response.data;
  },

  getMyTeamReports: async () => {
    const response = await axiosInstance.get('/api/competitions/my-reports');
    return response.data;
  },

  getCompetitionReports: async (competitionId: number) => {
    const response = await axiosInstance.get(`/api/competitions/${competitionId}/reports`);
    return response.data;
  },
};
