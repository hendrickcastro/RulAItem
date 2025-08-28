'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/store/ui-store';
import { useKeyboardShortcut } from '@/lib/hooks';

export function GlobalKeyboardShortcuts() {
  const router = useRouter();
  const { 
    toggleSidebar, 
    openModal, 
    closeModal, 
    setSearchQuery,
    currentContextoId 
  } = useUIStore();

  // Toggle sidebar with Ctrl/Cmd + B
  useKeyboardShortcut(['b'], toggleSidebar, { ctrlKey: true });
  useKeyboardShortcut(['b'], toggleSidebar, { metaKey: true });

  // Open search modal with Ctrl/Cmd + K
  useKeyboardShortcut(['k'], () => openModal('search'), { ctrlKey: true });
  useKeyboardShortcut(['k'], () => openModal('search'), { metaKey: true });

  // Close modals with Escape
  useKeyboardShortcut(['escape'], () => {
    closeModal('search');
    closeModal('createContexto');
    closeModal('settings');
  });

  // Navigation shortcuts
  useKeyboardShortcut(['1'], () => router.push('/dashboard'), { ctrlKey: true });
  useKeyboardShortcut(['2'], () => router.push('/dashboard/contextos'), { ctrlKey: true });
  useKeyboardShortcut(['3'], () => router.push('/dashboard/commits'), { ctrlKey: true });
  useKeyboardShortcut(['4'], () => router.push('/dashboard/analysis'), { ctrlKey: true });
  useKeyboardShortcut(['5'], () => router.push('/dashboard/jobs'), { ctrlKey: true });

  // Create new context with Ctrl/Cmd + N
  useKeyboardShortcut(['n'], () => openModal('createContexto'), { ctrlKey: true });
  useKeyboardShortcut(['n'], () => openModal('createContexto'), { metaKey: true });

  // Go to current context with Ctrl/Cmd + Enter
  useKeyboardShortcut(['enter'], () => {
    if (currentContextoId) {
      router.push(`/dashboard/contextos/${currentContextoId}`);
    }
  }, { ctrlKey: true });

  // Settings with Ctrl/Cmd + ,
  useKeyboardShortcut([','], () => openModal('settings'), { ctrlKey: true });
  useKeyboardShortcut([','], () => openModal('settings'), { metaKey: true });

  // Clear search with Ctrl/Cmd + Shift + K
  useKeyboardShortcut(['k'], () => setSearchQuery(''), { ctrlKey: true, shiftKey: true });
  useKeyboardShortcut(['k'], () => setSearchQuery(''), { metaKey: true, shiftKey: true });

  // Help modal with ?
  useKeyboardShortcut(['?'], () => openModal('help'));

  return null;
}