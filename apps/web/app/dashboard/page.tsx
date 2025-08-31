'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Header from '@/components/header';
import Breadcrumbs from '@/components/breadcrumbs';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [contexts, setContexts] = useState<any[]>([]);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [isLoadingContexts, setIsLoadingContexts] = useState(true);
  const [isLoadingAnalyses, setIsLoadingAnalyses] = useState(true);

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
        console.log('Dashboard: Analyses data received:', {
          total: data.analyses?.length || 0,
          firstFew: data.analyses?.slice(0, 3) || []
        });
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
      fetchContexts();
      fetchAnalyses();
    }
  }, [session]);

  if (status === 'loading') return <div>Cargando...</div>;
  if (!session) {
    redirect('/');
    return null;
  }

  // Calculate total commits from analyses
  const totalCommits = analyses.length;
  const uniqueCommits = new Set(analyses.map(a => a.commit?.sha).filter(Boolean)).size;
  
  console.log('Dashboard stats:', {
    totalAnalyses: totalCommits,
    uniqueCommits,
    analysesWithCommits: analyses.filter(a => a.commit?.sha).length,
    sampleCommitShas: analyses.slice(0, 3).map(a => a.commit?.sha)
  });

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Breadcrumbs />
          <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
        
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Bienvenido, {session.user.name}</h2>
            <p className="text-gray-600 mb-6">Aquí tienes un resumen de tu actividad de análisis de código</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md border border-blue-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-700">Contextos</h3>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-blue-600 mb-1">
                  {isLoadingContexts ? '...' : contexts.length}
                </p>
                <p className="text-sm text-gray-500">Repositorios configurados</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md border border-green-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-700">Commits</h3>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-green-600 mb-1">
                  {isLoadingAnalyses ? '...' : uniqueCommits}
                </p>
                <p className="text-sm text-gray-500">Commits únicos analizados</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md border border-purple-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-700">Análisis</h3>
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-purple-600 mb-1">
                  {isLoadingAnalyses ? '...' : analyses.length}
                </p>
                <p className="text-sm text-gray-500">Análisis completados</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">Acciones Rápidas</h3>
                <p className="text-gray-600 text-sm">Tareas frecuentes para gestionar tu código</p>
              </div>
              <div className="p-6 space-y-3">
                <a 
                  href="/contextos" 
                  className="flex items-center w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors group"
                >
                  <div className="p-2 bg-blue-50 rounded-lg mr-3 group-hover:bg-blue-100 transition-colors">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Gestionar Contextos</p>
                    <p className="text-sm text-gray-500">Crear y configurar repositorios</p>
                  </div>
                </a>
                
                <a 
                  href="/analysis" 
                  className="flex items-center w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-green-300 transition-colors group"
                >
                  <div className="p-2 bg-green-50 rounded-lg mr-3 group-hover:bg-green-100 transition-colors">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Análisis de Código</p>
                    <p className="text-sm text-gray-500">Ver análisis y crear nuevos</p>
                  </div>
                </a>
                
                <a 
                  href="/commits" 
                  className="flex items-center w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-purple-300 transition-colors group"
                >
                  <div className="p-2 bg-purple-50 rounded-lg mr-3 group-hover:bg-purple-100 transition-colors">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Historial de Commits</p>
                    <p className="text-sm text-gray-500">Explorar commits analizados</p>
                  </div>
                </a>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">Actividad Reciente</h3>
                <p className="text-gray-600 text-sm">Últimos análisis realizados</p>
              </div>
              
              <div className="p-6">
                {isLoadingAnalyses ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-3">⏳</div>
                    <p>Cargando actividad...</p>
                  </div>
                ) : analyses.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-3">📊</div>
                    <h4 className="font-medium mb-2">No hay actividad reciente</h4>
                    <p className="text-sm mb-4">Los análisis aparecerán aquí una vez que comiences a analizar commits.</p>
                    <a 
                      href="/analysis" 
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Nuevo Análisis
                    </a>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {analyses.slice(0, 3).map((analysis) => (
                      <div key={analysis.id} className="border-b border-gray-100 pb-3 last:border-b-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 truncate text-sm">
                              {analysis.commit?.message || 'Commit sin mensaje'}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                              <span className="truncate">{analysis.context?.name}</span>
                              <span>•</span>
                              <span>{new Date(analysis.createdAt).toLocaleDateString('es-ES')}</span>
                            </div>
                          </div>
                          <div className="ml-3 flex-shrink-0">
                            <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${
                              analysis.codeQuality >= 8 ? 'bg-green-100 text-green-800' :
                              analysis.codeQuality >= 6 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {analysis.codeQuality}/10
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {analyses.length > 3 && (
                      <div className="text-center pt-3">
                        <a 
                          href="/analysis" 
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Ver todos los análisis →
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}