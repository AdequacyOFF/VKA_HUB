import { axiosInstance } from './axios';
import { CaptainReport, CreateReportData } from '@/types';

export const reportsApi = {
  createCaptainReport: async (data: CreateReportData): Promise<CaptainReport> => {
    const response = await axiosInstance.post('/api/reports/captain', data);
    return response.data;
  },

  getCaptainReports: async () => {
    const response = await axiosInstance.get('/api/reports/captain');
    return response.data;
  },
};
