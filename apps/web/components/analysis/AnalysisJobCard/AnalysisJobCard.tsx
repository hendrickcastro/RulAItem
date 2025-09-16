import React from 'react';
import { StatusBadge } from '@/components/ui';

interface AnalysisJobCardProps {
  job: {
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    contextId: string;
    contextName: string;
    repoUrl?: string;
    createdAt: string;
    updatedAt?: string;
    completedAt?: string;
    attempts?: number;
    error?: string;
  };
  onCancel?: (jobId: string) => void;
  showActions?: boolean;
}

export function AnalysisJobCard({ job, onCancel, showActions = true }: AnalysisJobCardProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getElapsedTime = (startDate: string, endDate?: string) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const elapsed = Math.floor((end.getTime() - start.getTime()) / 1000);
    
    if (elapsed < 60) return `${elapsed}s`;
    if (elapsed < 3600) return `${Math.floor(elapsed / 60)}m`;
    return `${Math.floor(elapsed / 3600)}h ${Math.floor((elapsed % 3600) / 60)}m`;
  };

  const canCancel = job.status === 'pending' || job.status === 'processing';

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-medium text-gray-900 truncate">{job.contextName}</h3>
            <StatusBadge status={job.status} />
          </div>
          
          <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
            {job.repoUrl && (
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                {new URL(job.repoUrl).pathname}
              </span>
            )}
            <span>•</span>
            <span>Iniciado: {formatDate(job.createdAt)}</span>
            <span>•</span>
            <span>Duración: {getElapsedTime(job.createdAt, job.completedAt)}</span>
          </div>
          
          {job.attempts && job.attempts > 0 && (
            <div className="text-xs text-gray-500 mb-2">
              Intentos: {job.attempts}/3
            </div>
          )}
          
          {job.error && (
            <div className="text-xs text-red-600 bg-red-50 p-2 rounded mt-2">
              Error: {job.error}
            </div>
          )}
        </div>
        
        {showActions && (
          <div className="ml-4 flex-shrink-0 flex flex-col gap-2">
            {canCancel && onCancel && (
              <button
                onClick={() => onCancel(job.id)}
                className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 px-2 py-1 border border-red-200 rounded hover:bg-red-50 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancelar
              </button>
            )}
            
            {job.repoUrl && (
              <a 
                href={job.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Ver repo
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}