'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/header';
import Breadcrumbs from '@/components/breadcrumbs';

export default function ContextosPage() {
  const { data: session, status } = useSession();
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [contexts, setContexts] = useState<any[]>([]);
  const [isLoadingContexts, setIsLoadingContexts] = useState(true);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    repoUrl: '',
    branch: 'main',
    tags: ''
  });
  const [availableBranches, setAvailableBranches] = useState<string[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [repositories, setRepositories] = useState<any[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [showRepositories, setShowRepositories] = useState(false);
  const [repoSearch, setRepoSearch] = useState('');
  const [isCreatingFromRepo, setIsCreatingFromRepo] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<any>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingContext, setEditingContext] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [contextToDelete, setContextToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [analysisJobs, setAnalysisJobs] = useState<any[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);

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

  const fetchAnalysisJobs = async () => {
    try {
      setIsLoadingJobs(true);
      const response = await fetch('/api/analysis/background');
      const data = await response.json();
      
      if (response.ok) {
        setAnalysisJobs(data.jobs || []);
      } else {
        console.error('Error fetching analysis jobs:', data.error);
        // For now, set empty array if there's an error (missing index)
        setAnalysisJobs([]);
      }
    } catch (error) {
      console.error('Error fetching analysis jobs:', error);
      // For now, set empty array if there's an error
      setAnalysisJobs([]);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  const startBackgroundAnalysis = async (contextId: string) => {
    try {
      const response = await fetch('/api/analysis/background', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contextId }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`${data.message}`);
        // Refresh jobs list to show new job
        await fetchAnalysisJobs();
      } else {
        setMessage(`Error al iniciar análisis: ${data.error}`);
      }
    } catch (error) {
      setMessage('Error de conexión al iniciar el análisis');
    }
  };

  const fetchRepositories = async (search = '') => {
    try {
      setIsLoadingRepos(true);
      const params = new URLSearchParams({
        page: '1',
        per_page: '20',
        sort: 'updated',
        type: 'owner'
      });
      
      if (search.trim()) {
        params.set('search', search);
      }
      
      const response = await fetch(`/api/github/repositories?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setRepositories(data.repositories || []);
      } else {
        console.error('Error fetching repositories:', data.error);
        setRepositories([]);
      }
    } catch (error) {
      console.error('Error fetching repositories:', error);
      setRepositories([]);
    } finally {
      setIsLoadingRepos(false);
    }
  };

  const handleCreateContextFromRepo = async (repo: any) => {
    setSelectedRepo(repo);
    setIsCreatingFromRepo(true);
    
    // Set initial form data
    setFormData({
      nombre: repo.name,
      descripcion: repo.description || `Análisis automático del repositorio ${repo.full_name}`,
      repoUrl: repo.html_url,
      branch: repo.default_branch || 'main',
      tags: repo.topics?.join(', ') || repo.language || ''
    });

    // Fetch branches for the repository
    await fetchBranches(repo.html_url);
    
    setShowForm(true);
    setShowRepositories(false);
  };

  const handleEditContext = (context: any) => {
    setEditingContext(context);
    setFormData({
      nombre: context.nombre,
      descripcion: context.descripcion,
      repoUrl: context.repoUrl,
      branch: context.branch || 'main',
      tags: context.tags?.join(', ') || ''
    });
    setShowForm(true);
    setOpenMenuId(null);
    // Fetch branches for the repository
    fetchBranches(context.repoUrl);
  };

  const handleDeleteContext = (context: any) => {
    setContextToDelete(context);
    setShowDeleteModal(true);
    setOpenMenuId(null);
  };

  const confirmDelete = async () => {
    if (!contextToDelete) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/contextos/${contextToDelete.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setMessage('Contexto eliminado exitosamente');
        await fetchContexts();
        setShowDeleteModal(false);
        setContextToDelete(null);
      } else {
        const data = await response.json();
        setMessage(`Error al eliminar: ${data.error || 'Error desconocido'}`);
      }
    } catch (error) {
      setMessage('Error de conexión al eliminar el contexto');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async (context: any) => {
    try {
      const response = await fetch(`/api/contextos/${context.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...context,
          isActive: !context.isActive
        }),
      });

      if (response.ok) {
        setMessage(`Contexto ${!context.isActive ? 'activado' : 'desactivado'} exitosamente`);
        await fetchContexts();
      } else {
        const data = await response.json();
        setMessage(`Error al actualizar: ${data.error || 'Error desconocido'}`);
      }
    } catch (error) {
      setMessage('Error de conexión al actualizar el contexto');
    }
    setOpenMenuId(null);
  };

  useEffect(() => {
    if (session) {
      fetchContexts();
      // Don't fetch jobs on initial load to avoid errors
      // fetchAnalysisJobs();
    }
  }, [session]);

  // Poll for job updates every 10 seconds
  useEffect(() => {
    if (session && analysisJobs.some(job => job.status === 'pending' || job.status === 'processing')) {
      const interval = setInterval(() => {
        fetchAnalysisJobs();
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [session, analysisJobs]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId && !(event.target as Element).closest('.relative')) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [openMenuId]);

  if (status === 'loading') return <div>Cargando...</div>;
  if (!session) {
    redirect('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const url = editingContext ? `/api/contextos/${editingContext.id}` : '/api/contextos';
      const method = editingContext ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(editingContext ? 'Contexto actualizado exitosamente' : 'Contexto creado exitosamente');
        setFormData({ nombre: '', descripcion: '', repoUrl: '', branch: 'main', tags: '' });
        setAvailableBranches([]);
        setIsCreatingFromRepo(false);
        setSelectedRepo(null);
        setEditingContext(null);
        setShowForm(false);
        // Refresh contexts list
        await fetchContexts();
      } else {
        setMessage(data.error || `Error al ${editingContext ? 'actualizar' : 'crear'} el contexto`);
      }
    } catch (error) {
      setMessage(`Error de conexión al ${editingContext ? 'actualizar' : 'crear'} el contexto`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // If repo URL changes, fetch branches
    if (name === 'repoUrl' && value.includes('github.com')) {
      fetchBranches(value);
    }
  };

  const fetchBranches = async (repoUrl: string) => {
    try {
      setIsLoadingBranches(true);
      const [, , , owner, repo] = repoUrl.split('/');
      
      if (!owner || !repo) {
        console.log('Invalid repo URL format:', repoUrl);
        setAvailableBranches([]);
        return;
      }

      console.log('Fetching branches for:', owner, repo);

      // Use our API endpoint instead of calling GitHub directly
      const response = await fetch(`/api/github/repositories/branches?owner=${owner}&repo=${repo}`);
      
      if (response.ok) {
        const data = await response.json();
        const branchNames = data.branches || [];
        console.log('Fetched branches:', branchNames);
        setAvailableBranches(branchNames);
        
        // Priority order: master -> main -> first available branch
        if (branchNames.includes('master')) {
          setFormData(prev => ({ ...prev, branch: 'master' }));
        } else if (branchNames.includes('main')) {
          setFormData(prev => ({ ...prev, branch: 'main' }));
        } else if (branchNames.length > 0) {
          setFormData(prev => ({ ...prev, branch: branchNames[0] }));
        }
      } else {
        console.error('Error response fetching branches:', response.status, await response.text());
        setAvailableBranches([]);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
      setAvailableBranches([]);
    } finally {
      setIsLoadingBranches(false);
    }
  };

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Breadcrumbs />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">Gestión de Contextos</h1>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button 
              onClick={() => {
                setShowRepositories(true);
                fetchRepositories();
              }}
              className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span className="hidden sm:inline">Mis Repositorios</span>
              <span className="sm:hidden">Repositorios</span>
            </button>
            <button 
              onClick={() => setShowForm(true)}
              className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm sm:text-base"
            >
              Nuevo Contexto
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 p-3 sm:p-4 lg:p-6 rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-blue-900">Total</h3>
              <div className="p-1.5 sm:p-2 bg-blue-500 rounded-lg">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14-7l2 2-2 2m-14 4l-2-2 2-2" />
                </svg>
              </div>
            </div>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-700 mb-1">{isLoadingContexts ? '...' : contexts.length}</p>
            <p className="text-xs sm:text-sm text-blue-600 font-medium">Contextos creados</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 p-3 sm:p-4 lg:p-6 rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-green-900">Activos</h3>
              <div className="p-1.5 sm:p-2 bg-green-500 rounded-lg">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-700 mb-1">{isLoadingContexts ? '...' : contexts.filter(c => c.isActive).length}</p>
            <p className="text-xs sm:text-sm text-green-600 font-medium">Contextos activos</p>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 p-3 sm:p-4 lg:p-6 rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-yellow-900">En análisis</h3>
              <div className="p-1.5 sm:p-2 bg-yellow-500 rounded-lg">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-yellow-700 mb-1">0</p>
            <p className="text-xs sm:text-sm text-yellow-600 font-medium">Siendo analizados</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 p-3 sm:p-4 lg:p-6 rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-purple-900">Completados</h3>
              <div className="p-1.5 sm:p-2 bg-purple-500 rounded-lg">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-700 mb-1">0</p>
            <p className="text-xs sm:text-sm text-purple-600 font-medium">Análisis terminados</p>
          </div>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-md ${message.includes('Error') ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
            {message}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Mis Contextos</h2>
            <p className="text-sm sm:text-base text-gray-600">Repositorios configurados para análisis de código</p>
          </div>
          
          <div className="p-4 sm:p-6">
            {isLoadingContexts ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-4">⏳</div>
                <p>Cargando contextos...</p>
              </div>
            ) : contexts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">📁</div>
                <h3 className="text-lg font-medium mb-2">No tienes contextos creados</h3>
                <p className="text-sm mb-6">Crea tu primer contexto para comenzar a analizar repositorios.</p>
                
                <div className="max-w-md mx-auto text-left bg-gray-50 p-6 rounded-lg">
                  <h4 className="font-semibold mb-3 text-gray-800">Un contexto incluye:</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
                      URL del repositorio de GitHub
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
                      Configuración de análisis
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
                      Webhooks automáticos
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
                      Métricas de calidad de código
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {contexts.map((context) => (
                  <div key={context.id} className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900">{context.nombre}</h3>
                          <span className={`self-start px-2 py-1 text-xs font-medium rounded-full ${
                            context.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {context.isActive ? 'Activo' : 'Inactivo'}
                          </span>
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
                            <span className="truncate max-w-[200px] sm:max-w-none">{context.repoUrl.replace('https://github.com/', '')}</span>
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
                        <button
                          onClick={() => startBackgroundAnalysis(context.id)}
                          className="flex-1 sm:flex-none px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded-md transition-colors text-center touch-manipulation"
                        >
                          Analizar
                        </button>
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === context.id ? null : context.id)}
                            className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors touch-manipulation"
                          >
                            •••
                          </button>
                          
                          {openMenuId === context.id && (
                            <div className="absolute right-0 top-full mt-1 w-52 sm:w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                              <div className="py-1">
                                <button
                                  onClick={() => handleEditContext(context)}
                                  className="w-full px-4 py-3 sm:py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 sm:gap-2 touch-manipulation"
                                >
                                  <svg className="w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  Editar Contexto
                                </button>
                                
                                <button
                                  onClick={() => handleToggleActive(context)}
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
                                
                                <div className="border-t border-gray-100 my-1"></div>
                                
                                <button
                                  onClick={() => handleDeleteContext(context)}
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
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Analysis Jobs Status - Temporarily disabled */}
        {false && analysisJobs.length > 0 && (
          <div className="bg-white rounded-lg shadow-md mt-6 sm:mt-8">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Análisis en Progreso</h2>
              <p className="text-sm sm:text-base text-gray-600">Estado de los análisis en segundo plano</p>
            </div>
            
            <div className="p-4 sm:p-6">
              <div className="space-y-3">
                {analysisJobs.slice(0, 5).map((job) => {
                  const getStatusColor = (status: string) => {
                    switch (status) {
                      case 'pending': return 'bg-yellow-100 text-yellow-800';
                      case 'processing': return 'bg-blue-100 text-blue-800';
                      case 'completed': return 'bg-green-100 text-green-800';
                      case 'failed': return 'bg-red-100 text-red-800';
                      default: return 'bg-gray-100 text-gray-800';
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
                    <div key={job.id} className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-sm transition-shadow">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                            <h4 className="text-base font-semibold text-gray-900">{job.contextName}</h4>
                            <span className={`self-start px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(job.status)}`}>
                              {getStatusText(job.status)}
                            </span>
                            {(job.status === 'pending' || job.status === 'processing') && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                En progreso...
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-gray-500">
                            <a 
                              href={job.repoUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 hover:text-blue-600 transition-colors w-fit"
                            >
                              <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                              </svg>
                              <span className="truncate max-w-[200px] sm:max-w-none">{job.repoUrl?.replace('https://github.com/', '')}</span>
                            </a>
                            <span className="hidden sm:inline">•</span>
                            <span>Iniciado {new Date(job.createdAt).toLocaleString('es-ES')}</span>
                            {job.completedAt && (
                              <>
                                <span className="hidden sm:inline">•</span>
                                <span>Completado {new Date(job.completedAt).toLocaleString('es-ES')}</span>
                              </>
                            )}
                          </div>
                          {job.error && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                              Error: {job.error}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 mt-3 sm:mt-0 sm:ml-4">
                          <Link
                            href={`/jobs/${job.id}`}
                            className="px-3 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded-md transition-colors touch-manipulation"
                          >
                            Ver detalles
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {analysisJobs.length > 5 && (
                  <div className="text-center pt-3">
                    <p className="text-sm text-gray-500">
                      y {analysisJobs.length - 5} trabajos más...
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal del formulario */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-start sm:items-center justify-center p-2 sm:p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-lg sm:rounded-2xl max-w-lg w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl transform transition-all mt-2 sm:mt-0">
              <div className={`bg-gradient-to-r p-4 sm:p-6 rounded-t-lg sm:rounded-t-2xl ${
                editingContext ? 'from-blue-500 to-blue-600' : isCreatingFromRepo 
                  ? 'from-green-500 to-green-600' 
                  : 'from-blue-500 to-blue-600'
              }`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                    <div className="p-1.5 sm:p-2 bg-white bg-opacity-20 rounded-lg flex-shrink-0">
                      {editingContext ? (
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      ) : isCreatingFromRepo ? (
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.30.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white truncate">
                        {editingContext ? 'Editar Contexto' : isCreatingFromRepo ? 'Crear Contexto desde Repositorio' : 'Nuevo Contexto'}
                      </h3>
                      <p className={`text-xs sm:text-sm ${editingContext ? 'text-blue-100' : isCreatingFromRepo ? 'text-green-100' : 'text-blue-100'} truncate`}>
                        {editingContext
                          ? `Modificar configuración de ${editingContext.nombre}`
                          : isCreatingFromRepo 
                            ? `${selectedRepo?.full_name || 'repositorio seleccionado'}` 
                            : 'Agrega un repositorio para análisis'
                        }
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setIsCreatingFromRepo(false);
                      setSelectedRepo(null);
                      setAvailableBranches([]);
                      setFormData({ nombre: '', descripcion: '', repoUrl: '', branch: 'main', tags: '' });
                    }}
                    className="text-white hover:text-opacity-80 p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-4 sm:p-6">

                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  <div className="space-y-1">
                    <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                      <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      Nombre del contexto *
                    </label>
                    <input
                      type="text"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white touch-manipulation"
                      placeholder="Mi proyecto increíble"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                      <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Descripción *
                    </label>
                    <textarea
                      name="descripcion"
                      value={formData.descripcion}
                      onChange={handleInputChange}
                      rows={3}
                      required
                      minLength={10}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white resize-none touch-manipulation"
                      placeholder="Descripción detallada del proyecto y objetivos del análisis..."
                    />
                    <p className="text-xs text-gray-500 mt-1">Mínimo 10 caracteres</p>
                  </div>

                  <div className="space-y-1">
                    <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                      <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      URL del repositorio *
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        name="repoUrl"
                        value={formData.repoUrl}
                        onChange={handleInputChange}
                        required
                        readOnly={isCreatingFromRepo}
                        className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 pl-10 sm:pl-12 text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all touch-manipulation ${
                          isCreatingFromRepo 
                            ? 'bg-gray-100 cursor-not-allowed' 
                            : 'bg-gray-50 hover:bg-white'
                        }`}
                        placeholder="https://github.com/usuario/repositorio"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {isCreatingFromRepo 
                        ? 'Repositorio seleccionado automáticamente'
                        : 'Solo repositorios públicos de GitHub'
                      }
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                      <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                      </svg>
                      Rama *
                    </label>
                    {availableBranches.length > 0 ? (
                      <select
                        name="branch"
                        value={formData.branch}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white touch-manipulation"
                      >
                        {availableBranches.map((branch) => (
                          <option key={branch} value={branch}>
                            {branch}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="relative">
                        <input
                          type="text"
                          name="branch"
                          value={formData.branch}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white touch-manipulation"
                          placeholder="main"
                        />
                        {isLoadingBranches && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <svg className="animate-spin w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          </div>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {isLoadingBranches 
                        ? 'Cargando ramas...'
                        : availableBranches.length > 0 
                          ? `${availableBranches.length} ramas disponibles`
                          : isCreatingFromRepo
                            ? 'Ramas cargadas automáticamente'
                            : 'Ingresa la URL del repositorio para cargar las ramas'
                      }
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                      <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      Tags (opcional)
                    </label>
                    <input
                      type="text"
                      name="tags"
                      value={formData.tags}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white touch-manipulation"
                      placeholder="javascript, frontend, react"
                    />
                    <p className="text-xs text-gray-500 mt-1">Separa las tags con comas</p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setIsCreatingFromRepo(false);
                        setSelectedRepo(null);
                        setAvailableBranches([]);
                        setEditingContext(null);
                        setFormData({ nombre: '', descripcion: '', repoUrl: '', branch: 'main', tags: '' });
                      }}
                      className="flex-1 px-4 sm:px-6 py-3 border-2 border-gray-200 text-gray-600 font-semibold rounded-lg sm:rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all transform hover:scale-105 touch-manipulation"
                    >
                      <span className="flex items-center justify-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Cancelar
                      </span>
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg sm:rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all transform hover:scale-105 shadow-lg touch-manipulation"
                    >
                      <span className="flex items-center justify-center">
                        {isLoading ? (
                          <>
                            <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Creando...
                          </>
                        ) : (
                          <>
                            {editingContext ? (
                              <>
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Actualizar Contexto
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Crear Contexto
                              </>
                            )}
                          </>
                        )}
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal de repositorios de GitHub */}
        {showRepositories && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-start sm:items-center justify-center p-2 sm:p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-lg sm:rounded-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden shadow-2xl transform transition-all mt-2 sm:mt-0">
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 sm:p-6 rounded-t-lg sm:rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                    <div className="p-1.5 sm:p-2 bg-white bg-opacity-20 rounded-lg flex-shrink-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white truncate">Mis Repositorios de GitHub</h3>
                      <p className="text-green-100 text-xs sm:text-sm truncate">Selecciona un repositorio para crear un contexto</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowRepositories(false)}
                    className="text-white hover:text-green-100 p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-4 sm:p-6">
                {/* Search bar */}
                <div className="mb-6">
                  <div className="relative">
                    <input
                      type="text"
                      value={repoSearch}
                      onChange={(e) => {
                        setRepoSearch(e.target.value);
                        fetchRepositories(e.target.value);
                      }}
                      placeholder="Buscar repositorios..."
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pl-10 sm:pl-12 text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white touch-manipulation"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Repositories list */}
                <div className="max-h-96 overflow-y-auto">
                  {isLoadingRepos ? (
                    <div className="text-center py-12 text-gray-500">
                      <div className="text-4xl mb-4">⏳</div>
                      <p>Cargando repositorios...</p>
                    </div>
                  ) : repositories.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <div className="text-6xl mb-4">📁</div>
                      <h3 className="text-lg font-medium mb-2">No se encontraron repositorios</h3>
                      <p className="text-sm">Intenta con una búsqueda diferente</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {repositories.map((repo) => {
                        const isAlreadyAdded = contexts.some(ctx => ctx.repoUrl === repo.html_url);
                        
                        return (
                          <div 
                            key={repo.id} 
                            className={`border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-all ${
                              isAlreadyAdded ? 'bg-gray-50 opacity-60' : 'hover:border-green-300 cursor-pointer touch-manipulation'
                            }`}
                            onClick={() => !isAlreadyAdded && handleCreateContextFromRepo(repo)}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                              <div className="flex-1">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                                  <h4 className="text-base sm:text-lg font-semibold text-gray-900">{repo.name}</h4>
                                  {repo.private && (
                                    <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                                      Privado
                                    </span>
                                  )}
                                  {repo.fork && (
                                    <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                                      Fork
                                    </span>
                                  )}
                                  {isAlreadyAdded && (
                                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                      Ya agregado
                                    </span>
                                  )}
                                </div>
                                <p className="text-gray-600 text-sm mb-3">{repo.description || 'Sin descripción'}</p>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  {repo.language && (
                                    <span className="flex items-center gap-1">
                                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                      {repo.language}
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"/>
                                    </svg>
                                    {repo.stargazers_count}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                    </svg>
                                    {repo.forks_count}
                                  </span>
                                  <span>Actualizado {new Date(repo.updated_at).toLocaleDateString('es-ES')}</span>
                                </div>
                                {repo.topics && repo.topics.length > 0 && (
                                  <div className="flex gap-2 mt-3">
                                    {repo.topics.slice(0, 5).map((topic: string, index: number) => (
                                      <span 
                                        key={index}
                                        className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full"
                                      >
                                        {topic}
                                      </span>
                                    ))}
                                    {repo.topics.length > 5 && (
                                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                                        +{repo.topics.length - 5} más
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                              {!isAlreadyAdded && (
                                <div className="mt-3 sm:mt-0 sm:ml-4">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCreateContextFromRepo(repo);
                                    }}
                                    className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors touch-manipulation"
                                  >
                                    Crear Contexto
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete confirmation modal */}
        {showDeleteModal && contextToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-start sm:items-center justify-center p-2 sm:p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-lg sm:rounded-2xl max-w-md w-full shadow-2xl transform transition-all mt-2 sm:mt-0">
              <div className="p-4 sm:p-6">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Eliminar Contexto
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Esta acción no se puede deshacer
                    </p>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-gray-900 mb-1">{contextToDelete.nombre}</h4>
                  <p className="text-sm text-gray-600 mb-2">{contextToDelete.descripcion}</p>
                  <p className="text-xs text-gray-500">{contextToDelete.repoUrl}</p>
                </div>

                <p className="text-sm text-gray-600 mb-6">
                  ¿Estás seguro de que quieres eliminar este contexto? Se perderán todos los datos de análisis asociados.
                </p>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setContextToDelete(null);
                    }}
                    className="flex-1 px-4 py-2.5 sm:py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors touch-manipulation"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-2.5 sm:py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
                  >
                    {isDeleting ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Eliminando...
                      </span>
                    ) : (
                      'Eliminar'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  );
}