import React from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/components/ui';

interface ContextCardProps {
  context: {
    id: string;
    nombre: string;
    descripcion: string;
    repoUrl: string;
    isActive: boolean;
    createdAt: string;
    tags?: string[];
  };
  analysisJob?: {
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
  } | null;
  onAnalyze?: (contextId: string) => void;
  onCancel?: (contextId: string) => void;
  onEdit?: (context: any) => void;
  onToggleActive?: (context: any) => void;
  onDelete?: (context: any) => void;
  isMenuOpen?: boolean;
  onToggleMenu?: (contextId: string | null) => void;
}

export function ContextCard({
  context,
  analysisJob,
  onAnalyze,
  onCancel,
  onEdit,
  onToggleActive,
  onDelete,
  isMenuOpen,
  onToggleMenu,
}: ContextCardProps) {
  const hasActiveJob = analysisJob && (analysisJob.status === 'pending' || analysisJob.status === 'processing');

  return (
    <div className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">{context.nombre}</h3>
            <StatusBadge
              status={context.isActive ? 'completed' : 'cancelled'}
              showIcon={false}
              size="sm"
              className={context.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
            />
          </div>
          
          <p className="text-gray-600 text-sm mb-3 leading-relaxed">{context.descripcion}</p>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-gray-500">
            <a 
              href={context.repoUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-blue-600 transition-colors w-fit"
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span className="truncate max-w-[200px] sm:max-w-none">
                {context.repoUrl.replace('https://github.com/', '')}
              </span>
            </a>
            <span className="hidden sm:inline">•</span>
            <span>Creado {new Date(context.createdAt).toLocaleDateString('es-ES')}</span>
          </div>
          
          {context.tags && context.tags.length > 0 && (
            <div className="flex gap-1.5 sm:gap-2 mt-3 flex-wrap">
              {context.tags.map((tag: string, index: number) => (
                <span 
                  key={index}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex gap-2 mt-3 sm:mt-0 sm:ml-4">
          <Link 
            href={`/contextos/${context.id}`}
            className="flex-1 sm:flex-none px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors text-center touch-manipulation"
          >
            Ver
          </Link>
          
          {hasActiveJob ? (
            <button
              onClick={() => onCancel?.(context.id)}
              className="flex-1 sm:flex-none px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors text-center touch-manipulation"
            >
              Cancelar
            </button>
          ) : (
            <button
              onClick={() => onAnalyze?.(context.id)}
              className="flex-1 sm:flex-none px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded-md transition-colors text-center touch-manipulation"
            >
              Analizar
            </button>
          )}
          
          <div className="relative">
            <button
              onClick={() => onToggleMenu?.(isMenuOpen ? null : context.id)}
              className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors touch-manipulation"
            >
              •••
            </button>
            
            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-52 sm:w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="py-1">
                  <button
                    onClick={() => onEdit?.(context)}
                    className="w-full px-4 py-3 sm:py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 sm:gap-2 touch-manipulation"
                  >
                    <svg className="w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Editar Contexto
                  </button>
                  
                  <button
                    onClick={() => onToggleActive?.(context)}
                    className="w-full px-4 py-3 sm:py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 sm:gap-2 touch-manipulation"
                  >
                    {context.isActive ? (
                      <>
                        <svg className="w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                        Desactivar
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Activar
                      </>
                    )}
                  </button>
                  
                  {hasActiveJob && (
                    <button
                      onClick={() => {
                        onCancel?.(context.id);
                        onToggleMenu?.(null);
                      }}
                      className="w-full px-4 py-3 sm:py-2 text-left text-sm text-orange-600 hover:bg-orange-50 flex items-center gap-3 sm:gap-2 touch-manipulation"
                    >
                      <svg className="w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Cancelar Análisis
                    </button>
                  )}
                  
                  <div className="border-t border-gray-100 my-1"></div>
                  
                  <button
                    onClick={() => onDelete?.(context)}
                    className="w-full px-4 py-3 sm:py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 sm:gap-2 touch-manipulation"
                  >
                    <svg className="w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Eliminar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}