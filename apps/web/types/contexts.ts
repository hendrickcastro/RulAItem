import { BaseEntity } from './common';

export interface Context extends BaseEntity {
  nombre: string;
  descripcion: string;
  repoUrl: string;
  branch: string;
  tags: string[];
  isActive: boolean;
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

export interface ContextFormData {
  nombre: string;
  descripcion: string;
  repoUrl: string;
  branch: string;
  tags: string; // Comma-separated string for form
}

export interface ContextStats {
  total: number;
  active: number;
  inactive: number;
  withTags: number;
}