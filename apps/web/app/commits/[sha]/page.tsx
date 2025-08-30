'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect, useParams } from 'next/navigation';
import Header from '@/components/header';
import Breadcrumbs from '@/components/breadcrumbs';

interface CommitFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
  raw_url: string;
  blob_url: string;
}

interface CommitDetail {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    avatar_url?: string;
  };
  date: string;
  stats: {
    total: number;
    additions: number;
    deletions: number;
  };
  files: CommitFile[];
  parents: string[];
  html_url: string;
}

const DiffViewer = ({ patch, filename }: { patch: string; filename: string }) => {
  if (!patch) {
    return (
      <div className="text-gray-500 text-center py-8">
        No hay diferencias disponibles para mostrar
      </div>
    );
  }

  const lines = patch.split('\n');
  const getLineType = (line: string) => {
    if (line.startsWith('+')) return 'addition';
    if (line.startsWith('-')) return 'deletion';
    if (line.startsWith('@@')) return 'hunk';
    return 'normal';
  };

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-gray-100 px-4 py-2 border-b">
        <h4 className="font-mono text-sm font-medium">{filename}</h4>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono">
          <tbody>
            {lines.map((line, index) => {
              const type = getLineType(line);
              const bgColor = 
                type === 'addition' ? 'bg-green-50' :
                type === 'deletion' ? 'bg-red-50' :
                type === 'hunk' ? 'bg-blue-50' :
                'bg-white';
              const textColor = 
                type === 'addition' ? 'text-green-700' :
                type === 'deletion' ? 'text-red-700' :
                type === 'hunk' ? 'text-blue-700' :
                'text-gray-700';

              return (
                <tr key={index} className={bgColor}>
                  <td className="px-2 py-1 text-gray-400 border-r border-gray-200 w-12 text-right select-none">
                    {type !== 'hunk' ? index + 1 : ''}
                  </td>
                  <td className={`px-3 py-1 whitespace-pre ${textColor}`}>
                    {line}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default function CommitDetailPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const sha = params.sha as string;
  
  const [commit, setCommit] = useState<CommitDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchCommitDetails = async () => {
      if (!session?.accessToken || !sha) return;

      try {
        setIsLoading(true);
        setError(null);

        // Get repo URL from URL search params
        const urlParams = new URLSearchParams(window.location.search);
        const repoUrl = urlParams.get('repoUrl');
        
        if (!repoUrl) {
          setError('URL del repositorio no encontrada');
          return;
        }

        const response = await fetch(`/api/commits/${sha}?repoUrl=${encodeURIComponent(repoUrl)}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Error al obtener detalles del commit');
        }

        setCommit(data.commit);
      } catch (error) {
        console.error('Error fetching commit details:', error);
        setError(error instanceof Error ? error.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCommitDetails();
  }, [session, sha]);

  const toggleFileExpansion = (filename: string) => {
    const newExpanded = new Set(expandedFiles);
    if (newExpanded.has(filename)) {
      newExpanded.delete(filename);
    } else {
      newExpanded.add(filename);
    }
    setExpandedFiles(newExpanded);
  };

  if (status === 'loading') return <div>Cargando...</div>;
  if (!session) {
    redirect('/');
    return null;
  }

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <Breadcrumbs />
            <div className="text-center py-12">
              <div className="text-4xl mb-4">⏳</div>
              <p>Cargando detalles del commit...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <Breadcrumbs />
            <div className="bg-red-100 border border-red-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!commit) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <Breadcrumbs />
            <div className="text-center py-12">
              <div className="text-6xl mb-4">❌</div>
              <p>Commit no encontrado</p>
            </div>
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
          
          {/* Commit Header */}
          <div className="bg-white rounded-lg shadow-md mb-6">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{commit.message}</h1>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                        {commit.author.avatar_url ? (
                          <img 
                            src={commit.author.avatar_url} 
                            alt={commit.author.name}
                            className="w-6 h-6 rounded-full"
                          />
                        ) : (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                          </svg>
                        )}
                      </div>
                      {commit.author.name}
                    </span>
                    <span>•</span>
                    <span className="font-mono">{commit.sha.substring(0, 7)}</span>
                    <span>•</span>
                    <span>{new Date(commit.date).toLocaleString('es-ES')}</span>
                  </div>
                </div>
                <div className="ml-4">
                  <a 
                    href={commit.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    Ver en GitHub
                  </a>
                </div>
              </div>
              
              {/* Stats */}
              <div className="flex items-center gap-6 text-sm">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-green-600 font-medium">+{commit.stats.additions}</span>
                  <span className="text-gray-500">adiciones</span>
                </span>
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-red-600 font-medium">-{commit.stats.deletions}</span>
                  <span className="text-gray-500">eliminaciones</span>
                </span>
                <span className="text-gray-600">
                  {commit.files.length} archivo{commit.files.length !== 1 ? 's' : ''} modificado{commit.files.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Files Changed */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Archivos Modificados</h2>
              <p className="text-gray-600">Haz clic en cualquier archivo para ver las diferencias</p>
            </div>
            
            <div className="divide-y divide-gray-200">
              {commit.files.map((file, index) => {
                const isExpanded = expandedFiles.has(file.filename);
                const statusColor = 
                  file.status === 'added' ? 'text-green-600' :
                  file.status === 'removed' ? 'text-red-600' :
                  'text-blue-600';
                
                const statusIcon = 
                  file.status === 'added' ? '+' :
                  file.status === 'removed' ? '-' :
                  'M';

                return (
                  <div key={index} className="p-4">
                    <button
                      onClick={() => toggleFileExpansion(file.filename)}
                      className="w-full flex items-center justify-between text-left hover:bg-gray-50 rounded-md p-2 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 flex items-center justify-center rounded text-sm font-mono ${statusColor} bg-gray-100`}>
                          {statusIcon}
                        </span>
                        <span className="font-mono text-sm">{file.filename}</span>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          {file.additions > 0 && (
                            <span className="text-green-600">+{file.additions}</span>
                          )}
                          {file.deletions > 0 && (
                            <span className="text-red-600">-{file.deletions}</span>
                          )}
                        </div>
                      </div>
                      <svg 
                        className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {isExpanded && (
                      <div className="mt-4 ml-8">
                        <DiffViewer patch={file.patch || ''} filename={file.filename} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}