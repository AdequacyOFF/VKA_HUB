import { useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../axios';
import { invalidateCertificateQueries } from '../../utils/cacheInvalidation';

interface CreateCertificateData {
  name: string;
  description?: string;
  issued_date: string;
  file_url?: string;
}

/**
 * Hook for creating a certificate
 */
export const useCreateCertificate = (userId?: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCertificateData) => {
      const response = await axiosInstance.post('/api/certificates', data);
      return response.data;
    },
    onSuccess: () => {
      invalidateCertificateQueries({ queryClient }, userId);
    },
  });
};

/**
 * Hook for deleting a certificate
 */
export const useDeleteCertificate = (userId?: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (certificateId: number) => {
      const response = await axiosInstance.delete(`/api/certificates/${certificateId}`);
      return response.data;
    },
    onSuccess: () => {
      invalidateCertificateQueries({ queryClient }, userId);
    },
  });
};

/**
 * Hook for uploading a certificate file
 */
export const useUploadCertificateFile = () => {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await axiosInstance.post('/api/certificates/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
  });
};
