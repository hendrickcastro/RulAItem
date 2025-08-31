'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Header from '@/components/header';
import Breadcrumbs from '@/components/breadcrumbs';

export default function CommitsPage() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [commits, setCommits] = useState<any>({});
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [isLoadingCommits, setIsLoadingCommits] = useState(true);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [projectCommits, setProjectCommits] = useState<{[key: string]: any[]}>({});
  const [loadingProjectCommits, setLoadingProjectCommits] = useState<{[key: string]: boolean}>({});

  const fetchProjectCommits = async (projectId: string) => {
    try {
      setLoadingProjectCommits(prev => ({ ...prev, [projectId]: true }));
      
      const response = await fetch(`/api/analysis?contextId=${projectId}`);
      const data = await response.json();
      
      if (response.ok) {
        // Extract unique commits for this project
        const uniqueCommits = data.analyses?.reduce((acc: any[], analysis: any) => {
          if (analysis.commit && !acc.find(c => c.sha === analysis.commit.sha)) {
            acc.push({
              ...analysis.commit,
              analysis: analysis,
              context: analysis.context
            });
          }
          return acc;
        }, []) || [];
        
        // Sort commits by date (most recent first)
        uniqueCommits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        setProjectCommits(prev => ({ ...prev, [projectId]: uniqueCommits }));
      } else {
        console.error('Error fetching project commits:', data.error);
      }
    } catch (error) {
      console.error('Error fetching project commits:', error);
    } finally {
      setLoadingProjectCommits(prev => ({ ...prev, [projectId]: false }));
    }
  };

  const handleProjectToggle = async (projectId: string) => {
    if (expandedProject === projectId) {
      // Collapse current project
      setExpandedProject(null);
    } else {
      // Expand new project
      setExpandedProject(projectId);
      
      // Load commits if not already loaded
      if (!projectCommits[projectId]) {
        await fetchProjectCommits(projectId);
      }
    }
  };

  const fetchAnalyses = async () => {
    try {
      setIsLoadingCommits(true);
      const response = await fetch('/api/analysis');
      const data = await response.json();
      
      if (response.ok) {
        setAnalyses(data.analyses || []);
        // Group projects with commit counts (without loading all commits)
        const projectsByContext = data.analyses?.reduce((acc: any, analysis: any) => {
          if (analysis.commit && analysis.context) {
            const contextId = analysis.context.id;
            if (!acc[contextId]) {
              acc[contextId] = {
                context: analysis.context,
                commitCount: 0,
                commitIds: new Set()
              };
            }
            
            // Count unique commits
            if (!acc[contextId].commitIds.has(analysis.commit.sha)) {
              acc[contextId].commitIds.add(analysis.commit.sha);
              acc[contextId].commitCount++;
            }
          }
          return acc;
        }, {}) || {};

        // Convert Set to array for serialization and remove commitIds
        Object.keys(projectsByContext).forEach(projectId => {
          delete projectsByContext[projectId].commitIds;
        });

        console.log('Projects with commit counts:', Object.entries(projectsByContext).map(([id, group]: [string, any]) => ({ 
          projectId: id,
          projectName: group.context?.name,
          commitsCount: group.commitCount || 0
        })));
        
        setCommits(projectsByContext);
      } else {
        console.error('Error fetching analyses:', data.error);
      }
    } catch (error) {
      console.error('Error fetching analyses:', error);
    } finally {
      setIsLoadingCommits(false);
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

  // Calculate stats from project commit counts and loaded commits
  const totalCommits = Object.values(commits).reduce((sum: number, project: any) => sum + (project.commitCount || 0), 0);
  const totalProjects = Object.keys(commits).length;
  
  // Calculate this week's commits from loaded project commits
  const allLoadedCommits = Object.values(projectCommits).flat();
  const thisWeekCommits = allLoadedCommits.filter(commit => {
    const commitDate = new Date(commit.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return commitDate >= weekAgo;
  }).length;
  
  const avgCommitsPerDay = totalCommits > 0 ? (totalCommits / 30).toFixed(1) : '0';

  const handleSync = async () => {
    setIsLoading(true);
    setMessage('');
    
    try {
      // Refresh the analyses/commits data
      await fetchAnalyses();
      setMessage('Commits sincronizados exitosamente');
    } catch (error) {
      setMessage('Error de conexión al sincronizar commits');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Breadcrumbs />
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Historial de Commits</h1>
          <button 
            onClick={handleSync}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Sincronizando...' : 'Sincronizar Repositorios'}
          </button>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-md ${message.includes('Error') ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
            {message}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Commits por Proyecto</h2>
            <p className="text-gray-600">Haz clic en cualquier proyecto para ver sus commits</p>
          </div>
          
          <div className="p-6">
            {isLoadingCommits ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-4">⏳</div>
                <p>Cargando commits...</p>
              </div>
            ) : Object.keys(commits).length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-lg font-medium mb-2">No hay commits para mostrar</h3>
                <p className="text-sm mb-4">Los commits aparecerán aquí una vez que realices análisis de código.</p>
                <a 
                  href="/analysis" 
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Crear Análisis
                </a>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(commits).map(([projectId, projectData]: [string, any]) => {
                  const isExpanded = expandedProject === projectId;
                  const isLoading = loadingProjectCommits[projectId];
                  const projectCommitsList = projectCommits[projectId] || [];
                  
                  return (
                    <div key={projectId} className="border border-gray-200 rounded-xl bg-white shadow-sm">
                      {/* Project Header - Clickable */}
                      <button
                        onClick={() => handleProjectToggle(projectId)}
                        className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 px-6 py-4 rounded-t-xl hover:from-blue-100 hover:to-indigo-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                              </svg>
                              <h3 className="text-lg font-semibold text-gray-900">{projectData.context?.name}</h3>
                            </div>
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                              {projectData.commitCount || 0} commits
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <a 
                              href={projectData.context?.repoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              Ver repositorio
                            </a>
                            <svg 
                              className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </button>
                      
                      {/* Project Commits - Expandable */}
                      {isExpanded && (
                        <div className="border-t border-gray-200">
                          {isLoading ? (
                            <div className="p-8 text-center text-gray-500">
                              <div className="inline-flex items-center gap-2">
                                <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Cargando commits...</span>
                              </div>
                            </div>
                          ) : projectCommitsList.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                              <div className="text-4xl mb-2">📭</div>
                              <p>No hay commits disponibles</p>
                            </div>
                          ) : (
                            <div className="p-6">
                              <div className="space-y-3">
                                {projectCommitsList.map((commit: any) => (
                                  <a
                                    key={commit.sha}
                                    href={`/commits/${commit.sha}?repoUrl=${encodeURIComponent(commit.context?.repoUrl || '')}`}
                                    className="block border border-gray-100 rounded-lg p-4 hover:shadow-md hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                          <h4 className="font-medium text-gray-900 truncate text-sm">{commit.message}</h4>
                                          <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${
                                            commit.analysis?.codeQuality >= 8 ? 'bg-green-100 text-green-800' :
                                            commit.analysis?.codeQuality >= 6 ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                          }`}>
                                            {commit.analysis?.codeQuality || 0}/10
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                                          <span className="font-mono">{commit.sha.substring(0, 7)}</span>
                                          <span>•</span>
                                          <span>{commit.author?.name}</span>
                                          <span>•</span>
                                          <span>{new Date(commit.date).toLocaleDateString('es-ES')}</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-gray-500">
                                          <span className="text-green-600">+{commit.additions || 0}</span>
                                          <span className="text-red-600">-{commit.deletions || 0}</span>
                                        </div>
                                        {commit.analysis?.patterns && commit.analysis.patterns.length > 0 && (
                                          <div className="flex gap-1 flex-wrap mt-2">
                                            {commit.analysis.patterns.slice(0, 2).map((pattern: string, index: number) => (
                                              <span 
                                                key={index}
                                                className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full"
                                              >
                                                {pattern}
                                              </span>
                                            ))}
                                            {commit.analysis.patterns.length > 2 && (
                                              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                                                +{commit.analysis.patterns.length - 2}
                                              </span>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                      <div className="ml-4 flex-shrink-0 flex items-center gap-2">
                                        <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${
                                          commit.analysis?.impact === 'high' ? 'bg-red-100 text-red-800' :
                                          commit.analysis?.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                          'bg-green-100 text-green-800'
                                        }`}>
                                          {commit.analysis?.impact || 'low'}
                                        </span>
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                        </svg>
                                      </div>
                                    </div>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-blue-900">Total Commits</h3>
              <div className="p-2 bg-blue-500 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-blue-700 mb-1">
              {isLoadingCommits ? '...' : totalCommits}
            </p>
            <p className="text-sm text-blue-600 font-medium">Commits analizados</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-green-900">Esta Semana</h3>
              <div className="p-2 bg-green-500 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-green-700 mb-1">
              {isLoadingCommits ? '...' : thisWeekCommits}
            </p>
            <p className="text-sm text-green-600 font-medium">Commits esta semana</p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-purple-900">Promedio</h3>
              <div className="p-2 bg-purple-500 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-purple-700 mb-1">
              {isLoadingCommits ? '...' : avgCommitsPerDay}
            </p>
            <p className="text-sm text-purple-600 font-medium">Commits por día</p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-orange-900">Proyectos</h3>
              <div className="p-2 bg-orange-500 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-orange-700 mb-1">
              {isLoadingCommits ? '...' : totalProjects}
            </p>
            <p className="text-sm text-orange-600 font-medium">Proyectos activos</p>
          </div>
        </div>
        </div>
      </div>
    </>
  );
}