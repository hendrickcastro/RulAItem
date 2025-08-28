'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

export default function DashboardPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') return <div>Cargando...</div>;
  if (!session) {
    redirect('/');
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Bienvenido, {session.user.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 border rounded-lg">
              <h3 className="font-medium text-gray-700">Contextos</h3>
              <p className="text-2xl font-bold text-blue-600">0</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <h3 className="font-medium text-gray-700">Commits</h3>
              <p className="text-2xl font-bold text-green-600">0</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <h3 className="font-medium text-gray-700">Análisis</h3>
              <p className="text-2xl font-bold text-purple-600">0</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Acciones Rápidas</h3>
            <div className="space-y-3">
              <a 
                href="/contextos" 
                className="block w-full text-left px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                📁 Crear nuevo contexto
              </a>
              <a 
                href="/analysis" 
                className="block w-full text-left px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                🔍 Ver análisis recientes
              </a>
              <a 
                href="/commits" 
                className="block w-full text-left px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                📊 Historial de commits
              </a>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Actividad Reciente</h3>
            <div className="text-gray-500 text-center py-8">
              No hay actividad reciente
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}