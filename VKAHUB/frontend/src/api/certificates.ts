import { axiosInstance } from './axios';
import { Certificate, CreateCertificateData, UpdateCertificateData } from '@/types';

export const certificatesApi = {
  getCertificates: async () => {
    const response = await axiosInstance.get('/api/certificates');
    return response.data;
  },

  createCertificate: async (data: CreateCertificateData): Promise<Certificate> => {
    const response = await axiosInstance.post('/api/certificates', data);
    return response.data;
  },

  updateCertificate: async (certificateId: number, data: UpdateCertificateData) => {
    const response = await axiosInstance.put(`/api/certificates/${certificateId}`, data);
    return response.data;
  },

  deleteCertificate: async (certificateId: number) => {
    const response = await axiosInstance.delete(`/api/certificates/${certificateId}`);
    return response.data;
  },
};
