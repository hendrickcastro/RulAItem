'use client';

import { useState, useEffect } from 'react';
import { simpleFirebaseMonitor } from '@/lib/simple-firebase-monitor';
import type { DailyStats } from '@/lib/firebase-daily-tracker';

export function DebugButton() {
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);

  useEffect(() => {
    setMounted(true);
    
    // Load initial daily stats
    const loadStats = () => {
      const stats = simpleFirebaseMonitor.getDailyStats();
      setDailyStats(stats);
    };
    
    loadStats();
    
    // Update stats every 30 seconds
    const interval = setInterval(loadStats, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Only show in development and after mounting
  if (!mounted) return null;
  if (typeof window === 'undefined') return null;
  
  // Check both NODE_ENV and development indicators
  const isDevelopment = process.env.NODE_ENV === 'development' || 
                       process.env.NEXT_PUBLIC_NODE_ENV === 'development' || 
                       window.location.hostname === 'localhost';
  
  if (!isDevelopment) return null;

  const buttonStyle = {
    position: 'fixed' as const,
    bottom: '20px',
    right: '20px',
    zIndex: 9999,
    padding: '12px 20px',
    backgroundColor: '#3B82F6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    transition: 'all 0.2s',
  };

  const panelStyle = {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9998,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: isVisible ? 'flex' : 'none',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  };

  const contentStyle = {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    maxWidth: '600px',
    width: '100%',
    maxHeight: '80vh',
    overflow: 'auto',
    boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
  };

  // Use real daily stats
  const todayUsage = dailyStats?.today || { reads: 0, writes: 0, errors: 0, deletes: 0, date: '', lastUpdated: 0 };
  const monthlyTotal = dailyStats?.totalThisMonth || { reads: 0, writes: 0, errors: 0, deletes: 0 };
  
  // Get current session stats for display
  const sessionStats = simpleFirebaseMonitor.getStats();
  
  const stats = {
    todayReads: todayUsage.reads,
    todayWrites: todayUsage.writes,
    todayErrors: todayUsage.errors,
    monthlyReads: monthlyTotal.reads,
    sessionCalls: sessionStats.totalCalls
  };

  return (
    <>
      <button
        style={buttonStyle}
        onClick={() => setIsVisible(!isVisible)}
        onMouseOver={(e) => {
          (e.target as HTMLButtonElement).style.backgroundColor = '#2563EB';
        }}
        onMouseOut={(e) => {
          (e.target as HTMLButtonElement).style.backgroundColor = '#3B82F6';
        }}
      >
        🔧 Firebase Monitor ({stats.todayReads} today)
      </button>

      <div style={panelStyle} onClick={() => setIsVisible(false)}>
        <div style={contentStyle} onClick={(e) => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '2px solid #E5E7EB' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1F2937', margin: 0 }}>
              🔧 Firebase Development Monitor
            </h2>
            <button 
              onClick={() => setIsVisible(false)}
              style={{ 
                background: 'none', 
                border: 'none', 
                fontSize: '24px', 
                cursor: 'pointer',
                color: '#6B7280',
                padding: '4px'
              }}
            >
              ✕
            </button>
          </div>

          {/* Daily Usage Stats */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1F2937', marginBottom: '16px' }}>
              📊 Uso Diario de Firebase
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
              <div style={{ 
                backgroundColor: '#DBEAFE', 
                padding: '12px', 
                borderRadius: '6px', 
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1D4ED8' }}>
                  {stats.todayReads.toLocaleString()}
                </div>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>Reads Hoy</div>
                {stats.todayReads > 45000 && (
                  <div style={{ fontSize: '10px', color: '#DC2626', marginTop: '4px' }}>
                    ⚠️ Cerca del límite diario!
                  </div>
                )}
              </div>

              <div style={{ 
                backgroundColor: '#DCFCE7', 
                padding: '12px', 
                borderRadius: '6px', 
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#16A34A' }}>
                  {stats.todayWrites.toLocaleString()}
                </div>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>Writes Hoy</div>
              </div>

              <div style={{ 
                backgroundColor: '#FEF3C7', 
                padding: '12px', 
                borderRadius: '6px', 
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#D97706' }}>
                  {stats.monthlyReads.toLocaleString()}
                </div>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>Reads Este Mes</div>
              </div>

              <div style={{ 
                backgroundColor: '#FEE2E2', 
                padding: '12px', 
                borderRadius: '6px', 
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#DC2626' }}>
                  {stats.todayErrors}
                </div>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>Errors Hoy</div>
              </div>
            </div>
            
            {/* Progress bar for daily limit */}
            <div style={{ marginTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>
                <span>Progreso diario de reads</span>
                <span>{Math.round((stats.todayReads / 50000) * 100)}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#E5E7EB', borderRadius: '4px', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    width: `${Math.min((stats.todayReads / 50000) * 100, 100)}%`, 
                    height: '100%', 
                    backgroundColor: stats.todayReads > 45000 ? '#DC2626' : stats.todayReads > 30000 ? '#F59E0B' : '#10B981',
                    transition: 'all 0.3s ease'
                  }}
                />
              </div>
            </div>
          </div>

          <div style={{ 
            backgroundColor: '#FEF3C7', 
            border: '1px solid #F59E0B',
            borderRadius: '8px', 
            padding: '20px',
            marginBottom: '20px'
          }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              color: '#92400E', 
              margin: '0 0 12px 0' 
            }}>
              🎯 Sistema de Monitoreo Firebase Activo
            </h3>
            <p style={{ color: '#92400E', margin: '0 0 16px 0', lineHeight: '1.5' }}>
              El tab de soporte está funcionando. Los datos mostrados son de ejemplo. 
              Este sistema te ayudará a controlar el uso de Firebase y evitar sobrepasar los límites de lectura.
            </p>
            
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontWeight: '600', color: '#92400E', margin: '0 0 8px 0' }}>
                ✅ Características implementadas:
              </h4>
              <ul style={{ margin: '0', paddingLeft: '20px', color: '#92400E', lineHeight: '1.6' }}>
                <li>Monitoreo de reads/writes en tiempo real</li>
                <li>Alertas cuando te acercas al límite de 50k reads</li>
                <li>Detección de queries lentas (&gt;1 segundo)</li>
                <li>URLs automáticas para crear índices faltantes en Firebase</li>
              </ul>
            </div>

            <div style={{ 
              backgroundColor: 'white',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              padding: '12px'
            }}>
              <h4 style={{ fontWeight: '600', color: '#1F2937', margin: '0 0 8px 0' }}>
                🔗 Ejemplo de error con índice:
              </h4>
              <p style={{ fontSize: '13px', color: '#DC2626', margin: '0 0 8px 0' }}>
                The query requires an index. You can create it here:
              </p>
              <a 
                href="https://console.firebase.google.com/project/agtxia-rulaitem/firestore/indexes"
                target="_blank"
                rel="noopener noreferrer"
                style={{ 
                  color: '#2563EB',
                  textDecoration: 'underline',
                  fontSize: '14px'
                }}
              >
                🔗 Crear índice en Firebase Console
              </a>
            </div>
          </div>

          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '16px',
            borderTop: '1px solid #E5E7EB'
          }}>
            <div style={{ fontSize: '14px', color: '#6B7280' }}>
              💡 Solo visible en development mode
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => {
                  const tracker = simpleFirebaseMonitor.getDailyTracker();
                  tracker.resetToday();
                  setDailyStats(simpleFirebaseMonitor.getDailyStats());
                  console.log('🧹 Estadísticas del día limpiadas');
                }}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#F59E0B',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                🧹 Limpiar Hoy
              </button>
              <button
                onClick={() => {
                  simpleFirebaseMonitor.clearStats();
                  console.log('🧹 Estadísticas de sesión limpiadas');
                }}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#EF4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                🗑️ Limpiar Sesión
              </button>
              <button
                onClick={() => {
                  const tracker = simpleFirebaseMonitor.getDailyTracker();
                  const data = tracker.exportData();
                  navigator.clipboard.writeText(data).then(() => {
                    alert('📊 Datos exportados al portapapeles');
                  }).catch(() => {
                    console.log('Export data:', data);
                  });
                }}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#6366F1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                📤 Exportar
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}