import { AxiosErrorResponse } from '@/types';

export function getErrorMessage(error: unknown): string {
  const axiosError = error as AxiosErrorResponse;

  if (axiosError.response?.data?.detail) {
    const detail = axiosError.response.data.detail;
    if (typeof detail === 'string') {
      return detail;
    }
    return JSON.stringify(detail);
  }

  if (axiosError.response?.data?.message) {
    return axiosError.response.data.message;
  }

  if (axiosError.message) {
    return axiosError.message;
  }

  return 'Произошла неизвестная ошибка';
}
