// Common types used across the application

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  success?: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface SearchParams {
  query?: string;
  filters?: Record<string, any>;
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface User extends BaseEntity {
  name?: string;
  email?: string;
  image?: string;
  githubId?: string;
}

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface Job extends BaseEntity {
  type: string;
  status: JobStatus;
  payload: Record<string, any>;
  result?: any;
  error?: string;
  attempts: number;
  maxAttempts: number;
  completedAt?: string;
}