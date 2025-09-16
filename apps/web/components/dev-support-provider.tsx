'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { DebugButton } from './debug-button';

interface DevSupportContextType {
  isVisible: boolean;
  toggle: () => void;
  show: () => void;
  hide: () => void;
}

const DevSupportContext = createContext<DevSupportContextType | undefined>(undefined);

export function useDevSupport() {
  const context = useContext(DevSupportContext);
  if (context === undefined) {
    throw new Error('useDevSupport must be used within a DevSupportProvider');
  }
  return context;
}

interface DevSupportProviderProps {
  children: ReactNode;
}

export function DevSupportProvider({ children }: DevSupportProviderProps) {
  const [isVisible, setIsVisible] = useState(false);

  const toggle = () => setIsVisible(prev => !prev);
  const show = () => setIsVisible(true);
  const hide = () => setIsVisible(false);

  // Initialize demo data in development
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      import('@/lib/firebase-monitor-demo').catch(() => {
        // Ignore import errors - demo is optional
        console.log('Firebase monitor demo not loaded');
      });
    }
  }, []);

  const value: DevSupportContextType = {
    isVisible,
    toggle,
    show,
    hide,
  };

  return (
    <DevSupportContext.Provider value={value}>
      {children}
      <DebugButton />
    </DevSupportContext.Provider>
  );
}