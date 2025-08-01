export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  error: string;
  details?: any;
  status?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ListParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
}