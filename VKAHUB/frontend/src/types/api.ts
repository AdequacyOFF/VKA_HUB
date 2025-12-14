export interface PaginatedResponse<T> {
  total: number;
  items: T[];
  page: number;
  page_size: number;
}

// Simplified list response (without pagination metadata)
export interface ListResponse<T> {
  total: number;
  items: T[];
}

export interface ApiError {
  detail: string | Record<string, string | number>;
  message?: string;
}

export interface AxiosErrorResponse {
  response?: {
    data?: ApiError;
    status?: number;
  };
  message?: string;
}

export interface QueryParams {
  skip?: number;
  limit?: number;
  search?: string;
  [key: string]: string | number | boolean | undefined;
}
