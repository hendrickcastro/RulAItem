'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/header';
import Breadcrumbs from '@/components/breadcrumbs';

export default function JobDetailsPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const jobId = params.id as string;
  const [job, setJob] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchJob = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/jobs/${jobId}`);
      const data = await response.json();
      
      if (response.ok) {
        setJob(data);
      } else {
        setError(data.error || 'Error desconocido');
      }
    } catch (error) {
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session && jobId) {
      fetchJob();
    }
  }, [session, jobId]);

  // Poll for updates if job is still running
  useEffect(() => {
    if (job && (job.status === 'pending' || job.status === 'processing')) {
      const interval = setInterval(() => {
        fetchJob();
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [job]);

  if (status === 'loading') return <div>Cargando...</div>;
  if (!session) {
    redirect('/');
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'processing': return 'Procesando';
      case 'completed': return 'Completado';
      case 'failed': return 'Fallido';
      default: return 'Desconocido';
    }
  };

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Breadcrumbs />
          
          <div className="flex items-center gap-3 mb-6">
            <Link 
              href="/contextos" 
              className="text-blue-600 hover:text-blue-700 transition-colors"
            >
              ← Volver a Contextos
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Detalles del Análisis</h1>
                  <p className="text-gray-600">Estado y progreso del trabajo en segundo plano</p>
                </div>
                {job && (
                  <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(job.status)}`}>
                    {getStatusText(job.status)}
                  </span>
                )}
              </div>
            </div>
            
            <div className="p-6">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">⏳</div>
                  <p className="text-gray-600">Cargando detalles del trabajo...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">❌</div>
                  <p className="text-red-600 mb-2">Error al cargar el trabajo</p>
                  <p className="text-gray-600">{error}</p>
                </div>
              ) : job ? (
                <div className="space-y-6">
                  {/* Job Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Información del Contexto</h3>
                        <div className="space-y-2">
                          <div>
                            <span className="text-sm font-medium text-gray-600">Nombre:</span>
                            <p className="text-gray-900">{job.payload.contextName}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-600">Repositorio:</span>
                            <a 
                              href={job.payload.repoUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700 block"
                            >
                              {job.payload.repoUrl}
                            </a>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-600">Rama:</span>
                            <p className="text-gray-900">{job.payload.branch}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Estado del Trabajo</h3>
                        <div className="space-y-2">
                          <div>
                            <span className="text-sm font-medium text-gray-600">Estado:</span>
                            <p className="text-gray-900">{getStatusText(job.status)}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-600">Intentos:</span>
                            <p className="text-gray-900">{job.attempts} / {job.maxAttempts}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-600">Creado:</span>
                            <p className="text-gray-900">{new Date(job.createdAt).toLocaleString('es-ES')}</p>
                          </div>
                          {job.updatedAt && (
                            <div>
                              <span className="text-sm font-medium text-gray-600">Actualizado:</span>
                              <p className="text-gray-900">{new Date(job.updatedAt).toLocaleString('es-ES')}</p>
                            </div>
                          )}
                          {job.completedAt && (
                            <div>
                              <span className="text-sm font-medium text-gray-600">Completado:</span>
                              <p className="text-gray-900">{new Date(job.completedAt).toLocaleString('es-ES')}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Progress indicator */}
                  {(job.status === 'pending' || job.status === 'processing') && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <svg className="animate-spin w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <div>
                          <p className="text-blue-900 font-medium">Análisis en progreso...</p>
                          <p className="text-blue-700 text-sm">El análisis continúa ejecutándose en segundo plano. Puedes cerrar esta página sin interrumpir el proceso.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Error details */}
                  {job.error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="text-red-900 font-semibold mb-2">Error</h4>
                      <p className="text-red-800 text-sm">{job.error}</p>
                    </div>
                  )}

                  {/* Results */}
                  {job.result && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="text-green-900 font-semibold mb-3">Resultados del Análisis</h4>
                      <div className="text-sm text-green-800">
                        <pre className="whitespace-pre-wrap font-mono text-xs bg-white p-3 rounded border max-h-96 overflow-y-auto">
                          {typeof job.result === 'string' ? job.result : JSON.stringify(job.result, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <Link
                      href={`/contextos/${job.payload.contextId}`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Ver Contexto
                    </Link>
                    {job.status === 'completed' && job.result && (
                      <Link
                        href={`/analysis/${job.payload.contextId}`}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        Ver Análisis Completo
                      </Link>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">❓</div>
                  <p className="text-gray-600">No se encontró el trabajo</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}