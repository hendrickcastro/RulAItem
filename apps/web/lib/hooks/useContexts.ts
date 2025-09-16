import { useState, useCallback } from 'react';
import { contextsService, Context, CreateContextData, UpdateContextData } from '@/lib/services';

interface UseContextsReturn {
  contexts: Context[];
  isLoading: boolean;
  error: string | null;
  // Actions
  fetchContexts: () => Promise<void>;
  createContext: (data: CreateContextData) => Promise<{ success: boolean; context?: Context; error?: string }>;
  updateContext: (id: string, data: UpdateContextData) => Promise<{ success: boolean; context?: Context; error?: string }>;
  deleteContext: (id: string) => Promise<{ success: boolean; error?: string }>;
  toggleActive: (id: string, isActive: boolean) => Promise<{ success: boolean; error?: string }>;
  // Helpers
  getActiveContexts: () => Context[];
  getContextById: (id: string) => Context | undefined;
  clearError: () => void;
}

export function useContexts(): UseContextsReturn {
  const [contexts, setContexts] = useState<Context[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContexts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await contextsService.getContexts();
      
      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setContexts(response.data.contexts || []);
      }
    } catch (err) {
      setError('Error de conexión al cargar contextos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createContext = useCallback(async (data: CreateContextData) => {
    try {
      setError(null);
      const response = await contextsService.createContext(data);
      
      if (response.error) {
        setError(response.error);
        return { success: false, error: response.error };
      }
      
      if (response.data) {
        setContexts(prev => [...prev, response.data!]);
        return { success: true, context: response.data };
      }
      
      return { success: false, error: 'No se recibieron datos' };
    } catch (err) {
      const error = 'Error de conexión al crear contexto';
      setError(error);
      return { success: false, error };
    }
  }, []);

  const updateContext = useCallback(async (id: string, data: UpdateContextData) => {
    try {
      setError(null);
      const response = await contextsService.updateContext(id, data);
      
      if (response.error) {
        setError(response.error);
        return { success: false, error: response.error };
      }
      
      if (response.data) {
        setContexts(prev => 
          prev.map(ctx => ctx.id === id ? response.data! : ctx)
        );
        return { success: true, context: response.data };
      }
      
      return { success: false, error: 'No se recibieron datos' };
    } catch (err) {
      const error = 'Error de conexión al actualizar contexto';
      setError(error);
      return { success: false, error };
    }
  }, []);

  const deleteContext = useCallback(async (id: string) => {
    try {
      setError(null);
      const response = await contextsService.deleteContext(id);
      
      if (response.error) {
        setError(response.error);
        return { success: false, error: response.error };
      }
      
      setContexts(prev => prev.filter(ctx => ctx.id !== id));
      return { success: true };
    } catch (err) {
      const error = 'Error de conexión al eliminar contexto';
      setError(error);
      return { success: false, error };
    }
  }, []);

  const toggleActive = useCallback(async (id: string, isActive: boolean) => {
    try {
      setError(null);
      const response = await contextsService.toggleActive(id, isActive);
      
      if (response.error) {
        setError(response.error);
        return { success: false, error: response.error };
      }
      
      if (response.data) {
        setContexts(prev => 
          prev.map(ctx => ctx.id === id ? response.data! : ctx)
        );
      }
      
      return { success: true };
    } catch (err) {
      const error = 'Error de conexión al cambiar estado del contexto';
      setError(error);
      return { success: false, error };
    }
  }, []);

  // Helper functions
  const getActiveContexts = useCallback(() => {
    return contexts.filter(ctx => ctx.isActive);
  }, [contexts]);

  const getContextById = useCallback((id: string) => {
    return contexts.find(ctx => ctx.id === id);
  }, [contexts]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    contexts,
    isLoading,
    error,
    fetchContexts,
    createContext,
    updateContext,
    deleteContext,
    toggleActive,
    getActiveContexts,
    getContextById,
    clearError,
  };
}