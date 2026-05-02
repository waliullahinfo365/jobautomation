// Shared API response envelope and pagination types.

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?:   T;
  error?:  string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items:      T[];
  total:      number;
  page:       number;
  pageSize:   number;
  totalPages: number;
  hasNext:    boolean;
  hasPrev:    boolean;
}

export interface ApiError {
  code:    string;
  message: string;
  details?: unknown;
}

export interface PaginationParams {
  page?:     number;
  pageSize?: number;
  sort?:     string;
  order?:    "asc" | "desc";
}
