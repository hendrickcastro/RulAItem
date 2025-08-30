'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Header from '@/components/header';
import Breadcrumbs from '@/components/breadcrumbs';

export default function AnalysisPage() {
  const { data: session, status } = useSession();
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [contexts, setContexts] = useState<any[]>([]);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [isLoadingContexts, setIsLoadingContexts] = useState(false);
  const [isLoadingAnalyses, setIsLoadingAnalyses] = useState(true);
  const [isStartingAnalysis, setIsStartingAnalysis] = useState(false);
  const [message, setMessage] = useState('');

  const fetchContexts = async () => {
    try {
      setIsLoadingContexts(true);
      const response = await fetch('/api/contextos');
      const data = await response.json();
      
      if (response.ok) {
        setContexts(data.contexts || []);
      } else {
        console.error('Error fetching contexts:', data.error);
      }
    } catch (error) {
      console.error('Error fetching contexts:', error);
    } finally {
      setIsLoadingContexts(false);
    }
  };

  const fetchAnalyses = async () => {
    try {
      setIsLoadingAnalyses(true);
      const response = await fetch('/api/analysis');
      const data = await response.json();
      
      if (response.ok) {
        setAnalyses(data.analyses || []);
      } else {
        console.error('Error fetching analyses:', data.error);
      }
    } catch (error) {
      console.error('Error fetching analyses:', error);
    } finally {
      setIsLoadingAnalyses(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchAnalyses();
    }
  }, [session]);

  if (status === 'loading') return <div>Cargando...</div>;
  if (!session) {
    redirect('/');
    return null;
  }

  const handleNewAnalysis = async () => {
    setShowAnalysisModal(true);
    await fetchContexts();
  };

  const handleStartAnalysis = async (contextId: string) => {
    try {
      setIsStartingAnalysis(true);
      setMessage('');
      
      // TODO: Implementar API de análisis
      const response = await fetch('/api/analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contextId }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Análisis iniciado exitosamente');
        setShowAnalysisModal(false);
        // Refresh analyses after successful analysis
        await fetchAnalyses();
      } else {
        setMessage(data.error || 'Error al iniciar análisis');
      }
    } catch (error) {
      setMessage('Error de conexión al iniciar análisis');
    } finally {
      setIsStartingAnalysis(false);
    }
  };

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Breadcrumbs />
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Análisis de Código</h1>
          <button 
            onClick={handleNewAnalysis}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Nuevo Análisis
          </button>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-md ${message.includes('Error') ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 p-4 md:p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm md:text-lg font-semibold text-blue-900 truncate">Total Análisis</h3>
              <div className="p-2 bg-blue-500 rounded-lg flex-shrink-0">
                <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-blue-700 mb-1">{isLoadingAnalyses ? '...' : analyses.length}</p>
            <p className="text-xs md:text-sm text-blue-600 font-medium">Análisis realizados</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 p-4 md:p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm md:text-lg font-semibold text-green-900 truncate">Calidad Promedio</h3>
              <div className="p-2 bg-green-500 rounded-lg flex-shrink-0">
                <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-green-700 mb-1">
              {isLoadingAnalyses 
                ? '...' 
                : analyses.length > 0 
                  ? (analyses.reduce((sum, a) => sum + a.codeQuality, 0) / analyses.length).toFixed(1)
                  : '-'}
            </p>
            <p className="text-xs md:text-sm text-green-600 font-medium">Score de calidad</p>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 p-4 md:p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm md:text-lg font-semibold text-yellow-900 truncate">Complejidad</h3>
              <div className="p-2 bg-yellow-500 rounded-lg flex-shrink-0">
                <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-yellow-700 mb-1">-</p>
            <p className="text-xs md:text-sm text-yellow-600 font-medium">Complejidad ciclomática</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 p-4 md:p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm md:text-lg font-semibold text-purple-900 truncate">Líneas de Código</h3>
              <div className="p-2 bg-purple-500 rounded-lg flex-shrink-0">
                <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-purple-700 mb-1">0</p>
            <p className="text-xs md:text-sm text-purple-600 font-medium">Total de líneas</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Análisis Recientes</h2>
              <p className="text-gray-600">Últimos análisis de código realizados</p>
            </div>
            
            <div className="p-6">
              {isLoadingAnalyses ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-3">⏳</div>
                  <p>Cargando análisis...</p>
                </div>
              ) : analyses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-3">🔍</div>
                  <h3 className="font-medium mb-2">No hay análisis disponibles</h3>
                  <p className="text-sm">Los análisis aparecerán aquí una vez que proceses commits.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {analyses.slice(0, 5).map((analysis) => (
                    <div key={analysis.id} className="border-b border-gray-100 pb-4 last:border-b-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2 mb-2">
                            <h4 className="font-medium text-gray-900 truncate flex-1 min-w-0">
                              {analysis.commit?.message || 'Commit sin mensaje'}
                            </h4>
                            <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap flex-shrink-0 ${
                              analysis.impact === 'high' ? 'bg-red-100 text-red-700' :
                              analysis.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {analysis.impact}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2 flex-wrap">
                            <span className="flex items-center gap-1 min-w-0">
                              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                              </svg>
                              <span className="truncate">{analysis.context?.name}</span>
                            </span>
                            <span className="text-gray-400">•</span>
                            <span className="whitespace-nowrap">{analysis.commit?.sha?.substring(0, 7)}</span>
                            <span className="text-gray-400">•</span>
                            <span className="whitespace-nowrap">{new Date(analysis.createdAt).toLocaleDateString('es-ES')}</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2 break-words overflow-hidden" style={{ 
                            display: '-webkit-box', 
                            WebkitLineClamp: 2, 
                            WebkitBoxOrient: 'vertical' 
                          }}>
                            {analysis.summary}
                          </p>
                          {analysis.patterns && analysis.patterns.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {analysis.patterns.slice(0, 3).map((pattern: string, index: number) => (
                                <span 
                                  key={index}
                                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full whitespace-nowrap"
                                >
                                  {pattern}
                                </span>
                              ))}
                              {analysis.patterns.length > 3 && (
                                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                                  +{analysis.patterns.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="ml-4 text-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                            analysis.codeQuality >= 8 ? 'bg-green-100 text-green-700' :
                            analysis.codeQuality >= 6 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {analysis.codeQuality}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Calidad</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Métricas de Calidad</h2>
              <p className="text-gray-600">Indicadores de salud del código</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Mantenibilidad</span>
                <div className="flex items-center">
                  <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                    <div className="bg-gray-400 h-2 rounded-full" style={{ width: '0%' }}></div>
                  </div>
                  <span className="text-sm text-gray-600">-</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Cobertura de Tests</span>
                <div className="flex items-center">
                  <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                    <div className="bg-gray-400 h-2 rounded-full" style={{ width: '0%' }}></div>
                  </div>
                  <span className="text-sm text-gray-600">-</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Duplicación</span>
                <div className="flex items-center">
                  <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                    <div className="bg-gray-400 h-2 rounded-full" style={{ width: '0%' }}></div>
                  </div>
                  <span className="text-sm text-gray-600">-</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Deuda Técnica</span>
                <div className="flex items-center">
                  <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                    <div className="bg-gray-400 h-2 rounded-full" style={{ width: '0%' }}></div>
                  </div>
                  <span className="text-sm text-gray-600">-</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de Nuevo Análisis */}
        {showAnalysisModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl transform transition-all">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Nuevo Análisis</h3>
                      <p className="text-purple-100 text-sm">Selecciona un contexto para analizar</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAnalysisModal(false)}
                    className="text-white hover:text-purple-100 p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                {isLoadingContexts ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">⏳</div>
                    <p className="text-gray-600">Cargando contextos...</p>
                  </div>
                ) : contexts.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">📁</div>
                    <h3 className="text-lg font-medium mb-2 text-gray-900">No hay contextos disponibles</h3>
                    <p className="text-gray-600 mb-4">Necesitas crear al menos un contexto antes de poder hacer análisis.</p>
                    <a 
                      href="/contextos" 
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Crear Contexto
                    </a>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-gray-600 mb-4">Selecciona el contexto que deseas analizar:</p>
                    {contexts.map((context) => (
                      <div 
                        key={context.id} 
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer hover:border-purple-300"
                        onClick={() => handleStartAnalysis(context.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-lg font-semibold text-gray-900">{context.nombre}</h4>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                context.isActive 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {context.isActive ? 'Activo' : 'Inactivo'}
                              </span>
                            </div>
                            <p className="text-gray-600 text-sm mb-2">{context.descripcion}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                              </svg>
                              <span>{context.repoUrl.replace('https://github.com/', '')}</span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ))}
                    {isStartingAnalysis && (
                      <div className="text-center py-4">
                        <div className="inline-flex items-center">
                          <svg className="animate-spin w-5 h-5 mr-3 text-purple-600" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="text-purple-600 font-medium">Iniciando análisis...</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  );
}