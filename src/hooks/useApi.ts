import { useState, useCallback } from 'react';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiReturn<T> {
  state: ApiState<T>;
  execute: (...args: any[]) => Promise<T>;
  reset: () => void;
}

export function useApi<T>(
  apiFunction: (...args: any[]) => Promise<T>
): UseApiReturn<T> {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null
  });

  const execute = useCallback(async (...args: any[]): Promise<T> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await apiFunction(...args);
      setState({ data: result, loading: false, error: null });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      throw error;
    }
  }, [apiFunction]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { state, execute, reset };
}

// Simulated API functions for demo purposes
export const api = {
  async getSubmissions(filters?: any): Promise<any[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate occasional errors
    if (Math.random() < 0.1) {
      throw new Error('Failed to fetch submissions');
    }
    
    return [];
  },

  async getSubmissionByDln(dln: string): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (Math.random() < 0.05) {
      throw new Error('Failed to fetch submission details');
    }
    
    return null;
  },

  async updateSubmission(id: string, data: any): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    if (Math.random() < 0.1) {
      throw new Error('Failed to update submission');
    }
    
    return data;
  },

  async addNote(submissionId: string, content: string): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (Math.random() < 0.05) {
      throw new Error('Failed to add note');
    }
    
    return { id: Date.now().toString(), content, timestamp: new Date().toISOString() };
  }
};
