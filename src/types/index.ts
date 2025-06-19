
// Shared type definitions to eliminate duplication across the codebase

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
}

export interface ImageUploadConfig {
  maxImages?: number;
  maxSizeMB?: number;
  allowMultiple?: boolean;
  bucket: string;
  folder?: string;
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface FormState<T> {
  data: T;
  errors: Record<string, string>;
  isSubmitting: boolean;
}
