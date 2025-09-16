import { apiClient, ApiResponse } from '@/lib/api/client';

export interface Context {
  id: string;
  nombre: string;
  descripcion: string;
  repoUrl: string;
  branch: string;
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  responsableId: string;
}

export interface CreateContextData {
  nombre: string;
  descripcion: string;
  repoUrl: string;
  branch: string;
  tags: string[];
}

export interface UpdateContextData extends Partial<CreateContextData> {
  isActive?: boolean;
}

export interface ContextsResponse {
  contexts: Context[];
  total?: number;
}

class ContextsService {
  async getContexts(): Promise<ApiResponse<ContextsResponse>> {
    return apiClient.get<ContextsResponse>('/contextos');
  }

  async getContext(id: string): Promise<ApiResponse<Context>> {
    return apiClient.get<Context>(`/contextos/${id}`);
  }

  async createContext(data: CreateContextData): Promise<ApiResponse<Context>> {
    return apiClient.post<Context>('/contextos', {
      ...data,
      tags: data.tags.filter(Boolean), // Remove empty tags
    });
  }

  async updateContext(id: string, data: UpdateContextData): Promise<ApiResponse<Context>> {
    const updateData = { ...data };
    if (updateData.tags) {
      updateData.tags = updateData.tags.filter(Boolean);
    }
    return apiClient.put<Context>(`/contextos/${id}`, updateData);
  }

  async deleteContext(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/contextos/${id}`);
  }

  async toggleActive(id: string, isActive: boolean): Promise<ApiResponse<Context>> {
    return this.updateContext(id, { isActive });
  }

  // Helper methods
  formatContextForForm(context: Context) {
    return {
      nombre: context.nombre,
      descripcion: context.descripcion,
      repoUrl: context.repoUrl,
      branch: context.branch || 'main',
      tags: context.tags?.join(', ') || '',
    };
  }

  parseFormData(formData: {
    nombre: string;
    descripcion: string;
    repoUrl: string;
    branch: string;
    tags: string;
  }): CreateContextData {
    return {
      nombre: formData.nombre.trim(),
      descripcion: formData.descripcion.trim(),
      repoUrl: formData.repoUrl.trim(),
      branch: formData.branch.trim() || 'main',
      tags: formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean),
    };
  }
}

export const contextsService = new ContextsService();