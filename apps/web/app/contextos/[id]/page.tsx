'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect, useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import Header from '@/components/header';
import Breadcrumbs from '@/components/breadcrumbs';
import Link from 'next/link';

export default function ContextDetailPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const contextId = params.id as string;
  
  const [context, setContext] = useState<any>(null);
  const [commits, setCommits] = useState<any[]>([]);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [isLoadingContext, setIsLoadingContext] = useState(true);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<string[]>([]);
  const [projectDescription, setProjectDescription] = useState('');

  const fetchContext = async () => {
    try {
      setIsLoadingContext(true);
      const response = await fetch(`/api/contextos/${contextId}`);
      const data = await response.json();
      
      if (response.ok) {
        setContext(data.context);
        setProjectDescription(data.context.aiDescription || '');
      } else {
        console.error('Error fetching context:', data.error);
      }
    } catch (error) {
      console.error('Error fetching context:', error);
    } finally {
      setIsLoadingContext(false);
    }
  };

  const fetchContextAnalyses = async () => {
    try {
      const response = await fetch(`/api/analysis?contextId=${contextId}`);
      const data = await response.json();
      
      if (response.ok) {
        setAnalyses(data.analyses || []);
        // Extract commits from analyses
        const uniqueCommits = data.analyses?.reduce((acc: any[], analysis: any) => {
          if (analysis.commit && !acc.find(c => c.sha === analysis.commit.sha)) {
            acc.push({
              ...analysis.commit,
              analysis: analysis
            });
          }
          return acc;
        }, []) || [];
        setCommits(uniqueCommits.slice(0, 20)); // Last 20 commits
      }
    } catch (error) {
      console.error('Error fetching context analyses:', error);
    }
  };

  const handleAnalyzeProject = async () => {
    setIsLoadingAnalysis(true);
    setAnalysisProgress([]);
    
    const progressSteps = [
      '🔍 Conectando con GitHub API...',
      '📁 Analizando estructura completa del repositorio...',
      '🔑 Extrayendo contenido de archivos clave (package.json, configs, etc.)...',
      '📝 Procesando últimos 20 commits con detalles completos...',
      '🤖 Generando análisis exhaustivo del proyecto con IA...',
      '👥 Analizando patrones de desarrollo y estadísticas de equipo...',
      '🔄 Identificando áreas activas y funcionalidades en desarrollo...',
      '💾 Guardando análisis detallado en base de datos...',
      '✅ Análisis exhaustivo completado'
    ];

    try {
      // Show progress steps with delays
      for (let i = 0; i < progressSteps.length - 1; i++) {
        setAnalysisProgress(prev => [...prev, progressSteps[i]]);
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      const response = await fetch('/api/analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contextId }),
      });

      const data = await response.json();
      if (response.ok) {
        setAnalysisProgress(prev => [...prev, progressSteps[progressSteps.length - 1]]);
        await fetchContext(); // Refresh context to get AI description
        await fetchContextAnalyses();
        
        // Clear progress after 2 seconds
        setTimeout(() => {
          setAnalysisProgress([]);
        }, 2000);
      }
    } catch (error) {
      console.error('Error analyzing project:', error);
      setAnalysisProgress(prev => [...prev, '❌ Error durante el análisis']);
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  useEffect(() => {
    if (session && contextId) {
      fetchContext();
      fetchContextAnalyses();
    }
  }, [session, contextId]);

  if (status === 'loading') return <div>Cargando...</div>;
  if (!session) {
    redirect('/');
    return null;
  }

  if (isLoadingContext) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="text-4xl mb-4">⏳</div>
            <p>Cargando contexto...</p>
          </div>
        </div>
      </>
    );
  }

  if (!context) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="text-4xl mb-4">❌</div>
            <h3 className="text-lg font-medium mb-2">Contexto no encontrado</h3>
            <Link 
              href="/contextos"
              className="text-blue-600 hover:text-blue-800"
            >
              Volver a contextos
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Breadcrumbs />
          
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{context.nombre}</h1>
              <p className="text-gray-600 mt-1">{context.descripcion}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAnalyzeProject}
                disabled={isLoadingAnalysis}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isLoadingAnalysis ? 'Analizando...' : 'Analizar Proyecto'}
              </button>
              <Link
                href="/contextos"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Volver
              </Link>
            </div>
          </div>

          {/* Analysis Progress */}
          {analysisProgress.length > 0 && (
            <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-blue-900 mb-3">Progreso del Análisis</h3>
              <div className="space-y-2">
                {analysisProgress.map((step, index) => (
                  <div key={index} className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-blue-800">{step}</span>
                    {index === analysisProgress.length - 1 && isLoadingAnalysis && (
                      <div className="ml-auto">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Project Overview */}
              <div className="bg-white rounded-lg shadow-md">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-800">Descripción del Proyecto</h2>
                  <p className="text-gray-600 text-sm">Análisis automático del repositorio</p>
                </div>
                <div className="p-6">
                  {projectDescription ? (
                    <div className="prose prose-blue max-w-none text-gray-700 leading-relaxed">
                      <ReactMarkdown 
                        components={{
                          h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-gray-900 mb-4" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-xl font-semibold text-gray-800 mb-3 mt-6" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-4" {...props} />,
                          p: ({node, ...props}) => <p className="mb-3 leading-relaxed" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc list-inside mb-3 space-y-1" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-3 space-y-1" {...props} />,
                          li: ({node, ...props}) => <li className="text-gray-700" {...props} />,
                          code: ({node, ...props}) => <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800" {...props} />,
                          blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 my-3" {...props} />,
                          strong: ({node, ...props}) => <strong className="font-semibold text-gray-900" {...props} />,
                        }}
                      >
                        {projectDescription}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-3">🤖</div>
                      <h3 className="font-medium mb-2">Análisis pendiente</h3>
                      <p className="text-sm mb-4">Ejecuta un análisis para generar la descripción del proyecto</p>
                      <button
                        onClick={handleAnalyzeProject}
                        disabled={isLoadingAnalysis}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        {isLoadingAnalysis ? 'Analizando...' : 'Generar Descripción'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent commits */}
              <div className="bg-white rounded-lg shadow-md">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-800">Últimos Commits Analizados</h2>
                  <p className="text-gray-600 text-sm">Historial de cambios y análisis</p>
                </div>
                <div className="p-6">
                  {commits.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-3">📝</div>
                      <h3 className="font-medium mb-2">No hay commits analizados</h3>
                      <p className="text-sm">Los commits aparecerán aquí después del análisis</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {commits.map((commit) => (
                        <div key={commit.sha} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-gray-900 truncate mb-2">{commit.message}</h3>
                              <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                                <span className="font-mono">{commit.sha.substring(0, 7)}</span>
                                <span>{commit.author?.name}</span>
                                <span>{new Date(commit.date).toLocaleDateString('es-ES')}</span>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span className="text-green-600">+{commit.additions || 0}</span>
                                <span className="text-red-600">-{commit.deletions || 0}</span>
                                {commit.filesChanged && commit.filesChanged.length > 0 && (
                                  <span>{commit.filesChanged.length} archivos</span>
                                )}
                              </div>
                              {commit.analysis?.summary && (
                                <p className="text-sm text-gray-600 mt-2">{commit.analysis.summary}</p>
                              )}
                              {commit.analysis?.patterns && commit.analysis.patterns.length > 0 && (
                                <div className="flex gap-1 flex-wrap mt-2">
                                  {commit.analysis.patterns.slice(0, 3).map((pattern: string, index: number) => (
                                    <span 
                                      key={index}
                                      className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full"
                                    >
                                      {pattern}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="ml-4 flex-shrink-0">
                              {commit.analysis && (
                                <div className="text-center">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                                    commit.analysis.codeQuality >= 8 ? 'bg-green-100 text-green-700' :
                                    commit.analysis.codeQuality >= 6 ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                    {commit.analysis.codeQuality}
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">Calidad</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Project Info */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Información del Proyecto</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Repositorio</label>
                    <a 
                      href={context.repoUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block text-blue-600 hover:text-blue-800 truncate"
                    >
                      {context.repoUrl.replace('https://github.com/', '')}
                    </a>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Rama</label>
                    <p className="text-gray-900">{context.branch || 'main'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Estado</label>
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                      context.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {context.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Creado</label>
                    <p className="text-gray-900">{new Date(context.createdAt).toLocaleDateString('es-ES')}</p>
                  </div>
                  {context.tags && context.tags.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Tags</label>
                      <div className="flex gap-1 flex-wrap mt-1">
                        {context.tags.map((tag: string, index: number) => (
                          <span 
                            key={index}
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Statistics */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Estadísticas</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Commits analizados</span>
                    <span className="font-medium">{commits.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Análisis totales</span>
                    <span className="font-medium">{analyses.length}</span>
                  </div>
                  {analyses.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Calidad promedio</span>
                      <span className="font-medium">
                        {(analyses.reduce((sum, a) => sum + a.codeQuality, 0) / analyses.length).toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}