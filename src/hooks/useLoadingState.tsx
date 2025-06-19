
import { useState } from 'react';

export interface UseLoadingStateReturn {
  loading: boolean;
  error: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  withLoading: <T>(fn: () => Promise<T>) => Promise<T>;
}

export const useLoadingState = (): UseLoadingStateReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const withLoading = async <T,>(fn: () => Promise<T>): Promise<T> => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn();
      return result;
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    setLoading,
    setError,
    withLoading,
  };
};
